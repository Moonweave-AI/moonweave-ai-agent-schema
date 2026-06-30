# Ontology Explorer Art Direction

Status: accepted v1
Created: 2026-06-30

## Visual Thesis

The explorer is a cinematic moonlit research lab for inspecting agent-system ontology evidence. It must feel like a live atlas of claims, protocols, traces, schemas, and trust boundaries, not a generic SaaS dashboard.

The first viewport is the product: a graph workbench with evidence and inspector panels. There is no marketing hero.

## Moonweave Source Alignment

Local design source:

- `C:/technical-development/moonweave-ai.github.io/DESIGN.md`
- `C:/technical-development/moonweave-ai.github.io/src/styles/tokens.css`
- `C:/technical-development/moonweave-ai.github.io/src/styles/global.css`

Token mapping:

| design intent | Moonweave token family | explorer use |
|---|---|---|
| lunar black | `--color-bg`, `--gradient-lunar` | workbench background and graph stage |
| indigo glass | `--color-bg-elevated`, `--color-glass`, `--color-glass-strong` | rails, inspector, detail panels |
| moon milk | `--color-text` | primary labels and headings |
| lilac halo | `--color-lilac`, `--shadow-lunar` | profile nodes and selected glow |
| cyan thread | `--color-cyan`, `--color-thread` | graph edges, focus states, active tabs |
| blush pulse | `--color-blush` | adapter-only edges and warnings |
| editorial serif | `--font-display` | page and node headings |
| technical sans | `--font-body` | body and explanatory text |
| mono labels | `--font-mono` | source IDs, constraints, tabs, metrics |

## Reference Library

| ref | case | useful pattern | adoption rule |
|---|---|---|---|
| 01 | Stately Visualizer | state machine canvas and inspector split | Borrow state/transition clarity, not its visual brand. |
| 02 | React Flow homepage | node editor primitives and canvas affordances | Use React Flow interaction model. |
| 03 | React Flow examples | examples for custom nodes, edges, minimap, controls, export | Use as engineering reference. |
| 04 | React Flow UI templates | workflow editor node affordances | Adapt only after Moonweave token mapping. |
| 05 | React Flow accessibility docs | keyboard and screen-reader expectations | Treat as graph accessibility baseline. |
| 06 | Carbon chart types | chart selection discipline | Use for evidence/status panels. |
| 07 | Carbon flow charts | flow direction and label guidance | Use for relation readability. |
| 08 | Material Design 3 color | semantic color roles | Keep color semantic, not decorative. |
| 09 | Observable Plot gallery | compact data-dense panels | Use for evidence ledger density. |
| 10 | D3 force-directed graph examples | dense graph legibility tradeoffs | Use sparingly; no chaotic default layout. |
| 11 | Cytoscape.js demos | graph exploration and clustering | Use for future grouping ideas. |
| 12 | Neo4j Bloom | graph search and side inspector | Use inspector mental model. |
| 13 | Gephi overview | network analysis vocabulary | Use for future offline analysis exports. |
| 14 | Mermaid live editor | source-to-diagram feedback loop | Use for statechart export inspiration. |
| 15 | Excalidraw | approachable diagram manipulation | Borrow low-friction pan/zoom feel. |
| 16 | Figma FigJam | collaborative spatial canvas | Useful for later annotation mode. |
| 17 | VS Code graph/debug panels | dense developer navigation | Keep controls compact and predictable. |
| 18 | OpenTelemetry trace UIs | trace/event inspection | Use for observable trace panels. |
| 19 | Jaeger UI | span details and timing disclosure | Future trace timeline reference. |
| 20 | Honeycomb query UI | evidence-driven debugging interface | Use for source/constraint filtering. |
| 21 | Grafana node graph | service relation graph | Use for trust-boundary crossing affordances. |
| 22 | Temporal workflow UI | durable execution state inspection | Reference for runtime/session views. |
| 23 | LangGraph Studio | agent graph debugging | Use for runtime profile separation. |
| 24 | XState inspector | machine snapshot and event transitions | Use for statechart profile view. |
| 25 | Node-RED editor | flow authoring and node palette | Avoid palette clutter in v1. |
| 26 | Blender shader/node editor | spatial technical graph with panels | Borrow high-density workbench composition. |
| 27 | Unreal Blueprint editor | large graph navigation and minimap | Use as caution for visual complexity. |
| 28 | Framer visual editor | refined tool chrome | Use for restrained controls. |
| 29 | Linear issue detail pane | crisp inspector hierarchy | Use information rhythm, not SaaS palette. |
| 30 | Arc command center | glassy but useful overlays | Use restrained translucency. |
| 31 | NASA/JPL data visualization | scientific darkness and annotation | Borrow quiet research-lab mood. |
| 32 | The Pudding visual essays | narrative evidence progression | Use for future guided tours. |

## Component Inventory

- Topbar: brand, view tabs, exports.
- Left rail: phase gate, view metrics, compact source thread.
- Graph stage: React Flow canvas with minimap, controls, luminous semantic nodes, woven edges.
- Inspector: selected node metadata, evidence, constraints, relations.
- Detail panels: schema contract, conversion warnings, adapter map, semantic export.
- Export controls: graph JSON, schema JSON, SVG, PNG.

Cards are limited to repeated detail panels, inspector sections, and adapter items. No nested cards.

## Interaction Principles

1. Selection is always reversible; clicking a node updates inspector only.
2. View tabs filter the graph without changing canonical data.
3. Source IDs remain visible wherever a claim is inspected.
4. Trust-boundary edges are animated or visually differentiated.
5. Adapter-only concepts use blush styling and never look more canonical than core concepts.
6. Export actions operate on the current view, not hidden state.

## Wireframes

### Desktop Atlas

```text
topbar: brand | Atlas/Schema/Statechart/Evidence/Adapters | exports
left rail: phase gate + metrics + source IDs
center: graph canvas with minimap
right rail: inspector
bottom: schema / warnings / adapter / semantic panels
```

### Desktop Schema Contract

```text
topbar
left rail: schema gate + source thread
center: evidence/provenance/schema graph subset
right rail: selected field family inspector
bottom: JSON Schema ID, conversion warnings, semantic split
```

### Mobile Stacked View

```text
topbar stacked controls
phase gate
graph canvas
inspector
detail panels
```

## Accessibility Checklist

- Skip link to graph workbench.
- Landmark structure through `main`, `header`, `nav`, `section`, `aside`.
- Focus-visible rings use cyan thread.
- Controls are native buttons.
- Body text contrast targets WCAG 2.2 AA.
- Mobile layout stacks panels without horizontal text overflow.
- Graph has visible metrics and inspector fallback for screen-reader users.
- Motion respects `prefers-reduced-motion`.

## Visual Risks To Avoid

- Purple-blue SaaS gradient homepage.
- Decorative blobs or generic AI imagery.
- A graph that hides provenance or makes adapters look canonical.
- Long prose replacing the graph as the first viewport.
- Raw colors outside token definitions.
