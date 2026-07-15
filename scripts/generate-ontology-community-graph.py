#!/usr/bin/env python3
"""Generate a deterministic community projection of the canonical Agent ontology."""

from __future__ import annotations

import argparse
import hashlib
import inspect
import json
import math
from pathlib import Path
import struct
from typing import Any, Callable, Iterable

import networkx as nx


SEED = 42
RESOLUTION = 1.0
MAX_COMMUNITY_PROPORTION = 0.25
MIN_OVERSIZED_COMMUNITY_SIZE = 10
LOW_COHESION_THRESHOLD = 0.05
MIN_LOW_COHESION_COMMUNITY_SIZE = 50
# Fail closed before untrusted canonical data can create an unbounded in-memory graph.
MAX_CANONICAL_INPUT_BYTES = 64 * 1024 * 1024
MAX_GRAPH_NODES = 5_000
MAX_GRAPH_EDGES = 50_000
REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = REPOSITORY_ROOT / "ontology" / "agent-ontology.json"
DEFAULT_OUTPUT = REPOSITORY_ROOT / "src" / "generated" / "ontology-community-graph.json"

Community = set[str]
CommunityDetector = Callable[[nx.Graph], tuple[str, list[Community]]]


def _require_list(source: dict[str, Any], key: str) -> list[dict[str, Any]]:
    value = source.get(key)
    if not isinstance(value, list) or any(not isinstance(item, dict) for item in value):
        raise ValueError(f"Canonical ontology field {key!r} must be an array of objects")
    return value


def _require_identifier(record: dict[str, Any], context: str) -> str:
    identifier = record.get("id")
    if not isinstance(identifier, str) or not identifier:
        raise ValueError(f"{context} must have a non-empty string id")
    return identifier


def _unique_records(records: Iterable[dict[str, Any]], context: str) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for record in records:
        identifier = _require_identifier(record, context)
        if identifier in indexed:
            raise ValueError(f"Duplicate {context} id {identifier!r}")
        indexed = {**indexed, identifier: record}
    return indexed


def _entity_ref(kind: str, identifier: str) -> str:
    return f"{kind}:{identifier}"


def _display_label(record: dict[str, Any]) -> str:
    labels = record.get("labels")
    if isinstance(labels, dict):
        for language in ("en", "zh", "ja"):
            label = labels.get(language)
            if isinstance(label, str) and label.strip():
                return label.strip()
    return _require_identifier(record, "ontology entity")


def _derived_edge(
    identifier: str,
    source: str,
    target: str,
    relation: str,
) -> dict[str, str]:
    return {
        "id": identifier,
        "source": source,
        "target": target,
        "relation": relation,
        "evidence": "derived",
    }


