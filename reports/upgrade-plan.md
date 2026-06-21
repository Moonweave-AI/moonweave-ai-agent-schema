# agent-schema v2 Upgrade Plan

## Execution Order

1. Research: source catalog, evidence matrix, source matrix report, and coverage gates.
2. UI design: workbench IA, interactions, visual rules, responsive behavior, and preview assets.
3. Implementation: schema, ontology views, validators, visualization workbench, docs, screenshots.

## Data Model Upgrades

- Add `SourceClaim` and `BenchmarkRef` to the public schema.
- Extend `EvidenceRef` with source authority, verification, venue, year, DOI/arXiv/repo/url, claim scope, and confidence.
- Extend `GraphView` with audience, notation, layout engine, source filters, export targets, and acceptance queries.
- Keep current ontology YAML compatible while using new gates to enforce evidence quality over time.

## Workbench Upgrade

The visualization becomes a static evidence workbench:

- Left rail: views, themes, source tiers, and coverage filters.
- Center: existing D3 ontology graph with retained hierarchy and relation detail behavior.
- Right audit rail: source claims, linked ontology nodes/edges, gaps, risks, and export targets.
- Bottom: coverage summary, timeline, and gate status.

## Validation

The old six gates remain mandatory. New gates cover source catalog completeness, evidence coverage, theme coverage, diagram exports, encoding, and preview assets.

