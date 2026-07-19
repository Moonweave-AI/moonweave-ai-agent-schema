/** Authoritative source catalog for runtime-plane example description upgrades. */

export const SOURCE_IDS = [
  'w3c_prov',
  'opentelemetry',
  'langsmith',
  'langfuse',
  'arize_phoenix',
  'helicone',
  'vllm',
  'ollama',
];

function kindMap(positive, boundary, counterexample, instance) {
  return ({ nodeId, kind }) => {
    const base = { positive, boundary, counterexample, instance };
    return base[kind] || base.positive;
  };
}

export const SOURCE_TEMPLATES = {
  w3c_prov: kindMap(
    {
      zh: `W3C PROV-O：prov:Agent wasAssociatedWith prov:Activity；prov:Activity used prov:Entity / generated prov:Entity；${nodeId} 映射运行时 actor/execution/artifact 的来历图，区分 Entity 与 Activity。`,
      en: `W3C PROV-O: prov:Agent wasAssociatedWith prov:Activity; prov:Activity used/generated prov:Entity; ${nodeId} maps runtime actor/execution/artifact provenance graph, separating Entity from Activity.`,
      ja: `W3C PROV-O Agent-Activity-Entity；${nodeId} は来歴グラフ。`,
    },
    {
      zh: `PROV Entity 是稳定内容/状态快照；Activity 是有时间边界的执行；${nodeId} 不能把 transient process handle 或 span 预览当 Entity。`,
      en: `PROV Entity is stable content/state snapshot; Activity is time-bounded execution; ${nodeId} must not treat transient process handle or span preview as Entity.`,
      ja: `PROV Entity は安定内容；span プレビューは Entity ではない。`,
    },
    {
      zh: `无 wasAssociatedWith 或 used/generated 关系的孤立 ID 字符串不能作为 PROV-O 式 ${nodeId} 记录。`,
      en: `Isolated ID string without wasAssociatedWith or used/generated relations cannot serve as PROV-O-style ${nodeId} record.`,
      ja: `PROV 関係欠落 ID は PROV-O 式 ${nodeId} として拒否。`,
    },
    {
      zh: `PROV-O 实例：Agent:model-actor-7 wasAssociatedWith Activity:execution-run-42 used Entity:checkpoint-9 → 映射 ${nodeId}。`,
      en: `PROV-O instance: Agent:model-actor-7 wasAssociatedWith Activity:execution-run-42 used Entity:checkpoint-9 → maps to ${nodeId}.`,
      ja: `PROV-O 实例 Agent-Activity-Entity が ${nodeId} に写像。`,
    },
  ),
  opentelemetry: kindMap(
    {
      zh: `OpenTelemetry：TracerProvider → Tracer → Span；tracer.start_span("llm.call", attributes={"model":"gpt-4","tokens":1500})；SpanKind CLIENT/SERVER/PRODUCER/CONSUMER/INTERNAL；${nodeId} 映射 TraceSpan/TraceRecord/ObservabilityEvent。`,
      en: `OpenTelemetry: TracerProvider → Tracer → Span; tracer.start_span("llm.call", attributes={"model":"gpt-4","tokens":1500}); SpanKind CLIENT/SERVER/PRODUCER/CONSUMER/INTERNAL; ${nodeId} maps TraceSpan/TraceRecord/ObservabilityEvent.`,
      ja: `OpenTelemetry Tracer→Span llm.call attributes；${nodeId} は TraceSpan/Record。`,
    },
    {
      zh: `OTel Span Event (Span.add_event) 产生 TraceEvent 须附着 Span；Metrics 聚合信号不是 Execution；${nodeId} 保持 span/event/metric 边界。`,
      en: `OTel Span.add_event produces TraceEvent attached to Span; Metrics are aggregate signals not Execution; ${nodeId} preserves span/event/metric boundaries.`,
      ja: `OTel Event は Span 付着；Metrics は Execution ではない。`,
    },
    {
      zh: `无 trace_id/span_id 或 parent context 的日志行不能作为 OpenTelemetry 式 ${nodeId} TraceSpan。`,
      en: `Log line without trace_id/span_id or parent context cannot serve as OpenTelemetry-style ${nodeId} TraceSpan.`,
      ja: `trace_id 欠落ログは OTel 式 ${nodeId} として拒否。`,
    },
    {
      zh: `OTel 实例：trace_id=4bf92f3577b34da6 span_id=00f067aa0ba902b7 kind=CLIENT name=llm.call → 映射 ${nodeId}。`,
      en: `OTel instance: trace_id=4bf92f3577b34da6 span_id=00f067aa0ba902b7 kind=CLIENT name=llm.call → maps to ${nodeId}.`,
      ja: `OTel 实例 trace/span kind=CLIENT が ${nodeId} に写像。`,
    },
  ),
  langsmith: kindMap(
    {
      zh: `LangSmith：RunTree parent_run_id 关联，run_type="chain"/"llm"/"tool"；with tracing_v2_enabled(project_name="my-project"): chain.invoke(...)；${nodeId} 映射 TraceRecord/TraceSpan/Execution 层级 run 树。`,
      en: `LangSmith: RunTree parent_run_id linkage, run_type chain/llm/tool; with tracing_v2_enabled(project_name="my-project"): chain.invoke(...); ${nodeId} maps TraceRecord/TraceSpan/Execution hierarchical run tree.`,
      ja: `LangSmith RunTree parent_run_id run_type chain/llm/tool；${nodeId} は run ツリー。`,
    },
    {
      zh: `LangSmith run.outputs 是 trace 预览不是 PROV Entity；Checkpoint 是 StateRecord；${nodeId} 不能把 run JSON 直接当 Artifact content_digest。`,
      en: `LangSmith run.outputs is trace preview not PROV Entity; Checkpoint is StateRecord; ${nodeId} must not treat run JSON as Artifact content_digest.`,
      ja: `LangSmith run.outputs は trace プレビュー；Artifact ではない。`,
    },
    {
      zh: `无 parent_run_id 与 run_type 的单条 console.log 不能作为 LangSmith 式 ${nodeId} TraceRecord。`,
      en: `Single console.log without parent_run_id and run_type cannot serve as LangSmith-style ${nodeId} TraceRecord.`,
      ja: `parent_run_id 欠落 log は LangSmith 式 ${nodeId} ではない。`,
    },
    {
      zh: `LangSmith 实例：run_id=0192a3b4 parent_run_id=0192a3b3 run_type=llm name=ChatOpenAI → 映射 ${nodeId} trace_id=langsmith-0192a3b4。`,
      en: `LangSmith instance: run_id=0192a3b4 parent_run_id=0192a3b3 run_type=llm name=ChatOpenAI → maps to ${nodeId} trace_id=langsmith-0192a3b4.`,
      ja: `LangSmith 实例 parent_run_id+run_type=llm が ${nodeId} に写像。`,
    },
  ),
  langfuse: kindMap(
    {
      zh: `Langfuse：langfuse = Langfuse(); trace = langfuse.trace(name="my-agent")；span = trace.span(name="llm-call", metadata={"model":"gpt-4"})；trace.score(name="accuracy", value=0.95)；${nodeId} 映射 TraceRecord/TraceSpan/ObservabilityEvent。`,
      en: `Langfuse: langfuse.trace(name="my-agent"); trace.span(name="llm-call", metadata={"model":"gpt-4"}); trace.score(name="accuracy", value=0.95); ${nodeId} maps TraceRecord/TraceSpan/ObservabilityEvent.`,
      ja: `Langfuse trace.span metadata+trace.score；${nodeId} は TraceRecord/Span。`,
    },
    {
      zh: `Langfuse score 是 eval 反馈信号不是 Execution；nested observation 是 TraceSpan 树；${nodeId} 保持 trace/span/score 区分。`,
      en: `Langfuse score is eval feedback signal not Execution; nested observations are TraceSpan tree; ${nodeId} preserves trace/span/score distinction.`,
      ja: `Langfuse score は eval 信号；Execution ではない。`,
    },
    {
      zh: `无 trace 容器仅孤立 generation 对象不能作为 Langfuse 式 ${nodeId} TraceRecord。`,
      en: `Isolated generation object without trace container cannot serve as Langfuse-style ${nodeId} TraceRecord.`,
      ja: `trace 容器なし generation は Langfuse 式 ${nodeId} ではない。`,
    },
    {
      zh: `Langfuse 实例：trace_id=langfuse-0192a3b4 span llm-call model=gpt-4 score accuracy=0.95 → 映射 ${nodeId}。`,
      en: `Langfuse instance: trace_id=langfuse-0192a3b4 span llm-call model=gpt-4 score accuracy=0.95 → maps to ${nodeId}.`,
      ja: `Langfuse 实例 trace+span+score が ${nodeId} に写像。`,
    },
  ),
  arize_phoenix: kindMap(
    {
      zh: `Arize AI / Phoenix ML 可观测性：embedding drift 检测、prompt/response quality 评估、trace 可视化；${nodeId} 映射 ObservabilityEvent/MetricSample 的质量与漂移信号。`,
      en: `Arize AI / Phoenix ML observability: embedding drift detection, prompt/response quality evaluation, trace visualization; ${nodeId} maps ObservabilityEvent/MetricSample quality and drift signals.`,
      ja: `Arize Phoenix embedding drift+prompt quality；${nodeId} は ObservabilityEvent。`,
    },
    {
      zh: `Phoenix p99 latency 是 ObservableSummary 聚合；单次 span 是 TraceSpan；${nodeId} 不能把 dashboard 百分位当 Execution。`,
      en: `Phoenix p99 latency is ObservableSummary aggregate; single span is TraceSpan; ${nodeId} must not treat dashboard percentile as Execution.`,
      ja: `Phoenix p99 は集約；単 span は TraceSpan。`,
    },
    {
      zh: `无 embedding_version 或 prompt_template_hash 的裸 latency 数字不能作为 Phoenix 式 ${nodeId} drift 事件。`,
      en: `Bare latency number without embedding_version or prompt_template_hash cannot serve as Phoenix-style ${nodeId} drift event.`,
      ja: `embedding_version 欠落 latency は Phoenix 式 ${nodeId} ではない。`,
    },
    {
      zh: `Phoenix 实例：embedding_drift_score=0.18 prompt_quality=0.91 trace_id=phoenix-tr-88 → 映射 ${nodeId} ObservabilityEvent。`,
      en: `Phoenix instance: embedding_drift_score=0.18 prompt_quality=0.91 trace_id=phoenix-tr-88 → maps to ${nodeId} ObservabilityEvent.`,
      ja: `Phoenix 实例 drift+quality が ${nodeId} Event に写像。`,
    },
  ),
  helicone: kindMap(
    {
      zh: `Helicone LLM proxy：替换 OpenAI base_url 即可追踪所有 API 调用；记录 latency、cost、model、prompt/completion tokens；${nodeId} 映射 TraceRecord/Execution/CostMetric 的代理层遥测。`,
      en: `Helicone LLM proxy: replace OpenAI base_url to trace all API calls; records latency, cost, model, prompt/completion tokens; ${nodeId} maps TraceRecord/Execution/CostMetric proxy-layer telemetry.`,
      ja: `Helicone base_url 置換で API 全追跡；${nodeId} は proxy テレメトリ。`,
    },
    {
      zh: `Helicone cost_usd 是 EvaluationCostMetric 类信号；Execution 是有界 run；${nodeId} 不能把 proxy log 直接当 PROV Activity 完成态。`,
      en: `Helicone cost_usd is EvaluationCostMetric-like signal; Execution is bounded run; ${nodeId} must not treat proxy log as completed PROV Activity.`,
      ja: `Helicone cost は cost metric；Execution 完了态と混同不可。`,
    },
    {
      zh: `未经过 Helicone gateway 的本地 mock 响应不能作为 Helicone 式 ${nodeId} TraceRecord。`,
      en: `Local mock response bypassing Helicone gateway cannot serve as Helicone-style ${nodeId} TraceRecord.`,
      ja: `gateway 迂回 mock は Helicone 式 ${nodeId} ではない。`,
    },
    {
      zh: `Helicone 实例：request_id=hc-771 latency_ms=842 cost_usd=0.003 model=gpt-4o → 映射 ${nodeId} execution_id=hc-771。`,
      en: `Helicone instance: request_id=hc-771 latency_ms=842 cost_usd=0.003 model=gpt-4o → maps to ${nodeId} execution_id=hc-771.`,
      ja: `Helicone 实例 request_id+cost が ${nodeId} Execution に写像。`,
    },
  ),
  vllm: kindMap(
    {
      zh: `vLLM 推理引擎：python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3-8B；PagedAttention + continuous batching；${nodeId} 映射 RuntimeEnvironment/Execution/GenerativeModel 的高吞吐 serving。`,
      en: `vLLM inference engine: python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3-8B; PagedAttention + continuous batching; ${nodeId} maps RuntimeEnvironment/Execution/GenerativeModel high-throughput serving.`,
      ja: `vLLM api_server PagedAttention continuous batching；${nodeId} は serving 環境。`,
    },
    {
      zh: `vLLM batch scheduler 队列是 RuntimeEnvironment 内部状态；单次 POST /v1/chat/completions 是 Execution；${nodeId} 保持环境与执行边界。`,
      en: `vLLM batch scheduler queue is RuntimeEnvironment internal state; single POST /v1/chat/completions is Execution; ${nodeId} preserves environment vs execution boundary.`,
      ja: `vLLM scheduler は環境状態；単 API 呼び出しは Execution。`,
    },
    {
      zh: `无 model id 与 OpenAI-compatible endpoint 的裸 Python 脚本不能作为 vLLM 式 ${nodeId} RuntimeEnvironment。`,
      en: `Bare Python script without model id and OpenAI-compatible endpoint cannot serve as vLLM-style ${nodeId} RuntimeEnvironment.`,
      ja: `model/endpoint 欠落脚本は vLLM 式 ${nodeId} ではない。`,
    },
    {
      zh: `vLLM 实例：env_id=vllm-llama3-8b endpoint=http://127.0.0.1:8000/v1 model=meta-llama/Llama-3-8B → 映射 ${nodeId}。`,
      en: `vLLM instance: env_id=vllm-llama3-8b endpoint=http://127.0.0.1:8000/v1 model=meta-llama/Llama-3-8B → maps to ${nodeId}.`,
      ja: `vLLM 实例 api_server+model が ${nodeId} RuntimeEnvironment に写像。`,
    },
  ),
  ollama: kindMap(
    {
      zh: `Ollama 本地推理：ollama run llama3、ollama serve；API POST /api/chat {"model":"llama3","messages":[...]}；${nodeId} 映射 RuntimeEnvironment/LocalExecution/ModelActor 的本地模型运行时。`,
      en: `Ollama local inference: ollama run llama3, ollama serve; API POST /api/chat {"model":"llama3","messages":[...]}; ${nodeId} maps RuntimeEnvironment/LocalExecution/ModelActor local model runtime.`,
      ja: `Ollama ollama serve POST /api/chat model=llama3；${nodeId} はローカル runtime。`,
    },
    {
      zh: `Ollama model manifest 是 RuntimeEnvironment 配置；单次 chat completion 是 Execution；${nodeId} 不能把 Modelfile 路径当 Execution 结果。`,
      en: `Ollama model manifest is RuntimeEnvironment config; single chat completion is Execution; ${nodeId} must not treat Modelfile path as Execution result.`,
      ja: `Ollama manifest は環境設定；chat completion は Execution。`,
    },
    {
      zh: `无 model 字段与 messages 数组的 shell echo 不能作为 Ollama 式 ${nodeId} Execution。`,
      en: `Shell echo without model field and messages array cannot serve as Ollama-style ${nodeId} Execution.`,
      ja: `model/messages 欠落 echo は Ollama 式 ${nodeId} ではない。`,
    },
    {
      zh: `Ollama 实例：POST /api/chat model=llama3 messages=[{role:user,content:"Hi"}] → 映射 ${nodeId} execution_id=ollama-chat-12。`,
      en: `Ollama instance: POST /api/chat model=llama3 messages=[{role:user,content:"Hi"}] → maps to ${nodeId} execution_id=ollama-chat-12.`,
      ja: `Ollama 实例 /api/chat model=llama3 が ${nodeId} Execution に写像。`,
    },
  ),
};

