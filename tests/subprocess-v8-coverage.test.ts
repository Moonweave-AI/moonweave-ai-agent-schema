import { describe, expect, it } from "vitest";

import {
  childProcessCoverageEnvironment,
  selectIncludedProcessCoverage,
} from "../scripts/lib/subprocess-v8-coverage.mjs";

describe("subprocess V8 coverage bridge", () => {
  it("enables NODE_V8_COVERAGE only for spawned children without mutating the worker environment", () => {
    const workerEnvironment = {
      PATH: "test-path",
      MOONWEAVE_VITEST_SUBPROCESS_V8_COVERAGE: "C:/tmp/raw-v8",
    };

    const childEnvironment = childProcessCoverageEnvironment(workerEnvironment);

    expect(childEnvironment).toEqual({
      ...workerEnvironment,
      NODE_V8_COVERAGE: "C:/tmp/raw-v8",
    });
    expect(childEnvironment).not.toBe(workerEnvironment);
    expect(workerEnvironment).not.toHaveProperty("NODE_V8_COVERAGE");
  });

  it("leaves child coverage disabled outside a coverage run and still returns a fresh object", () => {
    const workerEnvironment = { PATH: "test-path" };

    const childEnvironment = childProcessCoverageEnvironment(workerEnvironment);

    expect(childEnvironment).toEqual(workerEnvironment);
    expect(childEnvironment).not.toBe(workerEnvironment);
  });

  it("keeps only valid included file coverage without mutating Node's raw payload", () => {
    const rawCoverage = {
      result: [
        { url: "file:///D:/repo/scripts/lib/generator.mjs", functions: [] },
        { url: "file:///D:/repo/node_modules/dependency/index.js", functions: [] },
        { url: "node:internal/modules/esm/loader", functions: [] },
      ],
      timestamp: 42,
    };

    const selected = selectIncludedProcessCoverage(
      rawCoverage,
      (filePath) => filePath.replaceAll("\\", "/").includes("/scripts/lib/"),
    );

    expect(selected).toEqual({
      result: [rawCoverage.result[0]],
      timestamp: 42,
    });
    expect(selected).not.toBe(rawCoverage);
    expect(rawCoverage.result).toHaveLength(3);
  });

  it("rejects malformed raw coverage instead of silently weakening the gate", () => {
    expect(() => selectIncludedProcessCoverage({ result: "invalid" }, () => true)).toThrow(
      /valid result array/u,
    );
    expect(() =>
      selectIncludedProcessCoverage(
        { result: [{ url: 7, functions: [] }] },
        () => true,
      ),
    ).toThrow(/valid URL/u);
  });
});
