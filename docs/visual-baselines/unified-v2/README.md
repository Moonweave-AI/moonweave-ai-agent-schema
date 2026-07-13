# Unified graph visual regression baseline

These images are executable Playwright expectations for the canonical v2 ontology explorer.
They preserve the approved single-page, single-graph presentation while allowing node and edge
information to expand inside the existing characteristics table.

- `win32/chromium/ontology-explorer.png`: desktop viewport, exactly 1360 × 900.
- `win32/mobile-chrome/ontology-explorer.png`: mobile viewport, exactly 390 × 844.
- Both captures use the dark color scheme, reduced motion, loaded document fonts, and a graph
  whose `data-layout-invariant` has reached `true`.
- `npm run test:e2e` compares both viewports with a maximum changed-pixel ratio of 0.5%; update
  these files only after an explicit review of an intended visual change.
- Pixel output is OS-specific because the interface includes Chinese and Japanese font fallback.
  The Windows validation job owns the reviewed pixel gate; other operating systems still execute
  the complete structural, responsive, keyboard, theme, and reduced-motion E2E contract.

The files under `../legacy-v1/` are frozen historical references and are never overwritten by
the v2 regression command.
