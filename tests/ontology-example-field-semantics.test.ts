import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

interface SourceExample {
  readonly id: string;
  readonly kind: string;
  readonly field_values: Readonly<Record<string, unknown>>;
}

interface SourceConcept {
  readonly id: string;
  readonly status: string;
  readonly examples: readonly SourceExample[];
}

interface SourceRelation {
  readonly predicate: string;
  readonly source_id: string;
  readonly target_id: string;
  readonly status: string;
}

interface SourceModule {
  readonly classes?: readonly SourceConcept[];
  readonly relations?: readonly SourceRelation[];
}

interface SemanticProfile {
  readonly fields: Readonly<Record<string, unknown>>;
  readonly instanceFields?: Readonly<Record<string, unknown>>;
  readonly caseFragmentFields?: Readonly<Record<string, unknown>>;
  readonly absentFields?: readonly string[];
}

const sourceRoot = resolve(import.meta.dirname, "../ontology/source");

const sourceModules = (): readonly SourceModule[] =>
  readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((plane) =>
      readdirSync(resolve(sourceRoot, plane.name))
        .filter((name) => name.endsWith(".json"))
        .flatMap((name) => {
          const source = JSON.parse(
            readFileSync(resolve(sourceRoot, plane.name, name), "utf8"),
          ) as SourceModule;
          return source;
        }),
    );

const modules = sourceModules();
const concepts = modules.flatMap(({ classes = [] }) => classes);
const relations = modules.flatMap(({ relations: moduleRelations = [] }) => moduleRelations);
const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
const acceptedParentByChild = new Map(
  relations
    .filter(({ predicate, status }) => predicate === "is_a" && status === "accepted")
    .map(({ source_id: childId, target_id: parentId }) => [childId, parentId]),
);

const descendantsOf = (rootId: string): ReadonlySet<string> => {
  const descendants = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [childId, parentId] of acceptedParentByChild) {
      if (descendants.has(parentId) && !descendants.has(childId)) {
        descendants.add(childId);
        changed = true;
      }
    }
  }
  return descendants;
};

const membershipExamples = (conceptId: string): readonly SourceExample[] =>
  (conceptById.get(conceptId)?.examples ?? []).filter(({ kind }) =>
    ["positive", "instance", "case-fragment"].includes(kind),
  );

const exampleProfile = (
  fields: Readonly<Record<string, unknown>>,
  options: Omit<SemanticProfile, "fields"> = {},
): SemanticProfile => ({ fields, ...options });

