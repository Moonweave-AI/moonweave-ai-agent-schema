#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

const textExtensions = new Set([".md", ".yaml", ".yml", ".json", ".html", ".mjs", ".js", ".css", ".bib", ".dot", ".mmd"]);
const ignoredDirs = new Set([".git", "node_modules", "visualization/vendor"]);
const failures = [];

function shouldIgnore(rel) {
  return [...ignoredDirs].some((dir) => rel === dir || rel.startsWith(`${dir}/`));
}

function extOf(file) {
  const match = file.match(/(\.[^.]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (shouldIgnore(rel)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (textExtensions.has(extOf(entry))) {
      const text = readFileSync(full, "utf8");
      if (text.includes("\uFFFD")) failures.push(`Replacement character found in ${rel}`);
      if (/\?{4,}/.test(text)) failures.push(`Likely mojibake question marks in ${rel}`);
      const mojibakePatterns = [
        /\u00c3./u,
        /\u00c2./u,
        /\u00e2\u20ac/u,
        /\u95c1/u,
        /\u95bb\u5ea2/u,
        /\u9207/u,
      ];
      if (mojibakePatterns.some((pattern) => pattern.test(text))) {
        failures.push(`Likely mojibake sequence in ${rel}`);
      }
    }
  }
}

walk(ROOT);

console.log("UTF-8/i18n encoding check");

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("UTF-8/i18n encoding check passed.");
