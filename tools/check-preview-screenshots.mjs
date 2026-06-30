#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib/ontology-loader.mjs";

const requiredPngs = [
  "reports/previews/desktop-overview.png",
  "reports/previews/desktop-evidence-matrix.png",
  "reports/previews/desktop-protocol-flow.png",
  "reports/previews/desktop-safety-surface.png",
  "reports/previews/desktop-evaluation-coverage.png",
  "reports/previews/mobile-node-detail.png",
  "reports/previews/browser-desktop-overview.png",
  "reports/previews/browser-mobile-overview.png",
  "reports/previews/browser-redesign-desktop.png",
  "reports/previews/browser-redesign-mobile.png",
  "reports/previews/browser-graph-explorer.png",
];
const html = readFileSync(join(ROOT, "visualization", "index.html"), "utf8");
const failures = [];

function hasPngSignature(filePath) {
  const header = readFileSync(filePath).subarray(0, 8);
  return header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function browserCandidates() {
  return [
    process.env.BROWSER_BIN,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "msedge",
    "chrome",
    "google-chrome",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
}

function findBrowser() {
  for (const candidate of browserCandidates()) {
    if (candidate.includes("\\") || candidate.includes("/")) {
      if (existsSync(candidate)) return candidate;
      continue;
    }
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8", timeout: 5000 });
    if (!result.error && result.status === 0) return candidate;
  }
  return null;
}

function captureBrowserPreview(browser, rel, width, height) {
  const outputPath = join(ROOT, rel);
  const profileDir = mkdtempSync(join(tmpdir(), "agent-schema-browser-"));
  const targetUrl = pathToFileURL(resolve(ROOT, "visualization", "index.html")).href;
  const result = spawnSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    `--user-data-dir=${profileDir}`,
    `--window-size=${width},${height}`,
    `--screenshot=${outputPath}`,
    targetUrl,
  ], { encoding: "utf8", timeout: 30000 });

  if (result.error) {
    failures.push(`Browser screenshot failed for ${rel}: ${result.error.message}`);
  } else if (result.status !== 0) {
    failures.push(`Browser screenshot failed for ${rel}: ${result.stderr || result.stdout || `exit ${result.status}`}`);
  }
}

const browser = findBrowser();
if (!browser) {
  failures.push("No Chromium-family browser found for browser screenshot QA. Set BROWSER_BIN to override.");
} else {
  captureBrowserPreview(browser, "reports/previews/browser-desktop-overview.png", 1440, 900);
  captureBrowserPreview(browser, "reports/previews/browser-mobile-overview.png", 390, 844);
}

for (const rel of requiredPngs) {
  const full = join(ROOT, rel);
  if (!existsSync(full)) {
    failures.push(`Missing preview PNG: ${rel}`);
    continue;
  }
  const stat = statSync(full);
  if (stat.size < 1024) failures.push(`Preview PNG is too small to be useful: ${rel}`);
  if (!hasPngSignature(full)) failures.push(`Preview file is not a PNG: ${rel}`);
}

for (const snippet of ["audit-shell", 'data-route="evidence-atlas"', "Evidence Atlas", "Source -> Claim -> Ontology -> Gap", "Ontology Graph Explorer", "Safety Surface", "Evaluation Coverage"]) {
  if (!html.includes(snippet)) failures.push(`Visualization missing workbench snippet: ${snippet}`);
}

console.log("Preview screenshot check");
console.log(`PNG targets: ${requiredPngs.length}`);
console.log(`Browser: ${browser || "not found"}`);

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Preview screenshot check passed.");
