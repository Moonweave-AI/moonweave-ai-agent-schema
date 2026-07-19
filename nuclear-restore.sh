#!/bin/bash
set -e
cd /d/moonweave-ai/moonweave-ai-agent-schema

echo "=== Phase 1: Save user's intentional feedback-plane changes ==="

# Save new feedback-plane files
SAVE_DIR="/tmp/feedback-save"
rm -rf "$SAVE_DIR"
mkdir -p "$SAVE_DIR"

NEW_FILES=(
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationMetric/EvaluationCostMetric/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationMetric/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/Score/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/Verdict/node.yaml"
    "ontology/feedback-plane/feedback-optimization-learning/LearningSignal/PreferenceExample/node.yaml"
    "ontology/feedback-plane/feedback-optimization-learning/RewardModelScore/node.yaml"
    "ontology/feedback-plane/feedback-review-optimization/Feedback/HumanFeedback/node.yaml"
)

for f in "${NEW_FILES[@]}"; do
    if [ -f "$f" ]; then
        dir=$(dirname "$SAVE_DIR/$f")
        mkdir -p "$dir"
        cp "$f" "$SAVE_DIR/$f"
        echo "Saved new: $f"
    fi
done

# Save modified feedback-plane files
MODIFIED_FILES=(
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationRun/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationSpecification/EvaluationCriterion/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationSpecification/EvaluationScenario/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationSpecification/Rubric/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationSpecification/node.yaml"
    "ontology/feedback-plane/feedback-metrics-evaluation/node.yaml"
    "ontology/feedback-plane/feedback-optimization-learning/ChangeProposal/node.yaml"
    "ontology/feedback-plane/feedback-optimization-learning/LearningSignal/node.yaml"
    "ontology/feedback-plane/feedback-optimization-learning/node.yaml"
    "ontology/feedback-plane/feedback-review-optimization/Feedback/node.yaml"
    "ontology/feedback-plane/feedback-review-optimization/RevisionArtifact/node.yaml"
    "ontology/feedback-plane/feedback-review-optimization/node.yaml"
)

for f in "${MODIFIED_FILES[@]}"; do
    if [ -f "$f" ]; then
        dir=$(dirname "$SAVE_DIR/$f")
        mkdir -p "$dir"
        cp "$f" "$SAVE_DIR/$f"
        echo "Saved modified: $f"
    fi
done

# Record deleted files (we need to re-delete them after restore)
echo ""
echo "=== Phase 2: Restore entire ontology from ffbc6ec ==="
git checkout ffbc6ec -- ontology/
echo "Restored ontology/ from ffbc6ec"

echo ""
echo "=== Phase 3: Re-apply feedback-plane changes ==="

# Restore new files
for f in "${NEW_FILES[@]}"; do
    src="$SAVE_DIR/$f"
    if [ -f "$src" ]; then
        dir=$(dirname "$f")
        mkdir -p "$dir"
        cp "$src" "$f"
        echo "Restored new: $f"
    fi
done

# Restore modified files
for f in "${MODIFIED_FILES[@]}"; do
    src="$SAVE_DIR/$f"
    if [ -f "$src" ]; then
        cp "$src" "$f"
        echo "Restored modified: $f"
    fi
done

echo ""
echo "=== Phase 4: Re-delete intentionally removed files ==="

# These were deleted by the user's feedback-plane restructuring
DELETED_DIRS=(
    "ontology/adapter-plane"
    "ontology/feedback-plane/feedback-logging"
    "ontology/feedback-plane/feedback-metrics-evaluation/EvaluationSpecification/EvaluationCriterion/SuccessCriterion"
    "ontology/feedback-plane/feedback-metrics-evaluation/Measurement"
    "ontology/feedback-plane/feedback-metrics-evaluation/Metric"
    "ontology/feedback-plane/feedback-optimization-learning/ChangeProposal/ParameterChangeProposal"
    "ontology/feedback-plane/feedback-optimization-learning/ChangeProposal/PolicyChangeProposal"
    "ontology/feedback-plane/feedback-optimization-learning/ChangeProposal/PromptChangeProposal"
    "ontology/feedback-plane/feedback-optimization-learning/LearningSignal/FeedbackLearningSignal"
    "ontology/feedback-plane/feedback-optimization-learning/LearningSignal/PreferenceLearningSignal"
    "ontology/feedback-plane/feedback-optimization-learning/LearningSignal/RewardLearningSignal"
    "ontology/feedback-plane/feedback-optimization-learning/OptimizationLoop"
    "ontology/feedback-plane/feedback-optimization-learning/OptimizationTarget"
    "ontology/feedback-plane/feedback-review-optimization/CorrectionActivity"
    "ontology/feedback-plane/feedback-review-optimization/Feedback/ReviewDerivedFeedback"
    "ontology/feedback-plane/feedback-review-optimization/FeedbackEvent"
    "ontology/feedback-plane/feedback-review-optimization/RecoveryPlan"
    "ontology/feedback-plane/feedback-review-optimization/Review"
    "ontology/feedback-plane/feedback-review-optimization/ReviewActivity"
    "ontology/feedback-plane/feedback-review-optimization/ReviewEvidenceArtifact"
    "ontology/feedback-plane/feedback-review-optimization/RevisionPlan"
    "ontology/feedback-plane/feedback-warning-error"
)

for d in "${DELETED_DIRS[@]}"; do
    if [ -d "$d" ]; then
        rm -rf "$d"
        echo "Re-deleted: $d"
    fi
done

echo ""
echo "=== Done ==="
echo "Total files in ontology:"
find ontology -name 'node.yaml' | wc -l
