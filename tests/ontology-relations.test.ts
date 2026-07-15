import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ONTOLOGY_V3_INTERACTION_CONTRACTS } from "../scripts/data/ontology-v3-interaction-contracts.mjs";
import { ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS } from "../scripts/data/ontology-v3-representative-inverse-readings.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

interface LocalizedText {
  zh?: unknown;
  en?: unknown;
  ja?: unknown;
}

interface SourceClaim {
  source_id?: unknown;
  supports?: unknown;
}

interface RelationCardinality {
  source: { min: number; max: number | null };
  target: { min: number; max: number | null };
}

interface RelationExample {
  id: string;
  kind: string;
  related_node_ids: string[];
  related_relation_ids: string[];
}

interface Relation {
  id: string;
  predicate: string;
  source_id: string;
  target_id: string;
  direction: string;
  relation_kind: string;
  definitions?: LocalizedText;
  cardinality?: RelationCardinality | null;
  cardinality_not_applicable_reason?: LocalizedText | null;
  inverse_reading?: { predicate: string; labels: LocalizedText; [key: string]: unknown };
  conditions?: unknown[];
  temporal_scope?: string;
  boundary_context?: {
    trust_boundary_concept_id: string;
    authority_basis: LocalizedText;
    protocol_or_resource_context: LocalizedText;
  } | null;
  constraints?: unknown[];
  examples?: RelationExample[];
  source_claims?: SourceClaim[];
  distinct_fact_rationale?: LocalizedText | null;
  status: string;
  replaced_by_ids?: string[];
}

interface Concept {
  id: string;
  module_id: string;
}

interface OntologyModule {
  id: string;
  plane_id: string;
  competency_questions?: Array<{
    id: string;
    positive_example_ids: string[];
  }>;
}

interface CandidateOntology {
  classes: Concept[];
  modules: OntologyModule[];
  relations: Relation[];
}

interface ModuleSource {
  source_kind: string;
  module: { id: string };
  classes: Concept[];
  relations: Relation[];
}

interface LocatedSourceRelation {
  path: string;
  moduleId: string;
  relation: Relation;
}

const repositoryRoot = process.cwd();
const candidatePath = ontologyArtifactPath();
const moduleSourceRoot = resolve(repositoryRoot, "ontology/source");

let cachedCandidate: CandidateOntology | undefined;
let cachedSourceRelations: LocatedSourceRelation[] | undefined;

const candidateOntology = (): CandidateOntology => {
  expect(
    existsSync(candidatePath),
    `Generate the strict candidate artifact before relation validation: ${candidatePath}`,
  ).toBe(true);
  cachedCandidate ??= JSON.parse(readFileSync(candidatePath, "utf8")) as CandidateOntology;
  return cachedCandidate;
};

const listJsonFiles = (root: string): string[] =>
  readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(root, entry.name);
      return entry.isDirectory()
        ? listJsonFiles(path)
        : entry.name.endsWith(".json")
          ? [path]
          : [];
    })
    .sort((left, right) => left.localeCompare(right));

const sourceRelations = (): LocatedSourceRelation[] => {
  cachedSourceRelations ??= listJsonFiles(moduleSourceRoot).flatMap((path) => {
    const value = JSON.parse(readFileSync(path, "utf8")) as Partial<ModuleSource>;
    if (value.source_kind !== "agent-ontology-module") return [];
    if (value.module === undefined || !Array.isArray(value.relations)) {
      throw new Error(`Malformed ontology Module source: ${path}`);
    }
    return value.relations.map((relation) => ({
      path: relative(repositoryRoot, path).replaceAll("\\", "/"),
      moduleId: value.module!.id,
      relation,
    }));
  });
  return cachedSourceRelations;
};

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isLocalized = (value: unknown): value is LocalizedText =>
  value !== null &&
  typeof value === "object" &&
  ["zh", "en", "ja"].every((language) =>
    hasText((value as Record<string, unknown>)[language]),
  );

const duplicateValues = (values: readonly string[]): string[] => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
};

