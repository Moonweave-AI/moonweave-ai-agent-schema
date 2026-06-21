# Visualization Source Workspace

This directory holds source-level design notes for the v2 static workbench. The production page remains `visualization/index.html` so the graph can still be opened directly without a server.

Current implementation rule:

- Default route is `evidence-atlas`; it must show the source -> claim -> ontology object -> gap audit chain.
- Keep old D3 graph behavior intact, but expose it only through `ontology-graph-explorer`.
- Build or inline new UI only after research and UI gates pass.
- Treat `workbench-spec.js` as the source-level route/module contract for the static single-file page.
