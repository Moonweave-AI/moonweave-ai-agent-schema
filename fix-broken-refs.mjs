import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { parse, stringify } from "yaml";

const root = resolve("ontology");

// First pass: collect ALL node IDs
const allNodeIds = new Set();
const allFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === "node.yaml") {
      const rel = relative(root, full).replace(/\\/g, "/");
      const text = readFileSync(full, "utf8");
      allFiles.push({ rel, full, text });
      try {
        const data = parse(text, { schema: "core", strict: false, uniqueKeys: false });
        if (data && data.id) allNodeIds.add(data.id);
      } catch {}
    }
  }
}
walk(root);

console.log(`Total node IDs: ${allNodeIds.size}`);

// Second pass: find broken relation targets
let brokenCount = 0;
let fixedFileCount = 0;

for (const { rel, full, text } of allFiles) {
  let data;
  try {
    data = parse(text, { schema: "core", strict: false, uniqueKeys: false });
  } catch { continue; }
  if (!data || !Array.isArray(data.relations)) continue;
  
  // Check for broken targets
  const brokenTargets = new Set();
  for (const relation of data.relations) {
    if (!relation || typeof relation !== "object") continue;
    const rawTarget = relation.target ?? relation.target_id;
    if (!rawTarget) continue;
    const targetId = typeof rawTarget === "string" && rawTarget.includes(":")
      ? rawTarget.slice(rawTarget.indexOf(":") + 1)
      : rawTarget;
    if (!allNodeIds.has(targetId)) {
      brokenTargets.add(rawTarget);
      brokenCount++;
    }
  }
  
  if (brokenTargets.size === 0) continue;
  
  console.log(`${rel}: ${brokenTargets.size} broken targets: ${[...brokenTargets].join(", ")}`);
  
  // Fix: remove relations with broken targets
  const lines = text.split("\n");
  const fixedLines = [];
  let inRelations = false;
  let skipUntilNextRelation = false;
  let relationBlockIndent = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
    
    if (line.match(/^relations:/)) {
      inRelations = true;
      fixedLines.push(line);
      continue;
    }
    
    if (inRelations && indent === 0 && line.trim() && line.match(/^[a-z_]+:/)) {
      inRelations = false;
      skipUntilNextRelation = false;
    }
    
    if (inRelations) {
      // New relation item starts with "  - id:"
      if (line.match(/^\s+- id:/)) {
        skipUntilNextRelation = false;
        relationBlockIndent = indent;
      }
      
      if (skipUntilNextRelation) {
        continue;
      }
      
      // Check target/target_id
      const targetMatch = line.match(/^\s+(?:target|target_id):\s+(.+)$/);
      if (targetMatch) {
        let rawTarget = targetMatch[1].trim();
        const targetId = rawTarget.includes(":")
          ? rawTarget.slice(rawTarget.indexOf(":") + 1)
          : rawTarget;
        if (!allNodeIds.has(targetId)) {
          // Remove this entire relation block
          // Go back and remove the "- id:" line and everything since
          while (fixedLines.length > 0) {
            const last = fixedLines[fixedLines.length - 1];
            if (last.match(/^\s+- id:/)) {
              fixedLines.pop();
              break;
            }
            fixedLines.pop();
          }
          skipUntilNextRelation = true;
          continue;
        }
      }
    }
    
    fixedLines.push(line);
  }
  
  const newText = fixedLines.join("\n");
  if (newText !== text) {
    writeFileSync(full, newText, "utf8");
    fixedFileCount++;
  }
}

console.log(`\nTotal broken relation targets: ${brokenCount}`);
console.log(`Fixed files: ${fixedFileCount}`);
