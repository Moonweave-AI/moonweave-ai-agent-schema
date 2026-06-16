# Graph Validation Report

## Schema Validation
- All NodeClass IDs follow `node.*` pattern: PASS
- All EdgeClass IDs follow `edge.*` pattern: PASS
- Required fields present on all nodes: PASS
- Required fields present on all edges: PASS
- No duplicate IDs: PASS

## Structural Validation
- All edge source_domain references exist: PASS
- All edge target_range references exist: PASS
- Cross-subgraph edges valid: PASS

## Constraint Validation
- tool_call_must_be_guarded: PASS (node.tool_call has GUARDED_BY → node.policy_contract)
- side_effect_must_have_policy: PASS (all side-effecting actions connect to policy)
- memory_write_must_have_policy: PASS
- protocol_endpoint_must_have_auth: PASS
- least_privilege_must_be_monotonic: PASS
- subagent_must_have_delegation_contract: PASS
- All 38 constraints checked: 38/38 PASS

## Orphan Node Check
- No orphan nodes detected: 277/277 nodes connected

## Required Edge Check
- All required_edges declarations satisfied

## Evidence Coverage
- Core nodes with direct or indexed evidence references: 100%
- Diagram evidence links: complete

## Visualization Data Check
- ontology.graph.json: valid (277 nodes, 144 edges)
- ontology.subgraphs.json: valid (13 subgraphs)
- ontology.paths.json: valid (3 paths, 3/3 complete)
- ontology.constraints.json: valid (38 constraints)
- ontology.evidence.json: valid (23 evidence refs, 21 evidence entries)
