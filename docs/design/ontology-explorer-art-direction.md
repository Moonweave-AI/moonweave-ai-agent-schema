# Ontology Explorer Art Direction

Status: accepted v2 (Graphify-style single graph)
Created: 2026-06-30
Revised: 2026-07-15

## Visual Thesis

The explorer is a cinematic moonlit research lab for inspecting agent-system ontology evidence. It must feel like a live atlas of claims, protocols, traces, schemas, and trust boundaries, not a generic SaaS dashboard. Its product thesis is **one graph, complete semantics, inline information**: a single canonical concept graph carries Domain, Module, Concept, and relation logic, while the selected node or relation is explained on the same page.

The first viewport is the product: the existing single-page atlas with a hierarchy directory, one graph surface, and an inline characteristics table. There is no marketing hero and no competing ontology workbench.

## Moonweave Source Alignment

Local design source:

- `C:/technical-development/moonweave-ai.github.io/DESIGN.md`
- `C:/technical-development/moonweave-ai.github.io/src/styles/tokens.css`
- `C:/technical-development/moonweave-ai.github.io/src/styles/global.css`

Token mapping:

| design intent | Moonweave token family | explorer use |
|---|---|---|
| lunar black | `--color-bg`, `--gradient-lunar` | workbench background and graph stage |
| indigo glass | `--color-bg-elevated`, `--color-glass`, `--color-glass-strong` | hierarchy rail, graph controls, inline detail disclosures |
| moon milk | `--color-text` | primary labels and headings |
| lilac halo | `--color-lilac`, `--shadow-lunar` | profile nodes and selected glow |
| cyan thread | `--color-cyan`, `--color-thread` | graph edges, focus states, active inline controls |
| blush pulse | `--color-blush` | adapter-only edges and warnings |
| editorial serif | `--font-display` | page and node headings |
| technical sans | `--font-body` | body and explanatory text |
| mono labels | `--font-mono` | source IDs, constraints, detail labels, metrics |

## Reference Library

