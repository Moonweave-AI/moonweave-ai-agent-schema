import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import types
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

import networkx as nx


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPOSITORY_ROOT / "scripts" / "generate-ontology-community-graph.py"


def load_generator_module():
    spec = importlib.util.spec_from_file_location("ontology_community_graph", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


generator = load_generator_module()


def localized(en):
    return {"en": en, "zh": en, "ja": en}


def fixture_source():
    return {
        "id": "fixture-ontology",
        "labels": localized("Fixture ontology"),
        "status": "accepted",
        "planes": [
            {"id": "plane-a", "labels": localized("Plane A"), "status": "accepted"},
        ],
        "modules": [
            {
                "id": "module-a",
                "plane_id": "plane-a",
                "labels": localized("Module A"),
                "key_notion": localized("Root A"),
                "status": "accepted",
            },
            {
                "id": "module-b",
                "plane_id": "plane-a",
                "labels": localized("Module B"),
                "key_notion": localized("Fallback root"),
                "status": "accepted",
            },
        ],
        "classes": [
            {
                "id": "RootA",
                "module_id": "module-a",
                "labels": localized("Root A"),
                "root_status": "module-key-root",
                "status": "accepted",
            },
            {
                "id": "ChildA",
                "module_id": "module-a",
                "labels": localized("Child A"),
                "root_status": None,
                "status": "accepted",
            },
            {
                "id": "FallbackRoot",
                "module_id": "module-b",
                "labels": localized("Fallback root"),
                "root_status": "composition-root",
                "status": "accepted",
            },
            {
                "id": "SecondRootA",
                "module_id": "module-a",
                "labels": localized("Second root A"),
                "root_status": "composition-root",
                "status": "accepted",
            },
            {
                "id": "Retired",
                "module_id": "module-a",
                "labels": localized("Retired"),
                "root_status": None,
                "status": "deprecated",
            },
        ],
        "relations": [
            {
                "id": "child-is-a-root",
                "predicate": "is_a",
                "source_id": "ChildA",
                "target_id": "RootA",
                "status": "accepted",
            },
            {
                "id": "retired-relation",
                "predicate": "related_to",
                "source_id": "Retired",
                "target_id": "RootA",
                "status": "deprecated",
            },
        ],
    }


class OntologyCommunityGraphTests(unittest.TestCase):
    def test_detectors_pin_reproducibility_and_convergence_parameters(self):
        graph = nx.path_graph(["a", "b", "c"])
        louvain_options = {}

        def fake_louvain(stable, **options):
            louvain_options.update(options)
            return [set(stable.nodes)]

        with mock.patch.object(nx.community, "louvain_communities", fake_louvain):
            generator.detect_networkx_louvain(graph)

        self.assertEqual(
            louvain_options,
            {
                "weight": "weight",
                "resolution": 1.0,
                "threshold": 1e-4,
                "max_level": 10,
                "seed": 42,
            },
        )

        leiden_options = {}

        def fake_leiden(stable, resolution, random_seed, trials):
            leiden_options.update({
                "resolution": resolution,
                "random_seed": random_seed,
                "trials": trials,
            })
            return {node: 0 for node in stable.nodes}

        graspologic = types.ModuleType("graspologic")
        partition = types.ModuleType("graspologic.partition")
        partition.leiden = fake_leiden
        graspologic.partition = partition
        with mock.patch.dict(
            sys.modules,
            {"graspologic": graspologic, "graspologic.partition": partition},
        ):
            generator.detect_preferred_communities(graph)

        self.assertEqual(
            leiden_options,
            {"resolution": 1.0, "random_seed": 42, "trials": 1},
        )

    def test_rejects_oversized_input_before_reading_it(self):
        class OversizedInput:
            def stat(self):
                return SimpleNamespace(st_size=generator.MAX_CANONICAL_INPUT_BYTES + 1)

            def read_bytes(self):
                raise AssertionError("oversized input must not be read")

        with self.assertRaisesRegex(ValueError, "exceeds the .* byte limit"):
            generator.generate(OversizedInput(), Path("unused-output.json"))

    def test_rejects_projection_node_and_edge_limits_before_detection(self):
        def unexpected_detector(_graph):
            raise AssertionError("oversized projection must not reach community detection")

        with mock.patch.object(generator, "MAX_GRAPH_NODES", 7):
            with self.assertRaisesRegex(ValueError, "node limit of 7"):
                generator.build_community_projection(
                    fixture_source(),
                    source_sha256="fixture-sha",
                    detector=unexpected_detector,
                )

        with mock.patch.object(generator, "MAX_GRAPH_EDGES", 6):
            with self.assertRaisesRegex(ValueError, "edge limit of 6"):
                generator.build_community_projection(
                    fixture_source(),
                    source_sha256="fixture-sha",
                    detector=unexpected_detector,
                )

    def test_accepts_projection_at_exact_node_and_edge_limits(self):
        with (
            mock.patch.object(generator, "MAX_GRAPH_NODES", 8),
            mock.patch.object(generator, "MAX_GRAPH_EDGES", 7),
        ):
            projection = generator.build_community_projection(
                fixture_source(),
                source_sha256="fixture-sha",
                detector=generator.detect_networkx_louvain,
            )

        self.assertEqual(projection["metrics"]["node_count"], 8)
        self.assertEqual(projection["metrics"]["edge_count"], 7)

    def test_projection_is_deterministic_and_does_not_mutate_source(self):
        source = fixture_source()
        before = copy.deepcopy(source)
        first = generator.build_community_projection(
            source,
            source_sha256="fixture-sha",
            detector=generator.detect_networkx_louvain,
        )
        second = generator.build_community_projection(
            source,
            source_sha256="fixture-sha",
            detector=generator.detect_networkx_louvain,
        )

        self.assertEqual(source, before)
        self.assertEqual(
            json.dumps(first, ensure_ascii=False, sort_keys=True),
            json.dumps(second, ensure_ascii=False, sort_keys=True),
        )
        self.assertEqual(first["schema_version"], "1.0.0")
        self.assertEqual(first["algorithm"]["seed"], 42)
        self.assertEqual(first["algorithm"]["resolution"], 1.0)
        self.assertEqual(first["projection_sha256"], generator.projection_sha256(first))
        altered = copy.deepcopy(first)
        altered["algorithm"]["resolution"] = 999
        altered["communities"][0]["label"] = "tampered-label"
        altered["metrics"]["maximum_degree"] = -1
        self.assertNotEqual(
            first["projection_sha256"],
            generator.projection_sha256(altered),
        )
        self.assertEqual(
            set(first["algorithm"]),
            {
                "engine",
                "seed",
                "resolution",
                "oversized_fraction",
                "minimum_split_size",
                "cohesion_threshold",
                "cohesion_split_minimum_size",
            },
        )

    def test_preserves_canonical_direction_and_emits_complete_derived_ownership(self):
        projection = generator.build_community_projection(
            fixture_source(),
            source_sha256="fixture-sha",
            detector=generator.detect_networkx_louvain,
        )
        nodes = {node["ref"]: node for node in projection["nodes"]}
        edges = {edge["id"]: edge for edge in projection["edges"]}

        self.assertEqual(
            set(nodes),
            {
                "root:fixture-ontology",
                "plane:plane-a",
                "module:module-a",
                "module:module-b",
                "concept:RootA",
                "concept:ChildA",
                "concept:FallbackRoot",
                "concept:SecondRootA",
            },
        )
        self.assertEqual(
            edges["child-is-a-root"],
            {
                "id": "child-is-a-root",
                "source": "concept:ChildA",
                "target": "concept:RootA",
                "relation": "is_a",
                "evidence": "canonical",
            },
        )
        self.assertNotIn("retired-relation", edges)
        derived_pairs = {
            (edge["source"], edge["target"])
            for edge in edges.values()
            if edge["evidence"] == "derived"
        }
        self.assertEqual(
            derived_pairs,
            {
                ("root:fixture-ontology", "plane:plane-a"),
                ("plane:plane-a", "module:module-a"),
                ("plane:plane-a", "module:module-b"),
                ("module:module-a", "concept:RootA"),
                ("module:module-a", "concept:SecondRootA"),
                ("module:module-b", "concept:FallbackRoot"),
            },
        )
        self.assertEqual(
            {
                (edge["source"].split(":", 1)[0], edge["relation"])
                for edge in edges.values()
                if edge["evidence"] == "derived"
            },
            {
                ("root", "contains_domain"),
                ("plane", "contains_module"),
                ("module", "contains_root_concept"),
            },
        )
        self.assertTrue(all(isinstance(node["community_id"], int) for node in nodes.values()))
        self.assertEqual(projection["metrics"]["node_count"], len(nodes))
        self.assertEqual(projection["metrics"]["edge_count"], len(edges))
        self.assertEqual(
            projection["metrics"]["maximum_degree"],
            max(node["degree"] for node in nodes.values()),
        )

    def test_large_and_low_cohesion_communities_are_split_at_exact_boundaries(self):
        graph = nx.Graph()
        graph.add_nodes_from(f"n-{index:03d}" for index in range(110))
        graph.add_edge("n-000", "n-001")
        detector_calls = []

        def bisect_detector(subgraph):
            members = sorted(subgraph.nodes)
            detector_calls.append(tuple(members))
            midpoint = len(members) // 2
            return "test-bisection", [set(members[:midpoint]), set(members[midpoint:])]

        oversized = set(f"n-{index:03d}" for index in range(49))
        boundary_low_cohesion = set(f"n-{index:03d}" for index in range(49, 99))
        untouched = set(f"n-{index:03d}" for index in range(99, 110))
        result = generator.split_communities(
            graph,
            [oversized, boundary_low_cohesion, untouched],
            detector=bisect_detector,
            # Graphify floors N * 25%; a 49-node community in a 195-node graph
            # therefore exceeds the limit of 48 and must be split.
            total_node_count=195,
        )

        self.assertEqual(sorted(map(len, result)), [11, 24, 25, 25, 25])
        self.assertEqual(len(detector_calls), 2)
        self.assertIn(tuple(sorted(oversized)), detector_calls)
        self.assertIn(tuple(sorted(boundary_low_cohesion)), detector_calls)

    def test_community_ids_and_hub_names_use_stable_size_member_and_global_degree(self):
        source = fixture_source()
        projection = generator.build_community_projection(
            source,
            source_sha256=hashlib.sha256(b"fixture").hexdigest(),
            detector=lambda graph: (
                "fixture-detector",
                [
                    {"concept:ChildA", "concept:RootA"},
                    set(graph.nodes) - {"concept:ChildA", "concept:RootA"},
                ],
            ),
        )
        communities = projection["communities"]

        self.assertEqual([community["id"] for community in communities], list(range(len(communities))))
        self.assertGreaterEqual(communities[0]["member_count"], communities[1]["member_count"])
        for community in communities:
            members = set(community["member_refs"])
            member_nodes = [node for node in projection["nodes"] if node["ref"] in members]
            expected_hub = sorted(member_nodes, key=lambda node: (-node["degree"], node["ref"]))[0]
            self.assertEqual(community["hub_ref"], expected_hub["ref"])
            self.assertTrue(community["label"])
            self.assertEqual(community["member_count"], len(members))
            self.assertEqual(
                community["member_signature"],
                hashlib.sha256("\n".join(sorted(members)).encode("utf-8")).hexdigest(),
            )

    def test_cli_is_byte_deterministic_across_python_hash_seeds(self):
        source_path = REPOSITORY_ROOT / "ontology" / "agent-ontology.json"
        with tempfile.TemporaryDirectory() as directory:
            first_path = Path(directory) / "first.json"
            second_path = Path(directory) / "second.json"
            for hash_seed, output_path in (("1", first_path), ("987654", second_path)):
                environment = {**os.environ, "PYTHONHASHSEED": hash_seed, "PYTHONIOENCODING": "utf-8"}
                subprocess.run(
                    [
                        sys.executable,
                        str(SCRIPT_PATH),
                        "--input",
                        str(source_path),
                        "--output",
                        str(output_path),
                    ],
                    check=True,
                    capture_output=True,
                    env=environment,
                )
            self.assertEqual(first_path.read_bytes(), second_path.read_bytes())


if __name__ == "__main__":
    unittest.main()
