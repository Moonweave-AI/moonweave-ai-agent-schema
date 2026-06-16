/**
 * Minimal dependency-free YAML parser for ontology artifacts.
 * Handles top-level key:value, nested objects, arrays (- prefix), and | / > blocks.
 */

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseInlineArray(raw) {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(",").map((part) => stripQuotes(part.trim()));
}

function parseScalar(raw) {
  const inlineArray = parseInlineArray(raw);
  if (inlineArray) return inlineArray;

  const value = stripQuotes(raw);
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (value === "{}") return {};
  if (value === "[]") return [];
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);
  return value;
}

function indentOf(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function isBlankOrComment(line) {
  return !line.trim() || line.trim().startsWith("#");
}

function parseMappingLine(trimmed) {
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) return null;
  return {
    key: trimmed.slice(0, colonIndex).trim(),
    rest: trimmed.slice(colonIndex + 1),
  };
}

function parseQuotedMultiline(lines, startIndex, indent, quoteChar, initialContent) {
  let content = initialContent;
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const lineIndent = indentOf(line);
    if (lineIndent < indent) break;

    const trimmed = line.trim();
    content += `\n${trimmed}`;

    if (trimmed.endsWith(quoteChar)) {
      i += 1;
      break;
    }
    i += 1;
  }

  if (content.startsWith(quoteChar)) content = content.slice(1);
  if (content.endsWith(quoteChar)) content = content.slice(0, -1);
  return { value: content.replace(/\n\s+/g, " ").trim(), nextIndex: i };
}

function parseScalarValue(rest, lines, lineIndex, indent) {
  const restTrimmed = rest.trim();

  if (
    (restTrimmed.startsWith("'") && !restTrimmed.endsWith("'")) ||
    (restTrimmed.startsWith('"') && !restTrimmed.endsWith('"'))
  ) {
    const quoteChar = restTrimmed[0];
    return parseQuotedMultiline(lines, lineIndex + 1, indent, quoteChar, restTrimmed);
  }

  let scalar = parseScalar(rest);
  let i = lineIndex + 1;

  while (i < lines.length) {
    const nextLine = lines[i];
    if (isBlankOrComment(nextLine)) break;
    const nextIndent = indentOf(nextLine);
    if (nextIndent <= indent) break;

    const nextTrimmed = nextLine.trim();
    if (nextTrimmed.startsWith("- ")) break;
    if (parseMappingLine(nextTrimmed) && nextIndent === indent + 2) break;

    scalar = `${scalar} ${nextTrimmed}`.replace(/\s+/g, " ").trim();
    i += 1;
  }

  return { value: scalar, nextIndex: i };
}

function parseBlockScalar(lines, startIndex, baseIndent, blockType) {
  let i = startIndex;
  const parts = [];
  const contentIndent = i < lines.length ? indentOf(lines[i]) : baseIndent + 2;

  while (i < lines.length) {
    const line = lines[i];
    if (isBlankOrComment(line)) {
      if (blockType === "|") parts.push("");
      i += 1;
      continue;
    }
    const lineIndent = indentOf(line);
    if (lineIndent <= baseIndent) break;
    parts.push(line.slice(contentIndent));
    i += 1;
  }

  const text =
    blockType === ">"
      ? parts.join(" ").replace(/\s+/g, " ").trim()
      : parts.join("\n").replace(/\n+$/, "");
  return { value: text, nextIndex: i };
}

function parseBlock(lines, startIndex, baseIndent) {
  const root = {};
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    if (isBlankOrComment(line)) {
      i += 1;
      continue;
    }

    const indent = indentOf(line);
    if (indent < baseIndent) break;
    if (indent > baseIndent) {
      throw new Error(`Unexpected indentation at line ${i + 1}: ${line}`);
    }

    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      throw new Error(`Unexpected list item at line ${i + 1}: ${line}`);
    }

    const mapping = parseMappingLine(trimmed);
    if (!mapping) {
      throw new Error(`Invalid mapping at line ${i + 1}: ${line}`);
    }

    const { key, rest } = mapping;
    const restTrimmed = rest.trim();

    if (restTrimmed === "" || restTrimmed === "|" || restTrimmed === ">") {
      i += 1;
      while (i < lines.length && isBlankOrComment(lines[i])) {
        i += 1;
      }
      if (i >= lines.length) {
        root[key] = restTrimmed === "|" || restTrimmed === ">" ? "" : null;
        continue;
      }

      const nextIndent = indentOf(lines[i]);
      if (nextIndent < indent) {
        root[key] = restTrimmed === "|" || restTrimmed === ">" ? "" : null;
        continue;
      }

      if (lines[i].trim().startsWith("- ")) {
        const { value, nextIndex } = parseList(lines, i, nextIndent);
        root[key] = value;
        i = nextIndex;
        continue;
      }

      if (nextIndent <= indent) {
        root[key] = restTrimmed === "|" || restTrimmed === ">" ? "" : null;
        continue;
      }

      if (restTrimmed === "|" || restTrimmed === ">") {
        const { value, nextIndex } = parseBlockScalar(lines, i, indent, restTrimmed);
        root[key] = value;
        i = nextIndex;
        continue;
      }

      const { value, nextIndex } = parseBlock(lines, i, nextIndent);
      root[key] = value;
      i = nextIndex;
      continue;
    }

    const { value, nextIndex } = parseScalarValue(rest, lines, i, indent);
    root[key] = value;
    i = nextIndex;
  }

  return { value: root, nextIndex: i };
}

