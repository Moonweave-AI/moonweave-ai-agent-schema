# Ontology Governance Rules

## Naming

- Node IDs use `node.<snake_case>` format. Example: `node.tool_call`.
- Edge IDs use `edge.<UPPER_SNAKE_CASE>` format. Example: `edge.INVOKES`.
- Contract IDs use `contract.<snake_case>`. Example: `contract.invocable`.
- State machine IDs use `state.<snake_case>`. Example: `state.tool_call_lifecycle`.
- Constraint IDs use `constraint.<snake_case>`. Example: `constraint.tool_call_must_be_guarded`.
- Evidence IDs use `evidence.<source>.<path>`. Example: `evidence.diagram.tool_plane.tool_call`.

## Artifact Types

Every YAML file must declare exactly one `artifact` type:

- `NodeClass` — An ontology concept node.
- `EdgeClass` — An ontology relationship type.
- `InterfaceContract` — A typed interface that nodes may implement.
- `StateMachine` — A lifecycle state machine with states and transitions.
- `GraphConstraint` — A structural constraint on the graph.
- `GraphView` — A visualization view definition.
- `EvidenceRef` — A traceability link to a source.

## Required Fields

All `NodeClass` must have: `id`, `artifact`, `label`, `label_zh`, `description`.
All `EdgeClass` must have: `id`, `artifact`, `predicate`, `source_domain`, `target_range`, `description`.

## Vendor Neutrality

- No vendor name, product name, or specific SDK/framework name may appear as a node ID or edge predicate in the ontology backbone.
- Concrete implementations are documented only in `references/non-normative-exemplars/`.
- Pattern names must be generic: `tool_server` not a protocol-specific server name; `capability_manifest` not a protocol-specific card name.

## Extension Rules

- New nodes must connect to at least one existing node via a defined edge.
- Orphan nodes are flagged by `tools/check-orphan-nodes.mjs`.
- New subgraphs require a `GraphView` definition.

## Lifecycle

Each artifact carries a `status` field: `active`, `deprecated`, or `removed`.
Deprecated artifacts must remain for at least one version cycle before removal.

## Constraint Enforcement

- Every `ToolCall` node must have at least one outgoing `GUARDED_BY` edge to a `PolicyContract`.
- Every side-effecting `EnvironmentAction` must have a `REQUIRES_PERMISSION` path.
- Every `MemoryWrite` operation must connect to a write policy.
- Every `ProtocolEndpoint` must have an `AuthorizationScheme` or explicit `PublicEndpointPolicy`.
