import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ONTOLOGY_V3_MODULE_BOUNDARIES,
  validateOntologyV3ModuleBoundaries,
} from "../scripts/data/ontology-v3-module-boundaries.mjs";
import {
  ONTOLOGY_V3_INTERACTION_CONTRACTS,
  validateOntologyV3InteractionContracts,
} from "../scripts/data/ontology-v3-interaction-contracts.mjs";
import {
  ONTOLOGY_V3_OVERLAP_CANDIDATES,
  validateOntologyV3OverlapCandidates,
} from "../scripts/data/ontology-v3-overlap-candidates.mjs";
import { parseCsv } from "../scripts/lib/csv.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

type Language = "zh" | "en" | "ja";
type LocalizedText = Partial<Record<Language, string>>;
type JsonRecord = Record<string, unknown>;

interface CompetencyQuestion extends JsonRecord {
  id: string;
  semantic_key?: unknown;
  primary_owner_module_id?: unknown;
  related_module_ids?: unknown;
}

interface OntologyModule extends JsonRecord {
  id: string;
  labels: LocalizedText;
  purpose?: LocalizedText;
  owns_when?: LocalizedText;
  includes?: LocalizedText[];
  excludes?: LocalizedText[];
  competency_questions?: CompetencyQuestion[];
  key_notion?: unknown;
  boundary_decisions?: unknown;
  overlap_checks?: unknown;
  status: string;
  review?: {
    review_status: string;
    reviewers: Array<{
      reviewer_id: string;
      reviewer_role: string;
      decision_note: LocalizedText;
    }>;
  };
}

interface EvidenceClaim extends JsonRecord {
  source_id: string;
  supports: string;
}

interface Concept extends JsonRecord {
  id: string;
  module_id: string;
  labels: LocalizedText;
  status: string;
}

interface CandidateOntology {
  artifact_metadata: {
    generated_from: string[];
    source_tree_sha256: string;
  };
  modules: OntologyModule[];
  classes: Concept[];
  relations: Array<JsonRecord & { id: string; status: string }>;
}

interface SourceEntry {
  bytes: Buffer;
  path: string;
  repositoryPath: string;
  sourceFingerprintPath: string;
}

const repositoryRoot = process.cwd();
const sourceRoot = resolve(repositoryRoot, "ontology/source");
const boundaryLedgerPath = resolve(
  repositoryRoot,
  "research/ontology-module-boundary-v3.csv",
);
const semanticLedgerPath = resolve(
  repositoryRoot,
  "research/ontology-concept-semantic-depth-v3-ledger.csv",
);
const languages = ["zh", "en", "ja"] as const;
const releaseEvidencePaths = [
  "research/ontology-concept-semantic-depth-v3-ledger.csv",
  "research/ontology-module-boundary-v3.csv",
  "research/ontology-module-cq-v3.csv",
  "research/source-registry.csv",
  "research/living-source-metadata.csv",
  "scripts/data/ontology-v2-semantic-baseline.ndjson",
] as const;

const splitModulePreviousOwners = new Map<string, string>([
  ["info-prompts-instructions", "info-messages-instructions"],
  ["orchestration-delegation-handoff", "orchestration-actors-delegation"],
  ["runtime-execution-attempts", "runtime-system"],
  ["feedback-optimization-learning", "feedback-review-optimization"],
  ["safety-disclosure-redaction", "safety-commit-redaction"],
  ["safety-network-control", "safety-sandbox-network"],
]);
const instructionMetadataDescendantIds = [
  "InstructionApplicability",
  "InstructionAuthority",
  "InstructionPriority",
  "InstructionProvenance",
  "InstructionScope",
] as const;

