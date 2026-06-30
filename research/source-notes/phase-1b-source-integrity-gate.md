# Phase 1B Source Integrity Gate

Date: 2026-06-30
Status: complete
Gate result: passed

## Scope

Phase 1B verifies that the Phase 1 freeze candidates cite valid and usable
source evidence before RFC stabilization continues.

Checked inputs:

- `docs/rfcs/0001-ontology-layers.md`
- `docs/rfcs/0002-canonical-schema-contract.md`
- `docs/rfcs/0003-statechart-and-protocol-model.md`
- `research/pl-pr-core-profile-adapter-matrix.md`
- `research/source-registry.csv`
- `research/living-source-metadata.csv`

Non-goals:

- No source expansion.
- No schema implementation.
- No layer or relation redesign.
- No adapter implementation.

## ECC Method

Applied ECC lanes:

- `verification-loop`: local, repeatable source-ID integrity and gate checks.
- `dmux-workflows`: parallel review pattern applied through Codex subagents.
- `product-capability`: preserves the Phase 1 freeze boundary from Phase 1A.

Subagents:

- Evidence auditor: read-only registry integrity review.
- Living source checker: read-only living metadata and exclusion-status review.

## Local Gate Script Results

Extraction pattern:

```text
(?<![A-Za-z0-9-])(?:eng|lit)-[A-Za-z0-9][A-Za-z0-9._-]*
```

Aggregate counts:

| Metric | Count |
|---|---:|
| Registry rows | 331 |
| Living metadata rows | 182 |
| Total source references in checked RFC/matrix files | 296 |
| Unique source IDs referenced | 61 |
| Unique engineering source IDs referenced | 34 |
| Unique literature source IDs referenced | 27 |

By-file counts:

| File | References | Unique IDs |
|---|---:|---:|
| `docs/rfcs/0001-ontology-layers.md` | 89 | 52 |
| `docs/rfcs/0002-canonical-schema-contract.md` | 18 | 17 |
| `docs/rfcs/0003-statechart-and-protocol-model.md` | 39 | 36 |
| `research/pl-pr-core-profile-adapter-matrix.md` | 150 | 54 |

Referenced registry status counts:

| Registry status | Count |
|---|---:|
| `fetched` | 2 |
| `known-primary` | 10 |
| `search-verified` | 49 |

Referenced living metadata status counts:

| Normalization status | Count |
|---|---:|
| `normalized` | 34 |

Integrity findings:

| Check | Count |
|---|---:|
| Duplicate IDs in `source-registry.csv` | 0 |
| Duplicate IDs in `living-source-metadata.csv` | 0 |
| Missing source IDs | 0 |
| Missing living metadata rows for referenced `eng-*` IDs | 0 |
| Referenced living IDs not `normalized` | 0 |
| Referenced `future-dated-excluded` active evidence | 0 |
| Referenced `needs-targeted-check` IDs supporting field-level schema decisions | 0 |

## Subagent Review Results

Evidence auditor result:

- Checked all `eng-*` and `lit-*` IDs referenced by RFC 0001, RFC 0002,
  RFC 0003, and the PL/PR matrix against `research/source-registry.csv`.
- Found 296 source references and 61 unique source IDs.
- Found 0 missing source IDs.
- Found 0 duplicate registry IDs.
- Found 0 source-ID naming anomalies.
- Gate: passed.

Living source checker result:

- Checked all referenced `eng-*` IDs against `research/living-source-metadata.csv`.
- Found 171 engineering-source reference occurrences and 34 unique engineering IDs.
- Found 34 matching living metadata rows.
- Found 34 `normalized` rows.
- Found 0 missing living rows.
- Found 0 non-normalized referenced living rows.
- Found 0 active references to `future-dated-excluded`.
- Found 0 `needs-targeted-check` sources used for field-level schema support.
- Confirmed `eng-proto-mcp-2026-rc` remains `future-dated-excluded` in living
  metadata but is not cited by the checked RFC/matrix active evidence set.
- Gate: passed.

## Gate Decision

| Phase 1B gate | Required | Observed | Result |
|---|---:|---:|---|
| Missing source ID | 0 | 0 | PASS |
| Unresolved living source | 0 | 0 | PASS |
| Future-dated active evidence | 0 | 0 | PASS |
| `needs-targeted-check` as field-level schema support | 0 | 0 | PASS |

Phase 1B is complete. The checked RFC and PL/PR matrix references are valid
for Phase 1 stabilization.

## Handoff To Phase 1C

Phase 1C should review RFC content against the now-validated evidence set:

- Ontology core/profile/adapter boundary consistency.
- Adapter-only concept leakage into core.
- Hidden chain-of-thought exclusion.
- MCP vs A2A and local subagent vs remote delegation distinctions.
- Statechart profile vs runtime ontology core separation.
