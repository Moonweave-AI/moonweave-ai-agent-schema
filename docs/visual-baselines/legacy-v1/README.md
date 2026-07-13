# Legacy v1 Explorer visual baseline

Captured: 2026-07-13
Canonical SHA-256: `344b64a3cb2a2e14eefbfc499be6989f4944ec4d4757fc7e7738c1795bd2d91c`

These viewport captures freeze the approved single-page composition before the
unified-graph data and interaction migration:

- `desktop-1360x900.png`: desktop shell, sticky hierarchy directory, one graph,
  and one inline characteristics table.
- `mobile-390x844.png`: the same four regions in the mobile stack.

The fCoSE graph layout is dynamic. Release comparison therefore treats shell,
directory, graph-surface placement, and the single characteristics table as the
visual contract; graph semantics are verified structurally by node, relation,
direction, and hierarchy tests.

Regenerate explicitly with:

```text
node scripts/capture-ontology-visual-baseline.mjs
```
