import type {
  CanonicalAgentOntology,
  CanonicalConceptContract,
  CanonicalModuleContract,
  CanonicalPlaneContract,
  CanonicalRelationContract,
  CanonicalSourceClaim as CanonicalSourceClaimContract,
  CasePath,
  CasePathStep,
  Constraint,
  Example,
  Field,
  LocalizedDraftText,
  LocalizedText as GeneratedLocalizedText,
} from "./canonical-ontology-types";

export type OntologyEntityKind = "root" | "plane" | "module" | "concept";
export type OntologyEntityRef = `${OntologyEntityKind}:${string}`;

export type OntologyLanguage = "zh" | "en" | "ja";

export type RelationLayoutRole =
  | "primary-backbone"
  | "secondary-backbone"
  | "cross-link"
  | "none";

export interface IndexedBackboneRelation {
  readonly relation: CanonicalRelation;
  readonly parentRef: OntologyEntityRef;
  readonly childRef: OntologyEntityRef;
  readonly role: "primary-backbone" | "secondary-backbone";
}

export type LocalizedText = GeneratedLocalizedText;
export type CanonicalSourceClaim = CanonicalSourceClaimContract;
export type CanonicalExample = Example;
export type CanonicalField = Field;
export type CanonicalConstraint = Constraint;
export type CanonicalCasePathStep = CasePathStep;
export type CanonicalCasePath = CasePath;
export type CanonicalPlane = CanonicalPlaneContract;
export type CanonicalModule = CanonicalModuleContract;
export type CanonicalConcept = CanonicalConceptContract;
export type CanonicalRelation = CanonicalRelationContract;
export type CanonicalOntology = CanonicalAgentOntology;

type LocalizedOntologyText = GeneratedLocalizedText | LocalizedDraftText;

/**
 * A field projected from the canonical `is_a` graph for UI and payload consumers.
 * The canonical field remains stored only on the concept that declares it.
 */
export interface EffectiveOntologyField {
  readonly field: CanonicalField;
  readonly declaredOnId: string;
  readonly inheritanceDepth: number;
}

export interface ResolvedCanonicalCaseStep {
  readonly step: CanonicalCasePathStep;
  readonly example: CanonicalExample | undefined;
  readonly ownerEntityRef: OntologyEntityRef | undefined;
  readonly ownerRelationId: string | undefined;
  readonly traversalRelation: CanonicalRelation | undefined;
  readonly missingReferenceIds: readonly string[];
}

export interface OntologySourceMetadata {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly year: string;
  readonly source_type: string;
  readonly priority: string;
  readonly status: string;
  readonly [key: string]: unknown;
}

export interface OntologySourceIndexDocument {
  readonly registry_fingerprint: string;
  readonly living_fingerprint?: string;
  readonly sources: readonly OntologySourceMetadata[];
  readonly [key: string]: unknown;
}

export interface IndexedOntologyEntity {
  readonly ref: OntologyEntityRef;
  readonly id: string;
  readonly kind: OntologyEntityKind;
  readonly data: CanonicalOntology | CanonicalPlane | CanonicalModule | CanonicalConcept;
}

export interface OntologyDataDiagnostic {
  readonly code:
    | "missing-plane"
    | "missing-module"
    | "missing-relation-endpoint"
    | "invalid-primary-parent"
    | "invalid-backbone-endpoint"
    | "duplicate-primary-backbone"
    | "primary-backbone-cycle";
  readonly ownerId: string;
  readonly missingId: string;
  readonly message: string;
}