def _projection_records(source: dict[str, Any]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    root_id = source.get("id")
    if not isinstance(root_id, str) or not root_id:
        raise ValueError("Canonical ontology must have a non-empty string id")
    planes = _require_list(source, "planes")
    modules = _require_list(source, "modules")
    concepts = _require_list(source, "classes")
    relations = _require_list(source, "relations")
    planes_by_id = _unique_records(planes, "plane")
    modules_by_id = _unique_records(modules, "module")
    accepted_concepts = [record for record in concepts if record.get("status") == "accepted"]
    accepted_relations = [record for record in relations if record.get("status") == "accepted"]
    accepted_by_id = _unique_records(accepted_concepts, "accepted concept")
    roots_by_module: dict[str, list[dict[str, Any]]] = {}
    for concept in accepted_concepts:
        concept_id = _require_identifier(concept, "accepted concept")
        module_id = concept.get("module_id")
        if not isinstance(module_id, str) or module_id not in modules_by_id:
            raise ValueError(f"Accepted concept {concept_id!r} references unknown module {module_id!r}")
        if concept.get("root_status") not in {"module-key-root", "composition-root"}:
            continue
        roots_by_module = {
            **roots_by_module,
            module_id: [*roots_by_module.get(module_id, []), concept],
        }

    projected_node_count = 1 + len(planes_by_id) + len(modules_by_id) + len(accepted_by_id)
    if projected_node_count > MAX_GRAPH_NODES:
        raise ValueError(
            f"Community projection has {projected_node_count} nodes; "
            f"the node limit of {MAX_GRAPH_NODES} was exceeded"
        )
    projected_edge_count = (
        len(accepted_relations)
        + len(planes_by_id)
        + len(modules_by_id)
        + sum(len(roots) for roots in roots_by_module.values())
    )
    if projected_edge_count > MAX_GRAPH_EDGES:
        raise ValueError(
            f"Community projection has {projected_edge_count} edges; "
            f"the edge limit of {MAX_GRAPH_EDGES} was exceeded"
        )

    nodes = [{"ref": _entity_ref("root", root_id), "label": _display_label(source)}]
    nodes.extend(
        {"ref": _entity_ref("plane", identifier), "label": _display_label(record)}
        for identifier, record in sorted(planes_by_id.items())
    )
    nodes.extend(
        {"ref": _entity_ref("module", identifier), "label": _display_label(record)}
        for identifier, record in sorted(modules_by_id.items())
    )
    nodes.extend(
        {"ref": _entity_ref("concept", identifier), "label": _display_label(record)}
        for identifier, record in sorted(accepted_by_id.items())
    )

    edges: list[dict[str, str]] = []
    for relation in accepted_relations:
        relation_id = _require_identifier(relation, "relation")
        source_id = relation.get("source_id")
        target_id = relation.get("target_id")
        predicate = relation.get("predicate")
        if source_id not in accepted_by_id or target_id not in accepted_by_id:
            raise ValueError(f"Accepted relation {relation_id!r} must join accepted concepts")
        if not isinstance(predicate, str) or not predicate:
            raise ValueError(f"Accepted relation {relation_id!r} must have a predicate")
        edges.append({
            "id": relation_id,
            "source": _entity_ref("concept", source_id),
            "target": _entity_ref("concept", target_id),
            "relation": predicate,
            "evidence": "canonical",
        })

    root_ref = _entity_ref("root", root_id)
    for plane_id in sorted(planes_by_id):
        edges.append(_derived_edge(
            f"derived:ontology-plane:{plane_id}",
            root_ref,
            _entity_ref("plane", plane_id),
            "contains_domain",
        ))
    for module_id, module in sorted(modules_by_id.items()):
        plane_id = module.get("plane_id")
        if plane_id not in planes_by_id:
            raise ValueError(f"Module {module_id!r} references unknown plane {plane_id!r}")
        edges.append(_derived_edge(
            f"derived:plane-module:{plane_id}:{module_id}",
            _entity_ref("plane", plane_id),
            _entity_ref("module", module_id),
            "contains_module",
        ))
        module_roots = sorted(
            roots_by_module.get(module_id, []),
            key=lambda concept: _require_identifier(concept, "module root concept"),
        )
        if not module_roots:
            raise ValueError(f"Module {module_id!r} has no accepted ontology root concept")
        for root_concept in module_roots:
            root_concept_id = _require_identifier(root_concept, "module root concept")
            edges.append(_derived_edge(
                f"derived:module-root:{module_id}:{root_concept_id}",
                _entity_ref("module", module_id),
                _entity_ref("concept", root_concept_id),
                "contains_root_concept",
            ))
    edge_ids = [edge["id"] for edge in edges]
    if len(edge_ids) != len(set(edge_ids)):
        raise ValueError("Community projection edge ids must be unique")
    return sorted(nodes, key=lambda item: item["ref"]), sorted(edges, key=lambda item: item["id"])


def _graphs(
    nodes: list[dict[str, str]],
    edges: list[dict[str, str]],
) -> tuple[nx.MultiDiGraph, nx.Graph]:
    directed = nx.MultiDiGraph()
    undirected = nx.Graph()
    refs = [node["ref"] for node in nodes]
    directed.add_nodes_from(refs)
    undirected.add_nodes_from(refs)
    for edge in edges:
        directed.add_edge(edge["source"], edge["target"], key=edge["id"])
        previous_weight = undirected.get_edge_data(edge["source"], edge["target"], {}).get(
            "weight", 0
        )
        undirected.add_edge(edge["source"], edge["target"], weight=previous_weight + 1)
    return directed, undirected


def _normalized_partition(graph: nx.Graph, communities: Iterable[Iterable[str]]) -> list[Community]:
    normalized: list[Community] = []
    for community in communities:
        members = set(community)
        if members:
            normalized.append(members)
    observed: set[str] = set()
    for community in normalized:
        if observed.intersection(community):
            raise ValueError("Community detector returned overlapping communities")
        observed = observed.union(community)
    if observed != set(graph.nodes):
        raise ValueError("Community detector must cover every graph node exactly once")
    return sorted(normalized, key=lambda members: (-len(members), tuple(sorted(members))))


def _stable_graph_copy(graph: nx.Graph) -> nx.Graph:
    stable = nx.Graph()
    stable.add_nodes_from(sorted(graph.nodes))
    ordered_edges = sorted(
        graph.edges(data=True),
        key=lambda item: (min(item[0], item[1]), max(item[0], item[1])),
    )
    for source, target, data in ordered_edges:
        stable.add_edge(source, target, weight=data.get("weight", 1))
    return stable


def detect_networkx_louvain(graph: nx.Graph) -> tuple[str, list[Community]]:
    if graph.number_of_nodes() == 0:
        return "networkx-louvain", []
    if graph.number_of_edges() == 0:
        return "networkx-louvain", [{node} for node in sorted(graph.nodes)]
    stable = _stable_graph_copy(graph)
    communities = nx.community.louvain_communities(
        stable,
        weight="weight",
        resolution=RESOLUTION,
        threshold=1e-4,
        max_level=10,
        seed=SEED,
    )
    return "networkx-louvain", _normalized_partition(stable, communities)


def detect_preferred_communities(graph: nx.Graph) -> tuple[str, list[Community]]:
    try:
        from graspologic.partition import leiden
    except ImportError:
        return detect_networkx_louvain(graph)
    stable = _stable_graph_copy(graph)
    parameters = inspect.signature(leiden).parameters
    options: dict[str, Any] = {
        "resolution": RESOLUTION,
        "random_seed": SEED,
    }
    if "trials" in parameters:
        options["trials"] = 1
    assignments = leiden(stable, **options)
    grouped: dict[Any, set[str]] = {}
    for node, community_id in assignments.items():
        grouped = {
            **grouped,
            community_id: {*grouped.get(community_id, set()), node},
        }
    return "graspologic-leiden", _normalized_partition(stable, grouped.values())


def community_cohesion(graph: nx.Graph, members: Community) -> float:
    if len(members) < 2:
        return 1.0
    subgraph = graph.subgraph(members)
    internal_edges = sum(1 for source, target in subgraph.edges if source != target)
    possible_edges = len(members) * (len(members) - 1) / 2
    return internal_edges / possible_edges


def split_communities(
    graph: nx.Graph,
    communities: Iterable[Iterable[str]],
    detector: CommunityDetector,
    total_node_count: int | None = None,
) -> list[Community]:
    normalized = _normalized_partition(graph, communities)
    total = total_node_count if total_node_count is not None else graph.number_of_nodes()
    oversized_limit = max(
        MIN_OVERSIZED_COMMUNITY_SIZE,
        int(total * MAX_COMMUNITY_PROPORTION),
    )
    pending = list(normalized)
    settled: list[Community] = []
    while pending:
        members = pending.pop(0)
        oversized = len(members) > oversized_limit
        low_cohesion = (
            len(members) >= MIN_LOW_COHESION_COMMUNITY_SIZE
            and community_cohesion(graph, members) < LOW_COHESION_THRESHOLD
        )
        if not oversized and not low_cohesion:
            settled.append(members)
            continue
        subgraph = _stable_graph_copy(graph.subgraph(members))
        _, detected = detector(subgraph)
        partitions = _normalized_partition(subgraph, detected)
        if len(partitions) < 2 or max(map(len, partitions)) == len(members):
            settled.append(members)
            continue
        pending = sorted(
            [*pending, *partitions],
            key=lambda part: (-len(part), tuple(sorted(part))),
        )
    return sorted(settled, key=lambda part: (-len(part), tuple(sorted(part))))


def _round_metric(value: float) -> float:
    return round(value, 12)


def _canonical_fingerprint_json(value: Any) -> str:
    if value is None:
        return "z"
    if isinstance(value, bool):
        return "b1" if value else "b0"
    if isinstance(value, int):
        return f"n{value};"
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("Projection fingerprints require finite numbers")
        if value.is_integer():
            return f"n{int(value)};"
        return f"n0x{struct.pack('>d', value).hex()};"
    if isinstance(value, str):
        return f"s{json.dumps(value, ensure_ascii=False)}"
    if isinstance(value, list):
        return f"[{','.join(_canonical_fingerprint_json(item) for item in value)}]"
    if isinstance(value, dict):
        fields = (
            f"{json.dumps(str(key), ensure_ascii=False)}:"
            f"{_canonical_fingerprint_json(value[key])}"
            for key in sorted(value)
        )
        return f"{{{','.join(fields)}}}"
    raise TypeError(f"Unsupported projection value: {type(value).__name__}")


def projection_sha256(projection: dict[str, Any]) -> str:
    fingerprint_payload = {
        key: value
        for key, value in projection.items()
        if key != "projection_sha256"
    }
    canonical = _canonical_fingerprint_json(fingerprint_payload)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def build_community_projection(
    source: dict[str, Any],
    source_sha256: str,
    detector: CommunityDetector = detect_preferred_communities,
) -> dict[str, Any]:
    nodes, edges = _projection_records(source)
    directed, undirected = _graphs(nodes, edges)
    algorithm_name, initial = detector(undirected)
    communities = split_communities(
        undirected,
        initial,
        detector=detector,
        total_node_count=undirected.number_of_nodes(),
    )
    degrees = dict(directed.degree())
    labels_by_ref = {node["ref"]: node["label"] for node in nodes}
    community_by_ref: dict[str, int] = {}
    community_records: list[dict[str, Any]] = []
    for index, members in enumerate(communities, start=1):
        community_id = index - 1
        ordered_members = sorted(members)
        hub_ref = sorted(ordered_members, key=lambda ref: (-degrees[ref], ref))[0]
        community_by_ref = {
            **community_by_ref,
            **{ref: community_id for ref in ordered_members},
        }
        community_records.append({
            "id": community_id,
            "label": labels_by_ref[hub_ref],
            "hub_ref": hub_ref,
            "member_count": len(ordered_members),
            "cohesion": _round_metric(community_cohesion(undirected, members)),
            "member_signature": hashlib.sha256(
                "\n".join(ordered_members).encode("utf-8")
            ).hexdigest(),
            "member_refs": ordered_members,
        })
    if set(community_by_ref) != set(undirected.nodes):
        raise ValueError("Final communities do not cover the projection")
    output_nodes = [
        {
            "ref": node["ref"],
            "community_id": community_by_ref[node["ref"]],
            "degree": degrees[node["ref"]],
        }
        for node in nodes
    ]
    projection = {
        "schema_version": "1.0.0",
        "source_sha256": source_sha256,
        "algorithm": {
            "engine": algorithm_name,
            "seed": SEED,
            "resolution": RESOLUTION,
            "oversized_fraction": MAX_COMMUNITY_PROPORTION,
            "minimum_split_size": MIN_OVERSIZED_COMMUNITY_SIZE,
            "cohesion_threshold": LOW_COHESION_THRESHOLD,
            "cohesion_split_minimum_size": MIN_LOW_COHESION_COMMUNITY_SIZE,
        },
        "metrics": {
            "node_count": len(output_nodes),
            "edge_count": len(edges),
            "community_count": len(community_records),
            "maximum_degree": max(degrees.values(), default=0),
        },
        "communities": community_records,
        "nodes": output_nodes,
        "edges": edges,
    }
    projection["projection_sha256"] = projection_sha256(projection)
    return projection


def generate(input_path: Path, output_path: Path) -> dict[str, Any]:
    input_size = input_path.stat().st_size
    if input_size > MAX_CANONICAL_INPUT_BYTES:
        raise ValueError(
            f"Canonical ontology input has {input_size} bytes and exceeds the "
            f"{MAX_CANONICAL_INPUT_BYTES} byte limit"
        )
    source_bytes = input_path.read_bytes()
    if len(source_bytes) > MAX_CANONICAL_INPUT_BYTES:
        raise ValueError(
            f"Canonical ontology input has {len(source_bytes)} bytes and exceeds the "
            f"{MAX_CANONICAL_INPUT_BYTES} byte limit"
        )
    source = json.loads(source_bytes.decode("utf-8"))
    if not isinstance(source, dict):
        raise ValueError("Canonical ontology root must be an object")
    projection = build_community_projection(
        source,
        source_sha256=hashlib.sha256(source_bytes).hexdigest(),
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(projection, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    return projection


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    arguments = parser.parse_args()
    projection = generate(arguments.input.resolve(), arguments.output.resolve())
    print(json.dumps({
        "output": str(arguments.output),
        "source_sha256": projection["source_sha256"],
        **projection["metrics"],
        "algorithm": projection["algorithm"]["engine"],
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