function parseListItemValue(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const inner = trimmed.slice(1, -1);
    const obj = {};
    for (const part of inner.split(",")) {
      const idx = part.indexOf(":");
      if (idx === -1) continue;
      obj[part.slice(0, idx).trim()] = parseScalar(part.slice(idx + 1));
    }
    return obj;
  }
  return parseScalar(trimmed);
}

function parseListItemObject(lines, startIndex, listIndent, firstKey, firstRest) {
  const obj = { [firstKey]: parseScalar(firstRest) };
  let i = startIndex;
  const childIndent = listIndent + 2;

  while (i < lines.length) {
    const line = lines[i];
    if (isBlankOrComment(line)) {
      i += 1;
      continue;
    }

    const indent = indentOf(line);
    if (indent <= listIndent) break;

    const trimmed = line.trim();
    if (indent === listIndent && trimmed.startsWith("- ")) break;
    if (indent < childIndent) break;

    if (trimmed.startsWith("- ")) {
      const { value, nextIndex } = parseList(lines, i, indent);
      const lastKey = Object.keys(obj).at(-1);
      obj[lastKey] = value;
      i = nextIndex;
      continue;
    }

    const mapping = parseMappingLine(trimmed);
    if (!mapping) break;

    const { key, rest } = mapping;
    const restTrimmed = rest.trim();

    if (restTrimmed === "" || restTrimmed === "|" || restTrimmed === ">") {
      i += 1;
      if (i >= lines.length) {
        obj[key] = restTrimmed === "|" || restTrimmed === ">" ? "" : null;
        continue;
      }

      const nextIndent = indentOf(lines[i]);
      if (nextIndent < indent) {
        obj[key] = restTrimmed === "|" || restTrimmed === ">" ? "" : null;
        continue;
      }

      if (lines[i].trim().startsWith("- ")) {
        const { value, nextIndex } = parseList(lines, i, nextIndent);
        obj[key] = value;
        i = nextIndex;
        continue;
      }

      if (nextIndent <= indent) {
        obj[key] = restTrimmed === "|" || restTrimmed === ">" ? "" : null;
        continue;
      }

      if (restTrimmed === "|" || restTrimmed === ">") {
        const { value, nextIndex } = parseBlockScalar(lines, i, indent, restTrimmed);
        obj[key] = value;
        i = nextIndex;
        continue;
      }

      const { value, nextIndex } = parseBlock(lines, i, nextIndent);
      obj[key] = value;
      i = nextIndex;
      continue;
    }

    const parsed = parseScalarValue(rest, lines, i, indent);
    obj[key] = parsed.value;
    i = parsed.nextIndex;
  }

  return { value: obj, nextIndex: i };
}

function parseList(lines, startIndex, baseIndent) {
  const items = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    if (isBlankOrComment(line)) {
      i += 1;
      continue;
    }

    const indent = indentOf(line);
    if (indent < baseIndent) break;

    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) break;

    const itemText = trimmed.slice(2);
    const mapping = parseMappingLine(itemText);

    if (!mapping) {
      items.push(parseListItemValue(itemText));
      i += 1;
      continue;
    }

    const { key, rest } = mapping;
    const restTrimmed = rest.trim();

    if (restTrimmed === "" && i + 1 < lines.length && indentOf(lines[i + 1]) > indent) {
      i += 1;
      const childIndent = indentOf(lines[i]);

      if (lines[i].trim().startsWith("- ")) {
        const { value, nextIndex } = parseList(lines, i, childIndent);
        items.push({ [key]: value });
        i = nextIndex;
      } else {
        const { value, nextIndex } = parseBlock(lines, i, childIndent);
        items.push({ [key]: value });
        i = nextIndex;
      }
      continue;
    }

    if (
      restTrimmed !== "" ||
      (i + 1 < lines.length && indentOf(lines[i + 1]) > indent + 1)
    ) {
      i += 1;
      const { value, nextIndex } = parseListItemObject(
        lines,
        i,
        indent,
        key,
        restTrimmed,
      );
      items.push(value);
      i = nextIndex;
      continue;
    }

    items.push({ [key]: null });
    i += 1;
  }

  return { value: items, nextIndex: i };
}

export function parseYaml(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const { value } = parseBlock(lines, 0, 0);
  return value ?? {};
}

export function readYamlFile(path, fs) {
  const text = fs.readFileSync(path, "utf8");
  return parseYaml(text);
}
