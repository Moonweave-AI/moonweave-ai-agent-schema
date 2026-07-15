import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type SourceClaim = Readonly<{
  source_id: string;
  supports: string;
  evidence_kind: string;
}>;

type LocalizedText = Readonly<{ zh: string; en: string; ja: string }>;

type EvidenceOwner = Readonly<{
  id: string;
  source_claims?: readonly SourceClaim[];
  examples?: readonly EvidenceOwner[];
  change_note?: LocalizedText;
  review?: Readonly<{
    reviewers?: readonly Readonly<{
      reviewer_role?: string;
      decision_note?: LocalizedText;
    }>[];
  }>;
}>;

type StructureField = EvidenceOwner &
  Readonly<{
    allowed_values?: readonly EvidenceOwner[];
  }>;

type Concept = EvidenceOwner &
  Readonly<{
    module_id: string;
    semantic_kind: string;
    structure?: Readonly<{ fields: readonly StructureField[] }>;
  }>;

type Relation = EvidenceOwner &
  Readonly<{
    predicate: string;
    source_id: string;
    target_id: string;
    relation_kind: string;
    layout_role: string;
  }>;

type ModuleSource = Readonly<{
  module: Readonly<{ id: string }>;
  classes: readonly Concept[];
  relations: readonly Relation[];
}>;

const repositoryRoot = process.cwd();
const FORBIDDEN_PATTERN_ONLY_SOURCES = new Set([
  "eng-ont-cidoc-crm",
  "eng-ont-go-annotations",
  "eng-ont-go-overview",
]);

const parseCsvLine = (line: string): readonly string[] => {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error(`Unterminated CSV row: ${line}`);
  return [...cells, cell];
};

const registryRows = (() => {
  const [headerLine, ...lines] = readFileSync(
    resolve(repositoryRoot, "research/source-registry.csv"),
    "utf8",
  )
    .trim()
    .split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return Object.freeze(
      Object.fromEntries(headers.map((header, index) => [header, cells[index]])),
    ) as Readonly<Record<string, string>>;
  });
})();

const registryById = new Map(registryRows.map((row) => [row.id, row]));
const productDate = (
  JSON.parse(
    readFileSync(
      resolve(repositoryRoot, "ontology/source/agent-ontology.product.json"),
      "utf8",
    ),
  ) as Readonly<{ product: Readonly<{ date: string }> }>
).product.date;
const moduleCache = new Map<string, ModuleSource>();
const loadModule = (relativePath: string): ModuleSource => {
  const cached = moduleCache.get(relativePath);
  if (cached) return cached;
  const loaded = JSON.parse(
    readFileSync(resolve(repositoryRoot, "ontology/source", relativePath), "utf8"),
  ) as ModuleSource;
  moduleCache.set(relativePath, loaded);
  return loaded;
};

const sourceRoot = resolve(repositoryRoot, "ontology/source");
const modulePaths = readdirSync(sourceRoot)
  .filter((entry) => statSync(resolve(sourceRoot, entry)).isDirectory())
  .flatMap((plane) =>
    readdirSync(resolve(sourceRoot, plane))
      .filter((entry) => entry.endsWith(".json"))
      .map((entry) => `${plane}/${entry}`),
  )
  .sort();
const indexedRelationById = new Map(
  modulePaths.flatMap((path) => {
    const moduleSource = loadModule(path);
    return moduleSource.relations.map((relation) => [
      relation.id,
      Object.freeze({ relation, moduleId: moduleSource.module.id, path }),
    ] as const);
  }),
);

