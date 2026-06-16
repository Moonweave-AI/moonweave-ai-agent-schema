#!/usr/bin/env python3
"""Generate self-contained visualization/index.html with embedded data."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "visualization" / "_compact_data.json").read_text(encoding="utf-8"))
OUT = ROOT / "visualization" / "index.html"

GRAPH_JSON = json.dumps(DATA, ensure_ascii=False, separators=(",", ":"))

HTML = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent Ontology Schema — Graph Explorer</title>
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0e1a;--bg2:#111827;--bg3:#1a2236;--border:#2a3550;
  --text:#e2e8f0;--muted:#94a3b8;--accent:#6366f1;
  --panel-w:340px;--bar-h:52px;
  --font:'Segoe UI',system-ui,-apple-system,sans-serif;
  --mono:'Cascadia Code','Fira Code',Consolas,monospace;
}
html,body{width:100%;height:100%;overflow:hidden;font-family:var(--font);background:var(--bg);color:var(--text)}
body.light{--bg:#f1f5f9;--bg2:#fff;--bg3:#e2e8f0;--border:#cbd5e1;--text:#0f172a;--muted:#64748b}

#app{display:flex;flex-direction:column;width:100%;height:100%}

.topbar{
  height:var(--bar-h);flex-shrink:0;display:flex;align-items:center;gap:12px;
  padding:0 16px;background:var(--bg2);border-bottom:1px solid var(--border);z-index:20;
}
.topbar h1{font-size:15px;font-weight:600;white-space:nowrap;letter-spacing:-.02em}
.topbar h1 span{color:var(--muted);font-weight:400;font-size:13px;margin-left:8px}
.controls{display:flex;align-items:center;gap:8px;margin-left:auto;flex-wrap:wrap}
.controls select,.controls input,.controls button{
  font:inherit;font-size:13px;background:var(--bg3);color:var(--text);
  border:1px solid var(--border);border-radius:6px;padding:6px 10px;outline:none;
}
.controls input{min-width:180px}
.controls input:focus,.controls select:focus{border-color:var(--accent)}
.controls button{cursor:pointer;transition:background .15s,border-color .15s}
.controls button:hover{border-color:var(--accent)}

.main{flex:1;display:flex;position:relative;overflow:hidden}
#canvas-wrap{flex:1;position:relative;cursor:grab}
#canvas-wrap.grabbing{cursor:grabbing}
#graph{width:100%;height:100%}
#graph svg{display:block}

.legend{
  position:absolute;left:12px;bottom:12px;z-index:10;
  background:rgba(10,14,26,.88);backdrop-filter:blur(8px);
  border:1px solid var(--border);border-radius:10px;padding:10px 12px;
  max-height:calc(100% - 80px);overflow-y:auto;font-size:11px;
  pointer-events:auto;transition:opacity .2s;
}
body.light .legend{background:rgba(255,255,255,.92)}
.legend h3{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px}
.legend-item{display:flex;align-items:center;gap:8px;margin-bottom:5px;cursor:pointer;padding:2px 4px;border-radius:4px;transition:background .15s}
.legend-item:hover{background:rgba(255,255,255,.06)}
.legend-item.dim{opacity:.35}
.legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.legend-label{white-space:nowrap}

.tooltip{
  position:fixed;pointer-events:none;z-index:100;
  background:rgba(17,24,39,.96);border:1px solid var(--border);
  border-radius:8px;padding:8px 12px;font-size:12px;max-width:280px;
  opacity:0;transition:opacity .12s;box-shadow:0 8px 24px rgba(0,0,0,.4);
}
body.light .tooltip{background:rgba(255,255,255,.98)}
.tooltip.visible{opacity:1}
.tooltip .tt-label{font-weight:600;margin-bottom:2px}
.tooltip .tt-zh{color:var(--muted);font-size:11px;margin-bottom:4px}
.tooltip .tt-desc{color:var(--muted);font-size:11px;line-height:1.4}

.detail-panel{
  width:0;overflow:hidden;flex-shrink:0;
  background:var(--bg2);border-left:1px solid var(--border);
  transition:width .25s cubic-bezier(.4,0,.2,1);
  display:flex;flex-direction:column;
}
.detail-panel.open{width:var(--panel-w)}
.panel-inner{padding:20px;overflow-y:auto;flex:1;opacity:0;transition:opacity .2s .05s}
.detail-panel.open .panel-inner{opacity:1}
.panel-close{
  align-self:flex-end;margin:12px 12px 0;background:none;border:none;
  color:var(--muted);cursor:pointer;font-size:20px;line-height:1;padding:4px 8px;
}
.panel-close:hover{color:var(--text)}
.panel-id{font-family:var(--mono);font-size:11px;color:var(--muted);margin-bottom:4px}
.panel-title{font-size:18px;font-weight:600;margin-bottom:2px}
.panel-zh{color:var(--muted);font-size:13px;margin-bottom:12px}
.panel-sg{
  display:inline-block;font-size:11px;padding:3px 8px;border-radius:999px;
  margin-bottom:16px;border:1px solid currentColor;opacity:.85;
}
.panel-desc{font-size:13px;line-height:1.55;color:var(--muted);margin-bottom:16px}
.panel-section{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:16px 0 8px}
.panel-links{list-style:none}
.panel-links li{
  font-size:12px;padding:6px 0;border-bottom:1px solid var(--border);
  cursor:pointer;color:var(--text);transition:color .15s;
}
.panel-links li:hover{color:var(--accent)}
.panel-links .pred{font-family:var(--mono);font-size:10px;color:var(--muted);display:block}

.node-label{
  font-family:var(--font);font-size:10px;fill:var(--text);
  pointer-events:none;text-shadow:0 1px 3px rgba(0,0,0,.8);
  transition:opacity .2s;
}
body.light .node-label{text-shadow:0 1px 2px rgba(255,255,255,.9)}
.cluster-label{
  font-family:var(--font);font-size:13px;font-weight:600;
  fill:var(--text);opacity:.12;pointer-events:none;text-anchor:middle;
  transition:opacity .2s;
}
body.light .cluster-label{opacity:.18}

.status-bar{
  position:absolute;bottom:12px;right:12px;z-index:10;
  font-size:11px;color:var(--muted);background:rgba(10,14,26,.7);
  padding:4px 10px;border-radius:6px;pointer-events:none;
}
body.light .status-bar{background:rgba(255,255,255,.8)}

@media(max-width:768px){
  :root{--panel-w:100%}
  .topbar h1 span{display:none}
  .controls input{min-width:120px}
}
</style>
</head>
<body>
<div id="app">
  <header class="topbar">
    <h1>Agent Ontology Schema<span>277 nodes · 13 subgraphs</span></h1>
    <div class="controls">
      <select id="view-select" title="View mode">
        <option value="full">Full Graph</option>
        <option value="0">SG0 — Meta Graph</option>
        <option value="1">SG1 — Agent Core</option>
        <option value="2">SG2 — Context Info</option>
        <option value="3">SG3 — Memory</option>
        <option value="4">SG4 — Reasoning</option>
        <option value="5">SG5 — Tool/Action</option>
        <option value="6">SG6 — Orchestration</option>
        <option value="7">SG7 — Runtime</option>
        <option value="8">SG8 — Safety</option>
        <option value="9">SG9 — Protocol</option>
        <option value="10">SG10 — SDK</option>
        <option value="11">SG11 — Environment</option>
        <option value="12">SG12 — Validation</option>
      </select>
      <select id="path-select" title="Highlight path">
        <option value="">Key Path…</option>
      </select>
      <input type="search" id="search" placeholder="Search nodes…" autocomplete="off">
      <button id="theme-toggle" title="Toggle theme">☀</button>
      <button id="reset-view" title="Reset zoom">Reset</button>
    </div>
  </header>
  <div class="main">
    <div id="canvas-wrap">
      <div id="graph"></div>
      <div class="legend" id="legend"></div>
      <div class="status-bar" id="status"></div>
    </div>
    <aside class="detail-panel" id="detail-panel">
      <button class="panel-close" id="panel-close" aria-label="Close">×</button>
      <div class="panel-inner" id="panel-content"></div>
    </aside>
  </div>
</div>
<div class="tooltip" id="tooltip"></div>

<script type="application/json" id="graph-data">''' + GRAPH_JSON + r'''</script>

<script>
(function(){
'use strict';

const RAW = JSON.parse(document.getElementById('graph-data').textContent);
const SG = RAW.subgraphs;
const HUBS = new Set(RAW.hubs);

const nodes = RAW.nodes.map((n, i) => ({
  id: i,
  key: n[0],
  label: n[1],
  label_zh: n[2],
  sg: n[3],
  desc: n[4],
  sgMeta: SG.find(s => s.i === n[3])
}));

const nodeById = new Map(nodes.map(n => [n.id, n]));
const nodeByKey = new Map(nodes.map(n => [n.key, n]));

const edges = RAW.edges.map((e, i) => {
  const src = nodeById.get(e[1]);
  const tgt = nodeById.get(e[2]);
  const cross = src && tgt && src.sg !== tgt.sg;
  return {
    id: i,
    predicate: e[0],
    source: e[1],
    target: e[2],
    sg: e[3],
    cross
  };
});

const adjacency = new Map();
nodes.forEach(n => adjacency.set(n.id, { in: [], out: [], all: new Set() }));
edges.forEach(e => {
  adjacency.get(e.source).out.push(e);
  adjacency.get(e.target).in.push(e);
  adjacency.get(e.source).all.add(e.target);
  adjacency.get(e.target).all.add(e.source);
});

const sgColor = new Map(SG.map(s => [s.i, s.color]));
const sgPos = new Map(SG.map(s => [s.i, { x: s.x, y: s.y }]));

let state = {
  selected: null,
  pathNodes: null,
  searchMatch: null,
  focusSg: null,
  zoomK: 1
};

const wrap = document.getElementById('canvas-wrap');
const graphEl = document.getElementById('graph');
const tooltip = document.getElementById('tooltip');
const panel = document.getElementById('detail-panel');
const panelContent = document.getElementById('panel-content');
const statusEl = document.getElementById('status');
const legendEl = document.getElementById('legend');

function dims() {
  const r = wrap.getBoundingClientRect();
  return { w: r.width, h: r.height };
}

let svg, gRoot, gClusters, gEdges, gNodes, gLabels, gClusterLabels, zoom, simulation;

function initGraph() {
  graphEl.innerHTML = '';
  const { w, h } = dims();

  svg = d3.select('#graph').append('svg')
    .attr('width', w).attr('height', h)
    .attr('viewBox', [0, 0, w, h]);

  const defs = svg.append('defs');
  SG.forEach(s => {
    const gr = defs.append('radialGradient')
      .attr('id', 'glow-' + s.i)
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
    gr.append('stop').attr('offset', '0%').attr('stop-color', s.color).attr('stop-opacity', 0.14);
    gr.append('stop').attr('offset', '100%').attr('stop-color', s.color).attr('stop-opacity', 0);
  });

  gRoot = svg.append('g');
  gClusters = gRoot.append('g').attr('class', 'clusters');
  gClusterLabels = gRoot.append('g').attr('class', 'cluster-labels');
  gEdges = gRoot.append('g').attr('class', 'edges');
  gNodes = gRoot.append('g').attr('class', 'nodes');
  gLabels = gRoot.append('g').attr('class', 'labels');

  zoom = d3.zoom()
    .scaleExtent([0.15, 5])
    .on('zoom', (ev) => {
      gRoot.attr('transform', ev.transform);
      state.zoomK = ev.transform.k;
      updateLabelVisibility(ev.transform.k);
    });

  svg.call(zoom).on('click', (ev) => {
    if (ev.target === svg.node() || ev.target.tagName === 'rect') deselect();
  });

  drawClusters();
  runSimulation();
  buildLegend();
  buildPathSelect();
  updateStatus();
}

function drawClusters() {
  const clusterData = SG.map(s => {
    const p = scaledSgPos(s.i);
    return {
      ...s,
      x: p.x,
      y: p.y,
      r: (Math.sqrt(nodes.filter(n => n.sg === s.i).length) * 18 + 36) * Math.max(Math.min(dims().w, dims().h) / 1100, 0.65)
    };
  });

  gClusters.selectAll('circle.cluster')
    .data(clusterData, d => d.i)
    .join('circle')
    .attr('class', 'cluster')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', d => d.r)
    .attr('fill', d => 'url(#glow-' + d.i + ')')
    .attr('stroke', d => d.color)
    .attr('stroke-opacity', 0.08)
    .attr('stroke-width', 1);

  gClusterLabels.selectAll('text')
    .data(clusterData, d => d.i)
    .join('text')
    .attr('class', 'cluster-label')
    .attr('x', d => d.x)
    .attr('y', d => d.y - d.r + 16)
    .text(d => d.label);
}

function scaledSgPos(sg) {
  const { w, h } = dims();
  const scale = Math.min(w, h) / 1100;
  const p = sgPos.get(sg);
  return { x: w / 2 + p.x * scale, y: h / 2 + p.y * scale };
}

function runSimulation() {
  const { w, h } = dims();

  nodes.forEach(n => {
    const p = scaledSgPos(n.sg);
    n.x = p.x + (Math.random() - 0.5) * 30;
    n.y = p.y + (Math.random() - 0.5) * 30;
    n.fx = null;
    n.fy = null;
  });

  const linkData = edges.map(e => ({
    ...e,
    source: e.source,
    target: e.target
  }));

  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(linkData)
      .id(d => d.id)
      .distance(d => d.cross ? 140 : 38)
      .strength(d => d.cross ? 0.08 : 0.75))
    .force('charge', d3.forceManyBody().strength(d => HUBS.has(d.id) ? -140 : -55))
    .force('collide', d3.forceCollide().radius(d => nodeRadius(d) + 4).iterations(3))
    .force('sgX', d3.forceX(d => scaledSgPos(d.sg).x).strength(0.55))
    .force('sgY', d3.forceY(d => scaledSgPos(d.sg).y).strength(0.55))
    .force('center', d3.forceCenter(w / 2, h / 2).strength(0.015))
    .alpha(1)
    .alphaDecay(0.022)
    .on('tick', ticked);

  const edgeSel = gEdges.selectAll('line.edge')
    .data(linkData, d => d.id)
    .join('line')
    .attr('class', 'edge')
    .attr('stroke', d => d.cross ? '#94a3b8' : sgColor.get(d.sg))
    .attr('stroke-opacity', d => d.cross ? 0.45 : 0.22)
    .attr('stroke-width', d => d.cross ? 1.8 : 1);

  const nodeSel = gNodes.selectAll('circle.node')
    .data(nodes, d => d.id)
    .join('circle')
    .attr('class', 'node')
    .attr('r', d => nodeRadius(d))
    .attr('fill', d => sgColor.get(d.sg))
    .attr('stroke', '#0a0e1a')
    .attr('stroke-width', 1.2)
    .style('cursor', 'pointer')
    .on('click', (ev, d) => { ev.stopPropagation(); selectNode(d); })
    .on('mouseenter', (ev, d) => showTooltip(ev, d))
    .on('mousemove', moveTooltip)
    .on('mouseleave', hideTooltip)
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded));

  const labelSel = gLabels.selectAll('text.node-label')
    .data(nodes, d => d.id)
    .join('text')
    .attr('class', 'node-label')
    .attr('text-anchor', 'middle')
    .attr('dy', d => nodeRadius(d) + 11)
    .text(d => d.label);

  function ticked() {
    edgeSel
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    nodeSel.attr('cx', d => d.x).attr('cy', d => d.y);
    labelSel.attr('x', d => d.x).attr('y', d => d.y);
    updateStyles();
  }

  updateLabelVisibility(state.zoomK);
}

function nodeRadius(d) {
  if (HUBS.has(d.id)) return 8;
  return 5;
}

function updateLabelVisibility(k) {
  gLabels.selectAll('text').style('opacity', 1);
}

function updateStyles() {
  const sel = state.selected;
  const pathSet = state.pathNodes;
  const searchSet = state.searchMatch;
  const focus = state.focusSg;

  const dimmed = sel !== null || pathSet !== null || searchSet !== null || focus !== null;

  gNodes.selectAll('circle').each(function(d) {
    const el = d3.select(this);
    let active = true;
    if (focus !== null && d.sg !== focus) active = false;
    if (pathSet && !pathSet.has(d.id)) active = false;
    if (searchSet && !searchSet.has(d.id)) active = false;
    if (sel !== null) {
      const neigh = adjacency.get(sel).all;
      active = d.id === sel || neigh.has(d.id);
    }
    el.transition().duration(200)
      .attr('opacity', dimmed && !active ? 0.12 : 1)
      .attr('stroke-width', d.id === sel ? 2.5 : 1.2)
      .attr('stroke', d.id === sel ? '#fff' : '#0a0e1a')
      .attr('r', d.id === sel ? nodeRadius(d) + 2 : nodeRadius(d));
  });

  gEdges.selectAll('line').each(function(d) {
    const el = d3.select(this);
    let active = true;
    let highlight = false;
    if (focus !== null && d.sg !== focus && !d.cross) active = false;
    if (pathSet) {
      active = pathSet.has(d.source.id ?? d.source) && pathSet.has(d.target.id ?? d.target);
      highlight = active;
    }
    if (searchSet) active = searchSet.has(d.source.id ?? d.source) || searchSet.has(d.target.id ?? d.target);
    if (sel !== null) {
      const s = d.source.id ?? d.source;
      const t = d.target.id ?? d.target;
      active = s === sel || t === sel;
      highlight = active;
    }
    el.transition().duration(200)
      .attr('opacity', dimmed && !active ? 0.04 : (highlight ? 0.9 : d.cross ? 0.45 : 0.22))
      .attr('stroke-width', highlight ? (d.cross ? 2.5 : 2) : (d.cross ? 1.8 : 1));
  });

  gLabels.selectAll('text').style('opacity', function(d) {
    if (sel !== null) {
      const neigh = adjacency.get(sel).all;
      if (d.id !== sel && !neigh.has(d.id)) return 0.08;
    }
    if (pathSet && !pathSet.has(d.id)) return 0.08;
    if (searchSet && !searchSet.has(d.id)) return 0.08;
    if (focus !== null && d.sg !== focus) return 0.08;
    return 1;
  });

  gClusters.selectAll('circle').attr('opacity', focus !== null ? 0.3 : 1);
  legendEl.querySelectorAll('.legend-item').forEach(el => {
    const sg = +el.dataset.sg;
    el.classList.toggle('dim', focus !== null && focus !== sg);
  });
}

function selectNode(d) {
  state.selected = d.id;
  state.pathNodes = null;
  document.getElementById('path-select').value = '';
  panel.classList.add('open');
  renderPanel(d);
  updateStyles();
  updateLabelVisibility(state.zoomK);

  const { w, h } = dims();
  const scale = Math.max(state.zoomK, 0.8);
  svg.transition().duration(400).call(
    zoom.transform,
    d3.zoomIdentity.translate(w / 2, h / 2).scale(scale).translate(-d.x, -d.y)
  );
}

function deselect() {
  state.selected = null;
  panel.classList.remove('open');
  updateStyles();
  updateLabelVisibility(state.zoomK);
}

function renderPanel(d) {
  const links = [];
  adjacency.get(d.id).out.forEach(e => {
    const t = nodeById.get(e.target);
    links.push({ dir: 'out', pred: e.predicate, node: t });
  });
  adjacency.get(d.id).in.forEach(e => {
    const s = nodeById.get(e.source);
    links.push({ dir: 'in', pred: e.predicate, node: s });
  });

  panelContent.innerHTML = `
    <div class="panel-id">${d.key}</div>
    <div class="panel-title">${d.label}</div>
    ${d.label_zh ? `<div class="panel-zh">${d.label_zh}</div>` : ''}
    <span class="panel-sg" style="color:${d.sgMeta.color}">${d.sgMeta.label}</span>
    <p class="panel-desc">${d.desc}…</p>
    <div class="panel-section">Connections (${links.length})</div>
    <ul class="panel-links">
      ${links.slice(0, 24).map(l => `
        <li data-id="${l.node.id}">
          <span class="pred">${l.dir === 'out' ? '→' : '←'} ${l.pred}</span>
          ${l.node.label}
        </li>`).join('')}
      ${links.length > 24 ? `<li style="color:var(--muted);cursor:default">+ ${links.length - 24} more</li>` : ''}
    </ul>`;

  panelContent.querySelectorAll('.panel-links li[data-id]').forEach(li => {
    li.addEventListener('click', () => {
      const n = nodeById.get(+li.dataset.id);
      if (n) selectNode(n);
    });
  });
}

function showTooltip(ev, d) {
  tooltip.innerHTML = `
    <div class="tt-label">${d.label}</div>
    ${d.label_zh ? `<div class="tt-zh">${d.label_zh}</div>` : ''}
    <div class="tt-desc">${d.desc}</div>`;
  tooltip.classList.add('visible');
  moveTooltip(ev);
}

function moveTooltip(ev) {
  tooltip.style.left = (ev.clientX + 14) + 'px';
  tooltip.style.top = (ev.clientY + 14) + 'px';
}

function hideTooltip() {
  tooltip.classList.remove('visible');
}

function dragStarted(ev, d) {
  if (!ev.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
  wrap.classList.add('grabbing');
}

function dragged(ev, d) {
  d.fx = ev.x;
  d.fy = ev.y;
}

function dragEnded(ev, d) {
  if (!ev.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
  wrap.classList.remove('grabbing');
}

function buildLegend() {
  legendEl.innerHTML = '<h3>Subgraphs</h3>' + SG.map(s => `
    <div class="legend-item" data-sg="${s.i}" title="${s.label_zh}">
      <span class="legend-dot" style="background:${s.color}"></span>
      <span class="legend-label">SG${s.i} ${s.label}</span>
    </div>`).join('');

  legendEl.querySelectorAll('.legend-item').forEach(el => {
    el.addEventListener('click', () => {
      const sg = +el.dataset.sg;
      const sel = document.getElementById('view-select');
      if (state.focusSg === sg) {
        state.focusSg = null;
        sel.value = 'full';
      } else {
        state.focusSg = sg;
        sel.value = String(sg);
      }
      state.selected = null;
      state.pathNodes = null;
      panel.classList.remove('open');
      document.getElementById('path-select').value = '';
      focusSubgraph(state.focusSg);
      updateStyles();
    });
  });
}

function focusSubgraph(sg) {
  const str = sg === null ? 0.55 : 0.7;
  simulation.force('sgX', d3.forceX(d => scaledSgPos(d.sg).x).strength(str));
  simulation.force('sgY', d3.forceY(d => scaledSgPos(d.sg).y).strength(str));
  simulation.alpha(0.4).restart();
  drawClusters();
  if (sg === null) return;
  const { w, h } = dims();
  const p = scaledSgPos(sg);
  svg.transition().duration(500).call(
    zoom.transform,
    d3.zoomIdentity.translate(w / 2, h / 2).scale(1.5).translate(-p.x, -p.y)
  );
}

function buildPathSelect() {
  const sel = document.getElementById('path-select');
  RAW.paths.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    const id = sel.value;
    state.selected = null;
    panel.classList.remove('open');
    if (!id) {
      state.pathNodes = null;
      updateStyles();
      return;
    }
    const path = RAW.paths.find(p => p.id === id);
    state.pathNodes = new Set(path.nodes);
    state.focusSg = null;
    document.getElementById('view-select').value = 'full';
    updateStyles();
    updateLabelVisibility(state.zoomK);
    fitToNodes(path.nodes);
  });
}

function fitToNodes(ids) {
  const ns = ids.map(i => nodeById.get(i)).filter(Boolean);
  if (!ns.length) return;
  const { w, h } = dims();
  const x0 = d3.min(ns, d => d.x), x1 = d3.max(ns, d => d.x);
  const y0 = d3.min(ns, d => d.y), y1 = d3.max(ns, d => d.y);
  const pad = 80;
  const dx = x1 - x0 + pad * 2, dy = y1 - y0 + pad * 2;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const scale = Math.min(3, 0.85 / Math.max(dx / w, dy / h));
  svg.transition().duration(600).call(
    zoom.transform,
    d3.zoomIdentity.translate(w / 2, h / 2).scale(scale).translate(-cx, -cy)
  );
}

function updateStatus() {
  statusEl.textContent = `${nodes.length} nodes · ${edges.length} edges · ${edges.filter(e => e.cross).length} cross-links`;
}

document.getElementById('view-select').addEventListener('change', (ev) => {
  const v = ev.target.value;
  state.focusSg = v === 'full' ? null : +v;
  state.selected = null;
  state.pathNodes = null;
  panel.classList.remove('open');
  document.getElementById('path-select').value = '';
  focusSubgraph(state.focusSg);
  updateStyles();
});

document.getElementById('search').addEventListener('input', (ev) => {
  const q = ev.target.value.trim().toLowerCase();
  if (!q) {
    state.searchMatch = null;
    updateStyles();
    return;
  }
  const matches = new Set();
  nodes.forEach(n => {
    if (n.key.includes(q) || n.label.toLowerCase().includes(q) ||
        (n.label_zh && n.label_zh.includes(q))) {
      matches.add(n.id);
      adjacency.get(n.id).all.forEach(id => matches.add(id));
    }
  });
  state.searchMatch = matches.size ? matches : new Set([-1]);
  state.selected = null;
  state.pathNodes = null;
  panel.classList.remove('open');
  updateStyles();
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  document.getElementById('theme-toggle').textContent =
    document.body.classList.contains('light') ? '🌙' : '☀';
});

document.getElementById('reset-view').addEventListener('click', () => {
  const { w, h } = dims();
  state.selected = null;
  state.pathNodes = null;
  state.searchMatch = null;
  state.focusSg = null;
  panel.classList.remove('open');
  document.getElementById('search').value = '';
  document.getElementById('path-select').value = '';
  document.getElementById('view-select').value = 'full';
  svg.transition().duration(500).call(
    zoom.transform,
    d3.zoomIdentity.translate(0, 0).scale(1)
  );
  updateStyles();
});

document.getElementById('panel-close').addEventListener('click', deselect);

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const { w, h } = dims();
    svg.attr('width', w).attr('height', h);
    simulation.force('center', d3.forceCenter(w / 2, h / 2).strength(0.015));
    simulation.force('sgX', d3.forceX(d => scaledSgPos(d.sg).x).strength(0.55));
    simulation.force('sgY', d3.forceY(d => scaledSgPos(d.sg).y).strength(0.55));
    drawClusters();
    simulation.alpha(0.25).restart();
  }, 200);
});

initGraph();
})();
</script>
</body>
</html>'''

OUT.write_text(HTML, encoding="utf-8")
print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
