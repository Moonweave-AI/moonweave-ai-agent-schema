#!/usr/bin/env python3
"""Progress sync agent: scan all ontology node.yaml files for quality signals."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyyaml", "-q"])
    import yaml

ROOT = Path(__file__).resolve().parents[1] / "ontology"
LEGACY_KEYS = [
    "axioms",
    "axiom_validation",
    "axioms_and_validation",
    "validation",
    "adaptation_mapping",
    "adaptation_mappings",
    "external_mappings",
    "maturity",
    "maturity_changes",
    "change_history",
    "change_log",
    "changelog",
    "introduced",
    "deprecated",
    "change_notes",
    "review_status",
    "review",
    "reviewers",
]
NA_PATTERNS = re.compile(r"不适用|not applicable|n/?a\b|none\b|无\b", re.I)
EXAMPLE_KINDS = {"positive", "counterexample", "boundary", "instance"}


def norm_text(value, lang: str = "zh") -> str:
    if value is None:
        return ""
    if isinstance(value, dict):
        return str(value.get(lang) or value.get("en") or next(iter(value.values()), "")).strip()
    return str(value).strip()


def similar(a: str, b: str) -> bool:
    if not a or not b:
        return False
    a2 = re.sub(r"\s+", "", a.lower())
    b2 = re.sub(r"\s+", "", b.lower())
    if a2 == b2:
        return True
    if len(a2) > 20 and (a2 in b2 or b2 in a2):
        return True
    return False


def main() -> int:
    plane_counts: dict[str, int] = {}
    stats = {
        "total": 0,
        "yaml_errors": [],
        "status_accepted": 0,
        "release_block": 0,
        "legacy_keys": [],
        "issues_by_category": {},
        "nodes_with_issues": 0,
        "nodes_pass_basic": 0,
        "example_kind_gaps": 0,
        "missing_sources": 0,
        "na_io": 0,
        "def_same": 0,
        "eng_repeat": 0,
    }
    all_issues: list[dict] = []

    for fp in sorted(ROOT.rglob("node.yaml")):
        rel = fp.relative_to(ROOT.parent).as_posix()
        stats["total"] += 1
        parts = rel.split("/")
        plane = parts[1] if len(parts) > 1 else "unknown"
        plane_counts[plane] = plane_counts.get(plane, 0) + 1

        try:
            with open(fp, encoding="utf-8") as handle:
                data = yaml.safe_load(handle)
        except Exception as exc:  # noqa: BLE001
            stats["yaml_errors"].append({"path": rel, "error": str(exc)[:240]})
            continue

        if not isinstance(data, dict):
            stats["yaml_errors"].append({"path": rel, "error": "not a mapping"})
            continue

        node_issues: list[str] = []

        for key in LEGACY_KEYS:
            if key in data:
                stats["legacy_keys"].append({"path": rel, "key": key})
                node_issues.append(f"legacy key: {key}")

        if data.get("status") == "accepted":
            stats["status_accepted"] += 1
        if isinstance(data.get("release"), dict):
            stats["release_block"] += 1

        sem = data.get("semantics") or {}
        sd = norm_text(sem.get("short_definition"))
        df = norm_text(sem.get("definition"))
        wn = norm_text(sem.get("why_needed"))
        inc = sem.get("includes") or []
        exc = sem.get("excludes") or []

        if similar(sd, df):
            stats["def_same"] += 1
            node_issues.append("short_definition ~= definition")
        if not wn or len(wn) < 8:
            node_issues.append("why_needed missing/too short")
        if not inc:
            node_issues.append("includes empty")
        if not exc:
            node_issues.append("excludes empty")

        eng = data.get("engineering") or {}
        expl = norm_text(eng.get("explanation"))
        if not expl:
            node_issues.append("engineering.explanation missing")
        elif similar(expl, df) or similar(expl, sd):
            stats["eng_repeat"] += 1
            node_issues.append("engineering.explanation repeats definition")

        for io_key in ("typical_input", "typical_output"):
            items = eng.get(io_key) or []
            if not items:
                node_issues.append(f"engineering.{io_key} empty")
            else:
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    desc = str(item.get("description", ""))
                    fmt = str(item.get("format", ""))
                    if NA_PATTERNS.search(desc) or (fmt and NA_PATTERNS.search(fmt)):
                        stats["na_io"] += 1
                        node_issues.append(f"{io_key} uses N/A placeholder")
                        break

        examples = data.get("examples") or []
        kinds = {ex.get("kind") for ex in examples if isinstance(ex, dict) and ex.get("kind")}
        missing_kinds = EXAMPLE_KINDS - kinds
        if missing_kinds:
            stats["example_kind_gaps"] += 1
            node_issues.append(f"missing example kinds: {sorted(missing_kinds)}")

        sources = data.get("sources") or []
        if not sources:
            stats["missing_sources"] += 1
            node_issues.append("sources empty")
        else:
            weak = 0
            for source in sources:
                if not isinstance(source, dict):
                    continue
                url = str(source.get("url", ""))
                source_type = str(source.get("source_type", ""))
                if not url or url.startswith("pending") or source_type == "pending":
                    weak += 1
            if weak == len(sources):
                node_issues.append("sources all weak/pending")

        if node_issues:
            stats["nodes_with_issues"] += 1
            for issue in node_issues:
                category = issue.split(":")[0].split(" ")[0]
                stats["issues_by_category"][category] = stats["issues_by_category"].get(category, 0) + 1
            all_issues.append({"path": rel, "issues": node_issues[:8], "count": len(node_issues)})
        else:
            stats["nodes_pass_basic"] += 1

    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", "ontology"],
            capture_output=True,
            text=True,
            cwd=ROOT.parent,
            check=False,
        )
        stats["git_modified_node_yaml"] = len(
            [line for line in result.stdout.splitlines() if "node.yaml" in line]
        )
    except Exception:  # noqa: BLE001
        stats["git_modified_node_yaml"] = None

    output = {
        "plane_counts": plane_counts,
        "stats": stats,
        "yaml_error_samples": stats["yaml_errors"][:10],
        "top_issue_nodes": sorted(all_issues, key=lambda item: -item["count"])[:20],
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
