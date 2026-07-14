# Unified graph visual regression baseline

These images are executable Playwright expectations for the canonical v2 ontology explorer.
They preserve the approved single-page, single-graph presentation while allowing node and edge
information to expand inside the existing characteristics table.

- `win32/chromium/ontology-explorer.png`: desktop viewport, exactly 1360 × 900.
- `win32/mobile-chrome/ontology-explorer.png`: mobile viewport, exactly 390 × 844.
- Both captures use the dark color scheme, reduced motion, loaded document fonts, and a graph
  whose `data-layout-invariant` has reached `true`.
- Windows CI compares both viewports with a maximum changed-pixel ratio of 0.5%; update these files
  only after an explicit review of an intended visual change.
- Pixel output is OS-specific because the interface includes Chinese and Japanese font fallback.
  The `windows-latest` validation job owns the reviewed pixel gate. Local machines and other
  operating systems still execute the complete structural, responsive, keyboard, theme, and
  reduced-motion E2E contract without comparing runner-specific pixels.
- The current Windows baselines originated from the reviewed actual-image attachments of failed
  run `29296996097`, where the new 7,242-claim site correctly rejected stale 7,244-claim PNGs.
  They were accepted by green GitHub Actions run `29298321356` at commit
  `90fde904a24e2f11e477bebbacd080d863f9194e`, including the Windows pixel gate and the complete
  cross-platform quality gate.
- Reviewed SHA-256: desktop `12B7A6F35DC04FEE7339DCFDC079E4C9F8F1238F4E0B12ED8A19832AC1D57747`;
  mobile `265BCB434D35CDB74A82E82ABEE2466CABC50881917070F3167CDC98F254BD69`.
- Every maintained E2E invocation starts its own Vite server. Reusing an unrelated process on port
  5173 is forbidden because that can make a current test suite validate an older site build.

The files under `../legacy-v1/` are frozen historical references and are never overwritten by
the v2 regression command.
