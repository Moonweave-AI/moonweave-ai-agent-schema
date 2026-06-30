# Ontology And Validation Expansion, 2024-2026

Date: 2026-06-30
Status: source-first note

## Purpose

This note expands Phase 0B's ontology and validation evidence base without choosing final schema layers or relation types.

## Ontology Engineering Sources

Priority sources:

- [Large Language Models for Ontology Engineering: A Systematic Literature Review](https://www.semantic-web-journal.net/content/large-language-models-ontology-engineering-systematic-literature-review) reviews 30 papers and reports heterogeneous tasks, inputs, outputs, evaluation methods, and reproducibility gaps.
- [NeOn-GPT](https://www.semantic-web-journal.net/system/files/swj4014.pdf) gives a methodology-oriented LLM-assisted ontology construction pipeline.
- [Wikontic](https://aclanthology.org/2026.eacl-long.388.pdf) adds ontology-aware KG construction with Wikidata constraints.
- [OntoKG](https://www.arxiv.org/pdf/2604.02618) and [Extract-Define-Canonicalize](https://arxiv.org/abs/2406.09164) cover schema/ontology extraction and normalization concerns.
- Foundational sources such as [Ontology 101](https://protege.stanford.edu/publications/ontology_development/ontology101.pdf), [METHONTOLOGY](https://oa.upm.es/5484/), [OWL 2](https://www.w3.org/TR/owl2-overview/), [RDF Schema](https://www.w3.org/TR/rdf-schema/), [SKOS](https://www.w3.org/TR/skos-reference/), and [PROV-O](https://www.w3.org/TR/prov-o/) remain necessary for any later ontology claims.

Source-first observation: recent LLM ontology papers are useful but not enough. They repeatedly surface reproducibility, evaluation, and human-in-the-loop gaps, so later schema work must retain classical ontology engineering evidence.

## Semantic Validation Sources

Priority sources:

- [SHACL Recommendation](https://www.w3.org/TR/shacl/) is the baseline for RDF graph constraint validation.
- [SHACL Advanced Features](https://www.w3.org/TR/shacl-af/) expands expressiveness beyond core SHACL.
- [A Community Survey on SHACL and ShEx](https://arxiv.org/html/2606.03502) reports current practice gaps: documentation, tool support, performance, and expressiveness needs.
- [Lessons Learned from Combined OWL and SHACL Development](https://dl.acm.org/doi/full/10.1145/3731443.3771340) shows that joint OWL+SHACL development needs both automatic generation and manual effort, and that engine feature support varies.
- [ShEx](https://shex.io/) remains the key RDF shape alternative to compare with SHACL.

Source-first observation: OWL and SHACL are not interchangeable. OWL supports open-world reasoning; SHACL supports closed-world-style data quality constraints. The K-CAP 2025 source highlights practical combined development challenges.

## Structural Validation Sources

Priority sources:

- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12) records vocabulary changes, dynamic references, array/tuple keyword changes, and output schemas.
- [IETF JSON Schema draft](https://datatracker.ietf.org/doc/html/draft-ietf-jsonschema-json-schema-01) indicates current standards-track work.
- [JSON Schema Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite) is implementation-conformance evidence.
- [Zod JSON Schema docs](https://zod.dev/json-schema) document native conversion, target dialects, input/output modes, cycles/reuse handling, and unrepresentable Zod types.
- [Pydantic JSON Schema docs](https://docs.pydantic.dev/latest/concepts/json_schema/), [TypeBox](https://github.com/sinclairzx81/typebox), [CUE](https://cuelang.org/docs/concept/how-cue-works-with-openapi/), [Ajv](https://ajv.js.org/), and [OpenAPI 3.1](https://spec.openapis.org/oas/latest.html) provide engineering evidence for practical validation and schema generation.

Source-first observation: conversion between runtime validators and interchange schemas is lossy. Zod explicitly lists unrepresentable types and conversion modes, so later canonical schema design must not assume perfect round trips.

## Carry-Forward Questions

- Which parts of the agent schema need semantic constraints, and which only need structural validation?
- Is provenance represented as RDF/PROV-compatible metadata, plain JSON fields, or both?
- Which validation artifacts are normative contracts and which are implementation helpers?
- How should LLM-assisted ontology proposals be reviewed against classical methodology and reproducible benchmarks?
