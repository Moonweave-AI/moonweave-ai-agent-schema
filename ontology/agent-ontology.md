# Agent System Ontology

Status: canonical Phase 1 ontology
Date: 2026-06-30
Canonical machine artifact: `ontology/agent-ontology.json`
Base IRI: `https://moonweave.ai/ontology/agent-system/`
Version IRI: `https://moonweave.ai/ontology/agent-system/20260630/`

## Purpose

This is the canonical ontology for an agent system. It models the entities,
events, actions, policies, resources, and relations that appear inside an
operating agent runtime.

Ontology-engineering concepts such as specification, domain, module, ontology,
and class are intentionally not modeled as agent-system terms. They are only
artifact metadata and governance constraints around this file.

## Current Ontology Scale

The canonical machine artifact is intentionally larger than a demo graph. It is
the Phase 1 ontology family that downstream schema, Graph IR, adapters, and UI
must consume.

| metric | value |
|---|---:|
| domains | 1 |
| planes | 8 |
| modules | 37 |
| classes | 496 |
| object properties | 213 |
| data properties | 94 |
| annotation properties | 12 |
| individuals | 76 |
| axioms | 429 |
| datatypes | 8 |
| ontology partitions | 45 |

## Design References

The ontology borrows structure from mature ontology programs without importing
their subject matter:

| reference | adopted pattern | AOEF consequence |
|---|---|---|
| FIBO | source/product discipline, stable IRIs, maturity, imports, hygiene gates | kept as artifact governance, not as agent terms |
| Gene Ontology | orthogonal aspects plus DAG relations such as `is_a` and `part_of` | agent planes are orthogonal aspects; taxonomy/composition stay acyclic |
| CIDOC CRM | event-centered modeling around persistent items and temporal entities | runtime history is modeled as events involving actors, tools, resources, and policies |
| Palantir Ontology | operational object/link/action/function layer | terms are split into object types, event types, action types, policy types, and link types |
| DBpedia/FOAF | stable URI identity and linked-data interoperability | every term can be exported with a stable IRI and optional external mapping |

## Agent System Planes

Moonweave Agent Schema organizes agent systems through eight operational concern planes. These planes describe the recurring lifecycle surfaces of an agent system: context ingress and staging, control orchestration, runtime execution, interoperability adaptation, capability invocation, trust and safety mediation, observable feedback, and memory persistence.

| plane id | operational concern domain | modules |
|---|---|---|
| `info-plane` | Context Ingress & Staging Domain | info-container-command, info-content-block-modality, info-indexing, info-messages-instructions, info-output-disclosure, info-storage-sources |
| `orchestration-plane` | Control & Orchestration Domain | orchestration-actors-delegation, orchestration-composition, orchestration-evaluation, orchestration-routing-control, orchestration-task-planning |
| `runtime-plane` | Runtime State & Trace Domain | runtime-actors, runtime-artifacts, runtime-observability, runtime-system |
| `adapter-plane` | Interoperability & Adapter Domain | adapter-benchmarks-statecharts, adapter-frameworks, adapter-protocols, adapter-schema-export |
| `tool-plane` | Capability & Resource Invocation Domain | tool-discovery-selection, tool-invocation-execution, tool-mcp-transport, tool-registry-definition |
| `safety-plane` | Trust, Policy & Safety Domain | safety-commit-redaction, safety-injection-defense, safety-permission-policy, safety-sandbox-network, safety-trust-boundary |
| `feedback-plane` | Observability & Feedback Domain | feedback-logging, feedback-metrics-evaluation, feedback-review-optimization, feedback-warning-error |
| `memory-plane` | Memory & Context Persistence Domain | memory-chunking-situating, memory-context, memory-embedding-indexes, memory-ingestion, memory-retrieval-ranking |

## Core Modeling Rules

1. Agent-system terms must describe agent runtime structure or behavior.
2. Engineering metadata belongs to artifact metadata, not to ontology terms.
3. Taxonomic and compositional relations form a DAG.
4. Runtime, tool, memory, and orchestration flows may be cyclic and event-based.
5. Hidden chain-of-thought is not a required term, field, fixture, or UI surface.
6. Protocols, frameworks, and benchmarks are adapter mappings unless their term is broadly observable in agent systems.
7. Every class has a kind, plane, module, label, definition, source IDs, and stable IRI suffix.
8. Every object property has domain, range, family, source IDs, and acyclicity metadata where applicable.
9. Every data property, controlled individual, and axiom has source IDs and validation-ready fields.

## Phase 2 Handoff

Phase 2 must generate schema and graph fixtures from
`ontology/agent-ontology.json`:

- `planes` become top-level graph and schema namespaces.
- `modules` become graph groups and schema namespaces below each plane.
- `classes` become class/action/event/policy/resource candidates.
- `object_properties` become edge families and field-level relation constraints.
- `data_properties` become structural scalar fields and validation constraints.
- `individuals` become controlled vocabularies and sample enum values.
- `axioms` become validation, lint, and semantic export checks.
- `adapter_mappings` become profile/adapter conversion rules.
- `hygiene_gates` become validation tests.
