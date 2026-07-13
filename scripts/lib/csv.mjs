export const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  if (quoted) throw new Error(`Unterminated quoted CSV row: ${line}`);
  return [...cells, current];
};

export const parseCsv = (bytes) => {
  const [headerLine, ...dataLines] = bytes.toString("utf8").trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return dataLines.map((line, rowIndex) => {
    const cells = parseCsvLine(line);
    if (cells.length !== headers.length) {
      throw new Error(
        `CSV row ${rowIndex + 2} has ${cells.length} cells; expected ${headers.length}`,
      );
    }
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
};

const escapeCsvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const stringifyCsv = (columns, rows) =>
  `${[
    columns.map(escapeCsvCell).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(",")),
  ].join("\n")}\n`;
