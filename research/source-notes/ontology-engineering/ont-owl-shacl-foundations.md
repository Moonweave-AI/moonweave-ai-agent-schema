# ont-owl-shacl-foundations: OWL/RDF/SHACL/PROV/LOT/LLM4OE Foundations

metadata:
  domain: ontology-engineering
  source_type: source-family
  authority_level: mixed-primary
  temporal_class: foundational-plus-current
  published_or_updated: 2012-12-11 to 2025
  last_checked: 2026-06-30
  url: https://www.w3.org/TR/owl2-overview/
  deep_read_priority: A

## Covered Sources

| source_id | title | url | authority | temporal_class |
|---|---|---|---|---|
| ont-owl2-2012 | OWL 2 Web Ontology Language Document Overview | https://www.w3.org/TR/owl2-overview/ | W3C Recommendation | foundational |
| ont-rdf11-2014 | RDF 1.1 Concepts and Abstract Syntax | https://www.w3.org/TR/rdf11-concepts/ | W3C Recommendation | foundational |
| ont-shacl-2017 | Shapes Constraint Language | https://www.w3.org/TR/shacl/ | W3C Recommendation | foundational |
| ont-prov-o-2013 | PROV-O: The PROV Ontology | https://www.w3.org/TR/prov-o/ | W3C Recommendation | foundational |
| cand-ont-lot | LOT: Linked Open Terms methodology | https://lot.linkeddata.es/ | methodology | current-docs |
| cand-ont-llm-oe-slr | Large Language Models for Ontology Engineering: A Systematic Literature Review | https://www.semantic-web-journal.net/system/files/swj4001.pdf | survey | current |

## Why This Source Family Matters

This family establishes the semantic-web side of the project. RDF provides the graph data model, OWL defines formal ontology constructs, SHACL defines RDF graph validation, PROV-O covers provenance, LOT provides an engineering workflow, and the LLM4OE survey constrains how LLM assistance should be treated as evidence.

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|
| Ontology | Formalized vocabulary of terms and relationships for a domain. | OWL 2 describes ontologies as formalized vocabularies that specify terms by their relationships. | high | L1 |
| RDF Graph | Set of subject-predicate-object triples with IRI, literal, or blank-node terms. | RDF 1.1 defines triples and RDF graphs as the abstract syntax shared by RDF-based languages. | high | L1, L6 |
| Class | Category of individuals or resources in an ontology. | OWL 2 includes classes, properties, individuals, and data values. | high | L1 |
| Property | RDF/OWL relation or attribute identified by an IRI. | RDF predicates denote properties; OWL separates object and data properties. | high | L1, L6 |
| Shape | RDF graph construct that validates a data graph against conditions. | SHACL defines shapes graphs and data graphs for validation. | high | L6 |
| Validation Report | Machine-readable result of graph validation. | SHACL defines validation results over RDF data graphs. | high | L8 |
| Entity | Provenance object or data artifact. | PROV-O expresses PROV-DM using Entity, Activity, Agent, and influence relations. | high | L0, L8 |
| Activity | Process that uses or generates entities. | PROV-O maps provenance activities to OWL classes and properties. | high | L8 |
| Agent | Responsible actor in provenance, not necessarily an AI agent. | PROV-O includes agents that bear responsibility for activities/entities. | high | L0, L8 |
| Competency Question | Requirement-style question an ontology should answer. | LOT requirements workflow uses competency questions or statements to capture requirements. | high | L0, L8 |
| Ontology Sprint | Iterative implementation pass over prioritized ontology requirements. | LOT recommends ontology implementation in sprints with new ontology versions per iteration. | medium | L8 |
| LLM-Assisted OE Task | Ontology engineering task assisted by an LLM, such as requirements, implementation, publication, or maintenance. | LLM4OE SLR categorizes LLM uses across ontology development activities and notes reproducibility gaps. | medium | L8 |

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|
| ontology_has_class | Ontology | Class | OWL 2 ontology structures include classes. | high | Core semantic export candidate. |
| ontology_has_property | Ontology | Property | OWL 2 and RDF model properties as relations. | high | Core semantic export candidate. |
| rdf_triple_links | Resource | Resource | RDF statements connect subject, predicate, and object. | high | Relationship model should preserve subject/predicate/object export path. |
| shape_validates_graph | Shape | RDF Graph | SHACL validates a data graph against shapes in a shapes graph. | high | Semantic validation layer, not structural JSON validation. |
| activity_generated_entity | Activity | Entity | PROV-O supports generated entities and activities. | high | Provenance relation candidate. |
| entity_attributed_to_agent | Entity | Agent | PROV-O supports attribution/responsibility. | high | Must distinguish provenance agent from AI-agent entity. |
| requirement_drives_implementation | Competency Question | Ontology Sprint | LOT turns requirements into prioritized implementation iterations. | medium | Process relation, not ontology domain relation. |

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|
| requirements_specified | Ontology Project | ORSD/competency questions are drafted and validated | no | LOT requirements workflow. | Supports Phase 0/Phase 1 gate evidence. |
| implemented_iteration | Ontology Version | Sprint implements prioritized requirements | no | LOT implementation workflow. | Versioned ontology artifact state. |
| evaluated | Ontology Version | Syntax/modeling/semantic checks pass | no | LOT evaluation sub-activity. | Can map to validation reports. |
| published | Ontology Version | Human-readable and machine-readable forms are released | maybe | LOT publication workflow. | Publication is release state, not final maintenance state. |
| maintained | Ontology | Change request or usage feedback | no | LOT maintenance activity. | Should carry provenance and decision trail. |

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|
| Canonical IDs should be URI-safe when semantic export is enabled. | Concept, Relation, SchemaArtifact | RDF resources are denoted by IRIs. | structural + semantic | Over-constraining local draft IDs too early. |
| RDF export must preserve subject, predicate, and object roles. | RelationCandidate | RDF triple model. | semantic | N-ary relations require qualification/reification patterns. |
| SHACL validation should be separate from JSON Schema validation. | ValidationArtifact | SHACL validates RDF graphs; JSON Schema validates JSON structures. | semantic | Combining them can hide semantic violations behind structural pass/fail. |
| Provenance must distinguish source, extraction activity, reviewer, and generated artifact. | SourceNote, CandidateConcept | PROV-O Entity/Activity/Agent model. | semantic | "Agent" term collision with AI agents. |
| LLM-generated ontology suggestions require human review metadata. | LLM-assisted extraction | LLM4OE SLR reports heterogeneity and reproducibility gaps. | process | Treating LLM output as authority would contaminate evidence. |

