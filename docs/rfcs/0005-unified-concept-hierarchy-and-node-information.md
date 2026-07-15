# RFC 0005: Unified Concept Hierarchy And Node Information

Status: accepted
Created: 2026-07-13
Accepted: 2026-07-13
Supersedes presentation implications in RFC 0001/0002/0004
Depends on:

- `docs/design/agent-ontology-unified-graph-upgrade-plan-zh.md`
- `docs/rfcs/0001-ontology-layers.md`
- `docs/rfcs/0002-canonical-schema-contract.md`
- `docs/rfcs/0004-phase-1-schema-workplan.md`
- `research/agent-ontology-hierarchical-closure-audit-zh.md`

## Purpose

Define one canonical, reviewable concept graph for Moonweave Agent Ontology while preserving the existing FIBO-like browse model. This RFC turns the approved product direction into an architecture boundary: the graph expresses domain and concept logic, while definitions, structures, constraints, examples, source claims, mappings, and governance explain the corresponding node or relation in place.

The resulting user-facing hierarchy is:

```text
Agent Ontology
└─ Domain
   └─ Module
      └─ Concept
         └─ more-specific Concept
```

`Concept -> Concept` hierarchy edges answer only “is the child a kind of the parent?”. Schema records, instances, sources, examples, cases, pages, and governance records cannot be children in that hierarchy merely because they describe a concept.

## Decisions

### Decision 1: retain eight Domains and `adapter-plane`

The existing eight first-level Domains remain the canonical first-level presentation. `adapter-plane` remains a peer of the other seven Domains. Core/Profile/Adapter annotations may describe ownership or applicability but cannot replace these Domains as navigation roots.

### Decision 2: Domain -> Module -> Concept is the sole containment/taxonomy navigation spine

There is one Explorer route and one graph surface. Domain and Module containment establishes browse scope. Recursive `is_a` relations establish the general-to-specific hierarchy between Concepts. The same graph may display and focus non-hierarchical semantic relations without turning them into a second navigation tree. No TBox, ABox, Schema, Instance, Evidence, Adapter, or Case navigation tree is introduced.

### Decision 3: Concept -> Concept `is_a` expresses general-to-specific logic

`is_a` is stored from the more-specific Concept to the more-general Concept. Every accepted non-root Concept has at least one reviewed parent. A Concept may have multiple valid parents in a DAG, but exactly one parent relation is marked primary for deterministic tree placement. Layout convenience is not evidence for a semantic parent.

Every proposed `is_a` relation must pass all seven review questions:

1. Can “child is a kind of parent” be stated without changing the meaning?
2. Do all child instances satisfy the parent's defining conditions?
3. Does the child add a meaningful specialization rather than a workflow step?
4. Are the endpoints both canonical Concepts?
5. Is the relation distinct from composition, causality, temporality, information flow, governance, or mapping?
6. Is the primary-parent choice explicit when multiple parents exist?
7. Are the decision, counterexample, reviewer, and source claims recorded?

### Decision 4: schema/instance/example/source/governance are node/edge information

The following are nested information on the canonical node or relation they explain:

- localized labels and definitions;
- purpose, necessity, inclusion, and exclusion boundaries;
- structural fields and semantic constraints;
- positive, negative, boundary, and instance examples;
- source claims with support statement and locator;
- case-path participation;
- external mappings, status, version, change, and deprecation metadata.

They never become annotation-shadow GraphNodes or a parallel user-facing graph. A domain concept such as `SchemaArtifact` remains eligible as a normal Concept only when it has independent identity and participates in the Agent system as a produced, consumed, governed, or versioned artifact.

### Decision 5: machine artifacts are generated, not parallel products

JSON Schema, TypeScript types, source indexes, Markdown, fixtures, and optional OWL/SHACL/ShEx exports are reproducible projections. Generated artifacts carry the canonical node/relation IDs from which they derive, are read-only, and do not own domain facts. The artifact meta-schema is an independently reviewed build contract; it is not an ontology navigation surface.

