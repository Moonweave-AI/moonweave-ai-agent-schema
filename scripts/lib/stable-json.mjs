import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

export const sourceTreeFingerprint = (entries) => {
  const hash = createHash("sha256");
  const normalizedEntries = entries
    .map(([path, bytes]) => [path.replaceAll("\\", "/"), bytes])
    .sort(([left], [right]) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")),
    );
  for (const [normalizedPath, bytes] of normalizedEntries) {
    hash.update(normalizedPath, "utf8");
    hash.update("\u0000");
    hash.update(String(bytes.byteLength), "ascii");
    hash.update("\u0000");
    hash.update(bytes);
  }
  return hash.digest("hex");
};
