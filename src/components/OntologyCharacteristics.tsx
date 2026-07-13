import type { ReactNode } from "react";

import { uiText, type Language } from "../i18n/ui-text";
import {
  localizedOntologyText,
  ontologyEntityLabel,
  ontologyPrimaryPath,
  resolveCanonicalCasePath,
  type CanonicalConcept,
  type CanonicalCasePath,
  type CanonicalConstraint,
  type CanonicalExample,
  type CanonicalField,
  type CanonicalRelation,
  type CanonicalSourceClaim,
  type EffectiveOntologyField,
  type IndexedOntologyEntity,
  type LocalizedText,
  type OntologyEntityRef,
  type OntologyIndex,
} from "../lib/ontology-index";
import { deriveOntologyInformation } from "../lib/ontology-information-projection";
import type {
  RelationDetails,
  VisibleOntologyGraph,
} from "../lib/ontology-view-model";
import { DisclosureList } from "./DisclosureList";

export interface OntologyCharacteristicsProps {
  readonly index: OntologyIndex;
  readonly view: VisibleOntologyGraph;
  readonly language: Language;
  readonly focusedEntityRef: OntologyEntityRef;
  readonly focusedRelationId: string | null;
  readonly highlightedScenarioId: string | null;
  readonly onFocusEntity: (ref: OntologyEntityRef) => void;
  readonly onNavigateEntity: (ref: OntologyEntityRef) => void;
  readonly onFocusRelation: (relationId: string) => void;
  readonly onBackToNode: () => void;
  readonly onExpandAdjacent: (ref: OntologyEntityRef) => void;
  readonly onHighlightScenario: (scenarioId: string | null) => void;
}

/** Common information slots used by the one-table projection across entity kinds. */
interface OntologyInformationView {
  readonly id: string;
  readonly labels?: LocalizedText;
  readonly short_definitions?: LocalizedText;
  readonly definitions?: LocalizedText;
  readonly why_needed?: LocalizedText;
  readonly purpose?: LocalizedText;
  readonly includes?: readonly LocalizedText[];
  readonly excludes?: readonly LocalizedText[];
  readonly examples?: readonly CanonicalExample[];
  readonly source_claims?: readonly CanonicalSourceClaim[];
  readonly semantic_kind?: string | null;
  readonly applicability?: readonly string[];
  readonly structure?: CanonicalConcept["structure"];
  readonly external_mappings?: readonly unknown[];
  readonly competency_questions?: readonly unknown[];
  readonly hygiene_gates?: readonly unknown[];
  readonly interaction_contract?: unknown;
  readonly taxonomy_contract?: unknown;
  readonly status?: string;
  readonly review?: unknown;
  readonly introduced_in?: string;
  readonly deprecated_in?: string | null;
  readonly replaced_by_ids?: readonly string[];
  readonly deprecation_reason?: LocalizedText | null;
  readonly change_note?: LocalizedText;
}

const asRecord = (value: unknown): Readonly<Record<string, unknown>> =>
  value && typeof value === "object" ? (value as Readonly<Record<string, unknown>>) : {};

const arrayValue = <T,>(value: unknown): readonly T[] => (Array.isArray(value) ? value : []);

const localized = (value: unknown, language: Language, fallback = ""): string =>
  localizedOntologyText(value as LocalizedText | undefined, language, fallback);

const localizedInformation = (value: unknown, language: Language): unknown => {
  if (Array.isArray(value)) return value.map((item) => localizedInformation(item, language));
  if (!value || typeof value !== "object") return value;
  const record = value as Readonly<Record<string, unknown>>;
  if (["zh", "en", "ja"].some((key) => typeof record[key] === "string")) {
    return localized(record, language);
  }
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, localizedInformation(item, language)]),
  );
};

const safeExternalUrl = (value: string): string | null => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

const entityForConcept = (index: OntologyIndex, conceptId: string) =>
  index.entitiesByRef.get(`concept:${conceptId}`);

const EntityLink = ({
  entity,
  language,
  onFocus,
}: {
  readonly entity: IndexedOntologyEntity | undefined;
  readonly language: Language;
  readonly onFocus: (ref: OntologyEntityRef) => void;
}) =>
  entity ? (
    <button type="button" className="table-link" onClick={() => onFocus(entity.ref)}>
      {ontologyEntityLabel(entity, language)}
    </button>
  ) : (
    <span>{uiText[language].notApplicable}</span>
  );

const relationStatement = (
  index: OntologyIndex,
  relation: CanonicalRelation,
  language: Language,
): string => {
  const source = entityForConcept(index, relation.source_id);
  const target = entityForConcept(index, relation.target_id);
  return `${source ? ontologyEntityLabel(source, language) : relation.source_id} — ${localized(relation.labels, language, relation.predicate)} → ${target ? ontologyEntityLabel(target, language) : relation.target_id}`;
};

const RelationList = ({
  id,
  relations,
  index,
  language,
  onFocusRelation,
  focusableRelationIds,
  emptyText,
}: {
  readonly id: string;
  readonly relations: readonly CanonicalRelation[];
  readonly index: OntologyIndex;
  readonly language: Language;
  readonly onFocusRelation: (relationId: string) => void;
  readonly focusableRelationIds?: ReadonlySet<string>;
  readonly emptyText?: string;
}) => (
  <DisclosureList
    id={id}
    items={relations}
    language={language}
    emptyText={emptyText ?? uiText[language].noInformation}
    renderItem={(relation) => focusableRelationIds?.has(relation.id) === false
      ? (
          <span className="relation-link">
            <span>{relationStatement(index, relation, language)}</span>
            <small>{localized(relation.definitions, language, relation.id)}</small>
          </span>
        )
      : (
          <button type="button" className="table-link relation-link" onClick={() => onFocusRelation(relation.id)}>
            <span>{relationStatement(index, relation, language)}</span>
            <small>{localized(relation.definitions, language, relation.id)}</small>
          </button>
        )}
  />
);

