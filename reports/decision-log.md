# agent-schema Upgrade Decision Log

## Locked Decisions

1. Research precedes UI design, and UI design precedes ontology/frontend implementation.
2. Normative ontology evidence must come from peer-reviewed papers, formal standards, official protocol specs, or official SDK/framework docs.
3. Candidate, placeholder, anonymous, or unverifiable sources cannot support normative ontology claims.
4. The visualization must remain static and direct-open from `visualization/index.html`.
5. Existing D3 graph behavior and old gates remain protected while the new evidence workbench layer is added.
6. Source catalog and evidence matrix are the durable truth for what was read, internalized, mapped, or excluded.
7. Reports are part of the product, not temporary notes; every long-running handoff must update context, decisions, and progress.
8. Preview assets are generated artifacts and must be verified as non-empty image files.
9. The default visualization route is `Evidence Atlas`: `Source -> Claim -> Ontology Object -> Gap / Release Gate`.
10. The old D3 full ontology canvas is preserved only as the secondary `Ontology Graph Explorer` drill-down route.

## Source Tier Policy

- Tier A: peer-reviewed top venue paper, formal standard, official protocol specification, or official SDK/framework documentation.
- Tier B: high-quality arXiv/preprint source with official code, strong adoption, or direct relevance to a current frontier topic.
- Tier C: blog, tutorial, community example, or non-normative exemplar.

## UI Policy

- Workbench, not landing page.
- Dense but scannable operational layout.
- No decorative hero, no single-hue theme, no nested card walls.
- Homepage is an evidence audit board, not a full ontology graph.
- The first screen must expose Sources, Claims, Ontology Objects, and Gaps / Gates as the primary objects.
- The graph canvas is secondary and must not appear on the default route.
