#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";
import { parseYaml } from "./lib/yaml.mjs";

const catalogPath = join(ROOT, "references", "source-catalog.yaml");
const catalog = parseYaml(readFileSync(catalogPath, "utf8"));
const failures = [];
const seen = new Set();
const allowedTiers = new Set(["A", "B", "C"]);
const allowedStatuses = new Set(["approved", "candidate", "exemplar", "local"]);
const currentYear = 2026;

function failIf(condition, message) {
  if (condition) failures.push(message);
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

for (const source of asArray(catalog.sources)) {
  failIf(!/^source\.[a-z0-9_]+$/.test(source.id || ""), `Invalid source id: ${source.id}`);
  failIf(seen.has(source.id), `Duplicate source id: ${source.id}`);
  seen.add(source.id);
  for (const field of ["title", "source_type", "authority_tier", "normative_status", "venue", "year"]) {
    failIf(source[field] === undefined || source[field] === null || source[field] === "", `Source ${source.id} missing ${field}`);
  }
  failIf(!allowedTiers.has(source.authority_tier), `Source ${source.id} has invalid authority_tier ${source.authority_tier}`);
  failIf(!allowedStatuses.has(source.normative_status), `Source ${source.id} has invalid normative_status ${source.normative_status}`);
  failIf(source.normative_status === "approved" && source.authority_tier === "C", `Approved source ${source.id} cannot be Tier C`);
  failIf(source.normative_status === "approved" && /anonymous|placeholder|\[author\]|2602\.00000/i.test(JSON.stringify(source)), `Approved source ${source.id} contains placeholder text`);
  failIf(!Number.isInteger(source.year) || source.year > currentYear, `Source ${source.id} has invalid year ${source.year}`);
  if (source.source_type !== "standard") {
    failIf(source.year < 2022, `Non-standard source ${source.id} is outside 2022-2026`);
  }
  failIf(!source.url && !source.location, `Source ${source.id} needs url or location`);
  if (source.url) failIf(!/^https?:\/\//.test(source.url), `Source ${source.id} url must be http(s)`);
  failIf(asArray(source.themes).length === 0, `Source ${source.id} has no themes`);
  failIf(asArray(source.ontology_subgraphs).length === 0, `Source ${source.id} has no ontology_subgraphs`);
  failIf(source.reading?.status !== "read", `Source ${source.id} is not marked read`);
  failIf(!source.reading?.summary, `Source ${source.id} missing reading summary`);
  failIf(!source.reading?.ontology_impact, `Source ${source.id} missing ontology impact`);
}

failIf(seen.size < 25, `Source catalog too small: ${seen.size} sources`);

console.log("Source catalog check");
console.log(`Sources: ${seen.size}`);

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Source catalog check passed.");
