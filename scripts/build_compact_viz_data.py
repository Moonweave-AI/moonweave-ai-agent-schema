#!/usr/bin/env python3
"""Build compact visualization data for embedded index.html."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ONTOLOGY = ROOT / "ontology"

SUBGRAPHS = {
    0: ["ontology_graph", "subgraph", "node_class", "edge_class", "attribute_spec", "interface_contract", "state_machine", "graph_constraint", "graph_view", "evidence_ref", "version", "lifecycle", "namespace"],
    1: ["agent", "agent_boundary", "agent_identity", "role", "persona", "goal", "objective", "task", "capability", "autonomy_level", "cognitive_core", "model_interface", "instruction_stack", "decision_loop", "agent_state", "feedback_signal"],
    2: ["context_graph", "container_context", "command_area", "storage_area", "text_input", "message", "user_message", "agent_message", "system_instruction", "developer_instruction", "few_shot_example", "message_history", "output_chunk", "chunk_policy", "progressive_disclosure", "light_index", "file_system_source", "database_source", "network_source", "graph_source", "embedding_source", "skill_source", "tool_info_source", "memory_file_source"],
    3: ["working_memory", "episodic_memory", "semantic_memory", "procedural_memory", "preference_memory", "memory_store", "memory_block", "memory_record", "chunk", "contextualized_chunk", "embedding_model", "sparse_index", "vector_index", "vector_store", "rank_fusion", "reranker", "memory_retriever", "memory_writer", "memory_compactor", "memory_forgetting_policy", "virtual_context"],
    4: ["reasoning_process", "reasoning_trace", "planning_process", "plan", "plan_step", "search_space", "thought_node", "thought_edge", "branch_evaluator", "reflection", "self_critique", "uncertainty_state", "confidence_estimate", "replanning_trigger", "stopping_condition", "thinking_budget"],
    5: ["action_space", "internal_action", "external_action", "tool_definition", "tool_schema", "tool_metadata", "tool_discovery", "tool_search", "tool_match", "deferred_tool_definition", "tool_selection", "tool_call", "tool_invocation", "tool_result", "tool_error", "tool_warning", "tool_registry", "tool_server", "programmatic_tool_calling", "code_execution_action", "computer_use_action", "browser_action", "gui_action", "file_action", "network_action", "side_effect"],
    6: ["workflow", "workflow_node", "workflow_edge", "gate", "prompt_chain", "router", "route", "parallelization", "sectioning", "voting", "orchestrator", "worker", "subagent", "task_distribution", "delegation_contract", "handoff", "evaluator", "optimizer", "review", "feedback", "group_conversation", "blackboard", "consensus_policy", "think_as_tool"],
    7: ["execution_harness", "session", "run", "turn", "event", "transcript", "trace", "checkpoint", "state_store", "continuation", "context_reset", "handoff_artifact", "executor", "sandbox", "container", "process", "command", "stdout_stream", "stderr_stream", "timeout_policy", "retry_policy", "cancellation", "recovery_policy", "resource_budget", "token_budget", "cost_budget"],
    8: ["trust_boundary", "policy_contract", "permission_policy", "allowed_list", "denied_list", "approval_flow", "human_review", "privilege_control", "least_privilege", "information_flow_control", "data_label", "taint", "prompt_injection_defense", "pattern_scan", "cognitive_executive_separation", "sandbox_policy", "network_policy", "file_policy", "credential_proxy", "secret", "audit_log", "warning", "deny_decision", "allow_decision", "escalation", "rollback"],
    9: ["protocol", "protocol_role", "protocol_endpoint", "capability_manifest", "tool_exposure", "resource_exposure", "prompt_exposure", "task_envelope", "task_lifecycle", "message_envelope", "message_part", "artifact", "transport", "authorization_scheme", "capability_negotiation", "streaming_channel", "cancellation_signal", "progress_event", "error_envelope"],
    10: ["agent_sdk", "sdk_kernel", "agent_definition_api", "run_api", "session_api", "state_api", "tool_api", "memory_api", "workflow_api", "policy_api", "adapter_api", "trace_api", "evaluation_api", "extension_point", "middleware", "hook", "callback", "plugin", "skill_package", "connector", "provider_adapter", "model_adapter", "tool_adapter", "environment_adapter_sdk", "protocol_binding", "serialization_format", "error_model", "event_model"],
    11: ["environment", "environment_adapter", "environment_state", "observation", "environment_action", "browser_environment", "gui_environment", "terminal_environment", "file_system_environment", "codebase_environment", "database_environment", "network_environment", "api_environment", "cloud_environment", "local_machine_environment", "container_environment", "mobile_environment", "document_environment", "communication_environment", "human_organization_environment", "regulated_environment", "risk_profile", "permission_surface"],
    12: ["graph_validator", "schema_validator", "constraint_validator", "coverage_checker", "diagram_alignment_checker", "evidence_checker", "orphan_node_checker", "required_edge_checker", "cycle_checker", "runtime_contract_test", "policy_contract_test", "trace_replay_test", "visualization_render_check", "responsive_graph_check", "release_gate"],
}


def parse_scalar(text: str, key: str) -> str | None:
    m = re.search(rf"^{re.escape(key)}:\s*(.+)$", text, re.MULTILINE)
    if m:
        val = m.group(1).strip().strip('"').strip("'")
        if val.startswith(">"):
            block = re.search(rf"^{re.escape(key)}:\s*>\s*\n((?:  .+\n?)+)", text, re.MULTILINE)
            if block:
                return " ".join(ln.strip() for ln in block.group(1).splitlines() if ln.strip())
            return ""
        return val
    block = re.search(rf"^{re.escape(key)}:\s*>\s*\n((?:  .+\n?)+)", text, re.MULTILINE)
    if block:
        return " ".join(ln.strip() for ln in block.group(1).splitlines() if ln.strip())
    return None


def load_yaml_meta() -> dict:
    meta = {}
    for fp in sorted(ONTOLOGY.glob("*/nodes/*.yaml")):
        text = fp.read_text(encoding="utf-8")
        nid = parse_scalar(text, "id")
        if not nid:
            continue
        short = nid.replace("node.", "")
        desc = parse_scalar(text, "description") or ""
        meta[short] = {
            "label": parse_scalar(text, "label") or short,
            "label_zh": parse_scalar(text, "label_zh") or "",
            "desc": desc[:80],
        }
    return meta


def build_edges():
    specs = []
    specs += [
        ("CONTAINS", "ontology_graph", "subgraph", 0),
        ("DEFINES", "ontology_graph", "node_class", 0),
        ("HAS_ATTRIBUTE", "node_class", "attribute_spec", 0),
        ("HAS_CONTRACT", "node_class", "interface_contract", 0),
        ("HAS_STATE_MACHINE", "node_class", "state_machine", 0),
        ("CONSTRAINED_BY", "graph_constraint", "node_class", 0),
    ]
    specs += [
        ("HAS_IDENTITY", "agent", "agent_identity", 1),
        ("HAS_ROLE", "agent", "role", 1),
        ("PURSUES_GOAL", "agent", "goal", 1),
        ("DECOMPOSES_TO_TASK", "goal", "task", 1),
        ("HAS_CAPABILITY", "agent", "capability", 1),
        ("BOUNDED_BY", "agent", "cognitive_core", 1),
        ("USES_MODEL_INTERFACE", "cognitive_core", "model_interface", 1),
        ("HAS_INSTRUCTION_STACK", "agent", "instruction_stack", 1),
        ("RUNS_DECISION_LOOP", "agent", "decision_loop", 1),
        ("UPDATES_STATE", "decision_loop", "agent_state", 1),
        ("RECEIVES_FEEDBACK", "agent", "feedback_signal", 1),
        ("PART_OF", "task", "objective", 1),
    ]
    specs += [
        ("CONTAINS", "context_graph", "container_context", 2),
        ("CONTAINS", "container_context", "command_area", 2),
        ("CONTAINS", "container_context", "storage_area", 2),
        ("IS_A", "message", "user_message", 2),
        ("IS_A", "message", "agent_message", 2),
        ("CONTAINS", "context_graph", "message_history", 2),
        ("CHUNKS_TO", "progressive_disclosure", "output_chunk", 2),
        ("INDEXES", "light_index", "progressive_disclosure", 2),
        ("PROVIDES_CONTEXT_TO", "file_system_source", "context_graph", 2),
        ("PROVIDES_CONTEXT_TO", "database_source", "context_graph", 2),
    ]
    specs += [
        ("STORES", "memory_store", "working_memory", 3),
        ("STORES", "memory_store", "episodic_memory", 3),
        ("STORES", "memory_store", "semantic_memory", 3),
        ("STORES", "memory_store", "procedural_memory", 3),
        ("STORES", "memory_store", "preference_memory", 3),
        ("RETRIEVES_FROM", "memory_retriever", "memory_store", 3),
        ("WRITES_TO", "memory_writer", "memory_store", 3),
        ("CONTEXTUALIZES", "chunk", "contextualized_chunk", 3),
        ("EMBEDS_WITH", "embedding_model", "vector_index", 3),
        ("FUSES_RANKS", "sparse_index", "rank_fusion", 3),
        ("FUSES_RANKS", "vector_index", "rank_fusion", 3),
        ("RERANKS", "rank_fusion", "reranker", 3),
        ("COMPACTS_TO", "memory_compactor", "memory_record", 3),
    ]
    specs += [
        ("GENERATES", "reasoning_process", "reasoning_trace", 4),
        ("GENERATES_PLAN", "planning_process", "plan", 4),
        ("CONTAINS", "plan", "plan_step", 4),
        ("CONTAINS", "search_space", "thought_node", 4),
        ("CONNECTS", "thought_node", "thought_edge", 4),
        ("EVALUATES_BRANCH", "branch_evaluator", "thought_node", 4),
        ("REFLECTS_ON", "reflection", "reasoning_trace", 4),
        ("CONSUMES_BUDGET", "thinking_budget", "reasoning_process", 4),
    ]
    specs += [
        ("DECLARES_SCHEMA", "tool_definition", "tool_schema", 5),
        ("DISCOVERED_BY", "tool_discovery", "tool_search", 5),
        ("MATCHED_BY", "tool_search", "tool_match", 5),
        ("SELECTED_FOR", "tool_selection", "tool_call", 5),
        ("INVOKES", "tool_call", "tool_definition", 5),
        ("RETURNS", "tool_invocation", "tool_result", 5),
        ("RAISES", "tool_invocation", "tool_error", 5),
        ("CONTAINS", "tool_registry", "tool_definition", 5),
        ("HOSTS", "tool_server", "tool_registry", 5),
        ("EXECUTES_CODE", "programmatic_tool_calling", "code_execution_action", 5),
        ("OPERATES_GUI", "computer_use_action", "gui_action", 5),
        ("HAS_SIDE_EFFECT", "external_action", "side_effect", 5),
    ]
    specs += [
        ("CONTAINS", "workflow", "workflow_node", 6),
        ("CONNECTS", "workflow_node", "workflow_edge", 6),
        ("GATES", "prompt_chain", "gate", 6),
        ("ROUTES_TO", "router", "route", 6),
        ("FORKS_TO", "parallelization", "sectioning", 6),
        ("DELEGATES_TO", "orchestrator", "worker", 6),
        ("DELEGATES_TO", "orchestrator", "subagent", 6),
        ("REVIEWS", "evaluator", "optimizer", 6),
        ("SHARES_STATE_VIA", "blackboard", "group_conversation", 6),
        ("CONSTRAINS", "delegation_contract", "subagent", 6),
        ("HANDOFFS_TO", "handoff", "subagent", 6),
    ]
    specs += [
        ("STARTS", "execution_harness", "session", 7),
        ("CONTAINS", "session", "run", 7),
        ("ADVANCES_TO", "run", "turn", 7),
        ("EMITS_EVENT", "turn", "event", 7),
        ("APPENDS_TRANSCRIPT", "run", "transcript", 7),
        ("TRACES", "run", "trace", 7),
        ("CHECKPOINTS", "run", "checkpoint", 7),
        ("STORED_IN", "checkpoint", "state_store", 7),
        ("EXECUTES_IN", "executor", "sandbox", 7),
        ("CONTAINS", "sandbox", "container", 7),
        ("RUNS", "container", "process", 7),
        ("EXECUTES", "process", "command", 7),
        ("STREAMS_TO", "command", "stdout_stream", 7),
        ("BOUNDED_BY", "run", "timeout_policy", 7),
        ("RETRIES_BY", "run", "retry_policy", 7),
        ("BOUNDED_BY_BUDGET", "run", "token_budget", 7),
    ]
    specs += [
        ("CONTAINS", "trust_boundary", "policy_contract", 8),
        ("DEFINES", "policy_contract", "permission_policy", 8),
        ("INCLUDES", "permission_policy", "allowed_list", 8),
        ("INCLUDES", "permission_policy", "denied_list", 8),
        ("REQUIRES_HUMAN_REVIEW", "approval_flow", "human_review", 8),
        ("IMPLEMENTS", "privilege_control", "least_privilege", 8),
        ("LABELS_DATA", "information_flow_control", "data_label", 8),
        ("PROPAGATES_TAINT", "data_label", "taint", 8),
        ("SCANS_FOR", "prompt_injection_defense", "pattern_scan", 8),
        ("SEPARATES", "cognitive_executive_separation", "sandbox", 8),
        ("PROXIES_CREDENTIAL", "credential_proxy", "secret", 8),
        ("AUDITS", "audit_log", "policy_contract", 8),
        ("ROLLS_BACK", "rollback", "side_effect", 8),
    ]
    specs += [
        ("DEFINES", "protocol", "protocol_role", 9),
        ("HOSTS", "protocol", "protocol_endpoint", 9),
        ("ADVERTISES_CAPABILITY", "protocol_endpoint", "capability_manifest", 9),
        ("EXPOSES_TOOL", "capability_manifest", "tool_exposure", 9),
        ("EXPOSES_RESOURCE", "capability_manifest", "resource_exposure", 9),
        ("AUTHORIZES_WITH", "protocol_endpoint", "authorization_scheme", 9),
        ("MANAGES", "task_envelope", "task_lifecycle", 9),
        ("CONTAINS", "message_envelope", "message_part", 9),
        ("USES", "protocol_endpoint", "transport", 9),
        ("STREAMS", "streaming_channel", "progress_event", 9),
    ]
    specs += [
        ("COMPOSES", "agent_sdk", "sdk_kernel", 10),
        ("EXPOSES_API", "sdk_kernel", "agent_definition_api", 10),
        ("EXPOSES_API", "sdk_kernel", "run_api", 10),
        ("EXPOSES_API", "sdk_kernel", "session_api", 10),
        ("EXPOSES_API", "sdk_kernel", "tool_api", 10),
        ("EXPOSES_API", "sdk_kernel", "memory_api", 10),
        ("EXPOSES_API", "sdk_kernel", "workflow_api", 10),
        ("EXPOSES_API", "sdk_kernel", "policy_api", 10),
        ("EXPOSES_API", "sdk_kernel", "adapter_api", 10),
        ("EXPOSES_API", "sdk_kernel", "trace_api", 10),
        ("REGISTERS", "sdk_kernel", "extension_point", 10),
        ("HOOKS", "extension_point", "middleware", 10),
        ("HOOKS", "extension_point", "hook", 10),
        ("LOADS_SKILL", "plugin", "skill_package", 10),
        ("SPECIALIZES", "provider_adapter", "model_adapter", 10),
        ("SPECIALIZES", "provider_adapter", "tool_adapter", 10),
        ("ADAPTS", "adapter_api", "environment_adapter_sdk", 10),
        ("BINDS", "protocol_binding", "protocol", 10),
    ]
    specs += [
        ("ADAPTS_TO", "environment", "environment_adapter", 11),
        ("HAS_STATE", "environment", "environment_state", 11),
        ("REPORTS_OBSERVATION", "environment_adapter", "observation", 11),
        ("ACTS_ON", "environment", "environment_action", 11),
        ("IS_A", "environment", "browser_environment", 11),
        ("IS_A", "environment", "terminal_environment", 11),
        ("IS_A", "environment", "file_system_environment", 11),
        ("IS_A", "environment", "database_environment", 11),
        ("IS_A", "environment", "api_environment", 11),
        ("IS_A", "environment", "cloud_environment", 11),
        ("HAS_RISK_PROFILE", "environment", "risk_profile", 11),
        ("EXPOSES_SURFACE", "environment", "permission_surface", 11),
    ]
    specs += [
        ("DELEGATES", "graph_validator", "schema_validator", 12),
        ("DELEGATES", "graph_validator", "constraint_validator", 12),
        ("DELEGATES", "graph_validator", "coverage_checker", 12),
        ("DELEGATES", "graph_validator", "orphan_node_checker", 12),
        ("DELEGATES", "graph_validator", "required_edge_checker", 12),
        ("BLOCKS_RELEASE", "release_gate", "graph_validator", 12),
    ]
    cross = [
        ("READS_CONTEXT", "agent", "context_graph"),
        ("RETRIEVES_FROM", "agent", "memory_retriever"),
        ("USES_REASONING", "decision_loop", "reasoning_process"),
        ("GENERATES_PLAN", "decision_loop", "plan"),
        ("REQUESTS_ACTION", "plan_step", "tool_call"),
        ("PRODUCES_WORKFLOW", "plan_step", "workflow"),
        ("REQUESTS_ACTION", "orchestrator", "tool_call"),
        ("GUARDED_BY", "tool_call", "policy_contract"),
        ("EXECUTED_BY", "tool_call", "executor"),
        ("OPERATES_ON", "executor", "environment_adapter"),
        ("WRITES_TO", "tool_result", "memory_writer"),
        ("APPENDS_TO", "tool_result", "transcript"),
        ("GOVERNED_BY", "sandbox", "sandbox_policy"),
        ("EXPOSES_TOOL", "protocol_endpoint", "tool_definition"),
        ("MANAGES", "tool_api", "tool_definition"),
        ("MANAGES", "workflow_api", "workflow"),
        ("MANAGES", "policy_api", "policy_contract"),
        ("CONNECTS", "trace_api", "trace"),
        ("CONNECTS", "adapter_api", "environment_adapter"),
        ("VALIDATES", "graph_validator", "ontology_graph"),
        ("INJECTS_INTO", "memory_retriever", "context_graph"),
        ("PROVIDES", "working_memory", "context_graph"),
        ("IS_A", "subagent", "agent"),
    ]
    node_to_sg = {n: sg for sg, nodes in SUBGRAPHS.items() for n in nodes}
    for pred, src, tgt in cross:
        specs.append((pred, src, tgt, node_to_sg[src]))
    return specs


PATHS = [
    {"id": "agent_execution", "label": "Agent Execution", "nodes": ["goal", "agent", "decision_loop", "plan", "tool_call", "permission_policy", "executor", "sandbox", "environment_action", "tool_result", "transcript", "trace"]},
    {"id": "tool_discovery", "label": "Tool Discovery", "nodes": ["file_system_source", "progressive_disclosure", "light_index", "tool_search", "deferred_tool_definition", "tool_selection", "tool_call"]},
    {"id": "memory_retrieval", "label": "Memory Retrieval", "nodes": ["chunk", "contextualized_chunk", "sparse_index", "vector_index", "rank_fusion", "reranker", "memory_retriever", "context_graph"]},
    {"id": "sdk_api", "label": "SDK API", "nodes": ["agent_sdk", "sdk_kernel", "tool_api", "tool_definition", "tool_call"]},
    {"id": "safety_enforcement", "label": "Safety Enforcement", "nodes": ["tool_call", "policy_contract", "permission_policy", "approval_flow", "human_review", "allow_decision", "executor", "sandbox", "audit_log"]},
    {"id": "protocol_interop", "label": "Protocol Interop", "nodes": ["protocol", "protocol_endpoint", "capability_manifest", "tool_exposure", "tool_definition", "tool_call"]},
]

SG_META = [
    {"i": 0, "label": "Meta Graph", "label_zh": "元图", "color": "#6366f1", "x": 0, "y": 420},
    {"i": 1, "label": "Agent Core", "label_zh": "智能体核心", "color": "#3b82f6", "x": 0, "y": -320},
    {"i": 2, "label": "Context Info", "label_zh": "上下文信息", "color": "#06b6d4", "x": -480, "y": -180},
    {"i": 3, "label": "Memory", "label_zh": "记忆", "color": "#14b8a6", "x": -480, "y": 40},
    {"i": 4, "label": "Reasoning", "label_zh": "推理规划", "color": "#22c55e", "x": 480, "y": -180},
    {"i": 5, "label": "Tool/Action", "label_zh": "工具动作", "color": "#eab308", "x": 480, "y": 40},
    {"i": 6, "label": "Orchestration", "label_zh": "编排", "color": "#f97316", "x": 0, "y": 40},
    {"i": 7, "label": "Runtime", "label_zh": "运行时", "color": "#ef4444", "x": -480, "y": 260},
    {"i": 8, "label": "Safety/Policy", "label_zh": "安全策略", "color": "#ec4899", "x": 0, "y": 260},
    {"i": 9, "label": "Protocol", "label_zh": "协议互操作", "color": "#a855f7", "x": 480, "y": 260},
    {"i": 10, "label": "Universal SDK", "label_zh": "通用SDK", "color": "#8b5cf6", "x": -720, "y": 40},
    {"i": 11, "label": "Environment", "label_zh": "环境适配", "color": "#64748b", "x": 720, "y": 40},
    {"i": 12, "label": "Validation", "label_zh": "验证", "color": "#78716c", "x": 240, "y": 420},
]

HUB_NODES = {
    "agent", "goal", "tool_call", "plan", "decision_loop", "context_graph", "memory_retriever",
    "memory_store", "workflow", "orchestrator", "executor", "sandbox", "policy_contract",
    "permission_policy", "protocol_endpoint", "agent_sdk", "sdk_kernel", "tool_api",
    "environment", "graph_validator", "ontology_graph", "tool_definition", "reasoning_process",
}


def main():
    yaml_meta = load_yaml_meta()
    nodes = []
    id_map = {}
    for sg_idx, node_list in SUBGRAPHS.items():
        for short in node_list:
            idx = len(nodes)
            id_map[short] = idx
            meta = yaml_meta.get(short, {
                "label": short.replace("_", " ").title(),
                "label_zh": "",
                "desc": f"{short} in agent ontology.",
            })
            nodes.append([short, meta["label"], meta["label_zh"], sg_idx, meta["desc"]])

    edges = []
    missing = []
    for pred, src, tgt, sg in build_edges():
        if src not in id_map or tgt not in id_map:
            missing.append((pred, src, tgt))
            continue
        edges.append([pred, id_map[src], id_map[tgt], sg])

    path_indices = []
    for p in PATHS:
        path_indices.append({
            "id": p["id"],
            "label": p["label"],
            "nodes": [id_map[n] for n in p["nodes"] if n in id_map],
        })

    data = {
        "nodes": nodes,
        "edges": edges,
        "paths": path_indices,
        "subgraphs": SG_META,
        "hubs": sorted(id_map[n] for n in HUB_NODES if n in id_map),
    }
    out = ROOT / "visualization" / "_compact_data.json"
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Nodes: {len(nodes)}, Edges: {len(edges)}, Missing: {len(missing)}")
    if missing:
        print("Missing:", missing)


if __name__ == "__main__":
    main()
