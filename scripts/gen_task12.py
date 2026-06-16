#!/usr/bin/env python3
"""Generate ontology/12-engineering-validation-graph YAML artifacts."""
from gen_common import BASE, write_constraint, write_contract, write_edge, write_node, write_state


def attr(typ, req, desc, **extra):
    d = {"type": typ, "required": req, "description": desc}
    d.update(extra)
    return d


def checker_node(name, label, label_zh, desc):
    return {
        "label": label,
        "label_zh": label_zh,
        "desc": desc,
        "layer": "validation",
        "interfaces": ["contract.validatable"],
        "state_machine": "state.validation_lifecycle",
        "attrs": {
            "checker_id": attr("string", True, "Unique checker identifier"),
            "severity_default": attr("enum", False, "Default severity for findings", values=["error", "warning", "info"]),
            "automated": attr("boolean", False, "Whether checker runs without manual intervention"),
        },
    }


def generate() -> None:
    root = BASE / "12-engineering-validation-graph"
    nodes = {
        "graph_validator": {
            "label": "Graph Validator",
            "label_zh": "图验证器",
            "desc": "Top-level validation orchestrator coordinating schema, constraint, coverage, and release gate checks across the ontology graph.",
            "layer": "validation",
            "state_machine": "state.validation_lifecycle",
            "attrs": {
                "validator_id": attr("string", True, "Unique validator orchestrator identifier"),
                "validation_scope": attr("array", True, "Subgraphs or artifact types included in validation run"),
                "parallel_execution": attr("boolean", False, "Whether sub-validators run in parallel"),
            },
        },
        "schema_validator": checker_node(
            "schema_validator", "Schema Validator", "模式验证器",
            "Validates ontology YAML artifacts against graph.schema.json ensuring structural correctness and required fields.",
        ),
        "constraint_validator": checker_node(
            "constraint_validator", "Constraint Validator", "约束验证器",
            "Checks GraphConstraint rules against live graph instances and reports violations with severity levels.",
        ),
        "coverage_checker": checker_node(
            "coverage_checker", "Coverage Checker", "覆盖率检查器",
            "Measures node and edge coverage metrics comparing ontology instances against expected subgraph completeness.",
        ),
        "diagram_alignment_checker": checker_node(
            "diagram_alignment_checker", "Diagram Alignment Checker", "图表对齐检查器",
            "Verifies that nodes referenced in architecture diagrams exist in the ontology and required edges are present.",
        ),
        "evidence_checker": checker_node(
            "evidence_checker", "Evidence Checker", "证据检查器",
            "Verifies evidence references on normative nodes are complete, resolvable, and cite valid source types.",
        ),
        "orphan_node_checker": checker_node(
            "orphan_node_checker", "Orphan Node Checker", "孤立节点检查器",
            "Finds node instances with no incoming or outgoing edges that may indicate incomplete graph modeling.",
        ),
        "required_edge_checker": checker_node(
            "required_edge_checker", "Required Edge Checker", "必需边检查器",
            "Verifies that required_edges declared on NodeClass definitions are satisfied by graph instances.",
        ),
        "cycle_checker": checker_node(
            "cycle_checker", "Cycle Checker", "环路检查器",
            "Detects unwanted cycles in dependency or ownership graphs that violate acyclicity constraints.",
        ),
        "runtime_contract_test": checker_node(
            "runtime_contract_test", "Runtime Contract Test", "运行时契约测试",
            "Validates runtime interface contracts by executing conformance tests against implementing components.",
        ),
        "policy_contract_test": checker_node(
            "policy_contract_test", "Policy Contract Test", "策略契约测试",
            "Validates policy enforcement paths ensuring all guarded actions are intercepted by policy evaluation.",
        ),
        "trace_replay_test": checker_node(
            "trace_replay_test", "Trace Replay Test", "追踪重放测试",
            "Replays execution traces against expected event sequences to verify runtime consistency and ordering.",
        ),
        "visualization_render_check": checker_node(
            "visualization_render_check", "Visualization Render Check", "可视化渲染检查",
            "Verifies ontology graph renders correctly in visualization tools without layout errors or missing nodes.",
        ),
        "responsive_graph_check": checker_node(
            "responsive_graph_check", "Responsive Graph Check", "响应式图检查",
            "Verifies graph visualization renders correctly on mobile and narrow viewport form factors.",
        ),
        "release_gate": {
            "label": "Release Gate",
            "label_zh": "发布门禁",
            "desc": "All-or-nothing validation gate that blocks ontology release until all mandatory checks pass at configured severity thresholds.",
            "layer": "validation",
            "state_machine": "state.validation_lifecycle",
            "attrs": {
                "gate_id": attr("string", True, "Unique release gate identifier"),
                "blocking_severities": attr("array", True, "Severity levels that block release", values=["error"]),
                "mandatory_checkers": attr("array", True, "Checker node ids that must pass for release"),
                "target_version": attr("string", False, "Ontology version this gate protects"),
            },
        },
    }
    for name, spec in nodes.items():
        write_node(root / "nodes" / f"{name}.yaml", name, spec)

    edges = {
        "VALIDATES": ("validates", {
            "source_domain": "node.graph_validator",
            "target_range": [
                "node.schema_validator", "node.constraint_validator", "node.coverage_checker",
                "node.diagram_alignment_checker", "node.evidence_checker", "node.orphan_node_checker",
                "node.required_edge_checker", "node.cycle_checker", "node.runtime_contract_test",
                "node.policy_contract_test", "node.trace_replay_test", "node.visualization_render_check",
                "node.responsive_graph_check",
            ],
            "cardinality": "1:N",
            "desc": "Graph validator orchestrates execution of specialized sub-validators and checkers.",
        }),
        "CHECKS_COVERAGE_OF": ("checks_coverage_of", {
            "source_domain": "node.coverage_checker",
            "target_range": "node.graph_validator",
            "cardinality": "N:1",
            "desc": "Coverage checker measures completeness of nodes and edges relative to expected ontology scope.",
        }),
        "ALIGNS_WITH": ("aligns_with", {
            "source_domain": "node.diagram_alignment_checker",
            "target_range": "node.graph_validator",
            "cardinality": "N:1",
            "desc": "Diagram alignment checker verifies ontology nodes align with architecture diagram references.",
        }),
        "REQUIRES_EVIDENCE": ("requires_evidence", {
            "source_domain": "node.evidence_checker",
            "target_range": "node.graph_validator",
            "cardinality": "N:1",
            "desc": "Evidence checker validates provenance requirements on normative ontology artifacts.",
        }),
        "DETECTS_ORPHAN": ("detects_orphan", {
            "source_domain": "node.orphan_node_checker",
            "target_range": "node.graph_validator",
            "cardinality": "N:1",
            "desc": "Orphan node checker scans for disconnected nodes lacking required edge relationships.",
        }),
        "DETECTS_MISSING_EDGE": ("detects_missing_edge", {
            "source_domain": "node.required_edge_checker",
            "target_range": "node.graph_validator",
            "cardinality": "N:1",
            "desc": "Required edge checker reports missing edges declared as mandatory on node class definitions.",
        }),
        "BLOCKS_RELEASE": ("blocks_release", {
            "source_domain": "node.release_gate",
            "target_range": "node.graph_validator",
            "cardinality": "1:1",
            "desc": "Release gate blocks ontology release when mandatory validation checks fail.",
        }),
    }
    for pred, (fname, spec) in edges.items():
        write_edge(root / "edges" / f"{fname}.yaml", pred, spec)

    write_contract(root / "contracts/validatable.yaml", "validatable", {
        "label": "Validatable",
        "label_zh": "可验证",
        "desc": "Behavioral contract for artifacts and components that can be validated by graph validators and checkers.",
        "operations": [
            {"name": "validate", "description": "Run validation against this artifact or component",
             "input": {"options": {"type": "object", "description": "Validation options and severity filters"}},
             "output": {"report": {"type": "object", "description": "Validation report with findings"}},
             "errors": ["ValidationSetupError"]},
            {"name": "get_validation_status", "description": "Return current validation lifecycle state",
             "input": {},
             "output": {"status": {"type": "string", "description": "Current validation state"}},
             "errors": []},
        ],
    })
    write_state(root / "states/validation_lifecycle.yaml", "validation_lifecycle", {
        "label": "Validation Lifecycle",
        "label_zh": "验证生命周期",
        "desc": "Lifecycle states for a validation run from pending through execution to pass, fail, or skip outcomes.",
        "states": [
            {"name": "pending", "initial": True, "description": "Validation queued but not yet started"},
            {"name": "running", "description": "Validation actively executing checks"},
            {"name": "passed", "terminal": True, "description": "All checks passed at or below configured severity"},
            {"name": "failed", "terminal": True, "description": "One or more checks failed at blocking severity"},
            {"name": "skipped", "terminal": True, "description": "Validation skipped due to configuration or preconditions"},
        ],
        "transitions": [
            {"from": "pending", "to": "running", "trigger": "start", "description": "Begin validation execution"},
            {"from": "pending", "to": "skipped", "trigger": "skip", "description": "Skip validation by configuration"},
            {"from": "running", "to": "passed", "trigger": "complete", "guard": "no_blocking_findings", "description": "All checks passed"},
            {"from": "running", "to": "failed", "trigger": "complete", "guard": "has_blocking_findings", "description": "Blocking findings detected"},
            {"from": "running", "to": "failed", "trigger": "abort", "description": "Validation aborted due to fatal error"},
        ],
    })
    write_constraint(root / "constraints/validator_must_connect_to_target.yaml", "validator_must_connect_to_target", {
        "label": "Validator Must Connect To Target",
        "label_zh": "验证器必须连接目标",
        "severity": "error",
        "rule": "Every specialized checker node MUST be reachable from node.graph_validator via edge.VALIDATES, defining explicit validation scope.",
        "applies_to": {"nodes": ["node.graph_validator"], "edges": ["edge.VALIDATES"]},
        "desc": "Structural rule ensuring all checkers are orchestrated by the top-level graph validator.",
    })
    write_constraint(root / "constraints/release_gate_must_check_all.yaml", "release_gate_must_check_all", {
        "label": "Release Gate Must Check All",
        "label_zh": "发布门禁必须检查全部",
        "severity": "error",
        "rule": "node.release_gate MUST reference all mandatory_checkers and block release when any mandatory checker reports failed status at blocking severity.",
        "applies_to": {"nodes": ["node.release_gate"], "edges": ["edge.BLOCKS_RELEASE"]},
        "desc": "Release integrity rule ensuring no mandatory validation is bypassed before ontology release.",
    })
    print(f"Task 4 complete: {len(nodes)} nodes, {len(edges)} edges")


if __name__ == "__main__":
    generate()
