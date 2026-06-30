export const jsonLdContext = {
  "@context": {
    mw: "https://moonweave.ai/ontology/",
    prov: "http://www.w3.org/ns/prov#",
    source_ids: "mw:sourceIds",
    constraint_ids: "mw:constraintIds",
    review_status: "mw:reviewStatus",
    TrustBoundary: "mw:TrustBoundary",
    ObservableTraceEvent: "mw:ObservableTraceEvent"
  }
};

export const shaclShapeSketch = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix mw: <https://moonweave.ai/ontology/> .

mw:TrustBoundaryShape
  a sh:NodeShape ;
  sh:targetClass mw:TrustBoundary ;
  sh:property [
    sh:path mw:sourceIds ;
    sh:minCount 1 ;
  ] .
`;