const LocalizedList = ({
  id,
  values,
  language,
}: {
  readonly id: string;
  readonly values: readonly LocalizedText[];
  readonly language: Language;
}) => (
  <DisclosureList
    id={id}
    items={values}
    language={language}
    emptyText={uiText[language].noInformation}
    renderItem={(value) => localized(value, language)}
  />
);

const ExampleList = ({
  id,
  examples,
  index,
  language,
}: {
  readonly id: string;
  readonly examples: readonly CanonicalExample[];
  readonly index: OntologyIndex;
  readonly language: Language;
}) => {
  const text = uiText[language];
  return (
    <DisclosureList
      id={id}
      items={examples}
      language={language}
      emptyText={text.noInformation}
      className="detail-list example-list"
      renderItem={(example) => (
        <article className={`example-${example.kind === "positive" ? "positive" : "counterexample"}`}>
          <strong>{localized(example.labels, language, example.id)}</strong>
          <p>{localized(example.descriptions, language)}</p>
          <small>{example.synthetic ? text.syntheticExample : text.realExample} · {text.verifiedVersion}: {String(example.verified_version ?? text.notApplicable)}</small>
          {example.why_valid_or_invalid ? <p>{localized(example.why_valid_or_invalid, language)}</p> : null}
          <dl className="inline-facts">
            <div><dt>{text.scenario}</dt><dd>{example.scenario_id ?? text.notApplicable}</dd></div>
            <div><dt>{text.expectedResult}</dt><dd>{localized(example.expected_result, language, text.notApplicable)}</dd></div>
            <div><dt>{text.fieldValues}</dt><dd><code>{JSON.stringify(example.field_values ?? {})}</code></dd></div>
          </dl>
          <SourceClaimList id={`${id}-${example.id}-sources`} claims={example.source_claims ?? []} index={index} language={language} initialLimit={0} />
        </article>
      )}
    />
  );
};

const SourceClaimList = ({
  id,
  claims,
  index,
  language,
  initialLimit = 5,
}: {
  readonly id: string;
  readonly claims: readonly CanonicalSourceClaim[];
  readonly index: OntologyIndex;
  readonly language: Language;
  readonly initialLimit?: number;
}) => {
  const text = uiText[language];
  return (
    <DisclosureList
      id={id}
      items={claims}
      language={language}
      initialLimit={initialLimit}
      emptyText={text.noInformation}
      renderItem={(claim) => {
        const source = index.sourcesById.get(claim.source_id);
        const url = source ? safeExternalUrl(source.url) : null;
        return (
          <article className="source-claim">
            {url ? (
              <a className="source-claim-link" href={url} target="_blank" rel="noreferrer noopener">
                {source?.title ?? claim.source_id}
              </a>
            ) : (
              <strong>{source?.title ?? claim.source_id}</strong>
            )}
            <dl className="inline-facts">
              <div><dt>{text.year}</dt><dd>{source?.year || text.notApplicable}</dd></div>
              <div><dt>{text.authority}</dt><dd>{source?.source_type ?? text.notApplicable}</dd></div>
              <div><dt>{text.priority}</dt><dd>{source?.priority ?? text.notApplicable}</dd></div>
              <div><dt>URL</dt><dd>{url ? <a className="source-claim-url" href={url} target="_blank" rel="noreferrer noopener">{url}</a> : text.notApplicable}</dd></div>
              <div><dt>{text.locator}</dt><dd>{claim.locator}</dd></div>
              <div><dt>{text.supports}</dt><dd>{claim.supports}</dd></div>
            </dl>
          </article>
        );
      }}
    />
  );
};

const ReviewSummary = ({
  id,
  value,
  language,
}: {
  readonly id: string;
  readonly value: unknown;
  readonly language: Language;
}) => {
  const text = uiText[language];
  const review = asRecord(value);
  const reviewers = arrayValue<Readonly<Record<string, unknown>>>(review.reviewers);
  return (
    <dl className="stacked-facts review-summary">
      <div><dt>{text.status}</dt><dd>{String(review.review_status ?? text.notApplicable)}</dd></div>
      <div><dt>{text.reviewers}</dt><dd>
        <DisclosureList id={`${id}-reviewers`} items={reviewers} language={language} renderItem={(reviewer) => (
          <dl className="inline-facts">
            <div><dt>ID</dt><dd>{String(reviewer.reviewer_id ?? text.notApplicable)}</dd></div>
            <div><dt>{text.relationKind}</dt><dd>{String(reviewer.reviewer_role ?? reviewer.reviewer_kind ?? text.notApplicable)}</dd></div>
            <div><dt>{text.year}</dt><dd>{String(reviewer.reviewed_on ?? text.notApplicable)}</dd></div>
            <div><dt>{text.changeNote}</dt><dd>{localized(reviewer.decision_note, language, text.notApplicable)}</dd></div>
          </dl>
        )} />
      </dd></div>
    </dl>
  );
};

