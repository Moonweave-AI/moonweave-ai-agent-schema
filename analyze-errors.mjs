import { readdirSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { execSync } from "node:child_process";
import { parseDocument } from "yaml";

const root = resolve("ontology");
const errorFiles = new Set();

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
        if (doc.errors.length > 0) errorFiles.add(rel);
      } catch {
        errorFiles.add(rel);
      }
    }
  }
}
walk(root);

let existsInOrig = 0;
let newFiles = 0;
const newFilesList = [];

for (const f of errorFiles) {
  try {
    execSync(`git show ffbc6ec:ontology/${f}`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    existsInOrig++;
  } catch {
    newFiles++;
    newFilesList.push(f);
  }
}

console.log(`Error files total: ${errorFiles.size}`);
console.log(`Exist at ffbc6ec: ${existsInOrig}`);
console.log(`New files (not in ffbc6ec): ${newFiles}`);

if (newFilesList.length > 0 && newFilesList.length <= 20) {
  console.log(`\nNew files:`);
  for (const f of newFilesList) console.log(`  ${f}`);
}

// For files that exist at ffbc6ec, check if the original was also erroring
let origAlsoError = 0;
let origWasClean = 0;
for (const f of errorFiles) {
  try {
    const origText = execSync(`git show ffbc6ec:ontology/${f}`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    const doc = parseDocument(origText, {
      customTags: [],
      maxAliasCount: 0,
      prettyErrors: true,
      schema: "core",
      strict: true,
      uniqueKeys: true,
    });
    if (doc.errors.length > 0) {
      origAlsoError++;
    } else {
      origWasClean++;
    }
  } catch {
    // File doesn't exist at ffbc6ec or has parse errors
  }
}

console.log(`\nOf files that exist at ffbc6ec:`);
console.log(`  Original was clean: ${origWasClean} (can restore from ffbc6ec)`);
console.log(`  Original also had errors: ${origAlsoError}`);