### Decision 6: one canonical graph and one editable source

Editable ontology facts live under `ontology/source/**`, split physically by Domain and Module for reviewability. A deterministic builder validates, resolves, and emits one canonical `ontology/agent-ontology.json`. Neither that generated file nor a hand-written frontend GraphView may serve as an editable truth source.

During migration, the released v1 canonical is a frozen read-only baseline and `ontology/migration/legacy-v1/**` is migration-only evidence. Candidate output remains unpublished until every legacy record has exactly one accepted destination and the complete new shape can replace v1 atomically.

### Decision 7: main cases highlight existing graph paths

A case stores an ordered sequence of existing canonical node and relation references plus explanatory snippets. It may focus and highlight those paths, but it cannot copy case-specific Goal, Plan, ToolCall, Result, or other shadow nodes into the ontology graph.

## Canonical Presentation Contract

The current single-page structure remains:

```text
header
left hierarchy directory
breadcrumb and selected definition
one canonical graph
one inline node/relation characteristics table
```

Selecting a node or relation changes focus and the inline characteristics table. Selection does not implicitly change the graph root. Only an explicit expand action changes graph topology. URL hashes may share root and focus state without introducing a router.

## Canonical Data Contract

The published canonical retains only the unique collections needed to express the graph:

- `planes`: eight Domains with their own information;
- `modules`: source-discovered, boundary-ledger-approved Module entries with their own information (47 in the v3 release, never a builder constant);
- `classes`: canonical Concepts with nested information;
- `relations`: unique hierarchy and semantic relations with nested contracts;
- artifact metadata, cases, metrics, and generated provenance needed for validation.

Legacy duplicate or detached top-level collections such as `terms`, `object_properties`, `data_properties`, `individuals`, `axioms`, and `adapter_mappings` do not survive the atomic cutover. Their valid semantics are migrated into canonical Concepts, Relations, fields, constraints, examples, cases, or mappings; obsolete records retain an auditable migration decision.

## Non-Goals

- Replacing the eight Domains with upper-category, Core/Profile/Adapter, or TBox/ABox roots.
- Creating a second graph for schema, examples, instances, evidence, governance, adapters, or cases.
- Inferring taxonomy from name similarity, current Module membership, or layout needs.
- Requiring private chain-of-thought; only observable plans, actions, decisions, summaries, state changes, results, and evidence are modeled.
- Making generated schemas or UI ViewModels editable ontology products.

## Governance And Release Consequences

- Direct source evidence attaches to the exact node, relation, field, constraint, or example it supports; Plane-wide evidence cannot silently become class evidence.
- All 572 legacy Concepts and every legacy relation, field, individual, axiom, adapter mapping, and stale definition require an exactly-once migration decision.
- The build fails on unresolved endpoints, invalid ownership, missing paths, `is_a` cycles, multiple primary parents, annotation-shadow graph elements, and non-reproducible generated output.
- The UI consumes the generated canonical through a deterministic index and ViewModel only.
- A clean build must be byte-identical and leave the working tree unchanged.

## Normative Contract Closure

This section closes data-shape and release ambiguities discovered during the architecture review. For editable source, canonical collections, Explorer presentation, and migration/release behavior, this RFC supersedes conflicting implications in RFC 0002 and RFC 0004. RFC 0001 remains authoritative for evidence and ownership boundaries, with Core/Profile/Adapter interpreted only as annotations.

### Source and canonical wrappers

The independently reviewed Draft 2020-12 artifact contract defines three closed shapes:

```text
$defs.productSource
$defs.moduleSource
$defs.canonicalArtifact
```

The product source is exactly:

```json
{
  "source_kind": "agent-ontology-product",
  "contract_version": "1.0.0",
  "product": {},
  "planes": [],
  "global_constraints": [],
  "case_paths": [],
  "hygiene_gates": []
}
```

Each Module source is exactly:

