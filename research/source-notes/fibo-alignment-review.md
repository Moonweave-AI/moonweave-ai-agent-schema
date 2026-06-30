# FIBO Alignment Review For Agent Ontology

Date: 2026-06-30
Status: complete
Canonical output: `ontology/agent-ontology.md`, `ontology/agent-ontology.json`
Current scope: artifact governance reference only

## Sources Read

| source id | source | use |
|---|---|---|
| `eng-ont-fibo-viewer` | FIBO Viewer, `https://spec.edmcouncil.org/fibo/ontology` | Publication and navigation reference for a production ontology viewer. |
| `eng-ont-fibo-repo` | `edmcouncil/fibo`, cloned at `fee10a4ebe807f647565f7aa3da8968423826dd1` | Repository structure, domain/module layout, RDF/XML source format, catalog, metadata files, and hygiene tests. |
| `eng-ont-fibo-ontology-guide` | `ONTOLOGY_GUIDE.md` | Header metadata, IRI, naming, label, definition, annotation, and hygiene-test requirements. |
| `eng-ont-fibo-contributing` | `CONTRIBUTING.md` | Source/product separation, maturity levels, release process, and contribution workflow. |
| `eng-ont-fibo-metadata` | `MetadataFIBO.rdf` | Top-level specification metadata, domain membership, imports, version IRI, and annotation pattern. |

Additional local FIBO files inspected:

- `AboutFIBOProd.rdf`
- `catalog-v001.xml`
- `FND/MetadataFND.rdf`
- `FND/AgentsAndPeople/Agents.rdf`
- `FND/GoalsAndObjectives/Objectives.rdf`
- `FND/Relations/Relations.rdf`
- `FBC/FinancialInstruments/FinancialInstruments.rdf`
- `etc/testing/hygiene_parameterized/*.sparql`

## FIBO Framework Observations

FIBO is not organized as a single flat concept table. It is a production
ontology family with a source/product lifecycle:

- top-level specification metadata;
- domain metadata;
- domain directories such as BE, FBC, FND, SEC, MD, and LOAN;
- modules inside domains;
- one or more ontology files inside modules;
- load files such as `AboutFIBOProd.rdf`;
- XML catalog mappings from ontology IRIs to local source files;
- maturity levels at ontology level;
- publication products generated from source artifacts;
- hygiene tests over metadata, labels, definitions, imports, deprecated
  resources, circularity, and performance-sensitive OWL constructs.

FIBO's Foundations domain is especially relevant to AOEF. It contains reusable
concepts for agents, goals/objectives, relations, organizations, agreements,
dates/times, and utilities rather than forcing every downstream domain to
redefine them.

## Adopted AOEF Governance Changes

| FIBO standard | AOEF governance rule |
|---|---|
| Domain/module/ontology hierarchy | Use structured namespaces and stable IRIs for the artifact, but do not turn metadata classes into agent-system terms. |
| Ontology header metadata | Keep artifact metadata at the top level of `ontology/agent-ontology.json`. |
| Maturity levels | Treat maturity as governance metadata for generated schema/export profiles, not as an agent runtime class. |
| Labels and definitions required | Every agent-system term has `label` and genus/differentia-style `definition`. |
| Reusable relations live high in the hierarchy | Relation families are canonical edge definitions, not framework-specific copies. |
| Adapter concepts are separate membranes | Protocol/framework/benchmark concepts live in adapter mappings unless they are observable agent-system runtime objects. |
| Source/product separation | `research/` remains evidence; `ontology/agent-ontology.*` is the canonical product consumed by Phase 2. |
| Hygiene tests | AOEF requires source integrity, unique labels, non-circular definitions, plane-term resolution, relation completeness, and no stale draft chain. |

## Canonical Ontology Shape

| current metric | value |
|---|---:|
| Domains | 1 |
| Agent-system planes | 8 |
| Agent-system modules | 36 |
| Agent-system classes | 413 |
| Object properties / relation families | 157 |
| Data properties | 92 |
| Annotation properties | 12 |
| Controlled individuals | 75 |
| Axioms | 368 |
| Datatypes | 8 |
| Ontology partitions | 44 |
| Adapter mappings | 7 |
| Hygiene gates | 19 |
| Unique source IDs | 59 |
| Missing source IDs | 0 |
| Unresolved living sources | 0 |
| Plane/term resolution failures | 0 |
| Module/class resolution failures | 0 |
| Duplicate labels | 0 |
| Circular definitions | 0 |
| Metadata terms present in agent terms | 0 |

## Cleanup

The versioned draft chain was removed:

- deleted `research/ontology-system-v0.1.md`
- deleted `research/ontology-system-v0.1.json`
- deleted `research/ontology-system-v0.2.md`
- deleted `research/ontology-system-v0.2.json`
- deleted `research/source-notes/phase-1d-ontology-system-deepening.md`

The only authoritative Phase 1 ontology entrypoints are now:

- `ontology/agent-ontology.md`
- `ontology/agent-ontology.json`

## Phase 2 Handoff

Phase 2 must generate schema, Graph IR, fixtures, and frontend data from
`ontology/agent-ontology.json`. It must not infer ontology structure directly
from research notes, historical draft prose, or hand-written mock graph data.

The later cross-domain ontology-pattern correction further clarified that FIBO
is a governance/modeling reference. The agent ontology itself is now plane-
centered around runtime, info, memory, orchestration, tool, safety, feedback,
and adapter semantics.
