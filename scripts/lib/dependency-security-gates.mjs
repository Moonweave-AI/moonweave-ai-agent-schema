import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultRepositoryRoot = resolve(import.meta.dirname, "../..");
const policyPath = "scripts/data/dependency-license-allowlist.json";
const requiredReviewedDependencies = ["vis-data", "vis-network"];

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" ? value : "";
const violation = (packageName, field, message) => ({ packageName, field, message });
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const repositoryUrl = (repository) =>
  typeof repository === "string" ? repository : text(repository?.url);

const validateReviewProvenance = (entry, packageName) => {
  const violations = [];
  for (const field of ["reviewed_by", "reviewed_on", "rationale"]) {
    if (!text(entry?.[field]).trim()) {
      violations.push(violation(packageName, `policy.${field}`, `${field} is required`));
    }
  }
  if (text(entry?.reviewed_on) && !/^\d{4}-\d{2}-\d{2}$/u.test(entry.reviewed_on)) {
    violations.push(violation(packageName, "policy.reviewed_on", "reviewed_on must be YYYY-MM-DD"));
  }
  return violations;
};

const validateReview = ({ entry, packageManifest, lockfile, installedPackage }) => {
  const packageName = text(entry?.name) || "<unknown>";
  const violations = validateReviewProvenance(entry, packageName);
  const section = text(entry?.dependency_section);
  const manifestSpecifier = text(packageManifest?.[section]?.[packageName]);
  const rootSpecifier = text(lockfile?.packages?.[""]?.[section]?.[packageName]);
  const lock = lockfile?.packages?.[`node_modules/${packageName}`];
  const evidence = entry?.metadata_evidence;

  if (section !== "dependencies") {
    violations.push(violation(packageName, "policy.dependency_section", "reviewed runtime dependencies must be in dependencies"));
  }
  if (manifestSpecifier !== entry?.requested_specifier) {
    violations.push(violation(packageName, "manifest.specifier", "package.json specifier differs from the reviewed specifier"));
  }
  if (rootSpecifier !== manifestSpecifier) {
    violations.push(violation(packageName, "lock.root_specifier", "lockfile root specifier differs from package.json"));
  }
  if (!isRecord(lock)) {
    violations.push(violation(packageName, "lock.entry", "package lock entry is missing"));
    return violations;
  }
  for (const [field, expected] of [
    ["version", entry?.locked_version],
    ["resolved", entry?.resolved],
    ["integrity", entry?.integrity],
  ]) {
    if (lock[field] !== expected) {
      violations.push(violation(packageName, `lock.${field}`, `${field} differs from reviewed evidence`));
    }
  }
  if (!/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(text(lock.integrity))) {
    violations.push(violation(packageName, "lock.integrity", "lock integrity must be a sha512 SRI value"));
  }
  if (!text(lock.resolved).startsWith("https://registry.npmjs.org/")) {
    violations.push(violation(packageName, "lock.resolved", "resolved tarball must use the HTTPS npm registry"));
  }
  const allowedLicenses = Array.isArray(entry?.allowed_licenses) ? entry.allowed_licenses : [];
  if (!allowedLicenses.includes(lock.license)) {
    violations.push(violation(packageName, "lock.license", `license ${text(lock.license) || "<missing>"} is not allowlisted`));
  }
  const evidenceIsValid =
    evidence?.manifest_path === `node_modules/${packageName}/package.json` &&
    evidence?.license_field === "license" &&
    text(evidence?.license_file).startsWith(`node_modules/${packageName}/LICENSE`) &&
    /^https:\/\//u.test(text(evidence?.repository)) &&
    /^[a-f0-9]{64}$/u.test(text(evidence?.license_file_sha256));
  if (!evidenceIsValid) {
    violations.push(violation(packageName, "policy.metadata_evidence", "installed metadata paths, repository, or license SHA-256 is invalid"));
  }
  if (!installedPackage) {
    violations.push(violation(packageName, "installed.package", "installed package evidence is missing; run npm ci"));
    return violations;
  }
  const installed = installedPackage.manifest;
  for (const [field, actual, expected] of [
    ["name", installed?.name, packageName],
    ["version", installed?.version, entry?.locked_version],
    ["license", installed?.license, lock.license],
    ["repository", repositoryUrl(installed?.repository), evidence?.repository],
  ]) {
    if (actual !== expected) {
      violations.push(violation(packageName, `installed.${field}`, `${field} differs from reviewed package metadata`));
    }
  }
  const licenseBytes = installedPackage.licenseBytes;
  if (!(typeof licenseBytes === "string" || ArrayBuffer.isView(licenseBytes))) {
    violations.push(violation(packageName, "installed.license_file", "installed license text is missing or unreadable"));
  } else if (sha256(licenseBytes) !== evidence?.license_file_sha256) {
    violations.push(violation(packageName, "installed.license_file_sha256", "installed license text differs from reviewed evidence"));
  }
  return violations;
};

