import { gzipSync } from "node:zlib";

const MEBIBYTE = 1024 * 1024;

export const ontologyArtifactSizeLimits = Object.freeze({
  raw_bytes: 64 * MEBIBYTE,
  minified_bytes: 48 * MEBIBYTE,
  gzip_bytes: 6 * MEBIBYTE,
});

export const measureOntologyArtifactSize = ({ canonicalBytes, canonical }) => {
  const minified = Buffer.from(JSON.stringify(canonical), "utf8");
  return Object.freeze({
    raw_bytes: canonicalBytes.byteLength,
    minified_bytes: minified.byteLength,
    gzip_bytes: gzipSync(minified, { level: 9 }).byteLength,
  });
};

export const assertOntologyArtifactSize = ({
  canonicalBytes,
  canonical,
  limits = ontologyArtifactSizeLimits,
}) => {
  const measurements = measureOntologyArtifactSize({ canonicalBytes, canonical });
  const failures = Object.entries(limits)
    .filter(([name, maximum]) => measurements[name] > maximum)
    .map(([name, maximum]) => `${name}=${measurements[name]} > ${maximum}`);
  if (failures.length > 0) {
    throw new Error(`Ontology artifact size gate failed: ${failures.join(", ")}`);
  }
  return Object.freeze({ measurements, limits: Object.freeze({ ...limits }) });
};

