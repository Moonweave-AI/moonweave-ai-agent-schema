export function parseCsvLine(line: string): string[];

export function parseCsv(
  bytes: Uint8Array | { toString(encoding: "utf8"): string },
): Array<Record<string, string>>;

export function stringifyCsv(
  columns: readonly string[],
  rows: readonly Readonly<Record<string, unknown>>[],
): string;