## Schema Implications

Facts only, no final schema decisions:

- A JSON-first project can still maintain semantic-web compatibility if every concept and relation has stable identifiers and RDF export metadata.
- Semantic validation and structural validation need distinct artifacts because SHACL and JSON Schema validate different data models.
- Provenance should be a first-class research artifact, using Entity/Activity/Agent-style distinctions.
- Competency questions and requirements should remain connected to concept/relation candidates.
- LLM-assisted extraction should be represented as an activity with reviewer status, not as a primary source.

## Framework Or Standard Specificity

Core candidates:

- Concept, Relation, SourceRecord, ExtractionActivity, ValidationArtifact, ProvenanceLink.

Adapter-only or export-specific candidates:

- OWL profile, RDF serialization syntax, JSON-LD context, SHACL engine options, LOT ORSD document shape.

## Contradictions And Open Questions

| issue | evidence | impact | owner | deadline |
|---|---|---|---|---|
| OWL/RDF graph expressiveness differs from JSON object contracts. | RDF/OWL model graph semantics; JSON Schema is structural. | Need a two-layer validation model. | research/schema-validation | Before Phase 0C |
| PROV-O Agent conflicts terminologically with AI Agent. | PROV-O uses Agent for responsible actor. | Need naming convention in canonical ontology. | research/ontology-engineering | Before Phase 0C |
| LLM4OE sources report weak reproducibility in some studies. | LLM4OE SLR notes incomplete protocols/code. | LLM-extracted concepts require review provenance. | research/ontology-engineering | Before Phase 0C |

## Follow-Up Sources

- JSON-LD 1.1 and SKOS for label/context handling.
- OWL 2 Structural Specification for exact OWL entity taxonomy.
- PROV-DM for provenance constraints beyond PROV-O classes.
- SHACL 1.2 Working Draft for emerging features, with draft status clearly labeled.