export interface OntologyIndex {
  readonly ontology: CanonicalOntology;
  readonly rootRef: OntologyEntityRef;
  readonly entitiesByRef: ReadonlyMap<string, IndexedOntologyEntity>;
  readonly planesById: ReadonlyMap<string, CanonicalPlane>;
  readonly modulesById: ReadonlyMap<string, CanonicalModule>;
  readonly conceptsById: ReadonlyMap<string, CanonicalConcept>;
  readonly relationsById: ReadonlyMap<string, CanonicalRelation>;
  readonly sourcesById: ReadonlyMap<string, OntologySourceMetadata>;
  readonly examplesById: ReadonlyMap<string, CanonicalExample>;
  readonly exampleOwnerEntityRefById: ReadonlyMap<string, OntologyEntityRef>;
  readonly exampleOwnerRelationIdById: ReadonlyMap<string, string>;
  readonly casePathsById: ReadonlyMap<string, CanonicalCasePath>;
  readonly organizationalChildrenByRef: ReadonlyMap<OntologyEntityRef, readonly OntologyEntityRef[]>;
  readonly organizationalParentByRef: ReadonlyMap<OntologyEntityRef, OntologyEntityRef>;
  readonly planeByModuleId: ReadonlyMap<string, CanonicalPlane>;
  readonly moduleByConceptId: ReadonlyMap<string, CanonicalModule>;
  readonly rootConceptRefsByModuleId: ReadonlyMap<string, readonly OntologyEntityRef[]>;
  readonly primaryParentRelationByConceptId: ReadonlyMap<string, CanonicalRelation>;
  readonly additionalParentRelationsByConceptId: ReadonlyMap<string, readonly CanonicalRelation[]>;
  readonly directChildRelationsByConceptId: ReadonlyMap<string, readonly CanonicalRelation[]>;
  readonly incomingRelationsByConceptId: ReadonlyMap<string, readonly CanonicalRelation[]>;
  readonly outgoingRelationsByConceptId: ReadonlyMap<string, readonly CanonicalRelation[]>;
  readonly primaryBackboneChildrenByRef: ReadonlyMap<OntologyEntityRef, readonly IndexedBackboneRelation[]>;
  readonly secondaryBackboneChildrenByRef: ReadonlyMap<OntologyEntityRef, readonly IndexedBackboneRelation[]>;
  readonly backboneParentByRef: ReadonlyMap<OntologyEntityRef, IndexedBackboneRelation>;
  readonly semanticIncomingByRef: ReadonlyMap<OntologyEntityRef, readonly CanonicalRelation[]>;
  readonly semanticOutgoingByRef: ReadonlyMap<OntologyEntityRef, readonly CanonicalRelation[]>;
  readonly relationsByPredicate: ReadonlyMap<string, readonly CanonicalRelation[]>;
  readonly directChildCountByRef: ReadonlyMap<OntologyEntityRef, number>;
  readonly semanticDegreeByRef: ReadonlyMap<OntologyEntityRef, number>;
  readonly moduleKeyNotionById: ReadonlyMap<string, CanonicalConcept>;
  readonly effectiveFieldsByConceptId: ReadonlyMap<string, readonly EffectiveOntologyField[]>;
  readonly dataDiagnostics: readonly OntologyDataDiagnostic[];
}

/**
 * A node remains in the navigable graph unless its authored lifecycle status
 * explicitly marks it deprecated.  Compilation preserves the node's current
 * semantic content rather than synthesizing a separate governance layer.
 */
const isCurrentStatus = (status: string): boolean => status !== "deprecated";

const entityRef = (kind: OntologyEntityKind, id: string): OntologyEntityRef => `${kind}:${id}`;

const appendToMap = <T>(map: Map<string, T[]>, key: string, value: T): void => {
  map.set(key, [...(map.get(key) ?? []), value]);
};

const freezeMapArrays = <T>(map: Map<string, T[]>): ReadonlyMap<string, readonly T[]> =>
  new Map([...map].map(([key, values]) => [key, Object.freeze([...values])]));

const freezeRefMapArrays = <T>(
  map: Map<OntologyEntityRef, T[]>,
): ReadonlyMap<OntologyEntityRef, readonly T[]> =>
  new Map([...map].map(([key, values]) => [key, Object.freeze([...values])]));

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Readonly<Record<string, unknown>>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableValue(nested)]),
  );
};

const fieldSemanticSignature = (field: CanonicalField): string => {
  const { source_claims: _sourceClaims, example_value: _exampleValue, ...semanticField } = field;
  return JSON.stringify(stableValue(semanticField));
};

