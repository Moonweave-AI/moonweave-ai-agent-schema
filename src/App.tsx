import { useCallback, useEffect, useMemo, useState } from "react";

import canonicalOntologyData from "../ontology/agent-ontology.json";
import { OntologyCharacteristics } from "./components/OntologyCharacteristics";
import { OntologyDirectory } from "./components/OntologyDirectory";
import { OntologyGraph, type ThemeMode } from "./components/OntologyGraph";
import sourceIndexData from "./generated/source-index.json";
import { uiText, type Language } from "./i18n/ui-text";
import {
  ontologyEntityDefinition,
  ontologyEntityLabel,
  ontologyPrimaryPath,
  type OntologyEntityRef,
} from "./lib/ontology-index";
import {
  createOntologyRuntime,
  ontologyMetricValue,
} from "./lib/ontology-runtime";
import {
  buildVisibleConceptGraph,
  restoreOntologyViewHash,
  serializeOntologyViewHash,
  type OntologyViewState,
} from "./lib/ontology-view-model";

const ontologyRuntime = createOntologyRuntime(canonicalOntologyData, sourceIndexData);
const canonicalOntology = ontologyRuntime.ontology;
const ontologyIndex = ontologyRuntime.index;

const initialLocation = restoreOntologyViewHash(
  typeof window === "undefined" ? "" : window.location.hash,
  ontologyIndex,
);

const initialDirectoryExpansion = new Set<OntologyEntityRef>([
  ...ontologyPrimaryPath(ontologyIndex, initialLocation.state.focusedEntityRef),
]);

type LocationNotice = "root-repaired" | "invalid-focus" | null;

const graphProjectionDirectoryRefs = new Set<OntologyEntityRef>();

const entityKindText = (
  kind: "root" | "plane" | "module" | "concept",
  language: Language,
): string => {
  const text = uiText[language];
  if (kind === "root") return text.ontologyKind;
  if (kind === "plane") return text.planeKind;
  if (kind === "module") return text.moduleKind;
  return text.conceptKind;
};

