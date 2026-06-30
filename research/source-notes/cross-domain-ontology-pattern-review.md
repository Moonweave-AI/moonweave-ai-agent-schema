# Cross-Domain Ontology Pattern Review

Date: 2026-06-30
Status: complete
Canonical output: `ontology/agent-ontology.md`, `ontology/agent-ontology.json`

## Reason For This Pass

The prior canonical artifact still allowed ontology-engineering concepts to
appear as if they were agent-system concepts. That was wrong for the intended
product. FIBO, GO, CIDOC CRM, Palantir Ontology, DBpedia, and FOAF should guide
structure, quality, and publication practice, not expand the subject matter of
the agent ontology.

This pass re-centered the canonical ontology on observable agent-system planes,
modules, classes, objects, events, actions, resources, policies, adapter
mappings, properties, individuals, axioms, and relations.

## Sources

| source id | source | pattern extracted |
|---|---|---|
| `eng-ont-go-overview` | Gene Ontology overview | Orthogonal aspects, DAG term hierarchy, `is_a` / `part_of` discipline. |
| `eng-ont-go-annotations` | GO annotations guide | Evidence-coded annotations and relation-aware semantics. |
| `eng-ont-cidoc-crm` | CIDOC CRM official classes/properties | Event-centered modeling and persistent item vs temporal entity split. |
| `eng-ont-palantir-overview` | Palantir Ontology overview | Operational semantic layer linking data objects to actions and functions. |
| `eng-ont-palantir-core-concepts` | Palantir core concepts | Object types, link types, action types, roles, and functions. |
| `eng-ont-dbpedia` | DBpedia | Stable URI and linked-data class/property publication pattern. |
| `eng-ont-foaf` | FOAF | Lightweight interoperable vocabulary for people, agents, organizations, and social relations. |

## Design Consequences

| reference pattern | agent ontology decision |
|---|---|
| GO: three orthogonal aspects and DAG relations | AOEF uses orthogonal agent planes; taxonomy/composition relations are acyclic. |
| CIDOC CRM: temporal entities connect people, places, objects | Runtime events connect agents, tools, resources, safety decisions, and outputs. |
| Palantir: object/link/action/function ontology | Terms are typed as object, event, action, policy, resource, actor, index, adapter, or relation. |
| DBpedia/FOAF: stable web identifiers | Every term is exportable under the stable `https://moonweave.ai/ontology/agent-system/` namespace. |
| FIBO: hygiene, source/product, IRI discipline | Artifact metadata and hygiene gates remain, but no metadata classes are agent-system terms. |

## Agent-Centered Plane Model

| plane | rationale |
|---|---|
| `runtime-plane` | The operating session, actors, models, transcript, and observable event stream. |
| `info-plane` | Text, command output, storage, messages, instructions, indexes, and disclosure surfaces. |
| `memory-plane` | Chunking, embeddings, retrieval, reranking, context assembly, and preferences. |
| `orchestration-plane` | Task distribution, subagents, routes, gates, prompt chains, parallelization, voting, and synthesis. |
| `tool-plane` | Tool discovery, definitions, matching, calls, MCP client/server, execution, and results. |
| `safety-plane` | Permission prompts, sandboxing, network calls, proxies, pattern scans, policy decisions, and commit gates. |
| `feedback-plane` | Warnings, feedback, review, logs, metrics, recovery, and optimization loops. |
| `adapter-plane` | Protocol/framework/benchmark/schema mappings without core pollution. |

## Cleanup Decision

The following are explicitly banned from `terms`:

- `OntologySpecification`
- `OntologyDomain`
- `OntologyModule`
- `OntologyClass`
- `OntologyRelation`

They may appear only in artifact metadata or governance documentation.

## Gate Results

| gate | observed | result |
|---|---:|---|
| Agent planes | 8 | PASS |
| Agent modules | 36 | PASS |
| Agent-system classes | 413 | PASS |
| Object properties / relation families | 157 | PASS |
| Data properties | 92 | PASS |
| Controlled individuals | 75 | PASS |
| Axioms | 368 | PASS |
| Adapter mappings | 7 | PASS |
| Unique source IDs used by ontology product | 59 | PASS |
| Missing source IDs | 0 | PASS |
| Unresolved living sources | 0 | PASS |
| Future-dated active evidence | 0 | PASS |
| Needs-targeted-check active evidence | 0 | PASS |
| Bad plane/term references | 0 | PASS |
| Duplicate labels | 0 | PASS |
| Circular definitions | 0 | PASS |
| Metadata terms inside `terms` | 0 | PASS |
| Hidden chain-of-thought schema keys | 0 | PASS |

## Phase 2 Handoff

Phase 2 should generate schema and Graph IR from the agent-centered structures:

- `planes`
- `modules`
- `classes`
- `object_properties`
- `data_properties`
- `individuals`
- `axioms`
- `adapter_mappings`
- `hygiene_gates`

It should not generate fields from ontology-engineering governance metadata.
