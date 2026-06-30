#!/usr/bin/env node
/**
 * Fix Cursor hook adapter root for project-local ECC installs.
 * ECC copies hook runtime to .cursor/scripts; adapter must resolve .cursor as root.
 */

const fs = require('fs');
const path = require('path');

const adapterPath = path.join(__dirname, '..', '.cursor', 'hooks', 'adapter.js');

if (!fs.existsSync(adapterPath)) {
  process.exit(0);
}

const original = fs.readFileSync(adapterPath, 'utf8');
const patched = original.replace(
  /function getPluginRoot\(\) \{[\s\S]*?\n\}/,
  `function getPluginRoot() {
  // Project install keeps hook runtime under .cursor/scripts (not repo-root/scripts).
  return path.resolve(__dirname, '..');
}`
);

if (patched !== original) {
  fs.writeFileSync(adapterPath, patched);
  console.log('[ECC] Patched .cursor/hooks/adapter.js for project-local hook runtime.');
}
