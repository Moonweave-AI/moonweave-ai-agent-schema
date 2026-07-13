/**
 * @deprecated Frozen one-time v1 -> v2 replay policy. Do not import this file
 * into the source-first builder or release pipeline; edit ontology/source/**.
 */
import { claimsFor, localized } from "./ontology-migration-factories.mjs";

const mapping = (
  conceptId,
  system,
  reviewedIdentifier,
  canonicalTargetIds,
  sourceId,
  scope,
  loss,
  direction = "bidirectional",
) => ({
  concept_id: conceptId,
  system,
  external_identifier: reviewedIdentifier.includes("@")
    ? reviewedIdentifier.slice(0, reviewedIdentifier.lastIndexOf("@"))
    : system,
  external_version: reviewedIdentifier.includes("@")
    ? reviewedIdentifier.slice(reviewedIdentifier.lastIndexOf("@") + 1)
    : reviewedIdentifier,
  canonical_target_ids: canonicalTargetIds,
  source_id: sourceId,
  scope: localized(`映射范围：${scope}`, scope, `写像範囲：${scope}`),
  direction,
  loss: localized(`已知损失：${loss}`, loss, `既知の損失：${loss}`),
  conformance: {
    status: "contract-tested",
    test_id: `${conceptId}-mapping-contract-test`,
    method: localized(
      "验证外部版本、映射范围、方向、已知损失、唯一所有者、来源登记以及所有 canonical 目标 ID 的可解析性。",
      "Validates the external version, scope, direction, known loss, unique owner, registered source, and resolvability of every canonical target ID.",
      "外部版、範囲、方向、既知の損失、一意な所有者、登録出典、および全 canonical 対象 ID の解決可能性を検証します。",
    ),
  },
});

const BENCHMARK_TARGETS = Object.freeze([
  "Task",
  "RuntimeEnvironment",
  "ToolCallAttempt",
  "CommandOutputObservation",
  "Artifact",
  "Score",
  "RunOutcome",
]);