| ref | case | useful pattern | adoption rule |
|---|---|---|---|
| 01 | Stately Visualizer | state machine canvas and selected-state explanation | Borrow state/transition clarity, not its inspector split or visual brand. |
| 02 | React Flow homepage | historical node editor primitives and canvas affordances | Historical interaction reference only; do not add a node-editor mode or a second graph implementation. |
| 03 | React Flow examples | historical custom-node, edge, minimap, controls, and export patterns | Historical reference only; do not reintroduce React Flow as a second graph implementation. |
| 04 | React Flow UI templates | historical workflow editor node affordances | Historical reference only after Moonweave token mapping. |
| 05 | React Flow accessibility docs | keyboard and screen-reader expectations | Historical accessibility reference; verify equivalent behavior in the graph controls and inline information fallback. |
| 06 | Carbon chart types | chart selection discipline | Use for evidence/status panels. |
| 07 | Carbon flow charts | flow direction and label guidance | Use for relation readability. |
| 08 | Material Design 3 color | semantic color roles | Keep color semantic, not decorative. |
| 09 | Observable Plot gallery | compact data-dense panels | Use for evidence ledger density. |
| 10 | D3 force-directed graph examples | dense graph legibility tradeoffs | Use sparse labels and restrained edges; never leave physics running indefinitely. |
| 11 | [Graphify](https://github.com/Graphify-Labs/graphify) | community-colored, degree-scaled, ForceAtlas2-based network exploration | Use as the primary presentation baseline, adapted to Moonweave tokens and complete directed ontology relations. |
| 12 | Neo4j Bloom | graph search and focused entity explanation | Adapt its focus mental model to the inline characteristics table; do not add a side inspector. |
| 13 | Gephi overview | network analysis vocabulary | Use for future offline analysis exports. |
| 14 | Mermaid live editor | source-to-diagram feedback loop | Use for statechart export inspiration. |
| 15 | Excalidraw | approachable diagram manipulation | Borrow low-friction pan/zoom feel. |
| 16 | Figma FigJam | collaborative spatial canvas | Useful for later annotation mode. |
| 17 | VS Code graph/debug panels | dense developer navigation | Keep controls compact and predictable. |
| 18 | OpenTelemetry trace UIs | trace/event inspection | Use for trace information attached to observable nodes and relations. |
| 19 | Jaeger UI | span details and timing disclosure | Future trace timeline reference. |
| 20 | Honeycomb query UI | evidence-driven debugging interface | Use for source/constraint filtering. |
| 21 | Grafana node graph | service relation graph | Use for trust-boundary crossing affordances. |
| 22 | Temporal workflow UI | durable execution state inspection | Reference for runtime/session information inside the same detail table. |
| 23 | LangGraph Studio | agent graph debugging | Use to clarify runtime annotations without creating a separate profile graph. |
| 24 | XState inspector | machine snapshot and event transitions | Use for statechart annotations and exports, not a statechart page. |
| 25 | Node-RED editor | flow authoring and node palette | Avoid palette clutter in v1. |
| 26 | Blender shader/node editor | spatial technical graph with dense controls | Borrow compact graph controls, not its multi-panel workbench. |
| 27 | Unreal Blueprint editor | large graph navigation and minimap | Use as caution for visual complexity. |
| 28 | Framer visual editor | refined tool chrome | Use for restrained controls. |
| 29 | Linear issue detail pane | crisp information hierarchy | Use its information rhythm inside the inline table, not a separate pane or SaaS palette. |
| 30 | Arc command center | glassy but useful overlays | Use restrained translucency. |
| 31 | NASA/JPL data visualization | scientific darkness and annotation | Borrow quiet research-lab mood. |
| 32 | The Pudding visual essays | narrative evidence progression | Use for future guided tours. |

## Component Inventory

- Topbar: brand, language, theme, export.
- Left rail: recursive canonical hierarchy directory and disclosure controls.
- Graph stage: one `vis-network` canvas with `ForceAtlas2Based` initial stabilization, community legend/filter, search, fit, pan, zoom, drag, semantic nodes, and directed edges.
- Inline characteristics: hierarchy, definitions, relations, examples, structure, sources, mappings, changes.
- Export controls: graph JSON, schema JSON, SVG, PNG.

Cards are limited to repeated rows within the single inline characteristics area. No nested cards and no right-side inspector.

## Interaction Principles

1. Clicking a node or relation updates the same-page characteristics table; selection never creates a detail page, shadow node, or second graph.
2. Directory, search, and community filters change only visibility and focus, never canonical data, relation direction, or the eight-Domain hierarchy.
3. Source IDs remain visible wherever a claim is inspected.
4. Canonical/explicit facts use stronger solid edges; derived presentation edges use lighter dashed edges. Relation labels stay hidden until hover or selection.
5. Adapter-only concepts use blush styling and never look more canonical than core concepts.
6. Initial physics stabilization is deterministic and stops when complete; dragging a node must not make the whole graph continually oscillate.
7. Export actions operate on the current view, not hidden state.

## Graph Data And Visual Contract

- NetworkX `MultiDiGraph` is the offline graph record for complete directed, multi-predicate, parallel relation facts.
- Community detection consumes a deterministic simple undirected projection only. Prefer Leiden when available and fall back to seeded Louvain; this projection must never rewrite canonical semantics.
- Community identity controls node color. It does not encode node type, ontology level, ownership, acceptance status, or business importance.
- Node size scales with graph degree to reveal structural hubs. It must be described as connectivity, not semantic priority.
- Only sufficiently connected nodes keep permanent labels. Every node remains discoverable through search, hover, selection, and the inline characteristics area.
- The browser uses locally bundled `vis-network` `ForceAtlas2Based`, stabilizes once, then disables physics. There are no hierarchy/relationship modes, layout direction controls, or user-selectable layout engines.
- Schema, fields, constraints, examples, instances, case paths, sources, mappings, and governance remain information on their original node or relation. They do not enter community detection as extra nodes.

## Wireframes

### Desktop Atlas

```text
header: brand | language | theme | export
left: canonical hierarchy directory
main: breadcrumb + definition
main: one graph canvas
main: one inline node/relation characteristics table
```

### Mobile Stacked View

```text
header controls
hierarchy directory
breadcrumb + definition
one graph canvas
one inline node/relation characteristics table
```

## Accessibility Checklist

- Skip link to graph workbench.
- Landmark structure through `main`, `header`, `nav`, `section`, `aside`.
- Focus-visible rings use cyan thread.
- Controls are native buttons.
- Body text contrast targets WCAG 2.2 AA.
- Mobile layout stacks panels without horizontal text overflow.
- Graph has visible metrics and the inline characteristics table as the screen-reader fallback.
- Motion respects `prefers-reduced-motion`.

## Visual Risks To Avoid

- Purple-blue SaaS gradient homepage.
- Decorative blobs or generic AI imagery.
- A graph that hides provenance or makes adapters look canonical.
- Community colors presented as ontology types or modules.
- Permanent labels on every node, continuously moving physics, or visible labels on every edge.
- Top-down/left-to-right toggles, hierarchy/relationship modes, or competing layout engines.
- Long prose replacing the graph as the first viewport.
- Raw colors outside token definitions.
- ABox/TBox/Schema/Instance routes, tabs, inspectors, or parallel graphs.
