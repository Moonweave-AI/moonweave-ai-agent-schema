import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  assertReviewedDependencyPolicy,
  runZeroToleranceNpmAudit,
  validateReviewedDependencyPolicy,
} from "../scripts/lib/dependency-security-gates.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const licenseBytes = Buffer.from("MIT License\n\nReviewed fixture.\n");
const licenseSha = createHash("sha256").update(licenseBytes).digest("hex");

const packageRecord = (name: "vis-data" | "vis-network") => {
  const version = name === "vis-data" ? "7.1.10" : "9.1.13";
  const specifier = `^${version}`;
  const repository = `https://github.com/visjs/${name}.git`;
  const resolved = `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;
  const integrity = name === "vis-data"
    ? "sha512-23juM9tdCaHTX5vyIQ7XBzsfZU0Hny+gSTwniLrfFcmw9DOm7pi3+h9iEBsoZMp5rX6KNqWwc1MF0fkAmWVuoQ=="
    : "sha512-HLeHd5KZS92qzO1kC59qMh1/FWAZxMUEwUWBwDMoj6RKj/Ajkrgy/heEYo0Zc8SZNQ2J+u6omvK2+a28GX1QuQ==";
  return { name, version, specifier, repository, resolved, integrity };
};

const baseInput = () => {
  const records = (["vis-data", "vis-network"] as const).map(packageRecord);
  return {
    packageManifest: {
      dependencies: Object.fromEntries(records.map(({ name, specifier }) => [name, specifier])),
    },
    lockfile: {
      lockfileVersion: 3,
      packages: {
        "": { dependencies: Object.fromEntries(
          records.map(({ name, specifier }) => [name, specifier])),
        },
        ...Object.fromEntries(records.map((record) => [
          `node_modules/${record.name}`,
          {
            version: record.version,
            resolved: record.resolved,
            integrity: record.integrity,
            license: "(Apache-2.0 OR MIT)",
          },
        ])),
      },
    },
    policy: {
      schema_version: 1,
      reviewed_dependencies: records.map((record) => ({
        name: record.name,
        dependency_section: "dependencies",
        requested_specifier: record.specifier,
        locked_version: record.version,
        resolved: record.resolved,
        integrity: record.integrity,
        allowed_licenses: ["(Apache-2.0 OR MIT)"],
        metadata_evidence: {
          manifest_path: `node_modules/${record.name}/package.json`,
          license_field: "license",
          repository: record.repository,
          license_file: `node_modules/${record.name}/LICENSE-MIT`,
          license_file_sha256: licenseSha,
        },
        reviewed_by: "Moonweave ontology maintainers",
        reviewed_on: "2026-07-15",
        rationale: `${record.name} reviewed for the packaged community graph.`,
      })),
    },
    installedPackages: Object.fromEntries(records.map((record) => [record.name, {
      manifest: {
        name: record.name,
        version: record.version,
        license: "(Apache-2.0 OR MIT)",
        repository: { type: "git", url: record.repository },
      },
      licenseBytes,
    }])),
  };
};

describe("reviewed dependency license and lockfile policy", () => {
  it("accepts reviewed vis runtime dependencies without mutating policy inputs", () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    expect(validateReviewedDependencyPolicy(input)).toEqual([]);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("rejects integrity, license, and installed license-file drift", () => {
    const input = baseInput();
    const lock = (input.lockfile.packages as unknown as Record<string, {
      integrity: string;
      license: string;
    }>)["node_modules/vis-network"];
    lock.integrity = "sha512-tampered";
    lock.license = "UNKNOWN";
    input.installedPackages["vis-network"].licenseBytes = Buffer.from("different license");

    const violations = validateReviewedDependencyPolicy(input);
    expect(violations.map(({ field }) => field)).toEqual(expect.arrayContaining([
      "lock.integrity", "lock.license", "installed.license_file_sha256",
    ]));
    expect(() => assertReviewedDependencyPolicy(input)).toThrow(
      /vis-network[\s\S]*integrity[\s\S]*license/iu,
    );
  });

  it("rejects an omitted mandatory review and manifest-to-lock specifier drift", () => {
    const missingReview = baseInput();
    missingReview.policy.reviewed_dependencies = missingReview.policy.reviewed_dependencies
      .filter(({ name }) => name !== "vis-network");
    expect(validateReviewedDependencyPolicy(missingReview)).toEqual(expect.arrayContaining([
      expect.objectContaining({ packageName: "vis-network", field: "policy.review" }),
    ]));

    const drifted = baseInput();
    drifted.lockfile.packages[""].dependencies["vis-data"] = "^8.0.0";
    expect(validateReviewedDependencyPolicy(drifted)).toEqual(expect.arrayContaining([
      expect.objectContaining({ packageName: "vis-data", field: "lock.root_specifier" }),
    ]));
  });

  it("rejects incomplete provenance and malformed license evidence", () => {
    const input = baseInput();
    input.policy.reviewed_dependencies[0].reviewed_by = "";
    input.policy.reviewed_dependencies[0].rationale = "";
    input.policy.reviewed_dependencies[0].metadata_evidence.license_file =
      "../../unreviewed-license.txt";
    input.installedPackages["vis-data"].licenseBytes = undefined as never;

    expect(validateReviewedDependencyPolicy(input)).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "policy.reviewed_by" }),
      expect.objectContaining({ field: "policy.rationale" }),
      expect.objectContaining({ field: "policy.metadata_evidence" }),
      expect.objectContaining({ field: "installed.license_file" }),
    ]));
  });
});

describe("zero-tolerance npm audit adapter", () => {
  it("uses the npm CLI supplied by npm itself and fails at low severity", () => {
    const spawn = vi.fn(() => ({ status: 0, stdout: "0 vulnerabilities", stderr: "" }));
    runZeroToleranceNpmAudit({
      repositoryRoot: "/workspace",
      environment: { npm_execpath: "/tools/npm-cli.js" },
      processObject: { execPath: "/runtime/node", platform: "linux" },
      spawn,
      log: vi.fn(),
    });
    expect(spawn).toHaveBeenCalledWith(
      "/runtime/node",
      ["/tools/npm-cli.js", "audit", "--audit-level=low"],
      expect.objectContaining({ cwd: "/workspace", encoding: "utf8" }),
    );
  });

  it("uses npm.cmd on Windows and propagates audit failure", () => {
    const spawn = vi.fn(() => ({
      status: 1,
      stdout: "1 high severity vulnerability",
      stderr: "",
    }));
    expect(() => runZeroToleranceNpmAudit({
      repositoryRoot: "C:\\workspace",
      environment: {},
      processObject: { execPath: "node.exe", platform: "win32" },
      spawn,
      log: vi.fn(),
    })).toThrow(/npm audit[\s\S]*high severity vulnerability/iu);
    expect(spawn).toHaveBeenCalledWith(
      "npm.cmd", ["audit", "--audit-level=low"], expect.any(Object),
    );
  });
});

describe("repository dependency-security wiring", () => {
  it("keeps the offline policy and online audit in verification and CI", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const validationWorkflow = readFileSync(
      resolve(repositoryRoot, ".github/workflows/ontology-validation.yml"), "utf8");
    const deployWorkflow = readFileSync(
      resolve(repositoryRoot, ".github/workflows/deploy.yml"), "utf8");

    expect(packageJson.scripts["dependency:security"]).toBe(
      "npm run dependency:policy && npm run dependency:audit && npm run dependency:python",
    );
    expect(packageJson.scripts["ontology:preflight"]).toContain("npm run dependency:security");
    expect(validationWorkflow).toMatch(
      /name: Verify dependency policy[\s\S]*run: npm run dependency:policy/u,
    );
    expect(validationWorkflow).toMatch(
      /name: Audit all known dependency vulnerabilities[\s\S]*run: npm run dependency:audit/u,
    );
    expect(deployWorkflow).toContain("run: npm run verify");
  });

  it("pins every external GitHub Action to an immutable commit", () => {
    for (const workflowPath of [
      ".github/workflows/deploy.yml",
      ".github/workflows/ontology-validation.yml",
    ]) {
      const workflow = readFileSync(resolve(repositoryRoot, workflowPath), "utf8");
      const usesLines = workflow.split(/\r?\n/u).filter((line) => /^\s*uses:\s*/u.test(line));
      expect(usesLines.length).toBeGreaterThan(0);
      for (const line of usesLines) {
        const reference = line.match(/^\s*uses:\s*([^\s#]+)/u)?.[1];
        if (reference?.startsWith("./")) continue;
        expect(reference).toMatch(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[0-9a-f]{40}$/u);
        expect(line).toMatch(/\s+#\s+v\d+\s*$/u);
      }
    }
  });
});
