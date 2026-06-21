# agent-schema Upgrade Risk Register

| Risk | Impact | Mitigation | Status |
| --- | --- | --- | --- |
| Research coverage is overstated | Ontology claims become unverifiable | Source catalog, evidence matrix, theme gate, explicit gap notes | Active |
| Placeholder or anonymous papers leak into normative evidence | Invalid backbone decisions | Source catalog gate rejects candidate normative evidence | Active |
| Long task loses context | Repeated or contradictory changes | Worklog, handoff, decision log, progress board | Active |
| UI rewrite breaks direct-open graph | Existing value regresses | Preserve old D3 graph and add workbench layer incrementally | Active |
| Chinese/UTF-8 text regresses | Docs and visualization become unreadable | Encoding gate and bilingual detail checks | Active |
| Preview images are missing or stale | Plan lacks concrete visual proof | Preview image gate and generated `reports/previews/*.png` | Active |
| New gates are too weak | False sense of completion | Keep gates strict on required fields and source/theme coverage | Active |
| Exhaustive venue crawl is incomplete | Research phase may be mistaken for total closure | Keep `gap.venue_exhaustive_index` in evidence matrix and leave progress item open | Active |
| Workbench panel is not yet data-bound to live evidence matrix | UI may show static summary rather than full claim exploration | Next frontend batch should load compact evidence data and bind source/node interactions | Active |
