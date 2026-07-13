import {
  type CanonicalConcept,
  type CanonicalOntology,
  type CanonicalRelation,
} from "../lib/ontology-index";

export const semanticNamespaces = Object.freeze({
  mw: "https://moonweave.ai/ontology/",
  prov: "http://www.w3.org/ns/prov#",
  sh: "http://www.w3.org/ns/shacl#",
  owl: "http://www.w3.org/2002/07/owl#",
});

const iri = (base: string, id: string): string => `${base}${encodeURIComponent(id)}`;

const iriPath = (base: string, ...segments: string[]): string =>
  `${base}${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;

/** Projects the canonical nodes and assertions; it never owns domain facts. */
export const exportCanonicalJsonLd = (ontology: CanonicalOntology) => {
  const base = String(
    ontology.artifact_metadata?.canonical_version ??
    semanticNamespaces.mw,
  );
  const concepts = ontology.classes.map((concept) => ({
    "@id": iri(base, concept.id),
    "@type": "mw:Concept",
    "mw:moduleId": concept.module_id,
    "mw:semanticKind": concept.semantic_kind,
  }));
  const relations = ontology.relations.map((relation) => ({
    "@id": iri(base, relation.id),
    "@type": "mw:Relation",
    "mw:predicate": relation.predicate,
    "mw:source": { "@id": iri(base, relation.source_id) },
    "mw:target": { "@id": iri(base, relation.target_id) },
  }));
  return {
    "@context": {
      mw: semanticNamespaces.mw,
      prov: semanticNamespaces.prov,
    },
    "@graph": [...concepts, ...relations],
  };
};

const turtleLiteral = (value: string): string => JSON.stringify(value);

/** Generates a small SHACL projection from a canonical Concept's reviewed fields. */
export const exportConceptShacl = (
  concept: CanonicalConcept,
  base: string = semanticNamespaces.mw,
): string => {
  const properties = (concept.structure?.fields ?? []).map((field) => {
    const max = field.cardinality?.max;
    return [
      "  sh:property [",
      `    sh:path <${iriPath(base, concept.id, field.id)}> ;`,
      `    sh:name ${turtleLiteral(field.labels?.en ?? field.id)} ;`,
      `    sh:minCount ${field.cardinality?.min ?? 0}${typeof max === "number" ? ` ;\n    sh:maxCount ${max}` : ""}`,
      "  ] ;",
    ].join("\n");
  });
  return [
    `@prefix sh: <${semanticNamespaces.sh}> .`,
    `@prefix mw: <${semanticNamespaces.mw}> .`,
    "",
    `<${iri(base, `${concept.id}Shape`)}> a sh:NodeShape ;`,
    `  sh:targetClass <${iri(base, concept.id)}> ;`,
    ...properties,
    "  .",
  ].join("\n");
};

export const exportRelationOwl = (
  relation: CanonicalRelation,
  base: string = semanticNamespaces.mw,
): string =>
  [
    `@prefix owl: <${semanticNamespaces.owl}> .`,
    `<${iri(base, relation.id)}> a owl:ObjectProperty ;`,
    `  <${iri(base, "sourceConcept")}> <${iri(base, relation.source_id)}> ;`,
    `  <${iri(base, "targetConcept")}> <${iri(base, relation.target_id)}> .`,
  ].join("\n");
