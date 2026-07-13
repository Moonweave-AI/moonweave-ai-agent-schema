import cytoscape from "cytoscape";
import cytoscapeFcose from "cytoscape-fcose";
import { useEffect, useMemo, useRef } from "react";

import { uiText, type Language } from "../i18n/ui-text";
import {
  localizedOntologyText,
  ontologyEntityLabel,
  ontologyLogicalDepth,
  resolveCanonicalCasePath,
  type CanonicalRelation,
  type OntologyEntityRef,
  type OntologyIndex,
} from "../lib/ontology-index";
import type {
  VisibleOntologyEdge,
  VisibleOntologyGraph,
} from "../lib/ontology-view-model";

cytoscape.use(cytoscapeFcose);

export type ThemeMode = "dark" | "light";

export interface OntologyGraphProps {
  readonly index: OntologyIndex;
  readonly view: VisibleOntologyGraph;
  readonly language: Language;
  readonly theme: ThemeMode;
  readonly graphRootRef: OntologyEntityRef;
  readonly focusedEntityRef: OntologyEntityRef;
  readonly focusedRelationId: string | null;
  readonly highlightedScenarioId?: string | null;
  readonly onFocusEntity: (ref: OntologyEntityRef) => void;
  readonly onFocusRelation: (relationId: string) => void;
  readonly onExpandEntity: (ref: OntologyEntityRef) => void;
}

const themeColors = {
  dark: {
    panel: "#10162a",
    text: "#fff8e8",
    muted: "#a6aed0",
    cyan: "#74ecff",
    lilac: "#cba9ff",
    thread: "#8ddcff",
    mint: "#69efae",
    blush: "#f5a5cb",
  },
  light: {
    panel: "#ffffff",
    text: "#1d2440",
    muted: "#68708d",
    cyan: "#067fa4",
    lilac: "#7c56c4",
    thread: "#1772b8",
    mint: "#158953",
    blush: "#b94d82",
  },
} as const;

const relationLabel = (
  edge: VisibleOntologyEdge,
  relation: CanonicalRelation | undefined,
  language: Language,
): string => relation
  ? localizedOntologyText(relation.labels, language, edge.predicate)
  : uiText[language].derivedRelationLabels[edge.predicate] ?? edge.predicate;

const relationDefinition = (
  edge: VisibleOntologyEdge,
  relation: CanonicalRelation | undefined,
  language: Language,
): string => relation
  ? localizedOntologyText(relation.definitions, language, edge.predicate)
  : uiText[language].derivedRelationDefinitions[edge.predicate] ??
    uiText[language].derivedRelation;

const edgeClasses = (
  edge: VisibleOntologyEdge,
  focusedEntityRef: OntologyEntityRef,
  focusedRelationId: string | null,
  caseHighlighted: boolean,
): string => {
  const classes = [
    edge.derived ? "is-derived-edge" : "is-canonical-edge",
    edge.hierarchyRole === "primary-parent" ? "is-primary-parent-edge" : "",
    edge.hierarchyRole === "additional-parent" ? "is-additional-parent-edge" : "",
    edge.source === focusedEntityRef ? "is-outgoing-edge" : "",
    edge.target === focusedEntityRef ? "is-incoming-edge" : "",
    edge.id === focusedRelationId ? "is-focused-edge" : "",
    caseHighlighted ? "case-path-highlight" : "",
  ];
  return classes.filter(Boolean).join(" ");
};

const staticEdgeClasses = (edge: VisibleOntologyEdge): string =>
  [
    edge.derived ? "is-derived-edge" : "is-canonical-edge",
    edge.hierarchyRole === "primary-parent" ? "is-primary-parent-edge" : "",
    edge.hierarchyRole === "additional-parent" ? "is-additional-parent-edge" : "",
  ]
    .filter(Boolean)
    .join(" ");

const hasScenario = (value: unknown, scenarioId: string | null | undefined): boolean => {
  if (!scenarioId || !value || typeof value !== "object") return false;
  const examples = (value as { examples?: unknown }).examples;
  return Array.isArray(examples)
    ? examples.some(
        (example) =>
          example &&
          typeof example === "object" &&
          (example as { scenario_id?: unknown }).scenario_id === scenarioId,
      )
    : false;
};