const semanticProfiles = {
  CommitDenial: exampleProfile({
    decision_kind: "deny",
    decision_id: "commit-denial-001",
    reason: "requested commit contains a path outside the approved repository scope",
  }),
  DenyDecision: exampleProfile({
    decision_kind: "deny",
    decision_id: "policy-deny-001",
    reason: "protected resource is outside the actor's authorized scope",
  }),
  EscalationDecision: exampleProfile({
    decision_kind: "escalate",
    decision_id: "policy-escalation-001",
    reason: "human approval is required before the network side effect",
  }),

  Actor: exampleProfile(
    { actor_id: "actor-reviewer-001", actor_kind: "human" },
    { instanceFields: { display_name: "Ontology reviewer" } },
  ),
  AgentActor: exampleProfile(
    { actor_id: "actor-agent-001", actor_kind: "software" },
    { instanceFields: { display_name: "Ontology audit agent" } },
  ),
  DeveloperActor: exampleProfile(
    { actor_id: "actor-developer-001", actor_kind: "human" },
    { instanceFields: { display_name: "Ontology developer" } },
  ),
  ExternalServiceActor: exampleProfile(
    { actor_id: "actor-external-service-001", actor_kind: "external-service" },
    { instanceFields: { display_name: "External retrieval service" } },
  ),
  HumanActor: exampleProfile(
    { actor_id: "actor-human-001", actor_kind: "human" },
    { instanceFields: { display_name: "Human participant" } },
  ),
  HumanOperator: exampleProfile(
    { actor_id: "actor-operator-001", actor_kind: "human" },
    { instanceFields: { display_name: "Runtime operator" } },
  ),
  ModelActor: exampleProfile(
    { actor_id: "actor-model-001", actor_kind: "software" },
    { instanceFields: { display_name: "Generation model service" } },
  ),
  ReviewerActor: exampleProfile(
    { actor_id: "actor-reviewer-001", actor_kind: "human" },
    { instanceFields: { display_name: "Ontology reviewer" } },
  ),
  SoftwareActor: exampleProfile(
    { actor_id: "actor-software-001", actor_kind: "software" },
    { instanceFields: { display_name: "Agent runtime process" } },
  ),
  SystemServiceActor: exampleProfile(
    { actor_id: "actor-system-service-001", actor_kind: "software" },
    { instanceFields: { display_name: "Runtime scheduler service" } },
  ),
  ToolServiceActor: exampleProfile(
    { actor_id: "actor-tool-service-001", actor_kind: "software" },
    { instanceFields: { display_name: "Document search tool service" } },
  ),
  UserActor: exampleProfile(
    { actor_id: "actor-user-001", actor_kind: "human" },
    { instanceFields: { display_name: "Requesting user" } },
  ),

  MemoryCompaction: exampleProfile({
    operation_id: "memory-op-compaction-001",
    reason: "context budget requires provenance-preserving compaction",
  }),
  MemoryConsolidation: exampleProfile({
    operation_id: "memory-op-consolidation-001",
    reason: "related episodic records are consolidated into a semantic summary",
  }),
  MemoryDecay: exampleProfile({
    operation_id: "memory-op-decay-001",
    reason: "retrieval weight is reduced after the freshness threshold elapsed",
  }),
  MemoryDelete: exampleProfile({
    operation_id: "memory-op-delete-001",
    reason: "a user deletion request requires a tombstone version",
  }),
  MemoryDiscard: exampleProfile({
    operation_id: "memory-op-discard-001",
    reason: "the candidate is rejected before persistence because provenance is insufficient",
  }),
  MemoryEviction: exampleProfile({
    operation_id: "memory-op-eviction-001",
    reason: "the active store exceeds its capacity budget",
  }),
  MemoryExpiration: exampleProfile({
    operation_id: "memory-op-expiration-001",
    reason: "the retention window for this record has elapsed",
  }),
  MemoryMerge: exampleProfile({
    operation_id: "memory-op-merge-001",
    reason: "duplicate records share compatible provenance and content",
  }),
  MemoryReflection: exampleProfile({
    operation_id: "memory-op-reflection-001",
    reason: "observable episodes support a higher-level reusable lesson",
  }),
  MemorySupersession: exampleProfile({
    operation_id: "memory-op-supersession-001",
    reason: "a newer higher-authority record replaces the prior version",
  }),
  MemoryValidation: exampleProfile({
    operation_id: "memory-op-validation-001",
    reason: "provenance and freshness must be checked before reuse",
  }),
  MemoryWrite: exampleProfile(
    {
      operation_id: "memory-op-write-001",
      reason: "an approved tool result is eligible for durable memory",
    },
    {
      caseFragmentFields: {
        operation_id: "memory-op-defect-MWA-217-write",
        reason:
          "verified software-defect repair outcome is eligible for durable project memory",
        input_version: 0,
        output_version: 1,
      },
    },
  ),

  CapabilitySelectionDecision: exampleProfile({
    selection_id: "selection-capability-001",
    reason: "best capability match after permission filtering",
  }),
  PromptSelectionDecision: exampleProfile({
    selection_id: "selection-prompt-001",
    reason: "prompt template matches the task intent and required arguments",
  }),
  ResourceSelectionDecision: exampleProfile({
    selection_id: "selection-resource-001",
    reason: "authorized resource is the freshest relevant context source",
  }),

  FrameworkAdapter: exampleProfile(
    {
      adapter_id: "adapter-framework",
      scope: ["agent", "tool", "workflow", "handoff", "trace"],
    },
    { absentFields: ["adapter_family"] },
  ),
  CrewAIAdapter: exampleProfile({
    adapter_id: "adapter-crewai",
    scope: ["agents", "tasks", "crews", "flows", "delegation"],
  }, { instanceFields: { adapter_family: "crew-ai" } }),
  DeepAgentsAdapter: exampleProfile({
    adapter_id: "adapter-deep-agents",
    scope: ["planning", "subagents", "filesystem-context", "delegation"],
  }, { instanceFields: { adapter_family: "deep-agents" } }),
  LangChainAdapter: exampleProfile(
    {
      adapter_id: "adapter-langchain",
      scope: ["agents", "tools", "messages", "middleware"],
    },
    { absentFields: ["adapter_family"] },
  ),
  LangGraphAdapter: exampleProfile({
    adapter_id: "adapter-langgraph",
    scope: ["graphs", "nodes", "state", "checkpoints", "handoffs"],
  }, { instanceFields: { adapter_family: "lang-graph" } }),
  MicrosoftAgentFrameworkAdapter: exampleProfile(
    {
      adapter_id: "adapter-microsoft-agent-framework",
      scope: ["agents", "workflows", "handoffs", "observability"],
    },
    { absentFields: ["adapter_family"] },
  ),
  OpenAIAgentsAdapter: exampleProfile({
    adapter_id: "adapter-openai-agents",
    scope: ["agents", "tools", "handoffs", "sessions", "traces"],
  }, { instanceFields: { adapter_family: "open-aiagents" } }),
  FIPAAdapter: exampleProfile({
    adapter_id: "adapter-fipa",
    scope: ["message", "communicative-act", "conversation", "agent-management"],
  }, { instanceFields: { adapter_family: "fipa" } }),
  KQMLAdapter: exampleProfile({
    adapter_id: "adapter-kqml",
    scope: ["message", "performative", "conversation", "routing"],
  }, { instanceFields: { adapter_family: "kqml" } }),
  MCPAdapter: exampleProfile({
    adapter_family: "mcp",
    adapter_id: "adapter-mcp",
    scope: ["tools", "resources", "prompts"],
  }),

  AgencyBenchAdapter: exampleProfile(
    {
      adapter_id: "adapter-agencybench",
      scope: ["task", "environment", "trajectory", "metric", "outcome"],
      benchmark_version: "AgencyBench@git-ec65324be69e",
    },
    { absentFields: ["adapter_family"] },
  ),
  BenchmarkAdapter: exampleProfile(
    {
      adapter_id: "adapter-swebench",
      scope: ["task", "repository-environment", "patch-test-trajectory", "metric", "outcome"],
      benchmark_version: "SWE-bench Verified@2026-06",
    },
    { absentFields: ["adapter_family"] },
  ),
  AppWorldAdapter: exampleProfile(
    {
      adapter_id: "adapter-appworld",
      scope: ["task", "application-environment", "api-trajectory", "metric", "outcome"],
      benchmark_version: "AppWorld@git-a072b7a86e7c",
    },
    { absentFields: ["adapter_family"] },
  ),
  OSWorldAdapter: exampleProfile(
    {
      adapter_id: "adapter-osworld",
      scope: ["task", "desktop-environment", "action-trajectory", "metric", "outcome"],
      benchmark_version: "OSWorld@2.0",
    },
    { absentFields: ["adapter_family"] },
  ),
  SWEBenchAdapter: exampleProfile(
    {
      adapter_id: "adapter-swebench",
      scope: ["task", "repository-environment", "patch-test-trajectory", "metric", "outcome"],
      benchmark_version: "SWE-bench Verified@reviewed-2026-06-30",
    },
    { absentFields: ["adapter_family"] },
  ),
  Tau2Adapter: exampleProfile(
    {
      adapter_id: "adapter-tau2",
      scope: ["task", "simulator-environment", "tool-trajectory", "metric", "outcome"],
      benchmark_version: "tau2-bench@reviewed-2026-06-30",
    },
    { absentFields: ["adapter_family"] },
  ),
  TerminalBenchAdapter: exampleProfile(
    {
      adapter_id: "adapter-terminal-bench",
      scope: ["task", "terminal-environment", "command-trajectory", "metric", "outcome"],
      benchmark_version: "Terminal-Bench@2.1",
    },
    { absentFields: ["adapter_family"] },
  ),

  SCXMLAdapter: exampleProfile(
    {
      adapter_id: "adapter-scxml",
      scope: ["states", "transitions", "events", "guards", "actions", "history"],
      dialect_version: "SCXML-1.0",
    },
    { absentFields: ["adapter_family"] },
  ),
  StatechartAdapter: exampleProfile(
    {
      adapter_id: "adapter-scxml",
      scope: ["states", "transitions", "events", "guards", "actions", "history"],
      dialect_version: "SCXML-1.0",
    },
    { absentFields: ["adapter_family"] },
  ),
  XStateAdapter: exampleProfile(
    {
      adapter_id: "adapter-xstate",
      scope: ["machines", "actors", "states", "events", "guards", "actions", "snapshots"],
      dialect_version: "XState-5",
      round_trip_loss: "JavaScript action bodies and runtime actor references remain external",
    },
    { absentFields: ["adapter_family"] },
  ),

  FrontendViewAdapter: exampleProfile(
    {
      adapter_id: "adapter-explorer-view",
      scope: ["localized-labels", "filters", "inspector-panels"],
      schema_version: "explorer-view@2",
    },
    { absentFields: ["adapter_family"] },
  ),
  GraphIRAdapter: exampleProfile(
    {
      adapter_id: "adapter-graph-ir",
      scope: ["nodes", "relations", "provenance", "annotations"],
      schema_version: "graph-ir@2",
    },
    { absentFields: ["adapter_family"] },
  ),
  JSONSchemaAdapter: exampleProfile(
    {
      adapter_id: "adapter-json-schema",
      scope: ["fields", "requiredness", "constraints", "controlled-values"],
      schema_version: "JSON-Schema-2020-12",
    },
    { absentFields: ["adapter_family"] },
  ),
  OWLExportAdapter: exampleProfile(
    {
      adapter_id: "adapter-owl",
      scope: ["classes", "object-properties", "iris", "axioms"],
      schema_version: "OWL2",
    },
    { absentFields: ["adapter_family"] },
  ),
  PydanticProfileAdapter: exampleProfile(
    {
      adapter_id: "adapter-pydantic",
      scope: ["python-models", "field-constraints", "enums", "validation"],
      schema_version: "Pydantic-2",
    },
    { absentFields: ["adapter_family"] },
  ),
  SchemaAdapter: exampleProfile(
    {
      adapter_id: "adapter-json-schema",
      scope: ["fields", "requiredness", "constraints", "controlled-values"],
      schema_version: "JSON-Schema-2020-12",
    },
    { absentFields: ["adapter_family"] },
  ),
  SHACLExportAdapter: exampleProfile(
    {
      adapter_id: "adapter-shacl",
      scope: ["node-shapes", "property-paths", "cardinalities", "constraints"],
      schema_version: "SHACL-1.0",
    },
    { absentFields: ["adapter_family"] },
  ),
  ShExExportAdapter: exampleProfile(
    {
      adapter_id: "adapter-shex",
      scope: ["rdf-node-shapes", "property-constraints", "cardinalities"],
      schema_version: "ShEx-2.1",
    },
    { absentFields: ["adapter_family"] },
  ),
  ZodProfileAdapter: exampleProfile(
    {
      adapter_id: "adapter-zod",
      scope: ["typescript-fields", "unions", "enums", "refinements"],
      schema_version: "Zod-4",
    },
    { absentFields: ["adapter_family"] },
  ),
} as const satisfies Readonly<Record<string, SemanticProfile>>;