const genericTextPatterns = [
  /本模块在“.*”边界内/u,
  /以 .* 为代表闭包/u,
  /把概念层级、语义关系和节点内信息组织成/u,
  /本模块直接拥有\s*\d+\s*个概念和\s*\d+\s*条\s*source-owned\s*关系/u,
  /兄弟模块拥有的概念，以及与主图并行的/u,
  /Within the .* Module boundary/u,
  /uses .* as a representative closure fact/u,
  /directly owned Concepts and .* source-owned relations/u,
  /Concepts owned by sibling Modules and any schema, instance, or case shadow graph/u,
  /^工程师借助.+判断一项事实是否由.+语义拥有，并沿同一 canonical 图追踪其输入、输出、失败边界与恢复路径。$/u,
  /^.+以.+为关键概念，组织.+及其真实分类、组成、阶段和产出关系。$/u,
  /^.+等具有独立身份、定义和来源的概念家族。$/u,
  /^由.+出发、经审查的分类与结构骨架，以及附着在原节点和关系上的例子、约束和来源。$/u,
  /^.+拥有的核心语义不在此重复定义；跨边界使用只引用 .+ 的 canonical ID 与关系事实。$/u,
  /^Engineers use .+ to decide whether a fact belongs to .+ semantics and to trace its inputs, outputs, failure boundary, and recovery path in the same canonical graph\.$/u,
  /^.+ uses .+ as its key notion and organizes .+ through real specialization, composition, phase, and production relations\.$/u,
  /^Concept families with independent identity, definitions, and provenance, including .+\.$/u,
  /^The reviewed taxonomy and structural backbone rooted at .+, with examples, constraints, and evidence attached to original nodes and relations\.$/u,
  /^Core semantics owned by .+ are not redefined here; cross-boundary use references canonical IDs and relation facts owned by .+\.$/u,
] as const;

const normalizePath = (value: string): string => value.replaceAll("\\", "/");

const readCandidate = (): CandidateOntology =>
  JSON.parse(readFileSync(ontologyArtifactPath(), "utf8")) as CandidateOntology;

const listFiles = (root: string): string[] =>
  readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(root, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    })
    .sort((left, right) => left.localeCompare(right));

const sourceEntries = (): SourceEntry[] =>
  listFiles(sourceRoot)
    .filter((path) => path.endsWith(".json"))
    .map((path) => {
      const relativeSourcePath = normalizePath(relative(sourceRoot, path));
      const repositoryPath = `ontology/source/${relativeSourcePath}`;
      return {
        path,
        bytes: readFileSync(path),
        sourceFingerprintPath: repositoryPath,
        repositoryPath,
      };
    });

const evidenceEntries = (): SourceEntry[] =>
  releaseEvidencePaths
    .filter((repositoryPath) => existsSync(resolve(repositoryRoot, repositoryPath)))
    .map((repositoryPath) => ({
      path: resolve(repositoryRoot, repositoryPath),
      bytes: readFileSync(resolve(repositoryRoot, repositoryPath)),
      sourceFingerprintPath: repositoryPath,
      repositoryPath,
    }));

const missingEvidencePaths = (): string[] =>
  releaseEvidencePaths.filter(
    (repositoryPath) => !existsSync(resolve(repositoryRoot, repositoryPath)),
  );