export const REVIEWED_ADAPTER_MAPPINGS = Object.freeze([
  mapping("AgencyBenchAdapter", "AgencyBench", "AgencyBench@main", BENCHMARK_TARGETS, "eng-bench-agencybench", "task, environment, action/observation trajectory, artifact, metric, and outcome constructs", "environment-specific actions remain benchmark-native"),
  mapping("AppWorldAdapter", "AppWorld", "AppWorld@main", BENCHMARK_TARGETS, "eng-bench-appworld", "task, application environment, API action/observation trajectory, artifact, metric, and outcome constructs", "application database fixtures remain external"),
  mapping("OSWorldAdapter", "OSWorld", "OSWorld@2.0", BENCHMARK_TARGETS, "eng-bench-osworld-v2", "task, desktop environment, action/observation trajectory, artifact, metric, and outcome constructs", "raw desktop state and screenshots remain external artifacts"),
  mapping("SWEBenchAdapter", "SWE-bench", "SWE-bench@verified", BENCHMARK_TARGETS, "eng-bench-swebench-repo", "issue task, repository environment, patch/test trajectory, artifact, metric, and outcome constructs", "repository fixtures and harness internals remain external"),
  mapping("Tau2Adapter", "tau2-bench", "tau2-bench@main", BENCHMARK_TARGETS, "eng-bench-tau2", "task, simulator environment, tool action/observation trajectory, artifact, metric, and outcome constructs", "domain simulator state remains benchmark-native"),
  mapping("TerminalBenchAdapter", "Terminal-Bench", "Terminal-Bench@2.1", BENCHMARK_TARGETS, "eng-bench-terminal-21", "task, terminal environment, command/output trajectory, artifact, metric, and outcome constructs", "container images and command transcripts remain external artifacts"),

  mapping("CrewAIAdapter", "CrewAI", "CrewAI@current", ["AgentActor", "Task", "DelegationProcess"], "eng-fw-crewai-docs", "agents, tasks, crews, flows, and delegation", "framework callbacks and runtime internals remain CrewAI-native"),
  mapping("DeepAgentsAdapter", "Deep Agents", "DeepAgents@current", ["AgentActor", "TaskPlan", "SubagentRole"], "eng-fw-deepagents-docs", "agent planning, subagents, filesystem context, and delegation", "middleware implementation details remain framework-native"),
  mapping("LangChainAdapter", "LangChain", "LangChain@current", ["AgentActor", "Tool", "Message"], "eng-fw-langchain-agents", "agents, tools, messages, and middleware-visible events", "provider-specific runnable internals are not canonicalized"),
  mapping("LangGraphAdapter", "LangGraph", "LangGraph@current", ["AgentActor", "TaskPlan", "StateSnapshot", "Handoff"], "eng-fw-langgraph-docs", "graphs, nodes, state snapshots, checkpoints, and handoffs", "graph implementation and reducer functions remain framework-native"),
  mapping("MicrosoftAgentFrameworkAdapter", "Microsoft Agent Framework", "Microsoft.AgentFramework@current", ["AgentActor", "TaskPlan", "Handoff", "TraceRecord"], "eng-fw-microsoft-agent-framework-docs", "agents, workflows, handoffs, state, and observability", "SDK-specific middleware and transport objects remain external"),
  mapping("OpenAIAgentsAdapter", "OpenAI Agents SDK", "openai-agents@current", ["AgentActor", "Tool", "Handoff", "TraceRecord"], "eng-fw-openai-python-docs", "agents, tools, handoffs, sessions, traces, and spans", "provider request payloads and SDK callbacks remain external"),

  mapping("FIPAAdapter", "FIPA ACL", "FIPA-ACL@2002", ["Message", "Conversation", "Intent"], "eng-proto-fipa-acl", "ACL envelopes, communicative acts, conversations, and content intent", "FIPA content-language payloads require a separate content mapping"),
  mapping("KQMLAdapter", "KQML", "KQML@1997", ["Message", "Conversation", "Intent"], "eng-proto-kqml-spec", "performatives, sender/receiver fields, conversations, and content intent", "domain ontology payloads remain protocol-native unless separately mapped"),

  mapping("JSONSchemaAdapter", "JSON Schema", "draft-2020-12", ["SchemaArtifact", "MappingRule"], "eng-val-jsonschema-spec", "fields, requiredness, scalar constraints, arrays, and controlled values", "graph reachability and open-world semantics are unsupported"),
  mapping("OWLExportAdapter", "OWL", "OWL2", ["SchemaArtifact", "GraphArtifact", "MappingRule"], "eng-ont-owl", "classes, object properties, IRIs, and expressible axioms", "closed-world validation and UI-only ordering are lossy"),
  mapping("SHACLExportAdapter", "SHACL", "SHACL-1.0", ["SchemaArtifact", "GraphArtifact", "MappingRule"], "eng-val-shacl", "node shapes, property paths, cardinalities, and validation constraints", "procedural runtime behavior is outside SHACL scope"),
  mapping("ShExExportAdapter", "ShEx", "ShEx-2.1", ["SchemaArtifact", "GraphArtifact", "MappingRule"], "eng-val-shex", "RDF node shapes, property constraints, and cardinalities", "runtime workflows and non-RDF payload validation remain external"),
  mapping("ZodProfileAdapter", "Zod", "Zod-4", ["SchemaArtifact", "MappingRule"], "eng-val-zod-docs", "TypeScript runtime payload fields, unions, enums, and refinements", "graph topology and cross-node constraints require external checks"),
  mapping("PydanticProfileAdapter", "Pydantic", "Pydantic-2", ["SchemaArtifact", "MappingRule"], "eng-val-pydantic-json-schema", "Python payload models, field constraints, enums, and validation", "graph topology and temporal constraints require external checks"),
  mapping("GraphIRAdapter", "Moonweave Graph IR", "graph-ir@2", ["GraphArtifact", "GraphNode", "GraphEdge"], "eng-ont-rdf", "canonical nodes, relation assertions, direction, and embedded annotations", "renderer layout and transient selection state are excluded", "export-from-canonical"),
  mapping("FrontendViewAdapter", "Moonweave Explorer ViewModel", "explorer-view@2", ["GraphArtifact", "GraphNode", "GraphEdge"], "eng-ont-palantir-core-concepts", "read-only graph neighborhoods and same-page node/relation details", "no canonical fact is created by view focus, layout, or highlighting", "export-from-canonical"),

  mapping("SCXMLAdapter", "SCXML", "SCXML-1.0", ["StateSnapshot", "GateCondition", "DownstreamOperation"], "eng-state-scxml", "states, transitions, events, guards, actions, and history", "implementation-specific executable content remains external"),
  mapping("XStateAdapter", "XState", "XState-5", ["StateSnapshot", "GateCondition", "DownstreamOperation"], "eng-state-xstate-docs", "machines, actors, states, events, guards, actions, invokes, and snapshots", "JavaScript action bodies and runtime actor references remain external"),
]);

