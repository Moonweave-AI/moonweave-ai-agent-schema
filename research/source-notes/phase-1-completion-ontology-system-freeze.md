# Phase 1 Completion: Ontology System Freeze

Date: 2026-06-30
Status: complete
Gate result: passed after cross-domain pattern review and agent-plane correction

> **Supersession note (2026-07-13):** This file is the immutable record of the
> v1 Phase 1 freeze. Its 36/413/157/92/75/368/7 counts and parallel collection
> handoff are historical, not current v2 counts or architecture. RFC 0005 and
> the unified-graph upgrade plan retain eight first-level Domains while moving
> all domain-semantic editing to `ontology/source/**`; current candidate or
> release counts are read from that generated artifact's `ontology_metrics`.

## Correction

Earlier Phase 1 artifacts correctly reviewed the boundary rules for ontology
engineering, but they did not yet deliver the concrete ontology system itself.
That was insufficient. The expected Phase 1 output is not only "how the
ontology should be designed"; it is the accepted ontology system that later
schema, graph IR, adapters, and frontend views must consume.

This correction closes that gap.

The FIBO-alignment pass removed the versioned draft chain and replaced it with a
single non-versioned canonical ontology artifact. The later cross-domain pattern
review corrected the ontology scope: FIBO, GO, CIDOC CRM, Palantir, DBpedia,
and FOAF are design references only. The canonical ontology terms now describe
agent-system runtime objects, events, actions, resources, policies, modules,
classes, properties, controlled individuals, axioms, relations, and adapter
mappings.

## Completed Phase 1 Artifacts

| artifact | role |
|---|---|
| `research/source-notes/phase-1a-scope-artifact-inventory.md` | Defines the Phase 1 evidence and freeze scope. |
| `research/source-notes/phase-1b-source-integrity-gate.md` | Verifies source IDs, living metadata, future-dated exclusion, and needs-targeted-check gate. |
| `research/source-notes/phase-1c-rfc-0001-ontology-layer-review.md` | Reviews and tightens RFC 0001 layer boundaries. |
| `docs/rfcs/0001-ontology-layers.md` | Freezes core/profile/adapter boundary rules. |
| `docs/rfcs/0002-canonical-schema-contract.md` | Freezes schema contract constraints. |
| `docs/rfcs/0003-statechart-and-protocol-model.md` | Freezes protocol, statechart, benchmark, and adapter boundaries. |
| `docs/rfcs/0004-phase-1-schema-workplan.md` | Defines implementation handoff from concrete ontology system to schema/Graph IR/frontend. |
| `research/pl-pr-core-profile-adapter-matrix.md` | Freezes PL/PR ownership dispositions. |
| `ontology/agent-ontology.md` | Human-readable canonical ontology system. |
| `ontology/agent-ontology.json` | Machine-readable canonical ontology system. |
| `research/source-notes/fibo-alignment-review.md` | FIBO alignment review, source reading record, and gate record. |
| `research/source-notes/cross-domain-ontology-pattern-review.md` | Cross-domain ontology pattern review and agent-plane correction gate. |

## What Phase 1 Froze In v1 (Historical)

Phase 1 now freezes the following concrete ontology structure:

- 8 agent-system planes.
- 36 agent-system modules.
- 413 agent-system classes.
- 157 object properties / relation families.
- 92 data properties.
- 75 controlled individuals.
- 368 axioms.
- 7 adapter mappings.
- 19 hygiene gates.
- Artifact metadata kept outside `terms`.
- Gate criteria for source evidence, hidden reasoning exclusion, metadata-term exclusion, and adapter-only pollution.

## Concrete Ontology Planes

| plane | concrete ownership |
|---|---|
| Runtime Plane | agent system, sessions, actors, models, transcript, trace events, snapshots, checkpoints, budgets |
| Info Plane | container, commands, output chunks, storage, filesystem, database, graph, text, messages, prompts, light index |
| Memory Plane | documents, chunks, situating prompts, context windows, retrieval, vector/TF-IDF indexes, rank fusion |
| Orchestration Plane | tasks, orchestrator, workers, subagents, evaluator, gates, routes, prompt chains, parallelization, voting, synthesis |
| Tool Plane | tools, registry, definitions, search, matching, MCP client/server, calls, execution, results, transcripts |
| Safety Plane | trust boundaries, permission prompts, policies, allow/deny/escalate decisions, sandbox, proxies, pattern scans, commit gates |
| Feedback Plane | warnings, feedback, review, logs, metrics, recovery, optimization loops |
| Adapter Plane | protocol, framework, benchmark, statechart, and schema mappings |

## Historical v1 Gate Results

| gate | observed | result |
|---|---:|---|
| Concrete ontology planes exist | yes | PASS |
| Concrete module catalog exists | yes | PASS |
| Concrete class catalog exists | yes | PASS |
| Concrete object property catalog exists | yes | PASS |
| Concrete data property catalog exists | yes | PASS |
| Concrete controlled individual catalog exists | yes | PASS |
| Concrete axiom catalog exists | yes | PASS |
| Profile ownership exists | yes | PASS |
| Adapter ownership exists | yes | PASS |
| Competency questions exist | yes | PASS |
| Missing source IDs in ontology system JSON | 0 | PASS |
| Engineering source IDs not normalized | 0 | PASS |
| Future-dated active evidence | 0 | PASS |
| Adapter-only concepts promoted to core | 0 | PASS |
| Hidden chain-of-thought required fields | 0 | PASS |

## Superseded Implementation Handoff

The original downstream instruction to use generated
`ontology/agent-ontology.json` as an editable source of truth is superseded.
For v2, only `ontology/source/**` owns domain-semantic edits. Canonical JSON,
Markdown, root Schema, generated types, source index, fixtures, Graph IR, and
semantic exports are deterministic projections of the same graph. Hand-written
GraphView data and migration ledgers are not runtime or publication sources.

The replacement handoff is:

1. Build and validate the single `planes/modules/classes/relations` graph from
   reviewed Module sources.
2. Keep structure fields, examples, controlled values, constraints, source
   claims, mappings, and case fragments attached to their node or relation.
3. Generate all machine profiles and UI indexes without creating parallel
   Schema, ABox, TBox, Instance, Evidence, or Adapter navigation products.
4. Publish only through the atomic release gate; a candidate with
   `releasable=false` is not a release.

## Phase 1 Closure

Phase 1 is complete only with the ontology system artifacts present. That
condition is now met.
