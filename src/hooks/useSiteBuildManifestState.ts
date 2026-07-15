import { useEffect, useState } from "react";

import {
  loadSiteBuildManifest,
  SiteBuildManifestMismatchError,
  type CanonicalIdentity,
  type SiteBuildManifestState,
} from "../lib/site-build-manifest";

export const useSiteBuildManifestState = (
  identity: CanonicalIdentity,
): SiteBuildManifestState => {
  const [state, setState] = useState<SiteBuildManifestState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    void loadSiteBuildManifest({ identity, signal: controller.signal }).then(
      (manifest) => {
        if (!controller.signal.aborted) setState({ status: "ready", manifest });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: error instanceof SiteBuildManifestMismatchError ? "mismatch" : "unavailable",
          reason: error instanceof Error ? error.message : String(error),
        });
      },
    );
    return () => controller.abort();
  }, [identity]);

  return state;
};