const fingerprint = (
  entries: readonly (readonly [path: string, bytes: Buffer])[],
): string => {
  const hash = createHash("sha256");
  for (const [path, bytes] of [...entries].sort(([left], [right]) =>
    Buffer.compare(
      Buffer.from(normalizePath(left), "utf8"),
      Buffer.from(normalizePath(right), "utf8"),
    ),
  )) {
    hash.update(normalizePath(path));
    hash.update("\u0000");
    hash.update(String(bytes.byteLength), "ascii");
    hash.update("\u0000");
    hash.update(bytes);
  }
  return hash.digest("hex");
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCompleteLocalizedText = (value: unknown): value is LocalizedText =>
  isRecord(value) &&
  languages.every(
    (language) =>
      typeof value[language] === "string" &&
      (value[language] as string).trim().length > 0,
  );

const evidenceClaims = (value: unknown): EvidenceClaim[] =>
  Array.isArray(value)
    ? value.filter(
        (claim): claim is EvidenceClaim =>
          isRecord(claim) &&
          typeof claim.source_id === "string" &&
          typeof claim.supports === "string",
      )
    : [];

const normalized = (value: string): string =>
  value.normalize("NFKC").trim().toLocaleLowerCase();

const localizedEntries = (
  ownerId: string,
  fieldName: string,
  value: LocalizedText | LocalizedText[] | undefined,
): Array<{ ownerId: string; path: string; text: string }> => {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values.flatMap((item, index) =>
    languages.flatMap((language) => {
      const text = item[language];
      return typeof text === "string"
        ? [{
            ownerId,
            path: `${fieldName}${Array.isArray(value) ? `[${index}]` : ""}.${language}`,
            text,
          }]
        : [];
    }),
  );
};

const duplicateValues = (values: readonly string[]): string[] => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
};

