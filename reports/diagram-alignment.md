# Diagram Alignment Report

## Source Diagram

Agent Structure Graph (PDF/VSDX) — 4-plane architecture extracted to `references/local-diagram-extract.yaml`.

## Plane Coverage

### InfoPlane (100% coverage)
All InfoPlane concepts mapped to ontology nodes:
- ProgressiveDisclosure → node.progressive_disclosure (02-context-info-graph)
- Agent Transcript → node.transcript (07-runtime-harness-graph)
- Chunks → node.chunk (03-memory-graph)
- Context → node.context_graph (02-context-info-graph)
- Embedding Model → node.embedding_model (03-memory-graph)
- TF-IDF → node.sparse_index (03-memory-graph)
- Vector Database → node.vector_store (03-memory-graph)
- Rank Fusion → node.rank_fusion (03-memory-graph)
- Reranker → node.reranker (03-memory-graph)
- Generative Model → node.cognitive_core (01-agent-core-graph)
- Query/Response → node.tool_call / node.tool_result (05-tool-action-graph)
- Light Index → node.light_index (02-context-info-graph)
- OutputChunk → node.output_chunk (02-context-info-graph)
- Graph → node.graph_source (02-context-info-graph)
- Text Embedding → node.embedding_source (02-context-info-graph)

### OrchestrationPlane (100% coverage)
- Orchestrator-workers → node.orchestrator + node.worker (06-orchestration-graph)
- Gate → node.gate (06-orchestration-graph)
- PromptChain → node.prompt_chain (06-orchestration-graph)
- Route/Routing → node.router + node.route (06-orchestration-graph)
- Parallelization → node.parallelization (06-orchestration-graph)
- Sectioning → node.sectioning (06-orchestration-graph)
- Voting → node.voting (06-orchestration-graph)
- Subagent → node.subagent (06-orchestration-graph)
- Task Distribute → node.task_distribution (06-orchestration-graph)
- Evaluator-optimizer → node.evaluator + node.optimizer (06-orchestration-graph)
- Review → node.review (06-orchestration-graph)
- ThinkAsTool → node.think_as_tool (06-orchestration-graph)
- Feedback → node.feedback (06-orchestration-graph)

### MemoryPlane (100% coverage)
- Memory Retrieve → node.memory_retriever (03-memory-graph)
- Memory Preference → node.preference_memory (03-memory-graph)

### ToolPlane (100% coverage)
- Tool Call → node.tool_call (05-tool-action-graph)
- Sandbox → node.sandbox (07-runtime-harness-graph)
- MCP → node.protocol (09-protocol-interop-graph)
- Container → node.container (07-runtime-harness-graph)
- Command Area → node.command_area (02-context-info-graph)
- Storage Area → node.storage_area (02-context-info-graph)
- Allowed List → node.allowed_list (08-safety-policy-graph)
- Permission → node.permission_policy (08-safety-policy-graph)
- Pattern scan → node.pattern_scan (08-safety-policy-graph)
- Deny and Escalate → node.deny_decision + node.escalation (08-safety-policy-graph)
- Credential Proxy → node.credential_proxy (08-safety-policy-graph)
- Log listener → node.audit_log (08-safety-policy-graph)
- Network Policy → node.network_policy (08-safety-policy-graph)
- Tool Search → node.tool_search (05-tool-action-graph)
- Programmatic Tool Calling → node.programmatic_tool_calling (05-tool-action-graph)
- Code Execution → node.code_execution_action (05-tool-action-graph)

## Overall Alignment

All 95 extracted diagram nodes successfully mapped to ontology NodeClass definitions.
4/4 planes covered at 100%.
