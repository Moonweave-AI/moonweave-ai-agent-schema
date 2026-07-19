import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
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

function fixYamlAggressive(text) {
  // Normalize line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  const fixed = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Fix unquoted values with internal colons for zh/en/ja at any indent level
    // Must check that the value isn't already quoted
    const langMatch = line.match(/^(\s+(?:zh|en|ja):\s+)(.+)$/);
    if (langMatch) {
      const [, prefix, value] = langMatch;
      const trimmed = value.trim();
      // If value is not quoted and contains a colon (indicating nested mapping issue)
      if (!trimmed.startsWith('"') && !trimmed.startsWith("'") && 
          !trimmed.startsWith('{') && !trimmed.startsWith('[') &&
          !trimmed.startsWith('|') && !trimmed.startsWith('>') &&
          trimmed.includes(':')) {
        const escaped = trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        line = `${prefix}"${escaped}"`;
      }
    }
    
    // Fix values starting with @ for any key
    const atMatch = line.match(/^(\s+\w+:\s+)(@.+)$/);
    if (atMatch) {
      const [, prefix, value] = atMatch;
      if (!value.startsWith('"') && !value.startsWith("'")) {
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        line = `${prefix}"${escaped}"`;
      }
    }
    
    // Fix unquoted values with colons for other common keys
    const otherMatch = line.match(/^(\s+(?:description|summary|title|note|rationale|reason):\s+)(.+)$/);
    if (otherMatch) {
      const [, prefix, value] = otherMatch;
      const trimmed = value.trim();
      if (!trimmed.startsWith('"') && !trimmed.startsWith("'") && 
          !trimmed.startsWith('{') && !trimmed.startsWith('[') &&
          !trimmed.startsWith('|') && !trimmed.startsWith('>') &&
          trimmed.includes(':')) {
        const escaped = trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        line = `${prefix}"${escaped}"`;
      }
    }
    
    fixed.push(line);
  }
  
  return fixed.join("\n");
}

// Remove corrupted source_claims entries (sha-256: lines mixed into lists)
function fixCorruptedSourceClaims(text) {
  text = text.replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const fixed = [];
  let inSourceClaims = false;
  let sourceClaimsIndent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect source_claims section
    const scMatch = line.match(/^(\s+)source_claims:/);
    if (scMatch) {
      inSourceClaims = true;
      sourceClaimsIndent = scMatch[1].length;
      fixed.push(line);
      continue;
    }
    
    if (inSourceClaims) {
      const indent = line.match(/^(\s*)/)[1].length;
      // If we're back to same or less indent, we've left source_claims
      if (line.trim() !== '' && indent <= sourceClaimsIndent) {
        inSourceClaims = false;
      } else {
        // Skip corrupted sha-256/sha-512 entries within source_claims
        if (line.match(/^\s+sha-256:|^\s+sha-512:/)) {
          continue;
        }
        // Skip empty lines within source_claims that precede sha- lines
        if (line.trim() === '' && i + 1 < lines.length && 
            lines[i + 1].match(/^\s+sha-256:|^\s+sha-512:/)) {
          continue;
        }
      }
    }
    
    fixed.push(line);
  }
  
  return fixed.join("\n");
}

// Find all files with errors
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

console.log(`Files with errors before fix: ${errorFiles.length}`);

let fixed = 0;
let stillBroken = [];

for (const { rel, full, errorCount } of errorFiles) {
  const original = readFileSync(full, "utf8");
  
  // Apply fixes in sequence
  let text = original;
  text = fixCorruptedSourceClaims(text);
  text = fixYamlAggressive(text);
  
  // Multiple passes
  for (let pass = 0; pass < 5; pass++) {
    if (isClean(text)) break;
    text = fixYamlAggressive(text);
  }
  
  if (isClean(text)) {
    writeFileSync(full, text, "utf8");
    fixed++;
  } else {
    const remaining = findErrors(text);
    stillBroken.push({ rel, errors: remaining.length, sample: remaining[0].message.split("\n")[0] });
  }
}

console.log(`Fixed: ${fixed}`);
console.log(`Still broken: ${stillBroken.length}`);

if (stillBroken.length > 0) {
  console.log(`\nBroken files:`);
  for (const { rel, errors, sample } of stillBroken) {
    console.log(`  ${rel} (${errors} errors): ${sample.substring(0, 100)}`);
  }
}
