#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

const indexPath = join(ROOT, "visualization", "index.html");
const graphPath = join(ROOT, "visualization", "data", "ontology.graph.json");
const pathsPath = join(ROOT, "visualization", "data", "ontology.paths.json");

function compactJson(path) {
  return JSON.stringify(JSON.parse(readFileSync(path, "utf8")));
}

function main() {
  const graph = compactJson(graphPath);
  const paths = compactJson(pathsPath);
  const html = readFileSync(indexPath, "utf8");

  const start = "<!-- BEGIN_EMBEDDED_GRAPH_DATA -->";
  const end = "<!-- END_EMBEDDED_GRAPH_DATA -->";
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error("Embedded graph data markers are missing or malformed.");
    process.exit(1);
  }

  const replacement = `${start}
<script type="application/json" id="embedded-ontology-graph">${graph}</script>
<script type="application/json" id="embedded-ontology-paths">${paths}</script>
${end}`;

  const updated =
    html.slice(0, startIndex) + replacement + html.slice(endIndex + end.length);

  writeFileSync(indexPath, updated, "utf8");
  console.log(`Embedded graph data into ${indexPath}`);
  console.log(`Graph bytes: ${graph.length}`);
  console.log(`Paths bytes: ${paths.length}`);
}

main();
