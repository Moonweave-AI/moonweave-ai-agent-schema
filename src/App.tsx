import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { OntologyCharacteristics } from "./components/OntologyCharacteristics";
import { OntologyDirectory } from "./components/OntologyDirectory";
import { OntologyGraph, type ThemeMode } from "./components/OntologyGraph";
import communityGraphData from "./generated/ontology-community-graph.json";
import { renderSiteBuildIdentity } from "./components/site-build-identity";
import { uiText, type Language } from "./i18n/ui-text";
import { useOntologyDetailScene } from "./hooks/useOntologyGraphController";
import { useSiteBuildManifestState } from "./hooks/useSiteBuildManifestState";
import {
  communityProjectionFingerprint,
} from "./lib/ontology-community-network";
import {
  ontologyEntityDefinition,
  ontologyEntityLabel,
  ontologyPrimaryPath,
  type OntologyEntityRef,
} from "./lib/ontology-index";
import {
  ontologyMetricValue,
  type OntologyRuntime,
} from "./lib/ontology-runtime";
import { canonicalIdentityForOntology } from "./lib/site-build-manifest";
import {
  downloadJsonArtifact,
  ontologyEntityKindText,
} from "./lib/ontology-ui-actions";
import {
  buildVisibleSceneGraph,
  restoreOntologyViewHash,
  serializeOntologyViewHash,
  type OntologyViewState,
} from "./lib/ontology-view-model";
type LocationNotice = "root-repaired" | "invalid-focus" | null;
export interface AppProps { readonly ontologyRuntime: OntologyRuntime; readonly canonicalFingerprint: string }
function App({ ontologyRuntime, canonicalFingerprint }: AppProps) {
  const viewerHeaderRef = useRef<HTMLElement>(null);
  const viewerGridRef = useRef<HTMLElement>(null);
  const canonicalOntology = ontologyRuntime.ontology;
  const ontologyIndex = ontologyRuntime.index;
  const initialLocation = useMemo(
    () => restoreOntologyViewHash(window.location.hash, ontologyIndex), [ontologyIndex]);
  const initialDirectoryExpansion = useMemo(
    () => new Set<OntologyEntityRef>(ontologyPrimaryPath(
      ontologyIndex, initialLocation.state.focusedEntityRef)),
    [initialLocation.state.focusedEntityRef, ontologyIndex]);
  const canonicalIdentity = useMemo(() => canonicalIdentityForOntology(
    canonicalOntology,
    canonicalFingerprint,
    communityProjectionFingerprint(communityGraphData),
  ), [canonicalFingerprint, canonicalOntology]);
  const [language, setLanguage] = useState<Language>("zh");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [focusedEntityRef, setFocusedEntityRef] = useState<OntologyEntityRef>(
    initialLocation.state.focusedEntityRef,
  );
  const [focusedRelationId, setFocusedRelationId] = useState<string | null>(
    initialLocation.state.focusedRelationId,
  );
  const [directoryExpandedRefs, setDirectoryExpandedRefs] = useState<Set<OntologyEntityRef>>(
    initialDirectoryExpansion,
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
  const buildManifestState = useSiteBuildManifestState(canonicalIdentity);
  const text = uiText[language];
  const detailScene = useOntologyDetailScene(ontologyIndex, {
    rootRef: initialLocation.state.graphRootRef,
    focusedEntityRef: initialLocation.state.focusedEntityRef,
    focusedRelationId: initialLocation.state.focusedRelationId,
    expandedRefs: initialLocation.state.graphExpandedRefs,
  });
  const graphRootRef = detailScene.sceneState.rootRef;

  const viewState = useMemo<OntologyViewState>(
    () => ({
      graphRootRef,
      focusedEntityRef,
      focusedRelationId,
      directoryExpandedRefs,
      graphExpandedRefs: new Set(detailScene.sceneState.expansionsByRef.keys()),
    }),
    [
      directoryExpandedRefs,
      focusedEntityRef,
      focusedRelationId,
      graphRootRef,
      detailScene.sceneState.expansionsByRef,
    ],
  );
  const view = useMemo(
    () => buildVisibleSceneGraph(ontologyIndex, detailScene.sceneState, {
      focusedEntityRef,
      focusedRelationId,
    }),
    [focusedEntityRef, focusedRelationId, detailScene.sceneState],
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

  useLayoutEffect(() => {
    const header = viewerHeaderRef.current;
    const grid = viewerGridRef.current;
    if (!header || !grid) return undefined;

    const updateDirectoryViewportHeight = (): void => {
      const gridViewportTop = Math.max(0, grid.getBoundingClientRect().top);
      const stickyGap = 16;
      const availableHeight = Math.max(
        320,
        window.innerHeight - gridViewportTop - stickyGap,
      );
      grid.style.setProperty("--directory-viewport-height", `${availableHeight}px`);
    };
    updateDirectoryViewportHeight();
    window.addEventListener("resize", updateDirectoryViewportHeight);
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateDirectoryViewportHeight);
    observer?.observe(header);

    return () => {
      window.removeEventListener("resize", updateDirectoryViewportHeight);
      observer?.disconnect();
    };
  }, []);

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
    if (detailScene.diagnostic) setAnnouncement(text.sceneBudgetReached);
  }, [detailScene.diagnostic, text.sceneBudgetReached]);

  useEffect(() => {
    const restoreHash = () => {
      const restored = restoreOntologyViewHash(window.location.hash, ontologyIndex);
      setFocusedEntityRef(restored.state.focusedEntityRef);
      setFocusedRelationId(restored.state.focusedRelationId);
      detailScene.restore({
        rootRef: restored.state.graphRootRef,
        focusedEntityRef: restored.state.focusedEntityRef,
        focusedRelationId: restored.state.focusedRelationId,
        expandedRefs: restored.state.graphExpandedRefs,
      });
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
  }, [detailScene.restore]);

  const navigateToEntity = useCallback((ref: OntologyEntityRef) => {
    detailScene.setSelection([ref]);
    setFocusedEntityRef(ref);
    setFocusedRelationId(null);
    setDirectoryExpandedRefs((previous) => {
      const next = new Set(previous);
      for (const pathRef of ontologyPrimaryPath(ontologyIndex, ref)) next.add(pathRef);
      return next;
    });
    setHighlightedScenarioId(null);
    const entity = ontologyIndex.entitiesByRef.get(ref);
    if (entity) setAnnouncement(text.focusNode(ontologyEntityLabel(entity, language)));
  }, [detailScene.setSelection, language, text]);

  const focusEntity = useCallback((ref: OntologyEntityRef) => {
    setFocusedEntityRef(ref);
    setFocusedRelationId(null);
    const entity = ontologyIndex.entitiesByRef.get(ref);
    if (entity) setAnnouncement(text.focusNode(ontologyEntityLabel(entity, language)));
  }, [language, text]);

  const focusRelation = useCallback((relationId: string | null) => {
    setFocusedRelationId(relationId);
    if (!relationId) return;
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

  return (
    <div className="app-shell">
      <a className="skip-link" href="#ontology-content">{text.viewer}</a>
      <div className="fibo-viewer">
        <header ref={viewerHeaderRef} className="viewer-header">
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
            <button type="button" className="download-link" onClick={() => downloadJsonArtifact(canonicalOntology, "agent-ontology.json")}>{text.downloadJson}</button>
            {renderSiteBuildIdentity(buildManifestState, text)}
          </div>
        </header>

        <main
          ref={viewerGridRef}
          className={`viewer-grid${directoryCollapsed ? " is-left-collapsed" : ""}`}
        >
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
                <p className="eyebrow">{ontologyEntityKindText(focusedEntity.kind, language)}</p>
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
              language={language}
              theme={theme}
              canonicalFingerprint={canonicalFingerprint}
              focusedEntityRef={focusedEntityRef}
              focusedRelationId={focusedRelationId}
              onFocusEntity={focusEntity}
              onFocusRelation={focusRelation}
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
              onExpandAdjacent={detailScene.expandAdjacent}
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
