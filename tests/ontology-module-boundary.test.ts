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
const languages = ["zh", "en", "ja"] as const;
const releaseEvidencePaths = [
  "research/ontology-concept-semantic-depth-v3-ledger.csv",
  "research/ontology-module-boundary-v3.csv",
  "research/ontology-module-cq-v3.csv",
  "research/source-registry.csv",
  "research/living-source-metadata.csv",
  "scripts/data/ontology-v2-semantic-baseline.ndjson",
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

describe("ontology Module boundary release gates", () => {
  it("keeps the hand-authored boundary configuration aligned with the release modules", () => {
    const moduleIds = readCandidate().modules.map(({ id }) => id).sort();
    const result = validateOntologyV3ModuleBoundaries(
      ONTOLOGY_V3_MODULE_BOUNDARIES,
      moduleIds,
    );

    expect(result).toEqual({
      module_count: 47,
      competency_question_count: 141,
      boundary_decision_count: 143,
    });
    expect(Object.isFrozen(ONTOLOGY_V3_MODULE_BOUNDARIES)).toBe(true);
  });

  it("keeps reviewed interaction contracts and overlap candidates explicit for every module adjacency", () => {
    const ontology = readCandidate();
    const moduleIds = ontology.modules.map(({ id }) => id).sort();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const relationById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const keyConceptIds = new Map(
      ontology.modules.map((module) => {
        const keyConcept = ontology.classes.find((concept) =>
          concept.module_id === module.id &&
          languages.every((language) => concept.labels[language] === (module.key_notion as LocalizedText)[language]),
        );
        return [module.id, keyConcept?.id ?? "missing-key-notion"];
      }),
    );

    expect(validateOntologyV3InteractionContracts(
      ONTOLOGY_V3_INTERACTION_CONTRACTS,
      moduleIds,
      conceptById,
      relationById,
    )).toEqual({
      module_count: 47,
      applicable_facet_count: 115,
      referenced_relation_count: 201,
      shared_relation_bridge_count: 7,
    });
    expect(validateOntologyV3OverlapCandidates(
      ONTOLOGY_V3_OVERLAP_CANDIDATES,
      ONTOLOGY_V3_MODULE_BOUNDARIES,
      conceptById,
      keyConceptIds,
      relationById,
    )).toEqual({
      adjacency_count: 143,
      candidate_reference_count: 572,
    });
    expect(Object.isFrozen(ONTOLOGY_V3_INTERACTION_CONTRACTS)).toBe(true);
    expect(Object.isFrozen(ONTOLOGY_V3_OVERLAP_CANDIDATES)).toBe(true);
  });

  it("projects exact interaction facets, overlap candidates, and question-specific evidence pairs", () => {
    const ontology = readCandidate();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const exampleById = new Map(
      ontology.modules.flatMap((module) =>
        (Array.isArray(module.examples) ? module.examples.filter(isRecord) : [])
          .map((example) => [String(example.id), example] as const),
      ),
    );
    const evidencePairs = new Set<string>();
    const violations: string[] = [];

    for (const module of ontology.modules) {
      const specification = ONTOLOGY_V3_INTERACTION_CONTRACTS[module.id];
      const interactionContract = isRecord(module.interaction_contract)
        ? module.interaction_contract
        : null;
      const facets = interactionContract && isRecord(interactionContract.facets)
        ? interactionContract.facets
        : null;
      if (!specification || interactionContract === null || facets === null) {
        violations.push(`${module.id}:missing-interaction-contract`);
        continue;
      }
      if (interactionContract.applicability !== specification.applicability) {
        violations.push(`${module.id}:interaction-applicability-drift`);
      }
      for (const facetName of ["input", "output", "failure", "recovery"] as const) {
        const facet = isRecord(facets[facetName]) ? facets[facetName] : null;
        const expected = specification.facets[facetName];
        if (
          !facet ||
          JSON.stringify(facet.family_concept_ids) !== JSON.stringify(expected.family_concept_ids) ||
          JSON.stringify(facet.relation_ids) !== JSON.stringify(expected.relation_ids)
        ) {
          violations.push(`${module.id}:${facetName}:interaction-reference-drift`);
        }
        if (facet) {
          const description = isRecord(facet.description) ? facet.description : null;
          for (const [relationId, rationale] of Object.entries(
            expected.shared_relation_rationales,
          )) {
            for (const language of languages) {
              if (
                !description ||
                typeof description[language] !== "string" ||
                !description[language].includes(rationale[language])
              ) {
                violations.push(
                  `${module.id}:${facetName}:${relationId}:missing-${language}-bridge-rationale`,
                );
              }
            }
          }
        }
      }

      const moduleExamples = Array.isArray(module.examples)
        ? module.examples.filter(isRecord)
        : [];
      if (moduleExamples.some(({ kind }) => kind === "case-fragment")) {
        violations.push(`${module.id}:forced-module-case-fragment`);
      }
      for (const question of module.competency_questions ?? []) {
        const positiveIds = Array.isArray(question.positive_example_ids)
          ? question.positive_example_ids.filter((id): id is string => typeof id === "string")
          : [];
        const counterIds = Array.isArray(question.counterexample_ids)
          ? question.counterexample_ids.filter((id): id is string => typeof id === "string")
          : [];
        const pairKey = JSON.stringify([positiveIds, counterIds]);
        if (evidencePairs.has(pairKey)) violations.push(`${question.id}:reused-evidence-pair`);
        evidencePairs.add(pairKey);
        const binding = isRecord(question.evidence_binding)
          ? question.evidence_binding
          : null;
        for (const exampleId of [...positiveIds, ...counterIds]) {
          const example = exampleById.get(exampleId);
          const evidenceModuleIds = new Set(
            (example && Array.isArray(example.related_node_ids)
              ? example.related_node_ids.filter((id): id is string => typeof id === "string")
              : []
            ).map((conceptId) => conceptById.get(conceptId)?.module_id),
          );
          if (!example || !evidenceModuleIds.has(module.id)) {
            violations.push(`${question.id}:${exampleId}:missing-owner-evidence`);
          }
          if (binding?.applicability !== "owner-only") {
            const relatedModuleIds = Array.isArray(question.related_module_ids)
              ? question.related_module_ids.filter(
                  (id): id is string => typeof id === "string",
                )
              : [];
            for (const relatedModuleId of relatedModuleIds) {
              if (!evidenceModuleIds.has(relatedModuleId)) {
                violations.push(`${question.id}:${exampleId}:missing-${relatedModuleId}`);
              }
            }
          }
        }
      }

      const overlapChecks = Array.isArray(module.overlap_checks)
        ? module.overlap_checks.filter(isRecord)
        : [];
      const candidatesByAdjacency = new Map<string, Set<string>>();
      for (const check of overlapChecks) {
        const adjacency = `${module.id}->${String(check.other_module_id)}`;
        const candidateIds = Array.isArray(check.candidate_concept_ids)
          ? check.candidate_concept_ids.filter((id): id is string => typeof id === "string")
          : [];
        candidatesByAdjacency.set(adjacency, new Set([
          ...(candidatesByAdjacency.get(adjacency) ?? []),
          ...candidateIds,
        ]));
      }
      for (const [adjacency, candidateIds] of candidatesByAdjacency) {
        if (
          JSON.stringify([...candidateIds].sort()) !==
          JSON.stringify([...ONTOLOGY_V3_OVERLAP_CANDIDATES[adjacency]].sort())
        ) {
          violations.push(`${adjacency}:overlap-candidate-drift`);
        }
      }
    }

    expect(evidencePairs.size).toBe(141);
    expect(exampleById.size).toBe(282);
    expect(violations).toEqual([]);
  });

  it("rejects mechanical cross-facet relation reuse without a facet-role rationale", () => {
    const unreviewed = structuredClone(
      ONTOLOGY_V3_INTERACTION_CONTRACTS,
    ) as unknown as Record<string, {
      facets: Record<string, {
        shared_relation_rationales: Record<string, LocalizedText>;
      }>;
    }>;
    delete unreviewed["orchestration-task-planning"].facets.input
      .shared_relation_rationales["Goal-elaborated_by-TaskPlan"];

    expect(() => validateOntologyV3InteractionContracts(
      unreviewed as unknown as typeof ONTOLOGY_V3_INTERACTION_CONTRACTS,
    )).toThrow(
      /reuses interaction relation Goal-elaborated_by-TaskPlan without an explicit trilingual facet-role rationale/u,
    );
  });

  it("rejects circular not-applicable prose from every interaction facet", () => {
    const circularPatterns = [
      /没有已接受的\s+(?:input|output|failure|recovery)\s+关系；该面明确不适用/u,
      /has no accepted\s+(?:input|output|failure|recovery)\s+relation, so the facet is explicitly not applicable/iu,
      /承認済みの\s*(?:input|output|failure|recovery)\s*関係がなく、この面は明示的に非適用/u,
    ] as const;
    const violations = readCandidate().modules.flatMap((module) => {
      if (!isRecord(module.interaction_contract) || !isRecord(module.interaction_contract.facets)) return [];
      return Object.entries(module.interaction_contract.facets).flatMap(([facetName, facet]) => {
        if (!isRecord(facet)) return [];
        return [facet.description, facet.not_applicable_reason]
          .filter(isCompleteLocalizedText)
          .flatMap((text) => languages.flatMap((language) =>
            circularPatterns.some((pattern) => pattern.test(text[language] ?? ""))
              ? [`${module.id}:${facetName}:${language}`]
              : [],
          ));
      });
    });

    expect(violations).toEqual([]);
  });

  it("adjudicates every sibling referenced by a hand-authored competency question", () => {
    const missing = Object.entries(ONTOLOGY_V3_MODULE_BOUNDARIES).flatMap(
      ([moduleId, specification]) => {
        const decisionPeers = new Set(
          specification.boundary_decisions.map(({ other_module_id: peer }) => peer),
        );
        const overlapPeers = new Set(
          specification.overlap_checks.map(({ other_module_id: peer }) => peer),
        );
        const questionPeers = new Set(
          specification.competency_questions.flatMap(
            ({ related_module_ids: peers }) => peers,
          ),
        );
        return [...questionPeers].flatMap((peer) => [
          ...(decisionPeers.has(peer)
            ? []
            : [`${moduleId}:${peer}:missing-boundary-decision`]),
          ...(overlapPeers.has(peer)
            ? []
            : [`${moduleId}:${peer}:missing-overlap-check`]),
        ]);
      },
    );

    expect(missing).toEqual([]);
  });

  it("rejects a module label ending with 模块", () => {
    const violations = readCandidate().modules
      .filter((module) => /模块\s*$/u.test(module.labels.zh ?? ""))
      .map((module) => `${module.id}:${module.labels.zh}`);

    expect(violations).toEqual([]);
  });

  it("rejects copied generic purpose includes and excludes", () => {
    const violations = readCandidate().modules.flatMap((module) =>
      [
        ...localizedEntries(module.id, "purpose", module.purpose),
        ...localizedEntries(module.id, "includes", module.includes),
        ...localizedEntries(module.id, "excludes", module.excludes),
      ].flatMap(({ ownerId, path, text }) =>
        genericTextPatterns.some((pattern) => pattern.test(text))
          ? [`${ownerId}:${path}`]
          : [],
      ),
    );

    expect(violations).toEqual([]);
  });

  it("requires one accepted key notion per module", () => {
    const ontology = readCandidate();
    const violations = ontology.modules.flatMap((module) => {
      if (module.status !== "accepted") return [];
      const keyNotion = module.key_notion;
      if (!isCompleteLocalizedText(keyNotion)) {
        return [`${module.id}:missing-key-notion`];
      }

      const matches = ontology.classes.filter(
        (concept) =>
          concept.status === "accepted" &&
          concept.module_id === module.id &&
          languages.some((language) => {
            const keyLabel = keyNotion[language];
            const conceptLabel = concept.labels[language];
            return typeof keyLabel === "string" &&
              typeof conceptLabel === "string" &&
              normalized(keyLabel) === normalized(conceptLabel);
          }),
      );
      return matches.length === 1
        ? []
        : [`${module.id}:key-notion-resolves-to-${matches.length}-concepts`];
    });

    expect(violations).toEqual([]);
  });

  it("requires each competency question to have one primary owner", () => {
    const ontology = readCandidate();
    const moduleIds = new Set(ontology.modules.map(({ id }) => id));
    const semanticKeyOwners = new Map<string, string[]>();
    const violations: string[] = [];

    for (const module of ontology.modules.filter(({ status }) => status === "accepted")) {
      for (const question of module.competency_questions ?? []) {
        const semanticKey = question.semantic_key;
        if (typeof semanticKey !== "string" || semanticKey.trim().length === 0) {
          violations.push(`${module.id}:${question.id}:missing-semantic-key`);
        } else {
          semanticKeyOwners.set(semanticKey, [
            ...(semanticKeyOwners.get(semanticKey) ?? []),
            module.id,
          ]);
        }
        if (question.primary_owner_module_id !== module.id) {
          violations.push(`${module.id}:${question.id}:owner-mismatch`);
        }
        if (!Array.isArray(question.related_module_ids)) {
          violations.push(`${module.id}:${question.id}:missing-related-modules`);
        }
        if (
          typeof question.primary_owner_module_id === "string" &&
          !moduleIds.has(question.primary_owner_module_id)
        ) {
          violations.push(`${module.id}:${question.id}:unknown-owner`);
        }
      }
    }

    for (const [semanticKey, owners] of semanticKeyOwners) {
      if (owners.length !== 1) {
        violations.push(`${semanticKey}:owned-${owners.length}-times`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("requires overlap decisions for referenced sibling modules", () => {
    const ontology = readCandidate();
    const moduleIds = new Set(ontology.modules.map(({ id }) => id));
    const violations: string[] = [];

    for (const module of ontology.modules.filter(({ status }) => status === "accepted")) {
      const decisions = Array.isArray(module.boundary_decisions)
        ? module.boundary_decisions.filter(isRecord)
        : null;
      const checks = Array.isArray(module.overlap_checks)
        ? module.overlap_checks.filter(isRecord)
        : null;
      if (decisions === null) violations.push(`${module.id}:missing-boundary-decisions`);
      if (checks === null) violations.push(`${module.id}:missing-overlap-checks`);
      if (decisions === null || checks === null) continue;

      const referencedSiblingIds = new Set(
        (module.competency_questions ?? []).flatMap((question) =>
          Array.isArray(question.related_module_ids)
            ? question.related_module_ids.filter(
                (id): id is string => typeof id === "string" && id !== module.id,
              )
            : [],
        ),
      );
      for (const siblingId of referencedSiblingIds) {
        if (!moduleIds.has(siblingId)) {
          violations.push(`${module.id}:${siblingId}:unknown-sibling`);
          continue;
        }
        if (!decisions.some(({ other_module_id: id }) => id === siblingId)) {
          violations.push(`${module.id}:${siblingId}:missing-boundary-decision`);
        }
        if (!checks.some(({ other_module_id: id }) => id === siblingId)) {
          violations.push(`${module.id}:${siblingId}:missing-overlap-check`);
        }
      }
      for (const check of checks) {
        if (check.result === "unresolved") {
          violations.push(`${module.id}:${String(check.other_module_id)}:unresolved-overlap`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("binds each boundary-decision subject to accepted relation endpoints or an explicit N/A rationale", () => {
    const ontology = readCandidate();
    const relationById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const violations = ontology.modules.flatMap((module) =>
      (Array.isArray(module.boundary_decisions)
        ? module.boundary_decisions.filter(isRecord)
        : []
      ).flatMap((decision) => {
        const relationIds = Array.isArray(decision.relation_ids)
          ? decision.relation_ids.filter(
              (relationId): relationId is string => typeof relationId === "string",
            )
          : [];
        const citedRelations = relationIds
          .map((relationId) => relationById.get(relationId))
          .filter((relation): relation is CandidateOntology["relations"][number] => relation !== undefined);
        const endpointIds = new Set(
          citedRelations.flatMap((relation) => [
            String(relation.source_id),
            String(relation.target_id),
          ]),
        );
        const subjectIds = Array.isArray(decision.subject_concept_ids)
          ? decision.subject_concept_ids.filter((id): id is string => typeof id === "string")
          : [];
        return [
          ...relationIds.flatMap((relationId) =>
            relationById.get(relationId)?.status === "accepted"
              ? []
              : [`${module.id}:${relationId}:missing-or-nonaccepted`],
          ),
          ...(relationIds.length > 0 && subjectIds.some((id) => !endpointIds.has(id))
            ? [`${module.id}:${String(decision.other_module_id)}:non-endpoint-subject`]
            : []),
          ...(relationIds.length === 0 && !isCompleteLocalizedText(decision.relation_not_applicable_reason)
            ? [`${module.id}:${String(decision.other_module_id)}:missing-relation-na`]
            : []),
          ...(relationIds.length > 0 && decision.relation_not_applicable_reason !== null
            ? [`${module.id}:${String(decision.other_module_id)}:unexpected-relation-na`]
            : []),
        ];
      }),
    );

    expect(violations).toEqual([]);
  });

  it("keeps canonical concept ownership unique across split modules", () => {
    const ownersByConcept = new Map<string, Set<string>>();
    const mismatchedSourceOwners: string[] = [];

    for (const entry of sourceEntries()) {
      const source = JSON.parse(entry.bytes.toString("utf8")) as JsonRecord;
      if (source.source_kind !== "agent-ontology-module" || !isRecord(source.module)) {
        continue;
      }
      const sourceModuleId = source.module.id;
      if (typeof sourceModuleId !== "string" || !Array.isArray(source.classes)) continue;
      for (const value of source.classes) {
        if (!isRecord(value) || typeof value.id !== "string") continue;
        const declaredOwner = value.module_id;
        if (declaredOwner !== sourceModuleId) {
          mismatchedSourceOwners.push(
            `${value.id}:${String(declaredOwner)}!=${sourceModuleId}`,
          );
        }
        const owners = ownersByConcept.get(value.id) ?? new Set<string>();
        owners.add(sourceModuleId);
        ownersByConcept.set(value.id, owners);
      }
    }

    const duplicateOwners = [...ownersByConcept]
      .filter(([, owners]) => owners.size !== 1)
      .map(([conceptId, owners]) => `${conceptId}:${[...owners].sort().join("|")}`);
    const artifact = readCandidate();

    expect(mismatchedSourceOwners).toEqual([]);
    expect(duplicateOwners).toEqual([]);
    expect(duplicateValues(artifact.classes.map(({ id }) => id))).toEqual([]);
  });

  it("includes accepted ledgers and registries in source_tree_sha256", () => {
    expect(missingEvidencePaths()).toEqual([]);
    const entries = [...sourceEntries(), ...evidenceEntries()].map(
      ({ sourceFingerprintPath, bytes }) => [sourceFingerprintPath, bytes] as const,
    );

    expect(readCandidate().artifact_metadata.source_tree_sha256).toBe(
      fingerprint(entries),
    );
  });

  it("changes source_tree_sha256 when accepted release evidence changes", () => {
    expect(missingEvidencePaths()).toEqual([]);
    const evidence = evidenceEntries();
    const entries = [...sourceEntries(), ...evidence].map(
      ({ sourceFingerprintPath, bytes }) => [sourceFingerprintPath, bytes] as const,
    );
    const [firstEvidence] = evidence;
    expect(firstEvidence).toBeDefined();
    if (firstEvidence === undefined) return;

    const changedEntries = entries.map(([path, bytes]) =>
      path === firstEvidence.sourceFingerprintPath
        ? [path, Buffer.concat([bytes, Buffer.from("\n")])] as const
        : [path, bytes] as const,
    );
    const expectedCurrent = fingerprint(entries);
    const expectedChanged = fingerprint(changedEntries);

    expect(expectedChanged).not.toBe(expectedCurrent);
    expect(readCandidate().artifact_metadata.source_tree_sha256).toBe(expectedCurrent);
  });

  it("lists release evidence paths in generated_from without creating graph elements", () => {
    const ontology = readCandidate();
    expect.soft(ontology.artifact_metadata.generated_from).toEqual(
      expect.arrayContaining([...releaseEvidencePaths]),
    );

    const graphElementIds = [
      ...ontology.modules,
      ...ontology.classes,
      ...ontology.relations,
    ].map(({ id }) => id);
    const sourceOwnedGraphElementIds = sourceEntries().flatMap((entry) => {
      const source = JSON.parse(entry.bytes.toString("utf8")) as JsonRecord;
      if (source.source_kind !== "agent-ontology-module" || !isRecord(source.module)) {
        return [];
      }
      return [
        source.module.id,
        ...(Array.isArray(source.classes)
          ? source.classes.filter(isRecord).map(({ id }) => id)
          : []),
        ...(Array.isArray(source.relations)
          ? source.relations.filter(isRecord).map(({ id }) => id)
          : []),
      ].filter((id): id is string => typeof id === "string");
    });

    expect.soft([...new Set(graphElementIds)].sort()).toEqual(
      [...new Set(sourceOwnedGraphElementIds)].sort(),
    );
    expect(graphElementIds.filter((id) => id.startsWith("research/"))).toEqual([]);
    expect(
      graphElementIds.filter((id) =>
        releaseEvidencePaths.includes(id as (typeof releaseEvidencePaths)[number]),
      ),
    ).toEqual([]);
  });
});
