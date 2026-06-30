import type { AdapterSpec, OntologyArtifact, OntologyDataset, OntologyRelation } from "../lib/types";

const accepted = "accepted" as const;

const provenance = (
  source_ids: string[],
  constraint_ids: string[],
  proposal_ids: string[],
  derivation_note: string
) => ({
  source_ids,
  constraint_ids,
  proposal_ids,
  derivation_note,
  review_status: accepted
});

export const ontologyArtifacts: OntologyArtifact[] = [
  {
    id: "artifact-evidence-provenance",
    artifact_type: "OntologyArtifact",
    label: "Evidence Provenance",
    layer: "evidence",
    disposition: "core",
    description: "Source-backed derivation record for every ontology, schema, profile, and adapter claim.",
    provenance: provenance(
      ["lit-ont-llm-oe-slr", "lit-ont-neon-gpt", "lit-ont-kg-survey", "lit-val-jsonschema-ietf"],
      ["SC-ONT-001", "SC-VAL-001"],
      ["PL-00", "PR-020"],
      "RFC 0001 makes source provenance a core layer."
    )
  },
  {
    id: "artifact-actor",
    artifact_type: "OntologyArtifact",
    label: "Actor",
    layer: "actor-boundary",
    disposition: "core+profile",
    description: "A local agent, remote agent, human, tool, or service participant with explicit boundary context.",
    provenance: provenance(
      ["eng-proto-a2a-docs", "eng-proto-a2a-spec", "eng-proto-mcp-spec", "lit-agent-msb"],
      ["SC-PROTO-001", "SC-PROTO-003", "SC-RUNTIME-002"],
      ["PL-01", "PR-019"],
      "Actor taxonomy is core while protocol-specific metadata remains profile-owned."
    )
  },
  {
    id: "trust-boundary-protocol",
    artifact_type: "TrustBoundary",
    label: "Protocol Trust Boundary",
    layer: "security-policy",
    disposition: "core+profile",
    description: "A boundary where authority, remote execution, tool output, memory retrieval, or protocol metadata crosses actors or systems.",
    provenance: provenance(
      ["eng-proto-mcp-auth", "eng-security-mcp-nsa-2026", "eng-proto-a2a-docs", "eng-proto-mcp-spec"],
      ["SC-PROTO-004", "SC-SEC-001", "SC-SEC-003"],
      ["PL-08", "PR-019"],
      "Trust boundaries are standalone artifacts and relation-level references."
    )
  },
  {
    id: "artifact-runtime-session",
    artifact_type: "OntologyArtifact",
    label: "Runtime Session",
    layer: "runtime-trace",
    disposition: "core+profile",
    description: "A resumable run/session context with checkpoints, persistence, interrupts, and trace anchors.",
    provenance: provenance(
      ["eng-fw-langgraph-docs", "eng-fw-microsoft-agent-framework-current", "eng-fw-mcp-agent-docs", "eng-fw-openai-python-docs"],
      ["SC-RUNTIME-003", "SC-RUNTIME-004"],
      ["PL-03", "PR-014"],
      "Durable execution is runtime capability evidence, not prompt-only mechanism."
    )
  },
  {
    id: "artifact-observable-trace",
    artifact_type: "OntologyArtifact",
    label: "Observable Trace Event",
    layer: "runtime-trace",
    disposition: "core",
    description: "Auditable event such as action summary, tool call, safety decision, state update, or artifact reference without hidden chain-of-thought.",
    provenance: provenance(
      ["lit-mech-compass", "lit-state-stateflow", "eng-fw-openai-tracing", "eng-fw-openai-guardrails"],
      ["SC-MECH-001", "SC-RUNTIME-004"],
      ["PR-021"],
      "Trace stores observable evidence only."
    )
  },
  {
    id: "artifact-task-action-observation",
    artifact_type: "OntologyArtifact",
    label: "Task Action Observation",
    layer: "task-action-observation",
    disposition: "core+profile",
    description: "Observable goal, task, plan artifact, action, observation, and result structure.",
    provenance: provenance(
      ["lit-mech-deepplanning", "lit-mech-compass", "lit-agent-tooltree", "lit-agent-etom"],
      ["SC-MECH-001", "SC-MECH-003", "SC-MECH-004"],
      ["PL-04", "PR-007", "PR-010"],
      "Plans and actions are observable artifacts rather than hidden reasoning text."
    )
  },
  {
    id: "artifact-schema-contract",
    artifact_type: "SchemaArtifact",
    label: "Canonical Schema Contract",
    layer: "validation",
    disposition: "core+profile",
    description: "JSON Schema Draft 2020-12 structural baseline with profile and semantic export metadata.",
    provenance: provenance(
      ["lit-val-jsonschema-ietf", "lit-val-jsonschema-spec", "eng-val-jsonschema-spec", "eng-val-zod-json-schema", "eng-val-pydantic-json-schema"],
      ["SC-VAL-001", "SC-VAL-002", "SC-ONT-002"],
      ["PL-09", "PR-015", "PR-016"],
      "JSON Schema is canonical structural baseline; runtime validators are generated profiles."
    )
  },
  {
    id: "artifact-capability-surface",
    artifact_type: "OntologyArtifact",
    label: "Capability Surface",
    layer: "capability-resource",
    disposition: "profile",
    description: "Protocol/runtime capability exposure and invocation metadata, kept outside core.",
    provenance: provenance(
      ["eng-proto-mcp-changelog", "eng-proto-mcp-2025-spec", "eng-proto-mcp-spec", "eng-fw-openai-tools"],
      ["SC-PROTO-001", "SC-PROTO-002", "SC-RUNTIME-001", "SC-VAL-002"],
      ["PL-02", "PR-001", "PR-002"],
      "Capability/resource semantics differ across MCP, runtime tools, API calls, and generated schema views."
    )
  },
  {
    id: "artifact-orchestration",
    artifact_type: "OntologyArtifact",
    label: "Orchestration Profile",
    layer: "orchestration",
    disposition: "profile",
    description: "Handoff, agents-as-tools, local subagent assignment, context scoping, and synthesis semantics.",
    provenance: provenance(
      ["eng-fw-openai-handoffs", "eng-fw-openai-tools", "eng-fw-deepagents-js-docs", "lit-agent-paramanager"],
      ["SC-RUNTIME-002", "SC-MECH-005", "SC-PROTO-003"],
      ["PL-06", "PR-004", "PR-005", "PR-006"],
      "Coordination mechanisms differ by ownership, context scope, and boundary."
    )
  },
  {
    id: "adapter-a2a-delegation",
    artifact_type: "OntologyArtifact",
    label: "A2A Remote Delegation",
    layer: "orchestration",
    disposition: "adapter",
    description: "Opaque remote-agent delegation owned by the A2A adapter family.",
    provenance: provenance(
      ["eng-proto-a2a-docs", "eng-proto-a2a-spec", "eng-fw-google-adk-a2a-example", "lit-agent-msb"],
      ["SC-PROTO-001", "SC-PROTO-003", "SC-RUNTIME-002", "SC-SEC-003"],
      ["PR-003"],
      "Remote A2A agents do not expose internal memory, tool inventory, or proprietary logic by default."
    )
  },
  {
    id: "adapter-statechart-profile",
    artifact_type: "OntologyArtifact",
    label: "Statechart Lifecycle Profile",
    layer: "statechart",
    disposition: "adapter",
    description: "SCXML/XState-like lifecycle and control-flow profile over runtime/session state.",
    provenance: provenance(
      ["lit-state-stateflow", "lit-state-metaagent", "eng-state-xstate-docs", "eng-state-scxml"],
      ["SC-MECH-006", "SC-RUNTIME-003"],
      ["PR-013"],
      "Statechart transitions remain profile/adapter-owned."
    )
  },
  {
    id: "adapter-benchmark-evaluation",
    artifact_type: "OntologyArtifact",
    label: "Benchmark Evaluation Adapter",
    layer: "evaluation",
    disposition: "adapter",
    description: "Benchmark-specific scoring, pressure axes, artifact types, and environment metadata.",
    provenance: provenance(
      ["eng-bench-swebench-site", "eng-bench-osworld-site", "eng-bench-osworld-v2", "eng-bench-tau2", "eng-bench-tau2-verified", "eng-bench-appworld"],
      ["SC-EVAL-001", "SC-EVAL-002", "SC-EVAL-003"],
      ["PL-07", "PR-017"],
      "Benchmark metadata remains eval adapter evidence."
    )
  }
];

