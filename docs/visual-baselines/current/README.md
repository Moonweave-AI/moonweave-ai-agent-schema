# Current Graphify visual baseline

These images are the executable Playwright expectations for the current
Graphify-style ontology explorer. They protect the community-coloured relation
graph, stabilized force layout, responsive header, and in-canvas legend as one
visual surface.

- `win32/chromium/graphify-community-graph.png` is the ontology-canvas crop for
  the `1360 × 900` desktop viewport.
- `win32/mobile-chrome/graphify-community-graph.png` is the ontology-canvas crop
  for the `390 × 844` mobile viewport.
- Captures use the dark theme, stabilized and then frozen physics, loaded fonts,
  hidden carets, and disabled screenshot animations.
- The Windows CI job owns pixel comparison because local font rasterization is
  platform-specific. Other environments still run structural, interaction,
  responsive, and performance contracts.
- `npm run ontology:visual:update` captures the current machine. A changed image
  must be inspected before it replaces this baseline.