export const applyReviewedAdapterMappings = ({ concepts, sourceRegistryById }) => {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  const targetIds = new Set(conceptById.keys());
  const additionsByConcept = new Map();
  for (const spec of REVIEWED_ADAPTER_MAPPINGS) {
    if (!conceptById.has(spec.concept_id)) {
      throw new Error(`Reviewed adapter mapping target ${spec.concept_id} does not resolve`);
    }
    const unresolved = spec.canonical_target_ids.filter((id) => !targetIds.has(id));
    if (unresolved.length > 0) {
      throw new Error(
        `Reviewed adapter mapping ${spec.concept_id} has unresolved canonical targets: ${unresolved.join(", ")}`,
      );
    }
    const id = `${spec.concept_id}-external-mapping`;
    const note = localized(
      `外部术语 ${spec.external_identifier} 的 ${spec.external_version} 版本按 ${spec.direction} 方向映射；范围与已知损失见本映射的结构化信息。`,
      `External term ${spec.external_identifier} at version ${spec.external_version} maps ${spec.direction}; scope and known loss are recorded in this mapping's structured information.`,
      `外部用語 ${spec.external_identifier} の ${spec.external_version} 版を ${spec.direction} 方向で写像し、範囲と既知の損失は本写像の構造化情報に記録します。`,
    );
    const reviewed = {
      id,
      system: spec.system,
      external_identifier: spec.external_identifier,
      external_version: spec.external_version,
      canonical_target_ids: [...spec.canonical_target_ids],
      mapping_kind: "related",
      scope: structuredClone(spec.scope),
      direction: spec.direction,
      loss_notes: structuredClone(spec.loss),
      conversion_note: note,
      conformance: structuredClone(spec.conformance),
      status: "accepted",
      source_claims: claimsFor({
        sourceIds: [spec.source_id],
        ownerId: id,
        assertion: `Supports the reviewed version, scope, ${spec.direction} mapping boundary, known loss, and contract conformance for ${spec.concept_id}.`,
        sourceRegistryById,
      }),
    };
    additionsByConcept.set(spec.concept_id, [
      ...(additionsByConcept.get(spec.concept_id) ?? []),
      reviewed,
    ]);
  }

  return concepts.map((concept) => {
    const additions = additionsByConcept.get(concept.id);
    if (!additions) return structuredClone(concept);
    const existing = concept.external_mappings ?? [];
    const existingIds = new Set(existing.map(({ id }) => id));
    const duplicate = additions.find(({ id }) => existingIds.has(id));
    if (duplicate) throw new Error(`Reviewed adapter mapping ID collision: ${duplicate.id}`);
    return {
      ...structuredClone(concept),
      external_mappings: [...structuredClone(existing), ...structuredClone(additions)],
    };
  });
};