const claimErrors = (
  ownerLabel: string,
  owner: EvidenceOwner,
  allowedSourceIds: ReadonlySet<string>,
  allowedAreas: ReadonlySet<string>,
): readonly string[] => {
  const claims = owner.source_claims ?? [];
  if (claims.length === 0) return [`${ownerLabel}:missing-source-claim`];
  const rootOwnerId = ownerLabel.split(".")[0];
  const isContextualizedNestedClaim = (claim: SourceClaim): boolean =>
    claim.supports.startsWith(`Root object ${rootOwnerId}; nested object `) &&
    claim.supports.includes("Moonweave contextualization") &&
    claim.supports.includes("not an additional assertion");
  const errors = claims.flatMap((claim) => {
    const row = registryById.get(claim.source_id);
    const claimErrors: string[] = [];
    const contextualized = isContextualizedNestedClaim(claim);
    if (!row) claimErrors.push(`${ownerLabel}:${claim.source_id}:unregistered`);
    if (!contextualized && FORBIDDEN_PATTERN_ONLY_SOURCES.has(claim.source_id)) {
      claimErrors.push(`${ownerLabel}:${claim.source_id}:pattern-source-used-as-domain-evidence`);
    }
    if (!contextualized && !allowedSourceIds.has(claim.source_id)) {
      claimErrors.push(`${ownerLabel}:${claim.source_id}:source-id-outside-owner-whitelist`);
    }
    if (!contextualized && row && !allowedAreas.has(row.area)) {
      claimErrors.push(`${ownerLabel}:${claim.source_id}:${row.area}:source-domain-mismatch`);
    }
    return claimErrors;
  });
  const hasScopedAssertion = claims.some(
    (claim) =>
      allowedSourceIds.has(claim.source_id) &&
      allowedAreas.has(registryById.get(claim.source_id)?.area ?? ""),
  );
  const allClaimsAreExplicitContextualizations = claims.every(isContextualizedNestedClaim);
  if (!hasScopedAssertion && !allClaimsAreExplicitContextualizations) {
    errors.push(`${ownerLabel}:missing-owner-domain-assertion-or-contextualization`);
  }
  return errors;
};

const reviewTextForRole = (owner: EvidenceOwner, role: string): string =>
  (owner.review?.reviewers ?? [])
    .filter(({ reviewer_role: reviewerRole }) => reviewerRole === role)
    .map(({ decision_note: note }) => note?.en)
    .filter((value): value is string => Boolean(value))
    .join(" ");

const conceptReviewBoundaryErrors = (
  concept: Concept,
  moduleId: string,
): readonly string[] => {
  const domainReview = reviewTextForRole(concept, "domain");
  const ontologyReview = reviewTextForRole(concept, "ontology");
  return [
    domainReview.includes(`owned by ${moduleId}`) && domainReview.includes("use case")
      ? null
      : `${concept.id}:missing-domain-ownership-boundary`,
    ontologyReview.includes(`semantic kind=${concept.semantic_kind}`) &&
    ontologyReview.includes("canonical ID and unique owner remain stable")
      ? null
      : `${concept.id}:missing-ontology-identity-boundary`,
  ].filter((error): error is string => error !== null);
};

const relationReviewBoundaryErrors = (
  relation: Relation,
  moduleId: string,
): readonly string[] => {
  const domainReview = reviewTextForRole(relation, "domain");
  const ontologyReview = reviewTextForRole(relation, "ontology");
  return [
    domainReview.includes(`owned by ${moduleId}`) && domainReview.includes("use case")
      ? null
      : `${relation.id}:missing-domain-ownership-boundary`,
    ontologyReview.includes(`predicate ${relation.predicate}`) &&
    ontologyReview.includes(`direction ${relation.source_id} → ${relation.target_id}`) &&
    ontologyReview.includes(`relation kind ${relation.relation_kind}`) &&
    ontologyReview.includes(`layout role ${relation.layout_role}`)
      ? null
      : `${relation.id}:missing-ontology-direction-boundary`,
  ].filter((error): error is string => error !== null);
};

