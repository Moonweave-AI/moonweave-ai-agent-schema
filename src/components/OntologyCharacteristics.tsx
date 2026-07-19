import type { ReactNode } from "react";

import { uiText, type Language } from "../i18n/ui-text";
import { isDefaultVisibleOntologyRelation } from "../lib/ontology-default-visibility";
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
  readonly engineering?: unknown;
  readonly hygiene_gates?: readonly unknown[];
  readonly interaction_contract?: unknown;
  readonly taxonomy_contract?: unknown;
  readonly status?: string;
  readonly review?: unknown;
}

const asRecord = (value: unknown): Readonly<Record<string, unknown>> =>
  value && typeof value === "object" ? (value as Readonly<Record<string, unknown>>) : {};

const arrayValue = <T,>(value: unknown): readonly T[] => (Array.isArray(value) ? value : []);

const localized = (value: unknown, language: Language, fallback = ""): string =>
  localizedOntologyText(value as LocalizedText | undefined, language, fallback);

const displayText = (value: unknown, language: Language, fallback = ""): string =>
  typeof value === "string" ? value : localized(value, language, fallback);

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
        <article className={`example-${example.kind}`}>
          <strong>{localized(example.labels, language, example.id)}</strong>
          <p>{localized(example.descriptions, language)}</p>
          {example.why_valid_or_invalid ? <p><strong>{text.exampleRationale}: </strong>{localized(example.why_valid_or_invalid, language)}</p> : null}
          <small>{example.synthetic ? text.syntheticExample : text.realExample}</small>
          <SourceClaimList id={`${id}-${example.id}-sources`} claims={example.source_claims ?? []} index={index} language={language} initialLimit={0} />
        </article>
      )}
    />
  );
};

const engineeringFormat = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return null;
  return JSON.stringify(value, null, 2);
};

const EngineeringPayloadList = ({
  id,
  entries,
  language,
}: {
  readonly id: string;
  readonly entries: readonly unknown[];
  readonly language: Language;
}) => {
  const text = uiText[language];
  return (
    <DisclosureList
      id={id}
      items={entries}
      language={language}
      emptyText={text.noInformation}
      renderItem={(entry) => {
        const payload = asRecord(entry);
        const description = displayText(
          payload.description ?? payload.label ?? payload.name,
          language,
          text.noInformation,
        );
        const format = engineeringFormat(payload.format ?? payload.example ?? payload.schema);
        return (
          <article className="engineering-payload">
            <strong>{description}</strong>
            {format ? <pre><code>{format}</code></pre> : null}
          </article>
        );
      }}
    />
  );
};

