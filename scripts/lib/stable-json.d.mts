export function sha256(value: string | NodeJS.ArrayBufferView): string;

export function stableJson(value: unknown): string;

export function sourceTreeFingerprint(
  entries: readonly (readonly [path: string, bytes: NodeJS.ArrayBufferView])[],
): string;
