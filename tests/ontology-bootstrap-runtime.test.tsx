import type { ReactElement, ReactNode } from "react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  container: Object.freeze({ id: "root" }),
  createRuntime: vi.fn(),
  load: vi.fn(),
  render: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => Object.freeze({ render: harness.render })),
}));

vi.mock("../src/lib/canonical-ontology-client", () => ({
  loadCanonicalOntologyAsset: harness.load,
}));

vi.mock("../src/lib/ontology-runtime", () => ({
  createOntologyRuntime: harness.createRuntime,
}));

const findByTestId = (node: ReactNode, testId: string): ReactElement | null => {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findByTestId(child, testId);
      if (match) return match;
    }
    return null;
  }
  if (!("props" in node)) return null;
  const element = node as ReactElement<{ children?: ReactNode; "data-testid"?: string }>;
  if (element.props["data-testid"] === testId) return element;
  return findByTestId(element.props.children, testId);
};

describe("ontology application bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    harness.createRuntime.mockReset();
    harness.load.mockReset();
    harness.render.mockReset();
    vi.stubGlobal("document", Object.freeze({
      getElementById: vi.fn(() => harness.container),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts a superseded load, renders a recoverable error, and boots from retry", async () => {
    const pending: Array<Readonly<{
      signal: AbortSignal;
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
    }>> = [];
    harness.load.mockImplementation(({ signal }: { signal: AbortSignal }) =>
      new Promise((resolve, reject) => {
        pending.push({ signal, resolve, reject });
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }));
    const runtime = Object.freeze({ id: "runtime" });
    harness.createRuntime.mockReturnValue(runtime);

    const entry = await import("../src/main");
    await vi.waitFor(() => expect(pending).toHaveLength(1));
    const firstSignal = pending[0]!.signal;

    const replacement = entry.bootstrap();
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    expect(firstSignal.aborted).toBe(true);

    pending[1]!.reject(new Error("canonical unavailable"));
    await replacement;
    const errorView = harness.render.mock.calls.at(-1)?.[0] as ReactNode;
    const retry = findByTestId(errorView, "ontology-load-retry");
    expect(findByTestId(errorView, "ontology-load-error")).not.toBeNull();
    expect(retry).not.toBeNull();

    (retry!.props as { onClick: () => void }).onClick();
    await vi.waitFor(() => expect(pending).toHaveLength(3));
    pending[2]!.resolve({
      ontology: Object.freeze({ id: "canonical" }),
      canonicalFingerprint: `sha256:${"a".repeat(64)}`,
    });
    await vi.waitFor(() => expect(harness.createRuntime).toHaveBeenCalledOnce());

    expect(harness.createRuntime).toHaveBeenCalledWith(
      expect.objectContaining({ id: "canonical" }),
      expect.any(Object),
    );
    expect(findByTestId(harness.render.mock.calls.at(-1)?.[0] as ReactNode, "ontology-load-error"))
      .toBeNull();
  }, 15_000);
});
