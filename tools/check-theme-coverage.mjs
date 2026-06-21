#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";
import { parseYaml } from "./lib/yaml.mjs";

const catalog = parseYaml(readFileSync(join(ROOT, "references", "source-catalog.yaml"), "utf8"));
const matrix = parseYaml(readFileSync(join(ROOT, "references", "evidence-matrix.yaml"), "utf8"));
const requiredThemes = catalog.coverage_policy?.required_themes || [];
const sources = catalog.sources || [];
const claims = matrix.claims || [];
const failures = [];

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

for (const theme of requiredThemes) {
  const themeSources = sources.filter((source) =>
    asArray(source.themes).includes(theme) &&
    source.reading?.status === "read" &&
    ["approved", "exemplar"].includes(source.normative_status),
  );
  const themeClaims = claims.filter((claim) => asArray(claim.themes).includes(theme));
  if (themeSources.length < 3) {
    failures.push(`Theme ${theme} has only ${themeSources.length} approved/exemplar sources`);
  }
  if (themeClaims.length < 1) {
    failures.push(`Theme ${theme} has no evidence claims`);
  }
}

console.log("Theme coverage check");
for (const theme of requiredThemes) {
  const count = sources.filter((source) => asArray(source.themes).includes(theme)).length;
  console.log(`  ${theme}: ${count} source(s)`);
}

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Theme coverage check passed.");

