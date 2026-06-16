#!/usr/bin/env python3
"""Generate ontology YAML files for subgraphs 06, 07, 08."""
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent / "ontology"


def dump(data: dict) -> str:
    return yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False, width=120)


def write(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dump(data), encoding="utf-8")


def node(nid, label, label_zh, desc, layer, plane, attrs, interfaces=None, sm=None, edges_out=None, edges_in=None):
    d = {
        "id": f"node.{nid}",
        "artifact": "NodeClass",
        "label": label,
        "label_zh": label_zh,
        "layer": layer,
        "plane": plane,
        "description": desc.strip() + "\n",
        "attributes": attrs,
        "status": "active",
    }
    if interfaces:
        d["interfaces"] = [{"ref": f"contract.{i}"} for i in interfaces]
    if sm:
        d["state_machine"] = {"ref": f"state.{sm}"}
    if edges_out or edges_in:
        d["required_edges"] = {}
        if edges_out:
            d["required_edges"]["outgoing"] = edges_out
        if edges_in:
            d["required_edges"]["incoming"] = edges_in
    return d


def edge(eid, pred, src, tgt, desc, card="1:N"):
    return {
        "id": f"edge.{eid}",
        "artifact": "EdgeClass",
        "predicate": pred,
        "source_domain": src if isinstance(src, list) else src,
        "target_range": tgt if isinstance(tgt, list) else tgt,
        "cardinality": card,
        "description": desc.strip() + "\n",
        "status": "active",
    }


def contract(cid, label, label_zh, desc, ops):
    return {
        "id": f"contract.{cid}",
        "artifact": "InterfaceContract",
        "label": label,
        "label_zh": label_zh,
        "description": desc.strip() + "\n",
        "operations": ops,
        "status": "active",
    }


def state(sid, label, label_zh, desc, states, transitions):
    return {
        "id": f"state.{sid}",
        "artifact": "StateMachine",
        "label": label,
        "label_zh": label_zh,
        "description": desc.strip() + "\n",
        "states": states,
        "transitions": transitions,
        "status": "active",
    }


def constraint(cid, label, label_zh, rule, desc, severity="error", nodes=None, edges=None):
    d = {
        "id": f"constraint.{cid}",
        "artifact": "GraphConstraint",
        "label": label,
        "label_zh": label_zh,
        "severity": severity,
        "rule": rule.strip() + "\n",
        "description": desc.strip() + "\n",
        "status": "active",
    }
    if nodes or edges:
        d["applies_to"] = {}
        if nodes:
            d["applies_to"]["nodes"] = [f"node.{n}" if not n.startswith("node.") else n for n in nodes]
        if edges:
            d["applies_to"]["edges"] = [f"edge.{e}" if not e.startswith("edge.") else e for e in edges]
    return d


# --- helpers for common attribute shapes ---
def str_attr(desc, required=True):
    return {"type": "string", "required": required, "description": desc}


def bool_attr(desc, required=False):
    return {"type": "boolean", "required": required, "description": desc}


def enum_attr(values, desc, required=True):
    return {"type": "enum", "required": required, "values": values, "description": desc}


def int_attr(desc, required=False):
    return {"type": "integer", "required": required, "description": desc}


def obj_attr(desc, required=False):
    return {"type": "object", "required": required, "description": desc}