export const NODE_SOURCE_MAP = {
  TraceSpan: ['opentelemetry', 'langsmith', 'langfuse'],
  TraceRecord: ['langsmith', 'langfuse', 'helicone', 'opentelemetry'],
  TraceEvent: ['opentelemetry', 'langfuse', 'arize_phoenix'],
  TraceContext: ['opentelemetry', 'langsmith', 'langfuse'],
  TraceLink: ['opentelemetry', 'langfuse', 'langsmith'],
  ObservabilityEvent: ['opentelemetry', 'langfuse', 'arize_phoenix'],
  TelemetryEvent: ['opentelemetry', 'arize_phoenix', 'helicone'],
  Execution: ['w3c_prov', 'opentelemetry', 'helicone', 'langsmith'],
  RunAttempt: ['w3c_prov', 'langsmith', 'helicone', 'opentelemetry'],
  RetryActivity: ['w3c_prov', 'opentelemetry', 'langsmith'],
  RuntimeBudget: ['opentelemetry', 'helicone', 'vllm'],
  RuntimeEnvironment: ['vllm', 'ollama', 'w3c_prov'],
  Container: ['vllm', 'ollama', 'w3c_prov'],
  ProcessHandle: ['w3c_prov', 'opentelemetry', 'vllm'],
  WorkingDirectory: ['w3c_prov', 'ollama', 'vllm'],
  GenerativeModel: ['vllm', 'ollama', 'helicone'],
  ModelActor: ['vllm', 'ollama', 'helicone'],
  EmbeddingModel: ['vllm', 'arize_phoenix', 'ollama'],
  AgentActor: ['w3c_prov', 'langsmith', 'langfuse'],
  ObservableSummary: ['arize_phoenix', 'opentelemetry', 'helicone'],
  AgentTranscript: ['langfuse', 'langsmith', 'w3c_prov'],
  Checkpoint: ['w3c_prov', 'langsmith', 'opentelemetry'],
  StateSnapshot: ['w3c_prov', 'langsmith', 'opentelemetry'],
  StateRecord: ['w3c_prov', 'opentelemetry', 'langfuse'],
  Artifact: ['w3c_prov', 'opentelemetry', 'langsmith'],
  ExportArtifact: ['w3c_prov', 'opentelemetry', 'langsmith'],
  RuntimeSession: ['w3c_prov', 'langsmith', 'opentelemetry'],
};

