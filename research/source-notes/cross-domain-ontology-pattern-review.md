# Cross-Domain Ontology Pattern Review

Date: 2026-06-30
Status: complete
Canonical output: `ontology/agent-ontology.md`, `ontology/agent-ontology.json`

> **Supersession note (2026-07-13):** This note records a completed v1 review.
> Its counts and legacy collection names are historical evidence, not the
> current v2 model or release status. RFC 0005 and the unified-graph upgrade
> plan supersede its implementation handoff: v2 has one Concept/Relation graph,
> and fields, examples, controlled values, source claims, mappings, and
> governance remain attached information.

## Reason For This Pass

The prior canonical artifact still allowed ontology-engineering concepts to
appear as if they were agent-system concepts. That was wrong for the intended
product. FIBO, GO, CIDOC CRM, Palantir Ontology, DBpedia, and FOAF should guide
structure, quality, and publication practice, not expand the subject matter of
the agent ontology.

At that v1 milestone, this pass re-centered the canonical ontology on observable agent-system planes,
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
| `eng-ont-microsoft-fabric-iq-ontology` | Microsoft Fabric IQ Ontology overview | Entity types with names, identifiers, properties and constraints; typed directional relationships with attributes/cardinality; graph navigation and reasoning. |
| `eng-ont-skan-agentic-ontology-of-work` | Skan Agentic Ontology of Work | Vendor reference for canonical entities, attributes, relationships, governance constraints, lifecycle models, and examples. |
| `eng-ont-dbpedia` | DBpedia | Stable URI and linked-data class/property publication pattern. |
| `eng-ont-foaf` | FOAF | Lightweight interoperable vocabulary for people, agents, organizations, and social relations. |

## Design Consequences

| reference pattern | agent ontology decision |
|---|---|
| GO: three orthogonal aspects and DAG relations | AOEF uses orthogonal agent planes; taxonomy/composition relations are acyclic. |
| CIDOC CRM: temporal entities connect people, places, objects | Runtime events connect agents, tools, resources, safety decisions, and outputs. |
| Palantir: object/link/action/function ontology | Terms are typed as object, event, action, policy, resource, actor, index, adapter, or relation. |
| Microsoft Fabric: entity/property/typed directional relation contract | Canonical Concepts and Relations carry structure, direction, constraints, and information in one semantic graph. |
| Skan AOW: canonical entity/attribute/relation/governance/lifecycle/examples | Node and relation information must jointly support explainability and lifecycle cases without creating a second navigation tree. |
| DBpedia/FOAF: stable web identifiers | Every term is exportable under the stable `https://moonweave.ai/ontology/agent-system/` namespace. |
| FIBO: hygiene, source/product, IRI discipline | Artifact metadata and hygiene gates remain, but no metadata classes are agent-system terms. |

## Limits Of Support

### Palantir

Palantir documents an operational product ontology. Its object, link, action,
function, security, and governance patterns support richer canonical node and
relation contracts, but the product implementation is not FIBO, OWL, or a
neutral ontology standard. Its Object Explorer and Ontology Manager navigation
do not require Moonweave to copy Palantir page boundaries.

### Microsoft Fabric IQ

Fabric IQ Ontology is an evolving preview product. Its entity, property,
relationship, constraint, binding, and graph explanations support the unified
information contract, but they do not establish a stable universal Agent
Ontology model. Its type/instance and product-page organization does not
require Moonweave to add parallel Schema or Instance pages.

### Skan Agentic Ontology Of Work

Skan AOW is a vendor whitepaper, not independent academic consensus or a
standards-body specification. Its canonical entities, lifecycle, governance,
and case patterns are comparative evidence only. Its four-layer stack and
vendor terminology do not replace Moonweave's eight Domains or create a second
user-facing hierarchy.

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

## Historical v1 Gate Results

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

## Superseded Phase 2 Handoff

The original Phase 2 handoff listed parallel top-level collections. That list is
retained in Git history but is no longer an implementation instruction. The v2
builder reads only `ontology/source/**` and generates one canonical artifact
with these graph-owning collections:

- `planes`
- `modules`
- `classes`
- `relations`
- `global_constraints`
- `case_paths`
- `hygiene_gates`

Structure fields, examples, controlled values, mappings, constraints, and
source claims are information on their canonical owner. They do not restore
`object_properties`, `data_properties`, `individuals`, `axioms`, or
`adapter_mappings` as parallel truth sources or navigation products.
