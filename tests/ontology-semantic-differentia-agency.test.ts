import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS } from "../scripts/data/ontology-v3-backbone-decisions.mjs";
import { ONTOLOGY_V3_INTERACTION_CONTRACTS } from "../scripts/data/ontology-v3-interaction-contracts.mjs";
import { parseCsv } from "../scripts/lib/csv.mjs";
import { validateSemanticDepthContracts } from "../scripts/lib/ontology-semantic-depth-validation.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

type Language = "zh" | "en" | "ja";

interface LocalizedText {
  readonly zh: string;
  readonly en: string;
  readonly ja: string;
}

interface SourceClaim {
  readonly source_id: string;
  readonly supports: string;
  readonly locator: string;
}

interface SiblingDifferentiation {
  readonly sibling_concept_id: string;
  readonly shared_parent_concept_id: string;
  readonly differentia: LocalizedText;
  readonly source_claims: readonly SourceClaim[];
}

interface Concept {
  readonly id: string;
  readonly module_id: string;
  readonly labels: LocalizedText;
  readonly short_definitions: LocalizedText;
  readonly semantic_kind: string;
  readonly status: string;
  readonly primary_parent_relation_id: string | null;
  readonly sibling_differentiation: readonly SiblingDifferentiation[];
  readonly source_claims: readonly SourceClaim[];
  readonly structure?: {
    readonly required_relation_constraints?: readonly {
      readonly id: string;
      readonly direction: string;
      readonly predicate: string;
      readonly target_concept_id: string;
    }[];
  };
}

interface RelationExample {
  readonly id: string;
  readonly descriptions: LocalizedText;
  readonly related_relation_ids: readonly string[];
}

interface Relation {
  readonly id: string;
  readonly predicate: string;
  readonly source_id: string;
  readonly target_id: string;
  readonly relation_kind: string;
  readonly status: string;
  readonly layout_role: string | null;
  readonly layout_parent_id: string | null;
  readonly layout_child_id: string | null;
  readonly replaced_by_ids: readonly string[];
  readonly definitions: LocalizedText;
  readonly examples: readonly RelationExample[];
  readonly source_claims: readonly SourceClaim[];
  readonly conditions: readonly {
    readonly id: string;
    readonly expression: string;
    readonly source_claims: readonly SourceClaim[];
  }[];
}

interface OntologyArtifact {
  readonly artifact_metadata: {
    readonly release_channel: string;
  };
  readonly modules: readonly {
    readonly id: string;
    readonly status: string;
  }[];
  readonly classes: readonly Concept[];
  readonly relations: readonly Relation[];
}

const readOntology = (): OntologyArtifact =>
  JSON.parse(readFileSync(ontologyArtifactPath(), "utf8")) as OntologyArtifact;

const expectedSiblingContractCount = (): number => {
  const audit = JSON.parse(
    readFileSync(
      resolve(process.cwd(), "research/generated/ontology-concept-genus-differentia-audit.json"),
      "utf8",
    ),
  ) as { readonly migration: { readonly synchronized_sibling_contract_count: number } };
  return audit.migration.synchronized_sibling_contract_count;
};

const languages = ["zh", "en", "ja"] as const satisfies readonly Language[];
const conditionText = (value: string): string =>
  value.trim().replace(/[.!?。！？]+$/u, "");

const templateMarkers: Readonly<Record<Language, readonly string[]>> = {
  zh: ["共享父节点对照", "端点特定对照", "正向身份比较", "已审查兄弟区分"],
  en: ["Shared-parent contrast", "Endpoint-specific contrast", "Positive identity comparison", "Reviewed sibling distinction"],
  ja: ["共有親対照", "端点別対照", "正の同一性比較", "審査済み兄弟区別"],
};

const forbiddenOneSidedPatterns: Readonly<Record<Language, readonly RegExp[]>> = {
  zh: [/前者.*后者不/u, /后者不以.*同一身份/u, /不获得同一身份/u],
  en: [/the former.*the latter does not/iu, /does not acquire the same identity/iu],
  ja: [/前者.*後者/u, /同一の身分を得ません/u, /同じ身元を取得しません/u],
};

