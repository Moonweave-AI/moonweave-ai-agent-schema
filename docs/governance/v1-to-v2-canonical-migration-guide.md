# Moonweave Agent Ontology v1 → v2 migration guide

Status: accepted
Effective date: 2026-07-13
Applies to: canonical JSON consumers, generators, tests, exports, and Explorer integrations

Release applicability: this guide governs the v2 candidate immediately, but
consumer cutover is effective only when the repository-root canonical artifact
is atomically published with `artifact_metadata.release_channel=release` and
`releasable=true`. A candidate marked `releasable=false` is not a release.

## Outcome

v2 retains the eight Domains and 41 Modules, but replaces the v1 parallel
collections with one canonical graph. Domain semantics are editable only in
`ontology/source/**`. The repository-level canonical JSON, Markdown, root JSON
Schema, TypeScript types, source index, definition ledger, Concept payload
Schema, and fixtures are generated outputs.

The Explorer remains one page with one graph and one inline node/relation
characteristics table. Schema fields, examples, instances, sources, mappings,
constraints, and case fragments explain canonical nodes or relations; they are
not additional graph nodes or navigation products.

## Consumer field mapping

| v1 field or behavior | v2 location | Required consumer change |
|---|---|---|
| `terms` and `classes` copies | `classes` | Read the single canonical Concept array. |
| `relations` and `object_properties` copies | `relations` | Read each assertion once by relation ID; derive inverse reading from the same edge. |
| `data_properties` | `classes[].structure.fields` | Resolve fields through their owning Concept. |
| top-level `individuals` | `examples[kind=instance]`, `fields[].allowed_values`, or node governance metadata | Do not construct an ABox navigation tree. |
| top-level `axioms` | root `global_constraints`, Concept/Relation constraints, or `hygiene_gates` | Validate the constraint at its canonical owner. |
| top-level `adapter_mappings` | Adapter Concept `external_mappings` | Build reverse indexes at runtime; do not persist a second copy. |
| Plane `module_ids` / `term_ids` | ownership derived from `modules[].plane_id` and `classes[].module_id` | Build an index rather than trusting duplicate membership arrays. |
| Module `class_ids` | `classes[].module_id` | Derive Module contents. |
| flat Class directory | Concept `is_a` relations plus `primary_parent_relation_id` | Recursively traverse any depth; render multiple parents once using the primary directory path. |
| GraphView artifact and hand-written frontend facts | canonical JSON + generated source index | Remove `src/data/ontology.ts` and other hand-authored semantic projections. |
| separate Schema/Instance/Evidence/Adapter views | one characteristics table | Keep annotations inline on the selected node or relation. |

The v2 root Schema uses `additionalProperties: false`; an old/new mixed object
is intentionally invalid. There is no compatibility field named
`migration_legacy` in a published artifact.

## Identity and relation rules

- Stable legacy IDs are retained when the reviewed concept remains valid.
- Every one of the 572 legacy Concept IDs has exactly one accepted disposition
  in `research/ontology-concept-hierarchy-migration-ledger.csv`.
- A canonical `is_a` assertion is always `source=child`, `target=parent`.
- `primary_parent_relation_id` selects directory placement; additional parents
  remain first-class edges and do not duplicate the Concept.
- A semantic assertion is stored only in the source Concept's Module file.
- Relation uniqueness is enforced both by ID and normalized fact
  `(source_id,predicate,target_id,conditions,temporal_scope)`.
- Cross-Domain semantic relations carry `boundary_context`.

## Source-first commands

```bash
# Audit frozen-v1 lineage and every accepted migration target without writing.
npm run ontology:legacy:audit

# Build an unpublished candidate under build/agent-ontology-candidate/.
npm run ontology:build

# Publish all reviewed generated artifacts at their repository paths.
npm run ontology:release

# Rebuild in a temporary directory and byte-compare every published output.
npm run ontology:check-generated

# Run all ontology data, source, graph, and generation contracts.
npm run ontology:validate
```

`ontology:migrate` and `ontology:migrate:check` are compatibility names for the
same read-only audit; they no longer regenerate `ontology/source/**`. The
release pipeline invokes that audit directly before deterministic candidate
generation. It never imports `apply-reviewed-ontology-migration.mjs` or an
`ontology-reviewed-*` module.

The old reviewed transformation code is retained only to make the original
cutover reproducible during an explicitly approved recovery. It refuses a
default invocation. `npm run ontology:legacy:replay` supplies the required
`--legacy-replay` capability and can overwrite source files, so it is not a
normal development, CI, build, or release command.

`npm run ontology:expand` is a deprecated compatibility alias. It prints a
warning and delegates to the v2 source-first release builder; it no longer
reads or incrementally patches the published canonical JSON.

## Frontend state and URL migration

v1 hashes containing only a selected entity are not the v2 persistence
contract. v2 stores both graph context and focus:

```text
#root=<encoded-entity-ref>&focus=node:<encoded-id>
#root=<encoded-entity-ref>&focus=relation:<encoded-id>
```

Directory or breadcrumb navigation changes graph root and focused entity.
Selecting a graph node changes focus only; explicit expansion changes visible
topology. Selecting an edge presents that relation in the same table. A leaf
Concept continues to show its child-to-parent `is_a` edge.

## Audit and rollback

The immutable v1 inputs and SHA-256 manifest are under
`ontology/migration/legacy-v1/frozen-release/`. Typed migration ledgers and the
2,881-record disposition manifest are audit artifacts only; neither the
builder nor the Explorer reads them after cutover.

`ontology/migration/legacy-v1/domain-decision-convergence.json` records the
small set of accepted decision facts whose current form uses a more precise
Relation or an explicit decomposition. It is lineage metadata, not a second
editable ontology: every mapped target must resolve to a Relation owned by
`ontology/source/**`, and the audit rejects missing, unused, or unresolved
mappings.

Rollback means reverting the atomic v2 release commit, not editing generated
JSON or restoring selected v1 collections into a v2 object. Before release,
run contract tests, source/ledger validation, deterministic generation,
TypeScript build, unit/integration/E2E tests, coverage, visual regression, and
`npm run ontology:check-generated`.