const FieldList = ({
  id,
  fields,
  index,
  language,
  onFocusEntity,
}: {
  readonly id: string;
  readonly fields: readonly EffectiveOntologyField[];
  readonly index: OntologyIndex;
  readonly language: Language;
  readonly onFocusEntity: (ref: OntologyEntityRef) => void;
}) => {
  const text = uiText[language];
  return (
    <DisclosureList
      id={id}
      items={fields}
      language={language}
      emptyText={text.noInformation}
      renderItem={({ field, declaredOnId, inheritanceDepth }) => (
        <table className="schema-field-table">
          <tbody>
            <tr><th>{localized(field.labels, language, field.id)}</th><td>{localized(field.definitions, language)}</td></tr>
            <tr><th>{text.declaredOn}</th><td><EntityLink entity={entityForConcept(index, declaredOnId)} language={language} onFocus={onFocusEntity} /></td></tr>
            <tr><th>{text.inheritanceDepth}</th><td>{inheritanceDepth}</td></tr>
            <tr><th>{text.fieldDatatype}</th><td>{field.datatype ?? text.notApplicable}</td></tr>
            <tr><th>{text.required}</th><td>{String(field.required ?? false)}</td></tr>
            <tr><th>{text.cardinality}</th><td>{JSON.stringify(field.cardinality ?? null)}</td></tr>
            <tr><th>{text.pattern}</th><td><code>{field.pattern ?? text.notApplicable}</code></td></tr>
            <tr><th>{text.exampleValue}</th><td><code>{JSON.stringify(field.example_value ?? null)}</code></td></tr>
            <tr><th>{text.allowedValues}</th><td>
              <DisclosureList id={`field-${field.id}-allowed-values`} items={field.allowed_values ?? []} language={language} renderItem={(item) => {
                const value = asRecord(item);
                return <article><strong>{localized(value.labels, language, String(value.id ?? value.value ?? text.notApplicable))}</strong><p>{localized(value.definitions, language)}</p><code>{JSON.stringify(value.value ?? null)}</code><SourceClaimList id={`field-${field.id}-value-${String(value.id ?? "value")}-sources`} claims={arrayValue<CanonicalSourceClaim>(value.source_claims)} index={index} language={language} initialLimit={0} /></article>;
              }} />
            </td></tr>
            <tr><th>{text.sourceClaims}</th><td><SourceClaimList id={`field-${field.id}-sources`} claims={field.source_claims ?? []} index={index} language={language} initialLimit={0} /></td></tr>
          </tbody>
        </table>
      )}
    />
  );
};

const ConstraintList = ({
  id,
  constraints,
  index,
  language,
}: {
  readonly id: string;
  readonly constraints: readonly CanonicalConstraint[];
  readonly index: OntologyIndex;
  readonly language: Language;
}) => {
  const text = uiText[language];
  return (
    <DisclosureList
      id={id}
      items={constraints}
      language={language}
      emptyText={text.noInformation}
      renderItem={(constraint) => (
        <article>
          <strong>{constraint.id}</strong>
          <p>{localized(constraint.explanations, language)}</p>
          <dl className="inline-facts">
            <div><dt>{text.severity}</dt><dd>{constraint.severity ?? text.notApplicable}</dd></div>
            <div><dt>{text.expressionLanguage}</dt><dd>{constraint.expression_language ?? text.notApplicable}</dd></div>
            <div><dt>{text.expression}</dt><dd><code>{constraint.expression ?? text.notApplicable}</code></dd></div>
          </dl>
          <SourceClaimList id={`constraint-${constraint.id}-sources`} claims={constraint.source_claims ?? []} index={index} language={language} initialLimit={0} />
        </article>
      )}
    />
  );
};

const caseStepContext = (index: OntologyIndex, exampleId: string) => {
  for (const path of index.casePathsById.values()) {
    const ordered = [...path.steps].sort((left, right) => left.order - right.order);
    const position = ordered.findIndex(
      ({ case_fragment_example_id: id }) => id === exampleId,
    );
    if (position < 0) continue;
    const previous = ordered[position - 1];
    const next = ordered[position + 1];
    return {
      path,
      step: ordered[position],
      previousOwner: previous
        ? index.exampleOwnerEntityRefById.get(previous.case_fragment_example_id)
        : undefined,
      nextOwner: next
        ? index.exampleOwnerEntityRefById.get(next.case_fragment_example_id)
        : undefined,
    };
  }
  return null;
};

const missingCasePathReferences = (
  index: OntologyIndex,
  path: CanonicalCasePath | undefined,
): readonly string[] => path
  ? [...new Set(
      resolveCanonicalCasePath(index, path).flatMap(
        ({ missingReferenceIds }) => missingReferenceIds,
      ),
    )]
  : [];

const DetailRow = ({
  order,
  title,
  children,
}: {
  readonly order: number;
  readonly title: string;
  readonly children: ReactNode;
}) => (
  <tr data-detail-row={order}>
    <th scope="row">{title}</th>
    <td>{children}</td>
  </tr>
);