describe("bilateral sibling differentia", () => {
  it("states object-specific positive identity conditions for both reviewed siblings in all languages", () => {
    const artifact = readOntology();
    const concepts = new Map(artifact.classes.map((concept) => [concept.id, concept]));
    const reviewedPairs = artifact.classes.flatMap((concept) =>
      concept.status === "accepted"
        ? concept.sibling_differentiation.map((differentia) => ({ concept, differentia }))
        : [],
    );

    expect(reviewedPairs).toHaveLength(expectedSiblingContractCount());
    for (const { concept, differentia } of reviewedPairs) {
      const sibling = concepts.get(differentia.sibling_concept_id);
      const parent = concepts.get(differentia.shared_parent_concept_id);
      expect(sibling, `${concept.id} sibling`).toBeDefined();
      expect(parent, `${concept.id} shared parent`).toBeDefined();
      const parentRelation = (childId: string) =>
        artifact.relations
          .filter(({
            status,
            predicate,
            source_id: sourceId,
            target_id: targetId,
            layout_role: layoutRole,
            layout_parent_id: layoutParentId,
            layout_child_id: layoutChildId,
          }) =>
            status === "accepted" &&
            (
              (predicate === "is_a" && sourceId === childId && targetId === parent?.id) ||
              (
                layoutRole === "primary-backbone" &&
                layoutChildId === childId &&
                layoutParentId === parent?.id
              )
            ),
          )
          .sort((left, right) => {
            const primaryId = concepts.get(childId)?.primary_parent_relation_id;
            const leftPrimary = left.id === primaryId ? 0 : 1;
            const rightPrimary = right.id === primaryId ? 0 : 1;
            return leftPrimary - rightPrimary || left.id.localeCompare(right.id, "en");
          })[0];
      const conceptBackboneId = parentRelation(concept.id)?.id;
      const siblingBackboneId = parentRelation(sibling?.id as string)?.id;
      expect(conceptBackboneId).toBeDefined();
      expect(siblingBackboneId).toBeDefined();

      for (const language of languages) {
        const text = differentia.differentia[language];
        expect(text, `${concept.id}:${language}:subject ID`).toContain(concept.id);
        expect(text, `${concept.id}:${language}:sibling ID`).toContain(sibling?.id);
        expect(text, `${concept.id}:${language}:parent ID`).toContain(parent?.id);
        expect(text, `${concept.id}:${language}:subject backbone`).toContain(
          conceptBackboneId as string,
        );
        expect(text, `${concept.id}:${language}:sibling backbone`).toContain(
          siblingBackboneId as string,
        );
        expect(text, `${concept.id}:${language}:semantic kind`).toContain(
          `semantic kind=${concept.semantic_kind}`,
        );
        expect(text, `${concept.id}:${language}:sibling semantic kind`).toContain(
          `semantic kind=${sibling?.semantic_kind}`,
        );
        expect(text, `${concept.id}:${language}:subject condition`).toContain(
          conditionText(concept.short_definitions[language]),
        );
        expect(text, `${concept.id}:${language}:sibling condition`).toContain(
          conditionText(sibling?.short_definitions[language] as string),
        );
        for (const forbidden of forbiddenOneSidedPatterns[language]) {
          expect(text, `${concept.id}:${language}:${forbidden}`).not.toMatch(forbidden);
        }
      }

      expect(differentia.source_claims.length).toBeGreaterThan(0);
      expect(differentia.source_claims.length).toBeLessThanOrEqual(2);
      const claimKey = ({ source_id: sourceId, locator }: SourceClaim) =>
        `${sourceId}\0${locator}`;
      const conceptClaimKeys = new Set(concept.source_claims.map(claimKey));
      const siblingClaimKeys = new Set((sibling?.source_claims ?? []).map(claimKey));
      const allowedClaimKeys = new Set([...conceptClaimKeys, ...siblingClaimKeys]);
      const evidenceByEndpoint = new Map([
        [concept.id, 0],
        [sibling?.id as string, 0],
      ]);
      expect(conceptClaimKeys.size, `${concept.id} direct evidence`).toBeGreaterThan(0);
      expect(siblingClaimKeys.size, `${sibling?.id} direct evidence`).toBeGreaterThan(0);
      expect(differentia.source_claims.map(claimKey)).toEqual(
        [...new Set(differentia.source_claims.map(claimKey))],
      );
      for (const claim of differentia.source_claims) {
        const key = claimKey(claim);
        expect(allowedClaimKeys.has(key), `${concept.id}:${key}:unrelated source`).toBe(true);
        const scopeMatch = claim.supports.match(
          /Sibling evidence scope: (?:endpoint ([A-Za-z][A-Za-z0-9_-]*) only|shared endpoints ([A-Za-z][A-Za-z0-9_-]*) and ([A-Za-z][A-Za-z0-9_-]*))/u,
        );
        expect(scopeMatch, `${concept.id}:${key}:explicit endpoint scope`).not.toBeNull();
        const scopedEndpointIds = scopeMatch?.[1]
          ? [scopeMatch[1]]
          : [scopeMatch?.[2], scopeMatch?.[3]].filter((value): value is string => Boolean(value));
        expect(scopedEndpointIds.length, `${concept.id}:${key}:scope count`).toBeGreaterThan(0);
        for (const endpointId of scopedEndpointIds) {
          expect([concept.id, sibling?.id]).toContain(endpointId);
          const endpointClaimKeys = endpointId === concept.id ? conceptClaimKeys : siblingClaimKeys;
          expect(endpointClaimKeys.has(key), `${concept.id}:${key}:${endpointId}:borrowed evidence`).toBe(true);
          evidenceByEndpoint.set(endpointId, (evidenceByEndpoint.get(endpointId) ?? 0) + 1);
        }
        if (scopedEndpointIds.length === 1) {
          const otherEndpointId = scopedEndpointIds[0] === concept.id ? sibling?.id : concept.id;
          expect(claim.supports).toContain(`does not support ${otherEndpointId}`);
        }
        expect(claim.supports).toContain(`Root object ${concept.id}`);
        expect(claim.supports).toContain(`nested object ${sibling?.id}`);
        expect(claim.supports).toContain("Moonweave contextualization");
      }
      expect(evidenceByEndpoint.get(concept.id), `${concept.id}:own endpoint evidence`).toBeGreaterThan(0);
      expect(evidenceByEndpoint.get(sibling?.id as string), `${sibling?.id}:own endpoint evidence`).toBeGreaterThan(0);
    }
  });

  it("documents every accepted Concept that has a type-compatible is_a sibling", () => {
    const artifact = readOntology();
    const concepts = new Map(
      artifact.classes
        .filter(({ status }) => status === "accepted")
        .map((concept) => [concept.id, concept]),
    );
    const acceptedIsAByParent = new Map<string, string[]>();
    for (const relation of artifact.relations.filter(
      ({ status, predicate }) => status === "accepted" && predicate === "is_a",
    )) {
      const source = concepts.get(relation.source_id);
      const target = concepts.get(relation.target_id);
      if (source === undefined || target === undefined) continue;
      if (source.semantic_kind !== target.semantic_kind) continue;
      acceptedIsAByParent.set(relation.target_id, [
        ...(acceptedIsAByParent.get(relation.target_id) ?? []),
        relation.source_id,
      ]);
    }

    const missing = artifact.classes.flatMap((concept) => {
      if (concept.status !== "accepted") return [];
      const siblingGroups = [...acceptedIsAByParent.entries()]
        .map(([parentId, childIds]) => ({
          parentId,
          siblingIds: childIds
            .filter((id) => id !== concept.id)
            .filter((id) => concepts.get(id)?.semantic_kind === concept.semantic_kind),
          containsConcept: childIds.includes(concept.id),
        }))
        .filter(({ containsConcept, siblingIds }) => containsConcept && siblingIds.length > 0);
      if (siblingGroups.length === 0) return [];
      const differentiation = concept.sibling_differentiation.find(({ sibling_concept_id: siblingId, shared_parent_concept_id: parentId }) =>
        siblingGroups.some((group) => group.parentId === parentId && group.siblingIds.includes(siblingId)),
      );
      return differentiation === undefined
        ? [`${concept.id} (${siblingGroups.map(({ parentId, siblingIds }) => `${parentId}:${siblingIds.join("|")}`).join(",")})`]
        : [];
    });

    expect(missing).toEqual([]);
  });

  it("accepts taxonomy and primary-backbone layout siblings but rejects an unrelated substitute", () => {
    const artifact = readOntology();
    const validationContext = (value: OntologyArtifact) => ({
      modules: value.modules,
      classes: value.classes,
      relations: value.relations,
      moduleIds: new Set(value.modules.map(({ id }) => id)),
      conceptIds: new Set(value.classes.map(({ id }) => id)),
      moduleById: new Map(value.modules.map((module) => [module.id, module])),
      conceptById: new Map(value.classes.map((concept) => [concept.id, concept])),
      relationById: new Map(value.relations.map((relation) => [relation.id, relation])),
      sourceFileByModule: new Map(),
      sourceLocationByConcept: new Map(),
      sourceLocationByRelation: new Map(),
      releaseChannel: value.artifact_metadata.release_channel,
    });
    const concepts = new Map(artifact.classes.map((concept) => [concept.id, concept]));
    const crossModule = artifact.classes.flatMap((concept) =>
      concept.sibling_differentiation
        .filter(({ sibling_concept_id: siblingId }) =>
          concepts.get(siblingId)?.module_id !== concept.module_id,
        )
        .map((differentia) => ({ concept, differentia })),
    )[0];
    expect(crossModule, "expected one real cross-Module is_a sibling pair").toBeDefined();
    const crossKindLogical = artifact.classes.flatMap((concept) =>
      concept.sibling_differentiation
        .filter(({ sibling_concept_id: siblingId }) =>
          concepts.get(siblingId)?.semantic_kind !== concept.semantic_kind,
        )
        .map((differentia) => ({ concept, differentia })),
    )[0];
    expect(crossKindLogical, "expected one cross-kind primary-backbone sibling pair").toBeDefined();
    expect(() =>
      validateSemanticDepthContracts(validationContext(artifact)),
    ).not.toThrow();
    if (crossModule === undefined) return;

    const invalidArtifact = {
      ...artifact,
      classes: artifact.classes.map((concept) =>
        concept.id === crossModule.concept.id
          ? {
              ...concept,
              sibling_differentiation: [{
                ...crossModule.differentia,
                sibling_concept_id: crossModule.differentia.shared_parent_concept_id,
              }],
            }
          : concept,
      ),
    };
    expect(() =>
      validateSemanticDepthContracts(validationContext(invalidArtifact)),
    ).toThrow(/both endpoints must share the accepted taxonomy parent or primary-backbone layout parent/iu);
  });

  it("uses multiple reviewed phrasings instead of one global sentence template", () => {
    const reviewedTexts = readOntology().classes.flatMap((concept) =>
      concept.status === "accepted"
        ? concept.sibling_differentiation.map(({ differentia }) => differentia)
        : [],
    );

    for (const language of languages) {
      const usedMarkers = new Set(
        reviewedTexts.flatMap((differentia) =>
          templateMarkers[language].filter((marker) =>
            differentia[language].startsWith(`${marker}：`) ||
            differentia[language].startsWith(`${marker}:`),
          ),
        ),
      );
      expect([...usedMarkers].sort()).toEqual([...templateMarkers[language]].sort());
    }
  });
});

