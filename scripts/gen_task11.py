#!/usr/bin/env python3
"""Generate ontology/11-environment-adapter-graph YAML artifacts."""
from gen_common import BASE, write_constraint, write_contract, write_edge, write_node, write_state


def attr(typ, req, desc, **extra):
    d = {"type": typ, "required": req, "description": desc}
    d.update(extra)
    return d


def env_node(name, label, label_zh, desc, plane="Tool"):
    return {
        "label": label,
        "label_zh": label_zh,
        "desc": desc,
        "layer": "environment",
        "plane": plane,
        "interfaces": ["contract.observable", "contract.actionable", "contract.risk_assessable"],
        "state_machine": "state.environment_lifecycle",
        "attrs": {
            "environment_type": attr("string", True, "Category identifier for this environment"),
            "connection_uri": attr("uri", False, "Address or path to connect to the environment"),
            "isolation_level": attr("enum", False, "Sandbox isolation applied", values=["none", "process", "container", "vm"]),
        },
    }


def generate() -> None:
    root = BASE / "11-environment-adapter-graph"
    nodes = {
        "environment": {
            "label": "Environment",
            "label_zh": "环境",
            "desc": "Abstract execution environment representing any external context in which an agent observes state and performs actions.",
            "layer": "environment",
            "interfaces": ["contract.observable", "contract.actionable"],
            "attrs": {
                "environment_id": attr("string", True, "Unique environment instance identifier"),
                "display_name": attr("string", False, "Human-readable environment label"),
                "category": attr("string", True, "High-level environment category"),
            },
        },
        "environment_adapter": {
            "label": "Environment Adapter",
            "label_zh": "环境适配器",
            "desc": "Bridge component translating between agent-level observation/action abstractions and environment-specific APIs and semantics.",
            "layer": "environment",
            "attrs": {
                "adapter_id": attr("string", True, "Unique adapter identifier"),
                "normalization_version": attr("string", False, "Schema version for normalized observations and actions"),
                "supported_operations": attr("array", False, "Environment operations supported by this adapter"),
            },
        },
        "environment_state": {
            "label": "Environment State",
            "label_zh": "环境状态",
            "desc": "Snapshot or live representation of the current state of an environment including variables, layout, and resource availability.",
            "layer": "environment",
            "plane": "Memory",
            "attrs": {
                "state_id": attr("string", True, "Unique state snapshot identifier"),
                "captured_at": attr("datetime", True, "Timestamp when state was captured"),
                "state_hash": attr("string", False, "Content hash for change detection"),
                "state_payload_ref": attr("string", True, "Reference to serialized state payload"),
            },
        },
        "observation": {
            "label": "Observation",
            "label_zh": "观测",
            "desc": "Data perceived from an environment by an agent including sensory input, API responses, file contents, or UI state snapshots.",
            "layer": "environment",
            "plane": "Info",
            "attrs": {
                "observation_id": attr("string", True, "Unique observation identifier"),
                "observation_type": attr("string", True, "Category of observed data"),
                "content_ref": attr("string", True, "Reference to observation payload"),
                "confidence": attr("number", False, "Confidence score from 0.0 to 1.0 if applicable"),
            },
        },
        "environment_action": {
            "label": "Environment Action",
            "label_zh": "环境动作",
            "desc": "Action performed by an agent on an environment such as clicking, typing, API calls, file writes, or database queries.",
            "layer": "environment",
            "plane": "Tool",
            "attrs": {
                "action_id": attr("string", True, "Unique action identifier"),
                "action_type": attr("string", True, "Category of action performed"),
                "parameters_ref": attr("string", True, "Reference to action parameter payload"),
                "side_effect_level": attr("enum", False, "Expected side effect severity", values=["none", "read_only", "reversible", "destructive"]),
            },
        },
        "browser_environment": env_node(
            "browser_environment", "Browser Environment", "浏览器环境",
            "Web browser execution context supporting DOM observation, navigation, form interaction, and JavaScript execution.",
        ),
        "gui_environment": env_node(
            "gui_environment", "GUI Environment", "图形界面环境",
            "Desktop or mobile graphical user interface context supporting screen capture, element targeting, and input simulation.",
        ),
        "terminal_environment": env_node(
            "terminal_environment", "Terminal Environment", "终端环境",
            "Shell or command-line interface context supporting command execution, output capture, and process management.",
        ),
        "file_system_environment": env_node(
            "file_system_environment", "File System Environment", "文件系统环境",
            "Local or remote file system context supporting read, write, search, and directory operations.",
        ),
        "codebase_environment": env_node(
            "codebase_environment", "Codebase Environment", "代码库环境",
            "Source code repository context supporting file navigation, search, diff, and version control operations.",
            "Info",
        ),
        "database_environment": env_node(
            "database_environment", "Database Environment", "数据库环境",
            "Structured data store context supporting schema inspection, query execution, and transactional mutations.",
        ),
        "network_environment": env_node(
            "network_environment", "Network Environment", "网络环境",
            "Network and internet context supporting HTTP requests, socket connections, and network diagnostics.",
        ),
        "api_environment": env_node(
            "api_environment", "API Environment", "API 环境",
            "External API service context supporting REST, GraphQL, or RPC invocation against third-party services.",
        ),
        "cloud_environment": env_node(
            "cloud_environment", "Cloud Environment", "云环境",
            "Cloud infrastructure context supporting resource provisioning, deployment, and managed service operations.",
        ),
        "local_machine_environment": env_node(
            "local_machine_environment", "Local Machine Environment", "本地机器环境",
            "Physical or virtual machine context supporting OS-level operations, process management, and hardware access.",
        ),
        "container_environment": env_node(
            "container_environment", "Container Environment", "容器环境",
            "Container runtime context supporting isolated process execution with defined resource limits and networking.",
        ),
        "mobile_environment": env_node(
            "mobile_environment", "Mobile Environment", "移动设备环境",
            "Mobile device context supporting app interaction, sensor access, and platform-specific APIs.",
        ),
        "document_environment": env_node(
            "document_environment", "Document Environment", "文档环境",
            "Document editing context supporting rich text, spreadsheets, presentations, and collaborative editing operations.",
            "Info",
        ),
        "communication_environment": env_node(
            "communication_environment", "Communication Environment", "通信环境",
            "Email, chat, and messaging context supporting send, receive, and thread management operations.",
            "Info",
        ),
        "human_organization_environment": env_node(
            "human_organization_environment", "Human Organization Environment", "人类组织环境",
            "Human team and organizational context supporting task assignment, approval workflows, and collaborative decision-making.",
            "Orchestration",
        ),
        "regulated_environment": env_node(
            "regulated_environment", "Regulated Environment", "受监管环境",
            "Compliance-governed context with mandatory audit trails, data handling restrictions, and approval gates.",
            "Orchestration",
        ),
        "risk_profile": {
            "label": "Risk Profile",
            "label_zh": "风险画像",
            "desc": "Quantified risk assessment of an environment covering data sensitivity, blast radius, reversibility, and compliance exposure.",
            "layer": "environment",
            "plane": "Orchestration",
            "attrs": {
                "risk_level": attr("enum", True, "Overall risk classification", values=["low", "medium", "high", "critical"]),
                "data_sensitivity": attr("enum", False, "Classification of data handled", values=["public", "internal", "confidential", "restricted"]),
                "blast_radius": attr("enum", False, "Scope of potential impact from misaction", values=["local", "team", "organization", "external"]),
                "reversibility_score": attr("number", False, "Fraction of actions that are reversible from 0.0 to 1.0"),
            },
        },
        "permission_surface": {
            "label": "Permission Surface",
            "label_zh": "权限面",
            "desc": "Set of permissions an environment exposes defining what actions are allowed, denied, or require elevated approval.",
            "layer": "environment",
            "plane": "Orchestration",
            "attrs": {
                "surface_id": attr("string", True, "Unique permission surface identifier"),
                "permission_count": attr("integer", False, "Number of distinct permissions defined"),
                "default_policy": attr("enum", False, "Default permission when not explicitly granted", values=["allow", "deny", "ask"]),
                "elevation_required": attr("boolean", False, "Whether some permissions require human elevation"),
            },
        },
    }
    for name, spec in nodes.items():
        write_node(root / "nodes" / f"{name}.yaml", name, spec)

    edges = {
        "OBSERVES": ("observes", {
            "source_domain": "node.environment_adapter",
            "target_range": "node.environment",
            "cardinality": "N:1",
            "desc": "Adapter observes state and events from a connected environment.",
        }),
        "ACTS_ON": ("acts_on", {
            "source_domain": "node.environment_adapter",
            "target_range": "node.environment",
            "cardinality": "N:1",
            "desc": "Adapter performs actions on a connected environment on behalf of the agent.",
        }),
        "READS_STATE": ("reads_state", {
            "source_domain": "node.environment_adapter",
            "target_range": "node.environment_state",
            "cardinality": "1:N",
            "desc": "Adapter reads a captured or live environment state snapshot.",
        }),
        "WRITES_STATE": ("writes_state", {
            "source_domain": "node.environment_adapter",
            "target_range": "node.environment_state",
            "cardinality": "1:N",
            "desc": "Adapter writes or updates environment state through controlled mutations.",
        }),
        "ADAPTS_TO": ("adapts_to", {
            "source_domain": "node.environment_adapter",
            "target_range": [
                "node.browser_environment", "node.gui_environment", "node.terminal_environment",
                "node.file_system_environment", "node.codebase_environment", "node.database_environment",
                "node.network_environment", "node.api_environment", "node.cloud_environment",
                "node.local_machine_environment", "node.container_environment", "node.mobile_environment",
                "node.document_environment", "node.communication_environment",
                "node.human_organization_environment", "node.regulated_environment",
            ],
            "cardinality": "N:1",
            "desc": "Adapter specializes for a specific environment type category.",
        }),
        "REQUIRES_PERMISSION": ("requires_permission", {
            "source_domain": "node.environment_action",
            "target_range": "node.permission_surface",
            "cardinality": "N:M",
            "desc": "Action requires one or more permissions from the environment permission surface.",
        }),
        "HAS_RISK_PROFILE": ("has_risk_profile", {
            "source_domain": "node.environment",
            "target_range": "node.risk_profile",
            "cardinality": "1:1",
            "desc": "Environment is associated with a quantified risk profile for policy evaluation.",
        }),
        "EXPOSES_SURFACE": ("exposes_surface", {
            "source_domain": "node.environment",
            "target_range": "node.permission_surface",
            "cardinality": "1:1",
            "desc": "Environment exposes a permission surface defining allowed and denied operations.",
        }),
        "REPORTS_OBSERVATION": ("reports_observation", {
            "source_domain": "node.environment_adapter",
            "target_range": "node.observation",
            "cardinality": "1:N",
            "desc": "Adapter reports a normalized observation captured from the environment.",
        }),
    }
    for pred, (fname, spec) in edges.items():
        write_edge(root / "edges" / f"{fname}.yaml", pred, spec)

    write_contract(root / "contracts/observable.yaml", "observable", {
        "label": "Observable",
        "label_zh": "可观测",
        "desc": "Behavioral contract requiring environments to support observation of state and events by connected adapters.",
        "operations": [
            {"name": "observe", "description": "Capture current environment state or event",
             "input": {"filter": {"type": "object", "description": "Optional observation filter criteria"}},
             "output": {"observation": {"type": "object", "description": "Normalized observation payload"}},
             "errors": ["ObservationFailedError", "EnvironmentUnavailableError"]},
            {"name": "subscribe", "description": "Subscribe to environment change notifications",
             "input": {"event_types": {"type": "array", "description": "Event types to subscribe to"}},
             "output": {"subscription_id": {"type": "string", "description": "Active subscription identifier"}},
             "errors": ["SubscriptionNotSupportedError"]},
        ],
    })
    write_contract(root / "contracts/actionable.yaml", "actionable", {
        "label": "Actionable",
        "label_zh": "可执行",
        "desc": "Behavioral contract requiring environments to accept validated actions from adapters with permission checks.",
        "operations": [
            {"name": "execute_action", "description": "Perform an action on the environment",
             "input": {"action": {"type": "object", "description": "Normalized action payload"}},
             "output": {"result": {"type": "object", "description": "Action execution result"}},
             "errors": ["PermissionDeniedError", "ActionFailedError", "EnvironmentUnavailableError"]},
            {"name": "list_actions", "description": "Enumerate action types supported by this environment",
             "input": {},
             "output": {"action_types": {"type": "array", "description": "Supported action type identifiers"}},
             "errors": []},
        ],
    })
    write_contract(root / "contracts/risk_assessable.yaml", "risk_assessable", {
        "label": "Risk Assessable",
        "label_zh": "可风险评估",
        "desc": "Behavioral contract requiring environments to expose quantifiable risk profiles for policy and safety evaluation.",
        "operations": [
            {"name": "assess_risk", "description": "Compute or retrieve current risk profile",
             "input": {"context_ref": {"type": "string", "description": "Optional context for risk assessment"}},
             "output": {"risk_profile": {"type": "object", "description": "Quantified risk assessment"}},
             "errors": ["RiskAssessmentUnavailableError"]},
        ],
    })
    write_state(root / "states/environment_lifecycle.yaml", "environment_lifecycle", {
        "label": "Environment Lifecycle",
        "label_zh": "环境生命周期",
        "desc": "Lifecycle states for an environment connection from discovery through active use, disconnection, and unavailability.",
        "states": [
            {"name": "unknown", "initial": True, "description": "Environment not yet discovered or characterized"},
            {"name": "discovered", "description": "Environment identified but not yet connected"},
            {"name": "connected", "description": "Adapter established connection to environment"},
            {"name": "active", "description": "Environment actively receiving observations and actions"},
            {"name": "disconnected", "description": "Connection closed but environment may reconnect"},
            {"name": "unavailable", "terminal": True, "description": "Environment permanently or persistently unreachable"},
        ],
        "transitions": [
            {"from": "unknown", "to": "discovered", "trigger": "discover", "description": "Environment discovered via scan or configuration"},
            {"from": "discovered", "to": "connected", "trigger": "connect", "description": "Adapter connects to environment"},
            {"from": "connected", "to": "active", "trigger": "activate", "description": "Environment ready for observation and action"},
            {"from": "active", "to": "disconnected", "trigger": "disconnect", "description": "Connection closed gracefully"},
            {"from": "connected", "to": "disconnected", "trigger": "disconnect", "description": "Disconnect before activation"},
            {"from": "disconnected", "to": "connected", "trigger": "reconnect", "description": "Re-establish connection"},
            {"from": "discovered", "to": "unavailable", "trigger": "unreachable", "description": "Environment cannot be reached"},
            {"from": "active", "to": "unavailable", "trigger": "unreachable", "description": "Environment became persistently unavailable"},
        ],
    })
    write_constraint(root / "constraints/environment_action_must_have_permission.yaml", "environment_action_must_have_permission", {
        "label": "Environment Action Must Have Permission",
        "label_zh": "环境动作必须有权限",
        "severity": "error",
        "rule": "Every node.environment_action instance MUST have at least one REQUIRES_PERMISSION edge to a node.permission_surface granting the action, or explicit policy exemption.",
        "applies_to": {"nodes": ["node.environment_action"], "edges": ["edge.REQUIRES_PERMISSION"]},
        "desc": "Safety rule ensuring all environment mutations pass permission checks before execution.",
    })
    write_constraint(root / "constraints/environment_must_define_observation_action_state.yaml", "environment_must_define_observation_action_state", {
        "label": "Environment Must Define Observation Action State",
        "label_zh": "环境必须定义观测动作状态",
        "severity": "error",
        "rule": "Every concrete environment node type MUST implement contract.observable and contract.actionable and support READS_STATE and WRITES_STATE via an environment adapter.",
        "applies_to": {"nodes": ["node.environment"], "edges": ["edge.OBSERVES", "edge.ACTS_ON", "edge.READS_STATE", "edge.WRITES_STATE"]},
        "desc": "Completeness rule ensuring all environments support the full observe-act-state triangle.",
    })
    print(f"Task 3 complete: {len(nodes)} nodes, {len(edges)} edges")


if __name__ == "__main__":
    generate()
