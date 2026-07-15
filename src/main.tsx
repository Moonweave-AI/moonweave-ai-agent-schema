import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "vis-network/styles/vis-network.css";
import App from "./App";
import sourceIndexData from "./generated/source-index.json";
import { loadCanonicalOntologyAsset } from "./lib/canonical-ontology-client";
import { createOntologyRuntime } from "./lib/ontology-runtime";
import "./styles/tokens.css";
import "./styles/app.css";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);
let activeLoadController: AbortController | null = null;

const renderLoading = (): void => root.render(
  <p className="bootstrap-status" role="status">
    正在加载本体图谱 · Loading ontology graph · オントロジーグラフを読み込み中
  </p>,
);

export const bootstrap = async (): Promise<void> => {
  activeLoadController?.abort();
  const controller = new AbortController();
  activeLoadController = controller;
  renderLoading();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 15_000);
  try {
    const loadedCanonical = await loadCanonicalOntologyAsset({ signal: controller.signal });
    if (activeLoadController !== controller) return;
    const ontologyRuntime = createOntologyRuntime(loadedCanonical.ontology, sourceIndexData);
    root.render(
      <StrictMode>
        <App
          ontologyRuntime={ontologyRuntime}
          canonicalFingerprint={loadedCanonical.canonicalFingerprint}
        />
      </StrictMode>,
    );
  } catch {
    if (activeLoadController !== controller) return;
    root.render(
      <div className="bootstrap-status is-error" role="alert" data-testid="ontology-load-error">
        <p>本体图谱加载失败 · Ontology loading failed · 読み込みに失敗しました</p>
        <button
          type="button"
          data-testid="ontology-load-retry"
          onClick={() => void bootstrap()}
        >
          重试 · Retry · 再試行
        </button>
      </div>,
    );
  } finally {
    globalThis.clearTimeout(timeoutId);
    if (activeLoadController === controller) activeLoadController = null;
  }
};

void bootstrap();