const EntityDetailsRows = ({
  index,
  view,
  language,
  focusedEntityRef,
  highlightedScenarioId,
  onFocusEntity,
  onNavigateEntity,
  onFocusRelation,
  onExpandAdjacent,
  onHighlightScenario,
}: Omit<OntologyCharacteristicsProps, "focusedRelationId" | "onBackToNode">) => {
  const text = uiText[language];
  const details = view.details.kind === "entity" ? view.details : null;
  const entity = details?.entity ?? index.entitiesByRef.get(focusedEntityRef)!;
  const data = entity.data as unknown as OntologyInformationView;
  const path = ontologyPrimaryPath(index, entity.ref);
  const primary = entity.kind === "concept" ? index.primaryParentRelationByConceptId.get(entity.id) : undefined;
  const additional = entity.kind === "concept" ? index.additionalParentRelationsByConceptId.get(entity.id) ?? [] : [];
  const children = entity.kind === "concept" ? index.directChildRelationsByConceptId.get(entity.id) ?? [] : [];
  const primaryEntity = primary
    ? entityForConcept(index, primary.target_id)
    : index.entitiesByRef.get(index.organizationalParentByRef.get(entity.ref) ?? "");
  const directChildEntities =
    entity.kind === "concept"
      ? children.flatMap((relation) => {
          const child = entityForConcept(index, relation.source_id);
          return child ? [child] : [];
        })
      : (index.organizationalChildrenByRef.get(entity.ref) ?? []).flatMap((ref) => {
          const child = index.entitiesByRef.get(ref);
          return child ? [child] : [];
        });
  const examples = arrayValue<CanonicalExample>(data.examples);
  const positive = examples.filter(({ kind }) => kind === "positive");
  const counter = examples.filter(({ kind }) => kind === "counterexample" || kind === "boundary");
  const instances = examples.filter(({ kind }) => kind === "instance");
  const caseFragments = examples.filter(({ kind }) => kind === "case-fragment");
  const rootCasePaths = entity.kind === "root" ? [...index.casePathsById.values()] : [];
  const localFields: readonly EffectiveOntologyField[] = (
    details?.collections.localFields.items ?? arrayValue<CanonicalField>(data.structure?.fields)
  ).map((field) => ({
      field,
      declaredOnId: entity.id,
      inheritanceDepth: 0,
    }));
  const inheritedFields: readonly EffectiveOntologyField[] =
    details?.collections.inheritedFields.items ?? [];
  const effectiveFields: readonly EffectiveOntologyField[] =
    details?.collections.effectiveFields.items ?? localFields;
  const constraints = arrayValue<CanonicalConstraint>(
    details?.collections.constraints.items ?? data.structure?.constraints,
  );
  const requiredRelationConstraints = arrayValue<unknown>(data.structure?.required_relation_constraints);
  const mappings = arrayValue<unknown>(data.external_mappings);
  const competencyQuestions = arrayValue<unknown>(data.competency_questions);
  const hygieneGates = entity.kind === "root" ? arrayValue<unknown>(data.hygiene_gates) : [];
  const interactionContract = asRecord(data.interaction_contract);
  const taxonomyContract = asRecord(data.taxonomy_contract);
  const sourceClaims = arrayValue<CanonicalSourceClaim>(data.source_claims);
  const incoming = details?.collections.incomingRelations.items ?? [];
  const outgoing = details?.collections.outgoingRelations.items ?? [];
  const visibleRelationIds = new Set(view.edges.map(({ id }) => id));
  const derivedInformation = deriveOntologyInformation(index, entity);
  const rootMetadata = asRecord(index.ontology.artifact_metadata);
  const rootGeneratedFrom = arrayValue<string>(rootMetadata.generated_from);
  const rootMetadataFacts = Object.entries(rootMetadata).filter(
    ([key]) => key !== "generated_from",
  );
  const baseIri = String(
    rootMetadata.canonical_version ??
    "",
  );
  const entityIri = !baseIri
    ? entity.id
    : entity.kind === "root"
      ? baseIri
      : `${baseIri}${encodeURIComponent(entity.id)}`;
  const minimalJson = Object.fromEntries(
    effectiveFields
      .filter(({ field }) => field.required || data.structure?.identity_keys?.includes(field.id))
      .map(({ field }) => [field.id, field.example_value ?? null]),
  );

  return (
    <>
      <DetailRow order={1} title={text.logicalPosition}>
        <ol className="detail-breadcrumb">
          {path.map((ref) => {
            const pathEntity = index.entitiesByRef.get(ref);
            return pathEntity ? <li key={ref}><EntityLink entity={pathEntity} language={language} onFocus={onNavigateEntity} /></li> : null;
          })}
        </ol>
        <dl className="stacked-facts">
          <div><dt>{text.iri}</dt><dd><code>{entityIri}</code></dd></div>
          <div><dt>{text.semanticKind}</dt><dd>{String(data.semantic_kind ?? entity.kind)}</dd></div>
          <div><dt>{text.applicability}</dt><dd>{arrayValue<string>(data.applicability).join(", ") || text.notApplicable}</dd></div>
          <div><dt>{text.primaryParent}</dt><dd><EntityLink entity={primaryEntity} language={language} onFocus={onFocusEntity} /></dd></div>
          <div><dt>{text.additionalParents}</dt><dd><DisclosureList id="additional-parents" items={additional} language={language} renderItem={(relation) => <EntityLink entity={entityForConcept(index, relation.target_id)} language={language} onFocus={onFocusEntity} />} /></dd></div>
          <div><dt>{text.directChildren}</dt><dd><DisclosureList id="direct-children" items={directChildEntities} language={language} renderItem={(child) => <EntityLink entity={child} language={language} onFocus={onFocusEntity} />} /></dd></div>
        </dl>
        {view.hiddenAdjacentRefs.length > 0 ? <button type="button" className="detail-expand-adjacent" onClick={() => onExpandAdjacent(entity.ref)}>{text.expandAdjacentNodes(view.hiddenAdjacentRefs.length)}</button> : null}
      </DetailRow>
      <DetailRow order={2} title={text.definitionBoundary}>
        <dl className="stacked-facts">
          <div><dt>{text.shortDefinition}</dt><dd>{localized(data.short_definitions, language, text.notApplicable)}</dd></div>
          <div><dt>{text.formalDefinition}</dt><dd>{localized(data.definitions, language, text.notApplicable)}</dd></div>
          <div><dt>{text.whyNeeded}</dt><dd>{localized(data.why_needed ?? data.purpose, language, text.notApplicable)}</dd></div>
          <div><dt>{text.includes}</dt><dd><LocalizedList id="includes" values={arrayValue<LocalizedText>(data.includes)} language={language} /></dd></div>
          <div><dt>{text.excludes}</dt><dd><LocalizedList id="excludes" values={arrayValue<LocalizedText>(data.excludes)} language={language} /></dd></div>
          <div><dt>{text.confusedWith}</dt><dd><DisclosureList id="confused-with" items={derivedInformation.confusedWithEntities} language={language} emptyText={text.notApplicable} renderItem={(confused) => <EntityLink entity={confused} language={language} onFocus={onFocusEntity} />} /></dd></div>
        </dl>
      </DetailRow>
      <DetailRow order={3} title={text.semanticRelations}>
        <h4>{text.incomingRelations}</h4>
        <RelationList id="incoming-relations" relations={incoming} index={index} language={language} onFocusRelation={onFocusRelation} focusableRelationIds={visibleRelationIds} />
        <h4>{text.outgoingRelations}</h4>
        <RelationList id="outgoing-relations" relations={outgoing} index={index} language={language} onFocusRelation={onFocusRelation} focusableRelationIds={visibleRelationIds} />
      </DetailRow>
      <DetailRow order={4} title={text.engineeringExplanation}>
        <dl className="stacked-facts">
          <div><dt>{text.lifecyclePosition}</dt><dd>{localized(data.why_needed ?? data.purpose, language, text.notApplicable)}</dd></div>
          <div><dt>{text.solvesProblem}</dt><dd>{localized(data.definitions, language, text.notApplicable)}</dd></div>
          <div><dt>{text.typicalInput}</dt><dd><RelationList id="typical-input-relations" relations={derivedInformation.typicalInputRelations} index={index} language={language} onFocusRelation={onFocusRelation} focusableRelationIds={visibleRelationIds} emptyText={text.notApplicable} /></dd></div>
          <div><dt>{text.typicalOutput}</dt><dd><RelationList id="typical-output-relations" relations={derivedInformation.typicalOutputRelations} index={index} language={language} onFocusRelation={onFocusRelation} focusableRelationIds={visibleRelationIds} emptyText={text.notApplicable} /></dd></div>
          <div><dt>{text.interactionContract}</dt><dd>{Object.keys(interactionContract).length > 0 ? <pre><code>{JSON.stringify(localizedInformation(interactionContract, language), null, 2)}</code></pre> : text.notApplicable}</dd></div>
        </dl>
      </DetailRow>
      <DetailRow order={5} title={`${text.positiveExamples} / ${text.counterexamples}`}>
        <h4>{text.positiveExamples}</h4><ExampleList id="positive-examples" examples={positive} index={index} language={language} />
        <h4>{text.counterexamples}</h4><ExampleList id="counterexamples" examples={counter} index={index} language={language} />
      </DetailRow>
      <DetailRow order={6} title={text.instanceExamples}>
        {entity.kind === "plane" || entity.kind === "module" ? <p>{text.organizationalNodeInstanceNote}</p> : <ExampleList id="instance-examples" examples={instances} index={index} language={language} />}
      </DetailRow>
      <DetailRow order={7} title={text.structureConstraints}>
        <dl className="stacked-facts">
          <div><dt>{text.identityKeys}</dt><dd>{data.structure?.identity_keys?.join(", ") || text.notApplicable}</dd></div>
          <div><dt>{text.fields}</dt><dd>
            <h4>{text.localFields}</h4>
            <FieldList id="local-structure-fields" fields={localFields} index={index} language={language} onFocusEntity={onNavigateEntity} />
            <h4>{text.inheritedFields}</h4>
            <FieldList id="inherited-structure-fields" fields={inheritedFields} index={index} language={language} onFocusEntity={onNavigateEntity} />
          </dd></div>
          <div><dt>{text.minimumJson}</dt><dd><pre><code>{Object.keys(minimalJson).length > 0 ? JSON.stringify(minimalJson, null, 2) : text.notApplicable}</code></pre></dd></div>
          <div><dt>{text.requiredRelationConstraints}</dt><dd><DisclosureList id="required-relation-constraints" items={requiredRelationConstraints} language={language} emptyText={text.noInformation} renderItem={(item) => <code>{JSON.stringify(localizedInformation(item, language))}</code>} /></dd></div>
          <div><dt>{text.taxonomyContract}</dt><dd>{Object.keys(taxonomyContract).length > 0 ? <pre><code>{JSON.stringify(localizedInformation(taxonomyContract, language), null, 2)}</code></pre> : text.notApplicable}</dd></div>
        </dl>
      </DetailRow>
      <DetailRow order={8} title={text.validationRules}>
        <ConstraintList id="entity-validation-constraints" constraints={constraints} index={index} language={language} />
        <h4>{text.competencyQuestions}</h4>
        <DisclosureList id="competency-questions" items={competencyQuestions} language={language} emptyText={text.noInformation} renderItem={(item) => {
          const value = asRecord(item);
          return <article><strong>{localized(value.questions, language, String(value.id ?? text.notApplicable))}</strong><p><code>{String(value.query ?? text.notApplicable)}</code></p><p>{String(value.expected_assertion ?? text.notApplicable)}</p><SourceClaimList id={`competency-${String(value.id ?? "question")}-sources`} claims={arrayValue<CanonicalSourceClaim>(value.source_claims)} index={index} language={language} initialLimit={0} /></article>;
        }} />
      </DetailRow>
      <DetailRow order={9} title={text.caseFragments}>
        {entity.kind === "root" ? (
          <DisclosureList id="root-case-paths" items={rootCasePaths} language={language} emptyText={text.noInformation} renderItem={(path) => {
            const resolvedSteps = resolveCanonicalCasePath(index, path);
            const missingReferenceIds = missingCasePathReferences(index, path);
            const focusedStep = resolvedSteps.find(
              ({ ownerEntityRef }) => ownerEntityRef === focusedEntityRef,
            ) ?? resolvedSteps[0];
            return (
              <article className={path.id === highlightedScenarioId ? "case-path-highlight" : ""}>
                <strong>{localized(path.labels, language, path.id)}</strong>
                <p>{localized(path.descriptions, language)}</p>
                <p>{text.scenario}: {path.id} · {path.steps.length} {text.nextStep}</p>
                <DisclosureList id={`case-path-${path.id}-steps`} items={resolvedSteps} language={language} emptyText={text.noInformation} renderItem={({ step, example, ownerEntityRef, ownerRelationId }) => {
                   const ownerEntity = ownerEntityRef ? index.entitiesByRef.get(ownerEntityRef) : undefined;
                   const current = path.id === highlightedScenarioId && step.order === focusedStep?.step.order;
                   const ownerRelationIsVisible = Boolean(
                     ownerRelationId && visibleRelationIds.has(ownerRelationId),
                   );
                   const traversalRelationIsVisible = Boolean(
                     step.traversal_relation_id &&
                       visibleRelationIds.has(step.traversal_relation_id),
                   );
                   return <article className={current ? "case-path-highlight" : ""}><strong>{current ? `${text.currentStep}: ` : ""}{step.order}. {localized(example?.labels, language, example?.id ?? step.case_fragment_example_id)}</strong><p>{localized(example?.descriptions, language)}</p><dl className="inline-facts"><div><dt>{text.logicalPosition}</dt><dd>{ownerEntity ? <EntityLink entity={ownerEntity} language={language} onFocus={onNavigateEntity} /> : ownerRelationId ? ownerRelationIsVisible ? <button type="button" className="table-link" onClick={() => onFocusRelation(ownerRelationId)}>{ownerRelationId}</button> : <code>{ownerRelationId}</code> : text.notApplicable}</dd></div><div><dt>{text.semanticRelations}</dt><dd>{step.traversal_relation_id ? traversalRelationIsVisible ? <button type="button" className="table-link" onClick={() => onFocusRelation(step.traversal_relation_id!)}>{step.traversal_relation_id}</button> : <code>{step.traversal_relation_id}</code> : text.notApplicable}</dd></div></dl></article>;
                 }} />
                {missingReferenceIds.length > 0 ? <p role="alert">{text.caseReferenceError} <code>{missingReferenceIds.join(", ")}</code></p> : null}
                <SourceClaimList id={`case-path-${path.id}-sources`} claims={arrayValue<CanonicalSourceClaim>(path.source_claims)} index={index} language={language} initialLimit={0} />
                <ReviewSummary id={`case-path-${path.id}`} value={path.review} language={language} />
                <button type="button" className="table-link" disabled={missingReferenceIds.length > 0} onClick={() => onHighlightScenario(path.id === highlightedScenarioId ? null : path.id)}>{path.id === highlightedScenarioId ? text.clearCaseHighlight : text.highlightCase}</button>
              </article>
            );
          }} />
        ) : (
          <DisclosureList id="case-fragments" items={caseFragments} language={language} emptyText={text.noInformation} renderItem={(example) => {
            const context = caseStepContext(index, example.id);
            const missingReferenceIds = missingCasePathReferences(index, context?.path);
            const previous = context?.previousOwner
              ? index.entitiesByRef.get(context.previousOwner)
              : undefined;
            const next = context?.nextOwner
              ? index.entitiesByRef.get(context.nextOwner)
              : undefined;
            return (
              <article className={example.scenario_id === highlightedScenarioId ? "case-path-highlight" : ""}>
                <strong>{localized(example.labels, language, example.id)}</strong>
                <p>{localized(example.descriptions, language)}</p>
                <dl className="inline-facts">
                  <div><dt>{text.scenario}</dt><dd>{example.scenario_id ?? context?.path.id ?? text.notApplicable}</dd></div>
                  <div><dt>{text.currentStep}</dt><dd>{context?.step.order ?? text.notApplicable}</dd></div>
                  <div><dt>{text.previousStep}</dt><dd><EntityLink entity={previous} language={language} onFocus={onNavigateEntity} /></dd></div>
                  <div><dt>{text.nextStep}</dt><dd><EntityLink entity={next} language={language} onFocus={onNavigateEntity} /></dd></div>
                  <div><dt>{text.semanticRelations}</dt><dd>{context?.step.traversal_relation_id ?? text.notApplicable}</dd></div>
                </dl>
                {missingReferenceIds.length > 0 ? <p role="alert">{text.caseReferenceError} <code>{missingReferenceIds.join(", ")}</code></p> : null}
                <SourceClaimList id={`case-fragment-${example.id}-sources`} claims={example.source_claims ?? []} index={index} language={language} initialLimit={0} />
                {example.scenario_id ? <button type="button" className="table-link" disabled={missingReferenceIds.length > 0} onClick={() => onHighlightScenario(example.scenario_id === highlightedScenarioId ? null : example.scenario_id ?? null)}>{example.scenario_id === highlightedScenarioId ? text.clearCaseHighlight : text.highlightCase}</button> : null}
              </article>
            );
          }} />
        )}
      </DetailRow>
      <DetailRow order={10} title={text.externalMappings}>
        <DisclosureList id="external-mappings" items={mappings} language={language} emptyText={text.noInformation} renderItem={(mapping) => {
          const value = asRecord(mapping);
          const mappingId = String(value.id ?? "mapping");
          const targetIds = arrayValue<string>(value.canonical_target_ids);
          const conformance = asRecord(value.conformance);
          return (
            <article>
              <dl className="inline-facts">
                <div><dt>{text.source}</dt><dd>{String(value.system ?? text.notApplicable)}: {String(value.external_identifier ?? text.notApplicable)}</dd></div>
                <div><dt>{text.mappingVersion}</dt><dd>{String(value.external_version ?? text.notApplicable)}</dd></div>
                <div><dt>{text.mappingScope}</dt><dd>{localized(value.scope, language, text.notApplicable)}</dd></div>
                <div><dt>{text.mappingDirection}</dt><dd>{String(value.direction ?? text.notApplicable)}</dd></div>
                <div><dt>{text.mappingKind}</dt><dd>{String(value.mapping_kind ?? text.notApplicable)}</dd></div>
                <div><dt>{text.mappingLoss}</dt><dd>{localized(value.loss_notes, language, text.notApplicable)}</dd></div>
                <div><dt>{text.conversionNote}</dt><dd>{localized(value.conversion_note, language, text.notApplicable)}</dd></div>
                <div><dt>{text.targetConcept}</dt><dd><DisclosureList id={`${mappingId}-targets`} items={targetIds} language={language} emptyText={text.noInformation} renderItem={(targetId) => { const target = entityForConcept(index, targetId); return target ? <EntityLink entity={target} language={language} onFocus={onNavigateEntity} /> : <code>{targetId}</code>; }} /></dd></div>
                <div><dt>{text.status}</dt><dd>{String(value.status ?? text.notApplicable)}</dd></div>
              </dl>
              <h4>{text.mappingConformance}</h4>
              <dl className="inline-facts">
                <div><dt>{text.conformanceStatus}</dt><dd>{String(conformance.status ?? text.notApplicable)}</dd></div>
                <div><dt>{text.conformanceTestId}</dt><dd><code>{String(conformance.test_id ?? text.notApplicable)}</code></dd></div>
                <div><dt>{text.conformanceMethod}</dt><dd>{localized(conformance.method, language, text.notApplicable)}</dd></div>
              </dl>
              <SourceClaimList id={`${mappingId}-sources`} claims={arrayValue<CanonicalSourceClaim>(value.source_claims)} index={index} language={language} initialLimit={0} />
            </article>
          );
        }} />
      </DetailRow>
      <DetailRow order={11} title={text.sourceClaims}><SourceClaimList id="source-claims" claims={sourceClaims} index={index} language={language} /></DetailRow>
      <DetailRow order={12} title={text.maturityChanges}>
        <dl className="stacked-facts">
          <div><dt>{text.status}</dt><dd>{data.status ?? text.notApplicable}</dd></div>
          <div><dt>{text.versionIri}</dt><dd><code>{baseIri || text.notApplicable}</code></dd></div>
          <div><dt>{text.introduced}</dt><dd>{data.introduced_in ?? text.notApplicable}</dd></div>
          <div><dt>{text.deprecated}</dt><dd>{data.deprecated_in ?? text.notApplicable}</dd></div>
          <div><dt>{text.replacements}</dt><dd>{data.replaced_by_ids?.join(", ") || text.notApplicable}</dd></div>
          <div><dt>{text.deprecationReason}</dt><dd>{localized(data.deprecation_reason, language, text.notApplicable)}</dd></div>
          <div><dt>{text.changeNote}</dt><dd>{localized(data.change_note, language, text.notApplicable)}</dd></div>
        </dl>
        <h4>{text.review}</h4><ReviewSummary id="entity-review" value={data.review} language={language} />
        {entity.kind === "root" ? <><h4>{text.sourcesGovernance}</h4><dl className="inline-facts">{rootMetadataFacts.map(([key, value]) => <div key={key}><dt>{key}</dt><dd><code>{String(value)}</code></dd></div>)}</dl><DisclosureList id="generated-from" items={rootGeneratedFrom} language={language} emptyText={text.noInformation} renderItem={(value) => <code>{value}</code>} /><h4>{text.hygieneGates}</h4><DisclosureList id="hygiene-gates" items={hygieneGates} language={language} emptyText={text.noInformation} renderItem={(item) => { const value = asRecord(item); return <article><strong>{localized(value.labels, language, String(value.id ?? text.notApplicable))}</strong><p>{localized(value.descriptions, language)}</p><code>{String(value.expression ?? text.notApplicable)}</code><SourceClaimList id={`hygiene-${String(value.id ?? "gate")}-sources`} claims={arrayValue<CanonicalSourceClaim>(value.source_claims)} index={index} language={language} initialLimit={0} /></article>; }} /></> : null}
      </DetailRow>
    </>
  );
};

