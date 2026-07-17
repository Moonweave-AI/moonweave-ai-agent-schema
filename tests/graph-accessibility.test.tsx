import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { OntologyGraph } from "../src/components/OntologyGraph";
import { buildOntologyIndex } from "../src/lib/ontology-index";
import { buildCommunityGraphFixture } from "./fixtures/ontology-community-graph.fixture";
import {
  fixtureRefs,
  ontologyViewModelFixture,
} from "./fixtures/ontology-view-model.fixture";

const index = buildOntologyIndex(
  ontologyViewModelFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
);

const markup = () => renderToStaticMarkup(
  <OntologyGraph
    index={index}
    language="en"
    theme="dark"
    canonicalFingerprint={`sha256:${buildCommunityGraphFixture(index).source_sha256}`}
    focusedEntityRef={fixtureRefs.agentRun}
    focusedRelationId={null}
    communityGraph={buildCommunityGraphFixture(index)}
    onFocusEntity={vi.fn()}
    onFocusRelation={vi.fn()}
  />,
);

describe("community graph keyboard accessibility", () => {
  it("exposes the canvas as a named region and the search as its keyboard alternative", () => {
    const html = markup();

    expect(html).toContain('class="ontology-network-canvas" role="region"');
    expect(html).toContain("Use search to focus a node or the directory");
    expect(html).toContain('type="search"');
    expect(html).toContain('data-testid="graph-node-search"');
    expect(html).toContain('for="ontology-network-search-input"');
    expect(html).toContain('id="ontology-network-search-input"');
  });

  it("announces stabilization and keeps community filters native", () => {
    const html = markup();

    expect(html).toContain('role="status" aria-live="polite"');
    expect(html).toContain("Loading graph engine…");
    expect(html).toContain('type="checkbox" checked=""');
    expect(html).not.toMatch(/tabindex="-1"|graph-keyboard-controls/iu);
  });
});
