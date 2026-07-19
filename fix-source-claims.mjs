import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { parseDocument, parse } from "yaml";

const root = resolve("ontology");

function parseYaml(text) {
  try {
    return parse(text, { schema: "core", strict: false, uniqueKeys: false });
  } catch {
    return null;
  }
}

// Collect all files
const allFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "node.yaml") {
      const rel = relative(root, full).replace(/\\/g, "/");
      allFiles.push({ rel, full });
    }
  }
}
walk(root);

let fixedFiles = 0;
let totalFixedRefs = 0;

for (const { rel, full } of allFiles) {
  const text = readFileSync(full, "utf8");
  const data = parseYaml(text);
  if (!data) continue;
  
  // Get defined source_claims IDs
  const definedClaims = new Set();
  if (Array.isArray(data.source_claims)) {
    for (const claim of data.source_claims) {
      if (claim && typeof claim === "object" && claim.id) {
        definedClaims.add(claim.id);
      }
    }
  }
  
  if (definedClaims.size === 0) continue;
  
  // Check examples for source_claims references
  let needsFix = false;
  if (Array.isArray(data.examples)) {
    for (const example of data.examples) {
      if (!example || typeof example !== "object") continue;
      if (Array.isArray(example.source_claims)) {
        for (const ref of example.source_claims) {
          if (typeof ref === "string" && !definedClaims.has(ref)) {
            needsFix = true;
            break;
          }
        }
      }
    }
  }
  
  if (!needsFix) continue;
  
  // Fix: remove invalid source_claims references from examples
  const lines = text.split("\n");
  const fixedLines = [];
  let inExampleSourceClaims = false;
  let sourceClaimsIndent = 0;
  let fixedCount = 0;
  
  // Track source_claims within examples section
  let inExamples = false;
  let examplesIndent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
    
    // Track if we're in the examples section (top-level)
    if (line.match(/^examples:/)) {
      inExamples = true;
      examplesIndent = 0;
      fixedLines.push(line);
      continue;
    }
    if (inExamples && indent === 0 && line.match(/^[a-z_]+:/)) {
      inExamples = false;
    }
    
    if (inExamples) {
      // Check for inline source_claims: [claim-xxx, claim-yyy]
      const inlineMatch = line.match(/^(\s+source_claims:\s*)\[(.+)\]$/);
      if (inlineMatch) {
        const [, prefix, claimList] = inlineMatch;
        const claims = claimList.split(",").map(c => c.trim());
        const validClaims = claims.filter(c => definedClaims.has(c));
        const invalidClaims = claims.filter(c => !definedClaims.has(c));
        
        if (invalidClaims.length > 0) {
          fixedCount += invalidClaims.length;
          if (validClaims.length > 0) {
            fixedLines.push(`${prefix}[${validClaims.join(", ")}]`);
          } else {
            fixedLines.push(`${prefix}[]`);
          }
          continue;
        }
      }
      
      // Check for block-style source_claims
      const blockScMatch = line.match(/^(\s+)source_claims:$/);
      if (blockScMatch) {
        inExampleSourceClaims = true;
        sourceClaimsIndent = blockScMatch[1].length;
        fixedLines.push(line);
        continue;
      }
      
      if (inExampleSourceClaims) {
        if (indent <= sourceClaimsIndent && line.trim() !== '') {
          inExampleSourceClaims = false;
        } else {
          // Check list items
          const itemMatch = line.match(/^(\s+)- (.+)$/);
          if (itemMatch) {
            const claimRef = itemMatch[2].trim();
            if (!definedClaims.has(claimRef)) {
              fixedCount++;
              continue; // Skip invalid reference
            }
          }
        }
      }
    }
    
    fixedLines.push(line);
  }
  
  if (fixedCount > 0) {
    writeFileSync(full, fixedLines.join("\n"), "utf8");
    fixedFiles++;
    totalFixedRefs += fixedCount;
    console.log(`Fixed ${fixedCount} invalid refs in ${rel}`);
  }
}

console.log(`\nTotal: fixed ${totalFixedRefs} invalid references in ${fixedFiles} files`);

// Now try building again
console.log("\nRunning ontology:build to verify...");
