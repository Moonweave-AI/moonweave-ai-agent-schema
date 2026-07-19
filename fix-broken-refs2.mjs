import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { parse } from "yaml";

const root = resolve("ontology");

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
        if (data?.id) allNodeIds.add(data.id);
      } catch {}
    }
  }
}
walk(root);

console.log(`Total node IDs: ${allNodeIds.size}`);

// Find broken relation IDs
function getBrokenRelationIds(data) {
  const broken = new Set();
  if (!Array.isArray(data?.relations)) return broken;
  for (const rel of data.relations) {
    if (!rel?.id) continue;
    const rawTarget = rel.target ?? rel.target_id;
    if (!rawTarget) continue;
    const targetId = typeof rawTarget === "string" && rawTarget.includes(":")
      ? rawTarget.slice(rawTarget.indexOf(":") + 1)
      : rawTarget;
    if (!allNodeIds.has(targetId)) {
      broken.add(rel.id);
    }
  }
  return broken;
}

let fixedFileCount = 0;

for (const { rel, full, text } of allFiles) {
  let data;
  try {
    data = parse(text, { schema: "core", strict: false, uniqueKeys: false });
  } catch { continue; }
  
  const brokenIds = getBrokenRelationIds(data);
  if (brokenIds.size === 0) continue;
  
  console.log(`${rel}: removing relations ${[...brokenIds].join(", ")}`);
  
  const lines = text.split("\n");
  const result = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Detect "  - id: RELATION_ID" (relation list item)
    const relItemMatch = line.match(/^(\s+)- id:\s+(.+)$/);
    if (relItemMatch) {
      const itemIndent = relItemMatch[1].length;
      const relId = relItemMatch[2].trim();
      
      if (brokenIds.has(relId)) {
        // Skip this entire relation block
        i++;
        while (i < lines.length) {
          const nextLine = lines[i];
          const nextIndent = nextLine.match(/^(\s*)/)?.[1]?.length ?? 0;
          const nextTrimmed = nextLine.trim();
          
          // If we hit another list item at the same or lesser indent, stop
          if (nextTrimmed.startsWith("- id:") && nextIndent <= itemIndent) break;
          // If we hit a top-level key, stop
          if (nextIndent === 0 && nextTrimmed && /^[a-z_]+:/.test(nextTrimmed)) break;
          // If we hit a line at lesser indent than the relation item's indent, stop
          if (nextTrimmed && nextIndent <= itemIndent && !nextTrimmed.startsWith("-")) break;
          
          i++;
        }
        continue;
      }
    }
    
    result.push(line);
    i++;
  }
  
  // Also clean up related_node_ids and related_relation_ids in examples
  // that reference the broken relations or their targets
  const brokenTargets = new Set();
  for (const rel of data.relations ?? []) {
    if (brokenIds.has(rel?.id)) {
      const raw = rel.target ?? rel.target_id;
      const t = typeof raw === "string" && raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
      brokenTargets.add(t);
    }
  }
  
  const finalResult = [];
  for (const line of result) {
    // Remove references to broken targets in related_node_ids
    const nodeIdMatch = line.match(/^(\s+)- ([\w]+)$/);
    if (nodeIdMatch && brokenTargets.has(nodeIdMatch[2])) {
      continue;
    }
    // Remove references to broken relation ids in related_relation_ids
    const relIdMatch = line.match(/^(\s+)- ([\w-]+)$/);
    if (relIdMatch && brokenIds.has(relIdMatch[2])) {
      continue;
    }
    finalResult.push(line);
  }
  
  const newText = finalResult.join("\n");
  if (newText !== text) {
    writeFileSync(full, newText, "utf8");
    fixedFileCount++;
  }
}

console.log(`\nFixed ${fixedFileCount} files`);
