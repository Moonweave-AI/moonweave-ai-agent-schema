# Phase 1A Scope And Artifact Inventory

Date: 2026-06-30
Status: complete

## Capability

Phase 1A defines exactly which artifacts Phase 1 must freeze before any further ontology model, canonical schema, adapter, Graph IR, or frontend implementation work can be treated as authoritative.

This is an inventory and scoping gate. It does not perform the full source integrity audit from Phase 1B, and it does not reopen Phase 0 broad source expansion.

## ECC Method

- `product-capability`: converted the user goal into explicit freeze boundaries, non-goals, artifact ownership, and handoff criteria.
- `verification-loop`: used lightweight structural checks for file presence, row counts, source-ID precheck, and decision counts.
- `strategic-compact`: records a compact handoff point after Phase 1A so later Phase 1B can start from this inventory rather than reloading broad context.

## Files Fully Read For Phase 1A

User-specified Phase 1A inputs were read from beginning to end.

| file | lines | role in Phase 1A |
|---|---:|---|
| `docs/rfcs/0001-ontology-layers.md` | 94 | Freeze ontology layer/core-profile-adapter boundary. |
| `docs/rfcs/0002-canonical-schema-contract.md` | 119 | Freeze schema contract, validation split, provenance, trace, and trust-boundary constraints. |
| `docs/rfcs/0003-statechart-and-protocol-model.md` | 140 | Freeze protocol, statechart, runtime, and benchmark adapter boundaries. |
| `research/source-registry.csv` | 332 including header | Freeze source ID namespace and source status baseline. |
| `research/living-source-metadata.csv` | 183 including header | Freeze living-source normalization baseline. |
| `research/pl-pr-core-profile-adapter-matrix.md` | 72 | Freeze `PL-*` and `PR-*` disposition matrix for RFC drafting. |

All files under `research/source-notes/**` were also read to preserve the Phase 0 evidence path behind the RFCs and matrix. Phase 1A therefore scopes from the complete local Phase 0 evidence set, not only from the compressed RFC summaries.

## Phase 0 Evidence Backbone Read

The local Phase 0 corpus read for this inventory includes:

- `phase-0a-screening-log.md`
- `phase-0b-expanded-engineering-corpus.md`
- `phase-0b-expanded-literature-corpus.md`
- `phase-0c-preparation.md`
- `priority-a-deep-read-ledger.md`
- `phase-0c-synthesis-constraints.md`
- `phase-0c-provisional-layer-relation-proposal.md`
- `phase-0c-review-gate.md`
- `phase-0c-completion.md`
- `phase-0c-final-closure-audit.md`
- `post-phase-0-dq-resolution.md`
- all track-level notes for mechanisms, protocols, frameworks, MAS, ontology engineering, schema validation, statecharts, benchmark expansion, and ontology/validation expansion.

Key implication: Phase 1 freezes decisions derived from Phase 0's evidence spine; it does not derive ontology design from later implementation files.

## Registry Baseline

| metric | value |
|---|---:|
| Registered source rows | 331 |
| Engineering rows | 182 |
| Literature rows | 149 |
| Living metadata rows | 182 |
| Living rows normalized | 181 |
| Living rows future-dated-excluded | 1 |

Registry status distribution:

| status | count |
|---|---:|
| `fetched` | 27 |
| `future-dated-excluded` | 1 |
| `known-primary` | 116 |
| `search-verified` | 187 |

Living source class distribution:

| class | count |
|---|---:|
| `living-repo` | 82 |
| `living-doc` | 66 |
| `living-spec-or-standard` | 26 |
| `living-project-site` | 2 |
| `living-release-index` | 2 |
| `living-dataset` | 1 |
| `living-guide` | 1 |
| `living-other` | 1 |
| `living-release` | 1 |

One source is explicitly excluded from active evidence:

- `eng-proto-mcp-2026-rc`: future-dated relative to 2026-06-30.

## PL/PR Decision Baseline

`research/pl-pr-core-profile-adapter-matrix.md` contains 31 accepted-for-RFC decisions:

| decision family | count |
|---|---:|
| `PL-*` layer decisions | 10 |
| `PR-*` relation decisions | 21 |

Disposition distribution:

| disposition | count |
|---|---:|
| `core` | 4 |
| `core+profile` | 9 |
| `profile` | 14 |
| `adapter` | 4 |

Lightweight precheck: RFC 0001-0003 plus the PL/PR matrix reference 61 unique `eng-*` / `lit-*` source IDs, and all 61 exist in `research/source-registry.csv`. Full source integrity remains Phase 1B.

## Artifacts To Freeze In Phase 1

### RFC Artifacts

| artifact | freeze role | Phase 1 owner |
|---|---|---|
| `docs/rfcs/0001-ontology-layers.md` | Normative Phase 1 ontology layer disposition and boundary decisions. | Ontology reviewer |
| `docs/rfcs/0002-canonical-schema-contract.md` | Normative structural schema, validation, provenance, trust-boundary, and observable trace constraints. | Schema reviewer |
| `docs/rfcs/0003-statechart-and-protocol-model.md` | Normative protocol/statechart/framework/benchmark adapter boundary decisions. | Protocol/security reviewer |

### Decision Matrix Artifact

| artifact | freeze role | Phase 1 owner |
|---|---|---|
| `research/pl-pr-core-profile-adapter-matrix.md` | Source of truth for all `PL-*` and `PR-*` core/profile/adapter dispositions used by RFC 0001-0003. | Lead integrator |

### Evidence Registry Artifacts