const allowedValueSignature = (allowedValue: CanonicalField["allowed_values"][number]): string =>
  JSON.stringify(stableValue(allowedValue.value));

/**
 * A subtype may strengthen an inherited field contract, but it may not silently
 * change the field's identity or widen the values accepted by its parent.
 */
const isCompatibleFieldRefinement = (
  subtypeField: CanonicalField,
  parentField: CanonicalField,
): boolean => {
  if (
    subtypeField.id !== parentField.id ||
    subtypeField.datatype !== parentField.datatype
  ) return false;
  if (parentField.required && !subtypeField.required) return false;
  const parentMin = parentField.cardinality?.min ?? (parentField.required ? 1 : 0);
  const subtypeMin = subtypeField.cardinality?.min ?? (subtypeField.required ? 1 : 0);
  const parentMax = parentField.cardinality?.max ?? null;
  const subtypeMax = subtypeField.cardinality?.max ?? null;
  if (subtypeMin < parentMin) return false;
  if (
    parentMax !== null &&
    (subtypeMax === null || subtypeMax > parentMax)
  ) {
    return false;
  }
  if (parentField.pattern && subtypeField.pattern !== parentField.pattern) return false;

  const parentAllowedValues = parentField.allowed_values ?? [];
  const subtypeAllowedValues = subtypeField.allowed_values ?? [];
  if (parentAllowedValues.length === 0) return true;
  if (subtypeAllowedValues.length === 0) return false;
  const parentValueSignatures = new Set(parentAllowedValues.map(allowedValueSignature));
  return subtypeAllowedValues.every((value) => parentValueSignatures.has(allowedValueSignature(value)));
};