export const ontologyRelations: OntologyRelation[] = [
  {
    id: "relation-source-provenance",
    artifact_type: "RelationArtifact",
    label: "Derives Claim From Source",
    layer: "evidence",
    disposition: "core",
    description: "Every accepted claim remains auditable against source evidence.",
    relation_kind: "derives_claim_from_source",
    source_artifact_id: "artifact-schema-contract",
    target_artifact_id: "artifact-evidence-provenance",
    direction: "source-to-target",
    provenance: provenance(["lit-ont-llm-oe-slr", "lit-ont-kg-survey"], ["SC-ONT-001"], ["PR-020"], "Source provenance is a core relation.")
  },
  {
    id: "relation-crosses-protocol-boundary",
    artifact_type: "RelationArtifact",
    label: "Crosses Trust Boundary",
    layer: "security-policy",
    disposition: "core+profile",
    description: "Remote delegation or tool/resource exchange crosses a protocol trust boundary.",
    relation_kind: "crosses_trust_boundary",
    source_artifact_id: "artifact-actor",
    target_artifact_id: "adapter-a2a-delegation",
    trust_boundary_id: "trust-boundary-protocol",
    direction: "source-to-target",
    provenance: provenance(["eng-proto-a2a-docs", "eng-proto-mcp-auth", "eng-security-mcp-nsa-2026"], ["SC-PROTO-004", "SC-SEC-003"], ["PR-019"], "Cross-boundary relations must reference TrustBoundary.")
  },
  {
    id: "relation-records-observable-trace",
    artifact_type: "RelationArtifact",
    label: "Records Observable Trace",
    layer: "runtime-trace",
    disposition: "core",
    description: "Runtime session records observable trace events without requiring private reasoning text.",
    relation_kind: "records_observable_trace_event",
    source_artifact_id: "artifact-runtime-session",
    target_artifact_id: "artifact-observable-trace",
    direction: "source-to-target",
    provenance: provenance(["lit-mech-compass", "eng-fw-openai-tracing"], ["SC-MECH-001", "SC-RUNTIME-004"], ["PR-021"], "Observable trace is core evidence.")
  },
  {
    id: "relation-plans-task",
    artifact_type: "RelationArtifact",
    label: "Plans Task For Goal",
    layer: "task-action-observation",
    disposition: "core",
    description: "Observable plan artifact decomposes or orders task work toward a goal.",
    relation_kind: "plans_task_for_goal",
    source_artifact_id: "artifact-task-action-observation",
    target_artifact_id: "artifact-observable-trace",
    direction: "source-to-target",
    provenance: provenance(["lit-mech-deepplanning", "lit-mech-compass"], ["SC-MECH-001", "SC-MECH-003"], ["PR-007"], "Plans must be observable artifacts.")
  },
  {
    id: "relation-exposes-capability",
    artifact_type: "RelationArtifact",
    label: "Exposes Capability Surface",
    layer: "capability-resource",
    disposition: "profile",
    description: "Protocol server or runtime adapter advertises callable or consumable capabilities.",
    relation_kind: "exposes_capability_surface",
    source_artifact_id: "artifact-actor",
    target_artifact_id: "artifact-capability-surface",
    direction: "source-to-target",
    provenance: provenance(["eng-proto-mcp-spec", "eng-proto-mcp-changelog", "eng-fw-openai-tools"], ["SC-PROTO-002", "SC-RUNTIME-001"], ["PR-001"], "Capability exposure is profile-level.")
  },
  {
    id: "relation-a2a-delegation",
    artifact_type: "RelationArtifact",
    label: "Delegates To Remote Agent",
    layer: "orchestration",
    disposition: "adapter",
    description: "A local actor requests work from an opaque remote A2A agent.",
    relation_kind: "delegates_to_remote_agent",
    source_artifact_id: "artifact-actor",
    target_artifact_id: "adapter-a2a-delegation",
    trust_boundary_id: "trust-boundary-protocol",
    direction: "source-to-target",
    provenance: provenance(["eng-proto-a2a-docs", "eng-proto-a2a-spec", "lit-agent-msb"], ["SC-PROTO-003", "SC-SEC-003"], ["PR-003"], "Remote delegation is adapter-owned.")
  },
  {
    id: "relation-state-transition-profile",
    artifact_type: "RelationArtifact",
    label: "Transitions State On Event",
    layer: "statechart",
    disposition: "adapter",
    description: "Statechart transition maps event/guard/action semantics in a lifecycle profile.",
    relation_kind: "transitions_state_on_event",
    source_artifact_id: "artifact-runtime-session",
    target_artifact_id: "adapter-statechart-profile",
    direction: "source-to-target",
    provenance: provenance(["eng-state-xstate-docs", "eng-state-scxml"], ["SC-MECH-006", "SC-RUNTIME-003"], ["PR-013"], "Statechart transitions do not become universal core lifecycle.")
  },
  {
    id: "relation-benchmark-evaluation",
    artifact_type: "RelationArtifact",
    label: "Evaluates Run On Benchmark",
    layer: "evaluation",
    disposition: "adapter",
    description: "Benchmark adapter attaches environment, scoring, resource pressure, and artifact semantics.",
    relation_kind: "evaluates_run_on_benchmark",
    source_artifact_id: "artifact-runtime-session",
    target_artifact_id: "adapter-benchmark-evaluation",
    direction: "source-to-target",
    provenance: provenance(["eng-bench-swebench-site", "eng-bench-osworld-site", "eng-bench-tau2"], ["SC-EVAL-001", "SC-EVAL-002"], ["PR-017"], "Benchmark fields stay adapter-owned.")
  }
];