| artifact | freeze role | Phase 1 owner |
|---|---|---|
| `research/source-registry.csv` | Source ID namespace and source status baseline. | Evidence auditor |
| `research/living-source-metadata.csv` | Living source date/version normalization baseline. | Living-source checker |

### Phase 0 Evidence Substrate

| artifact family | freeze role | Phase 1 owner |
|---|---|---|
| `research/source-notes/**` | Read-only evidence substrate for explaining how Phase 0 produced `SC-*`, `PL-*`, `PR-*`, `BD-*`, and `DQ-*` decisions. | Evidence auditor |

The source notes are frozen as provenance context, not as direct schema contracts. RFCs and the PL/PR matrix are the Phase 1 decision surface.

## Layer Concepts In Scope For Freeze

Phase 1 must freeze the disposition of these layer families, not final field names:

| id | freeze decision |
|---|---|
| `PL-00` | Evidence/provenance is core. |
| `PL-01` | Actor taxonomy is core; protocol/security detail is profile-specific. |
| `PL-02` | Capability/resource surfaces are profile-level with protocol/runtime adapter mappings. |
| `PL-03` | Runtime sessions/checkpoints are core anchors; framework specifics are profiles. |
| `PL-04` | Goal/task/action/observation anchors are core; planning/execution detail is profile-specific. |
| `PL-05` | Memory/context is a profile family, not one core field. |
| `PL-06` | Orchestration/delegation is a coordination profile. |
| `PL-07` | Evaluation/benchmark layer remains adapter-facing. |
| `PL-08` | Trust boundary is core; threat models, guardrails, and policies are profiles. |
| `PL-09` | JSON Schema structural contract is core; OWL/SHACL/ShEx semantic constraints are profiles. |

## Relation Concepts In Scope For Freeze

Phase 1 must freeze disposition and ownership for these relation families:

| disposition | relation IDs |
|---|---|
| core | `PR-007`, `PR-020`, `PR-021` plus core observation semantics in `PR-010` |
| core+profile | `PR-010`, `PR-014`, `PR-015`, `PR-019` |
| profile | `PR-001`, `PR-002`, `PR-004`, `PR-005`, `PR-006`, `PR-008`, `PR-009`, `PR-011`, `PR-012`, `PR-016`, `PR-018` |
| adapter | `PR-003`, `PR-013`, `PR-017` |

The critical boundary is ownership, not naming. Exact canonical relation names remain downstream work.

## Boundary Decisions To Preserve

Phase 1 must freeze these separations:

1. MCP tool/resource/prompt surfaces are not A2A remote-agent tasks/messages.
2. Handoff, agents-as-tools, local subagent assignment, and remote delegation are different coordination mechanisms.
3. Runtime/session lifecycle is broader than statechart transitions.
4. Statecharts are a lifecycle/control-flow profile over runtime state, not universal ontology core.
5. Benchmark score, horizon, user simulation, sandbox semantics, and pressure axes remain eval adapter metadata.
6. JSON Schema structural validation is separate from OWL/SHACL/ShEx semantic validation.
7. Observable trace events are allowed; hidden chain-of-thought storage is not required.
8. Trust boundaries are standalone entities/relations and must be referenced by cross-boundary relation attributes.

## Artifacts Explicitly Out Of Scope For Phase 1 Freeze

The following may exist in the repository, but they are not Phase 1 freeze inputs and must not become authoritative until later phases:

| artifact family | reason out of scope |
|---|---|
| `schemas/**` | Phase 3 canonical schema work. |
| `fixtures/**` | Phase 3/5 validation and graph fixture work. |
| `src/**` | Implementation work, not Phase 1 RFC freeze evidence. |
| `e2e/**` and `tests/**` | Verification assets for later implementation phases. |
| `docs/design/**` | Phase 6 design/frontend work. |
| `docs/governance/**` | Phase 8 governance/release work unless explicitly pulled into a later gate. |
| generated Zod/Pydantic/OWL/SHACL/ShEx artifacts | Phase 4 generated profile work. |
| protocol/framework/benchmark adapters | Phase 7 adapter implementation work. |

This matters because the project already contains early implementation scaffolding. Phase 1A treats those files as downstream artifacts, not as evidence that RFC/schema decisions are frozen.

## Phase 1A Non-Goals

- No new ontology model.
- No canonical schema expansion.
- No source expansion.
- No adapter design.
- No frontend design or implementation.
- No final field names.
- No replacement of Phase 0 evidence with implementation assumptions.

## Phase 1A Gate Result

Phase 1A passes because:

- All six required input files exist and were fully read.
- All local Phase 0 source-note artifacts were fully read as evidence context.
- The artifacts that Phase 1 must freeze are identified.
- The artifacts that must remain out of scope are identified.
- The source registry, living metadata, and PL/PR matrix baselines are counted.
- A preliminary source-ID precheck found 0 missing source IDs across RFC 0001-0003 and the PL/PR matrix.

## Handoff To Phase 1B

Phase 1B should perform the formal source integrity gate:

1. Extract every `eng-*` and `lit-*` source ID from RFC 0001-0003 and the PL/PR matrix.
2. Confirm each ID exists in `research/source-registry.csv`.
3. Confirm every engineering/living source used for field-level claims has `normalization_status=normalized`.
4. Confirm `eng-proto-mcp-2026-rc` and any other future-dated source are not active evidence.
5. Confirm no `needs-targeted-check` source is used to support field-level schema decisions.

Recommended next command surface: use `verification-loop` for source-ID and normalization checks, with an Evidence auditor subagent only if the formal check surfaces mismatches.
