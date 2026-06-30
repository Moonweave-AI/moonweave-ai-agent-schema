# val-jsonschema-zod-pydantic-foundations: JSON Schema, Zod, Pydantic, Ajv, and SHACL Foundations

metadata:
  domain: schema-validation
  source_type: source-family
  authority_level: mixed-primary-implementation
  temporal_class: foundational-plus-current
  published_or_updated: 2017-07-20 to 2026-05-12
  last_checked: 2026-06-30
  url: https://json-schema.org/specification
  deep_read_priority: A

## Covered Sources

| source_id | title | url | authority | temporal_class |
|---|---|---|---|---|
| cand-val-json-schema-spec | JSON Schema specification index | https://json-schema.org/specification | standard | current-docs |
| cand-val-json-schema-ietf-2026 | IETF JSON Schema Internet-Draft | https://datatracker.ietf.org/doc/html/draft-ietf-jsonschema-json-schema-00 | standard-draft | current |
| cand-val-zod-json-schema | Zod JSON Schema conversion | https://zod.dev/json-schema | official-doc | current-docs |
| cand-val-zod-metadata | Zod metadata and registries | https://zod.dev/metadata | official-doc | current-docs |
| cand-val-pydantic-json-schema | Pydantic JSON Schema | https://pydantic.dev/docs/validation/latest/concepts/json_schema/ | official-doc | current-docs |
| cand-val-ajv-guide | Ajv schema language guide | https://ajv.js.org/guide/schema-language.html | official-doc | current-docs |
| cand-val-shacl-report | SHACL validation reports | https://www.w3.org/TR/shacl/#validation-report | standard | foundational |

## Why This Source Family Matters

This family defines the structural validation and conversion surface for JSON artifacts, while SHACL covers semantic graph validation. It also exposes drift risks: Zod and Pydantic can generate JSON Schema, but not every runtime/schema feature maps cleanly to JSON Schema.

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|
| JSON Schema | JSON-based language for describing and constraining JSON documents. | JSON Schema spec index and IETF draft. | high | L6 |
| Dialect | Declared JSON Schema vocabulary/version used by a schema. | IETF draft covers dialect and vocabulary requirements. | high | L6 |
| Meta-schema | Schema that validates schemas. | JSON Schema spec index describes meta-schemas. | high | L6 |
| Validation Keyword | Keyword asserting constraints on JSON instances. | JSON Schema validation vocabulary. | high | L6 |
| Annotation | Non-assertion information produced/associated during schema evaluation. | IETF draft differentiates validation and annotation. | high | L6 |
| Output Format | Machine-readable validation result shape. | JSON Schema spec includes recommended output schema. | medium | L8 |
| Zod Schema | TypeScript runtime schema object with JSON Schema conversion. | Zod v4 docs introduce native z.toJSONSchema. | high | L6 |
| Zod Registry | Metadata store for schemas used in JSON Schema generation. | Zod metadata docs define registries and global metadata. | high | L6 |
| Unrepresentable Type | Runtime schema feature that cannot soundly convert to JSON Schema. | Zod lists bigint, date, transform, map, set, custom, and others. | high | L6 |
| Pydantic Model Schema | JSON Schema generated from BaseModel or TypeAdapter. | Pydantic docs define model_json_schema and TypeAdapter.json_schema. | high | L6 |
| Validation Mode | Pydantic/Zod generated schema describing accepted input. | Pydantic mode=validation; Zod io=input. | high | L6 |
| Serialization/Output Mode | Generated schema describing emitted output. | Pydantic mode=serialization; Zod default output examples. | high | L6 |
| Ajv Validator | JSON Schema/JTD validation implementation. | Ajv docs support drafts and JTD. | high | L6 |
| SHACL Validation Report | RDF graph validation result. | SHACL defines validation over data graph and shapes graph. | high | L8 |

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|
| schema_declares_dialect | JSON Schema | Dialect | JSON Schema `$schema` and dialect concepts. | high | |
| schema_uses_keyword | JSON Schema | Validation Keyword | JSON Schema vocabularies. | high | |
| meta_schema_validates_schema | Meta-schema | JSON Schema | JSON Schema meta-schema concept. | high | |
| validator_evaluates_instance | Validator | JSON Instance | JSON Schema validation process. | high | |
| validation_produces_output | Validator | Output Format | JSON Schema recommended output and IETF annotation/output. | medium | |
| zod_generates_json_schema | Zod Schema | JSON Schema | z.toJSONSchema docs. | high | Adapter relation. |
| zod_registry_supplies_metadata | Zod Registry | JSON Schema | Zod metadata copied to resulting JSON Schema. | high | Adapter relation. |
| pydantic_generates_json_schema | Pydantic Model Schema | JSON Schema | model_json_schema and TypeAdapter.json_schema. | high | Adapter relation. |
| ajv_validates_schema | Ajv Validator | JSON Schema | Ajv supports JSON Schema drafts. | high | Implementation relation. |
| shacl_shape_validates_graph | SHACL Shape | RDF Graph | SHACL shapes/data graph model. | high | Semantic validation relation. |

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|
| schema_drafted | SchemaArtifact | authoring | no | JSON Schema as document. | Process state candidate. |
| schema_validated_against_meta_schema | JSON Schema | meta-schema validation | no | JSON Schema meta-schema concept. | |
| instance_accepted | JSON Instance | validator accepts instance | yes | IETF draft accepted input terminology. | Per validation run. |
| violation_reported | JSON Instance | validator rejects instance | yes | IETF draft violation terminology. | |
| conversion_failed_unrepresentable | Zod Schema | z.toJSONSchema sees unrepresentable type | yes | Zod throws by default for unrepresentable types. | |
| graph_conforms | RDF Data Graph | SHACL validation passes | yes | SHACL validation report model. | |
| graph_violation_reported | RDF Data Graph | SHACL constraint violation | yes | SHACL validation result. | |

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|
| Schema artifacts should record JSON Schema dialect. | JSON Schema | JSON Schema dialect/version support. | structural | Older drafts may be needed for integrations. |
| Generated schemas should record generator and mode. | Generated JSON Schema | Pydantic validation/serialization; Zod input/output behavior. | provenance | Without mode, input/output drift is hidden. |
| Conversion must surface unrepresentable runtime schema features. | Zod Schema, Generated JSON Schema | Zod docs list unrepresentable types and default throw behavior. | structural/process | Other generators may silently degrade. |
| SHACL reports should not be treated as JSON Schema outputs. | ValidationArtifact | SHACL validates RDF graphs; JSON Schema validates JSON. | semantic | Combining reports loses graph-specific details. |
| Ajv draft support should be explicit. | ValidatorConfig | Ajv uses different imports for 2019-09/2020-12 features. | implementation | Wrong validator config can make schemas appear invalid. |