describe("accepted Concept example field semantics", () => {
  it("uses subtype-specific field values instead of copied sibling defaults", () => {
    expect(Object.keys(semanticProfiles)).toHaveLength(59);

    for (const [conceptId, profile] of Object.entries(semanticProfiles)) {
      const concept = conceptById.get(conceptId);
      expect(concept, conceptId).toBeDefined();
      expect(concept?.status, conceptId).toBe("accepted");
      if (concept === undefined) continue;

      const attachedExamples = concept.examples.filter(({ kind }) =>
        ["positive", "instance"].includes(kind),
      );
      expect(attachedExamples.map(({ kind }) => kind).sort(), conceptId).toEqual([
        "instance",
        "positive",
      ]);

      for (const example of attachedExamples) {
        expect(example.field_values, `${conceptId}/${example.id}`).toMatchObject(
          profile.fields,
        );
        if (example.kind === "instance" && profile.instanceFields !== undefined) {
          expect(example.field_values, `${conceptId}/${example.id}`).toMatchObject(
            profile.instanceFields,
          );
        }
        for (const fieldId of profile.absentFields ?? []) {
          expect(
            Object.hasOwn(example.field_values, fieldId),
            `${conceptId}/${example.id}/${fieldId}`,
          ).toBe(false);
        }
      }

      if (profile.caseFragmentFields !== undefined) {
        const caseFragments = concept.examples.filter(
          ({ kind }) => kind === "case-fragment",
        );
        expect(caseFragments, `${conceptId}/case-fragments`).toHaveLength(1);
        expect(
          caseFragments[0]?.field_values,
          `${conceptId}/${caseFragments[0]?.id}`,
        ).toMatchObject(profile.caseFragmentFields);
      }
    }
  });

  it("retains concrete parent examples only where the value is valid for that parent", () => {
    const validConcreteParentExamples = {
      PolicyDecision: { decision_kind: "allow" },
      Actor: { actor_kind: "human" },
      MemoryOperation: { operation_id: "memory-op-update-001" },
      SelectionDecision: { selection_id: "selection-tool-001" },
      ProtocolAdapter: { adapter_id: "adapter-a2a" },
      BenchmarkAdapter: { benchmark_version: "SWE-bench Verified@2026-06" },
      StatechartAdapter: { dialect_version: "SCXML-1.0" },
      SchemaAdapter: { schema_version: "JSON-Schema-2020-12" },
    } as const;

    for (const [conceptId, fields] of Object.entries(validConcreteParentExamples)) {
      const concept = conceptById.get(conceptId);
      expect(concept, conceptId).toBeDefined();
      const positive = concept?.examples.find(({ kind }) => kind === "positive");
      const instance = concept?.examples.find(({ kind }) => kind === "instance");
      expect(positive?.field_values, `${conceptId}/positive`).toMatchObject(fields);
      expect(instance?.field_values, `${conceptId}/instance`).toMatchObject(fields);
    }
  });

  it("derives branch-wide anti-contamination rules from the accepted is_a graph", () => {
    const humanActors = descendantsOf("HumanActor");
    const softwareActors = descendantsOf("SoftwareActor");
    const externalServices = descendantsOf("ExternalServiceActor");
    for (const conceptId of humanActors) {
      for (const example of membershipExamples(conceptId)) {
        expect(example.field_values.actor_kind, `${conceptId}/${example.id}`).toBe("human");
      }
    }
    for (const conceptId of softwareActors) {
      const expectedKind = externalServices.has(conceptId) ? "external-service" : "software";
      for (const example of membershipExamples(conceptId)) {
        expect(example.field_values.actor_kind, `${conceptId}/${example.id}`).toBe(expectedKind);
      }
    }

    const updateOperations = descendantsOf("MemoryUpdate");
    for (const conceptId of descendantsOf("MemoryOperation")) {
      if (conceptId === "MemoryOperation" || updateOperations.has(conceptId)) continue;
      for (const example of membershipExamples(conceptId)) {
        expect(JSON.stringify(example.field_values), `${conceptId}/${example.id}`).not.toMatch(
          /memory-op-update|superseded by corrected provenance/iu,
        );
      }
    }

    const toolSelections = descendantsOf("ToolSelectionDecision");
    for (const conceptId of descendantsOf("SelectionDecision")) {
      if (conceptId === "SelectionDecision" || toolSelections.has(conceptId)) continue;
      for (const example of membershipExamples(conceptId)) {
        expect(JSON.stringify(example.field_values), `${conceptId}/${example.id}`).not.toContain(
          "selection-tool",
        );
      }
    }

    const assertBranchExcludes = (
      branchRoot: string,
      allowedSubtreeRoot: string | null,
      stalePattern: RegExp,
    ): void => {
      const allowedIds =
        allowedSubtreeRoot === null ? new Set<string>() : descendantsOf(allowedSubtreeRoot);
      for (const conceptId of descendantsOf(branchRoot)) {
        if (conceptId === branchRoot || allowedIds.has(conceptId)) continue;
        for (const example of membershipExamples(conceptId)) {
          expect(JSON.stringify(example.field_values), `${conceptId}/${example.id}`).not.toMatch(
            stalePattern,
          );
        }
      }
    };

    assertBranchExcludes("FrameworkAdapter", null, /adapter-a2a|"adapter_family":"a2a"/iu);
    assertBranchExcludes("ProtocolAdapter", "A2AAdapter", /adapter-a2a|"adapter_family":"a2a"/iu);
    assertBranchExcludes("BenchmarkAdapter", "SWEBenchAdapter", /swe-?bench/iu);
    assertBranchExcludes("StatechartAdapter", "SCXMLAdapter", /scxml/iu);
    assertBranchExcludes("SchemaAdapter", "JSONSchemaAdapter", /json-?schema/iu);
  });
});
