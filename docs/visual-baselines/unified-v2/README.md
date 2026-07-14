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
- The current candidate Windows baselines were reviewed from the actual-image attachments of the
  failed GitHub Actions run `29296996097`, commit `b4d390e20d2169e1ac9f7ca1fa94799b5a4a5371`.
  That run compared the new 7,242-claim site against the stale 7,244-claim baselines; it did not
  validate these candidate PNGs. Replace this note with a green run provenance only after a commit
  containing the candidate PNGs passes the Windows visual gate.
- Every maintained E2E invocation starts its own Vite server. Reusing an unrelated process on port
  5173 is forbidden because that can make a current test suite validate an older site build.

The files under `../legacy-v1/` are frozen historical references and are never overwritten by
the v2 regression command.
