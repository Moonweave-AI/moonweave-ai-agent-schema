# Graph Validation Report

[English](graph-validation.md) | [中文](graph-validation-zh.md)

## Summary

The ontology graph passes structural validation, constraint validation, orphan-node checks, required-edge checks, and visualization-framework checks.

| Check | Result |
| --- | --- |
| NodeClass ID format | PASS |
| EdgeClass ID format | PASS |
| Required node fields | PASS |
| Required edge fields | PASS |
| Duplicate IDs | 0 |
| Edge endpoint references | PASS |
| Cross-subgraph references | PASS |
| Graph constraints | 38/38 PASS |
| Orphan nodes | 0 |
| Required-edge failures | 0 |
| Visualization framework | PASS |

## Structural Validation

- All `NodeClass` IDs follow the `node.*` naming convention.
- All `EdgeClass` IDs follow the `edge.*` naming convention.
- All `source_domain` and `target_range` references resolve to defined nodes.
- Cross-subgraph relationships have no dangling endpoints.

## Constraint Validation

Key non-degradable constraints pass:

- `tool_call_must_be_guarded`
- `side_effect_must_have_policy`
- `memory_write_must_have_policy`
- `protocol_endpoint_must_have_auth`
- `least_privilege_must_be_monotonic`
- `subagent_must_have_delegation_contract`
- `sdk_must_not_depend_on_vendor`
- `release_gate_must_check_all`

## Visualization Data

| File | Result |
| --- | --- |
| `ontology.graph.json` | 277 nodes, 144 edges |
| `ontology.subgraphs.json` | 13 subgraphs |
| `ontology.paths.json` | 3 paths |
| `ontology.constraints.json` | 38 constraints |
| `ontology.evidence.json` | evidence refs available |
