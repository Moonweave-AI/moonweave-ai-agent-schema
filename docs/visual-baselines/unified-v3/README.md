# Graphify community graph visual regression baseline

These images are executable Playwright expectations for the canonical v3 Graphify-style ontology
explorer. They protect the single community-colored relation graph, its stable force layout, the
responsive control header, and the in-canvas community legend as one reviewed visual surface.

- `win32/chromium/graphify-community-graph.png` is the `966 × 685` ontology-canvas crop produced
  inside the `1360 × 900` desktop viewport.
- `win32/mobile-chrome/graphify-community-graph.png` is the `352 × 769` ontology-canvas crop
  produced inside the `390 × 844` mobile viewport.
- Both captures use the dark presentation, a fully stabilized graph, frozen physics, loaded
  document fonts, hidden screenshot carets, and disabled screenshot animations.
- The assertion keeps Playwright's strict changed-pixel allowance: no nonzero `maxDiffPixels` or
  `maxDiffPixelRatio` is configured. Structural changes therefore cannot hide inside a broad
  screenshot tolerance.
- Pixel output is OS-specific because the Chinese and Latin interface uses local Windows font
  fallback and DirectWrite rasterization. The `windows-latest` job owns this reviewed pixel gate;
  ordinary local and Linux runs still execute the structural, responsive, interaction, and
  performance contracts without comparing this Windows-only baseline.
- The current images originate from the reviewed actual-image attachments of failed GitHub Actions
  run `29404630212` at commit `35e5a3f6035b3698e0d9ba755808b5270d8b70b2`. Pixel forensics found
  the community graph geometry, nodes, edges, panels, and responsive bounds unchanged; differences
  from the prior workstation-generated files were confined to glyph rasterization in the header,
  legend, and node/edge count badge.
- Reviewed SHA-256: desktop
  `B5D69195F66068C804C02C6ADF531A397808C41557E787004BD13E6F40BE442A`; mobile
  `541B6F3645D082DDF451639CA25E9A87DE53EF8D93A6863E9E569A5F83EFD758`.
- `npm run ontology:visual:update` writes the current machine's pixels. Do not accept that output as
  a new Windows baseline until the rendered change and its CI artifact have been explicitly
  reviewed.

The files under `../unified-v2/` and `../legacy-v1/` are historical references and are not modified
by the v3 Graphify regression workflow.
