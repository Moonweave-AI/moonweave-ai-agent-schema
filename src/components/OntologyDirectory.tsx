import { useMemo } from "react";

import { uiText, type Language } from "../i18n/ui-text";
import {
  defaultVisibleOntologyChildren,
  isDefaultVisibleOntologyEntity,
} from "../lib/ontology-default-visibility";
import {
  localizedOntologyText,
  ontologyEntityDefinition,
  ontologyEntityLabel,
  type IndexedOntologyEntity,
  type LocalizedText,
  type OntologyEntityRef,
  type OntologyIndex,
} from "../lib/ontology-index";

export interface OntologyDirectoryProps {
  readonly index: OntologyIndex;
  readonly language: Language;
  readonly graphRootRef: OntologyEntityRef;
  readonly focusedEntityRef: OntologyEntityRef;
  readonly expandedRefs: ReadonlySet<OntologyEntityRef>;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (query: string) => void;
  readonly onNavigate: (ref: OntologyEntityRef) => void;
  readonly onToggleExpanded: (ref: OntologyEntityRef) => void;
}

const kindText = (entity: IndexedOntologyEntity, language: Language): string => {
  const text = uiText[language];
  if (entity.kind === "root") return text.ontologyKind;
  if (entity.kind === "plane") return text.planeKind;
  if (entity.kind === "module") return text.moduleKind;
  return text.conceptKind;
};

const searchableText = (
  index: OntologyIndex,
  entity: IndexedOntologyEntity,
  language: Language,
): string => {
  const data = entity.data as unknown as Record<string, unknown>;
  const claims = Array.isArray(data.source_claims) ? data.source_claims : [];
  const sourceParts = claims.flatMap((claim) => {
    if (!claim || typeof claim !== "object") return [];
    const claimData = claim as {
      readonly source_id?: unknown;
      readonly supports?: unknown;
      readonly locator?: unknown;
    };
    const sourceId = claimData.source_id;
    if (typeof sourceId !== "string") return [];
    const source = index.sourcesById.get(sourceId);
    return [
      sourceId,
      source?.title ?? "",
      source?.year ?? "",
      source?.source_type ?? "",
      String(claimData.supports ?? ""),
      String(claimData.locator ?? ""),
    ];
  });
  const examples = Array.isArray(data.examples)
    ? data.examples.flatMap((example) =>
        example && typeof example === "object"
          ? (() => {
              const exampleData = example as Record<string, unknown>;
              return [
                String(exampleData.id ?? ""),
                String(exampleData.scenario_id ?? ""),
                localizedOntologyText(exampleData.labels as LocalizedText | undefined, language),
                localizedOntologyText(exampleData.descriptions as LocalizedText | undefined, language),
                localizedOntologyText(exampleData.expected_result as LocalizedText | undefined, language),
                localizedOntologyText(exampleData.why_valid_or_invalid as LocalizedText | undefined, language),
              ];
            })()
          : [],
      )
    : [];
  const casePaths = [...index.casePathsById.values()].flatMap((path) => {
    const belongsToEntity =
      entity.kind === "root" ||
      path.steps.some((step) => {
        if (index.exampleOwnerEntityRefById.get(step.case_fragment_example_id) === entity.ref) {
          return true;
        }
        const relationId = index.exampleOwnerRelationIdById.get(
          step.case_fragment_example_id,
        );
        const relation = relationId ? index.relationsById.get(relationId) : undefined;
        return entity.kind === "concept" &&
          (relation?.source_id === entity.id || relation?.target_id === entity.id);
      });
    return belongsToEntity
      ? [
          path.id,
          localizedOntologyText(path.labels, language),
          localizedOntologyText(path.descriptions, language),
        ]
      : [];
  });
  const relations =
    entity.kind === "concept"
      ? [
          ...(index.incomingRelationsByConceptId.get(entity.id) ?? []),
          ...(index.outgoingRelationsByConceptId.get(entity.id) ?? []),
        ].flatMap((relation) => [
          relation.id,
          relation.predicate,
          relation.labels?.[language] ?? "",
          relation.definitions?.[language] ?? "",
          ...(relation.examples ?? []).flatMap((example) => [
            example.id,
            String(example.scenario_id ?? ""),
            localizedOntologyText(example.labels, language),
            localizedOntologyText(example.descriptions, language),
          ]),
        ])
      : [];
  return [
    entity.id,
    ontologyEntityLabel(entity, language),
    ontologyEntityDefinition(entity, language),
    localizedOntologyText(data.short_definitions as LocalizedText | undefined, language),
    localizedOntologyText(data.definitions as LocalizedText | undefined, language),
    localizedOntologyText(data.why_needed as LocalizedText | undefined, language),
    ...sourceParts,
    ...examples,
    ...casePaths,
    ...relations,
  ]
    .join(" ")
    .toLocaleLowerCase();
};

