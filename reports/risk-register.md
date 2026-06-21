# agent-schema Upgrade Risk Register

| Risk | Impact | Mitigation | Status |
| --- | --- | --- | --- |
| Research coverage is overstated | Ontology claims become unverifiable | Source catalog, evidence matrix, theme gate, venue coverage gate, explicit exclusion notes | Mitigated |
| Placeholder or anonymous papers leak into normative evidence | Invalid backbone decisions | Source catalog and evidence coverage gates reject unverifiable normative evidence | Mitigated |
| Long task loses context | Repeated or contradictory changes | Worklog, handoff, decision log, progress board | Mitigated |
| UI rewrite breaks direct-open graph | Existing value regresses | Existing D3 graph preserved; workbench data is embedded in single-file HTML | Mitigated |
| Chinese/UTF-8 text regresses | Docs and visualization become unreadable | Encoding gate and bilingual detail checks | Mitigated |
| Preview images are missing or stale | Plan lacks concrete visual proof | Preview and browser visual regression gates require static and browser-captured PNG assets | Mitigated |
| New gates are too weak | False sense of completion | Venue and evidence-workbench gates now compare YAML source data with release artifacts | Mitigated |
| Exhaustive venue crawl is incomplete | Research phase may be mistaken for total closure | `venue-coverage.yaml` records included/excluded decisions for all required venues/years; future proceedings remain a maintenance task | Residual |
| Workbench panel is not yet data-bound to live evidence matrix | UI may show static summary rather than full claim exploration | `evidence-data` embeds source/claim/gap indexes and UI binds filters, lists, claim highlights, and node evidence backreferences | Mitigated |
| Browser screenshot tooling depends on local Chromium availability | Screenshot gate can fail on machines without Edge/Chrome/Chromium | Gate supports `BROWSER_BIN` override and found Edge on the release machine | Mitigated |
| Old ontology graph returns as default homepage | The first screen becomes an unreadable graph thumbnail again | `Evidence Atlas` is the default route; `check-homepage-redesign.mjs` blocks default graph regressions | Mitigated |
| Workbench view model is incomplete | Routes become decorative instead of auditable | `check-workbench-view-model.mjs` verifies coverage matrix, evidence flows, object support index, route legends, and acceptance queries | Mitigated |
| Mobile workbench content overflows horizontally | 390px review cannot audit source-to-gap path | Browser regression screenshot covers mobile Evidence Atlas; CSS constrains all mobile route panes to a single-column audit flow | Mitigated |
