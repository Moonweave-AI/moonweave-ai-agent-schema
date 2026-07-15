import type { ReactElement } from "react";

import type { OntologyUiText } from "../i18n/ui-text";
import { compiledBuildCommitSha } from "../lib/site-build-identity";
import type { SiteBuildManifestState } from "../lib/site-build-manifest";

export const renderSiteBuildIdentity = (
  state: SiteBuildManifestState,
  text: OntologyUiText,
): ReactElement => {
  if (state.status === "ready") {
    return (
      <div
        className="build-identity is-ready"
        data-testid="build-identity"
        data-build-commit={compiledBuildCommitSha}
        data-ontology-fingerprint={state.manifest.canonical_fingerprint}
        role="status"
        aria-label={text.buildIdentity}
      >
        <span>{text.buildCommit}</span>
        <strong>{compiledBuildCommitSha.slice(0, 12)}</strong>
        <span>{text.ontologyFingerprint}</span>
        <code title={state.manifest.canonical_fingerprint}>
          {state.manifest.canonical_fingerprint}
        </code>
      </div>
    );
  }

  const message = state.status === "loading"
    ? text.buildIdentityLoading
    : state.status === "mismatch"
      ? text.buildIdentityMismatch
      : text.buildIdentityUnavailable;
  return (
    <div
      className={`build-identity is-${state.status}`}
      data-testid={`build-identity-${state.status}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
};