def gen_06():
    base = ROOT / "06-orchestration-graph"
    L, P = "orchestration", "OrchestrationPlane"

    nodes = {
        "workflow": node(
            "workflow", "Workflow", "工作流",
            "A directed graph of processing steps that defines how a multi-step agent task "
            "is executed from initiation through completion, including dependencies, gates, and aggregation points.",
            L, P,
            {
                "name": str_attr("Human-readable identifier for the workflow definition."),
                "version": str_attr("Semantic version or revision tag of the workflow schema."),
                "entry_node_id": str_attr("Identifier of the first step executed when the workflow starts."),
                "max_parallelism": int_attr("Upper bound on concurrently active branches within this workflow."),
            },
            interfaces=["orchestrable"],
            sm="workflow_lifecycle",
            edges_out=[{"predicate": "CHAINS_TO", "target": "node.workflow_node"}],
        ),
        "workflow_node": node(
            "workflow_node", "Workflow Node", "工作流节点",
            "A single processing step within a workflow graph. Each node encapsulates one unit of "
            "work—such as generation, transformation, evaluation, or delegation—and declares its inputs, outputs, and successor edges.",
            L, P,
            {
                "step_id": str_attr("Unique identifier of this step within the parent workflow."),
                "step_type": enum_attr(["generate", "transform", "evaluate", "delegate", "aggregate", "gate"], "Category of processing performed at this step."),
                "timeout_seconds": int_attr("Maximum wall-clock duration permitted for this step before failure."),
                "retryable": bool_attr("Whether this step may be retried on transient failure."),
            },
            interfaces=["orchestrable"],
        ),
        "workflow_edge": node(
            "workflow_edge", "Workflow Edge", "工作流边",
            "A directed transition or dependency between two workflow nodes specifying execution order, "
            "data flow, or conditional activation preconditions.",
            L, P,
            {
                "from_step_id": str_attr("Source step identifier in the parent workflow."),
                "to_step_id": str_attr("Target step identifier in the parent workflow."),
                "condition": obj_attr("Optional predicate expression that must evaluate true for traversal."),
                "data_mapping": obj_attr("Field-level mapping from source outputs to target inputs."),
            },
        ),
        "gate": node(
            "gate", "Gate", "门控",
            "A conditional checkpoint between workflow steps that permits, blocks, or reroutes execution "
            "based on predicates, policy outcomes, or quality thresholds.",
            L, P,
            {
                "gate_type": enum_attr(["predicate", "policy", "quality", "human"], "Mechanism used to evaluate whether traversal is allowed."),
                "predicate": obj_attr("Expression or rule set evaluated at the gate."),
                "on_fail_action": enum_attr(["block", "reroute", "escalate"], "Behavior when the gate condition is not satisfied."),
            },
            edges_in=[{"predicate": "GATES", "source": "node.workflow_node"}],
        ),
        "prompt_chain": node(
            "prompt_chain", "Prompt Chain", "提示链",
            "A fixed sequential pipeline of language-model calls where each stage consumes the prior "
            "stage output as context, enabling deterministic multi-step reasoning without dynamic routing.",
            L, P,
            {
                "stage_count": int_attr("Number of sequential model invocation stages in the chain."),
                "stage_definitions": obj_attr("Ordered list of stage prompts, schemas, and output contracts."),
                "carry_forward_fields": obj_attr("Fields propagated unchanged across all stages."),
            },
            interfaces=["orchestrable"],
            edges_out=[{"predicate": "CHAINS_TO", "target_any_of": ["node.prompt_chain", "node.workflow_node"]}],
        ),
        "router": node(
            "router", "Router", "路由器",
            "An input classifier that inspects task state or user intent and dispatches work to one or "
            "more specialist handlers, tools, or sub-workflows via discrete routes.",
            L, P,
            {
                "classification_schema": obj_attr("Output schema defining route labels and confidence scores."),
                "default_route_id": str_attr("Fallback route when classification confidence is below threshold."),
                "confidence_threshold": obj_attr("Minimum score required to select a non-default route."),
            },
            interfaces=["orchestrable"],
            edges_out=[{"predicate": "ROUTES_TO", "target": "node.route"}],
        ),
        "route": node(
            "route", "Route", "路由分支",
            "One branch option emitted by a router, binding a classification label to a downstream "
            "handler, workflow fragment, or specialist agent.",
            L, P,
            {
                "route_id": str_attr("Unique label for this branch within the parent router."),
                "match_criteria": obj_attr("Classification labels or patterns that activate this route."),
                "target_ref": str_attr("Reference to the downstream handler, workflow, or agent."),
            },
            edges_in=[{"predicate": "ROUTES_TO", "source": "node.router"}],
        ),
        "parallelization": node(
            "parallelization", "Parallelization", "并行化",
            "Concurrent execution of independent branches with a defined join strategy for aggregating "
            "partial results into a unified outcome.",
            L, P,
            {
                "join_strategy": enum_attr(["merge", "vote", "first_success", "all_complete"], "How branch outputs are combined at join time."),
                "max_concurrency": int_attr("Maximum number of branches executing simultaneously."),
                "branch_timeout_seconds": int_attr("Wall-clock limit applied per branch before join proceeds."),
            },
            interfaces=["orchestrable"],
            edges_out=[
                {"predicate": "FORKS_TO", "target_any_of": ["node.sectioning", "node.voting", "node.worker"]},
                {"predicate": "JOINS_FROM", "source_any_of": ["node.sectioning", "node.voting", "node.worker"]},
            ],
        ),
        "sectioning": node(
            "sectioning", "Sectioning", "分片",
            "A parallelization pattern that splits a task or input into independent non-overlapping "
            "subtasks processed concurrently and merged at completion.",
            L, P,
            {
                "partition_strategy": enum_attr(["by_field", "by_chunk", "by_topic", "custom"], "Method used to divide input into sections."),
                "section_count": int_attr("Target or actual number of sections produced."),
                "overlap_allowed": bool_attr("Whether sections may share overlapping content."),
            },
            edges_in=[{"predicate": "FORKS_TO", "source": "node.parallelization"}],
            edges_out=[{"predicate": "JOINS_FROM", "target": "node.parallelization"}],
        ),
        "voting": node(
            "voting", "Voting", "投票",
            "A parallelization pattern that runs the same task multiple times with varied parameters "
            "or sampling, then selects or synthesizes the best outcome via vote or consensus.",
            L, P,
            {
                "candidate_count": int_attr("Number of parallel attempts executed."),
                "selection_method": enum_attr(["majority", "ranked_choice", "quality_score", "consensus"], "Rule for choosing the winning output."),
                "diversity_factor": obj_attr("Parameters controlling variation across attempts."),
            },
            edges_in=[{"predicate": "FORKS_TO", "source": "node.parallelization"}],
            edges_out=[
                {"predicate": "VOTES_ON", "target": "node.evaluator"},
                {"predicate": "JOINS_FROM", "target": "node.parallelization"},
            ],
        ),
        "orchestrator": node(
            "orchestrator", "Orchestrator", "编排器",
            "A dynamic task decomposer and coordinator that breaks high-level goals into subtasks, "
            "assigns them to workers or tools, monitors progress, and aggregates results.",
            L, P,
            {
                "decomposition_strategy": enum_attr(["sequential", "hierarchical", "opportunistic"], "Approach for breaking goals into subtasks."),
                "aggregation_strategy": enum_attr(["concatenate", "summarize", "synthesize", "select_best"], "How subtask results are combined."),
                "max_delegation_depth": int_attr("Maximum nesting depth for subagent delegation chains."),
            },
            interfaces=["orchestrable", "delegable"],
            edges_out=[
                {"predicate": "DELEGATES_TO", "target_any_of": ["node.worker", "node.subagent"]},
                {"predicate": "COORDINATES", "target": "node.group_conversation"},
            ],
        ),
        "worker": node(
            "worker", "Worker", "工作者",
            "A specialist agent or executor that performs a single delegated subtask within bounded "
            "scope and returns structured results to the orchestrator.",
            L, P,
            {
                "specialization": str_attr("Domain or capability focus of this worker."),
                "capability_refs": obj_attr("List of tool or skill references available to this worker."),
                "reporting_format": obj_attr("Schema for structured subtask completion reports."),
            },
            interfaces=["delegable"],
            edges_in=[{"predicate": "DELEGATES_TO", "source_any_of": ["node.orchestrator", "node.task_distribution"]}],
        ),
        "subagent": node(
            "subagent", "Subagent", "子智能体",
            "A spawned agent instance with delegated context, scoped goal, and bounded tool access, "
            "operating semi-autonomously under a delegation contract.",
            L, P,
            {
                "scope_goal": str_attr("The delegated objective assigned to this subagent."),
                "context_boundary": obj_attr("Fields and memory regions accessible to the subagent."),
                "parent_ref": str_attr("Reference to the delegating orchestrator or parent agent."),
            },
            interfaces=["delegable"],
            edges_in=[{"predicate": "DELEGATES_TO", "source_any_of": ["node.orchestrator", "node.task_distribution"]}],
        ),
        "task_distribution": node(
            "task_distribution", "Task Distribution", "任务分配",
            "The operation of assigning decomposed subtasks to available workers or subagents according "
            "to a load-balancing, affinity, or capability-matching policy.",
            L, P,
            {
                "distribution_policy": enum_attr(["round_robin", "capability_match", "load_balanced", "priority"], "Rule for mapping subtasks to executors."),
                "pending_queue": obj_attr("Ordered queue of subtasks awaiting assignment."),
                "assignment_records": obj_attr("Audit trail of subtask-to-worker mappings."),
            },
            edges_out=[{"predicate": "DELEGATES_TO", "target_any_of": ["node.worker", "node.subagent"]}],
        ),
        "delegation_contract": node(
            "delegation_contract", "Delegation Contract", "委派契约",
            "Formal terms governing what a delegate may read, write, invoke, and return, including "
            "permission scope, time limits, and escalation conditions.",
            L, P,
            {
                "allowed_actions": obj_attr("Explicit set of permitted operation types for the delegate."),
                "denied_actions": obj_attr("Explicit set of forbidden operation types."),
                "time_limit_seconds": int_attr("Maximum duration of the delegation before automatic revocation."),
                "escalation_on_violation": bool_attr("Whether policy violations trigger escalation to the delegator."),
            },
        ),
        "handoff": node(
            "handoff", "Handoff", "交接",
            "Transfer of control, context, and partial results from one agent or workflow step to another, "
            "preserving continuity while resetting execution scope as needed.",
            L, P,
            {
                "handoff_type": enum_attr(["sequential", "escalation", "specialist_referral"], "Semantic category of the transfer."),
                "context_payload": obj_attr("Serialized context and state passed to the receiving party."),
                "acknowledgment_required": bool_attr("Whether the receiver must confirm acceptance before proceeding."),
            },
            edges_out=[{"predicate": "HANDOFFS_TO", "target_any_of": ["node.worker", "node.subagent", "node.orchestrator"]}],
        ),
        "evaluator": node(
            "evaluator", "Evaluator", "评估器",
            "A quality and correctness assessor that scores, validates, or rejects outputs against "
            "criteria, rubrics, or reference answers without modifying the original artifact.",
            L, P,
            {
                "evaluation_criteria": obj_attr("Rubric, schema, or test cases used for assessment."),
                "scoring_method": enum_attr(["binary", "numeric", "rubric", "test_suite"], "How evaluation results are quantified."),
                "pass_threshold": obj_attr("Minimum score or condition required for acceptance."),
            },
            edges_out=[
                {"predicate": "REVIEWS", "target_any_of": ["node.workflow_node", "node.worker"]},
                {"predicate": "OPTIMIZES", "target": "node.optimizer"},
            ],
        ),
        "optimizer": node(
            "optimizer", "Optimizer", "优化器",
            "An iterative improver that revises generated outputs based on evaluator feedback until "
            "quality thresholds are met or iteration budget is exhausted.",
            L, P,
            {
                "max_iterations": int_attr("Maximum revision cycles before forced termination."),
                "improvement_strategy": enum_attr(["rewrite", "patch", "regenerate", "guided_edit"], "Approach for applying feedback to outputs."),
                "convergence_threshold": obj_attr("Score delta below which iteration stops."),
            },
            edges_in=[{"predicate": "OPTIMIZES", "source": "node.evaluator"}],
        ),
        "review": node(
            "review", "Review", "审查",
            "An explicit human or language-model assessment step that critiques, verifies, or approves "
            "intermediate results before they propagate downstream.",
            L, P,
            {
                "reviewer_type": enum_attr(["human", "model", "hybrid"], "Entity performing the review."),
                "review_scope": enum_attr(["full", "safety", "quality", "factual"], "Aspect of output under examination."),
                "approval_required": bool_attr("Whether downstream steps are blocked until approval."),
            },
            edges_out=[{"predicate": "REVIEWS", "target_any_of": ["node.workflow_node", "node.worker"]}],
        ),
        "feedback": node(
            "feedback", "Feedback", "反馈",
            "A signal from an evaluator, reviewer, or human operator back to a generator or orchestrator, "
            "carrying scores, critiques, or continuation directives.",
            L, P,
            {
                "feedback_type": enum_attr(["score", "critique", "correction", "continuation"], "Semantic category of the feedback payload."),
                "target_ref": str_attr("Reference to the component that should consume this feedback."),
                "actionable": bool_attr("Whether the feedback includes specific revision instructions."),
            },
        ),
        "group_conversation": node(
            "group_conversation", "Group Conversation", "群组对话",
            "Multi-agent dialogue coordination where multiple participants exchange messages under "
            "turn-taking, broadcast, or moderated discussion rules.",
            L, P,
            {
                "participant_refs": obj_attr("List of agent or human participant identifiers."),
                "turn_policy": enum_attr(["round_robin", "moderated", "free_form", "role_based"], "Rule governing speaking order."),
                "max_turns": int_attr("Maximum dialogue turns before forced termination or summarization."),
            },
            edges_in=[{"predicate": "COORDINATES", "source": "node.orchestrator"}],
        ),
        "blackboard": node(
            "blackboard", "Blackboard", "黑板",
            "Shared mutable state accessible to multiple agents for posting hypotheses, partial results, "
            "and coordination signals without direct pairwise messaging.",
            L, P,
            {
                "entry_schema": obj_attr("Schema for records posted to the blackboard."),
                "access_control": obj_attr("Read/write permissions per participant role."),
                "retention_policy": obj_attr("Rules for entry expiration and archival."),
            },
            edges_in=[{"predicate": "SHARES_STATE_VIA", "source_any_of": ["node.orchestrator", "node.group_conversation"]}],
        ),
        "consensus_policy": node(
            "consensus_policy", "Consensus Policy", "共识策略",
            "Rules defining how multiple agents reach agreement on outputs, decisions, or shared state "
            "updates, including quorum, voting weights, and tie-breaking.",
            L, P,
            {
                "quorum_fraction": obj_attr("Minimum participant fraction required for a valid decision."),
                "decision_rule": enum_attr(["unanimous", "majority", "weighted", "moderator_final"], "Mechanism for resolving disagreements."),
                "timeout_action": enum_attr(["fail", "moderator_decides", "partial_accept"], "Behavior when consensus is not reached in time."),
            },
        ),
        "think_as_tool": node(
            "think_as_tool", "Think As Tool", "思考即工具",
            "Extended internal reasoning exposed as an invocable tool, enabling staged deliberation "
            "separate from action tools and observable in the execution trace.",
            L, P,
            {
                "reasoning_budget_tokens": int_attr("Maximum tokens allocated per think invocation."),
                "output_schema": obj_attr("Structured schema for reasoning conclusions returned to caller."),
                "visible_in_transcript": bool_attr("Whether reasoning output appears in the public transcript."),
            },
        ),
    }

    edges = {
        "ROUTES_TO": edge("ROUTES_TO", "ROUTES_TO", "node.router", "node.route",
            "Connects a router to one of its classification branches, binding a match label to a downstream target."),
        "GATES": edge("GATES", "GATES", "node.gate", ["node.workflow_node", "node.workflow_edge"],
            "A gate controls traversal between workflow steps, evaluating conditions before permitting progression.", "N:M"),
        "CHAINS_TO": edge("CHAINS_TO", "CHAINS_TO", ["node.prompt_chain", "node.workflow", "node.workflow_node"],
            ["node.prompt_chain", "node.workflow_node"],
            "Sequential composition linking one processing step directly to its successor in a fixed pipeline."),
        "FORKS_TO": edge("FORKS_TO", "FORKS_TO", "node.parallelization", ["node.sectioning", "node.voting", "node.worker"],
            "Initiates concurrent branch execution from a parallelization coordinator to independent subtasks."),
        "JOINS_FROM": edge("JOINS_FROM", "JOINS_FROM", ["node.sectioning", "node.voting", "node.worker"], "node.parallelization",
            "Aggregates completed branch results back into the parallelization join point.", "N:1"),
        "DELEGATES_TO": edge("DELEGATES_TO", "DELEGATES_TO",
            ["node.orchestrator", "node.task_distribution"], ["node.worker", "node.subagent"],
            "Assigns a subtask and scoped authority from a coordinator to a worker or subagent."),
        "HANDOFFS_TO": edge("HANDOFFS_TO", "HANDOFFS_TO", "node.handoff",
            ["node.worker", "node.subagent", "node.orchestrator"],
            "Transfers control and context payload from one agent role to another."),
        "REVIEWS": edge("REVIEWS", "REVIEWS", ["node.evaluator", "node.review"],
            ["node.workflow_node", "node.worker", "node.subagent"],
            "An assessment relationship where an evaluator or reviewer examines an artifact or output."),
        "OPTIMIZES": edge("OPTIMIZES", "OPTIMIZES", "node.evaluator", "node.optimizer",
            "Links evaluator output to an optimizer that iteratively improves the assessed artifact.", "1:1"),
        "VOTES_ON": edge("VOTES_ON", "VOTES_ON", "node.voting", ["node.evaluator", "node.consensus_policy"],
            "A voting pattern selects among candidate outputs using evaluator scores or consensus rules."),
        "COORDINATES": edge("COORDINATES", "COORDINATES", "node.orchestrator", ["node.group_conversation", "node.parallelization"],
            "An orchestrator manages multi-agent or multi-branch coordination structures."),
        "SHARES_STATE_VIA": edge("SHARES_STATE_VIA", "SHARES_STATE_VIA",
            ["node.orchestrator", "node.group_conversation"], "node.blackboard",
            "Participants publish and read shared coordination state through a blackboard."),
    }

    contracts = {
        "orchestrable": contract("orchestrable", "Orchestrable", "可编排",
            "Capability indicating an artifact can be placed as a step within a workflow graph and participate in orchestration edges.",
            [
                {"name": "bind_to_workflow", "description": "Attach this artifact as a node in a parent workflow.",
                 "input": {"workflow_ref": "string", "step_id": "string"}, "output": {"binding_id": "string"}},
                {"name": "get_status", "description": "Return current execution status of this orchestrated step.",
                 "input": {}, "output": {"status": "string", "metadata": "object"}, "errors": ["not_bound", "not_started"]},
            ]),
        "delegable": contract("delegable", "Delegable", "可委派",
            "Capability indicating an entity can accept delegated subtasks under a delegation contract with bounded scope.",
            [
                {"name": "accept_delegation", "description": "Accept a subtask with attached delegation contract terms.",
                 "input": {"task": "object", "contract_ref": "string"}, "output": {"delegation_id": "string"},
                 "errors": ["scope_violation", "capacity_exceeded", "contract_missing"]},
                {"name": "report_completion", "description": "Return structured results and status upon subtask completion.",
                 "input": {"delegation_id": "string", "result": "object"}, "output": {"acknowledged": "boolean"}},
            ]),
    }

    states = {
        "workflow_lifecycle": state("workflow_lifecycle", "Workflow Lifecycle", "工作流生命周期",
            "Lifecycle states for a workflow definition from initial authoring through terminal completion or failure.",
            [
                {"name": "defined", "initial": True, "description": "Workflow schema authored but not yet validated."},
                {"name": "validated", "description": "Structural and semantic validation passed; ready to execute."},
                {"name": "running", "description": "At least one step is actively executing."},
                {"name": "paused", "description": "Execution suspended; may resume from last checkpoint."},
                {"name": "completed", "terminal": True, "description": "All terminal steps finished successfully."},
                {"name": "failed", "terminal": True, "description": "Execution halted due to unrecoverable error."},
            ],
            [
                {"from": "defined", "to": "validated", "trigger": "validate", "description": "Schema validation succeeds."},
                {"from": "validated", "to": "running", "trigger": "start", "description": "Workflow execution begins."},
                {"from": "running", "to": "paused", "trigger": "pause", "description": "Operator or policy pauses execution."},
                {"from": "paused", "to": "running", "trigger": "resume", "description": "Execution resumes from pause point."},
                {"from": "running", "to": "completed", "trigger": "finish", "guard": "all_steps_succeeded"},
                {"from": "running", "to": "failed", "trigger": "fail", "description": "Unrecoverable step failure."},
                {"from": "paused", "to": "failed", "trigger": "fail"},
            ]),
        "delegation_lifecycle": state("delegation_lifecycle", "Delegation Lifecycle", "委派生命周期",
            "Lifecycle states tracking a delegated subtask from proposal through completion or rejection.",
            [
                {"name": "proposed", "initial": True, "description": "Delegation terms and subtask offered to delegate."},
                {"name": "accepted", "description": "Delegate acknowledged and bound to the delegation contract."},
                {"name": "executing", "description": "Delegate actively performing the subtask."},
                {"name": "reporting", "description": "Delegate submitting completion report to delegator."},
                {"name": "completed", "terminal": True, "description": "Delegator accepted the reported result."},
                {"name": "rejected", "terminal": True, "description": "Delegate declined or delegator revoked the task."},
            ],
            [
                {"from": "proposed", "to": "accepted", "trigger": "accept"},
                {"from": "proposed", "to": "rejected", "trigger": "reject"},
                {"from": "accepted", "to": "executing", "trigger": "begin_execution"},
                {"from": "executing", "to": "reporting", "trigger": "submit_report"},
                {"from": "reporting", "to": "completed", "trigger": "acknowledge"},
                {"from": "reporting", "to": "executing", "trigger": "request_revision"},
                {"from": "accepted", "to": "rejected", "trigger": "revoke"},
                {"from": "executing", "to": "rejected", "trigger": "revoke"},
            ]),
    }

    constraints = {
        "subagent_must_have_delegation_contract": constraint(
            "subagent_must_have_delegation_contract", "Subagent Must Have Delegation Contract", "子智能体必须有委派契约",
            "Every node.subagent instance MUST reference or be connected via DELEGATES_TO to a node.delegation_contract "
            "that defines permitted scope before execution begins.",
            "Subagents operate with bounded authority; execution without an explicit delegation contract violates least-privilege orchestration.",
            nodes=["subagent"],
        ),
        "evaluator_must_be_separable": constraint(
            "evaluator_must_be_separable", "Evaluator Must Be Separable", "评估器必须可分离",
            "Every node.evaluator MUST NOT modify the artifact it assesses; it may only emit feedback, scores, or pass/fail signals. "
            "Revision MUST occur only via a distinct node.optimizer or generator node.",
            "Separation of assessment from generation prevents evaluation bias and enables auditable quality loops.",
            nodes=["evaluator"],
        ),
    }

    for name, data in nodes.items():
        write(base / "nodes" / f"{name}.yaml", data)
    edge_files_06 = {
        "ROUTES_TO": "routes_to", "GATES": "gates", "CHAINS_TO": "chains_to",
        "FORKS_TO": "forks_to", "JOINS_FROM": "joins_from", "DELEGATES_TO": "delegates_to",
        "HANDOFFS_TO": "handoffs_to", "REVIEWS": "reviews", "OPTIMIZES": "optimizes",
        "VOTES_ON": "votes_on", "COORDINATES": "coordinates", "SHARES_STATE_VIA": "shares_state_via",
    }
    for ename, data in edges.items():
        write(base / "edges" / f"{edge_files_06[ename]}.yaml", data)
    for name, data in contracts.items():
        write(base / "contracts" / f"{name}.yaml", data)
    for name, data in states.items():
        write(base / "states" / f"{name}.yaml", data)
    for name, data in constraints.items():
        write(base / "constraints" / f"{name}.yaml", data)