export const MODULE_SOURCE_MAP = {
  'runtime-observability': ['opentelemetry', 'langsmith', 'langfuse', 'arize_phoenix'],
  'runtime-execution-attempts': ['w3c_prov', 'opentelemetry', 'helicone', 'langsmith'],
  'runtime-system': ['vllm', 'ollama', 'w3c_prov', 'opentelemetry'],
  'runtime-actors': ['w3c_prov', 'vllm', 'ollama', 'helicone'],
  'runtime-artifacts': ['w3c_prov', 'opentelemetry', 'langsmith'],
  'runtime-plane': ['w3c_prov', 'opentelemetry', 'langsmith', 'langfuse'],
};

export function getModuleKey(relativePath) {
  const norm = relativePath.replace(/\\/g, '/');
  for (const key of Object.keys(MODULE_SOURCE_MAP)) {
    if (norm.includes(key)) return key;
  }
  return 'runtime-plane';
}

export function getSourcesForNode(nodeId, moduleKey) {
  if (NODE_SOURCE_MAP[nodeId]) return NODE_SOURCE_MAP[nodeId].slice(0, 4);
  return (MODULE_SOURCE_MAP[moduleKey] || MODULE_SOURCE_MAP['runtime-plane']).slice(0, 4);
}

export function generateDescription(sourceId, ctx) {
  const fn = SOURCE_TEMPLATES[sourceId];
  if (!fn) throw new Error(`Unknown source: ${sourceId}`);
  return fn(ctx);
}
