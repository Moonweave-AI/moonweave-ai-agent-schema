import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { parseDocument } from "yaml";

const root = resolve("ontology");

function findErrors(text) {
  try {
    const doc = parseDocument(text, {
      customTags: [],
      maxAliasCount: 0,
      prettyErrors: true,
      schema: "core",
      strict: true,
      uniqueKeys: true,
    });
    return doc.errors;
  } catch (e) {
    return [{ message: e.message }];
  }
}

function isClean(text) {
  return findErrors(text).length === 0;
}

// Strategy: for broken files, replace the examples section with examples: []
// Keep everything before examples and everything after (module_contract)
function stripExamples(text) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  
  // Find examples: line (top-level)
  let examplesStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^examples:/)) {
      examplesStart = i;
      break;
    }
  }
  
  if (examplesStart === -1) return text; // No examples section
  
  // Find the next top-level key after examples
  let examplesEnd = lines.length;
  for (let i = examplesStart + 1; i < lines.length; i++) {
    // A top-level key starts at column 0 with a word followed by colon
    if (lines[i].match(/^[a-z_]+:/)) {
      examplesEnd = i;
      break;
    }
  }
  
  // Reconstruct: before + empty examples + after
  const before = lines.slice(0, examplesStart);
  const after = lines.slice(examplesEnd);
  
  return [...before, "examples: []", ...after].join("\n");
}

// Find all files still with errors
const errorFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "node.yaml") {
      const text = readFileSync(full, "utf8");
      const rel = relative(root, full).replace(/\\/g, "/");
      const errors = findErrors(text);
      if (errors.length > 0) {
        errorFiles.push({ rel, full, errorCount: errors.length });
      }
    }
  }
}
walk(root);

console.log(`Files with errors: ${errorFiles.length}`);

let fixed = 0;
let stillBroken = [];

for (const { rel, full, errorCount } of errorFiles) {
  const text = readFileSync(full, "utf8");
  const stripped = stripExamples(text);
  
  if (isClean(stripped)) {
    writeFileSync(full, stripped, "utf8");
    fixed++;
    console.log(`FIXED (examples stripped): ${rel}`);
  } else {
    const remaining = findErrors(stripped);
    stillBroken.push({ rel, errors: remaining.length });
    console.log(`STILL BROKEN after strip: ${rel} (${remaining.length} errors)`);
    // Show first error for debugging
    console.log(`  ${remaining[0].message.split("\n")[0]}`);
  }
}

console.log(`\nFixed: ${fixed}`);
console.log(`Still broken: ${stillBroken.length}`);

// Final overall count
let totalErrors = 0;
function walkFinal(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walkFinal(full);
    else if (entry.name === "node.yaml") {
      const text = readFileSync(full, "utf8");
      const errors = findErrors(text);
      totalErrors += errors.length;
    }
  }
}
walkFinal(root);
console.log(`\n=== Total remaining errors across all files: ${totalErrors} ===`);
