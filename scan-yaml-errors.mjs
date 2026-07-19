import { readdirSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { parseDocument } from "yaml";

const root = resolve("ontology");
const errors = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "node.yaml") {
      const text = readFileSync(full, "utf8");
      const rel = relative(root, full);
      try {
        const doc = parseDocument(text, {
          customTags: [],
          maxAliasCount: 0,
          prettyErrors: true,
          schema: "core",
          strict: true,
          uniqueKeys: true,
        });
        if (doc.errors.length > 0) {
          for (const e of doc.errors) {
            errors.push({ file: rel, line: e.linePos?.[0]?.line, msg: e.message.split("\n")[0] });
          }
        }
      } catch (e) {
        errors.push({ file: rel, line: 0, msg: e.message.split("\n")[0] });
      }
    }
  }
}

walk(root);

// Categorize errors
const categories = {};
for (const e of errors) {
  const cat = e.msg.replace(/at line \d+.*/, "").replace(/in ".*"/, "").trim();
  categories[cat] = (categories[cat] || 0) + 1;
}

console.log(`\nTotal errors: ${errors.length}`);
console.log(`Files with errors: ${new Set(errors.map(e => e.file)).size}`);
console.log(`\nError categories:`);
for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${count}: ${cat}`);
}

// List first 10 erroring files
const fileSet = new Set(errors.map(e => e.file));
console.log(`\nFirst 10 files with errors:`);
let i = 0;
for (const f of fileSet) {
  if (i++ >= 10) break;
  const fileErrors = errors.filter(e => e.file === f);
  console.log(`  ${f} (${fileErrors.length} errors)`);
  for (const e of fileErrors.slice(0, 3)) {
    console.log(`    L${e.line}: ${e.msg.substring(0, 120)}`);
  }
}