## Schema Implications

Facts only, no final schema decisions:

- Validation layer likely needs separate artifacts for structural JSON validation, semantic RDF/SHACL validation, and runtime/framework validation.
- Generated JSON Schema should preserve provenance: source schema language, generator, generator version if known, target dialect, mode/input-output orientation, and conversion warnings.
- Pydantic and Zod both support JSON Schema generation but differ in input/output terminology and conversion limitations.
- Ajv evidence supports explicit validator dialect configuration.
- SHACL evidence supports a semantic validation report path separate from JSON Schema output.

## Framework Or Standard Specificity

Core candidates:

- SchemaArtifact, Dialect, MetaSchema, Validator, ValidationRun, Violation, Annotation, ConversionWarning.

Adapter-only or implementation-specific candidates:

- Zod registry metadata, Zod `io`, Zod `unrepresentable`, Pydantic `mode`, Ajv import paths and draft-specific classes.

## Contradictions And Open Questions

| issue | evidence | impact | owner | deadline |
|---|---|---|---|---|
| IETF JSON Schema draft is current but not ready to replace implemented drafts. | IETF draft states it is work in progress. | Use 2020-12 as stable baseline unless later evidence changes. | research/schema-validation | Before Phase 0C |
| Runtime schema languages can express features JSON Schema cannot. | Zod unrepresentable types; Pydantic modes. | Need conversion-warning artifact and tests. | research/schema-validation | Before Phase 0C |
| Structural JSON validation and semantic graph validation are separate. | JSON Schema versus SHACL data models. | Need two validation layers. | research/schema-validation | Before Phase 0C |
| Ajv supports multiple drafts with configuration tradeoffs. | Ajv guide. | Validator config belongs in adapter/generator metadata. | research/schema-validation | Before implementation |

## Follow-Up Sources

- JSON Schema 2020-12 Core and Validation specs directly.
- JSON Schema Test Suite.
- TypeBox docs and repo.
- Pydantic-core schema internals.
- OpenAPI 3.1 Schema Object.
- ShEx semantics.
