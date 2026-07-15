#!/usr/bin/env python3
"""Verify the locked Python visualization dependency, license, and OSV status."""

from __future__ import annotations

from importlib.metadata import distribution
import json
from pathlib import Path
import re
from typing import Any, Callable
from urllib.request import Request, urlopen as open_url


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
POLICY_PATH = REPOSITORY_ROOT / "scripts/data/python-dependency-policy.json"
REQUIREMENTS_PATH = REPOSITORY_ROOT / "requirements-graph-visualization.txt"
OSV_QUERY_URL = "https://api.osv.dev/v1/query"


def _canonical_package_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def _logical_requirement_lines(requirements_text: str) -> list[str]:
    logical_lines: list[str] = []
    current = ""
    for raw_line in requirements_text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.endswith("\\"):
            current = f"{current}{line[:-1].strip()} "
            continue
        logical_lines.append(f"{current}{line}".strip())
        current = ""
    if current:
        logical_lines.append(current.strip())
    return logical_lines


def _strict_locked_requirements(
    requirements_text: str,
) -> tuple[dict[str, tuple[str, str]], list[str]]:
    locks: dict[str, tuple[str, str]] = {}
    errors: list[str] = []
    pattern = re.compile(
        r"^([a-z0-9_.-]+)==([^\s]+)\s+--hash=sha256:([a-f0-9]{64})$",
        re.IGNORECASE,
    )
    for line in _logical_requirement_lines(requirements_text):
        match = pattern.fullmatch(line)
        if not match:
            errors.append(f"unsupported or unhashed requirement line: {line}")
            continue
        name = _canonical_package_name(match.group(1))
        if name in locks:
            errors.append(f"duplicate requirement lock: {name}")
            continue
        locks[name] = (match.group(2), match.group(3))
    return locks, errors


def _osv_vulnerability_ids(
    name: str,
    version: str,
    urlopen: Callable[..., Any],
) -> list[str]:
    body = json.dumps({
        "package": {"ecosystem": "PyPI", "name": name},
        "version": version,
    }).encode("utf-8")
    request = Request(
        OSV_QUERY_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "moonweave-agent-ontology-dependency-audit/1",
        },
        method="POST",
    )
    with urlopen(request, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return sorted({str(item.get("id", "unknown")) for item in payload.get("vulns") or []})


def verify_python_dependency_policy(
    *,
    policy: dict[str, Any],
    requirements_text: str,
    distribution_for: Callable[[str], Any] = distribution,
    urlopen: Callable[..., Any] = open_url,
) -> dict[str, int]:
    errors: list[str] = []
    vulnerability_count = 0
    dependencies = policy.get("reviewed_dependencies", [])
    if policy.get("schema_version") != 1 or not isinstance(dependencies, list) or not dependencies:
        raise RuntimeError("Python dependency policy requires schema_version 1 and a non-empty dependency list")

    locks, lock_errors = _strict_locked_requirements(requirements_text)
    errors.extend(lock_errors)
    locked_names = set(locks)
    reviewed_names = {
        _canonical_package_name(str(dependency.get("name", "")))
        for dependency in dependencies
    }
    if locked_names != reviewed_names:
        errors.append(
            "reviewed dependency names do not exactly match the requirements lock "
            f"({sorted(reviewed_names)} != {sorted(locked_names)})",
        )

    for dependency in dependencies:
        distribution_name = str(dependency.get("name", ""))
        name = _canonical_package_name(distribution_name)
        expected_version = str(dependency.get("version", ""))
        expected_hash = str(dependency.get("sha256", ""))
        expected_license = str(dependency.get("license_expression", ""))
        lock = locks.get(name)
        if lock is None or lock[0] != expected_version:
            errors.append(f"{name} version lock does not match {expected_version}")
        if lock is None or lock[1] != expected_hash:
            errors.append(f"{name} wheel hash does not match reviewed policy")

        installed = distribution_for(distribution_name)
        if installed.version != expected_version:
            errors.append(f"{name} installed version is {installed.version}, expected {expected_version}")
        installed_license = installed.metadata.get("License-Expression")
        if installed_license != expected_license:
            errors.append(
                f"{name} license is {installed_license or 'missing'}, expected {expected_license}",
            )

        vulnerability_ids = _osv_vulnerability_ids(name, expected_version, urlopen)
        vulnerability_count += len(vulnerability_ids)
        if vulnerability_ids:
            errors.append(f"{name} has known vulnerabilities: {', '.join(vulnerability_ids)}")

    if errors:
        raise RuntimeError(f"Python dependency policy failed: {'; '.join(errors)}")
    return {
        "dependency_count": len(dependencies),
        "vulnerability_count": vulnerability_count,
    }


def main() -> None:
    result = verify_python_dependency_policy(
        policy=json.loads(POLICY_PATH.read_text(encoding="utf-8")),
        requirements_text=REQUIREMENTS_PATH.read_text(encoding="utf-8"),
    )
    print(
        "Python dependency policy passed: "
        f"{result['dependency_count']} reviewed dependency, "
        f"{result['vulnerability_count']} known vulnerabilities.",
    )


if __name__ == "__main__":
    main()