export const ontologyDataset: OntologyDataset = {
  id: "moonweave-agent-ontology-v1",
  artifact_type: "GraphView",
  version: "0.1.0",
  title: "Moonweave Agent Ontology v1",
  review_status: accepted,
  generated_from: [
    "docs/rfcs/0001-ontology-layers.md",
    "docs/rfcs/0002-canonical-schema-contract.md",
    "docs/rfcs/0003-statechart-and-protocol-model.md",
    "research/pl-pr-core-profile-adapter-matrix.md"
  ],
  artifacts: ontologyArtifacts,
  relations: ontologyRelations
};

export const adapterSpecs: AdapterSpec[] = [
  {
    id: "adapter-spec-mcp",
    family: "mcp",
    disposition: "profile/adapter",
    owns: ["tools", "resources", "prompts", "discovery", "auth", "elicitation"],
    source_ids: ["eng-proto-mcp-spec", "eng-proto-mcp-2025-spec", "eng-proto-mcp-auth", "eng-proto-mcp-elicitation"],
    boundary_rule: "MCP tool/resource/prompt invocation is not A2A remote delegation and not agents-as-tools."
  },
  {
    id: "adapter-spec-a2a",
    family: "a2a",
    disposition: "adapter",
    owns: ["remote-agent-identity", "tasks", "messages", "artifacts", "opacity-boundary"],
    source_ids: ["eng-proto-a2a-docs", "eng-proto-a2a-spec", "eng-fw-google-adk-a2a-example"],
    boundary_rule: "A2A remote agents are opaque and do not expose internal memory, tool inventory, or proprietary logic as core."
  },
  {
    id: "adapter-spec-statechart",
    family: "statechart",
    disposition: "profile/adapter",
    owns: ["state", "transition", "event", "guard", "action", "snapshot", "path"],
    source_ids: ["eng-state-xstate-docs", "eng-state-xstate-graph", "eng-state-scxml"],
    boundary_rule: "Statechart lifecycle is a profile over runtime/session state, not universal runtime core."
  },
  {
    id: "adapter-spec-benchmark",
    family: "benchmark",
    disposition: "adapter",
    owns: ["benchmark-id", "environment", "scoring", "horizon", "resource-pressure", "sandbox-surface"],
    source_ids: ["eng-bench-swebench-site", "eng-bench-osworld-site", "eng-bench-tau2", "eng-bench-appworld"],
    boundary_rule: "Benchmark scores and pressure semantics stay eval adapter metadata."
  }
];
