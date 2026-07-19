#!/bin/bash
cd /d/moonweave-ai/moonweave-ai-agent-schema

FILES=(
    "ontology/info-plane/info-container-command/node.yaml"
    "ontology/info-plane/info-content-block-modality/node.yaml"
    "ontology/info-plane/info-indexing/node.yaml"
    "ontology/info-plane/info-messages-instructions/node.yaml"
    "ontology/info-plane/info-output-disclosure/node.yaml"
    "ontology/info-plane/info-prompts-instructions/node.yaml"
    "ontology/info-plane/info-storage-sources/node.yaml"
    "ontology/memory-plane/memory-context/node.yaml"
    "ontology/memory-plane/memory-ingestion/node.yaml"
    "ontology/memory-plane/memory-lifecycle/node.yaml"
    "ontology/runtime-plane/runtime-artifacts/node.yaml"
    "ontology/runtime-plane/runtime-execution-attempts/node.yaml"
    "ontology/runtime-plane/runtime-observability/node.yaml"
    "ontology/runtime-plane/runtime-system/node.yaml"
    "ontology/safety-plane/safety-commit-redaction/node.yaml"
    "ontology/safety-plane/safety-disclosure-redaction/node.yaml"
    "ontology/safety-plane/safety-injection-defense/node.yaml"
    "ontology/safety-plane/safety-network-control/node.yaml"
    "ontology/safety-plane/safety-permission-policy/node.yaml"
    "ontology/safety-plane/safety-sandbox-network/node.yaml"
    "ontology/safety-plane/safety-trust-boundary/node.yaml"
    "ontology/tool-plane/tool-invocation-execution/node.yaml"
)

RESTORED=0
for f in "${FILES[@]}"; do
    git show "ffbc6ec:$f" > "$f"
    echo "Restored: $f"
    RESTORED=$((RESTORED + 1))
done

echo ""
echo "Restored $RESTORED files fully from ffbc6ec"