describe("ontology Module owner and evidence release gates", () => {
  it("rewrites split-module evidence for the current owner and every reviewed peer", () => {
    const ontology = readCandidate();
    const moduleById = new Map(ontology.modules.map((module) => [module.id, module]));
    const violations: string[] = [];

    for (const [moduleId, previousOwnerId] of splitModulePreviousOwners) {
      const module = moduleById.get(moduleId);
      if (!module) {
        violations.push(`${moduleId}:missing-module`);
        continue;
      }
      const keyNotion = isCompleteLocalizedText(module.key_notion)
        ? module.key_notion.en ?? ""
        : "";
      const ownsWhen = isCompleteLocalizedText(module.owns_when)
        ? module.owns_when.en ?? ""
        : "";
      for (const claim of evidenceClaims(module.source_claims)) {
        const text = claim.supports;
        if (!text.includes(moduleId) || !text.includes(keyNotion) || !text.includes(ownsWhen)) {
          violations.push(`${moduleId}:direct:${claim.source_id}:missing-current-boundary`);
        }
        if (
          text.includes(previousOwnerId) ||
          !text.includes("operational notions") ||
          !text.includes("Moonweave design inference") ||
          !text.includes("does not define Moonweave")
        ) {
          violations.push(`${moduleId}:direct:${claim.source_id}:stale-or-unscoped-evidence`);
        }
      }

      const checks = Array.isArray(module.overlap_checks)
        ? module.overlap_checks.filter(isRecord)
        : [];
      const disambiguationByPeer = new Map(
        checks.map((check) => [String(check.other_module_id), check.disambiguation_test]),
      );
      const nested = [
        ...checks.map((record) => ["overlap", record] as const),
        ...(Array.isArray(module.boundary_decisions)
          ? module.boundary_decisions.filter(isRecord)
              .map((record) => ["boundary", record] as const)
          : []),
      ];
      for (const [kind, record] of nested) {
        const peerId = String(record.other_module_id);
        const disambiguation = disambiguationByPeer.get(peerId);
        const testText = isCompleteLocalizedText(disambiguation)
          ? disambiguation.en ?? ""
          : "";
        for (const claim of evidenceClaims(record.source_claims)) {
          const text = claim.supports;
          if (
            !text.includes(moduleId) ||
            !text.includes(peerId) ||
            !text.includes(testText) ||
            !text.includes("operational notions") ||
            !text.includes("Moonweave design inference") ||
            !text.includes("does not define Moonweave") ||
            text.includes(`boundary of ${previousOwnerId}`)
          ) {
            violations.push(`${moduleId}:${kind}:${peerId}:${claim.source_id}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps every boundary subject and overlap candidate homogeneous under its real owner", () => {
    const ontology = readCandidate();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const sourceModuleById = new Map<string, JsonRecord>();
    for (const entry of sourceEntries()) {
      const source = JSON.parse(entry.bytes.toString("utf8")) as JsonRecord;
      if (
        source.source_kind === "agent-ontology-module" &&
        isRecord(source.module) &&
        typeof source.module.id === "string"
      ) {
        sourceModuleById.set(source.module.id, source.module);
      }
    }

    let boundaryOwnerMismatchCount = 0;
    let overlapOwnerMismatchCount = 0;
    let invalidBoundaryRoleCount = 0;
    let missingOrNonacceptedConceptCount = 0;
    let sourceCanonicalDriftCount = 0;
    let configCandidateDriftCount = 0;
    const ownersByPairAndConcept = new Map<string, Set<string>>();

    for (const module of ontology.modules) {
      const decisions = Array.isArray(module.boundary_decisions)
        ? module.boundary_decisions.filter(isRecord)
        : [];
      const checks = Array.isArray(module.overlap_checks)
        ? module.overlap_checks.filter(isRecord)
        : [];
      const sourceModule = sourceModuleById.get(module.id);
      if (
        !sourceModule ||
        JSON.stringify(sourceModule.boundary_decisions) !== JSON.stringify(decisions) ||
        JSON.stringify(sourceModule.overlap_checks) !== JSON.stringify(checks)
      ) {
        sourceCanonicalDriftCount += 1;
      }

      for (const decision of decisions) {
        const ownerId = String(decision.owner_module_id);
        const peerId = String(decision.other_module_id);
        const subjectIds = Array.isArray(decision.subject_concept_ids)
          ? decision.subject_concept_ids.filter((id): id is string => typeof id === "string")
          : [];
        for (const conceptId of subjectIds) {
          const concept = conceptById.get(conceptId);
          if (!concept || concept.status !== "accepted") {
            missingOrNonacceptedConceptCount += 1;
            continue;
          }
          if (concept.module_id !== ownerId) boundaryOwnerMismatchCount += 1;
          const pairKey = `${[module.id, peerId].sort().join("<->")}|${conceptId}`;
          ownersByPairAndConcept.set(pairKey, new Set([
            ...(ownersByPairAndConcept.get(pairKey) ?? []),
            ownerId,
          ]));
        }
        const expectedDecision = ownerId === module.id ? "owns" : "references";
        if (decision.decision !== expectedDecision) invalidBoundaryRoleCount += 1;
      }

      const candidateIdsByPeer = new Map<string, Set<string>>();
      for (const check of checks) {
        const ownerId = String(check.owner_module_id);
        const peerId = String(check.other_module_id);
        const candidateIds = Array.isArray(check.candidate_concept_ids)
          ? check.candidate_concept_ids.filter((id): id is string => typeof id === "string")
          : [];
        candidateIdsByPeer.set(peerId, new Set([
          ...(candidateIdsByPeer.get(peerId) ?? []),
          ...candidateIds,
        ]));
        for (const conceptId of candidateIds) {
          const concept = conceptById.get(conceptId);
          if (!concept || concept.status !== "accepted") {
            missingOrNonacceptedConceptCount += 1;
          } else if (concept.module_id !== ownerId) {
            overlapOwnerMismatchCount += 1;
          }
        }
      }
      for (const [peerId, candidateIds] of candidateIdsByPeer) {
        const configured = ONTOLOGY_V3_OVERLAP_CANDIDATES[`${module.id}->${peerId}`] ?? [];
        if (
          JSON.stringify([...candidateIds].sort()) !==
          JSON.stringify([...configured].sort())
        ) {
          configCandidateDriftCount += 1;
        }
      }
    }

    const conflictingOwnerCount = [...ownersByPairAndConcept.values()]
      .filter((owners) => owners.size > 1).length;
    expect({
      boundaryOwnerMismatchCount,
      overlapOwnerMismatchCount,
      conflictingOwnerCount,
      invalidBoundaryRoleCount,
      missingOrNonacceptedConceptCount,
      sourceCanonicalDriftCount,
      configCandidateDriftCount,
    }).toEqual({
      boundaryOwnerMismatchCount: 0,
      overlapOwnerMismatchCount: 0,
      conflictingOwnerCount: 0,
      invalidBoundaryRoleCount: 0,
      missingOrNonacceptedConceptCount: 0,
      sourceCanonicalDriftCount: 0,
      configCandidateDriftCount: 0,
    });
  });

  it("separates domain, ontology, and trilingual review responsibilities", () => {
    const ontologyArtifact = readCandidate();
    const violations = ontologyArtifact.modules.flatMap((module) => {
      const reviewers = module.review?.reviewers ?? [];
      const byRole = new Map(reviewers.map((reviewer) => [reviewer.reviewer_role, reviewer]));
      const domain = byRole.get("domain");
      const ontology = byRole.get("ontology");
      const schema = byRole.get("schema");
      const notes = [domain, ontology, schema].map((reviewer) =>
        JSON.stringify(reviewer?.decision_note ?? null),
      );
      const moduleConcepts = ontologyArtifact.classes.filter(
        (concept) => concept.status === "accepted" && concept.module_id === module.id,
      );
      const moduleConceptIds = new Set(moduleConcepts.map(({ id }) => id));
      const keyNotion = isCompleteLocalizedText(module.key_notion)
        ? module.key_notion
        : null;
      const keyConcept = moduleConcepts.find((concept) =>
        keyNotion !== null &&
        languages.every((language) =>
          concept.labels[language] === keyNotion[language]
        ),
      );
      const rootCount = moduleConcepts.filter(
        (concept) => concept.root_status !== null,
      ).length;
      const backboneCount = ontologyArtifact.relations.filter(
        (relation) =>
          relation.status === "accepted" &&
          relation.layout_role === "primary-backbone" &&
          typeof relation.layout_child_id === "string" &&
          moduleConceptIds.has(relation.layout_child_id),
      ).length;
      const interactionContract = isRecord(module.interaction_contract)
        ? module.interaction_contract
        : null;
      const facets = interactionContract && isRecord(interactionContract.facets)
        ? interactionContract.facets
        : null;
      const facetToken = (facetName: string): string => {
        const facet = facets && isRecord(facets[facetName]) ? facets[facetName] : {};
        const familyIds = Array.isArray(facet.family_concept_ids)
          ? facet.family_concept_ids.filter((id): id is string => typeof id === "string")
          : [];
        const relationIds = Array.isArray(facet.relation_ids)
          ? facet.relation_ids.filter((id): id is string => typeof id === "string")
          : [];
        return `${facetName}{families=${familyIds.join("|")};relations=${relationIds.join("|")}}`;
      };
      const facetTokens = ["input", "output", "failure", "recovery"].map(facetToken);
      const inputIds = facets && isRecord(facets.input) && Array.isArray(facets.input.family_concept_ids)
        ? facets.input.family_concept_ids.join("|")
        : "";
      const outputIds = facets && isRecord(facets.output) && Array.isArray(facets.output.family_concept_ids)
        ? facets.output.family_concept_ids.join("|")
        : "";
      const overlapIds = Array.isArray(module.overlap_checks)
        ? module.overlap_checks.filter(isRecord).map((check) => String(check.other_module_id))
        : [];
      const domainText = domain?.decision_note.en ?? "";
      const ontologyText = ontology?.decision_note.en ?? "";
      const schemaText = schema?.decision_note.en ?? "";
      const reviewerIds = [domain, ontology, schema]
        .map((reviewer) => reviewer?.reviewer_id)
        .filter((reviewerId): reviewerId is string => reviewerId !== undefined);
      return module.review?.review_status === "accepted" &&
        isCompleteLocalizedText(module.owns_when) &&
        domainText.includes(`owns_when=\"${module.owns_when.en}\"`) &&
        (module.competency_questions ?? []).every(({ id }) => domainText.includes(id)) &&
        facetTokens.every((token) => domainText.includes(token)) &&
        keyConcept !== undefined &&
        ontologyText.includes(`key_notion=${keyConcept.id}`) &&
        overlapIds.every((id) => ontologyText.includes(id)) &&
        ontologyText.includes(`interaction=${inputIds} -> ${outputIds}`) &&
        ontologyText.includes(`roots=${rootCount}`) &&
        ontologyText.includes(`backbone=${backboneCount}`) &&
        schema?.reviewer_id === "moonweave-trilingual-terminology-reviewer" &&
        languages.every((language) =>
          schemaText.includes(`${language}=\"${module.labels[language]}\"`)
        ) &&
        new Set(notes).size === 3 &&
        reviewerIds.length === 3 &&
        new Set(reviewerIds).size === 3
        ? []
        : [module.id];
    });

    expect(violations).toEqual([]);
  });

  it("keeps every pipe-delimited module-boundary ledger list duplicate-free", () => {
    const rows = parseCsv(readFileSync(boundaryLedgerPath));
    const listColumns = [
      "primary_cq_ids",
      "input_family_ids",
      "output_family_ids",
      "failure_family_ids",
      "recovery_family_ids",
      "overlap_module_ids",
      "overlap_concept_ids",
    ] as const;
    const violations = rows.flatMap((row) =>
      listColumns.flatMap((column) => {
        const values = row[column].split("|").filter(Boolean);
        return values.length === new Set(values).size
          ? []
          : [`${row.module_id}:${column}:${row[column]}`];
      }),
    );

    expect(violations).toEqual([]);
  });

  it("moves every reviewed InstructionMetadata descendant and its hierarchy fact together", () => {
    const ontology = readCandidate();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const ledgers = new Map(
      parseCsv(readFileSync(semanticLedgerPath)).map((row) => [row.concept_id, row]),
    );
    const sourceOwners = new Map<string, string[]>();
    const relationOwners = new Map<string, string[]>();
    for (const entry of sourceEntries()) {
      const source = JSON.parse(entry.bytes.toString("utf8")) as JsonRecord;
      if (!isRecord(source.module) || typeof source.module.id !== "string") continue;
      const moduleId = source.module.id;
      for (const concept of Array.isArray(source.classes) ? source.classes.filter(isRecord) : []) {
        if (typeof concept.id === "string") {
          sourceOwners.set(concept.id, [...(sourceOwners.get(concept.id) ?? []), moduleId]);
        }
      }
      for (const relation of Array.isArray(source.relations) ? source.relations.filter(isRecord) : []) {
        if (typeof relation.id === "string") {
          relationOwners.set(relation.id, [...(relationOwners.get(relation.id) ?? []), moduleId]);
        }
      }
    }

    const violations = instructionMetadataDescendantIds.flatMap((id) => {
      const relationId = `${id}-is_a-InstructionMetadata`;
      const row = ledgers.get(id);
      return conceptById.get(id)?.module_id === "info-prompts-instructions" &&
        JSON.stringify(sourceOwners.get(id)) === JSON.stringify(["info-prompts-instructions"]) &&
        JSON.stringify(relationOwners.get(relationId)) === JSON.stringify(["info-prompts-instructions"]) &&
        row?.decision === "move_owner" &&
        row.current_module_id === "info-messages-instructions" &&
        row.target_module_id === "info-prompts-instructions"
        ? []
        : [id];
    });

    expect(violations).toEqual([]);
  });

  it("reviews the commit/disclosure split in both directions without mixed ownership", () => {
    const pair = [
      ["safety-commit-redaction", "safety-disclosure-redaction"],
      ["safety-disclosure-redaction", "safety-commit-redaction"],
    ] as const;
    const moduleById = new Map(readCandidate().modules.map((module) => [module.id, module]));
    const expectedCandidates = new Set([
      "CommitRequest",
      "EffectReceipt",
      "Redaction",
      "SensitiveSpan",
    ]);
    const violations = pair.flatMap(([moduleId, peerId]) => {
      const configured = ONTOLOGY_V3_MODULE_BOUNDARIES[moduleId];
      const configuredBoundaries = configured.boundary_decisions.filter(
        (decision) => decision.other_module_id === peerId,
      );
      const configuredChecks = configured.overlap_checks.filter(
        (check) => check.other_module_id === peerId,
      );
      const module = moduleById.get(moduleId);
      const boundaries = Array.isArray(module?.boundary_decisions)
        ? module.boundary_decisions.filter(
            (record): record is JsonRecord => isRecord(record) && record.other_module_id === peerId,
          )
        : [];
      const checks = Array.isArray(module?.overlap_checks)
        ? module.overlap_checks.filter(
            (record): record is JsonRecord => isRecord(record) && record.other_module_id === peerId,
          )
        : [];
      const actualCandidates = new Set(
        checks.flatMap((record) =>
          Array.isArray(record.candidate_concept_ids)
            ? record.candidate_concept_ids.filter((id): id is string => typeof id === "string")
            : [],
        ),
      );
      const ownerSet = new Set(checks.map((record) => String(record.owner_module_id)));
      return configuredBoundaries.length === 1 &&
        configuredChecks.length === 1 &&
        boundaries.length === 2 &&
        checks.length === 2 &&
        ownerSet.size === 2 &&
        ownerSet.has(moduleId) &&
        ownerSet.has(peerId) &&
        expectedCandidates.size === actualCandidates.size &&
        [...expectedCandidates].every((id) => actualCandidates.has(id))
        ? []
        : [`${moduleId}->${peerId}`];
    });

    expect(violations).toEqual([]);
  });


  it("defines each module independently from its purpose using its real key notion and owner rule", () => {
    const violations = readCandidate().modules.flatMap((module) => {
      const definitions = isCompleteLocalizedText(module.definitions)
        ? module.definitions
        : null;
      const keyNotion = isCompleteLocalizedText(module.key_notion)
        ? module.key_notion
        : null;
      const ownsWhen = isCompleteLocalizedText(module.owns_when)
        ? module.owns_when
        : null;
      return definitions && keyNotion && ownsWhen &&
        JSON.stringify(definitions) !== JSON.stringify(module.purpose) &&
        languages.every((language) =>
          definitions[language]?.includes(keyNotion[language] ?? "") &&
          definitions[language]?.includes(ownsWhen[language] ?? "")
        )
        ? []
        : [module.id];
    });

    expect(violations).toEqual([]);
  });


  it("binds every competency-question claim to its own query and assertion", () => {
    const claimFingerprints = new Set<string>();
    const violations = readCandidate().modules.flatMap((module) =>
      (module.competency_questions ?? []).flatMap((question) => {
        const query = typeof question.query === "string" ? question.query : "";
        const assertion = typeof question.expected_assertion === "string"
          ? question.expected_assertion
          : "";
        const semanticKey = typeof question.semantic_key === "string"
          ? question.semantic_key
          : "";
        const relatedIds = Array.isArray(question.related_module_ids)
          ? question.related_module_ids.filter((id): id is string => typeof id === "string")
          : [];
        const claims = evidenceClaims(question.source_claims);
        const invalidClaims = claims.filter(({ supports }) =>
          !supports.includes(question.id) ||
          !supports.includes(semanticKey) ||
          !supports.includes(module.id) ||
          !supports.includes(query) ||
          !supports.includes(assertion) ||
          relatedIds.some((id) => !supports.includes(id)) ||
          !supports.includes("operational notions") ||
          !supports.includes("does not define Moonweave CQ") ||
          !supports.includes("Moonweave design inference")
        );
        for (const claim of claims) {
          claimFingerprints.add(`${question.id}|${claim.source_id}|${claim.supports}`);
        }
        return claims.length > 0 && invalidClaims.length === 0
          ? []
          : [question.id];
      }),
    );

    expect(claimFingerprints.size).toBe(282);
    expect(violations).toEqual([]);
  });

});
