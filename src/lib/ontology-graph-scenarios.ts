import {
  resolveCanonicalCasePath,
  type OntologyEntityRef,
  type OntologyIndex,
} from "./ontology-index";
import type { VisibleOntologyGraph } from "./ontology-view-model";

export interface GraphScenarioHighlights {
  readonly nodeRefs: ReadonlySet<OntologyEntityRef>;
  readonly relationIds: ReadonlySet<string>;
}

const scenarioMatches = (
  index: OntologyIndex,
  scenarioId: string,
  path: OntologyIndex["casePathsById"] extends ReadonlyMap<string, infer Path> ? Path : never,
) => path.id === scenarioId || path.steps.some(
  (step) => index.examplesById.get(step.case_fragment_example_id)?.scenario_id === scenarioId,
);

export const graphScenarioHighlights = (
  index: OntologyIndex,
  scenarioId?: string | null,
): GraphScenarioHighlights => {
  const nodeRefs = new Set<OntologyEntityRef>();
  const relationIds = new Set<string>();
  if (!scenarioId) return { nodeRefs, relationIds };

  for (const path of index.casePathsById.values()) {
    if (!scenarioMatches(index, scenarioId, path)) continue;
    for (const step of path.steps) {
      const owner = index.exampleOwnerEntityRefById.get(step.case_fragment_example_id);
      if (owner) nodeRefs.add(owner);
      const ownerRelation = index.exampleOwnerRelationIdById.get(step.case_fragment_example_id);
      if (ownerRelation) relationIds.add(ownerRelation);
      if (step.traversal_relation_id) relationIds.add(step.traversal_relation_id);
    }
  }
  return { nodeRefs, relationIds };
};

export const hiddenScenarioStepCount = (
  index: OntologyIndex,
  view: VisibleOntologyGraph,
  scenarioId?: string | null,
): number => {
  if (!scenarioId) return 0;
  const visibleRefs = new Set(view.nodes.map(({ ref }) => ref));
  const visibleRelationIds = new Set(view.edges.map(({ id }) => id));
  const hiddenSteps = new Set<string>();

  for (const path of index.casePathsById.values()) {
    if (!scenarioMatches(index, scenarioId, path)) continue;
    for (const resolved of resolveCanonicalCasePath(index, path)) {
      const hidden = resolved.missingReferenceIds.length > 0 ||
        Boolean(resolved.ownerEntityRef && !visibleRefs.has(resolved.ownerEntityRef)) ||
        Boolean(resolved.ownerRelationId && !visibleRelationIds.has(resolved.ownerRelationId)) ||
        Boolean(
          resolved.step.traversal_relation_id &&
          !visibleRelationIds.has(resolved.step.traversal_relation_id),
        );
      if (hidden) hiddenSteps.add(`${path.id}:${resolved.step.order}`);
    }
  }
  return hiddenSteps.size;
};
