# Ontology Governance Rules

[English](GOVERNANCE.md) | [中文](GOVERNANCE-zh.md)

This document defines naming, structure, extension, lifecycle, and validation rules for `moonweave-ai-agent-schema`. The goal is to keep the ontology universal, maintainable, and verifiable instead of letting it degrade into a temporary mapping for a specific SDK, framework, or provider.

## 1. Naming

| Artifact | Format | Example |
| --- | --- | --- |
| NodeClass | `node.<snake_case>` | `node.tool_call` |
| EdgeClass | `edge.<UPPER_SNAKE_CASE>` | `edge.INVOKES` |
| InterfaceContract | `contract.<snake_case>` | `contract.invocable` |
| StateMachine | `state.<snake_case>` | `state.tool_call_lifecycle` |
| GraphConstraint | `constraint.<snake_case>` | `constraint.tool_call_must_be_guarded` |
| EvidenceRef | `evidence.<source>.<path>` | `evidence.diagram.tool_plane.tool_call` |

## 2. Artifact Types

Each YAML file must declare exactly one `artifact` type:

- `NodeClass`: an ontology concept node.
- `EdgeClass`: a directed relationship type between node classes.
- `InterfaceContract`: an interface that node classes may implement.
- `StateMachine`: a lifecycle model for a node or process.
- `GraphConstraint`: a structural or engineering quality rule.
- `GraphView`: a graph projection for documentation, visualization, or implementation.
- `EvidenceRef`: a reference to papers, official documentation, source diagrams, or engineering evidence.

## 3. Required Fields

Every `NodeClass` must include:

- `id`
- `artifact`
- `label`
- `label_zh`
- `description`

Every `EdgeClass` must include:

- `id`
- `artifact`
- `predicate`
- `source_domain`
- `target_range`
- `description`

## 4. Vendor Neutrality

- The ontology backbone must not use vendor, product, SDK, or framework names as node IDs or edge predicates.
- Concrete implementations belong only in `references/non-normative-exemplars/`.
- Abstractions must remain generic: use `tool_server` instead of a protocol-specific server name; use `capability_manifest` instead of a protocol-specific card name.

## 5. Extension Rules

- New nodes must connect to at least one existing node through a defined edge.
- New edges must define clear `source_domain` and `target_range` values.
- New subgraphs must provide a `GraphView` or equivalent view definition.
- New core concepts should include evidence references.
- Orphan nodes are not allowed.

## 6. Lifecycle

Every artifact must carry a `status` field:

- `active`: currently valid.
- `deprecated`: discouraged but retained for compatibility.
- `removed`: removed from the active ontology and retained only in history.

Deprecated artifacts must remain for at least one version cycle before removal.

## 7. Non-Degradable Constraints

The following rules are mandatory:

- `ToolCall` must be guarded by a `PolicyContract`.
- Side-effecting `EnvironmentAction` nodes must have a permission path.
- Memory-write operations must connect to a write policy.
- `ProtocolEndpoint` must have an authorization scheme or an explicit public endpoint policy.
- SDK abstractions must not depend on concrete vendors.
- A release must pass the full validation gate represented by `GraphValidator`.

## 8. Local Validation

```powershell
node .\tools\validate-graph.mjs
node .\tools\validate-constraints.mjs
node .\tools\check-orphan-nodes.mjs
node .\tools\check-required-edges.mjs
node .\tools\check-visualization-framework.mjs
```