const fieldRules = [
  {
    path: "adapter/adapter-mapping-infrastructure.json",
    ownerId: "Adapter",
    fieldId: "adapter_family",
    expectedValues: 8,
    allowedAreas: new Set(["agent-protocols", "framework", "framework-runtime", "harness", "protocol"]),
    allowedSources: new Set([
      "eng-fw-crewai-docs",
      "eng-fw-deepagents-docs",
      "eng-fw-langgraph-graph-api",
      "eng-fw-openai-python-docs",
      "eng-proto-a2a-spec",
      "eng-proto-fipa-acl",
      "eng-proto-fipa-agent-management",
      "eng-proto-kqml-spec",
      "eng-proto-mcp-2025-spec",
    ]),
    valueSources: new Map([
      ["AdapterA2A", new Set(["eng-proto-a2a-spec"])],
      ["AdapterCrewAI", new Set(["eng-fw-crewai-docs"])],
      ["AdapterDeepAgents", new Set(["eng-fw-deepagents-docs"])],
      ["AdapterFIPA", new Set(["eng-proto-fipa-acl", "eng-proto-fipa-agent-management"])],
      ["AdapterKQML", new Set(["eng-proto-kqml-spec"])],
      ["AdapterLangGraph", new Set(["eng-fw-langgraph-graph-api"])],
      ["AdapterMCP", new Set(["eng-proto-mcp-2025-spec"])],
      ["AdapterOpenAIAgents", new Set(["eng-fw-openai-python-docs"])],
    ]),
  },
  {
    path: "runtime/runtime-artifacts.json",
    ownerId: "Artifact",
    fieldId: "visibility",
    expectedValues: 4,
    allowedAreas: new Set(["access-control"]),
    allowedSources: new Set(["eng-security-nist-abac"]),
  },
  {
    path: "runtime/runtime-execution-attempts.json",
    ownerId: "RunAttempt",
    fieldId: "status",
    expectedValues: 6,
    allowedAreas: new Set(["framework-runtime", "protocol"]),
    allowedSources: new Set([
      "eng-fw-langgraph-interrupts",
      "eng-proto-a2a-spec",
      "eng-proto-mcp-tasks-2025",
    ]),
  },
  {
    path: "tool/tool-mcp-transport.json",
    ownerId: "MCPTransport",
    fieldId: "transport_kind",
    expectedValues: 4,
    allowedAreas: new Set(["internet-standard", "protocol"]),
    allowedSources: new Set(["eng-proto-mcp-transports-2025", "eng-proto-websocket-rfc6455"]),
  },
  {
    path: "safety/safety-injection-defense.json",
    ownerId: "DefenseFinding",
    fieldId: "risk_level",
    expectedValues: 4,
    allowedAreas: new Set(["vulnerability-severity"]),
    allowedSources: new Set(["eng-security-cvss-v4"]),
  },
  {
    path: "safety/safety-permission-policy.json",
    ownerId: "PolicyDecision",
    fieldId: "decision_kind",
    expectedValues: 5,
    allowedAreas: new Set([
      "access-control",
      "framework-runtime",
      "policy-engine",
      "protocol-security",
    ]),
    allowedSources: new Set([
      "eng-fw-langgraph-interrupts",
      "eng-policy-opa",
      "eng-security-mcp-nsa-2026",
      "eng-security-nist-abac",
    ]),
  },
] as const;

const infoRelationRules = new Map<string, ReadonlySet<string>>([
  ["CommandOutputObservation-has_exit_status_observation-ExitStatusObservation", new Set(["eng-std-posix-shell-2024"])],
  ["has_stderr_chunk", new Set(["eng-std-posix-shell-2024"])],
  ["has_stdout_chunk", new Set(["eng-std-posix-shell-2024"])],
  ["ContextIngressEvent-makes_available-CommandOutputObservation", new Set(["lit-mech-compass"])],
  ["produced_by_command_execution", new Set(["eng-std-posix-shell-2024"])],
  ["summarized_as_context_input", new Set(["lit-mech-compass"])],
  ["has_source_reference", new Set(["eng-ont-prov-o", "eng-proto-mcp-2025-spec"])],
  ["redacted_by_policy", new Set(["eng-policy-opa"])],
  ["has_instruction_authority", new Set(["eng-spec-openai-model-2025-10-27"])],
  ["has_instruction_priority", new Set(["eng-spec-openai-model-2025-10-27"])],
  ["has_instruction_scope", new Set(["eng-spec-openai-model-2025-10-27"])],
  ["has_visible_window", new Set(["lit-mech-compass"])],
  ["InstructionOverride-overrides-Instruction", new Set(["eng-spec-openai-model-2025-10-27"])],
  ["Message-contains_content_block-ContentBlock", new Set(["eng-proto-mcp-2025-spec"])],
  ["part_of_conversation", new Set(["eng-proto-a2a-spec", "eng-proto-fipa-acl"])],
  ["ProtocolEnvelope-wraps-Message", new Set(["eng-proto-fipa-acl"])],
  ["cites_source", new Set(["eng-ont-prov-o"])],
  ["displayed_to_actor", new Set(["eng-security-nist-abac"])],
  ["released_to_boundary", new Set(["eng-security-nist-abac"])],
  ["suppressed_by_rule", new Set(["eng-policy-opa"])],
  ["has_checksum", new Set(["eng-proto-rfc9530-digest-fields"])],
  ["has_source_span", new Set(["eng-ont-prov-o"])],
  ["has_version", new Set(["eng-ont-prov-o"])],
  ["SourceReference-accessed_via-AccessPath", new Set(["eng-proto-mcp-2025-spec"])],
  ["SourceReference-located_at-SourceLocation", new Set(["eng-ont-prov-o"])],
]);

