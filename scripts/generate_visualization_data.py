#!/usr/bin/env python3
"""Generate visualization JSON data from ontology YAML files (regex-based, no PyYAML)."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY = ROOT / "ontology"
OUT = ROOT / "visualization" / "data"

SUBGRAPH_META = {
    "00-meta-graph": {
        "id": "00-meta-graph",
        "label": "Meta Graph",
        "label_zh": "元图",
        "description": "Ontology primitives",
        "color": "#6366f1",
    },
    "01-agent-core-graph": {
        "id": "01-agent-core-graph",
        "label": "Agent Core Graph",
        "label_zh": "智能体核心图",
        "description": "Agent identity, goals, decision loop, cognitive core",
        "color": "#3b82f6",
    },
    "02-context-info-graph": {
        "id": "02-context-info-graph",
        "label": "Context & Information Graph",
        "label_zh": "上下文与信息图",
        "description": "Context sources, messages, progressive disclosure",
        "color": "#06b6d4",
    },
    "03-memory-graph": {
        "id": "03-memory-graph",
        "label": "Memory Graph",
        "label_zh": "记忆图",
        "description": "Memory types, retrieval, compaction, forgetting",
        "color": "#14b8a6",
    },
    "04-reasoning-planning-graph": {
        "id": "04-reasoning-planning-graph",
        "label": "Reasoning & Planning Graph",
        "label_zh": "推理与规划图",
        "description": "Reasoning traces, plans, search, reflection",
        "color": "#22c55e",
    },
    "05-tool-action-graph": {
        "id": "05-tool-action-graph",
        "label": "Tool & Action Graph",
        "label_zh": "工具与动作图",
        "description": "Tool discovery, invocation, side effects",
        "color": "#eab308",
    },
    "06-orchestration-graph": {
        "id": "06-orchestration-graph",
        "label": "Orchestration Graph",
        "label_zh": "编排图",
        "description": "Workflows, routing, multi-agent coordination",
        "color": "#f97316",
    },
    "07-runtime-harness-graph": {
        "id": "07-runtime-harness-graph",
        "label": "Runtime & Harness Graph",
        "label_zh": "运行时与执行框架图",
        "description": "Sessions, runs, traces, sandboxes, budgets",
        "color": "#ef4444",
    },
    "08-safety-policy-graph": {
        "id": "08-safety-policy-graph",
        "label": "Safety & Policy Graph",
        "label_zh": "安全与策略图",
        "description": "Trust boundaries, permissions, audit, defense",
        "color": "#ec4899",
    },
    "09-protocol-interop-graph": {
        "id": "09-protocol-interop-graph",
        "label": "Protocol & Interop Graph",
        "label_zh": "协议与互操作图",
        "description": "Protocol roles, endpoints, capability manifests",
        "color": "#a855f7",
    },
    "10-universal-sdk-graph": {
        "id": "10-universal-sdk-graph",
        "label": "Universal SDK Graph",
        "label_zh": "通用 SDK 图",
        "description": "SDK kernel, API families, adapters, extensions",
        "color": "#8b5cf6",
    },
    "11-environment-adapter-graph": {
        "id": "11-environment-adapter-graph",
        "label": "Environment Adapter Graph",
        "label_zh": "环境适配图",
        "description": "Environment types, observations, actions, risk",
        "color": "#64748b",
    },
    "12-engineering-validation-graph": {
        "id": "12-engineering-validation-graph",
        "label": "Engineering & Validation Graph",
        "label_zh": "工程与验证图",
        "description": "Graph validators, coverage checkers, release gates",
        "color": "#78716c",
    },
}

# Canonical cross-subgraph instance edges (critical integration paths)
CROSS_SUBGRAPH_EDGES = [
    ("READS_CONTEXT", "node.agent", "node.context_graph", "01-agent-core-graph", "Agent reads assembled context from the context graph."),
    ("RETRIEVES_FROM", "node.agent", "node.memory_store", "01-agent-core-graph", "Agent retrieves ranked memory records from a memory store."),
    ("GENERATES_PLAN", "node.decision_loop", "node.plan", "04-reasoning-planning-graph", "Decision loop produces an executable plan for the current goal."),
    ("REQUESTS_ACTION", "node.plan", "node.tool_call", "05-tool-action-graph", "Plan step requests a concrete tool call to act in the environment."),
    ("GUARDED_BY", "node.tool_call", "node.policy_contract", "08-safety-policy-graph", "Tool call must pass policy contract authorization before execution."),
    ("EXECUTED_BY", "node.tool_call", "node.executor", "07-runtime-harness-graph", "Approved tool call is dispatched to the runtime executor."),
    ("EXECUTES_IN", "node.executor", "node.sandbox", "07-runtime-harness-graph", "Executor runs side-effecting actions inside an isolated sandbox."),
    ("OPERATES_ON", "node.sandbox", "node.environment_action", "11-environment-adapter-graph", "Sandboxed execution operates on environment actions via adapters."),
    ("APPENDS_TO", "node.tool_result", "node.transcript", "07-runtime-harness-graph", "Tool results append to the session transcript log."),
    ("WRITES_TO", "node.tool_result", "node.memory_writer", "03-memory-graph", "Tool results may be persisted via the memory writer."),
    ("TRACES", "node.transcript", "node.trace", "07-runtime-harness-graph", "Transcript events are captured in structured execution traces."),
    ("COMPOSES", "node.agent_sdk", "node.sdk_kernel", "10-universal-sdk-graph", "Agent SDK composes the generic SDK kernel as its core runtime."),
    ("EXPOSES_API", "node.sdk_kernel", "node.tool_api", "10-universal-sdk-graph", "SDK kernel exposes the tool API surface."),
    ("EXPOSES_API", "node.sdk_kernel", "node.memory_api", "10-universal-sdk-graph", "SDK kernel exposes the memory API surface."),
    ("EXPOSES_API", "node.sdk_kernel", "node.workflow_api", "10-universal-sdk-graph", "SDK kernel exposes the workflow API surface."),
    ("EXPOSES_API", "node.sdk_kernel", "node.policy_api", "10-universal-sdk-graph", "SDK kernel exposes the policy API surface."),
    ("EXPOSES_API", "node.sdk_kernel", "node.trace_api", "10-universal-sdk-graph", "SDK kernel exposes the trace API surface."),
    ("EXPOSES_TOOL", "node.protocol", "node.tool_exposure", "09-protocol-interop-graph", "Protocol specification exposes tools to remote peers."),
    ("AUTHORIZES_WITH", "node.protocol_endpoint", "node.authorization_scheme", "09-protocol-interop-graph", "Protocol endpoint authenticates using an authorization scheme."),
    ("ADAPTS_TO", "node.environment_adapter", "node.environment", "11-environment-adapter-graph", "Environment adapter bridges to a concrete environment type."),
    ("VALIDATES", "node.graph_validator", "node.ontology_graph", "12-engineering-validation-graph", "Graph validator checks ontology graph structural integrity."),
]

# Supplemental instance edges for predicates with empty or broad domains in YAML
SUPPLEMENTAL_EDGES = [
    ("GUARDS", "node.policy_contract", "node.tool_call", "08-safety-policy-graph", "Policy contract guards tool call execution."),
    ("INJECTS_INTO_CONTEXT", "node.memory_retriever", "node.context_graph", "03-memory-graph", "Retrieved memory chunks inject into the active context graph."),
    ("FUSES_RANKS", "node.rank_fusion", "node.reranker", "03-memory-graph", "Rank fusion merges sparse and dense retrieval scores before reranking."),
    ("SPARSE_INDEXES", "node.sparse_index", "node.memory_store", "03-memory-graph", "Sparse index indexes memory store records for lexical retrieval."),
    ("EMBEDS_WITH", "node.chunk", "node.embedding_model", "03-memory-graph", "Memory chunks are embedded using an embedding model."),
    ("GENERATES_PLAN", "node.planning_process", "node.plan", "04-reasoning-planning-graph", "Planning process generates a structured plan."),
    ("CONSUMES_BUDGET", "node.reasoning_trace", "node.thinking_budget", "04-reasoning-planning-graph", "Reasoning trace consumes allocated thinking budget."),
    ("REFLECTS_ON", "node.reflection", "node.reasoning_trace", "04-reasoning-planning-graph", "Reflection evaluates prior reasoning trace quality."),
    ("ESTIMATES_CONFIDENCE", "node.confidence_estimate", "node.uncertainty_state", "04-reasoning-planning-graph", "Confidence estimate quantifies uncertainty state."),
    ("STOPS_WHEN", "node.reasoning_process", "node.stopping_condition", "04-reasoning-planning-graph", "Reasoning stops when stopping condition is met."),
    ("MATCHED_BY", "node.deferred_tool_definition", "node.tool_match", "05-tool-action-graph", "Deferred tool definitions are matched by tool match heuristics."),
    ("DISCOVERED_BY", "node.tool_definition", "node.tool_discovery", "05-tool-action-graph", "Tool definitions are discovered via tool discovery pipelines."),
    ("CALLS_NETWORK", "node.network_action", "node.tool_call", "05-tool-action-graph", "Network actions originate from tool calls."),
    ("OPERATES_GUI", "node.gui_action", "node.computer_use_action", "05-tool-action-graph", "GUI actions are a form of computer use action."),
    ("DELEGATES_TO", "node.orchestrator", "node.subagent", "06-orchestration-graph", "Orchestrator delegates work to subagents."),
    ("HANDOFFS_TO", "node.handoff", "node.subagent", "06-orchestration-graph", "Handoff transfers control to another agent."),
    ("COORDINATES", "node.orchestrator", "node.worker", "06-orchestration-graph", "Orchestrator coordinates worker agents."),
    ("CHAINS_TO", "node.prompt_chain", "node.workflow_node", "06-orchestration-graph", "Prompt chain links sequential workflow nodes."),
    ("GATES", "node.gate", "node.workflow", "06-orchestration-graph", "Gate controls progression through a workflow."),
    ("REVIEWS", "node.evaluator", "node.plan", "06-orchestration-graph", "Evaluator reviews plan quality before execution."),
    ("VOTES_ON", "node.voting", "node.consensus_policy", "06-orchestration-graph", "Voting applies consensus policy to group decisions."),
    ("SHARES_STATE_VIA", "node.orchestrator", "node.blackboard", "06-orchestration-graph", "Multi-agent orchestrator shares state via blackboard."),
    ("FORKS_TO", "node.parallelization", "node.workflow_node", "06-orchestration-graph", "Parallelization forks execution to workflow branches."),
    ("JOINS_FROM", "node.sectioning", "node.parallelization", "06-orchestration-graph", "Sectioning joins parallel branches."),
    ("STARTS", "node.execution_harness", "node.session", "07-runtime-harness-graph", "Execution harness starts a new session."),
    ("EMITS_EVENT", "node.run", "node.event", "07-runtime-harness-graph", "Run lifecycle emits structured runtime events."),
    ("CHECKPOINTS", "node.run", "node.state_store", "07-runtime-harness-graph", "Long-running runs checkpoint state to the state store."),
    ("BOUNDED_BY_BUDGET", "node.run", "node.token_budget", "07-runtime-harness-graph", "Run execution is bounded by token budget limits."),
    ("RETRIES_BY", "node.executor", "node.retry_policy", "07-runtime-harness-graph", "Failed executions retry according to retry policy."),
    ("CANCELS_BY", "node.run", "node.cancellation", "07-runtime-harness-graph", "Run cancellation is handled by cancellation policy."),
    ("RECOVERS_FROM", "node.recovery_policy", "node.checkpoint", "07-runtime-harness-graph", "Recovery policy restores from checkpoints."),
    ("STREAMS_TO", "node.command", "node.stdout_stream", "07-runtime-harness-graph", "Command output streams to stdout."),
    ("REQUIRES_HUMAN_REVIEW", "node.approval_flow", "node.human_review", "08-safety-policy-graph", "Approval flow requires human review for high-risk actions."),
    ("AUDITS", "node.tool_call", "node.audit_log", "08-safety-policy-graph", "Tool calls are recorded in the audit log."),
    ("ESCALATES", "node.deny_decision", "node.escalation", "08-safety-policy-graph", "Denied decisions may escalate for review."),
    ("ROLLS_BACK", "node.rollback", "node.tool_call", "08-safety-policy-graph", "Rollback reverses a prior tool call side effect."),
    ("SEPARATES_REASONING_FROM_EXECUTION", "node.cognitive_executive_separation", "node.decision_loop", "08-safety-policy-graph", "Cognitive-executive separation isolates reasoning from execution."),
    ("PRIORITIZES", "node.context_graph", "node.working_memory", "02-context-info-graph", "Context graph prioritizes working memory contents."),
    ("REFERENCES", "node.message", "node.context_graph", "02-context-info-graph", "Messages reference external context graph nodes."),
    ("LOADS_FROM", "node.context_graph", "node.file_system_source", "02-context-info-graph", "Context graph loads content from file system sources."),
    ("INDEXES", "node.light_index", "node.tool_info_source", "02-context-info-graph", "Light index indexes tool info sources for discovery."),
    ("SUMMARIZES_TO", "node.message_history", "node.light_index", "02-context-info-graph", "Message history summarizes into light index entries."),
    ("PROVIDES_CONTEXT_TO", "node.container_context", "node.agent", "02-context-info-graph", "Container context provides assembled context to the agent."),
    ("IMPLEMENTS_CONTRACT", "node.sdk_kernel", "node.agent_sdk", "10-universal-sdk-graph", "SDK kernel implements the agent SDK contract."),
    ("BINDS_PROTOCOL", "node.protocol_binding", "node.protocol", "10-universal-sdk-graph", "Protocol binding connects SDK to interop protocol."),
    ("ADAPTS_MODEL", "node.model_adapter", "node.cognitive_core", "10-universal-sdk-graph", "Model adapter connects SDK to cognitive core models."),
    ("ADAPTS_TOOL", "node.tool_adapter", "node.tool_definition", "10-universal-sdk-graph", "Tool adapter bridges SDK tool API to tool definitions."),
    ("ADAPTS_ENVIRONMENT", "node.environment_adapter", "node.environment", "10-universal-sdk-graph", "Environment adapter SDK bridges to environment graph."),
    ("CONNECTS_PROVIDER", "node.connector", "node.model_adapter", "10-universal-sdk-graph", "Connector links external providers to model adapters."),
    ("INSTALLS_PLUGIN", "node.agent_sdk", "node.plugin", "10-universal-sdk-graph", "Agent SDK installs extension plugins."),
    ("REGISTERS_EXTENSION", "node.plugin", "node.extension_point", "10-universal-sdk-graph", "Plugin registers at SDK extension points."),
    ("LOADS_SKILL", "node.agent_sdk", "node.skill_package", "10-universal-sdk-graph", "Agent SDK loads packaged skill modules."),
    ("HANDLES_ERROR", "node.sdk_kernel", "node.error_model", "10-universal-sdk-graph", "SDK kernel normalizes errors via error model."),
    ("EMITS_EVENT", "node.sdk_kernel", "node.event_model", "10-universal-sdk-graph", "SDK kernel emits events per event model schema."),
    ("SERIALIZES_AS", "node.agent_sdk", "node.serialization_format", "10-universal-sdk-graph", "Agent SDK serializes payloads in configured format."),
    ("OBSERVES", "node.environment_adapter", "node.environment", "11-environment-adapter-graph", "Adapter observes environment state changes."),
    ("ACTS_ON", "node.environment_adapter", "node.environment", "11-environment-adapter-graph", "Adapter executes actions on the environment."),
    ("READS_STATE", "node.environment_adapter", "node.environment_state", "11-environment-adapter-graph", "Adapter reads current environment state."),
    ("WRITES_STATE", "node.environment_adapter", "node.environment_state", "11-environment-adapter-graph", "Adapter writes updated environment state."),
    ("REQUIRES_PERMISSION", "node.environment_action", "node.permission_surface", "11-environment-adapter-graph", "Environment actions require permission on exposed surface."),
    ("HAS_RISK_PROFILE", "node.environment", "node.risk_profile", "11-environment-adapter-graph", "Environment carries an associated risk profile."),
    ("EXPOSES_SURFACE", "node.environment", "node.permission_surface", "11-environment-adapter-graph", "Environment exposes a permission surface for policy."),
    ("REPORTS_OBSERVATION", "node.environment_adapter", "node.observation", "11-environment-adapter-graph", "Adapter reports observations from environment polling."),
    ("VALIDATES", "node.graph_validator", "node.schema_validator", "12-engineering-validation-graph", "Graph validator delegates to schema validator."),
    ("CHECKS_COVERAGE_OF", "node.coverage_checker", "node.ontology_graph", "12-engineering-validation-graph", "Coverage checker validates ontology graph completeness."),
    ("ALIGNS_WITH", "node.diagram_alignment_checker", "node.ontology_graph", "12-engineering-validation-graph", "Diagram alignment checker validates against source diagrams."),
    ("REQUIRES_EVIDENCE", "node.evidence_checker", "node.evidence_ref", "12-engineering-validation-graph", "Evidence checker requires evidence references on core nodes."),
    ("DETECTS_ORPHAN", "node.orphan_node_checker", "node.node_class", "12-engineering-validation-graph", "Orphan checker detects unconnected node classes."),
    ("DETECTS_MISSING_EDGE", "node.required_edge_checker", "node.edge_class", "12-engineering-validation-graph", "Required edge checker detects missing mandatory edges."),
    ("BLOCKS_RELEASE", "node.release_gate", "node.graph_validator", "12-engineering-validation-graph", "Release gate blocks release until validation passes."),
    ("CONSTRAINED_BY", "node.agent", "node.graph_constraint", "00-meta-graph", "Agent node class is constrained by graph constraints."),
    ("EVIDENCED_BY", "node.agent", "node.evidence_ref", "00-meta-graph", "Core nodes are evidenced by external references."),
    ("HAS_ATTRIBUTE", "node.node_class", "node.attribute_spec", "00-meta-graph", "Node classes declare typed attribute specifications."),
    ("HAS_CONTRACT", "node.node_class", "node.interface_contract", "00-meta-graph", "Node classes implement interface contracts."),
    ("HAS_STATE_MACHINE", "node.node_class", "node.state_machine", "00-meta-graph", "Node classes may define lifecycle state machines."),
    ("DEFINES", "node.subgraph", "node.node_class", "00-meta-graph", "Subgraph defines its node and edge classes."),
    ("CONTAINS", "node.ontology_graph", "node.subgraph", "00-meta-graph", "Ontology graph contains all domain subgraphs."),
    ("VERSIONED_AS", "node.ontology_graph", "node.version", "00-meta-graph", "Ontology graph is versioned with semantic version metadata."),
    ("BELONGS_TO_NAMESPACE", "node.node_class", "node.namespace", "00-meta-graph", "Artifacts belong to a logical namespace."),
    ("HAS_IDENTITY", "node.agent", "node.agent_identity", "01-agent-core-graph", "Agent has a stable identity for delegation and audit."),
    ("HAS_ROLE", "node.agent", "node.role", "01-agent-core-graph", "Agent assumes a role defining permissions and persona."),
    ("PURSUES_GOAL", "node.agent", "node.goal", "01-agent-core-graph", "Agent pursues one or more goals driving behavior."),
    ("DECOMPOSES_TO_TASK", "node.goal", "node.task", "01-agent-core-graph", "Goals decompose into executable tasks."),
    ("HAS_CAPABILITY", "node.agent", "node.capability", "01-agent-core-graph", "Agent declares capabilities it can invoke."),
    ("BOUNDED_BY", "node.agent", "node.agent_boundary", "01-agent-core-graph", "Agent operates within defined trust boundaries."),
    ("USES_MODEL_INTERFACE", "node.cognitive_core", "node.model_interface", "01-agent-core-graph", "Cognitive core uses a model interface for inference."),
    ("HAS_INSTRUCTION_STACK", "node.agent", "node.instruction_stack", "01-agent-core-graph", "Agent assembles layered instruction stack for prompts."),
    ("RUNS_DECISION_LOOP", "node.agent", "node.decision_loop", "01-agent-core-graph", "Agent runs a perceive-reason-act decision loop."),
    ("UPDATES_STATE", "node.decision_loop", "node.agent_state", "01-agent-core-graph", "Decision loop updates agent state after each iteration."),
    ("RECEIVES_FEEDBACK", "node.agent", "node.feedback_signal", "01-agent-core-graph", "Agent receives feedback signals from evaluators."),
    ("CONTEXTUALIZES", "node.chunk", "node.contextualized_chunk", "03-memory-graph", "Raw chunks are contextualized with metadata for retrieval."),
    ("STORES", "node.memory_store", "node.memory_record", "03-memory-graph", "Memory store persists memory records."),
    ("RETRIEVES_FROM", "node.memory_retriever", "node.memory_store", "03-memory-graph", "Memory retriever queries records from memory store."),
    ("WRITES_TO", "node.memory_writer", "node.memory_store", "03-memory-graph", "Memory writer persists records to memory store."),
    ("VECTOR_INDEXES", "node.vector_index", "node.vector_store", "03-memory-graph", "Vector index maps embeddings in vector store."),
    ("RERANKS", "node.reranker", "node.memory_record", "03-memory-graph", "Reranker re-scores retrieved memory records."),
    ("COMPACTS_TO", "node.memory_compactor", "node.memory_record", "03-memory-graph", "Memory compactor merges records to save capacity."),
    ("FORGETS_BY_POLICY", "node.memory_forgetting_policy", "node.memory_record", "03-memory-graph", "Forgetting policy prunes stale memory records."),
    ("EXPANDS_SEARCH_NODE", "node.reasoning_process", "node.thought_node", "04-reasoning-planning-graph", "Reasoning expands search space with thought nodes."),
    ("EVALUATES_BRANCH", "node.branch_evaluator", "node.thought_node", "04-reasoning-planning-graph", "Branch evaluator scores alternative thought branches."),
    ("SELECTS_BRANCH", "node.branch_evaluator", "node.thought_node", "04-reasoning-planning-graph", "Branch evaluator selects best thought branch."),
    ("REPLANS_ON", "node.replanning_trigger", "node.plan", "04-reasoning-planning-graph", "Replanning trigger forces plan revision."),
    ("DECLARES_SCHEMA", "node.tool_definition", "node.tool_schema", "05-tool-action-graph", "Tool definition declares JSON schema for arguments."),
    ("SELECTED_FOR", "node.tool_definition", "node.tool_selection", "05-tool-action-graph", "Tool definition is selected for invocation."),
    ("INVOKES", "node.tool_call", "node.tool_definition", "05-tool-action-graph", "Tool call invokes a specific tool definition."),
    ("RETURNS", "node.tool_invocation", "node.tool_result", "05-tool-action-graph", "Tool invocation returns structured tool result."),
    ("RAISES", "node.tool_invocation", "node.tool_error", "05-tool-action-graph", "Failed invocation raises tool error."),
    ("WARNS", "node.tool_invocation", "node.tool_warning", "05-tool-action-graph", "Invocation may emit non-fatal tool warnings."),
    ("HAS_SIDE_EFFECT", "node.external_action", "node.side_effect", "05-tool-action-graph", "External actions declare side effects for policy review."),
    ("EXECUTES_CODE", "node.programmatic_tool_calling", "node.code_execution_action", "05-tool-action-graph", "Programmatic calling executes code actions in sandbox."),
    ("ROUTES_TO", "node.router", "node.route", "06-orchestration-graph", "Router selects a route for workflow branching."),
    ("OPTIMIZES", "node.evaluator", "node.optimizer", "06-orchestration-graph", "Evaluator-optimizer loop improves outputs iteratively."),
    ("ADVANCES_TO", "node.run", "node.turn", "07-runtime-harness-graph", "Run advances to the next conversational turn."),
    ("APPENDS_TRANSCRIPT", "node.run", "node.transcript", "07-runtime-harness-graph", "Run appends events to session transcript."),
    ("TRACES", "node.run", "node.trace", "07-runtime-harness-graph", "Run produces structured execution trace."),
    ("RESTORES_FROM", "node.state_store", "node.continuation", "07-runtime-harness-graph", "State store restores session continuation."),
    ("RESETS_CONTEXT_WITH", "node.context_reset", "node.continuation", "07-runtime-harness-graph", "Context reset clears continuation state."),
    ("AUTHORIZES", "node.policy_contract", "node.allow_decision", "08-safety-policy-graph", "Policy contract authorizes allowed actions."),
    ("DENIES", "node.policy_contract", "node.deny_decision", "08-safety-policy-graph", "Policy contract denies prohibited actions."),
    ("LABELS_DATA", "node.information_flow_control", "node.data_label", "08-safety-policy-graph", "IFC labels data for propagation control."),
    ("PROPAGATES_TAINT", "node.information_flow_control", "node.taint", "08-safety-policy-graph", "IFC propagates taint labels across flows."),
    ("SCANS_FOR", "node.prompt_injection_defense", "node.pattern_scan", "08-safety-policy-graph", "Injection defense scans for malicious patterns."),
    ("PROXIES_CREDENTIAL", "node.credential_proxy", "node.secret", "08-safety-policy-graph", "Credential proxy mediates secret access."),
    ("ADVERTISES_CAPABILITY", "node.protocol_endpoint", "node.capability_manifest", "09-protocol-interop-graph", "Endpoint advertises capabilities to peers."),
    ("NEGOTIATES_CAPABILITY", "node.protocol_endpoint", "node.capability_negotiation", "09-protocol-interop-graph", "Endpoint negotiates capability intersection."),
    ("EXPOSES_TOOL", "node.protocol_endpoint", "node.tool_exposure", "09-protocol-interop-graph", "Endpoint exposes tools per capability manifest."),
    ("EXPOSES_RESOURCE", "node.protocol_endpoint", "node.resource_exposure", "09-protocol-interop-graph", "Endpoint exposes resources to remote agents."),
    ("EXPOSES_PROMPT", "node.protocol_endpoint", "node.prompt_exposure", "09-protocol-interop-graph", "Endpoint exposes prompt templates."),
    ("SENDS_MESSAGE", "node.protocol_endpoint", "node.message_envelope", "09-protocol-interop-graph", "Endpoint sends structured message envelopes."),
    ("RECEIVES_MESSAGE", "node.protocol_endpoint", "node.message_envelope", "09-protocol-interop-graph", "Endpoint receives structured message envelopes."),
    ("STARTS_TASK", "node.protocol_endpoint", "node.task_envelope", "09-protocol-interop-graph", "Endpoint starts remote task envelopes."),
    ("UPDATES_TASK_STATE", "node.protocol_endpoint", "node.task_lifecycle", "09-protocol-interop-graph", "Endpoint updates remote task lifecycle state."),
    ("PRODUCES_ARTIFACT", "node.task_envelope", "node.artifact", "09-protocol-interop-graph", "Task envelope produces output artifacts."),
    ("STREAMS_OVER", "node.streaming_channel", "node.transport", "09-protocol-interop-graph", "Streaming channel operates over transport layer."),
    ("CANCELS", "node.protocol_endpoint", "node.cancellation_signal", "09-protocol-interop-graph", "Endpoint sends cancellation signals."),
    ("REPORTS_ERROR", "node.protocol_endpoint", "node.error_envelope", "09-protocol-interop-graph", "Endpoint reports errors in standard envelope."),
    ("TRUNCATES_BY", "node.message_history", "node.chunk_policy", "02-context-info-graph", "Message history truncates per chunk policy limits."),
    ("CHUNKS_TO", "node.message", "node.output_chunk", "02-context-info-graph", "Messages split into output chunks for streaming."),
    ("DISCLOSES_ON_DEMAND", "node.progressive_disclosure", "node.light_index", "02-context-info-graph", "Progressive disclosure materializes light index on demand."),
]


def parse_scalar_block(text: str, key: str) -> str | None:
    """Extract a simple scalar or folded block value for a YAML key."""
    pattern = rf"^{re.escape(key)}:\s*(.+)$"
    m = re.search(pattern, text, re.MULTILINE)
    if m:
        val = m.group(1).strip()
        if val.startswith(">"):
            block = re.search(rf"^{re.escape(key)}:\s*>\s*\n((?:  .+\n?)+)", text, re.MULTILINE)
            if block:
                lines = [ln.strip() for ln in block.group(1).splitlines() if ln.strip()]
                return " ".join(lines)
            return ""
        return val.strip('"').strip("'")

    block = re.search(rf"^{re.escape(key)}:\s*>\s*\n((?:  .+\n?)+)", text, re.MULTILINE)
    if block:
        lines = [ln.strip() for ln in block.group(1).splitlines() if ln.strip()]
        return " ".join(lines)
    return None


def parse_list_items(text: str, key: str) -> list[str]:
    """Parse YAML list under key (inline or block)."""
    inline = re.search(rf"^{re.escape(key)}:\s*\[(.+?)\]", text, re.MULTILINE)
    if inline:
        return [x.strip() for x in re.findall(r"node\.\w+", inline.group(1))]

    block = re.search(rf"^{re.escape(key)}:\s*\n((?:  - .+\n?)+)", text, re.MULTILINE)
    if block:
        return [m.group(1) for m in re.finditer(r"^\s+-\s+(node\.\w+)", block.group(1), re.MULTILINE)]

    scalar = parse_scalar_block(text, key)
    if scalar and scalar.startswith("node."):
        return [scalar]
    return []


def subgraph_from_path(path: Path) -> str:
    parts = path.parts
    for p in parts:
        if re.match(r"\d{2}-.*-graph", p):
            return p
    return "unknown"


def load_nodes() -> dict[str, dict]:
    nodes = {}
    for fp in sorted(ONTOLOGY.glob("*/nodes/*.yaml")):
        text = fp.read_text(encoding="utf-8")
        node_id = parse_scalar_block(text, "id")
        if not node_id or not node_id.startswith("node."):
            continue
        label = parse_scalar_block(text, "label") or ""
        label_zh = parse_scalar_block(text, "label_zh") or ""
        desc = parse_scalar_block(text, "description") or f"{label} node in agent ontology."
        sg = subgraph_from_path(fp)
        nodes[node_id] = {
            "id": node_id,
            "label": label,
            "label_zh": label_zh,
            "subgraph": sg,
            "artifact": "NodeClass",
            "description": desc[:200] if len(desc) > 200 else desc,
        }
    return nodes


def load_edge_classes() -> dict[str, dict]:
    edges = {}
    for fp in sorted(ONTOLOGY.glob("*/edges/*.yaml")):
        text = fp.read_text(encoding="utf-8")
        edge_id = parse_scalar_block(text, "id")
        predicate = parse_scalar_block(text, "predicate")
        if not edge_id or not predicate:
            continue
        desc = parse_scalar_block(text, "description") or f"{predicate} relationship."
        sg = subgraph_from_path(fp)
        sources = parse_list_items(text, "source_domain")
        targets = parse_list_items(text, "target_range")
        edges[edge_id] = {
            "id": edge_id,
            "predicate": predicate,
            "subgraph": sg,
            "description": desc[:200] if len(desc) > 200 else desc,
            "sources": sources,
            "targets": targets,
        }
    return edges


def load_constraints() -> list[dict]:
    constraints = []
    for fp in sorted(ONTOLOGY.glob("*/constraints/*.yaml")):
        text = fp.read_text(encoding="utf-8")
        cid = parse_scalar_block(text, "id")
        if not cid:
            continue
        label = parse_scalar_block(text, "label") or cid
        severity = parse_scalar_block(text, "severity") or "error"
        rule = parse_scalar_block(text, "rule") or ""
        applies: list[str] = []
        applies_section = re.search(r"applies_to:\s*\n(.*?)(?:\n\w|\Z)", text, re.DOTALL)
        if applies_section:
            section = applies_section.group(1)
            inline = re.search(r"nodes:\s*\[(.+?)\]", section)
            if inline:
                applies = [x.strip() for x in re.findall(r"node\.\w+", inline.group(1))]
            else:
                block = re.search(r"nodes:\s*\n((?:\s+- .+\n?)+)", section)
                if block:
                    applies = [m.group(1) for m in re.finditer(r"^\s+-\s+(node\.\w+)", block.group(1), re.MULTILINE)]
        constraints.append({
            "id": cid,
            "label": label,
            "severity": severity,
            "rule": rule.strip(),
            "applies_to": applies,
        })
    return constraints


def load_evidence() -> list[dict]:
    evidence_file = ROOT / "references" / "graph-evidence.yaml"
    if not evidence_file.exists():
        return []

    text = evidence_file.read_text(encoding="utf-8")
    entries = []
    blocks = re.split(r"\n  - id: evidence\.", text)
    for block in blocks[1:]:
        eid = "evidence." + block.split("\n", 1)[0].strip()
        source_type = re.search(r"source_type:\s*(\w+)", block)
        source_name = re.search(r"source_name:\s*(.+)", block)
        location = re.search(r"location:\s*(.+)", block)
        desc_block = re.search(r"description:\s*>\s*\n((?:      .+\n?)+)", block)
        desc = " ".join(ln.strip() for ln in desc_block.group(1).splitlines()) if desc_block else ""
        supports_nodes = re.findall(r"node\.\w+", block.split("supports_edges")[0] if "supports_edges" in block else block)
        supports_edges = []
        if "supports_edges:" in block:
            edge_section = block.split("supports_edges:")[1].split("node_evidence_index")[0]
            supports_edges = re.findall(r"edge\.\w+", edge_section)

        entries.append({
            "id": eid,
            "source_type": source_type.group(1) if source_type else "unknown",
            "source_name": source_name.group(1).strip() if source_name else "",
            "location": location.group(1).strip() if location else "",
            "description": desc,
            "supports_nodes": sorted(set(supports_nodes)),
            "supports_edges": sorted(set(supports_edges)),
        })

    # node_evidence_index
    index_match = re.search(r"node_evidence_index:\s*\n(.*)", text, re.DOTALL)
    if index_match:
        idx_text = index_match.group(1)
        for node_match in re.finditer(r"(node\.\w+):\s*\n((?:    - evidence\.\w+\n?)+)", idx_text):
            node_id = node_match.group(1)
            refs = re.findall(r"evidence\.\w+", node_match.group(2))
            for entry in entries:
                if node_id not in entry["supports_nodes"]:
                    continue
            # Add node links to existing entries via separate node_links field
            for ref in refs:
                for entry in entries:
                    if entry["id"] == ref and node_id not in entry["supports_nodes"]:
                        entry["supports_nodes"].append(node_id)
                # ensure orphan refs get node link
            existing = next((e for e in entries if e["id"] in refs), None)

    # Build node-to-evidence links
    node_links: dict[str, list[str]] = {}
    if index_match:
        for node_match in re.finditer(r"(node\.\w+):\s*\n((?:    - evidence\.\w+\n?)+)", index_match.group(1)):
            node_id = node_match.group(1)
            refs = re.findall(r"evidence\.\w+", node_match.group(2))
            node_links[node_id] = refs

    return entries, node_links


def build_graph_edges(nodes: dict, edge_classes: dict) -> list[dict]:
    seen: set[tuple] = set()
    graph_edges: list[dict] = []

    def add(predicate, source, target, subgraph, description, edge_id=None):
        if not source or not target or source not in nodes or target not in nodes:
            return
        key = (predicate, source, target)
        if key in seen:
            return
        seen.add(key)
        eid = edge_id or f"edge.{predicate}"
        # Disambiguate duplicate predicate ids
        if any(e["id"] == eid and (e["source"] != source or e["target"] != target) for e in graph_edges):
            suffix = target.replace("node.", "")
            eid = f"edge.{predicate}.{suffix}"
        graph_edges.append({
            "id": eid,
            "predicate": predicate,
            "source": source,
            "target": target,
            "subgraph": subgraph,
            "description": description,
        })

    # From edge class definitions
    for ec in edge_classes.values():
        sources = ec["sources"] or []
        targets = ec["targets"] or []
        if sources and targets:
            for s in sources[:1]:
                for t in targets[:1]:
                    add(ec["predicate"], s, t, ec["subgraph"], ec["description"], ec["id"])
        elif sources:
            for s in sources[:1]:
                add(ec["predicate"], s, sources[0], ec["subgraph"], ec["description"], ec["id"])
        elif targets:
            add(ec["predicate"], targets[0], targets[0], ec["subgraph"], ec["description"], ec["id"])

    # Cross-subgraph and supplemental
    for pred, src, tgt, sg, desc in CROSS_SUBGRAPH_EDGES + SUPPLEMENTAL_EDGES:
        add(pred, src, tgt, sg, desc)

    return graph_edges


def build_subgraphs_json(nodes: dict, edges: list[dict]) -> list[dict]:
    result = []
    for sg_id, meta in SUBGRAPH_META.items():
        sg_nodes = sorted(n["id"] for n in nodes.values() if n["subgraph"] == sg_id)
        sg_edge_ids = sorted({e["id"].split(".")[0] + "." + e["id"].split(".")[1] if e["id"].count(".") > 2 else e["id"]
                              for e in edges if e["subgraph"] == sg_id})
        # Normalize edge ids to edge.PREDICATE form for subgraph listing
        edge_class_ids = sorted({f"edge.{e['predicate']}" for e in edges if e["subgraph"] == sg_id})
        result.append({
            **meta,
            "nodes": sg_nodes,
            "edges": edge_class_ids,
            "nodeCount": len(sg_nodes),
            "edgeCount": len(edge_class_ids),
        })
    return result


PATHS = [
    {
        "id": "agent-execution-path",
        "label": "Agent Execution Path",
        "label_zh": "智能体执行路径",
        "nodes": [
            "node.goal", "node.agent", "node.decision_loop", "node.plan", "node.tool_call",
            "node.permission_policy", "node.executor", "node.sandbox", "node.environment_action",
            "node.tool_result", "node.transcript", "node.trace",
        ],
    },
    {
        "id": "tool-discovery-path",
        "label": "Tool Discovery Path",
        "label_zh": "工具发现路径",
        "nodes": [
            "node.context_graph", "node.progressive_disclosure", "node.light_index",
            "node.tool_search", "node.deferred_tool_definition", "node.tool_selection", "node.tool_call",
        ],
    },
    {
        "id": "memory-retrieval-path",
        "label": "Memory Retrieval Path",
        "label_zh": "记忆检索路径",
        "nodes": [
            "node.chunk", "node.contextualized_chunk", "node.sparse_index", "node.vector_index",
            "node.rank_fusion", "node.reranker", "node.memory_retriever", "node.context_graph",
        ],
    },
    {
        "id": "sdk-api-path",
        "label": "SDK API Path",
        "label_zh": "SDK API 路径",
        "nodes": [
            "node.agent_sdk", "node.sdk_kernel", "node.tool_api", "node.workflow_api",
            "node.policy_api", "node.tool_definition", "node.workflow", "node.policy_contract", "node.tool_call",
        ],
    },
    {
        "id": "safety-enforcement-path",
        "label": "Safety Enforcement Path",
        "label_zh": "安全执行路径",
        "nodes": [
            "node.tool_call", "node.policy_contract", "node.permission_policy", "node.approval_flow",
            "node.human_review", "node.allow_decision", "node.executor", "node.sandbox", "node.audit_log",
        ],
    },
    {
        "id": "protocol-interop-path",
        "label": "Protocol Interop Path",
        "label_zh": "协议互操作路径",
        "nodes": [
            "node.protocol", "node.protocol_endpoint", "node.capability_manifest",
            "node.capability_negotiation", "node.tool_exposure", "node.tool_definition", "node.tool_call",
        ],
    },
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    nodes = load_nodes()
    edge_classes = load_edge_classes()
    graph_edges = build_graph_edges(nodes, edge_classes)
    constraints = load_constraints()
    evidence_entries, node_links = load_evidence()

    graph = {
        "meta": {
            "id": "moonweave-agent-ontology",
            "name": "Agent Ontology Schema",
            "name_zh": "Agent 本体图谱",
            "version": "1.0.0",
            "nodeCount": len(nodes),
            "edgeCount": len(graph_edges),
        },
        "nodes": sorted(nodes.values(), key=lambda n: n["id"]),
        "edges": graph_edges,
    }

    subgraphs = build_subgraphs_json(nodes, graph_edges)

    evidence = {
        "entries": evidence_entries,
        "node_index": node_links,
    }

    (OUT / "ontology.graph.json").write_text(json.dumps(graph, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (OUT / "ontology.subgraphs.json").write_text(json.dumps(subgraphs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (OUT / "ontology.paths.json").write_text(json.dumps(PATHS, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (OUT / "ontology.constraints.json").write_text(json.dumps(constraints, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (OUT / "ontology.evidence.json").write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Generated {len(nodes)} nodes, {len(graph_edges)} edges, {len(constraints)} constraints, {len(evidence_entries)} evidence entries")
    for sg in subgraphs:
        print(f"  {sg['id']}: {sg['nodeCount']} nodes, {sg['edgeCount']} edges")


if __name__ == "__main__":
    main()
