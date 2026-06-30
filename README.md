<div align="center">
  <img src="docs/assets/moonweave-agent-ontology-mark.svg" alt="Moonweave Agent Ontology mark" width="152" />

  <h1>Moonweave Agent Ontology</h1>

  <p>
    An evidence-bound ontology engineering framework for agent systems:
    runtime, information, memory, orchestration, tools, safety, feedback, adapters,
    schemas, and graph exploration.
  </p>

  <p>
    <a href="https://moonweave-ai.github.io/moonweave-ai-agent-schema/">Explorer</a>
    | <a href="docs/README.zh.md">Chinese docs</a>
    | <a href="docs/README.ja.md">Japanese docs</a>
    | <a href="ontology/agent-ontology.json">Canonical ontology JSON</a>
    | <a href="schemas/agent-ontology.schema.json">JSON Schema</a>
  </p>
</div>

## What This Repository Contains

Moonweave Agent Ontology is the canonical ontology product for a structured
agent-system schema and explorer. It is not a prompt collection, a benchmark
leaderboard, or a one-off graph mockup. The repository contains:

- a canonical agent ontology artifact in `ontology/agent-ontology.json`;
- a human-readable ontology summary in `ontology/agent-ontology.md`;
- a JSON Schema Draft 2020-12 contract in `schemas/agent-ontology.schema.json`;
- valid and invalid fixtures under `fixtures/`;
- a React + TypeScript ontology explorer under `src/`;
- Phase 0/1 evidence records, source registries, and RFCs under `research/` and `docs/rfcs/`.

The authoritative product surface is the ontology artifact, schema, research
registry, RFC set, fixtures, tests, and explorer.

## Why Agent Systems Need An Ontology

Agent systems have moved beyond a single model call. Real systems now combine
long-running runtime sessions, retrieved context, memory stores, tool calls,
subagents, handoffs, remote delegation, protocol boundaries, safety decisions,
human review, benchmark pressure, and deployment-specific adapters.

Without an ontology, those pieces are usually described with framework-specific
names that do not line up across projects. A "handoff", a "tool call", an
"agent card", a "checkpoint", and an "evaluation trace" may all be real, but
they do not belong to the same layer. This repository separates them into
core, profile, and adapter semantics so schema, graph views, frontend
inspection, and downstream exports can remain stable.

The project borrows engineering discipline from mature ontology programs
without importing their subject matter:

| Reference program | Pattern borrowed | Consequence for this project |
|---|---|---|
| [FIBO](https://github.com/edmcouncil/fibo) and the [FIBO ontology viewer](https://spec.edmcouncil.org/fibo/ontology) | ontology family, stable identifiers, maturity and hygiene discipline, source/product separation | Agent ontology is a governed product, not a flat concept dump. |
| [Gene Ontology](https://geneontology.org/docs/ontology-documentation/) | orthogonal aspects and acyclic taxonomy/composition relations | Agent planes are separate aspects; taxonomy and composition stay disciplined. |
| [CIDOC CRM](https://cidoc-crm.org/) | event-centered modeling over people, things, places, and activities | Runtime history is represented as observable events involving actors, tools, resources, and policies. |
| [Palantir Ontology](https://www.palantir.com/docs/foundry/ontology/overview/) | operational semantic layer joining objects, links, actions, and functions | Agent terms are typed as objects, events, actions, policies, resources, actors, indexes, adapters, and relations. |
| [DBpedia Ontology](https://www.dbpedia.org/resources/ontology/) and [FOAF](http://xmlns.com/foaf/spec/) | web identifiers and lightweight linked-data vocabulary practice | Terms are exportable through stable IRIs and can be bridged into semantic-web profiles. |
| [W3C PROV-O](https://www.w3.org/TR/prov-o/) | provenance-oriented accountability | Source IDs, constraints, proposals, review status, and derivation notes are first-class governance data. |

## Ontology Shape

The canonical ontology is an agent-system ontology. Ontology-engineering
metadata such as "ontology specification", "module", or "class" is governance
metadata around the artifact, not part of the agent runtime itself.

| Metric | Current value |
|---|---:|
| Domains | 1 |
| Planes | 8 |
| Modules | 36 |
| Classes | 413 |
| Object properties | 157 |
| Data properties | 92 |
| Annotation properties | 12 |
| Individuals | 75 |
| Axioms | 368 |
| Datatypes | 8 |
| Ontology partitions | 44 |

## Planes

| Plane | Scope |
|---|---|
| Runtime Plane | Agent system, runtime session, actors, models, transcript, observable events, checkpoints, and execution state. |
| Info Plane | Text, instructions, messages, command output, storage, information indexes, output chunks, and disclosure surfaces. |
| Memory Plane | Document ingestion, chunking, embeddings, vector and lexical indexes, retrieval, reranking, rank fusion, and context assembly. |
| Orchestration Plane | Goals, tasks, planning, delegation, subagents, routes, gates, prompt chains, parallelization, voting, synthesis, and evaluator loops. |
| Tool Plane | Tool registries, definitions, discovery, matching, calls, execution, MCP surfaces, tool results, and execution transcripts. |
| Safety Plane | Trust boundaries, permission prompts, allow/deny/escalate decisions, sandboxing, network control, injection defense, and commit/redaction gates. |
| Feedback Plane | Warnings, feedback, review, logs, metrics, optimization loops, recovery events, and evaluation signals. |
| Adapter Plane | MCP, A2A, framework, benchmark, statechart, schema export, and profile mappings that must not redefine core terms. |

## Layer Boundary

The ontology uses a strict boundary model:

- Core terms must be broadly observable across agent systems.
- Profile terms describe optional but reusable views such as memory, orchestration, validation, and lifecycle profiles.
- Adapter terms map external protocols, frameworks, and benchmarks without polluting core.
- Hidden chain-of-thought is not a required field, fixture, schema object, or UI surface.
- Benchmark scores and environment pressure are adapter metadata, not ontology core.
- Cross-boundary relations must reference a trust boundary.

## Repository Layout

```text
.
|-- ontology/
|   |-- agent-ontology.json
|   `-- agent-ontology.md
|-- schemas/
|   `-- agent-ontology.schema.json
|-- fixtures/
|   |-- valid/
|   `-- invalid/
|-- research/
|   |-- source-registry.csv
|   |-- living-source-metadata.csv
|   |-- pl-pr-core-profile-adapter-matrix.md
|   `-- source-notes/
|-- docs/
|   |-- README.zh.md
|   |-- README.ja.md
|   |-- assets/
|   |-- design/
|   |-- governance/
|   `-- rfcs/
|-- src/
|-- tests/
|-- e2e/
`-- scripts/
```

## Development

Install dependencies:

```bash
npm ci
```

Run the local explorer:

```bash
npm run dev
```

Run the verification loop:

```bash
npm run verify
npm run e2e
```

Generate the canonical expanded ontology from the generation script:

```bash
npm run ontology:expand
```

## Evidence And Governance

The ontology is evidence-bound. Accepted terms and relations trace back to the
Phase 0 source registry, synthesis constraints, and Phase 1 RFC decisions.

Important governance files:

- `research/source-registry.csv` records the full source registry.
- `research/living-source-metadata.csv` records living source versions, dates, and normalization status.
- `research/source-notes/fibo-alignment-review.md` records the FIBO alignment pass.
- `research/source-notes/cross-domain-ontology-pattern-review.md` records cross-domain ontology pattern corrections.
- `docs/governance/source-and-schema-governance.md` defines recheck, schema versioning, and trust-boundary policy.
- `docs/rfcs/0001-ontology-layers.md` freezes ontology layer boundaries.
- `docs/rfcs/0002-canonical-schema-contract.md` defines the canonical schema contract.
- `docs/rfcs/0003-statechart-and-protocol-model.md` defines statechart and protocol modeling boundaries.

## Current Status

Phase 0 and Phase 1 are closed for the current canonical product. The
repository is ready for the next implementation phases:

1. derive production schemas, profiles, and semantic exports from the canonical ontology;
2. keep Graph IR and statechart views as projections, not as the source of truth;
3. continue improving the Moonweave ontology explorer against the canonical artifact;
4. add adapter fixtures for MCP, A2A, framework mappings, and benchmark mappings.

## Publication

The explorer is deployed through GitHub Pages:

[https://moonweave-ai.github.io/moonweave-ai-agent-schema/](https://moonweave-ai.github.io/moonweave-ai-agent-schema/)

The published UI uses the Moonweave visual language while exposing a
FIBO-inspired ontology family structure: domain, plane, module, class,
relation, scalar field, individual, axiom, and evidence views.