const sourceAreaWhitelist = new Set([
  "access-control",
  "agent-protocols",
  "command-runtime",
  "context",
  "information-provenance",
  "instruction-governance",
  "internet-standard",
  "policy-engine",
  "protocol",
  "provenance",
  "vulnerability-severity",
]);

const adapterRelationRules = new Map<string, ReadonlySet<string>>([
  ["maps_benchmark_score_to_metric", new Set(["eng-bench-osworld-site", "eng-bench-swebench-site"])],
  ["FrameworkHandoffMapping-maps_to-Handoff", new Set(["eng-fw-openai-handoffs"])],
  ["FrameworkTraceMapping-maps_to-TraceRecord", new Set(["eng-fw-openai-tracing"])],
  ["StatechartAdapter-maps_state_to-StateSnapshot", new Set(["eng-state-xstate-docs"])],
]);

describe("ontology source-claim domain relevance", () => {
  it("uses the FIBO engineering guide only for ontology-engineering constraints", () => {
    const sourceRoot = resolve(repositoryRoot, "ontology/source");
    const jsonFiles: string[] = [];
    const collectJsonFiles = (directory: string): void => {
      for (const entry of readdirSync(directory)) {
        const path = resolve(directory, entry);
        if (statSync(path).isDirectory()) collectJsonFiles(path);
        else if (entry.endsWith(".json")) jsonFiles.push(path);
      }
    };
    collectJsonFiles(sourceRoot);

    const violations: string[] = [];
    const inspect = (value: unknown, path: string, file: string): void => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach((item, index) => inspect(item, `${path}/${index}`, file));
        return;
      }
      const record = value as Readonly<Record<string, unknown>>;
      if (record.source_id === "eng-ont-fibo-ontology-guide") {
        const isProductEngineeringConstraint =
          file.endsWith("agent-ontology.product.json") &&
          path.startsWith("/global_constraints/");
        if (!isProductEngineeringConstraint) violations.push(`${file}:${path}`);
      }
      for (const [key, nested] of Object.entries(record)) {
        inspect(nested, `${path}/${key}`, file);
      }
    };

    for (const file of jsonFiles) {
      inspect(JSON.parse(readFileSync(file, "utf8")), "", file);
    }

    expect(violations).toEqual([]);
  });

  it("does not record source checks after the controlled product date", () => {
    const [headerLine, ...lines] = readFileSync(
      resolve(repositoryRoot, "research/living-source-metadata.csv"),
      "utf8",
    )
      .trim()
      .split(/\r?\n/);
    const headers = parseCsvLine(headerLine);
    const futureRows = lines.flatMap((line) => {
      const cells = parseCsvLine(line);
      const row = Object.fromEntries(
        headers.map((header, index) => [header, cells[index]]),
      ) as Readonly<Record<string, string>>;
      return row.last_checked > productDate
        ? [`${row.id}:${row.last_checked}>${productDate}`]
        : [];
    });

    expect(futureRows).toEqual([]);
  });

  it("grounds every reviewed controlled field and value in owner-domain sources", () => {
    const errors: string[] = [];
    let controlledValueCount = 0;
    for (const rule of fieldRules) {
      const concept = loadModule(rule.path).classes.find(({ id }) => id === rule.ownerId);
      const field = concept?.structure?.fields.find(({ id }) => id === rule.fieldId);
      if (!field) {
        errors.push(`${rule.ownerId}.${rule.fieldId}:missing`);
        continue;
      }
      controlledValueCount += field.allowed_values?.length ?? 0;
      if ((field.allowed_values?.length ?? 0) !== rule.expectedValues) {
        errors.push(`${rule.ownerId}.${rule.fieldId}:expected-${rule.expectedValues}-values`);
      }
      errors.push(
        ...claimErrors(
          `${rule.ownerId}.${rule.fieldId}`,
          field,
          rule.allowedSources,
          rule.allowedAreas,
        ),
      );
      for (const value of field.allowed_values ?? []) {
        const valueSources = "valueSources" in rule
          ? rule.valueSources.get(value.id) ?? new Set<string>()
          : rule.allowedSources;
        errors.push(
          ...claimErrors(
            `${rule.ownerId}.${rule.fieldId}.${value.id}`,
            value,
            valueSources,
            rule.allowedAreas,
          ),
        );
      }
    }
    expect(controlledValueCount).toBe(
      fieldRules.reduce((total, { expectedValues }) => total + expectedValues, 0),
    );
    expect(errors).toEqual([]);
  });

  it("does not retain Gene Ontology annotations as evidence for the six domain fields", () => {
    const fieldIds = new Set([
      "adapter_family",
      "visibility",
      "status",
      "transport_kind",
      "risk_level",
      "decision_kind",
    ]);
    const errors: string[] = [];
    const inspect = (value: unknown, path: string): void => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach((item, index) => inspect(item, `${path}[${index}]`));
        return;
      }
      const record = value as Readonly<Record<string, unknown>>;
      if (Array.isArray(record.source_claims)) {
        for (const claim of record.source_claims as readonly SourceClaim[]) {
          const claimedField = [...fieldIds].find((fieldId) => claim.supports.includes(fieldId));
          if (claimedField && FORBIDDEN_PATTERN_ONLY_SOURCES.has(claim.source_id)) {
            errors.push(`${path}:${claimedField}:${claim.source_id}`);
          }
        }
      }
      for (const [key, nested] of Object.entries(record)) inspect(nested, `${path}.${key}`);
    };

    for (const rule of fieldRules) inspect(loadModule(rule.path), rule.path);
    expect(errors).toEqual([]);
  });

  it("separates domain ownership review from ontology identity and direction review", () => {
    const errors: string[] = [];
    for (const rule of fieldRules) {
      const moduleSource = loadModule(rule.path);
      const concept = moduleSource.classes.find(({ id }) => id === rule.ownerId);
      if (!concept) errors.push(`${rule.ownerId}:missing`);
      else errors.push(...conceptReviewBoundaryErrors(concept, moduleSource.module.id));
    }

    for (const relationId of [...infoRelationRules.keys(), ...adapterRelationRules.keys()]) {
      const indexed = indexedRelationById.get(relationId);
      if (!indexed) errors.push(`${relationId}:missing`);
      else errors.push(...relationReviewBoundaryErrors(indexed.relation, indexed.moduleId));
    }

    expect(errors).toEqual([]);
  });

  it("grounds every reviewed information-flow relation and case in predicate-specific evidence", () => {
    const errors: string[] = [];
    for (const [relationId, allowedSources] of infoRelationRules) {
      const indexed = indexedRelationById.get(relationId);
      if (!indexed) {
        errors.push(`${relationId}:missing`);
        continue;
      }
      const { relation } = indexed;
      errors.push(
        ...claimErrors(relationId, relation, allowedSources, sourceAreaWhitelist),
      );
      for (const example of relation.examples ?? []) {
        errors.push(
          ...claimErrors(`${relationId}.${example.id}`, example, allowedSources, sourceAreaWhitelist),
        );
      }
    }
    expect(infoRelationRules.size).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  it("uses benchmark, framework, and statechart sources for reviewed adapter mappings", () => {
    const allowedAreas = new Set(["benchmark", "framework", "observability", "statecharts"]);
    const errors: string[] = [];
    for (const [relationId, allowedSources] of adapterRelationRules) {
      const indexed = indexedRelationById.get(relationId);
      if (!indexed) {
        errors.push(`${relationId}:missing`);
        continue;
      }
      const { relation } = indexed;
      errors.push(...claimErrors(relationId, relation, allowedSources, allowedAreas));
      for (const example of relation.examples ?? []) {
        errors.push(
          ...claimErrors(`${relationId}.${example.id}`, example, allowedSources, allowedAreas),
        );
      }
    }
    expect(adapterRelationRules.size).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});
