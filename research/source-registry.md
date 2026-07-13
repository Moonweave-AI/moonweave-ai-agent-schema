# Source Registry

Date: 2026-07-13
Status: canonical Phase 0C registry, closure-audited and P0 source-claim relevance updated

## Files

| file | role |
|---|---|
| `research/source-registry.csv` | Canonical machine-readable registry generated from the Phase 0B expanded literature and engineering corpora, with targeted Phase 0C closure additions. |
| `research/priority-a-source-queue.csv` | Machine-readable subset of all priority A sources. |
| `research/source-notes/priority-a-deep-read-ledger.md` | Human-readable deep-read ledger for the priority A source spine. |
| `research/source-notes/phase-0c-preparation.md` | Phase 0C preparation summary and next-step boundary. |
| `research/source-notes/phase-0c-synthesis-constraints.md` | Complete Phase 0C synthesis constraints derived from registry and deep-read ledger. |
| `research/source-notes/phase-0c-review-gate.md` | Phase 0C proposal review gate and decision ledger. |
| `research/source-notes/phase-0c-completion.md` | Phase 0C completion report and handoff. |
| `research/source-notes/phase-0c-final-closure-audit.md` | Final coverage, recency, and claim-boundary audit. |
| `research/living-source-metadata.csv` | Date/version normalization manifest for engineering living docs, repos, specs, and official sources. |
| `research/paper-venue-upgrade.csv` | Venue-upgrade manifest for literature rows and strict top-venue counting. |
| `research/pl-pr-core-profile-adapter-matrix.md` | Post-Phase-0 decision matrix for `PL-*` and `PR-*` dispositions. |

## Registry Schema

| column | meaning |
|---|---|
| `id` | Stable source identifier inherited from the Phase 0B corpus row. |
| `corpus` | `literature` or `engineering`. |
| `area` | Source family or microtopic label from Phase 0B. |
| `title` | Normalized title extracted from the Markdown link label. |
| `url` | Source URL extracted from the Markdown link. |
| `year` | Literature year when available; blank for living engineering docs/repos. |
| `source_type` | Controlled source class such as venue, paper type, repo, official docs, spec, standard, or vendor whitepaper. |
| `priority` | A, B, or C review priority. |
| `status` | Phase 0B acquisition status: `fetched`, `search-verified`, or `known-primary`. |
| `why_it_matters` | Concise extraction rationale from the source corpus. |
| `source_file` | Original corpus file for traceability. |

## Current Counts

| metric | count |
|---|---:|
| All registered sources | 373 |
| Literature sources | 160 |
| Engineering sources | 213 |
| Priority A sources | 263 |
| Priority B sources | 105 |
| Priority C sources | 5 |
| Status `fetched` | 51 |
| Status `search-verified` | 187 |
| Status `known-primary` | 116 |
| Status `source-matrix-registered` | 18 |
| Status `future-dated-excluded` | 1 |
| Venue-coded top conference / authority rows | 87 |

The `source-matrix-registered` rows were added during the Phase 1 ontology
system deepening pass to register foundational sources that were already read
or cited in `research/source-matrix.md`,
`research/ai-agent-architecture-standards.md`, and the Phase 0 extraction
notes, but were missing from the machine-readable registry.

The five FIBO rows were added during the FIBO-aligned Phase 1 ontology
replacement pass. They cover the FIBO Viewer, `edmcouncil/fibo` repository,
ontology guide, contribution/maturity guide, and top-level metadata RDF source.

Seven additional cross-domain ontology pattern rows were added during the
agent-plane correction pass. They cover Gene Ontology, CIDOC CRM, Palantir
Ontology, DBpedia, and FOAF as structural references only; their subject matter
is not imported into the agent-system ontology.

Microsoft Fabric IQ Ontology and Skan Agentic Ontology of Work were added for
the unified-graph upgrade. Microsoft is recorded as an evolving official
product document; Skan is recorded as `vendor-whitepaper`, not as a standard or
peer-reviewed paper.

Ten targeted primary sources were added for the P0 source-claim relevance
correction: POSIX command semantics, OpenAI instruction governance, NIST ABAC,
FIRST CVSS v4, OPA policy decisions, MCP tasks and transports, RFC 9530 digest
fields, RFC 6455 WebSocket, and LangGraph interrupts. These rows ground domain
facts; Moonweave-specific predicate names, endpoint granularity, and graph
direction remain documented design mappings rather than source claims.

## Controlled Source Types

`source_type` values are closed by the source-registry validator. In addition
to the existing venue, paper, preprint, repository, documentation,
specification, standard, guidance, site, viewer, and source-code classes, the
registry defines:

| value | definition |
|---|---|
| `vendor-whitepaper` | A whitepaper published by a product vendor that contains technical or methodological claims but has no independent standards-body or peer-review endorsement. |

## Phase 0C Preparation Boundary

This registry is a source-management artifact, not an ontology, schema, or implementation artifact.

Do not use it to infer layers, relation names, or canonical fields directly. Phase 0C synthesis is closed in `research/source-notes/phase-0c-completion.md` and `research/source-notes/phase-0c-final-closure-audit.md`. Post-Phase-0C work must:

- Normalize venue/date/source-status metadata.
- Resolve duplicate or near-duplicate source semantics.
- Promote only evidence-backed claims from the deep-read ledger.
- Keep security, protocol, benchmark, and validation evidence separate until their constraints are compared.
