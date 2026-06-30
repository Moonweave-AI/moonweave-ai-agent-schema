#!/usr/bin/env node
/**
 * Sync ECC Codex project-local assets from ecc-universal into the repo root.
 * Codex auto-detects AGENTS.md, .codex/, and .agents/ when opened as workspace.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const eccRoot = path.join(projectRoot, 'node_modules', 'ecc-universal');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing ECC source path: ${src}`);
  }

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      copyRecursive(path.join(src, entry.name), path.join(dest, entry.name));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

const sources = [
  { from: 'AGENTS.md', to: 'AGENTS.md' },
  { from: '.codex', to: '.codex' },
  { from: '.agents', to: '.agents' },
];

if (!fs.existsSync(eccRoot)) {
  console.error('[ECC] Run npm install first — ecc-universal is not installed.');
  process.exit(1);
}

for (const { from, to } of sources) {
  const src = path.join(eccRoot, from);
  const dest = path.join(projectRoot, to);
  console.log(`[ECC] Sync ${from} -> ${to}`);
  copyRecursive(src, dest);
}

console.log('[ECC] Codex project assets synced.');