interface DirectoryBranchProps extends Omit<OntologyDirectoryProps, "searchQuery" | "onSearchQueryChange"> {
  readonly entityRef: OntologyEntityRef;
  readonly depth: number;
  readonly visited: ReadonlySet<OntologyEntityRef>;
}

const DirectoryBranch = ({
  index,
  language,
  graphRootRef,
  focusedEntityRef,
  expandedRefs,
  onNavigate,
  onToggleExpanded,
  entityRef,
  depth,
  visited,
}: DirectoryBranchProps) => {
  const entity = index.entitiesByRef.get(entityRef);
  if (!entity || visited.has(entityRef) || !isDefaultVisibleOntologyEntity(index, entityRef)) {
    return null;
  }
  const children = defaultVisibleOntologyChildren(index, entityRef);
  const expanded = expandedRefs.has(entityRef);
  const nextVisited = new Set(visited).add(entityRef);
  const label = ontologyEntityLabel(entity, language);
  const kind = kindText(entity, language);

  return (
    <li
      role="treeitem"
      aria-expanded={children.length > 0 ? expanded : undefined}
      aria-selected={focusedEntityRef === entityRef}
      data-directory-ref={entityRef}
      data-directory-depth={depth}
    >
      <div className="tree-row">
        {children.length > 0 ? (
          <button
            type="button"
            className="tree-toggle"
            aria-label={`${expanded ? uiText[language].collapseList : uiText[language].expandDirectory}: ${label}`}
            onClick={() => onToggleExpanded(entityRef)}
          >
            {expanded ? "−" : "+"}
          </button>
        ) : (
          <span className="tree-toggle tree-toggle--leaf" aria-hidden="true">·</span>
        )}
        <button
          type="button"
          className={`tree-button${graphRootRef === entityRef ? " is-selected" : ""}${focusedEntityRef === entityRef ? " is-focused" : ""}`}
          onClick={() => onNavigate(entityRef)}
          aria-label={`${label} ${kind}`}
        >
          <span>{label}</span>
          <small>{kind}</small>
        </button>
      </div>
      {children.length > 0 && expanded ? (
        <ul role="group">
          {children.map((childRef) => (
            <DirectoryBranch
              key={childRef}
              index={index}
              language={language}
              graphRootRef={graphRootRef}
              focusedEntityRef={focusedEntityRef}
              expandedRefs={expandedRefs}
              onNavigate={onNavigate}
              onToggleExpanded={onToggleExpanded}
              entityRef={childRef}
              depth={depth + 1}
              visited={nextVisited}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

export const OntologyDirectory = (props: OntologyDirectoryProps) => {
  const { index, language, searchQuery, onSearchQueryChange, onNavigate } = props;
  const text = uiText[language];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const searchDocuments = useMemo(
    () => [...index.entitiesByRef.values()]
      .filter((entity) => isDefaultVisibleOntologyEntity(index, entity.ref))
      .map((entity) => ({
        entity,
        text: searchableText(index, entity, language),
      })),
    [index, language],
  );
  const searchResults = useMemo(
    () =>
      normalizedQuery.length === 0
        ? []
        : searchDocuments
            .filter(({ text: searchable }) => searchable.includes(normalizedQuery))
            .map(({ entity }) => entity),
    [normalizedQuery, searchDocuments],
  );

  return (
    <div className="directory-content">
      <p className="eyebrow">{text.browseOntology}</p>
      <h2>{ontologyEntityLabel(index.entitiesByRef.get(index.rootRef)!, language)}</h2>
      <label className="search-field" htmlFor="ontology-search">
        <span>{text.searchOntology}</span>
        <input
          id="ontology-search"
          type="search"
          value={searchQuery}
          placeholder={text.searchPlaceholder}
          onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
        />
      </label>
      <nav className="directory-tree" aria-label={text.browseOntology}>
        {normalizedQuery.length > 0 ? (
          searchResults.length > 0 ? (
            <ul className="tree-root search-results" role="list">
              {searchResults.map((entity) => (
                <li key={entity.ref} data-directory-ref={entity.ref} data-directory-depth="0">
                  <button
                    type="button"
                    className="tree-button"
                    onClick={() => onNavigate(entity.ref)}
                    aria-label={`${ontologyEntityLabel(entity, language)} ${kindText(entity, language)}`}
                  >
                    <span>{ontologyEntityLabel(entity, language)}</span>
                    <small>{kindText(entity, language)}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="directory-empty">{text.noSearchResults}</p>
          )
        ) : (
          <ul className="tree-root" role="tree">
            <DirectoryBranch
              {...props}
              entityRef={index.rootRef}
              depth={0}
              visited={new Set()}
            />
          </ul>
        )}
      </nav>
    </div>
  );
};