function App() {
  const [language, setLanguage] = useState<Language>("zh");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [graphRootRef, setGraphRootRef] = useState<OntologyEntityRef>(
    initialLocation.state.graphRootRef,
  );
  const [focusedEntityRef, setFocusedEntityRef] = useState<OntologyEntityRef>(
    initialLocation.state.focusedEntityRef,
  );
  const [focusedRelationId, setFocusedRelationId] = useState<string | null>(
    initialLocation.state.focusedRelationId,
  );
  const [directoryExpandedRefs, setDirectoryExpandedRefs] = useState<Set<OntologyEntityRef>>(
    initialDirectoryExpansion,
  );
  const [graphExpandedRefs, setGraphExpandedRefs] = useState<Set<OntologyEntityRef>>(
    new Set(initialLocation.state.graphExpandedRefs),
  );
  const [directoryCollapsed, setDirectoryCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedScenarioId, setHighlightedScenarioId] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<LocationNotice>(
    initialLocation.invalidFocus
      ? "invalid-focus"
      : initialLocation.repairedRoot
        ? "root-repaired"
        : null,
  );
  const [announcement, setAnnouncement] = useState("");
  const text = uiText[language];

  const viewState = useMemo<OntologyViewState>(
    () => ({
      graphRootRef,
      focusedEntityRef,
      focusedRelationId,
      directoryExpandedRefs,
      graphExpandedRefs,
    }),
    [
      directoryExpandedRefs,
      focusedEntityRef,
      focusedRelationId,
      graphExpandedRefs,
      graphRootRef,
    ],
  );
  const graphProjectionState = useMemo<OntologyViewState>(
    () => ({
      graphRootRef,
      focusedEntityRef,
      focusedRelationId,
      directoryExpandedRefs: graphProjectionDirectoryRefs,
      graphExpandedRefs,
    }),
    [focusedEntityRef, focusedRelationId, graphExpandedRefs, graphRootRef],
  );
  const view = useMemo(
    () => buildVisibleConceptGraph(ontologyIndex, graphProjectionState),
    [graphProjectionState],
  );
  const focusedEntity =
    ontologyIndex.entitiesByRef.get(focusedEntityRef) ??
    ontologyIndex.entitiesByRef.get(ontologyIndex.rootRef)!;
  const breadcrumb = ontologyPrimaryPath(ontologyIndex, focusedEntity.ref);
  const metrics = canonicalOntology.ontology_metrics ?? {};
  const rootMetadata = canonicalOntology.artifact_metadata ?? {};
  const versionIri = String(
    rootMetadata.canonical_version ??
    canonicalOntology.id,
  );
  const focusedIri = focusedEntity.kind === "root"
    ? versionIri
    : `${versionIri}${encodeURIComponent(focusedEntity.id)}`;
  const focusedSourceClaims = (focusedEntity.data as {
    readonly source_claims?: readonly unknown[];
  }).source_claims;
  const dataDiagnosticReferences = [...new Set(
    ontologyIndex.dataDiagnostics.flatMap(({ ownerId, missingId }) => [ownerId, missingId]),
  )].sort().join(", ");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!locationNotice) return undefined;
    const timeout = window.setTimeout(() => setLocationNotice(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [locationNotice]);

  useEffect(() => {
    const nextHash = serializeOntologyViewHash(viewState);
    if (window.location.hash !== nextHash) window.history.replaceState(null, "", nextHash);
  }, [viewState]);

  useEffect(() => {
    const restoreHash = () => {
      const restored = restoreOntologyViewHash(window.location.hash, ontologyIndex);
      setGraphRootRef(restored.state.graphRootRef);
      setFocusedEntityRef(restored.state.focusedEntityRef);
      setFocusedRelationId(restored.state.focusedRelationId);
      setGraphExpandedRefs(new Set(restored.state.graphExpandedRefs));
      setDirectoryExpandedRefs(
        new Set(ontologyPrimaryPath(ontologyIndex, restored.state.focusedEntityRef)),
      );
      setLocationNotice(
        restored.invalidFocus
          ? "invalid-focus"
          : restored.repairedRoot
            ? "root-repaired"
            : null,
      );
    };
    window.addEventListener("hashchange", restoreHash);
    return () => window.removeEventListener("hashchange", restoreHash);
  }, []);

  const navigateToEntity = useCallback((ref: OntologyEntityRef) => {
    setGraphRootRef(ref);
    setFocusedEntityRef(ref);
    setFocusedRelationId(null);
    setGraphExpandedRefs(new Set([ref]));
    setDirectoryExpandedRefs((previous) => {
      const next = new Set(previous);
      for (const pathRef of ontologyPrimaryPath(ontologyIndex, ref)) next.add(pathRef);
      return next;
    });
    setHighlightedScenarioId(null);
    const entity = ontologyIndex.entitiesByRef.get(ref);
    if (entity) setAnnouncement(text.focusNode(ontologyEntityLabel(entity, language)));
  }, [language, text]);

  const focusEntity = useCallback((ref: OntologyEntityRef) => {
    setFocusedEntityRef(ref);
    setFocusedRelationId(null);
    const entity = ontologyIndex.entitiesByRef.get(ref);
    if (entity) setAnnouncement(text.focusNode(ontologyEntityLabel(entity, language)));
  }, [language, text]);

  const focusRelation = useCallback((relationId: string) => {
    setFocusedRelationId(relationId);
    const relation = ontologyIndex.relationsById.get(relationId);
    const label = relation
      ? relation.labels?.[language] ?? relation.predicate
      : relationId;
    setAnnouncement(text.focusRelation(label));
  }, [language, text]);

  const toggleDirectoryRef = useCallback((ref: OntologyEntityRef) => {
    setDirectoryExpandedRefs((previous) => {
      const next = new Set(previous);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }, []);

  const expandGraphRef = useCallback((ref: OntologyEntityRef) => {
    setGraphExpandedRefs((previous) => {
      const next = new Set(previous);
      next.add(ref);
      return next;
    });
  }, []);

  const downloadCanonical = useCallback(() => {
    const blob = new Blob([JSON.stringify(canonicalOntologyData, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "agent-ontology.json";
    anchor.click();
    URL.revokeObjectURL(href);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#ontology-content">{text.viewer}</a>
      <div className="fibo-viewer">
        <header className="viewer-header">
          <div className="brand-block">
            <div className="brand-mark" aria-hidden="true"><span /></div>
            <div><p className="eyebrow">MOONWEAVE · 智能体本体</p><h1>{text.title}</h1></div>
          </div>
          <div className="global-actions">
            <div className="inline-switch" aria-label="Language">
              {(["zh", "en", "ja"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={language === item ? "is-active" : ""}
                  data-testid={`language-${item}`}
                  aria-pressed={language === item}
                  onClick={() => setLanguage(item)}
                >
                  {item === "zh" ? "ZH" : item.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="inline-switch" aria-label="Theme">
              <button type="button" data-testid="theme-dark" className={theme === "dark" ? "is-active" : ""} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>{text.darkTheme}</button>
              <button type="button" data-testid="theme-light" className={theme === "light" ? "is-active" : ""} aria-pressed={theme === "light"} onClick={() => setTheme("light")}>{text.lightTheme}</button>
            </div>
            <button type="button" className="download-link" onClick={downloadCanonical}>{text.downloadJson}</button>
          </div>
        </header>

        <main className={`viewer-grid${directoryCollapsed ? " is-left-collapsed" : ""}`}>
          <aside className={`directory-panel${directoryCollapsed ? " is-collapsed" : ""}`}>
            <div className="panel-control">
              <button type="button" aria-expanded={!directoryCollapsed} onClick={() => setDirectoryCollapsed((current) => !current)}>
                {directoryCollapsed ? text.expandDirectory : text.collapseDirectory}
              </button>
            </div>
            <OntologyDirectory
              index={ontologyIndex}
              language={language}
              graphRootRef={graphRootRef}
              focusedEntityRef={focusedEntityRef}
              expandedRefs={directoryExpandedRefs}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onNavigate={navigateToEntity}
              onToggleExpanded={toggleDirectoryRef}
            />
            <section className="sidebar-statistics" data-testid="left-statistics">
              <p className="eyebrow">{text.ontologyScale}</p>
              <h2>{text.ontologyScale}</h2>
              <div className="metric-stack">
                <div><span>{text.domains}</span><strong>{ontologyMetricValue(ontologyRuntime, "domains", canonicalOntology.planes.length)}</strong></div>
                <div><span>{text.modules}</span><strong>{ontologyMetricValue(ontologyRuntime, "modules", canonicalOntology.modules.length)}</strong></div>
                <div><span>{text.concepts}</span><strong>{ontologyMetricValue(ontologyRuntime, "concepts", canonicalOntology.classes.length)}</strong></div>
                <div><span>{text.semanticRelations}</span><strong>{ontologyMetricValue(ontologyRuntime, "semantic_relations", ontologyRuntime.semanticRelationCount)}</strong></div>
                <div><span>{text.instanceExamples}</span><strong>{metrics.instance_examples ?? 0}</strong></div>
                <div><span>{text.structureFields}</span><strong>{metrics.structure_fields ?? 0}</strong></div>
                <div><span>{text.constraints}</span><strong>{metrics.constraints ?? 0}</strong></div>
                <div><span>{text.controlledValues}</span><strong>{metrics.controlled_values ?? 0}</strong></div>
                <div><span>{text.sourceClaimCount}</span><strong>{metrics.source_claims ?? 0}</strong></div>
              </div>
            </section>
          </aside>

          <section id="ontology-content" className="content-panel">
            {ontologyIndex.dataDiagnostics.length > 0 ? (
              <p className="context-repair-notice" role="alert" data-testid="data-integrity-error">
                {text.dataIntegrityError(
                  ontologyIndex.dataDiagnostics.length,
                  dataDiagnosticReferences,
                )}
              </p>
            ) : null}
            {locationNotice ? <p className="context-repair-notice" role="status">{locationNotice === "invalid-focus" ? text.invalidFocusNotice : text.rootRepairNotice}</p> : null}
            <nav className="breadcrumb" aria-label={text.logicalPosition}>
              {breadcrumb.map((ref, index) => {
                const entity = ontologyIndex.entitiesByRef.get(ref);
                return entity ? (
                  <span key={ref}>
                    {index > 0 ? <span aria-hidden="true"> / </span> : null}
                    <button type="button" onClick={() => navigateToEntity(ref)}>{ontologyEntityLabel(entity, language)}</button>
                  </span>
                ) : null;
              })}
            </nav>

            <div className="entity-hero">
              <div>
                <p className="eyebrow">{entityKindText(focusedEntity.kind, language)}</p>
                <h2>{ontologyEntityLabel(focusedEntity, language)}</h2>
                <p>{ontologyEntityDefinition(focusedEntity, language)}</p>
              </div>
              <dl className="summary-metrics">
                <div><dt>{text.status}</dt><dd>{String((focusedEntity.data as { status?: unknown }).status ?? text.notApplicable)}</dd></div>
                <div><dt>{text.iri}</dt><dd>{focusedIri}</dd></div>
                <div><dt>{text.source}</dt><dd>{focusedSourceClaims?.length ?? 0}</dd></div>
              </dl>
            </div>

            <OntologyGraph
              index={ontologyIndex}
              view={view}
              language={language}
              theme={theme}
              graphRootRef={graphRootRef}
              focusedEntityRef={focusedEntityRef}
              focusedRelationId={focusedRelationId}
              highlightedScenarioId={highlightedScenarioId}
              onFocusEntity={focusEntity}
              onFocusRelation={focusRelation}
              onExpandEntity={expandGraphRef}
            />
            <OntologyCharacteristics
              index={ontologyIndex}
              view={view}
              language={language}
              focusedEntityRef={focusedEntityRef}
              focusedRelationId={focusedRelationId}
              highlightedScenarioId={highlightedScenarioId}
              onFocusEntity={focusEntity}
              onNavigateEntity={navigateToEntity}
              onFocusRelation={focusRelation}
              onBackToNode={() => setFocusedRelationId(null)}
              onExpandAdjacent={expandGraphRef}
              onHighlightScenario={setHighlightedScenarioId}
            />
          </section>
        </main>
      </div>
      <p className="sr-live-selection" role="status" aria-live="polite">{announcement}</p>
    </div>
  );
}

export default App;
