#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";
import { parseYaml } from "./lib/yaml.mjs";

const catalog = parseYaml(readFileSync(join(ROOT, "references", "source-catalog.yaml"), "utf8"));
const matrix = parseYaml(readFileSync(join(ROOT, "references", "evidence-matrix.yaml"), "utf8"));
const coverage = parseYaml(readFileSync(join(ROOT, "references", "venue-coverage.yaml"), "utf8"));

const requiredVenues = coverage.coverage_policy?.required_venues || catalog.coverage_policy?.venue_scope || [];
const requiredYears = coverage.coverage_policy?.years || catalog.coverage_policy?.years || [];
const requiredThemes = coverage.coverage_policy?.required_themes || catalog.coverage_policy?.required_themes || [];
const sourceIds = new Set((catalog.sources || []).map((source) => source.id));
const allowedStatuses = new Set(["reviewed", "reviewed_no_direct_agent_paper", "tracked_external"]);
const failures = [];

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function failIf(condition, message) {
  if (condition) failures.push(message);
}

function entryYears(entry) {
  if (entry.year !== undefined && entry.year !== null) return [entry.year];
  return asArray(entry.years);
}

const entries = asArray(coverage.coverage_entries);
failIf(entries.length === 0, "venue-coverage.yaml has no coverage_entries");

for (const entry of entries) {
  failIf(!requiredVenues.includes(entry.venue), `Unknown venue in coverage entry: ${entry.venue}`);
  failIf(!allowedStatuses.has(entry.review_status), `Entry ${entry.venue} has invalid review_status ${entry.review_status}`);
  failIf(asArray(entry.search_queries).length === 0, `Entry ${entry.venue} needs search_queries`);
  failIf(entryYears(entry).length === 0, `Entry ${entry.venue} needs year or years`);
  failIf(asArray(entry.themes_reviewed).length === 0, `Entry ${entry.venue} needs themes_reviewed`);
  for (const theme of requiredThemes) {
    failIf(!asArray(entry.themes_reviewed).includes(theme), `Entry ${entry.venue} missing theme ${theme}`);
  }
  const included = asArray(entry.included_sources);
  const excluded = asArray(entry.excluded_sources);
  failIf(included.length + excluded.length === 0, `Entry ${entry.venue} needs included_sources or excluded_sources`);
  if (excluded.length) {
    failIf(!entry.exclusion_reason, `Entry ${entry.venue} has exclusions without exclusion_reason`);
  }
  for (const sourceId of included) {
    failIf(!sourceIds.has(sourceId), `Entry ${entry.venue} references unknown included source ${sourceId}`);
  }
}

for (const venue of requiredVenues) {
  for (const year of requiredYears) {
    const matchingEntries = entries.filter((entry) => entry.venue === venue && entryYears(entry).includes(year));
    failIf(matchingEntries.length === 0, `Missing venue coverage for ${venue} ${year}`);
  }
}

const blockingVenueGaps = asArray(matrix.gaps).filter((gap) =>
  gap.id === "gap.venue_exhaustive_index" &&
  ["high", "blocking"].includes(String(gap.severity || "").toLowerCase()) &&
  gap.status !== "resolved"
);
failIf(blockingVenueGaps.length > 0, "gap.venue_exhaustive_index is still blocking or high severity");

console.log("Venue coverage check");
console.log(`Venues: ${requiredVenues.length}`);
console.log(`Years: ${requiredYears.length}`);
console.log(`Expanded checkpoints: ${requiredVenues.length * requiredYears.length}`);

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Venue coverage check passed.");
