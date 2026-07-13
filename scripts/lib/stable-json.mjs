import { createHash } from "node:crypto";

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

export const sourceTreeFingerprint = (entries) => {
  const hash = createHash("sha256");
  for (const [path, bytes] of [...entries].sort(([left], [right]) => left.localeCompare(right))) {
    hash.update(path.replaceAll("\\", "/"));
    hash.update("\u0000");
    hash.update(bytes);
    hash.update("\u0000");
  }
  return hash.digest("hex");
};
