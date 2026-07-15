# Source And Schema Governance

Status: accepted v3
Created: 2026-06-30

## Source Policy

All ontology, schema, graph, profile, and adapter artifacts must cite source IDs from `research/source-registry.csv`.

Engineering and living sources used for field-level schema or adapter claims must have a matching row in `research/living-source-metadata.csv` with `normalization_status=normalized`.

Future-dated sources are excluded from active evidence until the stated date has passed and the source is rechecked.

Source identity is not sufficient evidence by itself. Every claim must state the
specific proposition and locator that the cited material supports. Pattern and
ontology-engineering references may support naming, modularization, annotation,
or publication practice, but they must not be reused as evidence for an Agent
domain fact. In particular, the FIBO Ontology Guide is restricted to explicit
ontology-engineering constraints; protocol, framework, mapping, statechart, and
validation claims must cite their owning specifications or official documents.
Moonweave-only class boundaries and predicates are recorded as reviewed design
inferences, never presented as statements made by an external source.

## Recheck Cadence

| source class | cadence | required action |
|---|---|---|
| official protocol spec | before any adapter field change | capture version/date and update metadata |
| official framework docs | before profile or adapter release | capture doc date, package version, or repository commit |
| GitHub repo | before release | capture default branch commit |
| release note/tag | before release | capture tag/version and date |
| benchmark site/repo | before eval adapter release | capture version, commit, or publication date |
| papers/static standards | when venue/status changes matter | update venue upgrade ledger |

## Schema Versioning

Use semantic versioning for public schema families:

- Patch: editorial metadata, examples, or non-normative docs.
- Minor: additive optional fields, new profile exports, or new adapter fixture families.
- Major: renamed fields, removed fields, changed relation semantics, required new fields, or trust-boundary rule changes.

Every public schema change must include:

1. Version note.
2. Source IDs.
3. Constraint/proposal IDs when derived from Phase 0/1 evidence.
4. Valid fixture update.
5. Invalid fixture update if behavior changes.

## Structural And Semantic Validation

JSON Schema Draft 2020-12 is the canonical structural baseline.

Zod and Pydantic are generated profiles. OWL/RDF, SHACL, and ShEx are semantic profiles. Semantic validation must not be treated as a JSON object validator unless bridged by explicit profile metadata.

Any unrepresentable profile behavior must emit `ConversionWarning` or `ConversionError`.

## Trust Boundary Governance

Every relation that crosses authority, remote execution, tool output, memory retrieval, resource access, or protocol metadata boundaries must reference a `TrustBoundary` artifact through `trust_boundary_id`.

A2A remote delegation, MCP capability surfaces, handoffs, agents-as-tools, and local subagent assignment must remain distinguishable relations.

## Single Graph Governance

- A source claim is attached directly to the node, relation, field, constraint, or example it supports.
- Plane-wide sources must not be inherited as direct class evidence.
- Generated schemas and fixtures must carry the canonical node/relation IDs they were generated from.
- Product TypeScript imports the generated canonical types; a second hand-written
  canonical interface hierarchy is prohibited.
- No hand-written GraphView may participate in release validation.
- UI navigation surfaces are not ontology products and cannot own semantic truth.

## Single Editable Semantic Source

- `ontology/source/**` is the only editable owner of current Domain, Module,
  Concept, Relation, field, constraint, example, mapping, and case-path facts.
- Repository-root canonical JSON/Markdown, generated Schemas and types,
  fixtures, source indexes, and Explorer projections are deterministic release
  outputs. They must never be used to reconstruct or overwrite the source tree.
- `npm run ontology:legacy:audit` is a read-only lineage gate. It validates the
  independently anchored frozen-v1 release, the 2,881-record manifest and
  accepted disposition set, all 572 reviewed Concept decisions, and resolution
  of historical targets against the current source tree.
- `scripts/apply-reviewed-ontology-migration.mjs` and
  `scripts/lib/ontology-reviewed-*.mjs` are frozen historical replay code. They
  are excluded from daily build and release. The replay script refuses to run
  without `--legacy-replay`; using that exceptional flag requires an explicit
  migration-recovery review because it may replace editable source files.
- A renamed, refined, merged, or decomposed decision fact must have an accepted
  convergence entry under `ontology/migration/legacy-v1/`. The audit resolves
  that entry to current source Relation IDs instead of creating synonym edges.

## Candidate And Release Identity

- `artifact_metadata.release_channel=candidate` or `releasable=false` always
  means unpublished, regardless of the artifact's internal review `status`.
- Candidate metrics are read only from the candidate's generated
  `ontology_metrics`; they must not be copied into the published root or
  presented as release counts before cutover.
- A formal release requires one atomic replacement of canonical JSON,
  Markdown, root Schema, generated TypeScript types, source index, fixtures,
  tests, and the Explorer consumer.
- `npm run ontology:release` materializes that formal artifact tree only after
  portable gates pass: dependency policy/audit, ontology security, referenced
  links, deterministic candidates, isolated validation, coverage, typecheck,
  production build, browser contracts, and a final live-source candidate
  comparison that closes the validation-to-publication race window.
- Repository publication is established only when the materialized root carries
  `release_channel=release` and `releasable=true`, the runner-specific visual
  gate below passes, and the artifacts plus reviewed baselines are committed
  together. A local candidate or uncommitted formal tree is never publication
  evidence.

## Release Gate

A release can be cut only when:

- The read-only frozen-v1 lineage audit passes against the current source tree.
- RFC status and source gates pass.
- Ajv validates valid fixtures and rejects invalid fixtures.
- Typecheck, unit tests, build, and E2E pass.
- Frontend canvas is non-empty on desktop and mobile.
- Playwright visual comparison passes against the reviewed 1360 × 900 desktop
  and 390 × 844 mobile baselines in `docs/visual-baselines/unified-v3/`.
- No hidden chain-of-thought field appears in schema, fixtures, or rendered UI.
- No `needs-targeted-check` source is used for accepted field-level schema claims.
- Future-dated sources are not active evidence.
- Canonical JSON validates against its actual generated Schema.
- All published Concepts have a path from their Module entry through derived ownership and a reviewed taxonomy or structural backbone; the backbone may be arbitrarily deep and must be acyclic.
- Accepted Module membership is discovered from source and checked bidirectionally against `research/ontology-module-boundary-v3.csv`; no current module count is a builder constant.
- Site publication is complete only when `dist/build-manifest.json` and the deployed runtime DOM identify the deployment commit and bundled ontology identity.
- All `is_a` edges pass the seven-question review in RFC 0005.
- Schema, example, source, constraint, and case annotations never enter graph elements.
- The single-page/no-competing-tab E2E suite passes.
