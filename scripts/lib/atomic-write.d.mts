export interface FileTransactionCommit {
  index: number;
  destination: string;
  total: number;
}

export interface FileTransactionSummary {
  changed: number;
  unchanged: number;
}

export interface FileTransactionRecoverySummary {
  recovered: number;
}

export function recoverFileTransactions(
  transactionRoot: string,
): FileTransactionRecoverySummary;

export function writeFileTransaction(
  entries: ReadonlyMap<string, string | Buffer> | ReadonlyArray<readonly [string, string | Buffer]>,
  options?: {
    beforeCommit?: (commit: FileTransactionCommit) => void;
    afterPublish?: (summary: FileTransactionSummary) => void;
    transactionRoot?: string;
  },
): FileTransactionSummary;
