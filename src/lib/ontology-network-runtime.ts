import type { DataSet } from "vis-data";
import type { Edge, Network, Node, Options } from "vis-network";

import {
  GRAPHIFY_FORCE_ATLAS_OPTIONS,
  type OntologyCommunityNetworkModel,
} from "./ontology-community-network";
import type { OntologyEntityRef } from "./ontology-index";

interface NetworkClickEvent {
  readonly nodes: readonly (string | number)[];
  readonly edges: readonly (string | number)[];
}

interface NetworkNodeEvent { readonly node: string | number }

export interface OntologyNetworkRuntimeCallbacks {
  readonly onNodeFocus: (ref: OntologyEntityRef) => void;
  readonly onRelationFocus: (relationId: string | null) => void;
  readonly onStabilizing: () => void;
  readonly onStable: () => void;
}

export interface OntologyNetworkRuntime {
  readonly fit: (animate: boolean) => void;
  readonly focusNode: (ref: OntologyEntityRef, animate: boolean) => void;
  readonly setFocusedNode: (ref: OntologyEntityRef) => void;
  readonly setHiddenCommunities: (communityIds: ReadonlySet<number>) => void;
  readonly updateModel: (model: OntologyCommunityNetworkModel) => void;
  readonly stabilize: () => void;
  readonly destroy: () => void;
}

const safeTooltipElement = (text: string): HTMLDivElement => {
  const tooltip = document.createElement("div");
  tooltip.className = "ontology-network-tooltip";
  text.split("\n").forEach((line, index) => {
    if (index > 0) tooltip.append(document.createElement("br"));
    tooltip.append(document.createTextNode(line));
  });
  return tooltip;
};

const networkOptions = (): Options => ({
  layout: { ...GRAPHIFY_FORCE_ATLAS_OPTIONS.layout },
  physics: {
    ...GRAPHIFY_FORCE_ATLAS_OPTIONS.physics,
    enabled: false,
    forceAtlas2Based: { ...GRAPHIFY_FORCE_ATLAS_OPTIONS.physics.forceAtlas2Based },
    stabilization: { ...GRAPHIFY_FORCE_ATLAS_OPTIONS.physics.stabilization },
  },
  interaction: {
    hover: true,
    tooltipDelay: 120,
    hideEdgesOnDrag: true,
    navigationButtons: false,
    keyboard: { enabled: false, bindToWindow: false },
    multiselect: false,
  },
  nodes: {
    shape: "dot",
    borderWidth: 1.5,
    chosen: true,
  },
  edges: {
    smooth: false,
    selectionWidth: 3,
    hoverWidth: 0.5,
    chosen: true,
  },
  configure: false,
  autoResize: true,
});

const nodeData = (model: OntologyCommunityNetworkModel): readonly Node[] =>
  model.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    title: safeTooltipElement(node.titleText),
    color: node.color,
    size: node.size,
    font: node.font,
    shape: "dot",
    borderWidth: 1.5,
  }));

const edgeData = (model: OntologyCommunityNetworkModel): readonly Edge[] =>
  model.edges.map((edge) => ({
    id: edge.id,
    from: edge.from,
    to: edge.to,
    label: "",
    title: safeTooltipElement(edge.titleText),
    physics: edge.physics,
    dashes: edge.dashes,
    width: edge.width,
    color: {
      color: edge.color,
      highlight: edge.color,
      hover: edge.color,
      opacity: edge.opacity,
    },
    arrows: edge.arrows,
    smooth: edge.smooth,
  }));