export const buildOntologyIndex = (
  ontology: CanonicalOntology,
  sourceIndex?: OntologySourceIndexDocument,
): OntologyIndex => {
  const rootRef = entityRef("root", ontology.id);
  const entitiesByRef = new Map<OntologyEntityRef, IndexedOntologyEntity>();
  const planesById = new Map(ontology.planes.map((plane) => [plane.id, plane]));
  const modulesById = new Map(ontology.modules.map((module) => [module.id, module]));
  const conceptsById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
  const relationsById = new Map<string, CanonicalRelation>();
  const sourcesById = new Map((sourceIndex?.sources ?? []).map((source) => [source.id, source]));
  const examplesById = new Map<string, CanonicalExample>();
  const exampleOwnerEntityRefById = new Map<string, OntologyEntityRef>();
  const exampleOwnerRelationIdById = new Map<string, string>();
  const casePathsById = new Map((ontology.case_paths ?? []).map((path) => [path.id, path]));
  const organizationalChildrenByRef = new Map<OntologyEntityRef, OntologyEntityRef[]>();
  const organizationalParentByRef = new Map<OntologyEntityRef, OntologyEntityRef>();
  const planeByModuleId = new Map<string, CanonicalPlane>();
  const moduleByConceptId = new Map<string, CanonicalModule>();
  const incoming = new Map<string, CanonicalRelation[]>();
  const outgoing = new Map<string, CanonicalRelation[]>();
  const directChildren = new Map<string, CanonicalRelation[]>();
  const relationsByPredicate = new Map<string, CanonicalRelation[]>();
  const dataDiagnostics: OntologyDataDiagnostic[] = [];

  entitiesByRef.set(rootRef, {
    ref: rootRef,
    id: ontology.id,
    kind: "root",
    data: ontology,
  });

  const planeRefs = ontology.planes.map((plane) => {
    const ref = entityRef("plane", plane.id);
    entitiesByRef.set(ref, { ref, id: plane.id, kind: "plane", data: plane });
    organizationalParentByRef.set(ref, rootRef);
    return ref;
  });
  organizationalChildrenByRef.set(rootRef, planeRefs);

  for (const plane of ontology.planes) {
    const ref = entityRef("plane", plane.id);
    organizationalChildrenByRef.set(ref, []);
  }

  for (const module of ontology.modules) {
    const plane = planesById.get(module.plane_id);
    const ref = entityRef("module", module.id);
    entitiesByRef.set(ref, { ref, id: module.id, kind: "module", data: module });
    organizationalChildrenByRef.set(ref, []);
    if (!plane) {
      dataDiagnostics.push({
        code: "missing-plane",
        ownerId: module.id,
        missingId: module.plane_id,
        message: `Module ${module.id} references missing plane ${module.plane_id}`,
      });
      continue;
    }
    const planeRef = entityRef("plane", plane.id);
    organizationalChildrenByRef.set(planeRef, [
      ...(organizationalChildrenByRef.get(planeRef) ?? []),
      ref,
    ]);
    organizationalParentByRef.set(ref, planeRef);
    planeByModuleId.set(module.id, plane);
  }

  for (const concept of ontology.classes) {
    const module = modulesById.get(concept.module_id);
    const ref = entityRef("concept", concept.id);
    entitiesByRef.set(ref, { ref, id: concept.id, kind: "concept", data: concept });
    organizationalChildrenByRef.set(ref, []);
    if (!module) {
      dataDiagnostics.push({
        code: "missing-module",
        ownerId: concept.id,
        missingId: concept.module_id,
        message: `Concept ${concept.id} references missing module ${concept.module_id}`,
      });
      continue;
    }
    moduleByConceptId.set(concept.id, module);
  }

  for (const entity of entitiesByRef.values()) {
    const examples = entity.data.examples ?? [];
    for (const example of examples) {
      examplesById.set(example.id, example);
      exampleOwnerEntityRefById.set(example.id, entity.ref);
    }
  }

  for (const relation of ontology.relations) {
    const missingEndpointIds = [relation.source_id, relation.target_id].filter(
      (id) => !conceptsById.has(id),
    );
    if (missingEndpointIds.length > 0) {
      for (const missingId of missingEndpointIds) {
        dataDiagnostics.push({
          code: "missing-relation-endpoint",
          ownerId: relation.id,
          missingId,
          message: `Relation ${relation.id} references missing concept endpoint ${missingId}`,
        });
      }
      continue;
    }
    relationsById.set(relation.id, relation);
    appendToMap(outgoing, relation.source_id, relation);
    appendToMap(incoming, relation.target_id, relation);
    appendToMap(relationsByPredicate, relation.predicate, relation);
    if (
      isCurrentStatus(relation.status) &&
      relation.predicate === "is_a" &&
      relation.relation_kind === "hierarchy"
    ) {
      appendToMap(directChildren, relation.target_id, relation);
    }
    for (const example of relation.examples ?? []) {
      examplesById.set(example.id, example);
      exampleOwnerRelationIdById.set(example.id, relation.id);
    }
  }

  const primaryParents = new Map<string, CanonicalRelation>();
  const declaredPrimaryRelationIds = new Set(
    ontology.classes.flatMap((concept) =>
      concept.primary_parent_relation_id ? [concept.primary_parent_relation_id] : []),
  );
  const additionalParents = new Map<string, CanonicalRelation[]>();
  for (const concept of ontology.classes) {
    const parentRelations = (outgoing.get(concept.id) ?? []).filter(
      (relation) =>
        isCurrentStatus(relation.status) &&
        relation.predicate === "is_a" &&
        relation.relation_kind === "hierarchy",
    );
    const primary = concept.primary_parent_relation_id
      ? relationsById.get(concept.primary_parent_relation_id)
      : undefined;
    const primaryLayout = primary as (CanonicalRelation & {
      readonly layout_role?: RelationLayoutRole;
      readonly layout_child_id?: string | null;
    }) | undefined;
    const primaryNamesConceptAsChild = primaryLayout?.layout_child_id
      ? primaryLayout.layout_child_id === concept.id
      : primary?.predicate === "is_a" && primary.source_id === concept.id;
    if (
      primary &&
      isCurrentStatus(primary.status) &&
      [primary.source_id, primary.target_id].includes(concept.id) &&
      primaryNamesConceptAsChild &&
      (primaryLayout?.layout_role === undefined || primaryLayout.layout_role === "primary-backbone")
    ) {
      primaryParents.set(concept.id, primary);
    } else if (concept.primary_parent_relation_id) {
      dataDiagnostics.push({
        code: "invalid-primary-parent",
        ownerId: concept.id,
        missingId: concept.primary_parent_relation_id,
        message: `Concept ${concept.id} has unresolved or invalid primary parent relation ${concept.primary_parent_relation_id}`,
      });
    }
    additionalParents.set(
      concept.id,
      parentRelations.filter((relation) => relation.id !== primary?.id),
    );
  }

  const primaryBackboneChildren = new Map<OntologyEntityRef, IndexedBackboneRelation[]>();
  const secondaryBackboneChildren = new Map<OntologyEntityRef, IndexedBackboneRelation[]>();
  const backboneParentByRef = new Map<OntologyEntityRef, IndexedBackboneRelation>();
  const relationLayout = (relation: CanonicalRelation): IndexedBackboneRelation | null => {
    if (!isCurrentStatus(relation.status)) return null;
    const candidate = relation as CanonicalRelation & {
      readonly layout_role?: RelationLayoutRole;
      readonly layout_parent_id?: string | null;
      readonly layout_child_id?: string | null;
    };
    const isPrimaryTaxonomy = declaredPrimaryRelationIds.has(relation.id);
    const role = candidate.layout_role ?? (
      relation.predicate === "is_a"
        ? isPrimaryTaxonomy
          ? "primary-backbone"
          : "secondary-backbone"
        : "cross-link"
    );
    if (role !== "primary-backbone" && role !== "secondary-backbone") return null;
    const parentId = candidate.layout_parent_id ?? (
      relation.predicate === "is_a" ? relation.target_id : relation.source_id
    );
    const childId = candidate.layout_child_id ?? (
      relation.predicate === "is_a" ? relation.source_id : relation.target_id
    );
    if (
      !conceptsById.has(parentId) ||
      !conceptsById.has(childId) ||
      ![relation.source_id, relation.target_id].includes(parentId) ||
      ![relation.source_id, relation.target_id].includes(childId) ||
      parentId === childId
    ) {
      dataDiagnostics.push({
        code: "invalid-backbone-endpoint",
        ownerId: relation.id,
        missingId: `${parentId}->${childId}`,
        message: `Relation ${relation.id} has invalid layout backbone endpoints ${parentId} -> ${childId}`,
      });
      return null;
    }
    return {
      relation,
      parentRef: entityRef("concept", parentId),
      childRef: entityRef("concept", childId),
      role,
    };
  };

  for (const relation of ontology.relations) {
    const backbone = relationLayout(relation);
    if (!backbone) continue;
    const children = backbone.role === "primary-backbone"
      ? primaryBackboneChildren
      : secondaryBackboneChildren;
    children.set(backbone.parentRef, [
      ...(children.get(backbone.parentRef) ?? []),
      backbone,
    ]);
    if (backbone.role !== "primary-backbone") continue;
    const existing = backboneParentByRef.get(backbone.childRef);
    if (existing) {
      dataDiagnostics.push({
        code: "duplicate-primary-backbone",
        ownerId: backbone.relation.id,
        missingId: existing.relation.id,
        message: `Concept ${backbone.childRef} has duplicate primary backbone relations ${existing.relation.id} and ${backbone.relation.id}`,
      });
      continue;
    }
    backboneParentByRef.set(backbone.childRef, backbone);
  }

  const backboneCycleNodes = new Set<OntologyEntityRef>();
  for (const start of backboneParentByRef.keys()) {
    const path: OntologyEntityRef[] = [];
    const position = new Map<OntologyEntityRef, number>();
    let current: OntologyEntityRef | undefined = start;
    while (current && !position.has(current) && !backboneCycleNodes.has(current)) {
      position.set(current, path.length);
      path.push(current);
      current = backboneParentByRef.get(current)?.parentRef;
    }
    if (!current || !position.has(current)) continue;
    const cycle = path.slice(position.get(current));
    cycle.forEach((ref) => backboneCycleNodes.add(ref));
    dataDiagnostics.push({
      code: "primary-backbone-cycle",
      ownerId: start,
      missingId: cycle.join(" -> "),
      message: `Primary backbone cycle: ${[...cycle, current].join(" -> ")}`,
    });
  }

  const rootConceptRefsByModuleId = new Map<string, OntologyEntityRef[]>();
  for (const module of ontology.modules) rootConceptRefsByModuleId.set(module.id, []);
  for (const concept of ontology.classes) {
    const module = modulesById.get(concept.module_id);
    if (!module) continue;
    const conceptRef = entityRef("concept", concept.id);
    const backboneParent = backboneParentByRef.get(conceptRef);
    const parentConceptId = backboneParent?.parentRef.startsWith("concept:")
      ? backboneParent.parentRef.slice("concept:".length)
      : null;
    const primaryParent = parentConceptId ? conceptsById.get(parentConceptId) : undefined;
    const hasModuleLocalPrimaryParent = primaryParent?.module_id === concept.module_id;
    if (!hasModuleLocalPrimaryParent) {
      rootConceptRefsByModuleId.set(concept.module_id, [
        ...(rootConceptRefsByModuleId.get(concept.module_id) ?? []),
        conceptRef,
      ]);
      organizationalParentByRef.set(conceptRef, entityRef("module", module.id));
    } else {
      const parentRef = entityRef("concept", primaryParent.id);
      organizationalParentByRef.set(conceptRef, parentRef);
      organizationalChildrenByRef.set(parentRef, [
        ...(organizationalChildrenByRef.get(parentRef) ?? []),
        conceptRef,
      ]);
    }
  }
  for (const [moduleId, refs] of rootConceptRefsByModuleId) {
    organizationalChildrenByRef.set(entityRef("module", moduleId), refs);
  }

  const effectiveFieldsByConceptId = new Map<string, readonly EffectiveOntologyField[]>();
  const fieldProjectionStack: string[] = [];
  const projectEffectiveFields = (conceptId: string): readonly EffectiveOntologyField[] => {
    const cached = effectiveFieldsByConceptId.get(conceptId);
    if (cached) return cached;
    const cycleStart = fieldProjectionStack.indexOf(conceptId);
    if (cycleStart >= 0) {
      throw new Error(
        `Cannot derive effective fields through cyclic is_a path: ${[
          ...fieldProjectionStack.slice(cycleStart),
          conceptId,
        ].join(" -> ")}`,
      );
    }

    const concept = conceptsById.get(conceptId);
    if (!concept) throw new Error(`Cannot derive fields for missing concept ${conceptId}`);
    fieldProjectionStack.push(conceptId);
    const byFieldId = new Map<string, EffectiveOntologyField>();
    const signaturesByFieldId = new Map<string, string>();

    const mergeField = (candidate: EffectiveOntologyField): void => {
      const signature = fieldSemanticSignature(candidate.field);
      const existing = byFieldId.get(candidate.field.id);
      if (!existing) {
        byFieldId.set(candidate.field.id, candidate);
        signaturesByFieldId.set(candidate.field.id, signature);
        return;
      }
      if (signaturesByFieldId.get(candidate.field.id) !== signature) {
        if (
          existing.inheritanceDepth < candidate.inheritanceDepth &&
          isCompatibleFieldRefinement(existing.field, candidate.field)
        ) {
          return;
        }
        if (
          candidate.inheritanceDepth < existing.inheritanceDepth &&
          isCompatibleFieldRefinement(candidate.field, existing.field)
        ) {
          byFieldId.set(candidate.field.id, candidate);
          signaturesByFieldId.set(candidate.field.id, signature);
          return;
        }
        throw new Error(
          `Conflicting inherited field ${candidate.field.id} on ${conceptId}: ` +
          `${existing.declaredOnId} and ${candidate.declaredOnId} declare different semantics`,
        );
      }
      if (
        candidate.inheritanceDepth < existing.inheritanceDepth ||
        (candidate.inheritanceDepth === existing.inheritanceDepth &&
          candidate.declaredOnId.localeCompare(existing.declaredOnId) < 0)
      ) {
        byFieldId.set(candidate.field.id, candidate);
        signaturesByFieldId.set(candidate.field.id, signature);
      }
    };

    for (const field of concept.structure?.fields ?? []) {
      mergeField({ field, declaredOnId: concept.id, inheritanceDepth: 0 });
    }
    const parentIds = (outgoing.get(concept.id) ?? [])
      .filter(
        (relation) =>
          isCurrentStatus(relation.status) &&
          relation.predicate === "is_a" &&
          relation.relation_kind === "hierarchy",
      )
      .map(({ target_id: targetId }) => targetId)
      .sort((left, right) => left.localeCompare(right));
    for (const parentId of parentIds) {
      for (const inherited of projectEffectiveFields(parentId)) {
        mergeField({
          ...inherited,
          inheritanceDepth: inherited.inheritanceDepth + 1,
        });
      }
    }

    fieldProjectionStack.pop();
    const projected = Object.freeze(
      [...byFieldId.values()].sort(
        (left, right) =>
          left.inheritanceDepth - right.inheritanceDepth ||
          left.field.id.localeCompare(right.field.id),
      ),
    );
    effectiveFieldsByConceptId.set(conceptId, projected);
    return projected;
  };
  for (const concept of ontology.classes) projectEffectiveFields(concept.id);

  const semanticIncomingByRef = new Map<OntologyEntityRef, readonly CanonicalRelation[]>();
  const semanticOutgoingByRef = new Map<OntologyEntityRef, readonly CanonicalRelation[]>();
  const semanticDegreeByRef = new Map<OntologyEntityRef, number>();
  const directChildCountByRef = new Map<OntologyEntityRef, number>();
  for (const concept of ontology.classes) {
    const ref = entityRef("concept", concept.id);
    const semanticIncoming = (incoming.get(concept.id) ?? []).filter(
      ({ predicate, status }) => isCurrentStatus(status) && predicate !== "is_a",
    );
    const semanticOutgoing = (outgoing.get(concept.id) ?? []).filter(
      ({ predicate, status }) => isCurrentStatus(status) && predicate !== "is_a",
    );
    semanticIncomingByRef.set(ref, Object.freeze([...semanticIncoming]));
    semanticOutgoingByRef.set(ref, Object.freeze([...semanticOutgoing]));
    semanticDegreeByRef.set(
      ref,
      new Set([...semanticIncoming, ...semanticOutgoing].map(({ id }) => id)).size,
    );
    directChildCountByRef.set(ref, organizationalChildrenByRef.get(ref)?.length ?? 0);
  }
  for (const entity of entitiesByRef.values()) {
    if (entity.kind === "concept") continue;
    directChildCountByRef.set(
      entity.ref,
      organizationalChildrenByRef.get(entity.ref)?.length ?? 0,
    );
    semanticDegreeByRef.set(entity.ref, 0);
  }

  const moduleKeyNotionById = new Map<string, CanonicalConcept>();
  for (const module of ontology.modules) {
    const taxonomy = module.taxonomy_contract as typeof module.taxonomy_contract & {
      readonly key_root_concept_ids?: readonly string[];
    };
    const keyId = taxonomy.key_root_concept_ids?.[0];
    const keyConcept = keyId ? conceptsById.get(keyId) : undefined;
    if (keyConcept?.module_id === module.id) moduleKeyNotionById.set(module.id, keyConcept);
  }

  return {
    ontology,
    rootRef,
    entitiesByRef,
    planesById,
    modulesById,
    conceptsById,
    relationsById,
    sourcesById,
    examplesById,
    exampleOwnerEntityRefById,
    exampleOwnerRelationIdById,
    casePathsById,
    organizationalChildrenByRef,
    organizationalParentByRef,
    planeByModuleId,
    moduleByConceptId,
    rootConceptRefsByModuleId,
    primaryParentRelationByConceptId: primaryParents,
    additionalParentRelationsByConceptId: freezeMapArrays(additionalParents),
    directChildRelationsByConceptId: freezeMapArrays(directChildren),
    incomingRelationsByConceptId: freezeMapArrays(incoming),
    outgoingRelationsByConceptId: freezeMapArrays(outgoing),
    primaryBackboneChildrenByRef: freezeRefMapArrays(primaryBackboneChildren),
    secondaryBackboneChildrenByRef: freezeRefMapArrays(secondaryBackboneChildren),
    backboneParentByRef,
    semanticIncomingByRef,
    semanticOutgoingByRef,
    relationsByPredicate: freezeMapArrays(relationsByPredicate),
    directChildCountByRef,
    semanticDegreeByRef,
    moduleKeyNotionById,
    effectiveFieldsByConceptId,
    dataDiagnostics: Object.freeze([...dataDiagnostics]),
  };
};