const relationExamples = (details: RelationDetails): readonly CanonicalExample[] =>
  arrayValue<CanonicalExample>(details.relation?.examples);

const RelationDetailsRows = ({
  index,
  view,
  language,
  highlightedScenarioId,
  onFocusEntity,
  onBackToNode,
  onHighlightScenario,
}: OntologyCharacteristicsProps) => {
  const text = uiText[language];
  const details = view.details as RelationDetails;
  const relation = details.relation;
  const edge = details.edge;
  const source = index.entitiesByRef.get(edge.source);
  const target = index.entitiesByRef.get(edge.target);
  const examples = relationExamples(details);
  const positive = examples.filter(({ kind }) => kind === "positive");
  const counter = examples.filter(({ kind }) => kind === "counterexample" || kind === "boundary");
  const instances = examples.filter(({ kind }) => kind === "instance");
  const cases = examples.filter(({ kind }) => kind === "case-fragment");
  const constraints = arrayValue<CanonicalConstraint>(relation?.constraints);
  const claims = arrayValue<CanonicalSourceClaim>(relation?.source_claims);
  const cardinality = relation?.cardinality
    ? JSON.stringify(relation.cardinality)
    : localized(relation?.cardinality_not_applicable_reason, language, text.notApplicable);
  const inverseReading = asRecord(relation?.inverse_reading);
  const inverseText = Object.keys(inverseReading).length > 0
    ? `${String(inverseReading.predicate ?? "")} — ${localized(inverseReading.labels, language, text.notApplicable)}`
    : text.notApplicable;
  const boundaryContext = asRecord(relation?.boundary_context);
  const artifactMetadata = asRecord(index.ontology.artifact_metadata);
  const versionIri = String(
    artifactMetadata.canonical_version ??
    text.notApplicable,
  );
  const relationName = relation
    ? localized(relation.labels, language, edge.predicate)
    : text.derivedRelationLabels[edge.predicate] ?? edge.predicate;
  const relationDefinition = relation
    ? localized(relation.definitions, language, text.notApplicable)
    : text.derivedRelationDefinitions[edge.predicate] ?? text.derivedRelation;
  const statement = `${source ? ontologyEntityLabel(source, language) : edge.source} — ${relationName} → ${target ? ontologyEntityLabel(target, language) : edge.target}`;

  return (
    <>
      <DetailRow order={1} title={text.logicalPosition}><button type="button" className="table-link back-to-node" onClick={onBackToNode}>{text.backToNode}</button><dl className="stacked-facts"><div><dt>{text.relationId}</dt><dd><code>{edge.id}</code></dd></div><div><dt>{text.relationKindLabel}</dt><dd>{edge.derived ? text.derivedRelation : text.canonicalRelation}</dd></div><div><dt>{text.status}</dt><dd>{relation?.status ?? text.derivedRelation}</dd></div><div><dt>{text.relationStatement}</dt><dd>{statement}</dd></div></dl></DetailRow>
      <DetailRow order={2} title={text.definitionBoundary}><p>{relationDefinition}</p><dl className="stacked-facts"><div><dt>{text.distinctFactRationale}</dt><dd>{localized(relation?.distinct_fact_rationale, language, text.notApplicable)}</dd></div></dl></DetailRow>
      <DetailRow order={3} title={text.semanticRelations}><dl className="stacked-facts"><div><dt>{text.direction}</dt><dd>{relation?.direction ?? "source-to-target"}</dd></div><div><dt>{text.relationKind}</dt><dd>{relation?.relation_kind ?? text.derivedRelation}</dd></div><div><dt>{text.source}</dt><dd><EntityLink entity={source} language={language} onFocus={onFocusEntity} /></dd></div><div><dt>{text.targetConcept}</dt><dd><EntityLink entity={target} language={language} onFocus={onFocusEntity} /></dd></div></dl></DetailRow>
      <DetailRow order={4} title={text.engineeringExplanation}><dl className="stacked-facts"><div><dt>{text.endpointRestrictions}</dt><dd>{relation ? `${relation.source_id} → ${relation.target_id}` : statement}</dd></div><div><dt>{text.temporalScope}</dt><dd>{String(relation?.temporal_scope ?? text.notApplicable)}</dd></div><div><dt>{text.boundaryContext}</dt><dd>{Object.keys(boundaryContext).length > 0 ? <pre><code>{JSON.stringify(localizedInformation(boundaryContext, language), null, 2)}</code></pre> : text.notApplicable}</dd></div></dl></DetailRow>
      <DetailRow order={5} title={`${text.positiveExamples} / ${text.counterexamples}`}><h4>{text.positiveExamples}</h4><ExampleList id="relation-positive" examples={positive} index={index} language={language} /><h4>{text.counterexamples}</h4><ExampleList id="relation-counter" examples={counter} index={index} language={language} /></DetailRow>
      <DetailRow order={6} title={text.instanceExamples}><ExampleList id="relation-instances" examples={instances} index={index} language={language} /></DetailRow>
      <DetailRow order={7} title={text.structureConstraints}><dl className="stacked-facts"><div><dt>{text.cardinality}</dt><dd><code>{cardinality}</code></dd></div><div><dt>{text.inverseReading}</dt><dd>{inverseText}</dd></div></dl></DetailRow>
      <DetailRow order={8} title={text.validationRules}><ConstraintList id="relation-validation-constraints" constraints={constraints} index={index} language={language} /><h4>{text.conditions}</h4><ConstraintList id="relation-conditions" constraints={arrayValue<CanonicalConstraint>(relation?.conditions)} index={index} language={language} /></DetailRow>
      <DetailRow order={9} title={text.caseFragments}><DisclosureList id="relation-cases" items={cases} language={language} emptyText={text.noInformation} renderItem={(example) => {
        const context = caseStepContext(index, example.id);
        const missingReferenceIds = missingCasePathReferences(index, context?.path);
        return <article className={example.scenario_id === highlightedScenarioId ? "case-path-highlight" : ""}><strong>{localized(example.labels, language, example.id)}</strong><p>{localized(example.descriptions, language)}</p><dl className="inline-facts"><div><dt>{text.currentStep}</dt><dd>{context?.step.order ?? text.notApplicable}</dd></div><div><dt>{text.semanticRelations}</dt><dd>{context?.step.traversal_relation_id ?? text.notApplicable}</dd></div></dl>{missingReferenceIds.length > 0 ? <p role="alert">{text.caseReferenceError} <code>{missingReferenceIds.join(", ")}</code></p> : null}<SourceClaimList id={`relation-case-${example.id}-sources`} claims={example.source_claims ?? []} index={index} language={language} initialLimit={0} />{example.scenario_id ? <button type="button" className="table-link" disabled={missingReferenceIds.length > 0} onClick={() => onHighlightScenario(example.scenario_id === highlightedScenarioId ? null : example.scenario_id ?? null)}>{example.scenario_id === highlightedScenarioId ? text.clearCaseHighlight : text.highlightCase}</button> : null}</article>;
      }} /></DetailRow>
      <DetailRow order={10} title={text.externalMappings}><p>{text.notApplicable}</p></DetailRow>
      <DetailRow order={11} title={text.sourceClaims}><SourceClaimList id="relation-sources" claims={claims} index={index} language={language} /></DetailRow>
      <DetailRow order={12} title={text.maturityChanges}><dl className="stacked-facts"><div><dt>{text.status}</dt><dd>{relation?.status ?? text.derivedRelation}</dd></div><div><dt>{text.versionIri}</dt><dd><code>{versionIri}</code></dd></div><div><dt>{text.introduced}</dt><dd>{relation?.introduced_in ?? text.notApplicable}</dd></div><div><dt>{text.deprecated}</dt><dd>{relation?.deprecated_in ?? text.notApplicable}</dd></div><div><dt>{text.replacements}</dt><dd>{relation?.replaced_by_ids?.join(", ") || text.notApplicable}</dd></div><div><dt>{text.deprecationReason}</dt><dd>{localized(relation?.deprecation_reason, language, text.notApplicable)}</dd></div><div><dt>{text.changeNote}</dt><dd>{localized(relation?.change_note, language, text.notApplicable)}</dd></div></dl><h4>{text.review}</h4><ReviewSummary id="relation-review" value={relation?.review} language={language} /></DetailRow>
    </>
  );
};

export const OntologyCharacteristics = (props: OntologyCharacteristicsProps) => {
  const { view, language } = props;
  const text = uiText[language];
  return (
    <section className="ontology-characteristics" data-testid="ontology-characteristics">
      <h3>{text.details}</h3>
      <table>
        <tbody>
          {view.details.kind === "relation" ? <RelationDetailsRows {...props} /> : <EntityDetailsRows {...props} />}
        </tbody>
      </table>
    </section>
  );
};
