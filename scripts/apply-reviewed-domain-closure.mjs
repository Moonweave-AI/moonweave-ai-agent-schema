import fs from "node:fs";
import path from "node:path";

import { writeFileTransaction } from "./lib/atomic-write.mjs";
import { buildReviewedDomainClosurePlanes } from
  "./lib/ontology-domain-closure.mjs";
import { stableJson } from "./lib/stable-json.mjs";

const root = process.cwd();
const sourceRoot = path.join(root, "ontology", "source");
const productPath = path.join(sourceRoot, "agent-ontology.product.json");
const product = JSON.parse(fs.readFileSync(productPath, "utf8"));
const modules = fs.readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => fs.readdirSync(path.join(sourceRoot, entry.name))
    .filter((filename) => filename.endsWith(".json"))
    .flatMap((filename) => {
      const document = JSON.parse(fs.readFileSync(
        path.join(sourceRoot, entry.name, filename),
        "utf8",
      ));
      return document.source_kind === "agent-ontology-module" ? [document.module] : [];
    }));

product.planes = buildReviewedDomainClosurePlanes(product.planes, modules);
writeFileTransaction(
  new Map([[productPath, stableJson(product)]]),
  { transactionRoot: root },
);

console.log(stableJson({
  domains: product.planes.length,
  includes: product.planes.reduce((count, plane) => count + plane.includes.length, 0),
  excludes: product.planes.reduce((count, plane) => count + plane.excludes.length, 0),
}).trim());
