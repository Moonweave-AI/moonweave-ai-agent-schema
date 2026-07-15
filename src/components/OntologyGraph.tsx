import { useEffect, useMemo, useRef, useState } from "react";

import communityGraphData from "../generated/ontology-community-graph.json";
import type { Language } from "../i18n/ui-text";
import {
  buildOntologyCommunityNetworkModel,
  validateOntologyCommunityGraph,
  type OntologyCommunityGraphArtifact,
  type OntologyGraphTheme,
} from "../lib/ontology-community-network";
import type { OntologyEntityRef, OntologyIndex } from "../lib/ontology-index";
import {
  createOntologyNetworkRuntime,
  type OntologyNetworkRuntime,
} from "../lib/ontology-network-runtime";

export type ThemeMode = OntologyGraphTheme;

export interface OntologyGraphProps {
  readonly index: OntologyIndex;
  readonly language: Language;
  readonly theme: ThemeMode;
  readonly canonicalFingerprint: string;
  readonly focusedEntityRef: OntologyEntityRef;
  readonly focusedRelationId: string | null;
  readonly onFocusEntity: (ref: OntologyEntityRef) => void;
  readonly onFocusRelation: (relationId: string | null) => void;
  readonly communityGraph?: unknown;
}

type StabilizationStatus = "loading" | "stabilizing" | "stable" | "error";

const NETWORK_TEXT: Readonly<Record<Language, Readonly<Record<string, string>>>> = {
  zh: {
    title: "关系社区图谱",
    subtitle: "颜色表示结构社区，大小表示连接度；关系名称悬停可见。",
    search: "搜索图中节点",
    searchPlaceholder: "输入节点名称…",
    fit: "适应画布",
    stabilize: "重新排布",
    communities: "结构社区",
    showAll: "显示全部",
    hideAll: "隐藏全部",
    loading: "正在加载图谱引擎…",
    stabilizing: "正在稳定布局…",
    stable: "布局已稳定",
    error: "图谱无法初始化",
    noResults: "没有匹配节点",
    accessibility: "交互式本体关系社区图。可使用搜索定位节点，或使用左侧目录完整浏览。",
  },
  en: {
    title: "Relation community graph",
    subtitle: "Color indicates structural community and size indicates degree; relations appear on hover.",
    search: "Search graph nodes",
    searchPlaceholder: "Type a node label…",
    fit: "Fit graph",
    stabilize: "Reflow",
    communities: "Structural communities",
    showAll: "Show all",
    hideAll: "Hide all",
    loading: "Loading graph engine…",
    stabilizing: "Stabilizing layout…",
    stable: "Layout stabilized",
    error: "Graph initialization failed",
    noResults: "No matching nodes",
    accessibility: "Interactive ontology relation community graph. Use search to focus a node or the directory for complete keyboard navigation.",
  },
  ja: {
    title: "関係コミュニティグラフ",
    subtitle: "色は構造コミュニティ、サイズは次数を示し、関係名はホバーで表示されます。",
    search: "グラフのノードを検索",
    searchPlaceholder: "ノード名を入力…",
    fit: "全体表示",
    stabilize: "再配置",
    communities: "構造コミュニティ",
    showAll: "すべて表示",
    hideAll: "すべて非表示",
    loading: "グラフエンジンを読み込み中…",
    stabilizing: "レイアウトを安定化中…",
    stable: "レイアウト安定済み",
    error: "グラフを初期化できません",
    noResults: "一致するノードはありません",
    accessibility: "インタラクティブなオントロジー関係コミュニティグラフです。検索または左側のディレクトリで移動できます。",
  },
};

const defaultCommunityGraph: unknown = communityGraphData;
const EMPTY_NETWORK_MODEL = Object.freeze({
  nodes: Object.freeze([]),
  edges: Object.freeze([]),
  communities: Object.freeze([]),
  maximumDegree: 0,
  algorithmLabel: "",
});

