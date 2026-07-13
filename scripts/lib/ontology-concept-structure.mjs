const emptyStructure = () => ({
  identity_keys: [],
  fields: [],
  constraints: [],
  required_relation_constraints: [],
});

const stableValue = (value) => JSON.stringify(value);

const sameValue = (left, right) => stableValue(left) === stableValue(right);

const upperBoundIsNoBroader = (child, parent) =>
  parent === null || (child !== null && child <= parent);

const fieldOverrideIsCompatible = (parent, child) => {
  if (parent.datatype !== child.datatype) return false;
  if (parent.required && !child.required) return false;
  if (child.cardinality.min < parent.cardinality.min) return false;
  if (!upperBoundIsNoBroader(child.cardinality.max, parent.cardinality.max)) return false;
  if (parent.pattern && child.pattern !== parent.pattern) return false;
  if ((parent.allowed_values?.length ?? 0) > 0) {
    const parentValues = new Set(parent.allowed_values.map(({ value }) => stableValue(value)));
    const childValues = new Set(child.allowed_values.map(({ value }) => stableValue(value)));
    if (childValues.size === 0 || [...childValues].some((value) => !parentValues.has(value))) {
      return false;
    }
  }
  return true;
};

const mergeInheritedRecords = ({ ownerId, kind, target, values }) => {
  for (const value of values) {
    const current = target.get(value.id);
    if (current && !sameValue(current, value)) {
      throw new Error(
        `Concept ${ownerId} inherits conflicting ${kind} ${value.id} through multiple is_a parents`,
      );
    }
    if (!current) target.set(value.id, structuredClone(value));
  }
};

const mergeLocalFields = ({ ownerId, target, fields }) => {
  for (const field of fields) {
    const inherited = target.get(field.id);
    if (inherited && !sameValue(inherited, field) && !fieldOverrideIsCompatible(inherited, field)) {
      throw new Error(
        `Concept ${ownerId} local field ${field.id} weakens or conflicts with its inherited contract`,
      );
    }
    target.set(field.id, structuredClone(field));
  }
};

const mergeLocalRecords = ({ ownerId, kind, target, values }) => {
  for (const value of values) {
    const inherited = target.get(value.id);
    if (inherited && !sameValue(inherited, value)) {
      throw new Error(
        `Concept ${ownerId} local ${kind} ${value.id} conflicts with its inherited contract`,
      );
    }
    target.set(value.id, structuredClone(value));
  }
};

export const buildEffectiveConceptStructures = (canonical) => {
  const conceptById = new Map(canonical.classes.map((concept) => [concept.id, concept]));
  const parentsById = new Map(canonical.classes.map(({ id }) => [id, []]));
  for (const relation of canonical.relations) {
    if (relation.predicate !== "is_a" || relation.status === "deprecated") continue;
    if (conceptById.has(relation.source_id) && conceptById.has(relation.target_id)) {
      parentsById.get(relation.source_id).push(relation.target_id);
    }
  }
  for (const parents of parentsById.values()) parents.sort((left, right) => left.localeCompare(right));

  const effectiveById = new Map();
  const visiting = new Set();
  const resolveStructure = (conceptId) => {
    if (effectiveById.has(conceptId)) return effectiveById.get(conceptId);
    if (visiting.has(conceptId)) {
      throw new Error(`Cannot derive effective structure through cyclic is_a path at ${conceptId}`);
    }
    visiting.add(conceptId);
    const concept = conceptById.get(conceptId);
    if (!concept) throw new Error(`Cannot derive effective structure for missing Concept ${conceptId}`);
    const fields = new Map();
    const constraints = new Map();
    const requiredRelationConstraints = new Map();
    const identityKeys = new Set();

    for (const parentId of parentsById.get(conceptId) ?? []) {
      const parent = resolveStructure(parentId);
      parent.identity_keys.forEach((id) => identityKeys.add(id));
      mergeInheritedRecords({
        ownerId: conceptId,
        kind: "field",
        target: fields,
        values: parent.fields,
      });
      mergeInheritedRecords({
        ownerId: conceptId,
        kind: "constraint",
        target: constraints,
        values: parent.constraints,
      });
      mergeInheritedRecords({
        ownerId: conceptId,
        kind: "required relation constraint",
        target: requiredRelationConstraints,
        values: parent.required_relation_constraints,
      });
    }

    const local = concept.structure ?? emptyStructure();
    local.identity_keys.forEach((id) => identityKeys.add(id));
    mergeLocalFields({ ownerId: conceptId, target: fields, fields: local.fields });
    mergeLocalRecords({
      ownerId: conceptId,
      kind: "constraint",
      target: constraints,
      values: local.constraints,
    });
    mergeLocalRecords({
      ownerId: conceptId,
      kind: "required relation constraint",
      target: requiredRelationConstraints,
      values: local.required_relation_constraints,
    });

    const unresolvedIdentityKeys = [...identityKeys].filter((id) => !fields.has(id));
    if (unresolvedIdentityKeys.length > 0) {
      throw new Error(
        `Concept ${conceptId} effective identity keys do not resolve to fields: ${unresolvedIdentityKeys.join(", ")}`,
      );
    }
    const effective = {
      identity_keys: [...identityKeys],
      fields: [...fields.values()],
      constraints: [...constraints.values()],
      required_relation_constraints: [...requiredRelationConstraints.values()],
    };
    visiting.delete(conceptId);
    effectiveById.set(conceptId, effective);
    return effective;
  };

  for (const conceptId of conceptById.keys()) resolveStructure(conceptId);
  return effectiveById;
};
