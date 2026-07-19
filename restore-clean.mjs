import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { execSync } from "node:child_process";
import { parseDocument } from "yaml";

const root = resolve("ontology");
const errorFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "node.yaml") {
      const text = readFileSync(full, "utf8");
      const rel = relative(root, full).replace(/\\/g, "/");
      try {
        const doc = parseDocument(text, {
          customTags: [],
          maxAliasCount: 0,
          prettyErrors: true,
          schema: "core",
          strict: true,
          uniqueKeys: true,
        });
        if (doc.errors.length > 0) errorFiles.push({ rel, full, errorCount: doc.errors.length });
      } catch {
        errorFiles.push({ rel, full, errorCount: -1 });
      }
    }
  }
}
walk(root);

let restored = 0;
let newFiles = [];

for (const { rel, full, errorCount } of errorFiles) {
  try {
    const origText = execSync(`git show ffbc6ec:ontology/${rel}`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    writeFileSync(full, origText, "utf8");
    restored++;
  } catch {
    newFiles.push({ rel, full, errorCount });
  }
}

console.log(`Restored ${restored} files from ffbc6ec`);
console.log(`New files needing manual fix: ${newFiles.length}`);

if (newFiles.length > 0) {
  console.log(`\nNew files with errors:`);
  for (const { rel, errorCount } of newFiles) {
    console.log(`  ${rel} (${errorCount} errors)`);
  }
}

// Verify restored files are now clean
let stillBroken = 0;
for (const { full, rel } of errorFiles) {
  if (newFiles.some(n => n.full === full)) continue;
  const text = readFileSync(full, "utf8");
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
      console.log(`STILL BROKEN after restore: ${rel}`);
      stillBroken++;
    }
  } catch (e) {
    console.log(`STILL BROKEN after restore: ${rel} - ${e.message}`);
    stillBroken++;
  }
}

console.log(`\nPost-restore verification: ${stillBroken} files still broken`);