```json
{
  "source_kind": "agent-ontology-module",
  "contract_version": "1.0.0",
  "module": {},
  "classes": [],
  "relations": []
}
```

The canonical artifact is the deterministic merge with root information plus `planes/modules/classes/relations`. A Module wrapper is never validated by pretending it is a canonical root.

### Artifact metadata and deterministic dates

Canonical `artifact_metadata` is closed and contains:

```json
{
  "artifact_kind": "canonical-agent-ontology",
  "contract_version": "1.0.0",
  "canonical_version": "https://moonweave.ai/ontology/agent-system/2.0.0/",
  "release_channel": "candidate",
  "releasable": false,
  "generated": true,
  "do_not_edit": true,
  "generated_from": ["ontology/source/**"],
  "generator_version": "1.0.0",
  "source_tree_sha256": "sha256"
}
```

`release_channel` is `candidate|release`. Wall-clock time and Git HEAD are not implicit build inputs. Dates come from the product source or an explicit `SOURCE_DATE_EPOCH` included in the source fingerprint.

### Lifecycle and review records

Plane, Module, Concept, and Relation lifecycle is `draft|review|accepted|deprecated`. Each has a closed review record. v3 additionally records Module ownership boundaries, Concept root and sibling differentia, CQ ownership, and Relation layout roles without creating additional graph facts:

```json
{
  "review_status": "accepted",
  "reviewers": [{
    "reviewer_id": "stable-id",
    "reviewer_role": "architecture|schema|ontology|domain",
    "reviewer_kind": "human|automated-agent",
    "reviewed_on": "YYYY-MM-DD",
    "decision_note": {"zh": "...", "en": "...", "ja": "..."}
  }]
}
```

Bootstrap output is always `draft`. An empty or anonymous reviewer cannot satisfy release. Accepting this RFC approves the architecture contract only; it does not approve any of the 572 legacy semantic decisions.

### Plane, Module, and competency-question closure

`localizedText` contains non-empty `zh/en/ja` and no other keys. Module interaction applicability is closed as:

```json
{
  "applicability": "operational|descriptive|mixed",
  "facets": {
    "input": {"applicable": true, "not_applicable_reason": null},
    "output": {"applicable": true, "not_applicable_reason": null},
    "failure": {"applicable": true, "not_applicable_reason": null},
    "recovery": {"applicable": true, "not_applicable_reason": null}
  },
  "review": {}
}
```

Taxonomy applicability is `specialization|flat-root-exception`, with localized `not_applicable_reason|null` and the same review shape. Facets never copy Concept IDs. A competency question has `id`, trilingual `questions`, `query`, `expected_assertion`, positive and counterexample ID arrays, source claims, and review; every reference resolves.

### Concept information closure

Controlled values contain `id/value/labels/definitions/status/source_claims`. Required-relation constraints contain `id/direction/predicate/target_concept_id/cardinality/explanations/source_claims`. External mappings contain `id/system/external_identifier/mapping_kind/conversion_note/status/source_claims`.

Identity keys resolve to fields on their owner. `required=true` implies `cardinality.min >= 1`. Draft Concepts may have `semantic_kind:null`, which the coverage report exposes; builders cannot infer it from legacy kind or labels. Accepted Concepts use the controlled semantic-kind enumeration. Deprecated Concepts require `deprecated_in` plus replacements or a trilingual deprecation reason.

### Relation closure

Relation endpoints resolve only to `classes[]`. Its cardinality, when applicable, is:

```json
{
  "source": {"min": 0, "max": null},
  "target": {"min": 1, "max": 1}
}
```

For each source instance the target side constrains how many target instances may relate to it; for each target instance the source side constrains how many source instances may relate to it. An outer `cardinality:null` means not applicable and requires a trilingual reason; an inner `max:null` means an unknown/unbounded maximum.

Cross-boundary relations use:

