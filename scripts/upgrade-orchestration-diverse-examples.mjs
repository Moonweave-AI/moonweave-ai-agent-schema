#!/usr/bin/env node
/**
 * Upgrade orchestration-plane node.yaml example descriptions with diverse
 * authoritative paper/project citations (ReAct, CoT, ToT, Reflexion, MRKL,
 * Voyager, TaskWeaver, AutoGen, DSPy, CrewAI, Prefect, Temporal, A2A, LiteLLM).
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_IDS,
  detectSourceInText,
  generateDescription,
  getModuleKey,
  getSourcesForNode,
  inferExampleKind,
} from './orchestration-diverse-sources.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const ORCH_ROOT = join(REPO_ROOT, 'ontology', 'orchestration-plane');
const SUMMARY_PATH = join(REPO_ROOT, 'docs', 'orchestration-examples-upgrade-summary.json');

async function collectNodeFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectNodeFiles(full)));
    } else if (entry.name === 'node.yaml') {
      files.push(full);
    }
  }
  return files.sort();
}

function parseNodeId(lines) {
  for (const line of lines) {
    const m = line.match(/^id:\s*(\S+)/);
    if (m) return m[1];
  }
  return null;
}

/**
 * Assign sources to examples ensuring >=3 unique sources per node when possible.
 */
function assignSources(examples, nodeSources) {
  const assigned = [];
  const used = new Set();

  for (let i = 0; i < examples.length; i++) {
    const ex = examples[i];
    const existing = detectSourceInText(ex.currentEn || ex.currentZh);
    let source = null;

    if (existing && nodeSources.includes(existing) && !assigned.some((a, j) => j !== i && a.source === existing)) {
      source = existing;
    } else {
      source = nodeSources[i % nodeSources.length];
      for (let offset = 0; offset < nodeSources.length; offset++) {
        const candidate = nodeSources[(i + offset) % nodeSources.length];
        const count = assigned.filter((a) => a.source === candidate).length;
        if (count === 0 || (examples.length <= nodeSources.length)) {
          source = candidate;
          break;
        }
      }
    }

    if (examples.length >= 3) {
      const kind = inferExampleKind(ex.id);
      const preferredByKind = {
        positive: nodeSources[0],
        boundary: nodeSources[1] || nodeSources[0],
        counterexample: nodeSources[2] || nodeSources[0],
        instance: nodeSources[Math.min(3, nodeSources.length - 1)] || nodeSources[0],
      };
      if (i < 4) {
        source = preferredByKind[kind] || source;
      }
    }

    used.add(source);
    assigned.push({ ...ex, source, kind: inferExampleKind(ex.id) });
  }

  if (used.size < 3 && nodeSources.length >= 3) {
    for (let i = 0; i < assigned.length && used.size < 3; i++) {
      for (const candidate of nodeSources) {
        if (!assigned.some((a) => a.source === candidate)) {
          assigned[i].source = candidate;
          used.add(candidate);
          break;
        }
      }
    }
  }

  return assigned;
}

function updateFileLines(lines, nodeId, moduleKey) {
  const nodeSources = getSourcesForNode(nodeId, moduleKey);
  const examples = [];
  let inExamples = false;
  let current = null;
  let inDescriptions = false;
  let descLang = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === 'examples:') {
      inExamples = true;
      continue;
    }
    if (inExamples && /^(parent_relation|sources|source_claims):/.test(line)) {
      inExamples = false;
      if (current) examples.push(current);
      current = null;
    }

    if (!inExamples) continue;

    const idMatch = line.match(/^  - id: (.+)$/);
    if (idMatch) {
      if (current) examples.push(current);
      current = { id: idMatch[1], startLine: i, currentZh: '', currentEn: '', currentJa: '' };
      inDescriptions = false;
      continue;
    }

    if (current && line === '    descriptions:') {
      inDescriptions = true;
      descLang = null;
      continue;
    }

    if (current && inDescriptions) {
      const m = line.match(/^      (zh|en|ja): (.+)$/);
      if (m) {
        current[`current${m[1].charAt(0).toUpperCase()}${m[1].slice(1)}`] = m[2];
        descLang = m[1];
        continue;
      }
      if (!/^      /.test(line)) {
        inDescriptions = false;
      }
    }
  }
  if (current) examples.push(current);

  if (examples.length === 0) return { changed: false, sources: [] };

  const assigned = assignSources(examples, nodeSources);
  const newLines = [...lines];
  let changed = false;
  const fileSources = new Set();

  for (const ex of assigned) {
    const ctx = { nodeId, kind: ex.kind, module: moduleKey };
    const desc = generateDescription(ex.source, ctx);
    fileSources.add(ex.source);

    let inTarget = false;
    let inDesc = false;
    for (let i = ex.startLine; i < newLines.length; i++) {
      const line = newLines[i];
      if (/^  - id: /.test(line) && i !== ex.startLine) break;
      if (line === '    descriptions:') {
        inTarget = true;
        inDesc = true;
        continue;
      }
      if (inDesc) {
        const m = line.match(/^      (zh|en|ja): /);
        if (m) {
          const lang = m[1];
          const newLine = `      ${lang}: ${desc[lang]}`;
          if (newLines[i] !== newLine) {
            newLines[i] = newLine;
            changed = true;
          }
        } else if (!/^      /.test(line)) {
          inDesc = false;
          if (inTarget) break;
        }
      }
    }
  }

  return { changed, sources: [...fileSources], assigned };
}

async function main() {
  const files = await collectNodeFiles(ORCH_ROOT);
  const globalSourceCounts = Object.fromEntries(SOURCE_IDS.map((s) => [s, 0]));
  const nodesProcessed = [];
  let filesUpdated = 0;
  let examplesUpdated = 0;
  const newSourcesIntroduced = new Set();

  for (const filePath of files) {
    const rel = relative(ORCH_ROOT, filePath).replace(/\\/g, '/');
    const moduleKey = getModuleKey(rel);
    const content = await readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const nodeId = parseNodeId(lines);
    if (!nodeId) continue;

    const { changed, sources, assigned } = updateFileLines(lines, nodeId, moduleKey);
    if (changed) {
      await writeFile(filePath, lines.join('\n') + (content.endsWith('\n') ? '\n' : ''), 'utf8');
      filesUpdated++;
      examplesUpdated += assigned?.length || 0;
    }

    for (const s of sources) {
      globalSourceCounts[s] = (globalSourceCounts[s] || 0) + 1;
      newSourcesIntroduced.add(s);
    }

    nodesProcessed.push({
      nodeId,
      path: rel,
      module: moduleKey,
      sources: sources.sort(),
      sourceCount: sources.length,
      examples: assigned?.map((a) => ({ id: a.id, source: a.source, kind: a.kind })) || [],
      updated: changed,
    });
  }

  const summary = {
    processedAt: new Date().toISOString(),
    nodesTotal: files.length,
    nodesUpdated: filesUpdated,
    examplesUpdated,
    uniqueSourcesIntroduced: [...newSourcesIntroduced].sort(),
    sourceCitationCounts: globalSourceCounts,
    nodes: nodesProcessed,
  };

  await mkdir(join(REPO_ROOT, 'docs'), { recursive: true });
  await writeFile(SUMMARY_PATH, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  console.log(`Processed ${files.length} nodes`);
  console.log(`Updated ${filesUpdated} node.yaml files (${examplesUpdated} example descriptions)`);
  console.log('Source citation counts (nodes referencing each source):');
  for (const [source, count] of Object.entries(globalSourceCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source}: ${count}`);
  }
  console.log(`Summary written to ${SUMMARY_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
