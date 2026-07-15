import fs from "node:fs";
import path from "node:path";

import { writeFileTransaction } from "./lib/atomic-write.mjs";
import { isMainModule } from "./lib/cli-entrypoint.mjs";
import { expectedSiteBuildManifest } from "./lib/site-build-metadata.mjs";
import { stableJson } from "./lib/stable-json.mjs";

export const writeSiteBuildManifest = ({
  root = process.cwd(),
  manifest = expectedSiteBuildManifest(root),
} = {}) => {
  const dist = path.join(root, "dist");
  const indexPath = path.join(dist, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error("dist/index.html does not exist; run Vite build first");
  }
  const target = path.join(dist, "build-manifest.json");
  const transaction = writeFileTransaction([[target, stableJson(manifest)]], {
    transactionRoot: dist,
  });
  return Object.freeze({ manifest, target, transaction });
};

if (isMainModule(import.meta.url)) {
  const result = writeSiteBuildManifest();
  console.log(`Wrote ${path.relative(process.cwd(), result.target)} for ${result.manifest.commit_sha}`);
}
