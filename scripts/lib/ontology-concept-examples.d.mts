export function enrichConceptExamplesWithRelations<
  TConcept extends Readonly<Record<string, any>>,
  TRelation extends Readonly<Record<string, any>>,
>(input: {
  concepts: readonly TConcept[];
  relations: readonly TRelation[];
}): TConcept[];
