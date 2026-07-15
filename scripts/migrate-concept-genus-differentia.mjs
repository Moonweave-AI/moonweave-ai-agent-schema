import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { writeFileTransaction } from "./lib/atomic-write.mjs";
import { parseCsvLine } from "./lib/csv.mjs";
import { stableJson } from "./lib/stable-json.mjs";
import { createConceptTerminologyPhases } from "./migration/semantic-depth-v3/concept-terminology.mjs";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "ontology", "source");
const PRODUCT_PATH = path.join(SOURCE_ROOT, "agent-ontology.product.json");
const moduleDocuments = new Map();
const pendingWrites = new Map();
const dryRun = process.argv.includes("--dry-run");

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const productBefore = fs.readFileSync(PRODUCT_PATH);

for (const entry of fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = path.join(SOURCE_ROOT, entry.name);
  for (const filename of fs.readdirSync(directory).sort()) {
    if (!filename.endsWith(".json")) continue;
    const filePath = path.join(directory, filename);
    const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (document.source_kind !== "agent-ontology-module") continue;
    moduleDocuments.set(document.module.id, { filePath, document });
  }
}

if (moduleDocuments.size !== 47) {
  throw new Error(`Expected 47 v3 Module sources; found ${moduleDocuments.size}`);
}

const allConcepts = () => new Map(
  [...moduleDocuments.values()].flatMap(({ document }) =>
    document.classes.map((concept) => [concept.id, concept]),
  ),
);
const allRelations = () => new Map(
  [...moduleDocuments.values()].flatMap(({ document }) =>
    document.relations.map((relation) => [relation.id, relation]),
  ),
);
const definitionsBefore = new Map(
  [...allConcepts().values()].map(({ id, definitions, semantic_kind: semanticKind }) => [
    id,
    { definitions: structuredClone(definitions), semanticKind },
  ]),
);
const shortDefinition = (definitions) => ({
  zh: `${definitions.zh.split(/[。！？]/u, 1)[0]}。`,
  en: definitions.en.match(/^.*?[.!?](?=\s|$)/u)?.[0] ?? definitions.en,
  ja: `${definitions.ja.split(/[。！？]/u, 1)[0]}。`,
});
const stageWorkerCapabilityLedgerLabel = () => {
  const ledgerPath = path.join(ROOT, "research", "ontology-concept-semantic-depth-v3-ledger.csv");
  const lines = fs.readFileSync(ledgerPath, "utf8").trimEnd().split(/\r?\n/u);
  const headers = parseCsvLine(lines[0]);
  const conceptIdIndex = headers.indexOf("concept_id");
  const lexicalFamilyIndex = headers.indexOf("lexical_family");
  const proposedLabelIndex = headers.indexOf("proposed_label_zh");
  const rowIndex = lines.findIndex((line, index) =>
    index > 0 && parseCsvLine(line)[conceptIdIndex] === "WorkerCapabilityMatch",
  );
  if ([conceptIdIndex, lexicalFamilyIndex, proposedLabelIndex, rowIndex].some((index) => index < 0)) {
    throw new Error("Cannot locate WorkerCapabilityMatch columns and row in the v3 Concept ledger");
  }
  const cells = parseCsvLine(lines[rowIndex]);
  cells[lexicalFamilyIndex] = "工作者能力匹配证据";
  cells[proposedLabelIndex] = "工作者能力匹配证据";
  lines[rowIndex] = cells.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",");
  stageFile(ledgerPath, `${lines.join("\n")}\n`);
};
const stageFile = (filePath, contents) => {
  pendingWrites.set(path.resolve(filePath), contents);
};

const phases = createConceptTerminologyPhases({
  fs,
  path,
  ROOT,
  moduleDocuments,
  allConcepts,
  allRelations,
  shortDefinition,
  stageFile,
  stableJson,
});
const audit = phases.completeConceptGenusDifferentia();
for (const { filePath, document } of moduleDocuments.values()) {
  stageFile(filePath, stableJson(document));
}
stageWorkerCapabilityLedgerLabel();
if (!dryRun) writeFileTransaction(pendingWrites, { transactionRoot: ROOT });

const productAfter = fs.readFileSync(PRODUCT_PATH);
if (!productBefore.equals(productAfter)) {
  throw new Error("Targeted Concept rewrite changed agent-ontology.product.json bytes");
}

const sampleIds = new Set(["WorkerCapabilityMatch"]);
for (const concept of allConcepts().values()) {
  const before = definitionsBefore.get(concept.id);
  if (
    before &&
    JSON.stringify(before.definitions) !== JSON.stringify(concept.definitions) &&
    ![...sampleIds].some((id) => definitionsBefore.get(id)?.semanticKind === concept.semantic_kind)
  ) {
    sampleIds.add(concept.id);
  }
}
const samples = [...sampleIds].flatMap((id) => {
  const before = definitionsBefore.get(id);
  const after = allConcepts().get(id);
  return before && after
    ? [{ id, semantic_kind: after.semantic_kind, before: before.definitions, after: after.definitions }]
    : [];
});

console.log(stableJson({
  dry_run: dryRun,
  modules: moduleDocuments.size,
  product_sha256_before: sha256(productBefore),
  product_sha256_after: sha256(productAfter),
  audit,
  samples,
}).trim());