describe("record and activity agency corrections", () => {
  const expectedRelations = [
    {
      oldId: "InstructionResolution-resolves-InstructionConflict",
      newId: "InstructionResolutionActivity-resolves-InstructionConflict",
      predicate: "resolves",
      sourceId: "InstructionResolutionActivity",
      targetId: "InstructionConflict",
      sourceKind: "activity",
      relationKind: "causal",
      layoutRole: "cross-link",
      layoutParentId: null,
      layoutChildId: null,
      moduleId: "info-prompts-instructions",
      facet: "recovery",
      affectedConceptIds: ["InstructionResolution", "InstructionResolutionActivity", "InstructionConflict"],
    },
    {
      oldId: "InstructionResolution-resolves-Instruction",
      newId: "InstructionResolution-records_effective-Instruction",
      predicate: "records_effective",
      sourceId: "InstructionResolution",
      targetId: "Instruction",
      sourceKind: "information",
      relationKind: "information",
      layoutRole: "cross-link",
      layoutParentId: null,
      layoutChildId: null,
      moduleId: "info-prompts-instructions",
      facet: "output",
      affectedConceptIds: ["Instruction", "InstructionResolution"],
    },
    {
      oldId: "DefenseFinding-triggers-MitigationAction",
      newId: "MitigationAction-addresses-DefenseFinding",
      predicate: "addresses",
      sourceId: "MitigationAction",
      targetId: "DefenseFinding",
      sourceKind: "activity",
      relationKind: "causal",
      layoutRole: "primary-backbone",
      layoutParentId: "DefenseFinding",
      layoutChildId: "MitigationAction",
      moduleId: "safety-injection-defense",
      facet: "recovery",
      affectedConceptIds: ["DefenseFinding", "MitigationAction"],
    },
    {
      oldId: "Measurement-measures-Metric",
      newId: "Measurement-conforms_to-Metric",
      predicate: "conforms_to",
      sourceId: "Measurement",
      targetId: "Metric",
      sourceKind: "information",
      relationKind: "governance",
      layoutRole: "cross-link",
      layoutParentId: null,
      layoutChildId: null,
      moduleId: "feedback-metrics-evaluation",
      facet: "output",
      affectedConceptIds: ["Measurement", "Metric"],
    },
    {
      oldId: "Feedback-triggers-MemoryWrite",
      newId: "MemoryWrite-responds_to-Feedback",
      predicate: "responds_to",
      sourceId: "MemoryWrite",
      targetId: "Feedback",
      sourceKind: "activity",
      relationKind: "causal",
      layoutRole: "cross-link",
      layoutParentId: null,
      layoutChildId: null,
      moduleId: "memory-lifecycle",
      facet: "input",
      affectedConceptIds: ["Feedback", "MemoryWrite"],
    },
  ] as const;

  it("deprecates every reviewed agency error and publishes exact replacements with reviewed evidence and examples", () => {
    const artifact = readOntology();
    const concepts = new Map(artifact.classes.map((concept) => [concept.id, concept]));
    const relations = new Map(artifact.relations.map((relation) => [relation.id, relation]));

    for (const expected of expectedRelations) {
      expect(relations.get(expected.oldId)).toMatchObject({
        status: "deprecated",
        replaced_by_ids: expect.arrayContaining([expected.newId]),
      });
      const replacement = relations.get(expected.newId);
      expect(replacement).toMatchObject({
        status: "accepted",
        predicate: expected.predicate,
        source_id: expected.sourceId,
        target_id: expected.targetId,
        relation_kind: expected.relationKind,
        layout_role: expected.layoutRole,
        layout_parent_id: expected.layoutParentId,
        layout_child_id: expected.layoutChildId,
      });
      expect(concepts.get(expected.sourceId)?.semantic_kind).toBe(expected.sourceKind);
      expect(replacement?.source_claims.length).toBeGreaterThan(0);
      expect(replacement?.examples.map(({ id }) => id)).toEqual([
        `${expected.newId}-example-positive-001`,
        `${expected.newId}-example-boundary-001`,
      ]);
      for (const language of languages) {
        expect(replacement?.definitions[language].length).toBeGreaterThan(24);
        expect(replacement?.examples[0]?.descriptions[language]).toContain(expected.predicate);
      }
      for (const example of replacement?.examples ?? []) {
        expect(example.related_relation_ids).toContain(expected.newId);
      }
    }

    for (const oldId of expectedRelations.map(({ oldId }) => oldId)) {
      expect(
        artifact.classes
          .filter(({ status }) => status === "accepted")
          .filter((concept) => JSON.stringify(concept).includes(oldId))
          .map(({ id }) => id),
      ).toEqual([]);
      expect(
        artifact.relations
          .filter(({ status }) => status === "accepted")
          .filter((relation) => JSON.stringify(relation).includes(oldId))
          .map(({ id }) => id),
      ).toEqual([]);
    }

    for (const expected of expectedRelations) {
      const conceptsReferencingReplacement = artifact.classes
        .filter(({ status }) => status === "accepted")
        .filter((concept) => JSON.stringify(concept).includes(expected.newId))
        .map(({ id }) => id);
      const endpointIds = new Set<string>([expected.sourceId, expected.targetId]);
      expect(conceptsReferencingReplacement.every((conceptId) =>
        endpointIds.has(conceptId)),
      `${expected.newId} endpoint narratives: ${conceptsReferencingReplacement.join(", ")}`).toBe(true);
    }

    const acceptedPayload = JSON.stringify({
      classes: artifact.classes.filter(({ status }) => status === "accepted"),
      relations: artifact.relations.filter(({ status }) => status === "accepted"),
    });
    for (const staleAssertion of [
      /InstructionResolution (?:—resolves→|resolves) InstructionConflict/iu,
      /InstructionResolution (?:—resolves→|resolves) Instruction\b/iu,
      /DefenseFinding (?:—triggers→|triggers) MitigationAction/iu,
      /Measurement (?:—measures→|measures) Metric/iu,
      /Feedback (?:—triggers→|triggers) MemoryWrite/iu,
    ]) {
      expect(acceptedPayload).not.toMatch(staleAssertion);
    }

    expect(
      concepts.get("DefenseFinding")?.structure?.required_relation_constraints ?? [],
    ).not.toContainEqual(expect.objectContaining({ predicate: "triggers" }));
    expect(
      concepts.get("MitigationAction")?.structure?.required_relation_constraints,
    ).toContainEqual({
      id: "mitigation-action-addresses-defense-finding",
      direction: "outgoing",
      predicate: "addresses",
      target_concept_id: "DefenseFinding",
      cardinality: { min: 1, max: 1 },
      explanations: expect.any(Object),
      source_claims: expect.any(Array),
    });
    expect(relations.get("MemoryWrite-responds_to-Feedback")?.conditions).toContainEqual({
      id: "MemoryWrite-responds_to-Feedback-condition-persistence-authorized",
      expression: expect.stringContaining("persistence policy"),
      severity: "error",
      expression_language: "plain",
      explanations: expect.any(Object),
      source_claims: expect.any(Array),
    });
  });

  it("never assigns execution agency to accepted information or specification sources", () => {
    const artifact = readOntology();
    const conceptById = new Map(artifact.classes.map((concept) => [concept.id, concept]));
    const nonAgentiveKinds = new Set(["information", "specification"]);
    const agencyRequiringPredicates = new Set([
      "applies",
      "calls",
      "captures",
      "consumes",
      "detects",
      "evaluates",
      "executes",
      "invokes",
      "measures",
      "optimizes",
      "produces",
      "publishes",
      "reads",
      "resolves",
      "retrieves",
      "routes",
      "scans",
      "selects",
      "suppresses",
      "triggers",
      "writes",
    ]);
    const violations = artifact.relations
      .filter(({ status }) => status === "accepted")
      .filter(({ predicate }) => agencyRequiringPredicates.has(predicate))
      .filter(({ source_id: sourceId }) =>
        nonAgentiveKinds.has(conceptById.get(sourceId)?.semantic_kind ?? ""),
      )
      .map(({ id }) => id)
      .sort();

    expect(violations).toEqual([]);
  });

  it("synchronizes interaction contracts, explicit backbone decisions, and the concept ledger", () => {
    for (const expected of expectedRelations) {
      const facet = ONTOLOGY_V3_INTERACTION_CONTRACTS[expected.moduleId]
        ?.facets[expected.facet];
      expect(facet?.relation_ids).toContain(expected.newId);
      expect(facet?.relation_ids).not.toContain(expected.oldId);
    }

    expect(ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS).toContainEqual([
      "MitigationAction-addresses-DefenseFinding",
      "primary-backbone",
      "DefenseFinding",
      "MitigationAction",
    ]);
    expect(ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS.map(([id]) => id)).not.toContain(
      "DefenseFinding-triggers-MitigationAction",
    );
    expect(ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS.map(([id]) => id)).not.toContain(
      "Measurement-measures-Metric",
    );

    const ledger = parseCsv(
      readFileSync(resolve("research/ontology-concept-semantic-depth-v3-ledger.csv")),
    );
    const byConceptId = new Map(ledger.map((row) => [row.concept_id, row]));
    expect(byConceptId.get("MitigationAction")?.proposed_backbone_relation_id).toBe(
      "MitigationAction-addresses-DefenseFinding",
    );
    expect(byConceptId.get("Metric")?.proposed_backbone_relation_id).toBe("");
    expect(byConceptId.get("Measurement")?.proposed_backbone_relation_id).toBe(
      "EvaluationRun-produces-Measurement",
    );
    for (const expected of expectedRelations) {
      const ledgerChange = `${expected.oldId}→${expected.newId}`;
      for (const conceptId of expected.affectedConceptIds) {
        expect(
          byConceptId.get(conceptId)?.required_relation_changes,
          `${conceptId} relation-replacement ledger`,
        ).toContain(ledgerChange);
      }
    }
  });
});
