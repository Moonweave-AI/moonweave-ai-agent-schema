#!/usr/bin/env python3
"""Generate ontology/10-universal-sdk-graph YAML artifacts."""
from gen_common import BASE, write_constraint, write_contract, write_edge, write_node, write_state


def attr(typ, req, desc, **extra):
    d = {"type": typ, "required": req, "description": desc}
    d.update(extra)
    return d


def api_node(name, label, label_zh, desc, plane="Orchestration"):
    return {
        "label": label,
        "label_zh": label_zh,
        "desc": desc,
        "layer": "sdk",
        "plane": plane,
        "attrs": {
            "api_version": attr("string", True, "Semantic version of the API surface"),
            "namespace": attr("string", False, "Logical namespace grouping API operations"),
            "operation_count": attr("integer", False, "Number of exposed operations"),
        },
    }


def generate() -> None:
    root = BASE / "10-universal-sdk-graph"
    nodes = {
        "agent_sdk": {
            "label": "Agent SDK",
            "label_zh": "智能体 SDK",
            "desc": "Top-level software development kit abstraction providing a unified surface for building, configuring, and running autonomous agents without vendor lock-in.",
            "layer": "sdk",
            "state_machine": "state.sdk_lifecycle",
            "interfaces": ["contract.sdk_composable", "contract.provider_swappable"],
            "attrs": {
                "sdk_name": attr("string", True, "Human-readable SDK identifier"),
                "version": attr("string", True, "SDK release version"),
                "supported_runtimes": attr("array", False, "Target runtime environments supported"),
            },
        },
        "sdk_kernel": {
            "label": "SDK Kernel",
            "label_zh": "SDK 内核",
            "desc": "Core runtime kernel orchestrating agent lifecycle, dependency injection, event dispatch, and coordination of API subsystems within the SDK.",
            "layer": "sdk",
            "plane": "Orchestration",
            "attrs": {
                "kernel_version": attr("string", True, "Kernel implementation version"),
                "thread_model": attr("enum", False, "Concurrency model", values=["single_threaded", "multi_threaded", "async"]),
                "boot_sequence": attr("array", False, "Ordered initialization steps at startup"),
            },
        },
        "agent_definition_api": api_node(
            "agent_definition_api", "Agent Definition API", "智能体定义 API",
            "API for declaring agent identity, role, capabilities, system instructions, and behavioral constraints at configuration time.",
            "Info",
        ),
        "run_api": api_node(
            "run_api", "Run API", "运行 API",
            "API for starting, monitoring, cancelling, and retrieving results from agent execution runs.",
        ),
        "session_api": api_node(
            "session_api", "Session API", "会话 API",
            "API for session lifecycle management including creation, persistence, resumption, and teardown of conversational contexts.",
        ),
        "state_api": api_node(
            "state_api", "State API", "状态 API",
            "API for state persistence and retrieval of agent, run, and workflow state across restarts and distributed deployments.",
            "Memory",
        ),
        "tool_api": api_node(
            "tool_api", "Tool API", "工具 API",
            "API for tool registration, schema validation, discovery, invocation, and result handling across all action types.",
            "Tool",
        ),
        "memory_api": api_node(
            "memory_api", "Memory API", "记忆 API",
            "API for memory read, write, query, compaction, and retrieval across working, episodic, semantic, and procedural stores.",
            "Memory",
        ),
        "workflow_api": api_node(
            "workflow_api", "Workflow API", "工作流 API",
            "API for workflow definition, step orchestration, branching, parallel execution, and delegation between agents.",
        ),
        "policy_api": api_node(
            "policy_api", "Policy API", "策略 API",
            "API for policy registration, evaluation, enforcement, and audit of agent actions against safety and governance rules.",
            "Orchestration",
        ),
        "adapter_api": api_node(
            "adapter_api", "Adapter API", "适配器 API",
            "API for registering and connecting environment, model, tool, and storage adapters to the SDK kernel.",
            "Tool",
        ),
        "trace_api": api_node(
            "trace_api", "Trace API", "追踪 API",
            "API for tracing, span creation, event correlation, and observability export of agent runtime behavior.",
        ),
        "evaluation_api": api_node(
            "evaluation_api", "Evaluation API", "评估 API",
            "API for evaluation harnesses, test case execution, scoring, regression detection, and benchmark comparison.",
        ),
        "extension_point": {
            "label": "Extension Point",
            "label_zh": "扩展点",
            "desc": "Named hook location in the SDK where third-party or user code may inject behavior without modifying kernel internals.",
            "layer": "sdk",
            "attrs": {
                "point_name": attr("string", True, "Unique extension point identifier"),
                "hook_phase": attr("enum", True, "Lifecycle phase when extension is invoked", values=["boot", "pre_run", "post_run", "shutdown"]),
                "signature_ref": attr("string", False, "Reference to expected callback signature schema"),
            },
        },
        "middleware": {
            "label": "Middleware",
            "label_zh": "中间件",
            "desc": "Interceptor in the SDK request/response pipeline that can inspect, transform, short-circuit, or augment operations before and after execution.",
            "layer": "sdk",
            "attrs": {
                "middleware_name": attr("string", True, "Registered middleware identifier"),
                "pipeline_order": attr("integer", False, "Execution order in the middleware chain"),
                "applies_to": attr("array", False, "API operations or action types this middleware intercepts"),
            },
        },
        "hook": {
            "label": "Hook",
            "label_zh": "钩子",
            "desc": "Named callback point in SDK lifecycle events where registered callbacks are invoked synchronously or asynchronously.",
            "layer": "sdk",
            "attrs": {
                "hook_name": attr("string", True, "Unique hook identifier"),
                "event_type": attr("string", True, "Lifecycle event that triggers this hook"),
                "async_allowed": attr("boolean", False, "Whether callbacks may execute asynchronously"),
            },
        },
        "callback": {
            "label": "Callback",
            "label_zh": "回调",
            "desc": "User-provided function registered at a hook point and invoked when the corresponding lifecycle event occurs.",
            "layer": "sdk",
            "attrs": {
                "callback_id": attr("string", True, "Unique callback registration identifier"),
                "handler_ref": attr("string", True, "Reference to registered handler implementation"),
                "priority": attr("integer", False, "Invocation priority relative to other callbacks on same hook"),
            },
        },
        "plugin": {
            "label": "Plugin",
            "label_zh": "插件",
            "desc": "Self-contained extension package bundling middleware, hooks, adapters, and configuration for plug-and-play SDK enhancement.",
            "layer": "sdk",
            "attrs": {
                "plugin_name": attr("string", True, "Plugin package identifier"),
                "plugin_version": attr("string", True, "Semantic version of the plugin"),
                "entry_point": attr("string", True, "Module or function entry point for plugin initialization"),
            },
        },
        "skill_package": {
            "label": "Skill Package",
            "label_zh": "技能包",
            "desc": "Bundled capability package combining tools, prompts, workflows, and policies into a reusable agent skill module.",
            "layer": "sdk",
            "plane": "Tool",
            "attrs": {
                "skill_name": attr("string", True, "Skill package identifier"),
                "skill_version": attr("string", True, "Semantic version of the skill bundle"),
                "tool_count": attr("integer", False, "Number of tools included in the package"),
            },
        },
        "connector": {
            "label": "Connector",
            "label_zh": "连接器",
            "desc": "Adapter component connecting the SDK to an external service, protocol endpoint, or data source with normalized interface semantics.",
            "layer": "sdk",
            "attrs": {
                "connector_name": attr("string", True, "Connector identifier"),
                "target_service": attr("string", True, "External service or protocol being connected"),
                "connection_config_ref": attr("string", False, "Reference to connection configuration"),
            },
        },
        "provider_adapter": {
            "label": "Provider Adapter",
            "label_zh": "提供者适配器",
            "desc": "Generic adapter abstracting differences between model, tool, or storage provider implementations behind a uniform SDK interface.",
            "layer": "sdk",
            "attrs": {
                "provider_type": attr("enum", True, "Category of provider being adapted", values=["model", "tool", "storage", "transport"]),
                "provider_id": attr("string", True, "Logical provider identifier without vendor naming"),
                "capability_profile_ref": attr("string", False, "Reference to provider capability profile"),
            },
        },
        "model_adapter": {
            "label": "Model Adapter",
            "label_zh": "模型适配器",
            "desc": "Adapter abstracting large language model provider differences in authentication, request format, streaming, and token accounting.",
            "layer": "sdk",
            "plane": "Info",
            "attrs": {
                "model_family": attr("string", True, "Logical model family identifier"),
                "supports_streaming": attr("boolean", False, "Whether adapter supports streaming completions"),
                "supports_tools": attr("boolean", False, "Whether adapter supports native tool calling"),
            },
        },
        "tool_adapter": {
            "label": "Tool Adapter",
            "label_zh": "工具适配器",
            "desc": "Adapter for integrating external tool implementations with SDK tool registration, schema mapping, and invocation semantics.",
            "layer": "sdk",
            "plane": "Tool",
            "attrs": {
                "tool_source": attr("string", True, "Origin system or protocol for external tools"),
                "schema_mapping_ref": attr("string", False, "Reference to schema translation rules"),
            },
        },
        "environment_adapter": {
            "label": "Environment Adapter",
            "label_zh": "环境适配器",
            "desc": "Adapter bridging SDK execution to environment-specific observation, action, and state management semantics.",
            "layer": "sdk",
            "attrs": {
                "environment_type": attr("string", True, "Target environment category being adapted"),
                "observation_schema_ref": attr("string", False, "Schema for normalized observations"),
                "action_schema_ref": attr("string", False, "Schema for normalized actions"),
            },
        },
        "protocol_binding": {
            "label": "Protocol Binding",
            "label_zh": "协议绑定",
            "desc": "Mapping specification translating SDK concepts to protocol primitives for interoperability with external agent protocols.",
            "layer": "sdk",
            "plane": "Tool",
            "attrs": {
                "binding_name": attr("string", True, "Protocol binding identifier"),
                "protocol_ref": attr("string", True, "Reference to target protocol specification"),
                "mapping_version": attr("string", True, "Version of the concept-to-protocol mapping"),
            },
        },
        "serialization_format": {
            "label": "Serialization Format",
            "label_zh": "序列化格式",
            "desc": "Data format specification for persistence and transport of SDK state, messages, and configuration artifacts.",
            "layer": "sdk",
            "attrs": {
                "format_name": attr("enum", True, "Serialization format identifier", values=["json", "yaml", "protobuf", "msgpack", "cbor"]),
                "schema_ref": attr("string", False, "Reference to format-specific schema definition"),
                "human_readable": attr("boolean", False, "Whether format is human-readable"),
            },
        },
        "error_model": {
            "label": "Error Model",
            "label_zh": "错误模型",
            "desc": "Structured error type hierarchy defining error codes, categories, retry semantics, and propagation rules across SDK layers.",
            "layer": "sdk",
            "attrs": {
                "model_version": attr("string", True, "Error model schema version"),
                "root_error_type": attr("string", True, "Base error type identifier"),
                "error_category_count": attr("integer", False, "Number of defined error categories"),
            },
        },
        "event_model": {
            "label": "Event Model",
            "label_zh": "事件模型",
            "desc": "Structured event type hierarchy defining runtime events, payloads, correlation identifiers, and subscription semantics.",
            "layer": "sdk",
            "attrs": {
                "model_version": attr("string", True, "Event model schema version"),
                "root_event_type": attr("string", True, "Base event type identifier"),
                "event_type_count": attr("integer", False, "Number of defined event types"),
            },
        },
    }
    for name, spec in nodes.items():
        write_node(root / "nodes" / f"{name}.yaml", name, spec)

    edges = {
        "EXPOSES_API": ("exposes_api", {
            "source_domain": "node.agent_sdk",
            "target_range": [
                "node.agent_definition_api", "node.run_api", "node.session_api", "node.state_api",
                "node.tool_api", "node.memory_api", "node.workflow_api", "node.policy_api",
                "node.adapter_api", "node.trace_api", "node.evaluation_api",
            ],
            "cardinality": "1:N",
            "desc": "SDK exposes a family of APIs providing unified access to agent capabilities and runtime operations.",
        }),
        "IMPLEMENTS_CONTRACT": ("implements_contract", {
            "source_domain": "node.sdk_kernel",
            "target_range": "node.agent_sdk",
            "cardinality": "1:1",
            "desc": "SDK kernel implements the top-level agent SDK behavioral contracts for composition and provider swap.",
        }),
        "REGISTERS_EXTENSION": ("registers_extension", {
            "source_domain": "node.plugin",
            "target_range": "node.extension_point",
            "cardinality": "N:M",
            "desc": "Plugin registers handlers at named extension points in the SDK kernel.",
        }),
        "INSTALLS_PLUGIN": ("installs_plugin", {
            "source_domain": "node.agent_sdk",
            "target_range": "node.plugin",
            "cardinality": "1:N",
            "desc": "SDK installs and activates a plugin package extending kernel behavior.",
        }),
        "LOADS_SKILL": ("loads_skill", {
            "source_domain": "node.agent_sdk",
            "target_range": "node.skill_package",
            "cardinality": "1:N",
            "desc": "SDK loads a skill package bundling tools, prompts, and workflows into the active agent.",
        }),
        "CONNECTS_PROVIDER": ("connects_provider", {
            "source_domain": "node.connector",
            "target_range": "node.provider_adapter",
            "cardinality": "N:1",
            "desc": "Connector establishes connection to an external provider through a provider adapter.",
        }),
        "BINDS_PROTOCOL": ("binds_protocol", {
            "source_domain": "node.protocol_binding",
            "target_range": "node.agent_sdk",
            "cardinality": "N:1",
            "desc": "Protocol binding maps SDK concepts to external protocol primitives for interoperability.",
        }),
        "ADAPTS_MODEL": ("adapts_model", {
            "source_domain": "node.model_adapter",
            "target_range": "node.provider_adapter",
            "cardinality": "N:1",
            "desc": "Model adapter specializes a generic provider adapter for language model invocation.",
        }),
        "ADAPTS_TOOL": ("adapts_tool", {
            "source_domain": "node.tool_adapter",
            "target_range": "node.provider_adapter",
            "cardinality": "N:1",
            "desc": "Tool adapter specializes a generic provider adapter for external tool integration.",
        }),
        "ADAPTS_ENVIRONMENT": ("adapts_environment", {
            "source_domain": "node.environment_adapter",
            "target_range": "node.provider_adapter",
            "cardinality": "N:1",
            "desc": "Environment adapter specializes a provider adapter for execution environment differences.",
        }),
        "EMITS_EVENT": ("emits_event", {
            "source_domain": "node.sdk_kernel",
            "target_range": "node.event_model",
            "cardinality": "N:1",
            "desc": "SDK kernel emits structured runtime events conforming to the event model hierarchy.",
        }),
        "HANDLES_ERROR": ("handles_error", {
            "source_domain": "node.sdk_kernel",
            "target_range": "node.error_model",
            "cardinality": "N:1",
            "desc": "SDK kernel classifies and propagates errors according to the structured error model.",
        }),
        "SERIALIZES_AS": ("serializes_as", {
            "source_domain": "node.agent_sdk",
            "target_range": "node.serialization_format",
            "cardinality": "N:M",
            "desc": "SDK persists and transports data using specified serialization formats.",
        }),
    }
    for pred, (fname, spec) in edges.items():
        write_edge(root / "edges" / f"{fname}.yaml", pred, spec)

    write_contract(root / "contracts/sdk_composable.yaml", "sdk_composable", {
        "label": "SDK Composable",
        "label_zh": "SDK 可组合",
        "desc": "Behavioral contract requiring SDK components to be independently composable via plugins, middleware, and extension points.",
        "operations": [
            {"name": "compose", "description": "Assemble SDK from kernel plus selected components",
             "input": {"components": {"type": "array", "description": "Component identifiers to compose"}},
             "output": {"sdk_instance": {"type": "object", "description": "Composed SDK instance"}},
             "errors": ["CompositionConflictError", "MissingDependencyError"]},
            {"name": "register_middleware", "description": "Add middleware to the request pipeline",
             "input": {"middleware_ref": {"type": "string", "description": "Middleware registration reference"}},
             "output": {"registered": {"type": "boolean", "description": "Whether registration succeeded"}},
             "errors": ["InvalidMiddlewareError"]},
        ],
    })
    write_contract(root / "contracts/provider_swappable.yaml", "provider_swappable", {
        "label": "Provider Swappable",
        "label_zh": "提供者可替换",
        "desc": "Behavioral contract requiring provider adapters to be swappable without changing agent semantics or API contracts.",
        "operations": [
            {"name": "swap_provider", "description": "Replace active provider adapter with alternate implementation",
             "input": {"provider_ref": {"type": "string", "description": "New provider adapter reference"}},
             "output": {"previous_ref": {"type": "string", "description": "Previously active provider reference"}},
             "errors": ["IncompatibleProviderError", "ActiveRunError"]},
            {"name": "list_providers", "description": "Enumerate registered provider adapters by type",
             "input": {"provider_type": {"type": "string", "description": "Optional filter by provider category"}},
             "output": {"providers": {"type": "array", "description": "Available provider adapters"}},
             "errors": []},
        ],
    })
    write_state(root / "states/sdk_lifecycle.yaml", "sdk_lifecycle", {
        "label": "SDK Lifecycle",
        "label_zh": "SDK 生命周期",
        "desc": "Lifecycle states for an agent SDK instance from uninitialized boot through configuration, ready state, active runs, shutdown, and termination.",
        "states": [
            {"name": "uninitialized", "initial": True, "description": "SDK created but not yet configured"},
            {"name": "configuring", "description": "Loading configuration, plugins, and adapters"},
            {"name": "ready", "description": "SDK configured and ready to accept run requests"},
            {"name": "running", "description": "One or more agent runs actively executing"},
            {"name": "shutting_down", "description": "Graceful shutdown in progress, draining active runs"},
            {"name": "terminated", "terminal": True, "description": "SDK fully shut down and resources released"},
        ],
        "transitions": [
            {"from": "uninitialized", "to": "configuring", "trigger": "configure", "description": "Begin SDK configuration"},
            {"from": "configuring", "to": "ready", "trigger": "ready", "description": "Configuration complete"},
            {"from": "configuring", "to": "terminated", "trigger": "configure_failed", "description": "Configuration failed fatally"},
            {"from": "ready", "to": "running", "trigger": "start_run", "description": "Agent run started"},
            {"from": "running", "to": "ready", "trigger": "run_complete", "description": "All active runs finished"},
            {"from": "ready", "to": "shutting_down", "trigger": "shutdown", "description": "Initiate graceful shutdown"},
            {"from": "running", "to": "shutting_down", "trigger": "shutdown", "description": "Shutdown requested during active runs"},
            {"from": "shutting_down", "to": "terminated", "trigger": "shutdown_complete", "description": "Shutdown finished"},
        ],
    })
    constraints = [
        ("sdk_must_not_depend_on_vendor", {
            "label": "SDK Must Not Depend On Vendor",
            "label_zh": "SDK 不得依赖厂商",
            "severity": "error",
            "rule": "No node in the universal-sdk-graph subgraph MAY reference vendor-specific identifiers in id fields, attribute values, or required configuration keys.",
            "applies_to": {"nodes": ["node.agent_sdk", "node.provider_adapter", "node.model_adapter"]},
            "desc": "Vendor neutrality rule ensuring the universal SDK abstraction remains implementation-agnostic.",
        }),
        ("tool_api_must_support_all_action_types", {
            "label": "Tool API Must Support All Action Types",
            "label_zh": "工具 API 必须支持所有动作类型",
            "severity": "error",
            "rule": "node.tool_api MUST expose operations covering registration, discovery, invocation, and result handling for all action types defined in the tool-action subgraph.",
            "applies_to": {"nodes": ["node.tool_api"]},
            "desc": "Completeness constraint ensuring the tool API is a full-fidelity gateway to agent actions.",
        }),
        ("policy_api_must_intercept_all_actions", {
            "label": "Policy API Must Intercept All Actions",
            "label_zh": "策略 API 必须拦截所有动作",
            "severity": "error",
            "rule": "Every action dispatched through node.tool_api MUST pass through node.policy_api evaluation before execution unless explicitly exempted by documented policy.",
            "applies_to": {"nodes": ["node.policy_api", "node.tool_api"]},
            "desc": "Safety constraint ensuring policy enforcement is mandatory on all agent actions.",
        }),
        ("trace_api_must_connect_runtime_events", {
            "label": "Trace API Must Connect Runtime Events",
            "label_zh": "追踪 API 必须连接运行时事件",
            "severity": "warning",
            "rule": "node.trace_api MUST subscribe to events emitted via edge.EMITS_EVENT from node.sdk_kernel and produce correlated trace spans.",
            "applies_to": {"nodes": ["node.trace_api"], "edges": ["edge.EMITS_EVENT"]},
            "desc": "Observability constraint linking runtime events to trace export for debugging and audit.",
        }),
        ("adapter_api_must_connect_environment", {
            "label": "Adapter API Must Connect Environment",
            "label_zh": "适配器 API 必须连接环境",
            "severity": "error",
            "rule": "node.adapter_api MUST provide registration paths for node.environment_adapter instances connecting to environment-adapter-graph environments.",
            "applies_to": {"nodes": ["node.adapter_api", "node.environment_adapter"]},
            "desc": "Integration constraint ensuring SDK can bridge to all environment types via adapters.",
        }),
    ]
    for cid, spec in constraints:
        write_constraint(root / f"constraints/{cid}.yaml", cid, spec)
    print(f"Task 2 complete: {len(nodes)} nodes, {len(edges)} edges")


if __name__ == "__main__":
    generate()