const reducedMotionPreference = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const OntologyGraph = ({
  index,
  language,
  theme,
  canonicalFingerprint,
  focusedEntityRef,
  focusedRelationId,
  onFocusEntity,
  onFocusRelation,
  communityGraph = defaultCommunityGraph,
}: OntologyGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<OntologyNetworkRuntime | null>(null);
  const callbacksRef = useRef({ onFocusEntity, onFocusRelation });
  const modelRef = useRef<ReturnType<typeof buildOntologyCommunityNetworkModel> | null>(null);
  const [status, setStatus] = useState<StabilizationStatus>("loading");
  const [query, setQuery] = useState("");
  const [hiddenCommunityIds, setHiddenCommunityIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const hiddenCommunityIdsRef = useRef(hiddenCommunityIds);
  const focusedEntityRefRef = useRef(focusedEntityRef);
  const reducedMotion = reducedMotionPreference();
  const text = NETWORK_TEXT[language];
  callbacksRef.current = { onFocusEntity, onFocusRelation };
  hiddenCommunityIdsRef.current = hiddenCommunityIds;
  focusedEntityRefRef.current = focusedEntityRef;

  const validationErrors = useMemo(
    () => validateOntologyCommunityGraph(
      index,
      communityGraph as OntologyCommunityGraphArtifact,
      canonicalFingerprint,
    ),
    [canonicalFingerprint, communityGraph, index],
  );
  const validatedArtifact = validationErrors.length === 0
    ? communityGraph as OntologyCommunityGraphArtifact
    : null;
  const model = useMemo(
    () => validatedArtifact
      ? buildOntologyCommunityNetworkModel(index, validatedArtifact, language, theme)
      : EMPTY_NETWORK_MODEL,
    [index, language, theme, validatedArtifact],
  );
  modelRef.current = model;

  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language);
    if (!normalized) return [];
    return model.nodes
      .filter(({ label }) => label.toLocaleLowerCase(language).includes(normalized))
      .slice(0, 20);
  }, [language, model.nodes, query]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !validatedArtifact) return undefined;
    let cancelled = false;
    let ownedRuntime: OntologyNetworkRuntime | null = null;
    const runtimeHost = document.createElement("div");
    runtimeHost.className = "ontology-network-runtime-host";
    container.append(runtimeHost);
    setStatus("loading");
    void createOntologyNetworkRuntime(runtimeHost, modelRef.current ?? model, {
      onNodeFocus: (ref) => callbacksRef.current.onFocusEntity(ref),
      onRelationFocus: (id) => callbacksRef.current.onFocusRelation(id),
      onStabilizing: () => { if (!cancelled) setStatus("stabilizing"); },
      onStable: () => { if (!cancelled) setStatus("stable"); },
    }).then((runtime) => {
      ownedRuntime = runtime;
      if (cancelled) {
        runtime.destroy();
        runtimeHost.remove();
        return;
      }
      runtimeRef.current = runtime;
      runtime.updateModel(modelRef.current ?? model);
      runtime.setHiddenCommunities(hiddenCommunityIdsRef.current);
      runtime.setFocusedNode(focusedEntityRefRef.current);
    }).catch((error: unknown) => {
      runtimeHost.remove();
      if (!cancelled) {
        console.error("Ontology graph runtime initialization failed.", error);
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
      ownedRuntime?.destroy();
      if (runtimeRef.current === ownedRuntime) runtimeRef.current = null;
      runtimeHost.remove();
    };
    // The generated topology and index identity own the runtime. Language and
    // theme update the existing datasets without re-running physics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, validatedArtifact]);

  useEffect(() => {
    runtimeRef.current?.updateModel(model);
  }, [model]);

  useEffect(() => {
    runtimeRef.current?.setHiddenCommunities(hiddenCommunityIds);
  }, [hiddenCommunityIds]);

  useEffect(() => {
    const focusedNode = model.nodes.find(({ id }) => id === focusedEntityRef);
    if (!focusedNode) return;
    if (hiddenCommunityIds.has(focusedNode.communityId)) {
      setHiddenCommunityIds((previous) => {
        const next = new Set(previous);
        next.delete(focusedNode.communityId);
        return next;
      });
    }
    runtimeRef.current?.setFocusedNode(focusedEntityRef);
  }, [focusedEntityRef, hiddenCommunityIds, model.nodes]);

  useEffect(() => {
    if (!focusedRelationId) return;
    const edge = model.edges.find(({ canonicalRelationId }) =>
      canonicalRelationId === focusedRelationId);
    if (!edge) return;
    runtimeRef.current?.focusNode(edge.from, !reducedMotion);
  }, [focusedRelationId, model.edges, reducedMotion]);

  const selectSearchMatch = (ref: OntologyEntityRef, communityId: number): void => {
    const nextHidden = new Set(hiddenCommunityIds);
    nextHidden.delete(communityId);
    setHiddenCommunityIds(nextHidden);
    runtimeRef.current?.setHiddenCommunities(nextHidden);
    runtimeRef.current?.focusNode(ref, !reducedMotion);
    callbacksRef.current.onFocusEntity(ref);
    setQuery("");
  };

  const toggleCommunity = (communityId: number): void => {
    setHiddenCommunityIds((previous) => {
      const next = new Set(previous);
      if (next.has(communityId)) next.delete(communityId);
      else next.add(communityId);
      return next;
    });
  };

  const statusText = text[status];
  const visibleCounts = useMemo(() => {
    const communityByNode = new Map(model.nodes.map(({ id, communityId }) => [id, communityId]));
    const nodeCount = model.nodes.filter(
      ({ communityId }) => !hiddenCommunityIds.has(communityId),
    ).length;
    const edgeCount = model.edges.filter((edge) => {
      const sourceCommunity = communityByNode.get(edge.from);
      const targetCommunity = communityByNode.get(edge.to);
      return sourceCommunity !== undefined && targetCommunity !== undefined &&
        !hiddenCommunityIds.has(sourceCommunity) &&
        !hiddenCommunityIds.has(targetCommunity);
    }).length;
    return Object.freeze({ nodeCount, edgeCount });
  }, [hiddenCommunityIds, model.edges, model.nodes]);

  return (
    <section className="viewer-canvas ontology-network-view" data-testid="ontology-canvas">
      <header className="section-heading ontology-network-heading">
        <div>
          <p className="eyebrow">ONTOLOGY GRAPH</p>
          <h3>{text.title}</h3>
          <p>{text.subtitle}</p>
        </div>
        <div className="ontology-network-actions">
          <label className="ontology-network-search">
            <span>{text.search}</span>
            <input
              type="search"
              value={query}
              placeholder={text.searchPlaceholder}
              autoComplete="off"
              onChange={(event) => setQuery(event.currentTarget.value)}
              data-testid="graph-node-search"
            />
            {query ? (
              <div className="ontology-network-search-results" role="listbox">
                {matches.length > 0 ? matches.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    role="option"
                    onClick={() => selectSearchMatch(node.id, node.communityId)}
                  >
                    <span style={{ backgroundColor: node.color.background }} aria-hidden="true" />
                    {node.label}
                    <small>{node.communityLabel}</small>
                  </button>
                )) : <p>{text.noResults}</p>}
              </div>
            ) : null}
          </label>
          <button type="button" onClick={() => runtimeRef.current?.fit(!reducedMotion)}>
            {text.fit}
          </button>
          <button
            type="button"
            disabled={status !== "stable"}
            onClick={() => runtimeRef.current?.stabilize()}
          >
            {text.stabilize}
          </button>
          <span
            className={`ontology-network-status is-${status}`}
            role="status"
            aria-live="polite"
            data-testid="graph-stabilization-status"
          >
            {statusText}
          </span>
        </div>
      </header>

      {validationErrors.length > 0 ? (
        <div className="graph-empty-state" role="alert" data-testid="community-graph-invalid">
          <h3>{text.error}</h3>
          <p>{validationErrors.join("; ")}</p>
        </div>
      ) : (
        <div className="ontology-network-stage">
          <div
            ref={containerRef}
            className="ontology-network-canvas"
            role="region"
            aria-label={text.accessibility}
            data-testid="ontology-network-graph"
            data-layout-engine="vis-network-forceatlas2"
            data-layout-status={status}
            data-physics-enabled={status === "stable" ? "false" : "true"}
            data-community-engine={validatedArtifact!.algorithm.engine}
            data-community-seed={validatedArtifact!.algorithm.seed}
            data-node-color-policy="community"
            data-node-size-policy="degree-linear-10-40"
            data-edge-label-policy="hover-only"
            data-node-count={visibleCounts.nodeCount}
            data-edge-count={visibleCounts.edgeCount}
            data-community-count={model.communities.length}
            data-source-sha256={validatedArtifact!.source_sha256}
            data-projection-sha256={validatedArtifact!.projection_sha256}
          />
          <aside className="ontology-community-legend" aria-label={text.communities}>
            <div className="ontology-community-legend-heading">
              <div>
                <strong>{text.communities}</strong>
                <small>{model.algorithmLabel}</small>
              </div>
              <button
                type="button"
                onClick={() => setHiddenCommunityIds(
                  hiddenCommunityIds.size === 0
                    ? new Set(model.communities.map(({ id }) => id))
                    : new Set(),
                )}
              >
                {hiddenCommunityIds.size === 0 ? text.hideAll : text.showAll}
              </button>
            </div>
            <ul>
              {model.communities.map((community) => (
                <li key={community.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!hiddenCommunityIds.has(community.id)}
                      onChange={() => toggleCommunity(community.id)}
                    />
                    <span
                      className="ontology-community-dot"
                      style={{ backgroundColor: community.color }}
                      aria-hidden="true"
                    />
                    <span>{community.label}</span>
                    <small>{community.count}</small>
                  </label>
                </li>
              ))}
            </ul>
          </aside>
          <div className="ontology-network-count" data-testid="graph-count">
            <strong>{visibleCounts.nodeCount}</strong> nodes · <strong>{visibleCounts.edgeCount}</strong> edges
          </div>
        </div>
      )}
    </section>
  );
};
