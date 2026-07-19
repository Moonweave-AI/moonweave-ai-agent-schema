import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, relative, dirname, basename } from "node:path";
import { execSync } from "node:child_process";
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

// Get list of all erroring new files
const errorNewFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "node.yaml") {
      const text = readFileSync(full, "utf8");
      const rel = relative(root, full).replace(/\\/g, "/");
      const errors = findErrors(text);
      if (errors.length > 0) {
        // Check if it's a new file (not in ffbc6ec)
        try {
          execSync(`git show ffbc6ec:ontology/${rel}`, { stdio: ["pipe", "pipe", "pipe"] });
        } catch {
          errorNewFiles.push({ rel, full, errors: errors.length });
        }
      }
    }
  }
}
walk(root);

console.log(`New files with errors: ${errorNewFiles.length}`);

// Categorize by error count
const simple = errorNewFiles.filter(f => f.errors <= 3);
const medium = errorNewFiles.filter(f => f.errors > 3 && f.errors <= 20);
const complex = errorNewFiles.filter(f => f.errors > 20);

console.log(`  Simple (1-3 errors): ${simple.length}`);
console.log(`  Medium (4-20 errors): ${medium.length}`);
console.log(`  Complex (20+ errors): ${complex.length}`);

// Fix simple files: quote values with colons and @ symbols
let fixedCount = 0;

function fixYaml(text) {
  const lines = text.split("\n");
  const fixed = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Fix unquoted values containing colons after zh:/en:/ja: keys
    // Pattern: "      en: some text with: colon inside" -> '      en: "some text with: colon inside"'
    const labelMatch = line.match(/^(\s+(?:zh|en|ja):\s+)([^"'\[\]{}>|].+:.+)$/);
    if (labelMatch) {
      const [, prefix, value] = labelMatch;
      // Only quote if value contains an internal colon and isn't already quoted
      const cleanValue = value.replace(/"/g, '\\"');
      line = `${prefix}"${cleanValue}"`;
    }
    
    // Fix values starting with @ symbol
    const atMatch = line.match(/^(\s+(?:zh|en|ja|description):\s+)(@.+)$/);
    if (atMatch) {
      const [, prefix, value] = atMatch;
      line = `${prefix}"${value}"`;
    }
    
    // Fix unquoted values with colons in description fields
    const descMatch = line.match(/^(\s+(?:description):\s+)([^"'\[\]{}>|].+:.+)$/);
    if (descMatch && !descMatch[2].startsWith('"') && !descMatch[2].startsWith("'")) {
      const [, prefix, value] = descMatch;
      const cleanValue = value.replace(/"/g, '\\"');
      line = `${prefix}"${cleanValue}"`;
    }
    
    fixed.push(line);
  }
  
  return fixed.join("\n");
}

for (const { rel, full } of [...simple, ...medium]) {
  const text = readFileSync(full, "utf8");
  let fixed = fixYaml(text);
  
  // Try up to 3 passes
  for (let pass = 0; pass < 3; pass++) {
    if (isClean(fixed)) break;
    fixed = fixYaml(fixed);
  }
  
  if (isClean(fixed)) {
    writeFileSync(full, fixed, "utf8");
    fixedCount++;
  } else {
    const remaining = findErrors(fixed);
    console.log(`\nCould not auto-fix ${rel} (${remaining.length} errors remaining):`);
    for (const e of remaining.slice(0, 3)) {
      console.log(`  ${e.message.split("\n")[0]}`);
    }
  }
}

console.log(`\nAuto-fixed: ${fixedCount} files`);

// Report complex files
if (complex.length > 0) {
  console.log(`\nComplex files (need manual intervention):`);
  for (const { rel, errors } of complex) {
    console.log(`  ${rel} (${errors} errors)`);
  }
}

// Final count
const finalErrorFiles = [];
function walkFinal(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walkFinal(full);
    else if (entry.name === "node.yaml") {
      const text = readFileSync(full, "utf8");
      const rel = relative(root, full).replace(/\\/g, "/");
      const errors = findErrors(text);
      if (errors.length > 0) {
        finalErrorFiles.push({ rel, errors: errors.length });
      }
    }
  }
}
walkFinal(root);
console.log(`\n=== Final status: ${finalErrorFiles.length} files still have errors ===`);
