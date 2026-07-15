export type BackboneRole = "primary-backbone" | "secondary-backbone";
export type RootStatus = "domain-upper-root" | "module-key-root" | "composition-root" | null;

export declare const ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS: readonly (
  readonly [relationId: string, role: BackboneRole, parentId: string, childId: string]
)[];
export declare const ONTOLOGY_V3_ROOT_STATUS_DECISIONS: readonly (
  readonly [conceptId: string, status: RootStatus]
)[];
export declare const ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS: readonly (
  readonly [conceptId: string, siblingId: string, sharedParentId: string]
)[];
export declare const validateOntologyV3BackboneDecisions: (input: {
  concepts: ReadonlyMap<string, { id: string; status: string; module_id: string; semantic_kind: string }>;
  relations: ReadonlyMap<string, { id: string; status: string; source_id: string; target_id: string }>;
}) => void;