export const ontologyEntityRef = entityRef;

export const localizedOntologyText = (
  value: LocalizedOntologyText | undefined,
  language: OntologyLanguage,
  fallback = "",
): string => value?.[language] ?? value?.en ?? value?.zh ?? value?.ja ?? fallback;

export const ontologyEntityLabel = (
  entity: IndexedOntologyEntity,
  language: OntologyLanguage,
): string => {
  return localizedOntologyText(entity.data.labels, language, entity.id);
};

export const ontologyEntityDefinition = (
  entity: IndexedOntologyEntity,
  language: OntologyLanguage,
): string => {
  const owner = entity.data;
  const shortDefinition = "short_definitions" in owner
    ? owner.short_definitions
    : undefined;
  return localizedOntologyText(
    shortDefinition ?? owner.definitions,
    language,
    entity.id,
  );
};

export const resolveCanonicalCasePath = (
  index: OntologyIndex,
  path: CanonicalCasePath,
): readonly ResolvedCanonicalCaseStep[] =>
  [...path.steps]
    .sort((left, right) => left.order - right.order)
    .map((step) => {
      const example = index.examplesById.get(step.case_fragment_example_id);
      const ownerEntityRef = index.exampleOwnerEntityRefById.get(
        step.case_fragment_example_id,
      );
      const ownerRelationId = index.exampleOwnerRelationIdById.get(
        step.case_fragment_example_id,
      );
      const traversalRelation = step.traversal_relation_id
        ? index.relationsById.get(step.traversal_relation_id)
        : undefined;
      const missingReferenceIds = [
        !example ? step.case_fragment_example_id : null,
        example && !ownerEntityRef && !ownerRelationId
          ? `${step.case_fragment_example_id}#owner`
          : null,
        ownerRelationId && !index.relationsById.has(ownerRelationId)
          ? ownerRelationId
          : null,
        step.traversal_relation_id && !traversalRelation
          ? step.traversal_relation_id
          : null,
      ].filter((value): value is string => Boolean(value));
      return {
        step,
        example,
        ownerEntityRef,
        ownerRelationId,
        traversalRelation,
        missingReferenceIds,
      };
    });

export const ontologyPrimaryPath = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
): readonly OntologyEntityRef[] => {
  const path: OntologyEntityRef[] = [];
  const visited = new Set<OntologyEntityRef>();
  let current: OntologyEntityRef | undefined = ref;
  while (current && !visited.has(current)) {
    path.unshift(current);
    visited.add(current);
    current = index.organizationalParentByRef.get(current);
  }
  return path;
};

/** Unified primary-backbone depth is independent from the directory ownership path. */
export const ontologyLogicalDepth = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
): number => {
  const entity = index.entitiesByRef.get(ref);
  if (!entity) return 0;
  if (entity.kind === "root") return 0;
  if (entity.kind === "plane") return 1;
  if (entity.kind === "module") return 2;

  let depth = 3;
  let currentRef = ref;
  const visited = new Set<OntologyEntityRef>();
  while (!visited.has(currentRef)) {
    visited.add(currentRef);
    const parentRef = index.backboneParentByRef.get(currentRef)?.parentRef;
    if (!parentRef?.startsWith("concept:")) break;
    depth += 1;
    currentRef = parentRef;
  }
  return depth;
};