const ReferenceImplementationList = ({
  id,
  entries,
  language,
}: {
  readonly id: string;
  readonly entries: readonly unknown[];
  readonly language: Language;
}) => {
  const text = uiText[language];
  return (
    <DisclosureList
      id={id}
      items={entries}
      language={language}
      emptyText={text.noInformation}
      renderItem={(entry) => {
        const reference = asRecord(entry);
        const name = displayText(reference.name, language, text.noInformation);
        const description = displayText(reference.description, language);
        const url = typeof reference.url === "string" ? safeExternalUrl(reference.url) : null;
        return (
          <article className="reference-implementation">
            {url ? <a href={url} target="_blank" rel="noreferrer noopener">{name}</a> : <strong>{name}</strong>}
            {description ? <p>{description}</p> : null}
            {url ? <a href={url} target="_blank" rel="noreferrer noopener">{url}</a> : null}
          </article>
        );
      }}
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
            <tr><th>{text.sourcesAndReferences}</th><td><SourceClaimList id={`field-${field.id}-sources`} claims={field.source_claims ?? []} index={index} language={language} initialLimit={0} /></td></tr>
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
  const primaryBackbone = entity.kind === "concept"
    ? index.backboneParentByRef.get(entity.ref)
    : undefined;
  const primaryCandidate = primaryBackbone?.relation;
  const primary = primaryCandidate && isDefaultVisibleOntologyRelation(index, primaryCandidate)
    ? primaryCandidate
    : undefined;
  const additional = entity.kind === "concept"
    ? (index.additionalParentRelationsByConceptId.get(entity.id) ?? [])
      .filter((relation) => isDefaultVisibleOntologyRelation(index, relation))
    : [];
  const children = entity.kind === "concept"
    ? (index.primaryBackboneChildrenByRef.get(entity.ref) ?? [])
      .filter(({ relation }) => isDefaultVisibleOntologyRelation(index, relation))
    : [];
  const primaryEntity = primary
    ? index.entitiesByRef.get(primaryBackbone?.parentRef ?? "")
    : index.entitiesByRef.get(index.organizationalParentByRef.get(entity.ref) ?? "");
  const directChildEntities =
    entity.kind === "concept"
      ? children.flatMap(({ childRef }) => {
          const child = index.entitiesByRef.get(childRef);
          return child ? [child] : [];
        })
      : (index.organizationalChildrenByRef.get(entity.ref) ?? []).flatMap((ref) => {
          const child = index.entitiesByRef.get(ref);
          return child?.data.status !== "deprecated" ? [child] : [];
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
  const engineering = asRecord(data.engineering);
  const typicalInputs = arrayValue<unknown>(engineering.typical_input);
  const typicalOutputs = arrayValue<unknown>(engineering.typical_output);
  const referenceImplementations = arrayValue<unknown>(engineering.reference_implementations);
  const taxonomyContract = asRecord(data.taxonomy_contract);
  const sourceClaims = arrayValue<CanonicalSourceClaim>(data.source_claims);
  const incoming = details?.collections.incomingRelations.items ?? [];
  const outgoing = details?.collections.outgoingRelations.items ?? [];
  const visibleRelationIds = new Set(view.edges.map(({ id }) => id));
  const derivedInformation = deriveOntologyInformation(index, entity);
  const rootMetadata = asRecord(index.ontology.artifact_metadata);
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
        <p>{displayText(engineering.explanation, language, text.noInformation)}</p>
        <dl className="stacked-facts">
          <div><dt>{text.typicalInput}</dt><dd><EngineeringPayloadList id="typical-input" entries={typicalInputs} language={language} /></dd></div>
          <div><dt>{text.typicalOutput}</dt><dd><EngineeringPayloadList id="typical-output" entries={typicalOutputs} language={language} /></dd></div>
          <div><dt>{text.referenceImplementations}</dt><dd><ReferenceImplementationList id="reference-implementations" entries={referenceImplementations} language={language} /></dd></div>
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
          <div><dt>{text.constraints}</dt><dd><ConstraintList id="entity-structure-constraints" constraints={constraints} index={index} language={language} /></dd></div>
          <div><dt>{text.taxonomyContract}</dt><dd>{Object.keys(taxonomyContract).length > 0 ? <pre><code>{JSON.stringify(localizedInformation(taxonomyContract, language), null, 2)}</code></pre> : text.notApplicable}</dd></div>
        </dl>
      </DetailRow>
      <DetailRow order={8} title={text.caseFragments}>
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
      <DetailRow order={9} title={text.sourcesAndReferences}><SourceClaimList id="source-claims" claims={sourceClaims} index={index} language={language} /></DetailRow>
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
  const relationName = relation
    ? localized(relation.labels, language, edge.predicate)
    : text.derivedRelationLabels[edge.predicate] ?? edge.predicate;
  const relationDefinition = relation
    ? localized(relation.definitions, language, text.notApplicable)
    : text.derivedRelationDefinitions[edge.predicate] ?? text.derivedRelation;
  const statement = `${source ? ontologyEntityLabel(source, language) : edge.source} — ${relationName} → ${target ? ontologyEntityLabel(target, language) : edge.target}`;

  return (
    <>
      <DetailRow order={1} title={text.logicalPosition}><button type="button" className="table-link back-to-node" onClick={onBackToNode}>{text.backToNode}</button><dl className="stacked-facts"><div><dt>{text.relationId}</dt><dd><code>{edge.id}</code></dd></div><div><dt>{text.relationKindLabel}</dt><dd>{edge.derived ? text.derivedRelation : text.canonicalRelation}</dd></div><div><dt>{text.relationStatement}</dt><dd>{statement}</dd></div></dl></DetailRow>
      <DetailRow order={2} title={text.definitionBoundary}><p>{relationDefinition}</p><dl className="stacked-facts"><div><dt>{text.distinctFactRationale}</dt><dd>{localized(relation?.distinct_fact_rationale, language, text.notApplicable)}</dd></div></dl></DetailRow>
      <DetailRow order={3} title={text.semanticRelations}><dl className="stacked-facts"><div><dt>{text.direction}</dt><dd>{relation?.direction ?? "source-to-target"}</dd></div><div><dt>{text.relationKind}</dt><dd>{relation?.relation_kind ?? text.derivedRelation}</dd></div><div><dt>{text.source}</dt><dd><EntityLink entity={source} language={language} onFocus={onFocusEntity} /></dd></div><div><dt>{text.targetConcept}</dt><dd><EntityLink entity={target} language={language} onFocus={onFocusEntity} /></dd></div></dl></DetailRow>
      <DetailRow order={4} title={text.engineeringExplanation}><dl className="stacked-facts"><div><dt>{text.endpointRestrictions}</dt><dd>{relation ? `${relation.source_id} → ${relation.target_id}` : statement}</dd></div><div><dt>{text.temporalScope}</dt><dd>{String(relation?.temporal_scope ?? text.notApplicable)}</dd></div><div><dt>{text.boundaryContext}</dt><dd>{Object.keys(boundaryContext).length > 0 ? <pre><code>{JSON.stringify(localizedInformation(boundaryContext, language), null, 2)}</code></pre> : text.notApplicable}</dd></div></dl></DetailRow>
      <DetailRow order={5} title={`${text.positiveExamples} / ${text.counterexamples}`}><h4>{text.positiveExamples}</h4><ExampleList id="relation-positive" examples={positive} index={index} language={language} /><h4>{text.counterexamples}</h4><ExampleList id="relation-counter" examples={counter} index={index} language={language} /></DetailRow>
      <DetailRow order={6} title={text.instanceExamples}><ExampleList id="relation-instances" examples={instances} index={index} language={language} /></DetailRow>
      <DetailRow order={7} title={text.structureConstraints}><dl className="stacked-facts"><div><dt>{text.cardinality}</dt><dd><code>{cardinality}</code></dd></div><div><dt>{text.inverseReading}</dt><dd>{inverseText}</dd></div><div><dt>{text.constraints}</dt><dd><ConstraintList id="relation-structure-constraints" constraints={constraints} index={index} language={language} /></dd></div><div><dt>{text.conditions}</dt><dd><ConstraintList id="relation-conditions" constraints={arrayValue<CanonicalConstraint>(relation?.conditions)} index={index} language={language} /></dd></div></dl></DetailRow>
      <DetailRow order={8} title={text.caseFragments}><DisclosureList id="relation-cases" items={cases} language={language} emptyText={text.noInformation} renderItem={(example) => {
        const context = caseStepContext(index, example.id);
        const missingReferenceIds = missingCasePathReferences(index, context?.path);
        return <article className={example.scenario_id === highlightedScenarioId ? "case-path-highlight" : ""}><strong>{localized(example.labels, language, example.id)}</strong><p>{localized(example.descriptions, language)}</p><dl className="inline-facts"><div><dt>{text.currentStep}</dt><dd>{context?.step.order ?? text.notApplicable}</dd></div><div><dt>{text.semanticRelations}</dt><dd>{context?.step.traversal_relation_id ?? text.notApplicable}</dd></div></dl>{missingReferenceIds.length > 0 ? <p role="alert">{text.caseReferenceError} <code>{missingReferenceIds.join(", ")}</code></p> : null}<SourceClaimList id={`relation-case-${example.id}-sources`} claims={example.source_claims ?? []} index={index} language={language} initialLimit={0} />{example.scenario_id ? <button type="button" className="table-link" disabled={missingReferenceIds.length > 0} onClick={() => onHighlightScenario(example.scenario_id === highlightedScenarioId ? null : example.scenario_id ?? null)}>{example.scenario_id === highlightedScenarioId ? text.clearCaseHighlight : text.highlightCase}</button> : null}</article>;
      }} /></DetailRow>
      <DetailRow order={9} title={text.sourcesAndReferences}><SourceClaimList id="relation-sources" claims={claims} index={index} language={language} /></DetailRow>
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
