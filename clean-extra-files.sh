#!/bin/bash
cd /d/moonweave-ai/moonweave-ai-agent-schema

# Find all node.yaml files in ontology/
# If the file doesn't exist at ffbc6ec AND isn't in the saved feedback-plane list, delete it

KEEP_NEW=(
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationMetric/EvaluationCostMetric/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationMetric/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/Score/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/Verdict/node.yaml"
    "ontology/feedback-plane/feedback-optimization-learning/LearningSignal/PreferenceExample/node.yaml"
    "ontology/feedback-plane/feedback-optimization-learning/RewardModelScore/node.yaml"
    "ontology/feedback-plane/feedback-review-optimization/Feedback/HumanFeedback/node.yaml"
)

DELETED=0
KEPT=0

while IFS= read -r f; do
    # Check if file exists at ffbc6ec
    if git show "ffbc6ec:$f" > /dev/null 2>&1; then
        KEPT=$((KEPT + 1))
        continue
    fi
    
    # Check if it's in our keep list
    keep=false
    for k in "${KEEP_NEW[@]}"; do
        if [ "$f" = "$k" ]; then
            keep=true
            break
        fi
    done
    
    if [ "$keep" = "true" ]; then
        KEPT=$((KEPT + 1))
        echo "KEEP (intentional): $f"
        continue
    fi
    
    # Delete the file
    rm "$f"
    echo "DELETED: $f"
    DELETED=$((DELETED + 1))
    
    # Clean up empty parent directories
    dir=$(dirname "$f")
    while [ "$dir" != "ontology" ] && [ -d "$dir" ] && [ -z "$(ls -A "$dir" 2>/dev/null)" ]; do
        rmdir "$dir"
        echo "  Removed empty dir: $dir"
        dir=$(dirname "$dir")
    done
done < <(find ontology -name 'node.yaml' -type f)

echo ""
echo "Deleted: $DELETED files"
echo "Kept: $KEPT files"
echo "Remaining files:"
find ontology -name 'node.yaml' | wc -l
