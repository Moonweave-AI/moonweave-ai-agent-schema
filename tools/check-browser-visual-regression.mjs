#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib/ontology-loader.mjs";

const failures = [];
const targets = [
  ["reports/previews/browser-redesign-desktop.png", 1440, 900, "#evidence-atlas"],
  ["reports/previews/browser-redesign-mobile.png", 390, 844, "#evidence-atlas"],
  ["reports/previews/browser-graph-explorer.png", 1440, 900, "#ontology-graph-explorer"],
];

function failIf(condition, message) {
  if (condition) failures.push(message);
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

function hasPngSignature(filePath) {
  const header = readFileSync(filePath).subarray(0, 8);
  return header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function capture(browser, rel, width, height, hash) {
  const outputPath = join(ROOT, rel);
  const profileDir = mkdtempSync(join(tmpdir(), "agent-schema-visual-"));
  const targetUrl = `${pathToFileURL(resolve(ROOT, "visualization", "index.html")).href}${hash}`;
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

  if (result.error) failures.push(`Browser capture failed for ${rel}: ${result.error.message}`);
  if (!result.error && result.status !== 0) failures.push(`Browser capture failed for ${rel}: ${result.stderr || result.stdout || `exit ${result.status}`}`);
}

const html = readFileSync(join(ROOT, "visualization", "index.html"), "utf8");
failIf(!html.includes("Evidence Atlas"), "Default Evidence Atlas text missing");
failIf(!html.includes("Ontology Graph Explorer"), "Graph explorer text missing");
failIf(!html.includes('data-route="evidence-atlas"'), "Default route is not evidence-atlas");

const browser = findBrowser();
failIf(!browser, "No Chromium-family browser found. Set BROWSER_BIN to override.");
if (browser) {
  for (const [rel, width, height, hash] of targets) capture(browser, rel, width, height, hash);
}

for (const [rel] of targets) {
  const filePath = join(ROOT, rel);
  failIf(!existsSync(filePath), `Missing browser visual regression PNG: ${rel}`);
  if (existsSync(filePath)) {
    failIf(statSync(filePath).size < 4096, `Browser visual regression PNG is too small: ${rel}`);
    failIf(!hasPngSignature(filePath), `Browser visual regression file is not PNG: ${rel}`);
  }
}

console.log("Browser visual regression check");
console.log(`Browser: ${browser || "not found"}`);
console.log(`Targets: ${targets.length}`);

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("Browser visual regression check passed.");
