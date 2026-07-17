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
    title: "本体关系图谱",
    subtitle: "颜色表示规范模块归属，大小表示连接度；关系名称悬停可见。Graphify 聚类仅用于离线诊断。",
    search: "搜索图中节点",
    searchPlaceholder: "输入节点名称…",
    fit: "适应画布",
    stabilize: "重新排布",
    communities: "规范模块社区",
    showAll: "显示全部",
    hideAll: "隐藏其他社区",
    focusLocked: "当前节点所属社区需保持可见",
    loading: "正在加载图谱引擎…",
    stabilizing: "正在稳定布局…",
    stable: "布局已稳定",
    error: "图谱无法初始化",
    noResults: "没有匹配节点",
    nodes: "节点",
    edges: "关系",
    accessibility: "交互式本体关系图。节点颜色表示经过审计的规范模块归属；可使用搜索定位节点，或使用左侧目录完整浏览。",
  },
  en: {
    title: "Ontology relation graph",
    subtitle: "Color indicates canonical Module ownership and size indicates degree; relations appear on hover. Graphify clustering is diagnostic only.",
    search: "Search graph nodes",
    searchPlaceholder: "Type a node label…",
    fit: "Fit graph",
    stabilize: "Reflow",
    communities: "Canonical Module communities",
    showAll: "Show all",
    hideAll: "Hide other communities",
    focusLocked: "The community containing the focused node remains visible",
    loading: "Loading graph engine…",
    stabilizing: "Stabilizing layout…",
    stable: "Layout stabilized",
    error: "Graph initialization failed",
    noResults: "No matching nodes",
    nodes: "nodes",
    edges: "edges",
    accessibility: "Interactive ontology relation graph colored by canonical Module ownership. Use search to focus a node or the directory for complete keyboard navigation.",
  },
  ja: {
    title: "オントロジー関係グラフ",
    subtitle: "色は正規モジュールへの所属、サイズは次数を示し、関係名はホバーで表示されます。Graphify のクラスタリングは診断専用です。",
    search: "グラフのノードを検索",
    searchPlaceholder: "ノード名を入力…",
    fit: "全体表示",
    stabilize: "再配置",
    communities: "正規モジュールコミュニティ",
    showAll: "すべて表示",
    hideAll: "他のコミュニティを非表示",
    focusLocked: "選択中ノードのコミュニティは表示を維持します",
    loading: "グラフエンジンを読み込み中…",
    stabilizing: "レイアウトを安定化中…",
    stable: "レイアウト安定済み",
    error: "グラフを初期化できません",
    noResults: "一致するノードはありません",
    nodes: "ノード",
    edges: "関係",
    accessibility: "レビュー済みの正規モジュール所属で色分けしたオントロジー関係グラフです。検索または左側のディレクトリで移動できます。",
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
  const focusedCommunityId = useMemo(
    () => model.nodes.find(({ id }) => id === focusedEntityRef)?.communityId ?? null,
    [focusedEntityRef, model.nodes],
  );
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
          <div className="ontology-network-search">
            <label htmlFor="ontology-network-search-input">{text.search}</label>
            <input
              id="ontology-network-search-input"
              type="search"
              value={query}
              placeholder={text.searchPlaceholder}
              autoComplete="off"
              onChange={(event) => setQuery(event.currentTarget.value)}
              data-testid="graph-node-search"
            />
            {query && matches.length > 0 ? (
              <ul className="ontology-network-search-results">
                {matches.map((node) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => selectSearchMatch(node.id, node.communityId)}
                    >
                      <span style={{ backgroundColor: node.color.background }} aria-hidden="true" />
                      {node.label}
                      <small>{node.communityLabel}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {query && matches.length === 0 ? (
              <p className="ontology-network-search-results">{text.noResults}</p>
            ) : null}
          </div>
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
            data-community-assignment-policy={validatedArtifact!.algorithm.assignment_policy}
            data-community-diagnostic-engine={validatedArtifact!.algorithm.diagnostic_engine}
            data-community-seed={validatedArtifact!.algorithm.seed}
            data-node-color-policy="canonical-module-owner"
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
                    ? new Set(model.communities
                      .filter(({ id }) => id !== focusedCommunityId)
                      .map(({ id }) => id))
                    : new Set(),
                )}
              >
                {hiddenCommunityIds.size === 0 ? text.hideAll : text.showAll}
              </button>
            </div>
            <ul>
              {model.communities.map((community) => (
                <li key={community.id}>
                  <label title={community.id === focusedCommunityId ? text.focusLocked : undefined}>
                    <input
                      type="checkbox"
                      checked={!hiddenCommunityIds.has(community.id)}
                      disabled={community.id === focusedCommunityId}
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
            <strong>{visibleCounts.nodeCount}</strong> {text.nodes} · <strong>{visibleCounts.edgeCount}</strong> {text.edges}
          </div>
        </div>
      )}
    </section>
  );
};
