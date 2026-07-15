import { gzipSync } from "node:zlib";

import { objectEvidenceVolumeMetrics } from "./ontology-v3-object-evidence.mjs";

const MEBIBYTE = 1024 * 1024;

export const ontologyArtifactSizeLimits = Object.freeze({
  raw_bytes: 48 * MEBIBYTE,
  minified_bytes: 42 * MEBIBYTE,
  gzip_bytes: Math.floor(3.25 * MEBIBYTE),
  nested_support_bytes: 8 * MEBIBYTE,
  average_nested_support_bytes: 800,
  maximum_nested_support_bytes: 1024,
  nested_copied_direct_support_count: 0,
});

export const measureOntologyArtifactSize = ({ canonicalBytes, canonical }) => {
  const minified = Buffer.from(JSON.stringify(canonical), "utf8");
  const evidence = objectEvidenceVolumeMetrics(canonical);
  return Object.freeze({
    raw_bytes: canonicalBytes.byteLength,
    minified_bytes: minified.byteLength,
    gzip_bytes: gzipSync(minified, { level: 9 }).byteLength,
    nested_claim_count: evidence.nested_claim_count,
    nested_support_bytes: evidence.nested_support_bytes,
    average_nested_support_bytes: evidence.nested_claim_count === 0
      ? 0
      : evidence.nested_support_bytes / evidence.nested_claim_count,
    maximum_nested_support_bytes: evidence.maximum_nested_support_bytes,
    nested_copied_direct_support_count:
      evidence.nested_copied_direct_support_count,
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
  return Object.freeze({
    measurements,
    limits: Object.freeze({ ...limits }),
  });
};