```json
{
  "trust_boundary_concept_id": "TrustBoundary",
  "authority_basis": {"zh": "...", "en": "...", "ja": "..."},
  "protocol_or_resource_context": {"zh": "...", "en": "...", "ja": "..."}
}
```

Non-cross-boundary relations use `boundary_context:null`. Conditions reuse the closed constraint shape. `distinct_fact_rationale` is `localizedText|null`; it is mandatory only when a second directional assertion cannot be derived wholly from an existing one. Accepted Relations require a definition, direct source claim, positive and counterexample/boundary information, and accepted review.

### Examples, cases, gates, and metrics

Example and Relation IDs are globally unique; field IDs are unique within their Concept. A `case-fragment` requires `scenario_id`. Case steps contain only `order`, `case_fragment_example_id`, and `traversal_relation_id`; the relation connects adjacent fragment owners. Global constraints reuse the constraint shape. Hygiene gates contain `id/labels/descriptions/severity/check_kind/expression/status/source_claims`. Builder-derived metrics are non-negative integers. Candidate legacy-remaining metrics may be non-zero; release values are all zero.

### Root and multiple-inheritance semantics

Plane, Module, and Concept IDs are globally unique across node collections. A Module root Concept belongs to that Module and emits no valid `is_a` parent relation. All non-deprecated `is_a` relations are acyclic. Every accepted non-root Concept has an accepted parent; each multiple-inheritance Concept names exactly one accepted outgoing `is_a` as its primary parent. A cross-Module `is_a` is owned by the child/source Module file. The builder rejects duplicate relation IDs and duplicate normalized fact keys.

### Candidate, release, and atomic cutover

Unpublished output is fixed at:

```text
build/agent-ontology-candidate/
  ontology/agent-ontology.json
  ontology/agent-ontology.md
  schemas/agent-ontology.schema.json
  src/lib/canonical-ontology-types.ts
  src/generated/source-index.json
```

The migration ledger is audit input only and never enters canonical or UI. Candidate builds may expose draft coverage gaps but cannot fill them with inferred kinds, taxonomy, examples, or source claims. Release requires accepted exactly-once decisions for every legacy collection, zero unresolved/legacy-remaining metrics, accepted or validly deprecated active records, all schema/taxonomy/information/relation/generator/UI/E2E gates, and no inferred semantics.

Release first builds and validates in a temporary directory. Only after every gate passes may one Git change replace canonical JSON/Markdown, root Schema, types/index, fixtures/tests, and UI consumer together. Failure cannot touch published files; old/new shapes cannot coexist in a published artifact.

## Acceptance Criteria

This RFC is accepted only when the invariants in sections 1 and 17 of `docs/design/agent-ontology-unified-graph-upgrade-plan-zh.md` are treated as normative release gates. In particular:

- all eight Domains and every boundary-ledger-approved Module retain canonical paths;
- every accepted Concept is a reviewed root or has a reviewed taxonomic/structural backbone parent, with no cycles or unresolved endpoints; `primary_parent_relation_id` remains reserved for strict `is_a`;
- every applicable node and relation carries the required localized definition, boundary, example, source, and contract information;
- schema/example/source/constraint/case annotations create zero GraphNodes;
- one Explorer route, one graph surface, and one inline characteristics table pass desktop, mobile, keyboard, and reduced-motion verification;
- canonical JSON validates against its actual generated root Schema;
- all legacy collections have accepted migration decisions before atomic cutover;
- generated artifacts are reproducible and no hand-written GraphView participates in release validation.

## Architecture Review Record

- Review date: 2026-07-13
- Reviewer: `codex-rfc-contract-architect`
- Role/kind: architecture / automated-agent
- Decision: accepted after the normative contract closure and RFC 0001/0002/0004 conflict corrections above.
- Product authority: the user's approved unified-graph feedback and explicit instruction to implement the upgrade plan.

Large-scale rearrangement of the 572 Concepts may proceed only as individually reviewed migration decisions under this contract; RFC acceptance itself does not accept a parent, kind, example, or source claim.
