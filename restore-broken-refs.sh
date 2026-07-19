#!/bin/bash
cd /d/moonweave-ai/moonweave-ai-agent-schema

FILES=(
    "ontology/memory-plane/memory-ingestion/IngestionActivity/IngestionRun/node.yaml"
    "ontology/memory-plane/memory-lifecycle/MemoryOperation/MemoryOperationResult/node.yaml"
    "ontology/orchestration-plane/orchestration-evaluation/ImprovementActivity/ImprovementAttempt/RevisionAttempt/node.yaml"
    "ontology/orchestration-plane/orchestration-evaluation/ImprovementActivity/ImprovementCoordinationActivity/FeedbackRouting/node.yaml"
    "ontology/orchestration-plane/orchestration-evaluation/ImprovementActivity/ImprovementLoop/node.yaml"
    "ontology/orchestration-plane/orchestration-evaluation/ImprovementControlSpecification/ReviewAssignment/node.yaml"
    "ontology/safety-plane/safety-permission-policy/AuthorizationEvent/AuthorizationRevocation/node.yaml"
    "ontology/tool-plane/tool-mcp-transport/MCPSession/MCPMessage/MCPNotification/MCPResourceUpdatedNotification/node.yaml"
    "ontology/tool-plane/tool-mcp-transport/MCPSession/MCPParticipant/MCPClient/node.yaml"
)

for f in "${FILES[@]}"; do
    if git show "ffbc6ec:$f" > /dev/null 2>&1; then
        git show "ffbc6ec:$f" > "$f"
        echo "Restored: $f"
    else
        echo "NOT IN ORIG: $f"
    fi
done
