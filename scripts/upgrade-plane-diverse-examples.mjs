#!/usr/bin/env node
/**
 * Upgrade feedback/runtime/info-plane node.yaml example descriptions
 * with diversified authoritative paper/project citations.
 *
 * Usage:
 *   node scripts/upgrade-plane-diverse-examples.mjs feedback
 *   node scripts/upgrade-plane-diverse-examples.mjs runtime
 *   node scripts/upgrade-plane-diverse-examples.mjs info
 *   node scripts/upgrade-plane-diverse-examples.mjs all
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPlaneUpgrade } from './plane-diverse-upgrade-core.mjs';
import * as feedbackCatalog from './feedback-diverse-sources.mjs';
import * as runtimeCatalog from './runtime-diverse-sources.mjs';
import * as infoCatalog from './info-diverse-sources.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const PLANE_CONFIG = {
  feedback: {
    root: join(REPO_ROOT, 'ontology', 'feedback-plane'),
    summary: join(REPO_ROOT, 'docs', 'feedback-plane-example-upgrade-summary.json'),
    catalog: feedbackCatalog,
    label: 'feedback-plane',
  },
  runtime: {
    root: join(REPO_ROOT, 'ontology', 'runtime-plane'),
    summary: join(REPO_ROOT, 'docs', 'runtime-plane-example-upgrade-summary.json'),
    catalog: runtimeCatalog,
    label: 'runtime-plane',
  },
  info: {
    root: join(REPO_ROOT, 'ontology', 'info-plane'),
    summary: join(REPO_ROOT, 'docs', 'info-plane-diverse-example-upgrade-summary.json'),
    catalog: infoCatalog,
    label: 'info-plane',
  },
};

async function runOne(planeKey) {
  const cfg = PLANE_CONFIG[planeKey];
  if (!cfg) throw new Error(`Unknown plane: ${planeKey}`);
  const summary = await runPlaneUpgrade({
    planeRoot: cfg.root,
    summaryPath: cfg.summary,
    catalog: cfg.catalog,
    planeLabel: cfg.label,
  });

  console.log(`\n=== ${cfg.label} ===`);
  console.log(`Processed ${summary.nodesTotal} nodes`);
  console.log(`Updated ${summary.nodesUpdated} node.yaml files (${summary.examplesUpdated} example descriptions)`);
  console.log('Source citation counts (nodes referencing each source):');
  for (const [source, count] of Object.entries(summary.sourceCitationCounts).sort((a, b) => b[1] - a[1])) {
    if (count > 0) console.log(`  ${source}: ${count}`);
  }
  console.log(`Summary: ${cfg.summary}`);
  return summary;
}

async function main() {
  const arg = (process.argv[2] || 'all').toLowerCase();
  const planes = arg === 'all' ? ['feedback', 'runtime', 'info'] : [arg];
  const results = {};

  for (const plane of planes) {
    results[plane] = await runOne(plane);
  }

  if (planes.length > 1) {
    console.log('\n=== Combined ===');
    let totalNodes = 0;
    let totalUpdated = 0;
    let totalExamples = 0;
    const combinedSources = {};
    for (const [plane, summary] of Object.entries(results)) {
      totalNodes += summary.nodesTotal;
      totalUpdated += summary.nodesUpdated;
      totalExamples += summary.examplesUpdated;
      for (const [source, count] of Object.entries(summary.sourceCitationCounts)) {
        combinedSources[source] = (combinedSources[source] || 0) + count;
      }
      console.log(`${plane}: ${summary.nodesTotal} nodes, ${summary.nodesUpdated} updated, ${summary.examplesUpdated} examples`);
    }
    console.log(`Total: ${totalNodes} nodes, ${totalUpdated} files updated, ${totalExamples} examples`);
    console.log('Combined source counts:');
    for (const [source, count] of Object.entries(combinedSources).sort((a, b) => b[1] - a[1])) {
      if (count > 0) console.log(`  ${source}: ${count}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
