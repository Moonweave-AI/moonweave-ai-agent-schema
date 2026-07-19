#!/usr/bin/env node
/**
 * Parse runtime-plane-example-desc-overrides-part*.ps1 into JSON overrides.
 * Avoids PowerShell parsing issues with commas/parens inside description strings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseSingleQuoted(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] !== "'") throw new Error(`Expected quote at ${i}: ${s.slice(i, i + 40)}`);
    i++;
    let buf = '';
    while (i < s.length) {
      if (s[i] === "'") {
        if (s[i + 1] === "'") {
          buf += "'";
          i += 2;
          continue;
        }
        i++;
        break;
      }
      buf += s[i++];
    }
    out.push(buf);
    while (i < s.length && /\s/.test(s[i])) i++;
  }
  return out;
}

function parseHereDocBlock(text, startIdx) {
  const open = text.slice(startIdx, startIdx + 3);
  if (open !== "@'") throw new Error(`Expected @' at ${startIdx}`);
  let i = startIdx + 2;
  let buf = '';
  while (i < text.length) {
    if (text[i] === "'" && text[i + 1] === '@') {
      i += 2;
      break;
    }
    buf += text[i++];
  }
  return { value: buf, next: i };
}

function parseDCall(text, startIdx) {
  let i = startIdx;
  while (i < text.length && /\s/.test(text[i])) i++;
  const values = [];
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] === ')') break;
    if (text.slice(i, i + 2) === "@'") {
      const block = parseHereDocBlock(text, i);
      values.push(block.value.trimEnd());
      i = block.next;
      continue;
    }
    if (text[i] !== "'") break;
    const rest = text.slice(i);
    const parsed = parseSingleQuoted(rest);
    values.push(...parsed);
    i += rest.indexOf(parsed[parsed.length - 1]) + parsed[parsed.length - 1].length + 2;
    // advance past closing quote(s)
    let j = i;
    while (j < text.length && text[j] !== ')' && text[j] !== '\n') {
      if (text[j] === "'") {
        const chunk = text.slice(j);
        const more = parseSingleQuoted(chunk);
        values.push(...more.slice(values.length % 3 === 0 ? 0 : 0));
        break;
      }
      j++;
    }
    // simpler: scan for next ) at line end
    const lineEnd = text.indexOf('\n', i);
    const segment = text.slice(i, lineEnd === -1 ? text.length : lineEnd);
    const parts = parseSingleQuoted(segment.trim());
    if (parts.length >= 3) {
      return { zh: parts[0], en: parts[1], ja: parts[2], next: lineEnd === -1 ? text.length : lineEnd + 1 };
    }
    break;
  }
  if (values.length >= 3) {
    return { zh: values[0], en: values[1], ja: values[2], next: i };
  }
  throw new Error(`Could not parse D call near: ${text.slice(startIdx, startIdx + 120)}`);
}

function parseLCall(line) {
  const m = line.match(/^\s*L\s+(.*)$/);
  if (!m) return null;
  const parts = parseSingleQuoted(m[1].trim());
  if (parts.length < 3) throw new Error(`L call needs 3 strings: ${line}`);
  return { zh: parts[0], en: parts[1], ja: parts[2] };
}

function parsePartFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const labelOverrides = {};
  const descOverrides = {};

  const blockRe = /\$LabelOverrides\['([^']+)'\]\s*=\s*@\(([\s\S]*?)\n\)/g;
  let match;
  while ((match = blockRe.exec(text)) !== null) {
    const nodeId = match[1];
    const body = match[2];
    const labels = [];
    for (const line of body.split('\n')) {
      const l = parseLCall(line);
      if (l) labels.push(l);
    }
    labelOverrides[nodeId] = labels;
  }

  const descBlockRe = /\$DescOverrides\['([^']+)'\]\s*=\s*@\(([\s\S]*?)\n\)/g;
  while ((match = descBlockRe.exec(text)) !== null) {
    const nodeId = match[1];
    const body = match[2];
    const descs = [];
    let i = 0;
    const lines = body.split('\n');
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed.startsWith('D ')) {
        i++;
        continue;
      }
      if (trimmed.includes("@'")) {
        let chunk = trimmed.slice(trimmed.indexOf('D ') + 2).trim();
        let j = i + 1;
        while (j < lines.length && !chunk.includes("'@")) {
          chunk += '\n' + lines[j];
          j++;
        }
        const values = [];
        let k = 0;
        while (k < chunk.length) {
          while (k < chunk.length && /\s/.test(chunk[k])) k++;
          if (chunk.slice(k, k + 2) === "@'") {
            const block = parseHereDocBlock(chunk, k);
            values.push(block.value.trimEnd());
            k = block.next;
          } else if (chunk[k] === "'") {
            const rest = chunk.slice(k);
            const parsed = parseSingleQuoted(rest);
            values.push(parsed[0]);
            k += rest.indexOf("'") + 1 + parsed[0].length + 2;
          } else break;
        }
        if (values.length < 3) throw new Error(`Multiline D for ${nodeId}: got ${values.length} parts`);
        descs.push({ zh: values[0], en: values[1], ja: values[2] });
        i = j;
        continue;
      }
      const dMatch = trimmed.match(/^D\s+(.*)$/);
      const parts = parseSingleQuoted(dMatch[1]);
      if (parts.length < 3) throw new Error(`D call for ${nodeId}: ${trimmed.slice(0, 80)}`);
      descs.push({ zh: parts[0], en: parts[1], ja: parts[2] });
      i++;
    }
    descOverrides[nodeId] = descs;
  }

  return { labelOverrides, descOverrides };
}

function mergeMaps(target, source) {
  for (const [k, v] of Object.entries(source)) {
    target[k] = v;
  }
}

const labels = {};
const descs = {};
for (let n = 1; n <= 5; n++) {
  const fp = path.join(__dirname, `runtime-plane-example-desc-overrides-part${n}.ps1`);
  const { labelOverrides, descOverrides } = parsePartFile(fp);
  mergeMaps(labels, labelOverrides);
  mergeMaps(descs, descOverrides);
}

const nodeIds = [...new Set([...Object.keys(labels), ...Object.keys(descs)])].sort();
const nodes = [];
for (const id of nodeIds) {
  const l = labels[id] || [];
  const d = descs[id] || [];
  const count = Math.max(l.length, d.length);
  const examples = [];
  for (let i = 0; i < count; i++) {
    examples.push({
      labels: l[i] || { zh: id, en: id, ja: id },
      descriptions: d[i] || { zh: id, en: id, ja: id },
    });
  }
  nodes.push({ id, examples });
}

const outPath = path.join(__dirname, 'runtime-plane-example-overrides.json');
fs.writeFileSync(outPath, JSON.stringify({ nodes }, null, 2) + '\n', 'utf8');
console.log(`Wrote ${nodes.length} nodes to ${outPath}`);
for (const n of nodes) {
  console.log(`  ${n.id}: ${n.examples.length} examples`);
}
