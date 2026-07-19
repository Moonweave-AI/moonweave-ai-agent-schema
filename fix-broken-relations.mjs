import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { parse } from "yaml";

const root = resolve("ontology");

// First pass: collect ALL concept IDs
const allConceptIds = new Set();
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
        if (data && data.id) {
          allConceptIds.add(data.id);
        }
      } catch {}
    }
  }
}
walk(root);

console.log(`Total concepts: ${allConceptIds.size}`);
console.log(`Total files: ${allFiles.length}`);

// Second pass: find all relation targets that reference missing concepts
let brokenRelations = 0;
let fixedFiles = 0;

for (const { rel, full, text } of allFiles) {
  let data;
  try {
    data = parse(text, { schema: "core", strict: false, uniqueKeys: false });
  } catch { continue; }
  if (!data) continue;
  
  // Check relations
  let hasBroken = false;
  if (Array.isArray(data.relations)) {
    for (const relation of data.relations) {
      if (!relation || typeof relation !== "object") continue;
      const target = relation.target_concept_id;
      if (target && !allConceptIds.has(target)) {
        hasBroken = true;
        brokenRelations++;
      }
    }
  }
  
  // Also check examples' related_node_ids
  if (Array.isArray(data.examples)) {
    for (const ex of data.examples) {
      if (!ex || typeof ex !== "object") continue;
      if (Array.isArray(ex.related_node_ids)) {
        for (const nodeId of ex.related_node_ids) {
          if (typeof nodeId === "string" && !allConceptIds.has(nodeId)) {
            hasBroken = true;
          }
        }
      }
    }
  }
  
  if (!hasBroken) continue;
  
  // Fix: remove broken relations and related_node_ids
  const lines = text.split("\n");
  const fixedLines = [];
  let inRelations = false;
  let relationsIndent = 0;
  let currentRelation = [];
  let currentRelationHasBrokenTarget = false;
  let skipRelation = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
    
    // Track top-level relations:
    if (line.match(/^relations:/)) {
      inRelations = true;
      relationsIndent = 0;
      fixedLines.push(line);
      continue;
    }
    
    if (inRelations) {
      // End of relations section
      if (indent === 0 && trimmed && line.match(/^[a-z_]+:/)) {
        inRelations = false;
        fixedLines.push(line);
        continue;
      }
      
      // Check for relation with broken target
      const targetMatch = line.match(/^\s+target_concept_id:\s+(.+)$/);
      if (targetMatch) {
        const target = targetMatch[1].trim();
        if (!allConceptIds.has(target)) {
          // Mark this relation for removal - find the start of this relation item
          // Look back to find the "- id:" line
          skipRelation = true;
          
          // Remove the relation item - go back to remove the "- id:" line
          while (fixedLines.length > 0) {
            const lastLine = fixedLines[fixedLines.length - 1];
            if (lastLine.match(/^\s+- id:/)) {
              fixedLines.pop();
              break;
            }
            fixedLines.pop();
          }
          continue;
        }
      }
      
      if (skipRelation) {
        // Skip lines until we hit the next relation item or end of section
        if (line.match(/^\s+- id:/) || (indent === 0 && line.match(/^[a-z_]+:/))) {
          skipRelation = false;
          // Process this line normally
        } else {
          continue;
        }
      }
    }
    
    // Fix related_node_ids in examples - remove references to missing concepts
    const relatedMatch = line.match(/^(\s+related_node_ids:\s*)\[(.+)\]$/);
    if (relatedMatch) {
      const [, prefix, idList] = relatedMatch;
      const ids = idList.split(",").map(s => s.trim());
      const validIds = ids.filter(id => allConceptIds.has(id));
      if (validIds.length !== ids.length) {
        fixedLines.push(`${prefix}[${validIds.join(", ")}]`);
        continue;
      }
    }
    
    fixedLines.push(line);
  }
  
  const newText = fixedLines.join("\n");
  if (newText !== text) {
    writeFileSync(full, newText, "utf8");
    fixedFiles++;
    console.log(`Fixed broken relations in ${rel}`);
  }
}

console.log(`\nBroken relations found: ${brokenRelations}`);
console.log(`Fixed files: ${fixedFiles}`);
