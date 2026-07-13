import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  recoverFileTransactions,
  writeFileTransaction,
} from "../scripts/lib/atomic-write.mjs";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("multi-file write transaction", () => {
  it("rolls the published tree back when post-publish validation fails", () => {
    const root = mkdtempSync(resolve(tmpdir(), "moonweave-atomic-write-"));
    roots.push(root);
    const first = resolve(root, "first.json");
    const second = resolve(root, "second.json");
    writeFileSync(first, "old-first", "utf8");
    writeFileSync(second, "old-second", "utf8");

    expect(() =>
      writeFileTransaction(
        new Map([
          [first, "new-first"],
          [second, "new-second"],
        ]),
        {
          afterPublish: () => {
            expect(readFileSync(first, "utf8")).toBe("new-first");
            expect(readFileSync(second, "utf8")).toBe("new-second");
            throw new Error("quality gate failed");
          },
        },
      ),
    ).toThrow(/quality gate failed/u);

    expect(readFileSync(first, "utf8")).toBe("old-first");
    expect(readFileSync(second, "utf8")).toBe("old-second");
    expect(
      readdirSync(root, { recursive: true }).some((name) =>
        /\.txn-(?:stage|backup)-/u.test(String(name)),
      ),
    ).toBe(false);
  });

  it("rolls every committed file back when a later commit fails", () => {
    const root = mkdtempSync(resolve(tmpdir(), "moonweave-atomic-write-"));
    roots.push(root);
    const first = resolve(root, "first.json");
    const second = resolve(root, "nested/second.json");
    mkdirSync(resolve(root, "nested"), { recursive: true });
    writeFileSync(first, "old-first", "utf8");
    writeFileTransaction(new Map([[second, "old-second"]]));

    expect(() =>
      writeFileTransaction(
        new Map([
          [first, "new-first"],
          [second, "new-second"],
        ]),
        {
          beforeCommit: ({ index }) => {
            if (index === 1) throw new Error("injected commit failure");
          },
        },
      ),
    ).toThrow(/injected commit failure/u);

    expect(readFileSync(first, "utf8")).toBe("old-first");
    expect(readFileSync(second, "utf8")).toBe("old-second");
    expect(readdirSync(root, { recursive: true }).some((name) => /\.txn-(?:stage|backup)-/u.test(String(name)))).toBe(false);
  });

  it("publishes all changed files and leaves unchanged files untouched", () => {
    const root = mkdtempSync(resolve(tmpdir(), "moonweave-atomic-write-"));
    roots.push(root);
    const unchanged = resolve(root, "unchanged.json");
    const changed = resolve(root, "changed.json");
    writeFileSync(unchanged, "same", "utf8");
    writeFileSync(changed, "old", "utf8");

    const result = writeFileTransaction(
      new Map([
        [unchanged, "same"],
        [changed, "new"],
      ]),
    );

    expect(result).toEqual({ changed: 1, unchanged: 1 });
    expect(readFileSync(unchanged, "utf8")).toBe("same");
    expect(readFileSync(changed, "utf8")).toBe("new");
    expect(existsSync(`${changed}.txn-stage`)).toBe(false);
  });

  it("recovers the complete pre-transaction tree after an interrupted process", () => {
    const root = mkdtempSync(resolve(tmpdir(), "moonweave-atomic-write-"));
    roots.push(root);
    const first = resolve(root, "first.json");
    const second = resolve(root, "nested/second.json");
    mkdirSync(resolve(root, "nested"), { recursive: true });
    writeFileSync(first, "old-first", "utf8");
    writeFileSync(second, "old-second", "utf8");
    const moduleUrl = pathToFileURL(
      resolve(process.cwd(), "scripts/lib/atomic-write.mjs"),
    ).href;
    const childProgram = [
      `import { writeFileTransaction } from ${JSON.stringify(moduleUrl)};`,
      `writeFileTransaction(new Map(${JSON.stringify([
        [first, "new-first"],
        [second, "new-second"],
      ])}), {`,
      `  transactionRoot: ${JSON.stringify(root)},`,
      "  beforeCommit: ({ index }) => { if (index === 1) process.exit(91); },",
      "});",
    ].join("\n");

    const interrupted = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", childProgram],
      { encoding: "utf8" },
    );
    expect(interrupted.status).toBe(91);
    expect(readFileSync(first, "utf8")).toBe("new-first");
    expect(readFileSync(second, "utf8")).toBe("old-second");

    expect(recoverFileTransactions(root)).toEqual({ recovered: 1 });
    expect(readFileSync(first, "utf8")).toBe("old-first");
    expect(readFileSync(second, "utf8")).toBe("old-second");
    expect(
      readdirSync(root, { recursive: true }).some((name) =>
        /\.txn-(?:journal|lock|stage|backup)-?/u.test(String(name)),
      ),
    ).toBe(false);
  });
});