export const validateReviewedDependencyPolicy = ({
  packageManifest,
  lockfile,
  policy,
  installedPackages,
}) => {
  const violations = [];
  if (lockfile?.lockfileVersion !== 3) {
    violations.push(violation("<lockfile>", "lock.lockfileVersion", "lockfileVersion 3 is required"));
  }
  if (policy?.schema_version !== 1 || !Array.isArray(policy?.reviewed_dependencies)) {
    return [
      ...violations,
      violation("<policy>", "policy.schema", "dependency license policy schema_version 1 is required"),
    ];
  }
  const entriesByName = new Map();
  for (const entry of policy.reviewed_dependencies) {
    const name = text(entry?.name);
    if (!name || entriesByName.has(name)) {
      violations.push(violation(name || "<unknown>", "policy.review", "review names must be non-empty and unique"));
      continue;
    }
    entriesByName.set(name, entry);
  }
  for (const packageName of requiredReviewedDependencies) {
    const entry = entriesByName.get(packageName);
    if (!entry) {
      violations.push(violation(packageName, "policy.review", "mandatory dependency review is missing"));
      continue;
    }
    violations.push(...validateReview({
      entry,
      packageManifest,
      lockfile,
      installedPackage: installedPackages?.[packageName],
    }));
  }
  return violations;
};

export const assertReviewedDependencyPolicy = (input) => {
  const violations = validateReviewedDependencyPolicy(input);
  if (violations.length === 0) return;
  throw new Error(`Dependency license/lock policy failed:\n${violations
    .map(({ packageName, field, message }) => `- ${packageName} ${field}: ${message}`)
    .join("\n")}`);
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

export const loadReviewedDependencyInputs = (repositoryRoot = defaultRepositoryRoot) => {
  const policy = readJson(resolve(repositoryRoot, policyPath));
  const installedPackages = Object.fromEntries(policy.reviewed_dependencies.map((entry) => [
    entry.name,
    {
      manifest: readJson(resolve(repositoryRoot, entry.metadata_evidence.manifest_path)),
      licenseBytes: readFileSync(resolve(repositoryRoot, entry.metadata_evidence.license_file)),
    },
  ]));
  return {
    packageManifest: readJson(resolve(repositoryRoot, "package.json")),
    lockfile: readJson(resolve(repositoryRoot, "package-lock.json")),
    policy,
    installedPackages,
  };
};

export const runZeroToleranceNpmAudit = ({
  repositoryRoot = defaultRepositoryRoot,
  environment = process.env,
  processObject = process,
  spawn = spawnSync,
  log = console.log,
} = {}) => {
  const npmCli = text(environment.npm_execpath);
  const command = npmCli ? processObject.execPath : processObject.platform === "win32" ? "npm.cmd" : "npm";
  const args = npmCli
    ? [npmCli, "audit", "--audit-level=low"]
    : ["audit", "--audit-level=low"];
  const result = spawn(command, args, { cwd: repositoryRoot, encoding: "utf8", env: environment });
  if (result.error) throw result.error;
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  if (result.status !== 0) {
    throw new Error(`npm audit found a known vulnerability${output ? `:\n${output}` : ""}`);
  }
  log(output || "npm audit passed with no known vulnerabilities.");
  return result;
};
