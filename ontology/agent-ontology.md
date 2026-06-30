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
| modules | 36 |
| classes | 413 |
| object properties | 157 |
| data properties | 92 |
| annotation properties | 12 |
| individuals | 75 |
| axioms | 368 |
| datatypes | 8 |
| ontology partitions | 44 |

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

| plane | scope |
|---|---|
| `runtime-plane` | agent system, runtime session, agent actors, models, transcript, and observable event stream |
| `info-plane` | text, instructions, messages, command outputs, storage, indexes, progressive disclosure, and light index |
| `memory-plane` | document ingestion, chunking, embedding, retrieval, reranking, rank fusion, and context construction |
| `orchestration-plane` | task distribution, subagents, evaluators, gates, routes, prompt chains, parallelization, voting, and synthesis |
| `tool-plane` | tool registry, MCP client/server, tool definitions, tool matching, tool calls, execution, and tool results |
| `safety-plane` | trust boundaries, permission prompts, allow/deny/escalate decisions, sandboxing, network control, pattern scans, and commit gates |
| `feedback-plane` | warnings, reviews, feedback, log listeners, metrics, optimization loops, and recovery events |
| `adapter-plane` | protocol/framework/benchmark mappings that do not redefine core runtime terms |

## Module Architecture

Each plane is split into modules so the ontology behaves like a production
ontology family rather than a flat node list. Classes belong to exactly one
module, modules belong to one plane, and generated schemas must preserve this
domain -> plane -> module -> class path.

| plane | modules |
|---|---|
| `runtime-plane` | runtime system, runtime actors, runtime observability, runtime artifacts |
| `info-plane` | container/command, output/disclosure, storage/sources, messages/instructions, information indexing |
| `memory-plane` | memory ingestion, chunking/situating, embedding/index, retrieval/ranking, context assembly |
| `orchestration-plane` | task planning, actors/delegation, routing/control, composition patterns, evaluation loop |
| `tool-plane` | tool registry/definition, discovery/selection, invocation/execution, MCP transport |
| `safety-plane` | trust boundary, permission/policy, sandbox/network, injection defense, commit/redaction |
| `feedback-plane` | warning/error, review/optimization, metrics/evaluation, logging |
| `adapter-plane` | protocol adapters, framework adapters, benchmark/statechart adapters, schema/export adapters |

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
