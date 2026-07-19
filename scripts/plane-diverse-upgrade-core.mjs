/** Shared upgrade logic for plane example description diversification. */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

export async function collectNodeFiles(dir) {
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

export function parseNodeId(lines) {
  for (const line of lines) {
    const m = line.match(/^id:\s*(\S+)/);
    if (m) return m[1];
  }
  return null;
}

export function inferExampleKind(exampleId) {
  const id = exampleId.toLowerCase();
  if (id.includes('counterexample') || id.includes('confusable') || id.includes('negative')) {
    return 'counterexample';
  }
  if (id.includes('boundary')) return 'boundary';
  if (id.includes('instance') || id.includes('concrete')) return 'instance';
  return 'positive';
}

export function assignSources(examples, nodeSources) {
  const assigned = [];
  const used = new Set();

  for (let i = 0; i < examples.length; i++) {
    const ex = examples[i];
    let source = nodeSources[i % nodeSources.length];

    if (examples.length >= 3) {
      const kind = inferExampleKind(ex.id);
      const preferredByKind = {
        positive: nodeSources[0],
        boundary: nodeSources[1] || nodeSources[0],
        counterexample: nodeSources[2] || nodeSources[0],
        instance: nodeSources[Math.min(3, nodeSources.length - 1)] || nodeSources[0],
      };
      if (i < 4) source = preferredByKind[kind] || source;
    }

    for (let offset = 0; offset < nodeSources.length; offset++) {
      const candidate = nodeSources[(i + offset) % nodeSources.length];
      const count = assigned.filter((a) => a.source === candidate).length;
      if (count === 0) {
        source = candidate;
        break;
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

function yamlQuote(text) {
  return `"${String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function parseExamples(lines) {
  const examples = [];
  let inExamples = false;
  let current = null;
  let inDescriptions = false;
  let descFormat = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === 'examples:') {
      inExamples = true;
      continue;
    }
    if (inExamples && /^(parent_relation|sources|source_claims|relations):/.test(line)) {
      inExamples = false;
      if (current) examples.push(current);
      current = null;
      break;
    }
    if (!inExamples) continue;

    const idMatch = line.match(/^  - id: (.+)$/);
    if (idMatch) {
      if (current) examples.push(current);
      current = {
        id: idMatch[1],
        startLine: i,
        endLine: i,
        descFormat: null,
        descStartLine: null,
        descEndLine: null,
        descriptions: { zh: '', en: '', ja: '' },
      };
      inDescriptions = false;
      descFormat = null;
      continue;
    }

    if (!current) continue;
    current.endLine = i;

    if (line.match(/^    descriptions: \{zh:/)) {
      current.descFormat = 'inline';
      current.descStartLine = i;
      current.descEndLine = i;
      const inline = line.match(/^    descriptions: \{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$/);
      if (inline) {
        current.descriptions.zh = inline[1].replace(/^"|"$/g, '').replace(/\\"/g, '"');
        current.descriptions.en = inline[2].replace(/^"|"$/g, '').replace(/\\"/g, '"');
        current.descriptions.ja = inline[3].replace(/^"|"$/g, '').replace(/\\"/g, '"');
      }
      continue;
    }

    if (line === '    descriptions:') {
      current.descFormat = 'block';
      current.descStartLine = i;
      inDescriptions = true;
      continue;
    }

    if (inDescriptions && current.descFormat === 'block') {
      const m = line.match(/^      (zh|en|ja): (.+)$/);
      if (m) {
        current.descriptions[m[1]] = m[2].replace(/^"|"$/g, '').replace(/\\"/g, '"');
        current.descEndLine = i;
        continue;
      }
      if (!/^      /.test(line)) {
        inDescriptions = false;
        if (current.descEndLine == null) current.descEndLine = i - 1;
      }
    }
  }

  if (current) examples.push(current);
  return examples;
}

export function updateFileLines(lines, nodeId, moduleKey, catalog) {
  const { getSourcesForNode, generateDescription } = catalog;
  const nodeSources = getSourcesForNode(nodeId, moduleKey);
  const examples = parseExamples(lines);
  if (examples.length === 0) return { changed: false, sources: [], assigned: [] };

  const assigned = assignSources(examples, nodeSources);
  const newLines = [...lines];
  let changed = false;
  const fileSources = new Set();

  for (const ex of assigned) {
    const ctx = { nodeId, kind: ex.kind, module: moduleKey };
    const desc = generateDescription(ex.source, ctx);
    fileSources.add(ex.source);

    if (ex.descFormat === 'inline') {
      const newLine = `    descriptions: {zh: ${yamlQuote(desc.zh)}, en: ${yamlQuote(desc.en)}, ja: ${yamlQuote(desc.ja)}}`;
      if (newLines[ex.descStartLine] !== newLine) {
        newLines[ex.descStartLine] = newLine;
        changed = true;
      }
      continue;
    }

    if (ex.descFormat === 'block') {
      for (let i = ex.descStartLine + 1; i <= (ex.descEndLine ?? ex.descStartLine + 3); i++) {
        const m = newLines[i]?.match(/^      (zh|en|ja): /);
        if (m) {
          const lang = m[1];
          const newLine = `      ${lang}: ${yamlQuote(desc[lang])}`;
          if (newLines[i] !== newLine) {
            newLines[i] = newLine;
            changed = true;
          }
        }
      }
    }
  }

  return { changed, sources: [...fileSources], assigned };
}

export async function runPlaneUpgrade({
  planeRoot,
  summaryPath,
  catalog,
  planeLabel,
}) {
  const { SOURCE_IDS, getModuleKey } = catalog;
  const files = await collectNodeFiles(planeRoot);
  const globalSourceCounts = Object.fromEntries(SOURCE_IDS.map((s) => [s, 0]));
  const nodesProcessed = [];
  let filesUpdated = 0;
  let examplesUpdated = 0;

  for (const filePath of files) {
    const rel = relative(planeRoot, filePath).replace(/\\/g, '/');
    const moduleKey = getModuleKey(rel);
    const content = await readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const nodeId = parseNodeId(lines);
    if (!nodeId) continue;

    const { changed, sources, assigned } = updateFileLines(lines, nodeId, moduleKey, catalog);
    if (changed) {
      await writeFile(filePath, lines.join('\n') + (content.endsWith('\n') ? '\n' : ''), 'utf8');
      filesUpdated++;
      examplesUpdated += assigned?.length || 0;
    }

    for (const s of sources) {
      globalSourceCounts[s] = (globalSourceCounts[s] || 0) + 1;
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
    plane: planeLabel,
    nodesTotal: files.length,
    nodesUpdated: filesUpdated,
    examplesUpdated,
    sourceCitationCounts: globalSourceCounts,
    nodes: nodesProcessed,
  };

  await mkdir(join(summaryPath, '..'), { recursive: true });
  await writeFile(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  return summary;
}