export const createOntologyNetworkRuntime = async (
  container: HTMLDivElement,
  model: OntologyCommunityNetworkModel,
  callbacks: OntologyNetworkRuntimeCallbacks,
): Promise<OntologyNetworkRuntime> => {
  const [{ Network: NetworkConstructor }, { DataSet: DataSetConstructor }] = await Promise.all([
    import("vis-network"),
    import("vis-data"),
  ]);
  const nodes: DataSet<Node> = new DataSetConstructor<Node>([...nodeData(model)]);
  const edges: DataSet<Edge> = new DataSetConstructor<Edge>([...edgeData(model)]);
  const network: Network = new NetworkConstructor(container, { nodes, edges }, networkOptions());
  let currentModel = model;
  let nodesById = new Map(model.nodes.map((node) => [node.id, node]));
  let edgesById = new Map(model.edges.map((edge) => [edge.id, edge]));
  let focusedRef: OntologyEntityRef | null = null;
  let destroyed = false;
  let stabilizing = false;

  const updateNodeFont = (ref: OntologyEntityRef, size: number): void => {
    const node = nodesById.get(ref);
    if (!node || destroyed) return;
    nodes.update({ id: ref, font: { ...node.font, size } });
  };

  const freeze = (): void => {
    if (destroyed) return;
    stabilizing = false;
    network.setOptions({ physics: { enabled: false } });
    callbacks.onStable();
  };

  const stabilize = (): void => {
    if (destroyed || stabilizing) return;
    stabilizing = true;
    callbacks.onStabilizing();
    network.once("stabilizationIterationsDone", freeze);
    network.setOptions({
      physics: {
        ...GRAPHIFY_FORCE_ATLAS_OPTIONS.physics,
        enabled: true,
        forceAtlas2Based: { ...GRAPHIFY_FORCE_ATLAS_OPTIONS.physics.forceAtlas2Based },
        stabilization: { ...GRAPHIFY_FORCE_ATLAS_OPTIONS.physics.stabilization },
      },
    });
    network.stabilize(GRAPHIFY_FORCE_ATLAS_OPTIONS.physics.stabilization.iterations);
  };

  network.on("click", (event: NetworkClickEvent) => {
    const nodeId = event.nodes[0];
    if (typeof nodeId === "string" && nodesById.has(nodeId as OntologyEntityRef)) {
      callbacks.onNodeFocus(nodeId as OntologyEntityRef);
      return;
    }
    const edgeId = event.edges[0];
    if (typeof edgeId === "string") {
      const edge = edgesById.get(edgeId);
      if (edge?.canonicalRelationId) callbacks.onRelationFocus(edge.canonicalRelationId);
      else callbacks.onRelationFocus(null);
      return;
    }
    callbacks.onRelationFocus(null);
  });
  network.on("hoverNode", (event: NetworkNodeEvent) => {
    const ref = String(event.node) as OntologyEntityRef;
    updateNodeFont(ref, Math.max(nodesById.get(ref)?.baseFontSize ?? 0, 12));
    container.style.cursor = "pointer";
  });
  network.on("blurNode", (event: NetworkNodeEvent) => {
    const ref = String(event.node) as OntologyEntityRef;
    const base = nodesById.get(ref)?.baseFontSize ?? 0;
    updateNodeFont(ref, focusedRef === ref ? Math.max(base, 13) : base);
    container.style.cursor = "default";
  });
  network.on("hoverEdge", () => { container.style.cursor = "pointer"; });
  network.on("blurEdge", () => { container.style.cursor = "default"; });

  stabilize();

  return {
    fit: (animate) => network.fit({
      animation: animate ? { duration: 350, easingFunction: "easeInOutQuad" } : false,
    }),
    focusNode: (ref, animate) => {
      if (!nodesById.has(ref)) return;
      network.selectNodes([ref]);
      network.focus(ref, {
        scale: 1.35,
        animation: animate ? { duration: 320, easingFunction: "easeInOutQuad" } : false,
      });
    },
    setFocusedNode: (ref) => {
      if (focusedRef && focusedRef !== ref) {
        updateNodeFont(focusedRef, nodesById.get(focusedRef)?.baseFontSize ?? 0);
      }
      if (!nodesById.has(ref)) {
        focusedRef = null;
        network.unselectAll();
        return;
      }
      focusedRef = ref;
      updateNodeFont(ref, Math.max(nodesById.get(ref)?.baseFontSize ?? 0, 13));
      network.selectNodes([ref]);
    },
    setHiddenCommunities: (communityIds) => {
      const hiddenNodeRefs = new Set(currentModel.nodes
        .filter(({ communityId }) => communityIds.has(communityId))
        .map(({ id }) => id));
      nodes.update(currentModel.nodes.map((node) => ({
        id: node.id,
        hidden: hiddenNodeRefs.has(node.id),
      })));
      edges.update(currentModel.edges.map((edge) => ({
        id: edge.id,
        hidden: hiddenNodeRefs.has(edge.from) || hiddenNodeRefs.has(edge.to),
      })));
    },
    updateModel: (nextModel) => {
      currentModel = nextModel;
      nodesById = new Map(nextModel.nodes.map((node) => [node.id, node]));
      edgesById = new Map(nextModel.edges.map((edge) => [edge.id, edge]));
      nodes.update([...nodeData(nextModel)]);
      edges.update([...edgeData(nextModel)]);
      if (focusedRef && !nodesById.has(focusedRef)) {
        focusedRef = null;
        network.unselectAll();
      } else if (focusedRef) {
        updateNodeFont(
          focusedRef,
          Math.max(nodesById.get(focusedRef)?.baseFontSize ?? 0, 13),
        );
      }
    },
    stabilize,
    destroy: () => {
      destroyed = true;
      stabilizing = false;
      network.destroy();
    },
  };
};
