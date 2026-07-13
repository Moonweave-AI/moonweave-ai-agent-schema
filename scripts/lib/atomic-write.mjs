import { randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const TRANSACTION_LOCK = ".moonweave.txn-lock";
const TRANSACTION_JOURNAL = ".moonweave.txn-journal";

const sameContents = (path, contents) =>
  existsSync(path) && readFileSync(path).equals(Buffer.from(contents));

const removeIfPresent = (path) => {
  if (existsSync(path)) rmSync(path, { force: true });
};

const assertNoSymbolicLinkAncestors = (path) => {
  let current = dirname(resolve(path));
  while (true) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error(`Transaction destination traverses a symbolic link or junction: ${current}`);
    }
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
};

const isWithin = (root, path) => {
  const relativePath = relative(resolve(root), resolve(path));
  return (
    relativePath === "" ||
    (!isAbsolute(relativePath) &&
      relativePath !== ".." &&
      !relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`))
  );
};

const commonTransactionRoot = (destinations) => {
  let candidate = dirname(destinations[0]);
  while (!destinations.every((destination) => isWithin(candidate, destination))) {
    const parent = dirname(candidate);
    if (parent === candidate) {
      throw new Error("Transaction destinations do not share a writable filesystem root");
    }
    candidate = parent;
  }
  return candidate;
};

const writeDurableJson = (path, value, exclusive = false) => {
  const bytes = `${JSON.stringify(value)}\n`;
  const descriptor = openSync(path, exclusive ? "wx" : "w", 0o600);
  try {
    writeSync(descriptor, bytes, null, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
};

const readTransactionMetadata = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(
      `Cannot recover ontology file transaction because ${path} is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

const processIsAlive = (pid) => {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
};

const validateRecoveryRecord = (root, transactionId, record) => {
  for (const path of [record.destination, record.stage, record.backup]) {
    if (typeof path !== "string" || !isWithin(root, path)) {
      throw new Error(`Transaction recovery path escapes ${root}: ${String(path)}`);
    }
  }
  if (
    record.stage !== `${record.destination}.txn-stage-${transactionId}` ||
    record.backup !== `${record.destination}.txn-backup-${transactionId}`
  ) {
    throw new Error(`Transaction recovery record for ${record.destination} has invalid sidecars`);
  }
};

const rollbackRecords = (records) => {
  for (const record of [...records].reverse()) {
    if (existsSync(record.backup)) {
      removeIfPresent(record.destination);
      renameSync(record.backup, record.destination);
    } else if (!record.hadOriginal) {
      removeIfPresent(record.destination);
    }
    removeIfPresent(record.stage);
    removeIfPresent(record.backup);
  }
};

const cleanCommittedSidecars = (records) => {
  for (const record of records) {
    removeIfPresent(record.stage);
    removeIfPresent(record.backup);
  }
};

export const recoverFileTransactions = (inputRoot) => {
  const root = resolve(inputRoot);
  assertNoSymbolicLinkAncestors(resolve(root, "recovery-marker"));
  const lockPath = resolve(root, TRANSACTION_LOCK);
  const journalPath = resolve(root, TRANSACTION_JOURNAL);
  const hasLock = existsSync(lockPath);
  const hasJournal = existsSync(journalPath);
  if (!hasLock && !hasJournal) return { recovered: 0 };

  if (hasLock && lstatSync(lockPath).isSymbolicLink()) {
    throw new Error(`Transaction lock must not be a symbolic link: ${lockPath}`);
  }
  if (hasJournal && lstatSync(journalPath).isSymbolicLink()) {
    throw new Error(`Transaction journal must not be a symbolic link: ${journalPath}`);
  }
  const lock = hasLock ? readTransactionMetadata(lockPath) : null;
  if (lock && processIsAlive(lock.pid)) {
    throw new Error(`A file transaction is already active under ${root} (pid ${lock.pid})`);
  }
  const journal = hasJournal ? readTransactionMetadata(journalPath) : null;
  const metadata = journal ?? lock;
  if (!metadata || typeof metadata.transactionId !== "string" || !Array.isArray(metadata.records)) {
    throw new Error(`Transaction recovery metadata under ${root} is incomplete`);
  }
  for (const record of metadata.records) {
    validateRecoveryRecord(root, metadata.transactionId, record);
  }

  if (journal) rollbackRecords(metadata.records);
  else cleanCommittedSidecars(metadata.records);
  removeIfPresent(journalPath);
  removeIfPresent(lockPath);
  return { recovered: 1 };
};

export const writeFileTransaction = (
  entries,
  {
    beforeCommit = () => {},
    afterPublish = () => {},
    transactionRoot: inputTransactionRoot,
  } = {},
) => {
  const destinations = new Set();
  const transactionId = `${process.pid}-${randomUUID()}`;
  const records = [...entries].map(([inputPath, contents], index) => {
    const destination = resolve(inputPath);
    assertNoSymbolicLinkAncestors(destination);
    if (existsSync(destination) && lstatSync(destination).isSymbolicLink()) {
      throw new Error(`Transaction destination must not be a symbolic link: ${destination}`);
    }
    if (destinations.has(destination)) {
      throw new Error(`Duplicate transaction destination ${destination}`);
    }
    destinations.add(destination);
    const hadOriginal = existsSync(destination);
    return {
      index,
      destination,
      contents,
      stage: `${destination}.txn-stage-${transactionId}`,
      backup: `${destination}.txn-backup-${transactionId}`,
      changed: !sameContents(destination, contents),
      hadOriginal,
      backupMoved: false,
      published: false,
    };
  });
  const changedRecords = records.filter(({ changed }) => changed);
  if (changedRecords.length === 0) {
    return { changed: 0, unchanged: records.length };
  }

  const transactionRoot = resolve(
    inputTransactionRoot ??
      commonTransactionRoot(changedRecords.map(({ destination }) => destination)),
  );
  if (
    !changedRecords.every(({ destination }) => isWithin(transactionRoot, destination))
  ) {
    throw new Error(`Every transaction destination must stay within ${transactionRoot}`);
  }
  mkdirSync(transactionRoot, { recursive: true });
  recoverFileTransactions(transactionRoot);
  const lockPath = resolve(transactionRoot, TRANSACTION_LOCK);
  const journalPath = resolve(transactionRoot, TRANSACTION_JOURNAL);
  const recoveryRecords = changedRecords.map(
    ({ destination, stage, backup, hadOriginal }) => ({
      destination,
      stage,
      backup,
      hadOriginal,
    }),
  );
  const recoveryMetadata = {
    transactionId,
    pid: process.pid,
    records: recoveryRecords,
  };

  try {
    writeDurableJson(lockPath, recoveryMetadata, true);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(`A file transaction is already active under ${transactionRoot}`);
    }
    throw error;
  }
  try {
    writeDurableJson(journalPath, recoveryMetadata, true);
    for (const record of changedRecords) {
      mkdirSync(dirname(record.destination), { recursive: true });
      writeFileSync(record.stage, record.contents);
    }
    for (const [commitIndex, record] of changedRecords.entries()) {
      beforeCommit({
        index: commitIndex,
        destination: record.destination,
        total: changedRecords.length,
      });
      if (existsSync(record.destination)) {
        renameSync(record.destination, record.backup);
        record.backupMoved = true;
      }
      renameSync(record.stage, record.destination);
      record.published = true;
    }
    afterPublish({
      changed: changedRecords.length,
      unchanged: records.length - changedRecords.length,
    });
    removeIfPresent(journalPath);
  } catch (error) {
    const rollbackErrors = [];
    try {
      rollbackRecords(changedRecords);
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }
    try {
      removeIfPresent(journalPath);
      removeIfPresent(lockPath);
    } catch (cleanupError) {
      rollbackErrors.push(cleanupError);
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "File transaction failed and rollback was incomplete",
      );
    }
    throw error;
  }

  cleanCommittedSidecars(changedRecords);
  removeIfPresent(lockPath);
  return {
    changed: changedRecords.length,
    unchanged: records.length - changedRecords.length,
  };
};
