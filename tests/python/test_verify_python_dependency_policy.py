import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import Mock


SCRIPT_PATH = Path(__file__).resolve().parents[2] / "scripts" / "verify-python-dependency-policy.py"
SPEC = importlib.util.spec_from_file_location("python_dependency_policy", SCRIPT_PATH)
assert SPEC and SPEC.loader
policy_verifier = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(policy_verifier)


class PythonDependencyPolicyTests(unittest.TestCase):
    def test_accepts_exact_hash_version_license_and_empty_osv_result(self):
        policy = {
            "schema_version": 1,
            "reviewed_dependencies": [{
                "name": "networkx",
                "version": "3.6.1",
                "sha256": "a" * 64,
                "license_expression": "BSD-3-Clause",
            }],
        }
        distribution = Mock(version="3.6.1")
        distribution.metadata = {"License-Expression": "BSD-3-Clause"}
        requirements = f"networkx==3.6.1 \\\n    --hash=sha256:{'a' * 64}\n"
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        response.read.return_value = json.dumps({"vulns": []}).encode()

        result = policy_verifier.verify_python_dependency_policy(
            policy=policy,
            requirements_text=requirements,
            distribution_for=lambda _name: distribution,
            urlopen=lambda *_args, **_kwargs: response,
        )

        self.assertEqual(result, {"dependency_count": 1, "vulnerability_count": 0})

    def test_rejects_lock_license_and_known_vulnerability_drift(self):
        policy = {
            "schema_version": 1,
            "reviewed_dependencies": [{
                "name": "networkx",
                "version": "3.6.1",
                "sha256": "a" * 64,
                "license_expression": "BSD-3-Clause",
            }],
        }
        distribution = Mock(version="3.6.0")
        distribution.metadata = {"License-Expression": "MIT"}
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        response.read.return_value = json.dumps({
            "vulns": [{"id": "PYSEC-2099-1"}],
        }).encode()

        with self.assertRaisesRegex(RuntimeError, "version lock.*wheel hash.*installed version.*license.*PYSEC-2099-1"):
            policy_verifier.verify_python_dependency_policy(
                policy=policy,
                requirements_text="networkx==9.9.9 --hash=sha256:bbbb\n",
                distribution_for=lambda _name: distribution,
                urlopen=lambda *_args, **_kwargs: response,
            )

    def test_repository_wires_python_policy_into_security_and_ci(self):
        repository = SCRIPT_PATH.parents[1]
        package_json = json.loads((repository / "package.json").read_text(encoding="utf-8"))
        workflow = (repository / ".github/workflows/ontology-validation.yml").read_text(
            encoding="utf-8",
        )
        policy = json.loads(
            (repository / "scripts/data/python-dependency-policy.json").read_text(
                encoding="utf-8",
            ),
        )

        self.assertIn("npm run dependency:python", package_json["scripts"]["dependency:security"])
        self.assertIn("run: npm run dependency:python", workflow)
        self.assertEqual(policy["reviewed_dependencies"][0]["license_expression"], "BSD-3-Clause")

    def test_rejects_unreviewed_requirement_entries(self):
        policy = {
            "schema_version": 1,
            "reviewed_dependencies": [{
                "name": "networkx",
                "version": "3.6.1",
                "sha256": "a" * 64,
                "license_expression": "BSD-3-Clause",
            }],
        }
        distribution = Mock(version="3.6.1")
        distribution.metadata = {"License-Expression": "BSD-3-Clause"}
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        response.read.return_value = b"{}"

        with self.assertRaisesRegex(RuntimeError, "unsupported or unhashed requirement line"):
            policy_verifier.verify_python_dependency_policy(
                policy=policy,
                requirements_text=(
                    f"networkx==3.6.1 --hash=sha256:{'a' * 64}\n"
                    f"unreviewed[extra]==1.0 --hash=sha256:{'b' * 64}\n"
                    f"direct @ https://packages.example/direct.whl --hash=sha256:{'c' * 64}\n"
                ),
                distribution_for=lambda _name: distribution,
                urlopen=lambda *_args, **_kwargs: response,
            )


if __name__ == "__main__":
    unittest.main()
