#!/usr/bin/env python3
"""Final ontology quality scan — read-only structural and governance audit."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

try:
    import yaml
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyyaml", "-q"])
    import yaml

ROOT = Path(__file__).resolve().parents[1]
ONTOLOGY = ROOT / "ontology"
LOCALES = ("zh", "en", "ja")
EXAMPLE_KINDS = {"positive", "counterexample", "boundary", "instance"}
LEGACY_TOP_KEYS = {
    "review_status",
    "review",
    "reviewers",
    "axioms",
    "axiom_validation",
    "axioms_and_validation",
    "adaptation_mapping",
    "adaptation_mappings",
    "external_mappings",
    "maturity",
    "maturity_changes",
    "change_history",
    "change_log",
    "purpose",
}
PLACEHOLDER_RE = re.compile(r"^(?:\?+|\uff1f+|\ufffd+)$", re.I)
NA_RE = re.compile(r"not applicable|不适用|不適用", re.I)
SUSPICIOUS_URL_RE = re.compile(
    r"pending|example\.com|placeholder|localhost|127\.0\.0\.1|todo|TBD",
    re.I,
)


def rel_path(fp: Path) -> str:
    return fp.relative_to(ROOT).as_posix()


def plane_of(rel: str) -> str:
    parts = rel.split("/")
    if len(parts) >= 2 and parts[0] == "ontology":
        name = parts[1]
        return name.replace("-plane", "") if name.endswith("-plane") else name
    return "unknown"


def is_nonempty(value) -> bool:
    return isinstance(value, str) and value.strip() != ""


def localized_issues(value, location: str) -> list[str]:
    issues: list[str] = []
    if not isinstance(value, dict):
        return [f"{location}: missing or not a localized object"]
    for locale in LOCALES:
        text = value.get(locale)
        if not is_nonempty(text):
            issues.append(f"{location}.{locale}: missing or empty")
        elif PLACEHOLDER_RE.match(str(text).strip()):
            issues.append(f"{location}.{locale}: placeholder value")
    return issues


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


def url_issues(url: str, location: str) -> list[str]:
    issues: list[str] = []
    if not is_nonempty(url):
        issues.append(f"{location}: missing url")
        return issues
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https"):
        issues.append(f"{location}: url scheme not http(s)")
    if not parsed.netloc:
        issues.append(f"{location}: url missing host")
    if SUSPICIOUS_URL_RE.search(url):
        issues.append(f"{location}: suspicious url pattern")
    return issues


def collect_embedded_claim_refs(obj, refs: list) -> None:
    if isinstance(obj, dict):
        claims = obj.get("source_claims")
        if isinstance(claims, list):
            for claim in claims:
                if isinstance(claim, str):
                    refs.append(claim)
                elif isinstance(claim, dict):
                    refs.append(claim.get("id") or claim.get("claim_id"))
        for value in obj.values():
            collect_embedded_claim_refs(value, refs)
    elif isinstance(obj, list):
        for item in obj:
            collect_embedded_claim_refs(item, refs)


def scan_node(fp: Path) -> dict:
    rel = rel_path(fp)
    result = {
        "path": rel,
        "plane": plane_of(rel),
        "issues": [],
        "legacy": [],
        "yaml_error": None,
    }

    try:
        with open(fp, encoding="utf-8") as handle:
            data = yaml.safe_load(handle)
    except Exception as exc:  # noqa: BLE001
        result["yaml_error"] = str(exc)[:300]
        result["issues"].append(f"YAML parse error: {result['yaml_error']}")
        return result

    if not isinstance(data, dict):
        result["issues"].append("document is not a mapping")
        return result

    for key in LEGACY_TOP_KEYS:
        if key in data:
            result["legacy"].append(key)
            result["issues"].append(f"legacy top-level key: {key}")

    sem = data.get("semantics")
    if not isinstance(sem, dict):
        result["issues"].append("semantics: missing or not an object")
        sem = {}

    for field in ("short_definition", "definition", "why_needed"):
        result["issues"].extend(localized_issues(sem.get(field), f"semantics.{field}"))

    for locale in LOCALES:
        sd = sem.get("short_definition", {}) if isinstance(sem.get("short_definition"), dict) else {}
        df = sem.get("definition", {}) if isinstance(sem.get("definition"), dict) else {}
        sd_text = str(sd.get(locale, "")).strip()
        df_text = str(df.get(locale, "")).strip()
        if sd_text and df_text and sd_text == df_text:
            result["issues"].append(f"semantics.short_definition.{locale} identical to definition")
        elif sd_text and df_text and similar(sd_text, df_text):
            result["issues"].append(f"semantics.short_definition.{locale} too similar to definition")

    for key in ("includes", "excludes"):
        entries = sem.get(key)
        if not isinstance(entries, list) or len(entries) == 0:
            result["issues"].append(f"semantics.{key}: missing or empty")
        else:
            for index, entry in enumerate(entries):
                result["issues"].extend(
                    localized_issues(entry, f"semantics.{key}[{index}]")
                )

    eng = data.get("engineering")
    if not isinstance(eng, dict):
        result["issues"].append("engineering: missing or not an object")
        eng = {}
    else:
        result["issues"].extend(localized_issues(eng.get("explanation"), "engineering.explanation"))
        for locale in LOCALES:
            expl = eng.get("explanation", {}) if isinstance(eng.get("explanation"), dict) else {}
            df = sem.get("definition", {}) if isinstance(sem.get("definition"), dict) else {}
            expl_text = str(expl.get(locale, "")).strip()
            df_text = str(df.get(locale, "")).strip()
            if expl_text and df_text and (expl_text == df_text or similar(expl_text, df_text)):
                result["issues"].append(
                    f"engineering.explanation.{locale} repeats definition"
                )
        for io_key in ("typical_input", "typical_output"):
            items = eng.get(io_key)
            if not isinstance(items, list) or len(items) == 0:
                result["issues"].append(f"engineering.{io_key}: missing or empty")
            elif any(
                isinstance(item, dict)
                and (
                    NA_RE.search(str(item.get("description", "")))
                    or NA_RE.search(str(item.get("format", "")))
                )
                for item in items
            ):
                result["issues"].append(f"engineering.{io_key}: not-applicable placeholder")

    examples = data.get("examples")
    if not isinstance(examples, list) or len(examples) == 0:
        result["issues"].append("examples: missing or empty")
    else:
        kinds = {
            ex.get("kind")
            for ex in examples
            if isinstance(ex, dict) and ex.get("kind")
        }
        missing = sorted(EXAMPLE_KINDS - kinds)
        if missing:
            result["issues"].append(f"examples: missing kinds {missing}")

    sources = data.get("sources")
    source_ids: set[str] = set()
    if not isinstance(sources, list) or len(sources) == 0:
        result["issues"].append("sources: missing or empty")
    else:
        for index, source in enumerate(sources):
            loc = f"sources[{index}]"
            if not isinstance(source, dict):
                result["issues"].append(f"{loc}: not an object")
                continue
            sid = source.get("id")
            if not is_nonempty(sid):
                result["issues"].append(f"{loc}.id: missing")
            elif sid in source_ids:
                result["issues"].append(f"{loc}.id: duplicate {sid}")
            else:
                source_ids.add(str(sid))
            for req in ("title", "source_type", "relevance"):
                if not is_nonempty(source.get(req)):
                    result["issues"].append(f"{loc}.{req}: missing")
            result["issues"].extend(url_issues(str(source.get("url", "")), f"{loc}.url"))

    claims = data.get("source_claims")
    claim_ids: set[str] = set()
    if not isinstance(claims, list) or len(claims) == 0:
        result["issues"].append("source_claims: missing or empty")
    else:
        for index, claim in enumerate(claims):
            loc = f"source_claims[{index}]"
            if not isinstance(claim, dict):
                result["issues"].append(f"{loc}: not an object")
                continue
            cid = claim.get("id")
            if not is_nonempty(cid):
                result["issues"].append(f"{loc}.id: missing")
            elif cid in claim_ids:
                result["issues"].append(f"{loc}.id: duplicate {cid}")
            else:
                claim_ids.add(str(cid))
            src = claim.get("source") or claim.get("source_id")
            if not is_nonempty(src):
                result["issues"].append(f"{loc}.source: missing")
            elif src not in source_ids:
                result["issues"].append(f"{loc}.source: unknown source id {src}")
            for req in ("supports", "locator", "evidence_kind", "confidence"):
                if not is_nonempty(claim.get(req)):
                    result["issues"].append(f"{loc}.{req}: missing")

    embedded_refs: list = []
    collect_embedded_claim_refs(data, embedded_refs)
    for ref in embedded_refs:
        if ref and ref not in claim_ids:
            result["issues"].append(f"embedded source_claims references unknown claim id {ref}")

    return result


def main() -> int:
    files = sorted(ONTOLOGY.rglob("node.yaml"))
    results = [scan_node(fp) for fp in files]

    plane_totals: Counter[str] = Counter()
    plane_pass: Counter[str] = Counter()
    plane_fail: Counter[str] = Counter()
    legacy_counter: Counter[str] = Counter()
    issue_category: Counter[str] = Counter()
    failing_nodes: list[dict] = []

    yaml_errors = 0
    status_accepted = 0
    release_blocks = 0
    purpose_count = 0

    for fp in files:
        try:
            with open(fp, encoding="utf-8") as handle:
                data = yaml.safe_load(handle)
            if isinstance(data, dict):
                if data.get("status") == "accepted":
                    status_accepted += 1
                if isinstance(data.get("release"), dict):
                    release_blocks += 1
        except Exception:  # noqa: BLE001
            pass

    for item in results:
        plane = item["plane"]
        plane_totals[plane] += 1
        if item["yaml_error"]:
            yaml_errors += 1
        for key in item["legacy"]:
            legacy_counter[key] += 1
            if key == "purpose":
                purpose_count += 1
        if item["issues"]:
            plane_fail[plane] += 1
            failing_nodes.append(item)
            for issue in item["issues"]:
                category = issue.split(":")[0].split(".")[0]
                issue_category[category] += 1
        else:
            plane_pass[plane] += 1

    total = len(results)
    passed = total - len(failing_nodes)
    compliance = round(100.0 * passed / total, 2) if total else 0.0

    report = {
        "scan_date": "2026-07-19",
        "total_nodes": total,
        "passed": passed,
        "failed": len(failing_nodes),
        "compliance_rate_pct": compliance,
        "yaml_errors": yaml_errors,
        "legacy_top_level": dict(legacy_counter),
        "legacy_total_occurrences": sum(legacy_counter.values()),
        "status_accepted": status_accepted,
        "release_blocks": release_blocks,
        "purpose_field_count": purpose_count,
        "plane_summary": {},
        "issue_category_counts": dict(issue_category.most_common(30)),
        "failing_nodes": failing_nodes,
    }

    for plane in sorted(plane_totals):
        report["plane_summary"][plane] = {
            "total": plane_totals[plane],
            "passed": plane_pass[plane],
            "failed": plane_fail[plane],
            "compliance_pct": round(
                100.0 * plane_pass[plane] / plane_totals[plane], 2
            )
            if plane_totals[plane]
            else 0.0,
        }

    out_path = ROOT / "docs" / ".final-quality-scan.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