def gen_07():
    base = ROOT / "07-runtime-harness-graph"
    L, P = "runtime", "RuntimePlane"

    nodes = {
        "execution_harness": node(
            "execution_harness", "Execution Harness", "执行框架",
            "Top-level runtime container that hosts agent sessions, manages lifecycle policies, "
            "and provides the infrastructure for runs, tracing, and recovery.",
            L, P,
            {"harness_id": str_attr("Unique identifier of this runtime installation."),
             "supported_features": obj_attr("Capability flags for checkpointing, streaming, sandboxing."),
             "default_policies": obj_attr("Default timeout, retry, and budget policy references.")},
            interfaces=["executable"],
            edges_out=[{"predicate": "STARTS", "target": "node.session"}],
        ),
        "session": node(
            "session", "Session", "会话",
            "Persistent conversational context spanning multiple goal-directed runs, retaining identity, "
            "preferences, and cross-run state distinct from the ephemeral context window.",
            L, P,
            {"session_id": str_attr("Stable identifier for this conversational session."),
             "created_at": str_attr("ISO-8601 timestamp of session creation."),
             "participant_refs": obj_attr("Human and agent identities associated with the session.")},
            sm="session_lifecycle",
            edges_in=[{"predicate": "STARTS", "source": "node.execution_harness"}],
            edges_out=[{"predicate": "STARTS", "target": "node.run"}],
        ),
        "run": node(
            "run", "Run", "运行",
            "A single goal-directed execution within a session, bounded by budgets and policies, "
            "producing a transcript and trace from initialization through completion or cancellation.",
            L, P,
            {"run_id": str_attr("Unique identifier for this execution attempt."),
             "goal": str_attr("Natural-language or structured objective driving this run."),
             "parent_session_id": str_attr("Session that owns this run.")},
            interfaces=["executable", "checkpointable", "budgetable"],
            sm="run_lifecycle",
            edges_out=[
                {"predicate": "ADVANCES_TO", "target": "node.turn"},
                {"predicate": "APPENDS_TRANSCRIPT", "target": "node.transcript"},
                {"predicate": "TRACES", "target": "node.trace"},
            ],
        ),
        "turn": node(
            "turn", "Turn", "轮次",
            "One request-response cycle within a run, comprising user or system input, agent reasoning, "
            "tool invocations, and the resulting assistant output.",
            L, P,
            {"turn_index": int_attr("Zero-based ordinal of this turn within the parent run."),
             "input_tokens": int_attr("Token count of input context for this turn."),
             "output_tokens": int_attr("Token count of generated output for this turn.")},
            edges_in=[{"predicate": "ADVANCES_TO", "source": "node.run"}],
            edges_out=[{"predicate": "EMITS_EVENT", "target": "node.event"}],
        ),
        "event": node(
            "event", "Event", "事件",
            "A discrete occurrence in the execution timeline such as tool invocation, policy decision, "
            "checkpoint, error, or state transition.",
            L, P,
            {"event_type": enum_attr(["tool_call", "policy", "checkpoint", "error", "state_change", "message"], "Category of occurrence."),
             "timestamp": str_attr("ISO-8601 timestamp of the event."),
             "payload": obj_attr("Structured event-specific data."),
             "causal_parent_id": str_attr("Optional reference to the triggering event.")},
            edges_in=[{"predicate": "EMITS_EVENT", "source_any_of": ["node.turn", "node.run", "node.executor"]}],
        ),
        "transcript": node(
            "transcript", "Transcript", "转录",
            "An ordered record of all turns and messages comprising the session narrative; "
            "distinct from durable memory and subject to compaction policies.",
            L, P,
            {"message_count": int_attr("Total messages recorded in the transcript."),
             "compaction_policy_ref": str_attr("Reference to rules governing transcript truncation."),
             "format_version": str_attr("Schema version of transcript entries.")},
            edges_in=[{"predicate": "APPENDS_TRANSCRIPT", "source": "node.run"}],
        ),
        "trace": node(
            "trace", "Trace", "追踪",
            "Structured execution log capturing timing, causality, and span hierarchy for debugging, "
            "observability, and performance analysis.",
            L, P,
            {"trace_id": str_attr("Unique identifier for this execution trace."),
             "span_count": int_attr("Number of spans in the trace tree."),
             "sampling_rate": obj_attr("Fraction of operations captured when sampling is enabled.")},
            edges_in=[{"predicate": "TRACES", "source": "node.run"}],
        ),
        "checkpoint": node(
            "checkpoint", "Checkpoint", "检查点",
            "Serialized state snapshot enabling resumption of execution after pause, interrupt, or failure.",
            L, P,
            {"checkpoint_id": str_attr("Unique identifier for this snapshot."),
             "state_blob_ref": str_attr("Storage reference to serialized state payload."),
             "created_at": str_attr("ISO-8601 timestamp when snapshot was taken.")},
            interfaces=["checkpointable"],
            edges_out=[{"predicate": "CHECKPOINTS", "target": "node.state_store"}],
        ),
        "state_store": node(
            "state_store", "State Store", "状态存储",
            "Persistent backend for checkpoint data, continuation tokens, and resumable execution artifacts.",
            L, P,
            {"store_type": enum_attr(["local", "remote", "embedded"], "Persistence backend category."),
             "retention_days": int_attr("Default retention period for stored snapshots."),
             "encryption_enabled": bool_attr("Whether stored payloads are encrypted at rest.")},
            edges_in=[{"predicate": "CHECKPOINTS", "source": "node.checkpoint"}],
            edges_out=[{"predicate": "RESTORES_FROM", "target": "node.continuation"}],
        ),
        "continuation": node(
            "continuation", "Continuation", "续跑点",
            "A resumable execution point referencing a checkpoint from which a paused or interrupted run may proceed.",
            L, P,
            {"continuation_token": str_attr("Opaque token identifying the resume point."),
             "source_checkpoint_id": str_attr("Checkpoint from which continuation derives."),
             "expires_at": str_attr("Optional expiration after which continuation is invalid.")},
            edges_in=[{"predicate": "RESTORES_FROM", "source": "node.state_store"}],
        ),
        "context_reset": node(
            "context_reset", "Context Reset", "上下文重置",
            "Controlled flush of the ephemeral context window while preserving durable session state, "
            "checkpoints, and external memory references.",
            L, P,
            {"reset_scope": enum_attr(["full", "tool_results", "system_only"], "Portion of context cleared."),
             "preserve_refs": obj_attr("Memory and checkpoint references retained after reset."),
             "trigger_reason": str_attr("Human-readable reason for the reset operation.")},
            edges_out=[{"predicate": "RESETS_CONTEXT_WITH", "target": "node.continuation"}],
        ),
        "handoff_artifact": node(
            "handoff_artifact", "Handoff Artifact", "交接制品",
            "Serialized context and state package prepared for inter-agent transfer across execution boundaries.",
            L, P,
            {"artifact_id": str_attr("Unique identifier for this handoff package."),
             "payload_schema_version": str_attr("Version of the serialization schema."),
             "source_run_id": str_attr("Run that produced this handoff artifact.")},
        ),
        "executor": node(
            "executor", "Executor", "执行器",
            "Runtime component responsible for running actions, commands, and tool invocations within "
            "a configured sandbox and policy envelope.",
            L, P,
            {"executor_type": enum_attr(["inline", "subprocess", "remote"], "Execution dispatch model."),
             "max_concurrent_actions": int_attr("Upper bound on parallel action executions.")},
            interfaces=["executable"],
            edges_out=[
                {"predicate": "EXECUTES_IN", "target": "node.sandbox"},
                {"predicate": "EMITS_EVENT", "target": "node.event"},
            ],
        ),
        "sandbox": node(
            "sandbox", "Sandbox", "沙箱",
            "Isolated execution environment enforcing resource limits, network policy, and filesystem "
            "boundaries for untrusted agent-generated actions.",
            L, P,
            {"isolation_level": enum_attr(["process", "container", "vm"], "Strength of isolation boundary."),
             "resource_limits": obj_attr("CPU, memory, and storage caps enforced in this sandbox.")},
            interfaces=["executable"],
            sm="sandbox_lifecycle",
            edges_in=[{"predicate": "EXECUTES_IN", "source": "node.executor"}],
            edges_out=[{"predicate": "EXECUTES_IN", "target": "node.container"}],
        ),
        "container": node(
            "container", "Container", "容器",
            "OS-level process isolation boundary providing namespace separation, cgroup limits, "
            "and lifecycle management for sandboxed workloads.",
            L, P,
            {"container_id": str_attr("Runtime identifier of the isolated environment."),
             "image_ref": str_attr("Reference to the base environment image or filesystem snapshot.")},
            edges_in=[{"predicate": "EXECUTES_IN", "source": "node.sandbox"}],
            edges_out=[{"predicate": "EXECUTES_IN", "target": "node.process"}],
        ),
        "process": node(
            "process", "Process", "进程",
            "A running OS process within a container executing commands on behalf of the agent.",
            L, P,
            {"pid": int_attr("Operating-system process identifier."),
             "exit_code": int_attr("Process exit code when terminated."),
             "started_at": str_attr("ISO-8601 timestamp of process start.")},
            edges_in=[{"predicate": "EXECUTES_IN", "source": "node.container"}],
            edges_out=[{"predicate": "EXECUTES_IN", "target": "node.command"}],
        ),
        "command": node(
            "command", "Command", "命令",
            "A shell command or executable invocation dispatched to a process within the sandbox.",
            L, P,
            {"command_line": str_attr("Full command string or argv array."),
             "working_directory": str_attr("Directory from which the command executes."),
             "environment": obj_attr("Environment variables supplied to the process.")},
            edges_in=[{"predicate": "EXECUTES_IN", "source": "node.process"}],
            edges_out=[
                {"predicate": "STREAMS_TO", "target": "node.stdout_stream"},
                {"predicate": "STREAMS_TO", "target": "node.stderr_stream"},
            ],
        ),
        "stdout_stream": node(
            "stdout_stream", "Stdout Stream", "标准输出流",
            "Standard output data stream capturing process-produced text or binary output for agent consumption.",
            L, P,
            {"encoding": str_attr("Character encoding of the stream."),
             "byte_count": int_attr("Total bytes captured from stdout."),
             "truncated": bool_attr("Whether output was truncated due to size limits.")},
            edges_in=[{"predicate": "STREAMS_TO", "source": "node.command"}],
        ),
        "stderr_stream": node(
            "stderr_stream", "Stderr Stream", "标准错误流",
            "Standard error data stream capturing diagnostic and error output from sandboxed processes.",
            L, P,
            {"encoding": str_attr("Character encoding of the stream."),
             "byte_count": int_attr("Total bytes captured from stderr."),
             "truncated": bool_attr("Whether output was truncated due to size limits.")},
            edges_in=[{"predicate": "STREAMS_TO", "source": "node.command"}],
        ),
        "timeout_policy": node(
            "timeout_policy", "Timeout Policy", "超时策略",
            "Rules defining maximum wall-clock duration for operations, turns, runs, or sandbox commands "
            "before automatic cancellation or escalation.",
            L, P,
            {"default_timeout_seconds": int_attr("Default timeout applied when none specified."),
             "per_operation_overrides": obj_attr("Operation-type-specific timeout values."),
             "on_timeout_action": enum_attr(["cancel", "escalate", "checkpoint_and_pause"], "Behavior when timeout elapses.")},
        ),
        "retry_policy": node(
            "retry_policy", "Retry Policy", "重试策略",
            "Rules governing automatic retry of failed operations including backoff, jitter, "
            "maximum attempts, and retriable error classification.",
            L, P,
            {"max_attempts": int_attr("Maximum retry attempts including the initial try."),
             "backoff_strategy": enum_attr(["fixed", "exponential", "linear"], "Delay growth between retries."),
             "retriable_errors": obj_attr("Error codes or categories eligible for retry.")},
            edges_out=[{"predicate": "RETRIES_BY", "target_any_of": ["node.run", "node.command"]}],
        ),
        "cancellation": node(
            "cancellation", "Cancellation", "取消",
            "Mechanism for stopping in-progress execution cooperatively or forcibly, propagating "
            "termination signals through runs, turns, and sandbox processes.",
            L, P,
            {"cancellation_type": enum_attr(["cooperative", "forced"], "Grace level of the stop request."),
             "propagation_scope": enum_attr(["turn", "run", "session"], "Breadth of cancellation propagation."),
             "reason": str_attr("Human-readable reason for cancellation.")},
            edges_out=[{"predicate": "CANCELS_BY", "target_any_of": ["node.run", "node.process"]}],
        ),
        "recovery_policy": node(
            "recovery_policy", "Recovery Policy", "恢复策略",
            "Strategy for recovering from failures including checkpoint restore, partial replay, "
            "idempotent retry, or graceful degradation.",
            L, P,
            {"recovery_strategy": enum_attr(["checkpoint_restore", "replay", "retry", "degrade"], "Primary recovery approach."),
             "max_recovery_attempts": int_attr("Maximum recovery cycles before terminal failure."),
             "fallback_action": str_attr("Action taken when recovery is exhausted.")},
            edges_out=[{"predicate": "RECOVERS_FROM", "target_any_of": ["node.run", "node.checkpoint"]}],
        ),
        "resource_budget": node(
            "resource_budget", "Resource Budget", "资源预算",
            "Limits on compute, memory, storage, and concurrent operations allocatable per run or session.",
            L, P,
            {"cpu_limit": obj_attr("Maximum CPU cores or time-share fraction."),
             "memory_limit_mb": int_attr("Maximum resident memory in megabytes."),
             "storage_limit_mb": int_attr("Maximum ephemeral storage in megabytes.")},
            interfaces=["budgetable"],
        ),
        "token_budget": node(
            "token_budget", "Token Budget", "令牌预算",
            "Maximum token consumption for language-model calls within a run, turn, or session, "
            "enforcing cost and latency guardrails.",
            L, P,
            {"max_input_tokens": int_attr("Maximum input tokens per scope."),
             "max_output_tokens": int_attr("Maximum output tokens per scope."),
             "max_total_tokens": int_attr("Combined input plus output cap.")},
            interfaces=["budgetable"],
        ),
        "cost_budget": node(
            "cost_budget", "Cost Budget", "成本预算",
            "Maximum monetary cost allocatable per run or session across model inference, "
            "tool usage, and external API calls.",
            L, P,
            {"max_cost_units": obj_attr("Maximum spend in configured currency or credit units."),
             "currency": str_attr("Currency or credit denomination."),
             "alert_threshold_fraction": obj_attr("Fraction of budget at which warnings are emitted.")},
            interfaces=["budgetable"],
        ),
    }

    edges = {
        "STARTS": edge("STARTS", "STARTS", ["node.execution_harness", "node.session"], ["node.session", "node.run"],
            "Initiates a child lifecycle entity from a parent runtime container.", "1:N"),
        "ADVANCES_TO": edge("ADVANCES_TO", "ADVANCES_TO", "node.run", "node.turn",
            "Progresses a run to its next request-response turn."),
        "EMITS_EVENT": edge("EMITS_EVENT", "EMITS_EVENT", ["node.turn", "node.run", "node.executor"], "node.event",
            "Records a discrete timeline occurrence during execution."),
        "APPENDS_TRANSCRIPT": edge("APPENDS_TRANSCRIPT", "APPENDS_TRANSCRIPT", "node.run", "node.transcript",
            "Appends turn messages and tool results to the session transcript.", "1:1"),
        "TRACES": edge("TRACES", "TRACES", "node.run", "node.trace",
            "Associates structured observability spans with a run.", "1:1"),
        "CHECKPOINTS": edge("CHECKPOINTS", "CHECKPOINTS", ["node.run", "node.checkpoint"], "node.state_store",
            "Persists a state snapshot to durable storage."),
        "RESTORES_FROM": edge("RESTORES_FROM", "RESTORES_FROM", "node.state_store", "node.continuation",
            "Rehydrates a resumable continuation point from stored checkpoint data."),
        "RESETS_CONTEXT_WITH": edge("RESETS_CONTEXT_WITH", "RESETS_CONTEXT_WITH", "node.context_reset", "node.continuation",
            "Flushes ephemeral context while anchoring preserved state to a continuation reference."),
        "EXECUTES_IN": edge("EXECUTES_IN", "EXECUTES_IN",
            ["node.executor", "node.sandbox", "node.container", "node.process"], ["node.sandbox", "node.container", "node.process", "node.command"],
            "Nested execution containment from harness through sandbox to command.", "1:1"),
        "STREAMS_TO": edge("STREAMS_TO", "STREAMS_TO", "node.command", ["node.stdout_stream", "node.stderr_stream"],
            "Captures process output streams for agent consumption."),
        "RETRIES_BY": edge("RETRIES_BY", "RETRIES_BY", "node.retry_policy", ["node.run", "node.command"],
            "Applies retry rules to a failed operation or execution."),
        "CANCELS_BY": edge("CANCELS_BY", "CANCELS_BY", "node.cancellation", ["node.run", "node.process"],
            "Terminates in-progress execution via cancellation mechanism."),
        "RECOVERS_FROM": edge("RECOVERS_FROM", "RECOVERS_FROM", "node.recovery_policy", ["node.run", "node.checkpoint"],
            "Applies recovery strategy after failure using checkpoint or replay."),
        "BOUNDED_BY_BUDGET": edge("BOUNDED_BY_BUDGET", "BOUNDED_BY_BUDGET",
            ["node.run", "node.session"], ["node.resource_budget", "node.token_budget", "node.cost_budget"],
            "Enforces resource, token, or cost limits on a run or session.", "N:M"),
    }

    contracts = {
        "executable": contract("executable", "Executable", "可执行",
            "Capability indicating an entity can dispatch and run actions within a runtime harness environment.",
            [
                {"name": "execute", "description": "Dispatch an action for execution within the runtime.",
                 "input": {"action": "object", "context": "object"}, "output": {"result": "object", "events": "array"},
                 "errors": ["policy_denied", "timeout", "sandbox_unavailable"]},
                {"name": "get_execution_status", "description": "Return status of an in-flight or completed execution.",
                 "input": {"execution_id": "string"}, "output": {"status": "string"}},
            ]),
        "checkpointable": contract("checkpointable", "Checkpointable", "可检查点",
            "Capability indicating an entity can serialize its state for later restoration.",
            [
                {"name": "checkpoint", "description": "Capture current state as a restorable snapshot.",
                 "input": {"label": "string"}, "output": {"checkpoint_id": "string"}},
                {"name": "restore", "description": "Restore state from a previously captured checkpoint.",
                 "input": {"checkpoint_id": "string"}, "output": {"restored": "boolean"},
                 "errors": ["checkpoint_not_found", "schema_mismatch"]},
            ]),
        "budgetable": contract("budgetable", "Budgetable", "可预算",
            "Capability indicating an entity is subject to resource, token, or cost budget enforcement.",
            [
                {"name": "consume_budget", "description": "Debit units from an attached budget.",
                 "input": {"amount": "object", "category": "string"}, "output": {"remaining": "object"},
                 "errors": ["budget_exceeded"]},
                {"name": "get_budget_status", "description": "Return current budget utilization.",
                 "input": {}, "output": {"used": "object", "limit": "object"}},
            ]),
    }

    states = {
        "session_lifecycle": state("session_lifecycle", "Session Lifecycle", "会话生命周期",
            "Lifecycle states for a persistent conversational session.",
            [
                {"name": "created", "initial": True, "description": "Session record allocated."},
                {"name": "active", "description": "At least one run is in progress or recently completed."},
                {"name": "idle", "description": "No active runs; session awaiting new input."},
                {"name": "suspended", "description": "Session paused; runs cannot start until resumed."},
                {"name": "terminated", "terminal": True, "description": "Session closed; no further runs permitted."},
            ],
            [
                {"from": "created", "to": "active", "trigger": "first_run_start"},
                {"from": "active", "to": "idle", "trigger": "all_runs_complete"},
                {"from": "idle", "to": "active", "trigger": "run_start"},
                {"from": "active", "to": "suspended", "trigger": "suspend"},
                {"from": "idle", "to": "suspended", "trigger": "suspend"},
                {"from": "suspended", "to": "idle", "trigger": "resume"},
                {"from": "idle", "to": "terminated", "trigger": "terminate"},
                {"from": "suspended", "to": "terminated", "trigger": "terminate"},
            ]),
        "run_lifecycle": state("run_lifecycle", "Run Lifecycle", "运行生命周期",
            "Lifecycle states for a single goal-directed execution within a session.",
            [
                {"name": "initialized", "initial": True, "description": "Run allocated but not yet executing."},
                {"name": "running", "description": "Turns and actions actively executing."},
                {"name": "paused", "description": "Execution suspended; may resume or checkpoint."},
                {"name": "checkpointed", "description": "State persisted; awaiting resume or termination."},
                {"name": "completed", "terminal": True, "description": "Goal achieved or run finished successfully."},
                {"name": "failed", "terminal": True, "description": "Unrecoverable error terminated the run."},
                {"name": "cancelled", "terminal": True, "description": "Run stopped by operator or policy."},
            ],
            [
                {"from": "initialized", "to": "running", "trigger": "start"},
                {"from": "running", "to": "paused", "trigger": "pause"},
                {"from": "paused", "to": "running", "trigger": "resume"},
                {"from": "running", "to": "checkpointed", "trigger": "checkpoint"},
                {"from": "checkpointed", "to": "running", "trigger": "resume_from_checkpoint"},
                {"from": "running", "to": "completed", "trigger": "complete"},
                {"from": "running", "to": "failed", "trigger": "fail"},
                {"from": "running", "to": "cancelled", "trigger": "cancel"},
                {"from": "paused", "to": "cancelled", "trigger": "cancel"},
            ]),
        "sandbox_lifecycle": state("sandbox_lifecycle", "Sandbox Lifecycle", "沙箱生命周期",
            "Lifecycle states for an isolated execution environment.",
            [
                {"name": "provisioning", "initial": True, "description": "Resources being allocated for the sandbox."},
                {"name": "ready", "description": "Sandbox initialized and accepting commands."},
                {"name": "executing", "description": "One or more commands running inside the sandbox."},
                {"name": "cleaning_up", "description": "Tearing down processes and releasing resources."},
                {"name": "destroyed", "terminal": True, "description": "Sandbox fully removed; no further execution."},
            ],
            [
                {"from": "provisioning", "to": "ready", "trigger": "provision_complete"},
                {"from": "ready", "to": "executing", "trigger": "command_start"},
                {"from": "executing", "to": "ready", "trigger": "command_complete"},
                {"from": "ready", "to": "cleaning_up", "trigger": "shutdown"},
                {"from": "executing", "to": "cleaning_up", "trigger": "shutdown"},
                {"from": "cleaning_up", "to": "destroyed", "trigger": "cleanup_complete"},
            ]),
    }

    constraints = {
        "session_is_not_context_window": constraint(
            "session_is_not_context_window", "Session Is Not Context Window", "会话不是上下文窗口",
            "node.session MUST NOT be conflated with the ephemeral model context window. Session spans multiple runs; "
            "context window is per-turn working memory materialized from transcript, retrieval, and instructions.",
            "Confusing session persistence with context window leads to incorrect compaction and memory architecture.",
            nodes=["session"],
        ),
        "transcript_is_not_memory": constraint(
            "transcript_is_not_memory", "Transcript Is Not Memory", "转录不是记忆",
            "node.transcript records the ordered narrative of messages and events but MUST NOT serve as the sole "
            "long-horizon recall mechanism. Durable recall MUST use memory-graph artifacts.",
            "Transcripts are lossy under compaction; treating them as memory causes recall gaps.",
            nodes=["transcript"],
        ),
        "sandbox_is_execution_boundary": constraint(
            "sandbox_is_execution_boundary", "Sandbox Is Execution Boundary", "沙箱是执行边界",
            "All side-effecting environment actions MUST execute within node.sandbox via EXECUTES_IN. "
            "Direct host execution outside the sandbox boundary is forbidden for untrusted agent actions.",
            "Sandbox isolation is the primary containment for tool and command execution.",
            nodes=["sandbox", "executor"],
        ),
        "long_running_must_have_checkpoint": constraint(
            "long_running_must_have_checkpoint", "Long Running Must Have Checkpoint", "长运行必须有检查点",
            "Any node.run expected to exceed configured duration thresholds MUST attach a node.checkpoint "
            "strategy via CHECKPOINTS before entering long-running execution.",
            "Checkpointing enables recovery and prevents total work loss on interruption.",
            nodes=["run"],
        ),
    }

    for name, data in nodes.items():
        write(base / "nodes" / f"{name}.yaml", data)
    edge_files_07 = {
        "STARTS": "starts", "ADVANCES_TO": "advances_to", "EMITS_EVENT": "emits_event",
        "APPENDS_TRANSCRIPT": "appends_transcript", "TRACES": "traces", "CHECKPOINTS": "checkpoints",
        "RESTORES_FROM": "restores_from", "RESETS_CONTEXT_WITH": "resets_context_with",
        "EXECUTES_IN": "executes_in", "STREAMS_TO": "streams_to", "RETRIES_BY": "retries_by",
        "CANCELS_BY": "cancels_by", "RECOVERS_FROM": "recovers_from", "BOUNDED_BY_BUDGET": "bounded_by_budget",
    }
    for ename, data in edges.items():
        write(base / "edges" / f"{edge_files_07[ename]}.yaml", data)
    for name, data in contracts.items():
        write(base / "contracts" / f"{name}.yaml", data)
    for name, data in states.items():
        write(base / "states" / f"{name}.yaml", data)
    for name, data in constraints.items():
        write(base / "constraints" / f"{name}.yaml", data)