export const hierarchicalRingPositions = (
  index: OntologyIndex,
  nodes: VisibleOntologyGraph["nodes"],
): ReadonlyMap<OntologyEntityRef, Readonly<{ x: number; y: number }>> => {
  if (nodes.length === 0) return new Map();
  const depthByRef = new Map(
    nodes.map((node) => [node.ref, ontologyLogicalDepth(index, node.ref)] as const),
  );
  const minimumDepth = Math.min(...depthByRef.values());
  const refsByLayer = new Map<number, OntologyEntityRef[]>();
  for (const [ref, depth] of depthByRef) {
    const layer = depth - minimumDepth;
    refsByLayer.set(layer, [...(refsByLayer.get(layer) ?? []), ref]);
  }
  const positions = new Map<OntologyEntityRef, Readonly<{ x: number; y: number }>>();
  for (const [layer, refs] of refsByLayer) {
    const orderedRefs = [...refs].sort();
    const radius = layer === 0 ? (orderedRefs.length === 1 ? 0 : 54) : 118 + layer * 142;
    orderedRefs.forEach((ref, position) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * position) / orderedRefs.length;
      positions.set(ref, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });
  }
  return positions;
};

export const OntologyGraph = ({
  index,
  view,
  language,
  theme,
  graphRootRef,
  focusedEntityRef,
  focusedRelationId,
  highlightedScenarioId,
  onFocusEntity,
  onFocusRelation,
  onExpandEntity,
}: OntologyGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<cytoscape.Core | null>(null);
  const latestTapRef = useRef<{ readonly ref: OntologyEntityRef; readonly at: number } | null>(null);
  const text = uiText[language];
  const colors = themeColors[theme];
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scenarioHighlights = useMemo(() => {
    const highlightedCaseNodes = new Set<OntologyEntityRef>();
    const highlightedCaseRelations = new Set<string>();
    if (highlightedScenarioId) {
      for (const path of index.casePathsById.values()) {
        const matches =
          path.id === highlightedScenarioId ||
          path.steps.some(
            (step) =>
              index.examplesById.get(step.case_fragment_example_id)?.scenario_id ===
              highlightedScenarioId,
          );
        if (!matches) continue;
        for (const step of path.steps) {
          const owner = index.exampleOwnerEntityRefById.get(step.case_fragment_example_id);
          if (owner) highlightedCaseNodes.add(owner);
          const ownerRelation = index.exampleOwnerRelationIdById.get(
            step.case_fragment_example_id,
          );
          if (ownerRelation) highlightedCaseRelations.add(ownerRelation);
          if (step.traversal_relation_id) highlightedCaseRelations.add(step.traversal_relation_id);
        }
      }
    }
    return {
      nodeRefs: highlightedCaseNodes,
      relationIds: highlightedCaseRelations,
    };
  }, [highlightedScenarioId, index]);

  const topologySignature = useMemo(
    () =>
      [
        view.nodes.map(({ ref }) => ref).sort().join("|"),
        view.edges
          .map(({ id, source, target }) => `${id}:${source}:${target}`)
          .sort()
          .join("|"),
      ].join("::"),
    [view.edges, view.nodes],
  );

  const graphPositions = useMemo(
    () => hierarchicalRingPositions(index, view.nodes),
    [index, topologySignature],
  );

  const graphElements = useMemo<cytoscape.ElementDefinition[]>(() => {
    const nodes: cytoscape.ElementDefinition[] = view.nodes.map((node) => ({
      data: {
        id: node.ref,
        entityRef: node.ref,
        label: ontologyEntityLabel(node.entity, language),
        kind: node.kind,
        layoutDepth: ontologyLogicalDepth(index, node.ref),
      },
      position: graphPositions.get(node.ref),
    }));
    const edges: cytoscape.ElementDefinition[] = view.edges.map((edge) => {
      const relation = edge.canonicalRelationId
        ? index.relationsById.get(edge.canonicalRelationId)
        : undefined;
      return {
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          predicate: edge.predicate,
          label: relationLabel(edge, relation, language),
          definition: relationDefinition(edge, relation, language),
          derived: edge.derived,
        },
        classes: staticEdgeClasses(edge),
      };
    });
    return [...nodes, ...edges];
    // The signature deliberately separates topology changes from focus/highlight changes.
    // Focus styles are applied in-place below so a click never destroys and relayouts the graph.
  }, [graphPositions, index, language, topologySignature]);

  const visibleRefs = new Set(view.nodes.map(({ ref }) => ref));
  const visibleRelationIds = new Set(view.edges.map(({ id }) => id));
  const hiddenCaseSteps = new Set<string>();
  if (highlightedScenarioId) {
    for (const path of index.casePathsById.values()) {
      const matches =
        path.id === highlightedScenarioId ||
        path.steps.some(
          (step) =>
            index.examplesById.get(step.case_fragment_example_id)?.scenario_id ===
            highlightedScenarioId,
        );
      if (!matches) continue;
      for (const resolved of resolveCanonicalCasePath(index, path)) {
        const hidden =
          resolved.missingReferenceIds.length > 0 ||
          Boolean(resolved.ownerEntityRef && !visibleRefs.has(resolved.ownerEntityRef)) ||
          Boolean(resolved.ownerRelationId && !visibleRelationIds.has(resolved.ownerRelationId)) ||
          Boolean(
            resolved.step.traversal_relation_id &&
            !visibleRelationIds.has(resolved.step.traversal_relation_id),
          );
        if (hidden) hiddenCaseSteps.add(`${path.id}:${resolved.step.order}`);
      }
    }
  }

  useEffect(() => {
    if (!containerRef.current || view.nodes.length === 0) return undefined;
    const graph = cytoscape({
      container: containerRef.current,
      elements: graphElements,
      minZoom: 0.24,
      maxZoom: 2.2,
      style: [
        {
          selector: "node",
          style: {
            width: 18,
            height: 18,
            "background-color": colors.lilac,
            "border-width": 2,
            "border-color": colors.panel,
            label: "data(label)",
            color: colors.text,
            "font-size": 11,
            "font-weight": 600,
            "text-margin-y": -14,
            "text-wrap": "wrap",
            "text-max-width": "160px",
          },
        },
        { selector: 'node[kind = "root"]', style: { width: 25, height: 25, "background-color": colors.cyan } },
        { selector: 'node[kind = "plane"]', style: { width: 21, height: 21, "background-color": colors.lilac } },
        { selector: 'node[kind = "module"]', style: { width: 19, height: 19, "background-color": colors.mint } },
        { selector: "node.is-focused-node", style: { "border-width": 5, "border-color": colors.blush, "z-index": 20 } },
        { selector: "node.case-path-highlight", style: { "border-width": 5, "border-color": colors.mint } },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": colors.thread,
            "target-arrow-color": colors.thread,
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: colors.muted,
            "font-size": 8,
            "text-background-color": colors.panel,
            "text-background-opacity": 0.88,
            "text-background-padding": "2px",
            "text-rotation": "autorotate",
            "arrow-scale": 0.72,
          },
        },
        { selector: "edge.is-derived-edge", style: { "line-style": "dotted", opacity: 0.72 } },
        { selector: "edge.is-primary-parent-edge", style: { width: 2.5, "line-color": colors.cyan, "target-arrow-color": colors.cyan } },
        { selector: "edge.is-additional-parent-edge", style: { "line-style": "dashed", "line-color": colors.lilac, "target-arrow-color": colors.lilac } },
        { selector: "edge.is-incoming-edge", style: { width: 2.8, "line-color": colors.mint, "target-arrow-color": colors.mint, opacity: 1 } },
        { selector: "edge.is-outgoing-edge", style: { width: 2.8, "line-color": colors.cyan, "target-arrow-color": colors.cyan, opacity: 1 } },
        { selector: "edge.is-focused-edge", style: { width: 4, "line-color": colors.blush, "target-arrow-color": colors.blush, color: colors.text, "font-size": 10, "z-index": 30 } },
        { selector: "edge.case-path-highlight", style: { width: 4, "line-color": colors.mint, "target-arrow-color": colors.mint } },
        { selector: ".is-hover-related", style: { opacity: 1, "z-index": 24 } },
      ],
    });
    graphRef.current = graph;

    graph.on("tap", "node", (event) => {
      const ref = event.target.data("entityRef") as OntologyEntityRef;
      const now = Date.now();
      const previous = latestTapRef.current;
      if (previous?.ref === ref && now - previous.at <= 360) {
        onExpandEntity(ref);
        latestTapRef.current = null;
      } else {
        latestTapRef.current = { ref, at: now };
        onFocusEntity(ref);
      }
    });
    graph.on("tap", "edge", (event) => onFocusRelation(event.target.id()));
    graph.on("mouseover", "node", (event) => event.target.connectedEdges().addClass("is-hover-related"));
    graph.on("mouseout", "node", (event) => event.target.connectedEdges().removeClass("is-hover-related"));

    const layout = graph.layout({
      name: "fcose",
      quality: "default",
      randomize: false,
      animate: !reducedMotion,
      animationDuration: reducedMotion ? 0 : 420,
      fit: true,
      padding: 56,
      nodeRepulsion: 8200,
      idealEdgeLength: 120,
      edgeElasticity: 0.34,
      gravity: 0.28,
      numIter: 1800,
      fixedNodeConstraint: [...graphPositions].map(([nodeId, position]) => ({
        nodeId,
        position,
      })),
    } as cytoscape.LayoutOptions);
    layout.one("layoutstop", () => {
      const invariantHolds = graph.nodes().toArray().every((node) => {
        const expected = graphPositions.get(node.id() as OntologyEntityRef);
        if (!expected) return false;
        const actual = node.position();
        return Math.hypot(actual.x - expected.x, actual.y - expected.y) <= 1;
      });
      if (containerRef.current) {
        containerRef.current.dataset.layoutInvariant = invariantHolds ? "true" : "false";
      }
    });
    layout.run();
    return () => {
      if (graphRef.current === graph) graphRef.current = null;
      graph.destroy();
    };
  }, [
    colors,
    graphElements,
    graphPositions,
    onExpandEntity,
    onFocusEntity,
    onFocusRelation,
    reducedMotion,
    view.nodes.length,
  ]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.batch(() => {
      graph.nodes().removeClass("is-focused-node case-path-highlight");
      graph
        .edges()
        .removeClass(
          "is-incoming-edge is-outgoing-edge is-focused-edge case-path-highlight",
        );
      graph.getElementById(focusedEntityRef).addClass("is-focused-node");
      for (const node of view.nodes) {
        if (
          hasScenario(node.entity.data, highlightedScenarioId) ||
          scenarioHighlights.nodeRefs.has(node.ref)
        ) {
          graph.getElementById(node.ref).addClass("case-path-highlight");
        }
      }
      for (const edge of view.edges) {
        const element = graph.getElementById(edge.id);
        if (edge.source === focusedEntityRef) element.addClass("is-outgoing-edge");
        if (edge.target === focusedEntityRef) element.addClass("is-incoming-edge");
        if (edge.id === focusedRelationId) element.addClass("is-focused-edge");
        const relation = edge.canonicalRelationId
          ? index.relationsById.get(edge.canonicalRelationId)
          : undefined;
        if (
          hasScenario(relation, highlightedScenarioId) ||
          scenarioHighlights.relationIds.has(edge.id)
        ) {
          element.addClass("case-path-highlight");
        }
      }
    });
  }, [
    focusedEntityRef,
    focusedRelationId,
    graphElements,
    highlightedScenarioId,
    index,
    scenarioHighlights,
    theme,
    view.edges,
    view.nodes,
  ]);

  const focusedEntity = index.entitiesByRef.get(focusedEntityRef);
  const focusedEdge = focusedRelationId
    ? view.edges.find(({ id }) => id === focusedRelationId)
    : undefined;
  const focusedCanonicalRelation = focusedEdge?.canonicalRelationId
    ? index.relationsById.get(focusedEdge.canonicalRelationId)
    : undefined;
  const focusedEdgeLabel = focusedEdge
    ? relationLabel(focusedEdge, focusedCanonicalRelation, language)
    : "";
  const focusedEdgeSource = focusedEdge
    ? index.entitiesByRef.get(focusedEdge.source)
    : undefined;
  const focusedEdgeTarget = focusedEdge
    ? index.entitiesByRef.get(focusedEdge.target)
    : undefined;

  return (
    <section className="viewer-canvas" data-testid="ontology-canvas" aria-label={text.ontologyGraph}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{text.ontologyGraph}</p>
          <h3>{text.hierarchy}</h3>
        </div>
        <div className="graph-heading-actions">
          {hiddenCaseSteps.size > 0 ? (
            <span className="case-next-step">{text.caseNextSteps(hiddenCaseSteps.size)}</span>
          ) : null}
          {view.hiddenAdjacentRefs.length > 0 ? (
            <button
              type="button"
              className="graph-expand-button"
              onClick={() => onExpandEntity(focusedEntityRef)}
            >
              {text.expandAdjacentNodes(view.hiddenAdjacentRefs.length)}
            </button>
          ) : null}
          <span
            data-testid="graph-count"
            data-node-count={view.counts.visibleNodes}
            data-edge-count={view.counts.visibleEdges}
          >
            {view.counts.visibleNodes} {text.visibleConcepts} / {view.counts.visibleEdges} {text.visibleEdges}
          </span>
        </div>
      </div>
      {view.nodes.length > 0 && (view.edges.length > 0 || view.nodes.length === 1) ? (
        <div className="cytoscape-wrap">
          <div
            ref={containerRef}
            className="cytoscape-graph"
            data-testid="cytoscape-graph"
            data-layout-engine="fcose-force"
            data-layout-policy="canonical-primary-path-rings"
            data-layout-invariant="pending"
            data-hover-relations="incoming-and-outgoing"
            data-drag-layout="continuous-local-force"
            data-crossing-policy="label-collision-and-crossing-relaxation"
            data-pan-during-drag="locked"
            data-graph-root={graphRootRef}
            data-reduced-motion={reducedMotion ? "true" : "false"}
            role="img"
            aria-label={`${text.hierarchy}: ${focusedEntity ? ontologyEntityLabel(focusedEntity, language) : graphRootRef}`}
          />
          {focusedEdge ? (
            <aside className="graph-edge-tooltip" role="tooltip">
              <strong>{focusedEdgeSource ? ontologyEntityLabel(focusedEdgeSource, language) : focusedEdge.source} — {focusedEdgeLabel} → {focusedEdgeTarget ? ontologyEntityLabel(focusedEdgeTarget, language) : focusedEdge.target}</strong>
              <span>{relationDefinition(focusedEdge, focusedCanonicalRelation, language)}</span>
            </aside>
          ) : null}
          <div className="graph-keyboard-controls" role="group" aria-label={text.hierarchy}>
            {view.nodes.map((node) => (
              <button
                key={node.ref}
                type="button"
                data-graph-node={node.ref}
                data-layout-depth={ontologyLogicalDepth(index, node.ref)}
                className={[
                  node.ref === focusedEntityRef ? "is-focused-node" : "",
                  hasScenario(node.entity.data, highlightedScenarioId) ||
                  scenarioHighlights.nodeRefs.has(node.ref)
                    ? "case-path-highlight"
                    : "",
                ].filter(Boolean).join(" ") || undefined}
                aria-pressed={node.ref === focusedEntityRef}
                onClick={() => onFocusEntity(node.ref)}
                onDoubleClick={() => onExpandEntity(node.ref)}
                onKeyDown={(event) => {
                  if (event.key === " ") {
                    event.preventDefault();
                    onExpandEntity(node.ref);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    onFocusEntity(graphRootRef);
                  }
                }}
                onKeyUp={(event) => {
                  if (event.key === " ") event.preventDefault();
                }}
              >
                {ontologyEntityLabel(node.entity, language)}
              </button>
            ))}
            {view.edges.map((edge) => {
              const relation = edge.canonicalRelationId
                ? index.relationsById.get(edge.canonicalRelationId)
                : undefined;
              const source = index.entitiesByRef.get(edge.source);
              const target = index.entitiesByRef.get(edge.target);
              const label = relationLabel(edge, relation, language);
              return (
                <button
                  key={edge.id}
                  type="button"
                  data-graph-edge={edge.id}
                  data-source={edge.source}
                  data-target={edge.target}
                  data-predicate={edge.predicate}
                  data-direction="source-to-target"
                  className={edgeClasses(
                    edge,
                    focusedEntityRef,
                    focusedRelationId,
                    hasScenario(relation, highlightedScenarioId) ||
                      scenarioHighlights.relationIds.has(edge.id),
                  )}
                  aria-pressed={edge.id === focusedRelationId}
                  title={relationDefinition(edge, relation, language)}
                  aria-label={`${source ? ontologyEntityLabel(source, language) : edge.source} — ${label} → ${target ? ontologyEntityLabel(target, language) : edge.target}`}
                  onClick={() => onFocusRelation(edge.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      onFocusEntity(graphRootRef);
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="graph-empty-state" data-testid="graph-empty-state" role="status">
          <h3>{text.graphEmptyTitle}</h3>
          <p>{text.graphEmptyBody}</p>
        </div>
      )}
    </section>
  );
};
