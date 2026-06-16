#!/usr/bin/env python3
"""Generate ontology YAML files for subgraphs 09-12."""
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "ontology"


def fmt_attrs(attrs: dict) -> str:
    lines = ["attributes:"]
    for k, v in attrs.items():
        lines.append(f"  {k}:")
        for ak, av in v.items():
            if ak == "description":
                continue
            if isinstance(av, list):
                vals = ", ".join(repr(x) for x in av)
                lines.append(f"    {ak}: [{vals}]")
            elif isinstance(av, bool):
                lines.append(f"    {ak}: {str(av).lower()}")
            else:
                lines.append(f"    {ak}: {av}")
        lines.append(f'    description: {v["description"]}')
    return "\n".join(lines)


def write_node(path: Path, name: str, spec: dict) -> None:
    lines = [
        f"id: node.{name}",
        "artifact: NodeClass",
        f'label: {spec["label"]}',
        f'label_zh: {spec["label_zh"]}',
    ]
    if spec.get("layer"):
        lines.append(f'layer: {spec["layer"]}')
    if spec.get("plane"):
        lines.append(f'plane: {spec["plane"]}')
    lines.append("description: >")
    lines.append(f'  {spec["desc"]}')
    lines.append(fmt_attrs(spec["attrs"]))
    if spec.get("interfaces"):
        lines.append("interfaces:")
        for i in spec["interfaces"]:
            lines.append(f"  - ref: {i}")
    if spec.get("state_machine"):
        lines.append("state_machine:")
        lines.append(f'  ref: {spec["state_machine"]}')
    if spec.get("required_edges"):
        lines.append("required_edges:")
        for direction in ("outgoing", "incoming"):
            if spec["required_edges"].get(direction):
                lines.append(f"  {direction}:")
                for e in spec["required_edges"][direction]:
                    lines.append(f'    - predicate: {e["predicate"]}')
                    if "target" in e:
                        lines.append(f'      target: {e["target"]}')
                    if "target_any_of" in e:
                        lines.append(f'      target_any_of: {e["target_any_of"]}')
                    if "source" in e:
                        lines.append(f'      source: {e["source"]}')
                    if "source_any_of" in e:
                        lines.append(f'      source_any_of: {e["source_any_of"]}')
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_edge(path: Path, predicate: str, spec: dict) -> None:
    sd = spec["source_domain"]
    tr = spec["target_range"]
    sd_line = f"source_domain: {sd}" if isinstance(sd, str) else f"source_domain: [{', '.join(sd)}]"
    tr_line = f"target_range: {tr}" if isinstance(tr, str) else f"target_range: [{', '.join(tr)}]"
    lines = [
        f"id: edge.{predicate}",
        "artifact: EdgeClass",
        f"predicate: {predicate}",
        sd_line,
        tr_line,
    ]
    if spec.get("cardinality"):
        lines.append(f'cardinality: "{spec["cardinality"]}"')
    lines.append("description: >")
    lines.append(f'  {spec["desc"]}')
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_contract(path: Path, cid: str, spec: dict) -> None:
    lines = [
        f"id: contract.{cid}",
        "artifact: InterfaceContract",
        f'label: {spec["label"]}',
        f'label_zh: {spec["label_zh"]}',
        "description: >",
        f'  {spec["desc"]}',
        "operations:",
    ]
    for op in spec["operations"]:
        lines.append(f'  - name: {op["name"]}')
        if op.get("description"):
            lines.append(f'    description: {op["description"]}')
        if op.get("input"):
            lines.append("    input:")
            for ik, iv in op["input"].items():
                lines.append(f"      {ik}:")
                for ak, av in iv.items():
                    lines.append(f"        {ak}: {av}")
        else:
            lines.append("    input: {}")
        if op.get("output"):
            lines.append("    output:")
            for ok, ov in op["output"].items():
                lines.append(f"      {ok}:")
                for ak, av in ov.items():
                    lines.append(f"        {ak}: {av}")
        if op.get("errors"):
            err = ", ".join(op["errors"])
            lines.append(f"    errors: [{err}]")
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_state(path: Path, sid: str, spec: dict) -> None:
    lines = [
        f"id: state.{sid}",
        "artifact: StateMachine",
        f'label: {spec["label"]}',
        f'label_zh: {spec["label_zh"]}',
        "description: >",
        f'  {spec["desc"]}',
        "states:",
    ]
    for s in spec["states"]:
        lines.append(f'  - name: {s["name"]}')
        if s.get("initial"):
            lines.append("    initial: true")
        if s.get("terminal"):
            lines.append("    terminal: true")
        if s.get("description"):
            lines.append(f'    description: {s["description"]}')
    lines.append("transitions:")
    for t in spec["transitions"]:
        lines.append(f'  - from: {t["from"]}')
        lines.append(f'    to: {t["to"]}')
        lines.append(f'    trigger: {t["trigger"]}')
        if t.get("guard"):
            lines.append(f'    guard: {t["guard"]}')
        if t.get("description"):
            lines.append(f'    description: {t["description"]}')
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_constraint(path: Path, cid: str, spec: dict) -> None:
    lines = [
        f"id: constraint.{cid}",
        "artifact: GraphConstraint",
        f'label: {spec["label"]}',
        f'label_zh: {spec["label_zh"]}',
        f'severity: {spec["severity"]}',
        "rule: >",
        f'  {spec["rule"]}',
    ]
    if spec.get("applies_to"):
        lines.append("applies_to:")
        if spec["applies_to"].get("nodes"):
            nodes = ", ".join(spec["applies_to"]["nodes"])
            lines.append(f"  nodes: [{nodes}]")
        if spec["applies_to"].get("edges"):
            edges = ", ".join(spec["applies_to"]["edges"])
            lines.append(f"  edges: [{edges}]")
    lines.append("description: >")
    lines.append(f'  {spec["desc"]}')
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def generate_task1() -> None:
    root = BASE / "09-protocol-interop-graph"
    nodes = {
        "protocol": {
            "label": "Protocol",
            "label_zh": "协议",
            "desc": "Abstract specification of a communication protocol defining message formats, lifecycle semantics, capability discovery, and interoperability rules between autonomous participants.",
            "layer": "protocol",
            "plane": "Tool",
            "attrs": {
                "protocol_name": {"type": "string", "required": True, "description": "Human-readable protocol identifier"},
                "version": {"type": "string", "required": True, "description": "Semantic version of the protocol specification"},
                "spec_uri": {"type": "uri", "required": False, "description": "Canonical URI to normative specification document"},
                "transport_profiles": {"type": "array", "required": False, "description": "Supported transport mechanisms"},
                "message_format": {"type": "enum", "required": False, "values": ["json_rpc", "rest", "grpc", "custom"], "description": "Primary message serialization and framing style"},
            },
        },
        "protocol_role": {
            "label": "Protocol Role",
            "label_zh": "协议角色",
            "desc": "Role a participant plays in a protocol conversation such as client, server, peer, or observer, determining allowed operations and message flow direction.",
            "layer": "protocol",
            "attrs": {
                "role_name": {"type": "enum", "required": True, "values": ["client", "server", "peer", "observer"], "description": "Named role in the protocol interaction"},
                "initiates_connection": {"type": "boolean", "required": False, "description": "Whether this role may initiate connections"},
                "may_delegate_tasks": {"type": "boolean", "required": False, "description": "Whether this role can submit delegated work"},
            },
        },
        "protocol_endpoint": {
            "label": "Protocol Endpoint",
            "label_zh": "协议端点",
            "desc": "Addressable service point that implements one or more protocol roles, exposing capabilities, accepting messages, and participating in task lifecycles.",
            "layer": "protocol",
            "plane": "Tool",
            "state_machine": "state.connection_lifecycle",
            "interfaces": ["contract.protocol_participant", "contract.capability_advertiser"],
            "attrs": {
                "endpoint_uri": {"type": "uri", "required": True, "description": "Resolvable address for the endpoint"},
                "display_name": {"type": "string", "required": False, "description": "Human-readable endpoint label"},
                "supported_roles": {"type": "array", "required": True, "description": "Protocol roles this endpoint can assume"},
                "health_status": {"type": "enum", "required": False, "values": ["healthy", "degraded", "unavailable"], "description": "Current operational health"},
            },
            "required_edges": {
                "outgoing": [
                    {"predicate": "AUTHORIZES_WITH", "target": "node.authorization_scheme"},
                ],
            },
        },
        "capability_manifest": {
            "label": "Capability Manifest",
            "label_zh": "能力清单",
            "desc": "Published declaration enumerating tools, resources, prompts, and protocol extensions an endpoint supports, used for discovery and negotiation.",
            "layer": "protocol",
            "attrs": {
                "manifest_version": {"type": "string", "required": True, "description": "Version of the manifest schema"},
                "published_at": {"type": "datetime", "required": False, "description": "Timestamp when manifest was last published"},
                "capability_count": {"type": "integer", "required": False, "description": "Total number of advertised capabilities"},
                "extensions": {"type": "array", "required": False, "description": "Optional protocol extension identifiers supported"},
            },
        },
        "tool_exposure": {
            "label": "Tool Exposure",
            "label_zh": "工具暴露",
            "desc": "A callable tool made available through a protocol endpoint, including input schema, output schema, and invocation semantics.",
            "layer": "protocol",
            "plane": "Tool",
            "attrs": {
                "tool_name": {"type": "string", "required": True, "description": "Protocol-visible tool identifier"},
                "input_schema_ref": {"type": "string", "required": True, "description": "Reference to input parameter schema definition"},
                "output_schema_ref": {"type": "string", "required": False, "description": "Reference to output schema definition"},
                "description_text": {"type": "string", "required": False, "description": "Natural language description for discovery"},
                "destructive": {"type": "boolean", "required": False, "description": "Whether invocation may cause irreversible side effects"},
            },
        },
        "resource_exposure": {
            "label": "Resource Exposure",
            "label_zh": "资源暴露",
            "desc": "A data resource exposed through a protocol for read or subscription, identified by URI and typed with MIME or schema metadata.",
            "layer": "protocol",
            "attrs": {
                "resource_uri": {"type": "uri", "required": True, "description": "Canonical URI identifying the resource"},
                "mime_type": {"type": "string", "required": False, "description": "MIME type of resource content"},
                "access_mode": {"type": "enum", "required": True, "values": ["read", "subscribe", "read_write"], "description": "Permitted access pattern"},
                "size_bytes": {"type": "integer", "required": False, "description": "Approximate resource size if known"},
            },
        },
        "prompt_exposure": {
            "label": "Prompt Exposure",
            "label_zh": "提示暴露",
            "desc": "A parameterized prompt template exposed through a protocol that clients can materialize into messages with supplied arguments.",
            "layer": "protocol",
            "plane": "Info",
            "attrs": {
                "prompt_name": {"type": "string", "required": True, "description": "Protocol-visible prompt identifier"},
                "argument_schema_ref": {"type": "string", "required": False, "description": "Schema for prompt template arguments"},
                "template_ref": {"type": "string", "required": True, "description": "Reference to underlying prompt template content"},
                "role_hint": {"type": "enum", "required": False, "values": ["system", "user", "assistant"], "description": "Suggested message role for materialized prompt"},
            },
        },
        "task_envelope": {
            "label": "Task Envelope",
            "label_zh": "任务信封",
            "desc": "Structured wrapper encapsulating a delegated task including identity, input payload, metadata, correlation identifiers, and delivery expectations.",
            "layer": "protocol",
            "plane": "Orchestration",
            "state_machine": "state.task_protocol_lifecycle",
            "attrs": {
                "task_id": {"type": "string", "required": True, "description": "Globally unique task identifier"},
                "correlation_id": {"type": "string", "required": False, "description": "Cross-protocol trace correlation identifier"},
                "input_payload_ref": {"type": "string", "required": True, "description": "Reference to structured task input"},
                "priority": {"type": "enum", "required": False, "values": ["low", "normal", "high", "critical"], "description": "Relative execution priority"},
                "deadline": {"type": "datetime", "required": False, "description": "Optional completion deadline"},
            },
        },
        "task_lifecycle": {
            "label": "Task Lifecycle",
            "label_zh": "任务生命周期",
            "desc": "Protocol-level state machine governing delegated task progression from submission through completion, failure, or cancellation.",
            "layer": "protocol",
            "attrs": {
                "lifecycle_id": {"type": "string", "required": True, "description": "Identifier for this lifecycle definition"},
                "terminal_states": {"type": "array", "required": True, "description": "States that terminate task processing"},
                "supports_input_needed": {"type": "boolean", "required": False, "description": "Whether protocol supports interactive input requests"},
            },
        },
        "message_envelope": {
            "label": "Message Envelope",
            "label_zh": "消息信封",
            "desc": "Structured wrapper for protocol messages carrying headers, routing metadata, correlation identifiers, and typed payload references.",
            "layer": "protocol",
            "plane": "Info",
            "attrs": {
                "message_id": {"type": "string", "required": True, "description": "Unique message identifier"},
                "message_type": {"type": "string", "required": True, "description": "Protocol-defined message type discriminator"},
                "timestamp": {"type": "datetime", "required": False, "description": "Message creation timestamp"},
                "reply_to": {"type": "string", "required": False, "description": "Message id this message responds to"},
            },
        },
        "message_part": {
            "label": "Message Part",
            "label_zh": "消息片段",
            "desc": "Individual segment of a multi-part message supporting heterogeneous content types such as text, images, structured data, or file references.",
            "layer": "protocol",
            "attrs": {
                "part_index": {"type": "integer", "required": True, "description": "Zero-based ordering index within parent message"},
                "content_type": {"type": "string", "required": True, "description": "MIME or protocol-specific content type"},
                "content_ref": {"type": "string", "required": True, "description": "Reference to inline or external content"},
                "encoding": {"type": "enum", "required": False, "values": ["inline", "base64", "uri"], "description": "How content is encoded"},
            },
        },
        "artifact": {
            "label": "Protocol Artifact",
            "label_zh": "协议产物",
            "desc": "File or structured data produced during task execution and returned to the delegating participant via protocol artifact exchange.",
            "layer": "protocol",
            "attrs": {
                "artifact_id": {"type": "string", "required": True, "description": "Unique artifact identifier within task scope"},
                "artifact_type": {"type": "string", "required": True, "description": "Protocol-defined artifact type discriminator"},
                "content_ref": {"type": "string", "required": True, "description": "Reference to artifact payload or storage location"},
                "produced_at": {"type": "datetime", "required": False, "description": "Timestamp when artifact was produced"},
            },
        },
        "transport": {
            "label": "Transport",
            "label_zh": "传输层",
            "desc": "Communication channel mechanism carrying protocol messages between endpoints, such as stdio, HTTP, WebSocket, or message queue bindings.",
            "layer": "protocol",
            "attrs": {
                "transport_type": {"type": "enum", "required": True, "values": ["stdio", "http", "websocket", "sse", "message_queue"], "description": "Transport mechanism identifier"},
                "binding_uri": {"type": "string", "required": False, "description": "Transport-specific binding address or path"},
                "tls_required": {"type": "boolean", "required": False, "description": "Whether transport requires TLS encryption"},
                "max_message_size": {"type": "integer", "required": False, "description": "Maximum message size in bytes if bounded"},
            },
        },
        "authorization_scheme": {
            "label": "Authorization Scheme",
            "label_zh": "授权方案",
            "desc": "Authentication and authorization method required or supported by a protocol endpoint, including credential types and token exchange flows.",
            "layer": "protocol",
            "plane": "Orchestration",
            "attrs": {
                "scheme_type": {"type": "enum", "required": True, "values": ["none", "api_key", "bearer_token", "oauth2", "mutual_tls", "custom"], "description": "Authorization mechanism type"},
                "required_scopes": {"type": "array", "required": False, "description": "OAuth or custom scope identifiers required for access"},
                "token_endpoint": {"type": "uri", "required": False, "description": "Token issuance endpoint if applicable"},
            },
        },
        "capability_negotiation": {
            "label": "Capability Negotiation",
            "label_zh": "能力协商",
            "desc": "Process by which protocol participants exchange and agree on supported features, extensions, protocol versions, and operational limits at connect time.",
            "layer": "protocol",
            "attrs": {
                "negotiation_id": {"type": "string", "required": True, "description": "Unique identifier for negotiation session"},
                "requested_capabilities": {"type": "array", "required": True, "description": "Capabilities requested by initiating party"},
                "agreed_capabilities": {"type": "array", "required": False, "description": "Capabilities mutually agreed upon"},
                "negotiation_outcome": {"type": "enum", "required": False, "values": ["pending", "accepted", "partial", "rejected"], "description": "Result of negotiation"},
            },
        },
        "streaming_channel": {
            "label": "Streaming Channel",
            "label_zh": "流式通道",
            "desc": "Real-time unidirectional or bidirectional data stream between endpoints for progress updates, partial results, or continuous event delivery.",
            "layer": "protocol",
            "attrs": {
                "channel_id": {"type": "string", "required": True, "description": "Unique stream channel identifier"},
                "direction": {"type": "enum", "required": True, "values": ["unidirectional", "bidirectional"], "description": "Stream directionality"},
                "event_types": {"type": "array", "required": False, "description": "Event types deliverable on this channel"},
                "backpressure_policy": {"type": "enum", "required": False, "values": ["drop", "buffer", "block"], "description": "Behavior when consumer is slow"},
            },
        },
        "cancellation_signal": {
            "label": "Cancellation Signal",
            "label_zh": "取消信号",
            "desc": "Protocol message requesting abort of an in-progress operation or task, propagating cancellation intent to executing endpoints.",
            "layer": "protocol",
            "attrs": {
                "target_task_id": {"type": "string", "required": True, "description": "Task or operation identifier to cancel"},
                "reason": {"type": "string", "required": False, "description": "Human-readable cancellation reason"},
                "graceful": {"type": "boolean", "required": False, "description": "Whether to allow graceful shutdown before hard abort"},
                "issued_at": {"type": "datetime", "required": False, "description": "Timestamp when cancellation was requested"},
            },
        },
        "progress_event": {
            "label": "Progress Event",
            "label_zh": "进度事件",
            "desc": "Status update emitted during long-running operations reporting fractional completion, stage transitions, or intermediate metrics.",
            "layer": "protocol",
            "attrs": {
                "event_id": {"type": "string", "required": True, "description": "Unique progress event identifier"},
                "progress_percent": {"type": "number", "required": False, "description": "Completion percentage from 0 to 100"},
                "stage": {"type": "string", "required": False, "description": "Named processing stage currently active"},
                "message": {"type": "string", "required": False, "description": "Human-readable progress description"},
            },
        },
        "error_envelope": {
            "label": "Error Envelope",
            "label_zh": "错误信封",
            "desc": "Structured error response wrapping protocol-level failures with error codes, messages, retry hints, and optional diagnostic details.",
            "layer": "protocol",
            "attrs": {
                "error_code": {"type": "string", "required": True, "description": "Protocol-defined machine-readable error code"},
                "error_message": {"type": "string", "required": True, "description": "Human-readable error description"},
                "retryable": {"type": "boolean", "required": False, "description": "Whether the failed operation may be retried"},
                "details_ref": {"type": "string", "required": False, "description": "Reference to extended diagnostic payload"},
            },
        },
    }
    for name, spec in nodes.items():
        write_node(root / "nodes" / f"{name}.yaml", name, spec)

    edges = {
        "ADVERTISES_CAPABILITY": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.capability_manifest",
            "cardinality": "1:N",
            "desc": "Endpoint publishes a capability manifest declaring supported tools, resources, prompts, and extensions for discovery.",
        },
        "NEGOTIATES_CAPABILITY": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.capability_negotiation",
            "cardinality": "N:M",
            "desc": "Participants engage in capability negotiation to agree on protocol version, extensions, and operational limits.",
        },
        "EXPOSES_TOOL": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.tool_exposure",
            "cardinality": "1:N",
            "desc": "Endpoint exposes a callable tool with schema and invocation semantics accessible to protocol clients.",
        },
        "EXPOSES_RESOURCE": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.resource_exposure",
            "cardinality": "1:N",
            "desc": "Endpoint exposes a readable or subscribable data resource identified by URI.",
        },
        "EXPOSES_PROMPT": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.prompt_exposure",
            "cardinality": "1:N",
            "desc": "Endpoint exposes a parameterized prompt template for client-side materialization.",
        },
        "SENDS_MESSAGE": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.message_envelope",
            "cardinality": "1:N",
            "desc": "Endpoint transmits a structured message envelope to a peer participant.",
        },
        "RECEIVES_MESSAGE": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.message_envelope",
            "cardinality": "1:N",
            "desc": "Endpoint accepts an inbound structured message envelope from a peer participant.",
        },
        "STARTS_TASK": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.task_envelope",
            "cardinality": "1:N",
            "desc": "Endpoint initiates a delegated task by submitting a task envelope to a remote executor.",
        },
        "UPDATES_TASK_STATE": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.task_envelope",
            "cardinality": "1:N",
            "desc": "Endpoint reports a task lifecycle state transition on an in-flight delegated task.",
        },
        "PRODUCES_ARTIFACT": {
            "source_domain": "node.task_envelope",
            "target_range": "node.artifact",
            "cardinality": "1:N",
            "desc": "Completed or in-progress task yields a protocol artifact containing output data or files.",
        },
        "STREAMS_OVER": {
            "source_domain": "node.streaming_channel",
            "target_range": "node.transport",
            "cardinality": "N:1",
            "desc": "Streaming channel is bound to an underlying transport mechanism for real-time delivery.",
        },
        "AUTHORIZES_WITH": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.authorization_scheme",
            "cardinality": "N:1",
            "desc": "Endpoint requires or supports a specific authorization scheme for access control.",
        },
        "CANCELS": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.cancellation_signal",
            "cardinality": "1:N",
            "desc": "Endpoint emits a cancellation signal to abort an in-progress task or operation.",
        },
        "REPORTS_ERROR": {
            "source_domain": "node.protocol_endpoint",
            "target_range": "node.error_envelope",
            "cardinality": "1:N",
            "desc": "Endpoint returns a structured error envelope in response to a failed request or operation.",
        },
    }
    edge_files = {
        "ADVERTISES_CAPABILITY": "advertises_capability",
        "NEGOTIATES_CAPABILITY": "negotiates_capability",
        "EXPOSES_TOOL": "exposes_tool",
        "EXPOSES_RESOURCE": "exposes_resource",
        "EXPOSES_PROMPT": "exposes_prompt",
        "SENDS_MESSAGE": "sends_message",
        "RECEIVES_MESSAGE": "receives_message",
        "STARTS_TASK": "starts_task",
        "UPDATES_TASK_STATE": "updates_task_state",
        "PRODUCES_ARTIFACT": "produces_artifact",
        "STREAMS_OVER": "streams_over",
        "AUTHORIZES_WITH": "authorizes_with",
        "CANCELS": "cancels",
        "REPORTS_ERROR": "reports_error",
    }
    for pred, fname in edge_files.items():
        write_edge(root / "edges" / f"{fname}.yaml", pred, edges[pred])

    write_contract(root / "contracts/protocol_participant.yaml", "protocol_participant", {
        "label": "Protocol Participant",
        "label_zh": "协议参与者",
        "desc": "Behavioral contract for nodes that can join protocol conversations, send and receive messages, and participate in task delegation.",
        "operations": [
            {
                "name": "connect",
                "description": "Establish connection to a remote protocol endpoint",
                "input": {"endpoint_uri": {"type": "uri", "description": "Target endpoint address"}},
                "output": {"session_id": {"type": "string", "description": "Established session identifier"}},
                "errors": ["ConnectionFailedError", "AuthRequiredError"],
            },
            {
                "name": "send_message",
                "description": "Transmit a message envelope to a connected peer",
                "input": {"envelope": {"type": "object", "description": "Message envelope payload"}},
                "output": {"message_id": {"type": "string", "description": "Assigned message identifier"}},
                "errors": ["NotConnectedError", "MessageRejectedError"],
            },
            {
                "name": "receive_message",
                "description": "Accept an inbound message from a connected peer",
                "input": {"timeout_ms": {"type": "integer", "description": "Optional receive timeout"}},
                "output": {"envelope": {"type": "object", "description": "Received message envelope"}},
                "errors": ["TimeoutError", "ConnectionClosedError"],
            },
        ],
    })

    write_contract(root / "contracts/capability_advertiser.yaml", "capability_advertiser", {
        "label": "Capability Advertiser",
        "label_zh": "能力发布者",
        "desc": "Behavioral contract for endpoints that publish capability manifests and respond to discovery and negotiation requests.",
        "operations": [
            {
                "name": "publish_manifest",
                "description": "Publish or refresh the capability manifest",
                "input": {"manifest": {"type": "object", "description": "Capability manifest payload"}},
                "output": {"manifest_version": {"type": "string", "description": "Published manifest version"}},
                "errors": ["InvalidManifestError"],
            },
            {
                "name": "list_capabilities",
                "description": "Return enumerated capabilities for discovery",
                "input": {"filter": {"type": "object", "description": "Optional capability filter"}},
                "output": {"capabilities": {"type": "array", "description": "List of advertised capabilities"}},
                "errors": ["NotAdvertisedError"],
            },
            {
                "name": "negotiate",
                "description": "Participate in capability negotiation with a peer",
                "input": {"requested": {"type": "array", "description": "Requested capability identifiers"}},
                "output": {"agreed": {"type": "array", "description": "Mutually agreed capabilities"}},
                "errors": ["NegotiationRejectedError"],
            },
        ],
    })

    write_state(root / "states/task_protocol_lifecycle.yaml", "task_protocol_lifecycle", {
        "label": "Task Protocol Lifecycle",
        "label_zh": "任务协议生命周期",
        "desc": "Protocol-level task state machine covering submission, acceptance, execution, interactive input, completion, failure, and cancellation.",
        "states": [
            {"name": "submitted", "initial": True, "description": "Task envelope received but not yet acknowledged"},
            {"name": "accepted", "description": "Executor acknowledged task and queued for processing"},
            {"name": "working", "description": "Task is actively being processed"},
            {"name": "input_needed", "description": "Executor requires additional input from delegator"},
            {"name": "completed", "terminal": True, "description": "Task finished successfully with artifacts available"},
            {"name": "failed", "terminal": True, "description": "Task terminated due to unrecoverable error"},
            {"name": "cancelled", "terminal": True, "description": "Task aborted by cancellation signal"},
        ],
        "transitions": [
            {"from": "submitted", "to": "accepted", "trigger": "accept", "description": "Executor accepts delegated task"},
            {"from": "submitted", "to": "failed", "trigger": "reject", "description": "Executor rejects task at submission"},
            {"from": "accepted", "to": "working", "trigger": "start", "description": "Processing begins"},
            {"from": "working", "to": "input_needed", "trigger": "request_input", "description": "Executor needs clarifying input"},
            {"from": "input_needed", "to": "working", "trigger": "provide_input", "description": "Delegator supplies requested input"},
            {"from": "working", "to": "completed", "trigger": "complete", "description": "Task finishes successfully"},
            {"from": "working", "to": "failed", "trigger": "fail", "description": "Unrecoverable error during processing"},
            {"from": "accepted", "to": "cancelled", "trigger": "cancel", "description": "Cancel before processing starts"},
            {"from": "working", "to": "cancelled", "trigger": "cancel", "description": "Cancel during active processing"},
            {"from": "input_needed", "to": "cancelled", "trigger": "cancel", "description": "Cancel while awaiting input"},
        ],
    })

    write_state(root / "states/connection_lifecycle.yaml", "connection_lifecycle", {
        "label": "Connection Lifecycle",
        "label_zh": "连接生命周期",
        "desc": "Lifecycle states for a protocol connection from initial connect through capability negotiation, active use, graceful close, and error termination.",
        "states": [
            {"name": "connecting", "initial": True, "description": "Transport connection being established"},
            {"name": "negotiating", "description": "Capability and version negotiation in progress"},
            {"name": "open", "description": "Connection active and ready for message exchange"},
            {"name": "closing", "description": "Graceful shutdown in progress"},
            {"name": "closed", "terminal": True, "description": "Connection terminated cleanly"},
            {"name": "error", "terminal": True, "description": "Connection terminated due to unrecoverable error"},
        ],
        "transitions": [
            {"from": "connecting", "to": "negotiating", "trigger": "transport_ready", "description": "Transport established, begin negotiation"},
            {"from": "connecting", "to": "error", "trigger": "connect_failed", "description": "Transport connection failed"},
            {"from": "negotiating", "to": "open", "trigger": "negotiation_complete", "description": "Capabilities agreed, session open"},
            {"from": "negotiating", "to": "error", "trigger": "negotiation_failed", "description": "Capability negotiation rejected or timed out"},
            {"from": "open", "to": "closing", "trigger": "close", "description": "Initiate graceful shutdown"},
            {"from": "closing", "to": "closed", "trigger": "close_complete", "description": "Shutdown finished"},
            {"from": "open", "to": "error", "trigger": "protocol_error", "description": "Unrecoverable protocol error during active session"},
        ],
    })

    write_constraint(root / "constraints/endpoint_must_have_auth.yaml", "endpoint_must_have_auth", {
        "label": "Endpoint Must Have Auth",
        "label_zh": "端点必须有授权",
        "severity": "error",
        "rule": "Every node.protocol_endpoint instance MUST have at least one outgoing AUTHORIZES_WITH edge to a node.authorization_scheme, unless scheme_type is explicitly none in a documented public endpoint.",
        "applies_to": {"nodes": ["node.protocol_endpoint"], "edges": ["edge.AUTHORIZES_WITH"]},
        "desc": "Security integrity rule ensuring all protocol endpoints declare their authentication and authorization requirements.",
    })

    write_constraint(root / "constraints/tool_exposure_must_reference_definition.yaml", "tool_exposure_must_reference_definition", {
        "label": "Tool Exposure Must Reference Definition",
        "label_zh": "工具暴露必须引用定义",
        "severity": "error",
        "rule": "Every node.tool_exposure MUST reference a valid input_schema_ref and SHOULD reference output_schema_ref linking to a tool definition in the tool-action subgraph.",
        "applies_to": {"nodes": ["node.tool_exposure"]},
        "desc": "Interoperability constraint ensuring exposed tools are schema-validated and traceable to canonical tool definitions.",
    })


if __name__ == "__main__":
    generate_task1()
    print("Task 1 complete")
