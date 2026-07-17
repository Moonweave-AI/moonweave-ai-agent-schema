<div align="center">
  <img src="docs/assets/moonweave-agent-ontology-mark.svg" alt="Moonweave Agent Ontology mark" width="152" />

  <h1>Moonweave Agent Ontology</h1>

  <p>
    A single-source ontology engineering workspace for agent systems: recursive YAML source,
    deterministic JSON projections, and a Graphify-style explorer.
  </p>

  <p>
    <a href="https://moonweave-ai.github.io/moonweave-ai-agent-schema/">Explorer</a>
    | <a href="docs/README.zh.md">Chinese docs</a>
    | <a href="docs/README.ja.md">Japanese docs</a>
    | <a href="src/generated/agent-ontology.json">Generated ontology JSON</a>
  </p>
</div>

## What This Repository Contains

Moonweave Agent Ontology is a governed ontology product for agent-system construction. It is not a prompt collection, benchmark list, or graph mockup.

The repository now has one editable ontology authority:

- `ontology/node.yaml` is the root node and contains artifact-level governance, source catalog data, and root metadata.
- Every child node lives in its own directory with exactly one `node.yaml`.
- Direct child directories are the only source hierarchy. There is no `children/` wrapper and no parallel JSON, CSV, Markdown, migration, ABox, TBox, instance, schema, or evidence source tree.
- Generated files under `src/generated/` are read-only build products.
- The React explorer under `src/` renders the generated projection with the current Graphify-style force-directed UI.

All definitions, examples, fields, constraints, controlled values, source claims, review notes, and relation details are information on the relevant node or relation. They are not graph nodes and must not become a second browsing structure.

## Source Model

The physical source tree mirrors the logical ontology tree:

```text
ontology/
|-- node.yaml
|-- info-plane/
|   |-- node.yaml
|   `-- <module>/
|       |-- node.yaml
|       `-- <concept>/
|           |-- node.yaml
|           `-- <narrower-concept>/
|               `-- node.yaml
|-- runtime-plane/
|   `-- ...
`-- tool-plane/
    `-- ...
```

Rules that are enforced by tests and the compiler:

- exactly one root source: `ontology/`;
- exactly one file per ontology node: `node.yaml`;
- arbitrary concept depth is allowed;
- parent/child placement is the source of the primary hierarchy;
- cross-links remain relation metadata, not file placement;
- deprecated or historical material is not retained as a source authority;
- generated artifacts are rebuilt atomically from YAML and checked with `npm run ontology:check`.

## Eight Domains

The top level contains eight operational concern domains:

| Domain | Scope |
|---|---|
| Context Ingress & Staging | Observable content becoming available to an agent step or model call. |
| Control & Orchestration | Goals, plans, routing, delegation, handoff, gates, and orchestration composition. |
| Runtime State & Trace | Sessions, attempts, outcomes, authority bindings, trace events, checkpoints, and artifacts. |
| Interoperability & Adapter | Protocol, framework, benchmark, statechart, schema/export, language-profile, graph, and frontend adaptation. |
| Capability & Resource Invocation | Capability registries, tools, resources, prompts, APIs, discovery, invocation, and side-effect evidence. |
| Trust, Policy & Safety | Trust boundaries, permissions, policies, sandboxing, injection defense, commit gates, redaction, and disclosure. |
| Observability & Feedback | Diagnostics, logs, metrics, reviews, corrections, evaluations, recovery actions, and feedback loops. |
| Memory & Context Persistence | Memory stores, records, ingestion, chunking, indexes, retrieval, summaries, lifecycle operations, and poisoning controls. |

Domain and module nodes are stable navigation boundaries. They are not a depth limit. Concept nodes may continue downward for as many levels as the logic requires.

## Build And Verification

Install dependencies:

```bash
npm ci
```

Build the ontology projections:

```bash
npm run ontology:build
```

Verify generated artifacts have not drifted:

```bash
npm run ontology:check
```

Run the local explorer:

```bash
npm run dev
```

Run the full local verification chain:

```bash
npm run verify
```

Important commands:

| Command | Purpose |
|---|---|
| `npm run ontology:build` | Compile `ontology/` into `src/generated/agent-ontology.json`, `source-index.json`, and `ontology-community-graph.json`. |
| `npm run ontology:check` | Read-only drift check for generated artifacts. |
| `npm run ontology:communities:check` | Verify the generated community graph against canonical module ownership. |
| `npm run test:unit` | Run unit/integration tests after rebuilding ontology artifacts. |
| `npm run build` | Typecheck, Vite build, site manifest generation, and site artifact verification. |
| `npm run e2e` | Browser contract tests. |

## Explorer

The explorer keeps one Graphify-style graph surface:

- `vis-network` `ForceAtlas2Based` is used for the browser force-directed view.
- Nodes are colored by canonical module ownership.
- Node size is a visual hub signal, not a business-importance score.
- Edge labels are kept out of the default canvas and exposed through details/hover surfaces to reduce visual clutter.
- Sources, examples, fields, constraints, controlled values, review notes, and relation details appear in node/relation information panels.
- There are no separate schema, instance, evidence, adapter, ABox, or TBox pages.

Community assignment is released from the ontology’s module ownership, not from statistical clustering. The visual layout may help humans explore the graph, but it must not rewrite ontology ownership.

## Publication

GitHub Pages deploys the built explorer:

[https://moonweave-ai.github.io/moonweave-ai-agent-schema/](https://moonweave-ai.github.io/moonweave-ai-agent-schema/)

Production artifacts must be generated from the same commit that is deployed. The site build manifest binds the deployed commit to the ontology source fingerprint, generated canonical artifact, and generated community graph.
