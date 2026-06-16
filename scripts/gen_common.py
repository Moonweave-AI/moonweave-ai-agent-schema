"""Shared helpers for ontology YAML generation."""
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "ontology"


def fmt_attrs(attrs: dict) -> str:
    lines = ["attributes:"]
    for k, v in attrs.items():
        lines.append(f"  {k}:")
        for ak, av in v.items():
            if ak == "description":
                continue
            if isinstance(av, list):
                vals = ", ".join(repr(x) for x in av)
                lines.append(f"    {ak}: [{vals}]")
            elif isinstance(av, bool):
                lines.append(f"    {ak}: {str(av).lower()}")
            else:
                lines.append(f"    {ak}: {av}")
        lines.append(f'    description: {v["description"]}')
    return "\n".join(lines)


def write_node(path: Path, name: str, spec: dict) -> None:
    lines = [
        f"id: node.{name}",
        "artifact: NodeClass",
        f'label: {spec["label"]}',
        f'label_zh: {spec["label_zh"]}',
    ]
    if spec.get("layer"):
        lines.append(f'layer: {spec["layer"]}')
    if spec.get("plane"):
        lines.append(f'plane: {spec["plane"]}')
    lines.append("description: >")
    lines.append(f'  {spec["desc"]}')
    lines.append(fmt_attrs(spec["attrs"]))
    if spec.get("interfaces"):
        lines.append("interfaces:")
        for i in spec["interfaces"]:
            lines.append(f"  - ref: {i}")
    if spec.get("state_machine"):
        lines.append("state_machine:")
        lines.append(f'  ref: {spec["state_machine"]}')
    if spec.get("required_edges"):
        lines.append("required_edges:")
        for direction in ("outgoing", "incoming"):
            if spec["required_edges"].get(direction):
                lines.append(f"  {direction}:")
                for e in spec["required_edges"][direction]:
                    lines.append(f'    - predicate: {e["predicate"]}')
                    if "target" in e:
                        lines.append(f'      target: {e["target"]}')
                    if "target_any_of" in e:
                        lines.append(f'      target_any_of: {e["target_any_of"]}')
                    if "source" in e:
                        lines.append(f'      source: {e["source"]}')
                    if "source_any_of" in e:
                        lines.append(f'      source_any_of: {e["source_any_of"]}')
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_edge(path: Path, predicate: str, spec: dict) -> None:
    sd = spec["source_domain"]
    tr = spec["target_range"]
    sd_line = f"source_domain: {sd}" if isinstance(sd, str) else f"source_domain: [{', '.join(sd)}]"
    tr_line = f"target_range: {tr}" if isinstance(tr, str) else f"target_range: [{', '.join(tr)}]"
    lines = [
        f"id: edge.{predicate}",
        "artifact: EdgeClass",
        f"predicate: {predicate}",
        sd_line,
        tr_line,
    ]
    if spec.get("cardinality"):
        lines.append(f'cardinality: "{spec["cardinality"]}"')
    lines.append("description: >")
    lines.append(f'  {spec["desc"]}')
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_contract(path: Path, cid: str, spec: dict) -> None:
    lines = [
        f"id: contract.{cid}",
        "artifact: InterfaceContract",
        f'label: {spec["label"]}',
        f'label_zh: {spec["label_zh"]}',
        "description: >",
        f'  {spec["desc"]}',
        "operations:",
    ]
    for op in spec["operations"]:
        lines.append(f'  - name: {op["name"]}')
        if op.get("description"):
            lines.append(f'    description: {op["description"]}')
        if op.get("input"):
            lines.append("    input:")
            for ik, iv in op["input"].items():
                lines.append(f"      {ik}:")
                for ak, av in iv.items():
                    lines.append(f"        {ak}: {av}")
        else:
            lines.append("    input: {}")
        if op.get("output"):
            lines.append("    output:")
            for ok, ov in op["output"].items():
                lines.append(f"      {ok}:")
                for ak, av in ov.items():
                    lines.append(f"        {ak}: {av}")
        if op.get("errors"):
            err = ", ".join(op["errors"])
            lines.append(f"    errors: [{err}]")
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_state(path: Path, sid: str, spec: dict) -> None:
    lines = [
        f"id: state.{sid}",
        "artifact: StateMachine",
        f'label: {spec["label"]}',
        f'label_zh: {spec["label_zh"]}',
        "description: >",
        f'  {spec["desc"]}',
        "states:",
    ]
    for s in spec["states"]:
        lines.append(f'  - name: {s["name"]}')
        if s.get("initial"):
            lines.append("    initial: true")
        if s.get("terminal"):
            lines.append("    terminal: true")
        if s.get("description"):
            lines.append(f'    description: {s["description"]}')
    lines.append("transitions:")
    for t in spec["transitions"]:
        lines.append(f'  - from: {t["from"]}')
        lines.append(f'    to: {t["to"]}')
        lines.append(f'    trigger: {t["trigger"]}')
        if t.get("guard"):
            lines.append(f'    guard: {t["guard"]}')
        if t.get("description"):
            lines.append(f'    description: {t["description"]}')
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_constraint(path: Path, cid: str, spec: dict) -> None:
    lines = [
        f"id: constraint.{cid}",
        "artifact: GraphConstraint",
        f'label: {spec["label"]}',
        f'label_zh: {spec["label_zh"]}',
        f'severity: {spec["severity"]}',
        "rule: >",
        f'  {spec["rule"]}',
    ]
    if spec.get("applies_to"):
        lines.append("applies_to:")
        if spec["applies_to"].get("nodes"):
            nodes = ", ".join(spec["applies_to"]["nodes"])
            lines.append(f"  nodes: [{nodes}]")
        if spec["applies_to"].get("edges"):
            edges = ", ".join(spec["applies_to"]["edges"])
            lines.append(f"  edges: [{edges}]")
    lines.append("description: >")
    lines.append(f'  {spec["desc"]}')
    lines.append("status: active")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