def gen_08():
    base = ROOT / "08-safety-policy-graph"
    L, P = "safety", "SafetyPlane"

    nodes = {
        "trust_boundary": node(
            "trust_boundary", "Trust Boundary", "信任边界",
            "Demarcation between trusted and untrusted domains, defining where policy enforcement "
            "must occur before data or control crosses the boundary.",
            L, P,
            {"boundary_type": enum_attr(["network", "process", "data", "identity"], "Category of trust separation."),
             "trust_level_inside": str_attr("Label for the higher-trust side."),
             "trust_level_outside": str_attr("Label for the lower-trust side.")},
        ),
        "policy_contract": node(
            "policy_contract", "Policy Contract", "策略契约",
            "Abstract safety and governance policy defining rules, enforcement points, and escalation "
            "paths applicable to guarded operations.",
            L, P,
            {"policy_id": str_attr("Unique identifier for this policy definition."),
             "policy_version": str_attr("Semantic version of the policy schema."),
             "enforcement_mode": enum_attr(["advisory", "blocking", "audit_only"], "Strictness of policy application.")},
            edges_out=[
                {"predicate": "GUARDS", "target_any_of": ["node.permission_policy", "node.sandbox_policy"]},
                {"predicate": "AUTHORIZES", "target": "node.allow_decision"},
                {"predicate": "DENIES", "target": "node.deny_decision"},
            ],
        ),
        "permission_policy": node(
            "permission_policy", "Permission Policy", "权限策略",
            "Rules governing which actions an agent or tool may perform, evaluated at invocation time "
            "against allow and deny lists.",
            L, P,
            {"default_effect": enum_attr(["deny", "allow"], "Effect when no explicit rule matches."),
             "rule_precedence": enum_attr(["deny_overrides", "allow_overrides", "most_specific"], "Conflict resolution order.")},
            edges_in=[{"predicate": "GUARDS", "source": "node.policy_contract"}],
        ),
        "allowed_list": node(
            "allowed_list", "Allowed List", "允许列表",
            "Explicit enumeration of permitted operations, resources, or endpoints beyond which "
            "all unmatched requests are denied by default.",
            L, P,
            {"entries": obj_attr("List of permitted operation patterns or resource identifiers."),
             "list_scope": enum_attr(["global", "session", "tool", "user"], "Scope to which this list applies.")},
        ),
        "denied_list": node(
            "denied_list", "Denied List", "拒绝列表",
            "Explicit enumeration of forbidden operations or resources that override allow rules "
            "regardless of other permissions.",
            L, P,
            {"entries": obj_attr("List of forbidden operation patterns or resource identifiers."),
             "list_scope": enum_attr(["global", "session", "tool", "user"], "Scope to which this list applies.")},
        ),
        "approval_flow": node(
            "approval_flow", "Approval Flow", "审批流程",
            "Human-in-the-loop approval process requiring explicit authorization before high-risk "
            "or sensitive actions proceed.",
            L, P,
            {"approver_roles": obj_attr("Roles eligible to grant approval."),
             "timeout_seconds": int_attr("Duration before pending approval times out."),
             "auto_deny_on_timeout": bool_attr("Whether timeout results in denial rather than escalation.")},
            sm="approval_lifecycle",
            edges_out=[{"predicate": "REQUIRES_HUMAN_REVIEW", "target": "node.human_review"}],
        ),
        "human_review": node(
            "human_review", "Human Review", "人工审查",
            "Human assessment of a proposed agent action, providing approve, deny, or modify decisions "
            "before execution proceeds.",
            L, P,
            {"reviewer_id": str_attr("Identifier of the human reviewer."),
             "review_deadline": str_attr("Optional ISO-8601 deadline for review completion."),
             "decision_options": obj_attr("Permitted reviewer outcomes.")},
            edges_in=[{"predicate": "REQUIRES_HUMAN_REVIEW", "source": "node.approval_flow"}],
        ),
        "privilege_control": node(
            "privilege_control", "Privilege Control", "权限控制",
            "Mechanism enforcing least privilege by dynamically scoping permissions to the minimum "
            "necessary for the current operation.",
            L, P,
            {"elevation_requires_approval": bool_attr("Whether privilege elevation triggers approval flow."),
             "scope_reduction_on_completion": bool_attr("Whether elevated permissions auto-revoke after use.")},
        ),
        "least_privilege": node(
            "least_privilege", "Least Privilege", "最小权限",
            "Principle requiring that every agent, tool, and process receive only the minimal permissions "
            "necessary to accomplish its current task.",
            L, P,
            {"baseline_permissions": obj_attr("Default minimal permission set for new sessions."),
             "monotonic_reduction": bool_attr("Whether permissions may only decrease without explicit elevation.")},
        ),
        "information_flow_control": node(
            "information_flow_control", "Information Flow Control", "信息流控制",
            "Framework for data label propagation and enforcement ensuring sensitive information "
            "does not flow to unauthorized sinks.",
            L, P,
            {"label_hierarchy": obj_attr("Ordering of confidentiality and integrity labels."),
             "flow_rules": obj_attr("Rules defining permitted label transitions across boundaries.")},
            edges_out=[
                {"predicate": "LABELS_DATA", "target": "node.data_label"},
                {"predicate": "PROPAGATES_TAINT", "target": "node.taint"},
            ],
        ),
        "data_label": node(
            "data_label", "Data Label", "数据标签",
            "Integrity or confidentiality tag attached to data artifacts, governing where they may "
            "be stored, transmitted, or included in model context.",
            L, P,
            {"confidentiality": enum_attr(["public", "internal", "confidential", "restricted"], "Secrecy classification."),
             "integrity": enum_attr(["unverified", "verified", "trusted"], "Trustworthiness classification."),
             "source_ref": str_attr("Origin entity that applied this label.")},
            interfaces=["labelable"],
            edges_in=[{"predicate": "LABELS_DATA", "source": "node.information_flow_control"}],
        ),
        "taint": node(
            "taint", "Taint", "污点",
            "Untrusted data marking that propagates through processing, preventing tainted values "
            "from influencing security-sensitive operations without sanitization.",
            L, P,
            {"taint_source": str_attr("Origin of the untrusted data."),
             "propagation_rules": obj_attr("Operations that preserve or remove taint."),
             "sanitization_required_for": obj_attr("Sensitive sinks requiring taint removal.")},
            edges_in=[{"predicate": "PROPAGATES_TAINT", "source": "node.information_flow_control"}],
        ),
        "prompt_injection_defense": node(
            "prompt_injection_defense", "Prompt Injection Defense", "提示注入防御",
            "Detection and prevention mechanisms guarding against adversarial instructions embedded "
            "in untrusted inputs that attempt to override system behavior.",
            L, P,
            {"detection_methods": obj_attr("Heuristic, model-based, or rule-based detection techniques."),
             "mitigation_actions": obj_attr("Responses when injection is detected."),
             "sensitivity_level": enum_attr(["low", "medium", "high"], "Aggressiveness of detection thresholds.")},
            edges_out=[{"predicate": "SCANS_FOR", "target": "node.pattern_scan"}],
        ),
        "pattern_scan": node(
            "pattern_scan", "Pattern Scan", "模式扫描",
            "Signature-based scanning of inputs and outputs for known attack patterns, policy violations, "
            "or sensitive data leakage.",
            L, P,
            {"pattern_library_ref": str_attr("Reference to the signature rule set."),
             "scan_targets": obj_attr("Input, output, or tool-result channels subject to scanning."),
             "match_action": enum_attr(["block", "warn", "redact", "log"], "Action on pattern match.")},
            edges_in=[{"predicate": "SCANS_FOR", "source": "node.prompt_injection_defense"}],
        ),
        "cognitive_executive_separation": node(
            "cognitive_executive_separation", "Cognitive Executive Separation", "认知执行分离",
            "Architectural separation ensuring reasoning and planning components cannot directly "
            "execute side-effecting actions without passing through an executive gate.",
            L, P,
            {"reasoning_component_ref": str_attr("Reference to the deliberation module."),
             "executive_component_ref": str_attr("Reference to the action dispatch module."),
             "bypass_prohibited": bool_attr("Whether direct reasoning-to-action paths are forbidden.")},
            edges_out=[{"predicate": "SEPARATES_REASONING_FROM_EXECUTION", "target_any_of": ["node.policy_contract", "node.privilege_control"]}],
        ),
        "sandbox_policy": node(
            "sandbox_policy", "Sandbox Policy", "沙箱策略",
            "Rules governing sandbox configuration including resource limits, allowed syscalls, "
            "mount points, and network isolation defaults.",
            L, P,
            {"resource_caps": obj_attr("CPU, memory, disk, and process limits."),
             "allowed_syscalls": obj_attr("System call allow list when seccomp is enabled."),
             "network_default": enum_attr(["deny_all", "allow_list", "full"], "Default network posture.")},
            edges_in=[{"predicate": "GUARDS", "source": "node.policy_contract"}],
        ),
        "network_policy": node(
            "network_policy", "Network Policy", "网络策略",
            "Rules for network access enforcing deny-by-default egress with explicit allow lists "
            "for domains, ports, and protocols.",
            L, P,
            {"default_egress": enum_attr(["deny", "allow"], "Default effect for outbound connections."),
             "allowed_destinations": obj_attr("Explicit egress allow list entries."),
             "protocol_restrictions": obj_attr("Permitted protocols and TLS requirements.")},
        ),
        "file_policy": node(
            "file_policy", "File Policy", "文件策略",
            "Rules governing filesystem access including read/write path allow lists, "
            "temporary directory scoping, and sensitive path blocks.",
            L, P,
            {"read_allowed_paths": obj_attr("Directories and files permitted for read access."),
             "write_allowed_paths": obj_attr("Directories permitted for write access."),
             "blocked_paths": obj_attr("Paths unconditionally denied regardless of other rules.")},
        ),
        "credential_proxy": node(
            "credential_proxy", "Credential Proxy", "凭证代理",
            "Intermediary that rewrites authentication headers and tokens so secrets never enter "
            "the untrusted sandbox or agent context.",
            L, P,
            {"proxy_endpoint": str_attr("Address of the credential injection proxy."),
             "token_lifetime_seconds": int_attr("Maximum lifetime of injected short-lived tokens."),
             "auditable": bool_attr("Whether all proxy invocations are logged.")},
            interfaces=["auditable"],
            edges_out=[{"predicate": "PROXIES_CREDENTIAL", "target": "node.secret"}],
        ),
        "secret": node(
            "secret", "Secret", "密钥",
            "Sensitive credential, API key, or cryptographic material that must never appear in "
            "agent context, logs, or sandbox filesystems.",
            L, P,
            {"secret_type": enum_attr(["api_key", "password", "certificate", "token"], "Category of credential."),
             "rotation_policy_ref": str_attr("Reference to automatic rotation schedule."),
             "storage_backend": str_attr("Secure vault or key management reference.")},
            edges_in=[{"predicate": "PROXIES_CREDENTIAL", "source": "node.credential_proxy"}],
        ),
        "audit_log": node(
            "audit_log", "Audit Log", "审计日志",
            "Immutable append-only record of security-relevant events including policy decisions, "
            "tool invocations, access attempts, and escalations.",
            L, P,
            {"log_sink_ref": str_attr("Storage destination for audit records."),
             "retention_days": int_attr("Minimum retention period for audit entries."),
             "tamper_evident": bool_attr("Whether log integrity is cryptographically protected.")},
            interfaces=["auditable"],
            edges_in=[{"predicate": "AUDITS", "source_any_of": ["node.policy_contract", "node.credential_proxy"]}],
        ),
        "warning": node(
            "warning", "Warning", "警告",
            "Non-blocking security alert emitted when policy detects a suspicious but permitted "
            "condition requiring operator awareness.",
            L, P,
            {"severity": enum_attr(["info", "low", "medium", "high"], "Alert severity level."),
             "message": str_attr("Human-readable description of the detected condition."),
             "related_event_id": str_attr("Optional reference to the triggering event.")},
        ),
        "deny_decision": node(
            "deny_decision", "Deny Decision", "拒绝决策",
            "Policy outcome blocking a requested action, returning rationale and optional retry guidance.",
            L, P,
            {"reason_code": str_attr("Machine-readable denial reason."),
             "rationale": str_attr("Human-readable explanation of the denial."),
             "retry_allowed": bool_attr("Whether the agent may retry with modified parameters.")},
            edges_in=[{"predicate": "DENIES", "source": "node.policy_contract"}],
            sm="policy_enforcement_lifecycle",
        ),
        "allow_decision": node(
            "allow_decision", "Allow Decision", "允许决策",
            "Policy outcome permitting a requested action within the granted scope and attached conditions.",
            L, P,
            {"granted_scope": obj_attr("Specific permissions or resources authorized."),
             "conditions": obj_attr("Optional constraints attached to the allowance."),
             "expires_at": str_attr("Optional expiration for time-bound permissions.")},
            edges_in=[{"predicate": "AUTHORIZES", "source": "node.policy_contract"}],
            sm="policy_enforcement_lifecycle",
        ),
        "escalation": node(
            "escalation", "Escalation", "升级",
            "Elevation of a policy decision or blocked action to a higher authority, human reviewer, "
            "or broader permission tier.",
            L, P,
            {"escalation_target": enum_attr(["human", "higher_tier", "admin"], "Recipient of the escalation."),
             "original_decision_ref": str_attr("Reference to the decision being escalated."),
             "urgency": enum_attr(["normal", "high", "critical"], "Priority of the escalation request.")},
            edges_out=[{"predicate": "ESCALATES", "target": "node.human_review"}],
        ),
        "rollback": node(
            "rollback", "Rollback", "回滚",
            "Reversal of a completed action to restore prior state when post-execution review "
            "determines the action was unauthorized or harmful.",
            L, P,
            {"rollback_strategy": enum_attr(["compensating_action", "state_restore", "manual"], "Method for undoing the action."),
             "target_action_ref": str_attr("Reference to the action being reversed."),
             "verification_required": bool_attr("Whether rollback success must be confirmed before closing.")},
            edges_out=[{"predicate": "ROLLS_BACK", "target_any_of": ["node.deny_decision", "node.audit_log"]}],
        ),
    }

    edges = {
        "GUARDS": edge("GUARDS", "GUARDS", "node.policy_contract",
            ["node.permission_policy", "node.sandbox_policy", "node.network_policy", "node.file_policy"],
            "A policy contract protects operations by attaching enforcement rules at guard points.", "1:N"),
        "AUTHORIZES": edge("AUTHORIZES", "AUTHORIZES", "node.policy_contract", "node.allow_decision",
            "Policy evaluation yields an explicit permit decision with scoped conditions.", "1:N"),
        "DENIES": edge("DENIES", "DENIES", "node.policy_contract", "node.deny_decision",
            "Policy evaluation yields an explicit block decision with rationale.", "1:N"),
        "ESCALATES": edge("ESCALATES", "ESCALATES", "node.escalation", ["node.human_review", "node.approval_flow"],
            "A blocked or ambiguous decision is elevated to higher authority for resolution."),
        "REQUIRES_HUMAN_REVIEW": edge("REQUIRES_HUMAN_REVIEW", "REQUIRES_HUMAN_REVIEW",
            ["node.approval_flow", "node.policy_contract"], "node.human_review",
            "An action or decision must receive human assessment before proceeding."),
        "LABELS_DATA": edge("LABELS_DATA", "LABELS_DATA", "node.information_flow_control", "node.data_label",
            "Information flow control assigns confidentiality and integrity labels to data artifacts."),
        "PROPAGATES_TAINT": edge("PROPAGATES_TAINT", "PROPAGATES_TAINT", "node.information_flow_control", "node.taint",
            "Untrusted data taint marks propagate through processing per flow rules."),
        "SCANS_FOR": edge("SCANS_FOR", "SCANS_FOR", "node.prompt_injection_defense", "node.pattern_scan",
            "Injection defense invokes pattern scanning on untrusted input channels."),
        "SEPARATES_REASONING_FROM_EXECUTION": edge("SEPARATES_REASONING_FROM_EXECUTION",
            "SEPARATES_REASONING_FROM_EXECUTION", "node.cognitive_executive_separation",
            ["node.policy_contract", "node.privilege_control"],
            "Architectural boundary preventing reasoning modules from directly executing side effects."),
        "PROXIES_CREDENTIAL": edge("PROXIES_CREDENTIAL", "PROXIES_CREDENTIAL", "node.credential_proxy", "node.secret",
            "Credential proxy injects short-lived tokens without exposing secrets to untrusted zones.", "N:M"),
        "AUDITS": edge("AUDITS", "AUDITS", ["node.policy_contract", "node.credential_proxy", "node.allow_decision", "node.deny_decision"],
            "node.audit_log", "Security-relevant decisions and proxy invocations are recorded immutably."),
        "ROLLS_BACK": edge("ROLLS_BACK", "ROLLS_BACK", "node.rollback",
            ["node.allow_decision", "node.deny_decision"],
            "A rollback reverses a prior permitted action and records the reversal in audit."),
    }

    contracts = {
        "guardable": contract("guardable", "Guardable", "可防护",
            "Capability indicating an operation or resource can be protected by policy enforcement.",
            [
                {"name": "evaluate_policy", "description": "Evaluate applicable policies for a proposed action.",
                 "input": {"action": "object", "context": "object"}, "output": {"decision": "string", "rationale": "string"},
                 "errors": ["policy_not_found", "evaluation_error"]},
            ]),
        "auditable": contract("auditable", "Auditable", "可审计",
            "Capability indicating an entity produces structured audit records for security-relevant events.",
            [
                {"name": "emit_audit_record", "description": "Append an immutable audit log entry.",
                 "input": {"event_type": "string", "payload": "object"}, "output": {"record_id": "string"}},
            ]),
        "labelable": contract("labelable", "Labelable", "可标注",
            "Capability indicating a data artifact can carry confidentiality and integrity labels.",
            [
                {"name": "apply_label", "description": "Attach or update a data label on the artifact.",
                 "input": {"label": "object"}, "output": {"labeled": "boolean"}},
                {"name": "get_label", "description": "Retrieve current labels on the artifact.",
                 "input": {}, "output": {"labels": "object"}},
            ]),
    }

    states = {
        "approval_lifecycle": state("approval_lifecycle", "Approval Lifecycle", "审批生命周期",
            "Lifecycle states for a human-in-the-loop approval request.",
            [
                {"name": "pending", "initial": True, "description": "Approval requested; awaiting reviewer."},
                {"name": "reviewing", "description": "Reviewer actively examining the request."},
                {"name": "approved", "terminal": True, "description": "Reviewer granted approval."},
                {"name": "denied", "terminal": True, "description": "Reviewer rejected the request."},
                {"name": "escalated", "description": "Request forwarded to higher authority."},
                {"name": "timed_out", "terminal": True, "description": "Review deadline elapsed without decision."},
            ],
            [
                {"from": "pending", "to": "reviewing", "trigger": "reviewer_claims"},
                {"from": "reviewing", "to": "approved", "trigger": "approve"},
                {"from": "reviewing", "to": "denied", "trigger": "deny"},
                {"from": "pending", "to": "escalated", "trigger": "escalate"},
                {"from": "reviewing", "to": "escalated", "trigger": "escalate"},
                {"from": "escalated", "to": "approved", "trigger": "approve"},
                {"from": "escalated", "to": "denied", "trigger": "deny"},
                {"from": "pending", "to": "timed_out", "trigger": "timeout"},
                {"from": "reviewing", "to": "timed_out", "trigger": "timeout"},
            ]),
        "policy_enforcement_lifecycle": state("policy_enforcement_lifecycle", "Policy Enforcement Lifecycle", "策略执行生命周期",
            "Lifecycle states for a single policy evaluation and enforcement cycle.",
            [
                {"name": "evaluating", "initial": True, "description": "Policy rules being applied to the request."},
                {"name": "allowed", "terminal": True, "description": "Action permitted within granted scope."},
                {"name": "denied", "terminal": True, "description": "Action blocked by policy."},
                {"name": "escalated", "description": "Decision deferred to higher authority."},
                {"name": "rolled_back", "terminal": True, "description": "Previously allowed action reversed post-hoc."},
            ],
            [
                {"from": "evaluating", "to": "allowed", "trigger": "permit"},
                {"from": "evaluating", "to": "denied", "trigger": "deny"},
                {"from": "evaluating", "to": "escalated", "trigger": "escalate"},
                {"from": "escalated", "to": "allowed", "trigger": "permit"},
                {"from": "escalated", "to": "denied", "trigger": "deny"},
                {"from": "allowed", "to": "rolled_back", "trigger": "rollback"},
            ]),
    }

    constraints = {
        "tool_call_must_be_guarded": constraint(
            "tool_call_must_be_guarded", "Tool Call Must Be Guarded", "工具调用必须被防护",
            "Every node.tool_call instance MUST have at least one incoming GUARDS edge from a node.policy_contract "
            "or equivalent permission policy before execution proceeds. Cross-reference: ontology/05-tool-action-graph.",
            "Unguarded tool calls enable unrestricted side effects in untrusted agent contexts.",
            nodes=["tool_call"],
        ),
        "side_effect_must_have_permission_path": constraint(
            "side_effect_must_have_permission_path", "Side Effect Must Have Permission Path", "副作用必须有权限路径",
            "Every side-effecting environment action MUST trace an AUTHORIZES or explicit allow-list path "
            "through node.permission_policy before execution.",
            "Side effects without permission paths violate least-privilege and auditability requirements.",
            nodes=["permission_policy"],
        ),
        "memory_write_must_have_policy": constraint(
            "memory_write_must_have_policy", "Memory Write Must Have Policy", "记忆写入必须有策略",
            "Every memory write operation MUST connect to a write policy via GUARDS or LABELS_DATA "
            "ensuring data classification and retention rules are enforced.",
            "Uncontrolled memory writes may persist sensitive or tainted data beyond policy limits.",
        ),
        "protocol_endpoint_must_have_auth": constraint(
            "protocol_endpoint_must_have_auth", "Protocol Endpoint Must Have Auth", "协议端点必须有认证",
            "Every protocol endpoint exposed to external callers MUST have an authorization scheme "
            "or explicit public-endpoint policy attached via GUARDS.",
            "Unauthenticated endpoints expose agent capabilities to unauthorized actors.",
        ),
        "least_privilege_must_be_monotonic": constraint(
            "least_privilege_must_be_monotonic", "Least Privilege Must Be Monotonic", "最小权限必须单调",
            "Permission scope MUST NOT expand automatically during a session without explicit elevation "
            "through node.approval_flow or node.escalation. node.least_privilege.monotonic_reduction MUST be honored.",
            "Automatic permission expansion undermines defense-in-depth and audit boundaries.",
            nodes=["least_privilege", "privilege_control"],
        ),
    }

    edge_files_08 = {
        "GUARDS": "guards", "AUTHORIZES": "authorizes", "DENIES": "denies", "ESCALATES": "escalates",
        "REQUIRES_HUMAN_REVIEW": "requires_human_review", "LABELS_DATA": "labels_data",
        "PROPAGATES_TAINT": "propagates_taint", "SCANS_FOR": "scans_for",
        "SEPARATES_REASONING_FROM_EXECUTION": "separates_reasoning_from_execution",
        "PROXIES_CREDENTIAL": "proxies_credential", "AUDITS": "audits", "ROLLS_BACK": "rolls_back",
    }

    for name, data in nodes.items():
        write(base / "nodes" / f"{name}.yaml", data)
    for ename, data in edges.items():
        write(base / "edges" / f"{edge_files_08[ename]}.yaml", data)
    for name, data in contracts.items():
        write(base / "contracts" / f"{name}.yaml", data)
    for name, data in states.items():
        write(base / "states" / f"{name}.yaml", data)
    for name, data in constraints.items():
        write(base / "constraints" / f"{name}.yaml", data)


if __name__ == "__main__":
    gen_06()
    print("06-orchestration-graph: done")
    gen_07()
    print("07-runtime-harness-graph: done")
    gen_08()
    print("08-safety-policy-graph: done")