const normalizedJson = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) {
      return item.map(normalize).sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
    }
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      );
    }
    return item;
  };
  return JSON.stringify(normalize(value));
};

const normalizedFactKey = (relation: Relation): string =>
  normalizedJson({
    source_id: relation.source_id,
    predicate: relation.predicate,
    target_id: relation.target_id,
    conditions: relation.conditions ?? [],
    temporal_scope: relation.temporal_scope ?? null,
  });

const reversePairKey = (relation: Relation): string =>
  [relation.source_id, relation.target_id].sort().join("\u0000");

const sameQualifiersAndEvidence = (left: Relation, right: Relation): boolean =>
  normalizedJson({
    cardinality: left.cardinality,
    conditions: left.conditions ?? [],
    temporal_scope: left.temporal_scope ?? null,
    boundary_context: left.boundary_context ?? null,
    constraints: left.constraints ?? [],
    source_claims: left.source_claims ?? [],
  }) ===
  normalizedJson({
    cardinality: right.cardinality,
    conditions: right.conditions ?? [],
    temporal_scope: right.temporal_scope ?? null,
    boundary_context: right.boundary_context ?? null,
    constraints: right.constraints ?? [],
    source_claims: right.source_claims ?? [],
  });

describe("candidate ontology relations", () => {
  it("resolves every relation endpoint to a canonical concept", () => {
    const ontology = candidateOntology();
    const conceptIds = new Set(ontology.classes.map((concept) => concept.id));
    const unresolved = ontology.relations.flatMap((relation) =>
      [relation.source_id, relation.target_id]
        .filter((id) => !conceptIds.has(id))
        .map((id) => `${relation.id}:${id}`),
    );

    expect(ontology.relations.length).toBeGreaterThan(0);
    expect(unresolved).toEqual([]);
  });

  it("preserves every source relation id, predicate, endpoint, and canonical direction", () => {
    const ontology = candidateOntology();
    const sourceById = new Map(sourceRelations().map((entry) => [entry.relation.id, entry.relation]));
    const missingOrChanged = ontology.relations.flatMap((relation) => {
      const source = sourceById.get(relation.id);
      return source !== undefined &&
        relation.predicate === source.predicate &&
        relation.source_id === source.source_id &&
        relation.target_id === source.target_id &&
        relation.direction === "source-to-target" &&
        source.direction === "source-to-target"
        ? []
        : [relation.id];
    });

    expect(duplicateValues(ontology.relations.map((relation) => relation.id))).toEqual([]);
    expect([...sourceById.keys()].sort()).toEqual(
      ontology.relations.map((relation) => relation.id).sort(),
    );
    expect(missingOrChanged).toEqual([]);
  });

  it("preserves multiple predicates between the same ordered endpoint pair", () => {
    const ontology = candidateOntology();
    const candidateById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const sourcePairGroups = new Map<string, LocatedSourceRelation[]>();
    for (const entry of sourceRelations()) {
      const pair = `${entry.relation.source_id}\u0000${entry.relation.target_id}`;
      sourcePairGroups.set(pair, [...(sourcePairGroups.get(pair) ?? []), entry]);
    }
    const missing = [...sourcePairGroups.values()]
      .filter((entries) => new Set(entries.map(({ relation }) => relation.predicate)).size > 1)
      .flatMap((entries) =>
        entries
          .filter(({ relation }) => {
            const candidate = candidateById.get(relation.id);
            return candidate?.predicate !== relation.predicate;
          })
          .map(({ relation }) => relation.id),
      );

    expect(missing).toEqual([]);
  });

  it("derives inverse reading from one assertion instead of referencing a second relation", () => {
    const invalid = candidateOntology().relations
      .filter(
        (relation) =>
          relation.inverse_reading === undefined ||
          !hasText(relation.inverse_reading.predicate) ||
          !isLocalized(relation.inverse_reading.labels) ||
          Object.hasOwn(relation.inverse_reading, "relation_id"),
      )
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("uses semantic inverse readings instead of mechanical inverse suffixes", () => {
    const relations = candidateOntology().relations;
    expect(
      relations
        .filter(
          (relation) =>
            relation.inverse_reading?.predicate === `${relation.predicate}_inverse`,
        )
        .map(({ id }) => id),
    ).toEqual([]);
    expect(
      relations.find(({ id }) => id === "MCPAdapter-is_a-ProtocolAdapter")
        ?.inverse_reading?.predicate,
    ).toBe("has_subtype");
  });

  it("stores concrete reviewed differentia on every is_a edge", () => {
    expect(
      candidateOntology().relations
        .filter(({ predicate }) => predicate === "is_a")
        .filter(({ definitions }) =>
          /with an accepted differentia/iu.test(String(definitions?.en)),
        )
        .map(({ id }) => id),
    ).toEqual([]);
  });

  it("rejects redundant reverse assertions with identical qualifiers and evidence", () => {
    const relations = candidateOntology().relations;
    const redundant = relations.flatMap((relation, index) =>
      relations.slice(index + 1).flatMap((candidate) => {
        const expressesStoredInverse =
          relation.source_id === candidate.target_id &&
          relation.target_id === candidate.source_id &&
          (relation.inverse_reading?.predicate === candidate.predicate ||
            candidate.inverse_reading?.predicate === relation.predicate);
        return expressesStoredInverse && sameQualifiersAndEvidence(relation, candidate)
          ? [`${relation.id}|${candidate.id}`]
          : [];
      }),
    );

    expect(redundant).toEqual([]);
  });

  it("requires a distinct-fact rationale for a second directional assertion", () => {
    const groups = new Map<string, Relation[]>();
    for (const relation of candidateOntology().relations.filter(
      ({ status }) => status === "accepted",
    )) {
      const key = reversePairKey(relation);
      groups.set(key, [...(groups.get(key) ?? []), relation]);
    }
    const invalid = [...groups.values()].flatMap((relations) => {
      const hasBothDirections = relations.some((left) =>
        relations.some(
          (right) =>
            left.id !== right.id &&
            left.source_id === right.target_id &&
            left.target_id === right.source_id,
        ),
      );
      if (!hasBothDirections) return [];
      return relations.some((relation) => isLocalized(relation.distinct_fact_rationale))
        ? []
        : [relations.map((relation) => relation.id).sort().join("|")];
    });

    expect(invalid).toEqual([]);
  });

  it("stores each relation once in the source concept's Module file", () => {
    const ontology = candidateOntology();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const sourceEntries = sourceRelations();
    const entriesById = new Map<string, LocatedSourceRelation[]>();
    for (const entry of sourceEntries) {
      entriesById.set(entry.relation.id, [...(entriesById.get(entry.relation.id) ?? []), entry]);
    }
    const invalid = ontology.relations.flatMap((relation) => {
      const entries = entriesById.get(relation.id) ?? [];
      const sourceConcept = conceptById.get(relation.source_id);
      return entries.length === 1 &&
        sourceConcept !== undefined &&
        entries[0].moduleId === sourceConcept.module_id
        ? []
        : [
            `${relation.id}:${sourceConcept?.module_id ?? "missing-source"}:${entries
              .map((entry) => `${entry.moduleId}@${entry.path}`)
              .join("|")}`,
          ];
    });

    expect(invalid).toEqual([]);
  });

  it("rejects the same normalized fact under different relation ids or source files", () => {
    const factOwners = new Map<string, LocatedSourceRelation[]>();
    for (const entry of sourceRelations()) {
      const key = normalizedFactKey(entry.relation);
      factOwners.set(key, [...(factOwners.get(key) ?? []), entry]);
    }
    const isReviewedLineageAliasGroup = (entries: LocatedSourceRelation[]) => {
      const accepted = entries.filter(({ relation }) => relation.status === "accepted");
      const deprecated = entries.filter(({ relation }) => relation.status === "deprecated");
      return accepted.length === 1 &&
        deprecated.length === entries.length - 1 &&
        deprecated.every(({ relation }) =>
          (relation.examples?.length ?? 0) === 0 &&
          (relation.replaced_by_ids ?? []).includes(accepted[0].relation.id),
        );
    };
    const duplicates = [...factOwners.values()]
      .filter((entries) => entries.length > 1 && !isReviewedLineageAliasGroup(entries))
      .map((entries) =>
        entries.map((entry) => `${entry.relation.id}@${entry.path}`).sort().join("|"),
      );

    expect(duplicates).toEqual([]);
  });

  it("keeps relation cardinality minimums less than or equal to known maximums", () => {
    const invalid = candidateOntology().relations.flatMap((relation) => {
      if (relation.cardinality === null || relation.cardinality === undefined) return [];
      return (Object.entries(relation.cardinality) as Array<
        ["source" | "target", { min: number; max: number | null }]
      >)
        .filter(([, bound]) => bound.max !== null && bound.min > bound.max)
        .map(([endpoint]) => `${relation.id}:${endpoint}`);
    });

    expect(invalid).toEqual([]);
  });

  it("distinguishes an unknown maximum from cardinality not applicable", () => {
    const invalid = candidateOntology().relations
      .filter((relation) => {
        if (relation.cardinality === undefined) return true;
        if (relation.cardinality === null) {
          return !isLocalized(relation.cardinality_not_applicable_reason);
        }
        const hasUnknownMaximum =
          relation.cardinality.source.max === null || relation.cardinality.target.max === null;
        return relation.cardinality_not_applicable_reason !== null ||
          (hasUnknownMaximum && relation.cardinality === null);
      })
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("requires a localized reason whenever cardinality is not applicable", () => {
    const invalid = candidateOntology().relations
      .filter(
        (relation) =>
          relation.cardinality === null &&
          !isLocalized(relation.cardinality_not_applicable_reason),
      )
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("gives conditional may-relations explicit machine-readable conditions", () => {
    const invalid = candidateOntology().relations
      .filter((relation) => relation.predicate.startsWith("may_"))
      .filter((relation) => (relation.conditions?.length ?? 0) === 0)
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("uses reviewed inverse predicates for every Module representative relation", () => {
    const ontology = candidateOntology();
    const relationById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const invalid = ontology.modules.flatMap((module) => {
      const relationId = ONTOLOGY_V3_INTERACTION_CONTRACTS[module.id]
        ?.representative_relation_id;
      const relation = relationId ? relationById.get(relationId) : undefined;
      const expected = relationId
        ? ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS[relationId]
        : undefined;
      return relation && expected &&
        relation.inverse_reading?.predicate === expected.predicate &&
        JSON.stringify(relation.inverse_reading.labels) === JSON.stringify(expected.labels)
        ? []
        : [`${module.id}:${relationId ?? "missing"}`];
    });

    expect(invalid).toEqual([]);
  });

  it("rejects invented instance cardinality on is_a relations", () => {
    const invalid = candidateOntology().relations
      .filter(
        (relation) =>
          relation.predicate === "is_a" &&
          (relation.cardinality !== null ||
            !isLocalized(relation.cardinality_not_applicable_reason)),
      )
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("requires accepted relations to have trilingual definitions and direct source claims", () => {
    const invalid = candidateOntology().relations
      .filter((relation) => relation.status === "accepted")
      .filter(
        (relation) =>
          !isLocalized(relation.definitions) ||
          (relation.source_claims?.length ?? 0) === 0 ||
          !(relation.source_claims ?? []).every((claim) => hasText(claim.supports)),
      )
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("requires accepted relations to have positive and counterexample information", () => {
    const invalid = candidateOntology().relations
      .filter((relation) => relation.status === "accepted")
      .filter((relation) => {
        const kinds = new Set((relation.examples ?? []).map((example) => example.kind));
        return !kinds.has("positive") ||
          (!kinds.has("counterexample") && !kinds.has("boundary"));
      })
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("keeps every relation-owned example aligned to the owner relation and both endpoints", () => {
    const invalid = sourceRelations().flatMap(({ path, relation }) =>
      (relation.examples ?? []).flatMap((example) => {
        const ownsRelation = example.related_relation_ids.includes(relation.id);
        const ownsEndpoints =
          example.related_node_ids.includes(relation.source_id) &&
          example.related_node_ids.includes(relation.target_id);
        return ownsRelation && ownsEndpoints
          ? []
          : [`${relative(repositoryRoot, path)}:${relation.id}:${example.id}`];
      }),
    );

    expect(invalid).toEqual([]);
  });

  it("requires every non-hierarchy cross-Domain relation to identify boundary context", () => {
    const ontology = candidateOntology();
    const moduleById = new Map(ontology.modules.map((module) => [module.id, module]));
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const conceptIds = new Set(ontology.classes.map((concept) => concept.id));
    const invalid = ontology.relations
      .filter((relation) => {
        if (relation.relation_kind === "hierarchy") return false;
        const sourcePlane = moduleById.get(conceptById.get(relation.source_id)?.module_id ?? "")?.plane_id;
        const targetPlane = moduleById.get(conceptById.get(relation.target_id)?.module_id ?? "")?.plane_id;
        return sourcePlane !== undefined && targetPlane !== undefined && sourcePlane !== targetPlane;
      })
      .filter(
        (relation) =>
          relation.boundary_context === null ||
          relation.boundary_context === undefined ||
          !conceptIds.has(relation.boundary_context.trust_boundary_concept_id) ||
          !isLocalized(relation.boundary_context.authority_basis) ||
          !isLocalized(relation.boundary_context.protocol_or_resource_context),
      )
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("removes generated module_relates and module_emits_event placeholders", () => {
    const placeholderId = /_(?:relates|emits_event)$/;
    const invalid = candidateOntology().relations
      .filter(
        (relation) =>
          ["module_relates", "module_emits_event"].includes(relation.predicate) ||
          placeholderId.test(relation.id),
      )
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("keeps every is_a relation in the hierarchy relation kind", () => {
    const invalid = candidateOntology().relations
      .filter(
        (relation) =>
          (relation.predicate === "is_a") !== (relation.relation_kind === "hierarchy"),
      )
      .map((relation) => relation.id);

    expect(invalid).toEqual([]);
  });

  it("represents reciprocal readings once instead of publishing inverse shadow edges", () => {
    const relationsById = new Map(
      sourceRelations().map(({ relation }) => [relation.id, relation]),
    );
    const reciprocalReadings = [
      ["Adapter-governed_by-MappingRule", "MappingRule-governs-Adapter", "governed_by"],
      ["correction_triggered_by_feedback", "Feedback-motivates-Correction", "motivated_by"],
      ["observed_as_context_input", "ContextIngressEvent-makes_available-CommandOutputObservation", "made_available_by"],
      ["uses_protocol_envelope", "ProtocolEnvelope-wraps-Message", "wrapped_by"],
      ["trace_event_belongs_to_span", "TraceSpan-records_event-TraceEvent", "belongs_to_span"],
      ["constrained_by_runtime_budget", "RuntimeBudget-constrains-RunAttempt", "constrained_by"],
      ["tool_candidate_ranked_by_match", "ToolMatch-assesses-ToolCandidate", "assessed_by"],
      ["tool_error_caused_by_attempt", "ToolCallAttempt-emits_diagnostic-ToolError", "emitted_by"],
      ["MCPSession-has_participant-MCPClient", "mcp_client_opens_session", "opened_by_client"],
      ["tool_definition_deprecated_by", "ToolDeprecationNotice-deprecates-ToolDefinition", "deprecated_by"],
    ] as const;

    const invalid = reciprocalReadings.flatMap(
      ([removedId, retainedId, expectedInverse]) => {
        const retained = relationsById.get(retainedId);
        return [
          ...(relationsById.has(removedId) ? [`duplicate:${removedId}`] : []),
          ...(!retained ? [`missing:${retainedId}`] : []),
          ...(retained?.inverse_reading?.predicate !== expectedInverse
            ? [`inverse:${retainedId}:${retained?.inverse_reading?.predicate ?? "missing"}`]
            : []),
        ];
      },
    );

    expect(invalid).toEqual([]);
  });
});
