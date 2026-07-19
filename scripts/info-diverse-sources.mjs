/** Authoritative source catalog for info-plane example description upgrades. */

export const SOURCE_IDS = [
  'attention',
  'outlines',
  'vercel_ai_sdk',
  'instructor',
  'perplexity',
  'claude_citations',
  'dspy_signatures',
];

function kindMap(positive, boundary, counterexample, instance) {
  return ({ nodeId, kind }) => {
    const base = { positive, boundary, counterexample, instance };
    return base[kind] || base.positive;
  };
}

export const SOURCE_TEMPLATES = {
  attention: kindMap(
    {
      zh: `Attention Is All You Need (Vaswani et al., 2017)：Self-attention Q/K/V 矩阵 scaled dot-product attention；上下文窗口是 transformer 序列建模基础；${nodeId} 映射 ContentPart/ContextWindow 的 token 边界与序列语义。`,
      en: `Attention Is All You Need (Vaswani et al., 2017): self-attention Q/K/V scaled dot-product attention; context window is transformer sequence modeling foundation; ${nodeId} maps ContentPart/ContextWindow token boundaries and sequence semantics.`,
      ja: `Attention Is All You Need self-attention Q/K/V；${nodeId} は context/token 境界。`,
    },
    {
      zh: `Transformer 上下文长度是模型/runtime 约束；${nodeId} 记录信息结构边界，不能把 KV cache 内部状态当 SourceReference。`,
      en: `Transformer context length is model/runtime constraint; ${nodeId} records information-structure boundary—KV cache internal state is not SourceReference.`,
      ja: `context 長は制約；KV cache は SourceReference ではない。`,
    },
    {
      zh: `无 sequence_index 或 token/char 边界的裸文本块不能作为 attention 式 ${nodeId} 上下文片段。`,
      en: `Bare text block without sequence_index or token/char boundary cannot serve as attention-style ${nodeId} context segment.`,
      ja: `境界欠落テキストは attention 式 ${nodeId} として拒否。`,
    },
    {
      zh: `Attention 实例：max_context_tokens=8192 sequence_index=42 content_part_id=txt-771 → 映射 ${nodeId} 在窗口内可寻址片段。`,
      en: `Attention instance: max_context_tokens=8192 sequence_index=42 content_part_id=txt-771 → maps to ${nodeId} addressable in-window segment.`,
      ja: `Attention 实例 max_context_tokens+sequence_index が ${nodeId} に写像。`,
    },
  ),
  outlines: kindMap(
    {
      zh: `Outlines (Willard & Louf, 2023) 有限状态机约束生成：model.generate(prompt, regex=r"\\d{3}-\\d{2}-\\d{4}") 或 JSON schema；${nodeId} 映射 StructuredContent/OutputFormat 的 guided generation 边界。`,
      en: `Outlines (Willard & Louf, 2023) FSM-constrained generation: model.generate(prompt, regex=r"\\d{3}-\\d{2}-\\d{4}") or JSON schema; ${nodeId} maps StructuredContent/OutputFormat guided generation boundary.`,
      ja: `Outlines FSM/regex 制約生成；${nodeId} は StructuredContent。`,
    },
    {
      zh: `Outlines 约束是 OutputFormat 规范；模型原始 token 流是 StreamingOutput；${nodeId} 不能把未验证 JSON 当 StructuredData。`,
      en: `Outlines constraint is OutputFormat spec; raw model token stream is StreamingOutput; ${nodeId} must not treat unvalidated JSON as StructuredData.`,
      ja: `Outlines 制約は spec；未検証 JSON は StructuredData ではない。`,
    },
    {
      zh: `无 schema/regex 约束的自由文本输出不能作为 Outlines 式 ${nodeId} StructuredData。`,
      en: `Free-form text output without schema/regex constraint cannot serve as Outlines-style ${nodeId} StructuredData.`,
      ja: `schema/regex なし自由文は Outlines 式 ${nodeId} ではない。`,
    },
    {
      zh: `Outlines 实例：regex SSN pattern → output "123-45-6789" validated → 映射 ${nodeId} StructuredData schema_ref=ssn-regex-v1。`,
      en: `Outlines instance: regex SSN pattern → output "123-45-6789" validated → maps to ${nodeId} StructuredData schema_ref=ssn-regex-v1.`,
      ja: `Outlines 实例 regex 検証出力が ${nodeId} StructuredData に写像。`,
    },
  ),
  vercel_ai_sdk: kindMap(
    {
      zh: `Vercel AI SDK 流式输出：const { textStream } = await streamText({model: openai("gpt-4"), prompt:"..."})；for await (const chunk of textStream) process.stdout.write(chunk)；${nodeId} 映射 StreamingOutput/OutputRepresentation 增量 token 流。`,
      en: `Vercel AI SDK streaming: const { textStream } = await streamText({model: openai("gpt-4"), prompt:"..."}); for await (const chunk of textStream) process.stdout.write(chunk); ${nodeId} maps StreamingOutput/OutputRepresentation incremental token stream.`,
      ja: `Vercel AI SDK streamText textStream chunk；${nodeId} は StreamingOutput。`,
    },
    {
      zh: `textStream chunk 是 OutputSegment 运行时事件；完整 AssistantMessage 是终止态；${nodeId} 不能把 partial delta 当最终 Message。`,
      en: `textStream chunk is OutputSegment runtime event; complete AssistantMessage is terminal state; ${nodeId} must not treat partial delta as final Message.`,
      ja: `textStream chunk は segment；partial delta は final Message ではない。`,
    },
    {
      zh: `无 stream 协议与 chunk index 的一次性 HTTP 响应体不能作为 Vercel AI SDK 式 ${nodeId} StreamingOutput。`,
      en: `One-shot HTTP response body without stream protocol and chunk index cannot serve as Vercel AI SDK-style ${nodeId} StreamingOutput.`,
      ja: `chunk index 欠落 HTTP は Vercel AI SDK 式 ${nodeId} ではない。`,
    },
    {
      zh: `Vercel AI SDK 实例：streamText → chunk_0="Hel" chunk_1="lo" → 映射 ${nodeId} OutputSegment sequence_index=0,1。`,
      en: `Vercel AI SDK instance: streamText → chunk_0="Hel" chunk_1="lo" → maps to ${nodeId} OutputSegment sequence_index=0,1.`,
      ja: `Vercel AI SDK 实例 stream chunk が ${nodeId} OutputSegment に写像。`,
    },
  ),
  instructor: kindMap(
    {
      zh: `Instructor 结构化输出：client = instructor.from_openai(OpenAI())；user = client.chat.completions.create(response_model=User, messages=[...])；Pydantic response_model 验证；${nodeId} 映射 StructuredContent/OutputFormat 的类型安全解析。`,
      en: `Instructor structured output: client = instructor.from_openai(OpenAI()); client.chat.completions.create(response_model=User, messages=[...]); Pydantic response_model validation; ${nodeId} maps StructuredContent/OutputFormat type-safe parsing.`,
      ja: `Instructor from_openai response_model=User Pydantic；${nodeId} は StructuredContent。`,
    },
    {
      zh: `Instructor response_model 是 OutputFormat 规范；chat completion raw JSON 是 wire 形态；${nodeId} 记录验证后结构化实体。`,
      en: `Instructor response_model is OutputFormat spec; chat completion raw JSON is wire form; ${nodeId} records validated structured entity.`,
      ja: `response_model は spec；raw JSON は wire 形态。`,
    },
    {
      zh: `无 response_model 且未通过 schema 验证的 JSON 字符串不能作为 Instructor 式 ${nodeId} StructuredData。`,
      en: `JSON string without response_model and schema validation cannot serve as Instructor-style ${nodeId} StructuredData.`,
      ja: `response_model/validation 欠落 JSON は Instructor 式 ${nodeId} ではない。`,
    },
    {
      zh: `Instructor 实例：response_model=User {name, age} → validated object → 映射 ${nodeId} StructuredData content_type=application/json。`,
      en: `Instructor instance: response_model=User {name, age} → validated object → maps to ${nodeId} StructuredData content_type=application/json.`,
      ja: `Instructor 实例 validated User が ${nodeId} StructuredData に写像。`,
    },
  ),
  perplexity: kindMap(
    {
      zh: `Perplexity 搜索+引文：回答内联 [1] 链接到搜索结果来源；citations[] 含 url/snippet；${nodeId} 映射 Citation/SourceReference 的可点击来源锚点。`,
      en: `Perplexity search+citations: inline [1] links to search result sources; citations[] with url/snippet; ${nodeId} maps Citation/SourceReference clickable source anchors.`,
      ja: `Perplexity インライン [1]+citations[] url；${nodeId} は Citation/SourceReference。`,
    },
    {
      zh: `Perplexity [1] 是 CitationAnchor；完整 SourceReference 需 url+digest；${nodeId} 不能把模型幻觉 URL 当已验证来源。`,
      en: `Perplexity [1] is CitationAnchor; full SourceReference needs url+digest; ${nodeId} must not treat hallucinated URL as verified source.`,
      ja: `[1] は CitationAnchor；hallucinated URL は verified source ではない。`,
    },
    {
      zh: `无 citations 数组与 url 的内联编号 [1] 不能作为 Perplexity 式 ${nodeId} SourceReference。`,
      en: `Inline [1] without citations array and url cannot serve as Perplexity-style ${nodeId} SourceReference.`,
      ja: `citations/url 欠落 [1] は Perplexity 式 ${nodeId} として拒否。`,
    },
    {
      zh: `Perplexity 实例：answer "... [1]" citations=[{url:"https://arxiv.org/abs/1706.03762", snippet:"Attention..."}] → 映射 ${nodeId} CitationAnchor index=1。`,
      en: `Perplexity instance: answer "... [1]" citations=[{url:"https://arxiv.org/abs/1706.03762"}] → maps to ${nodeId} CitationAnchor index=1.`,
      ja: `Perplexity 实例 citations[1] url が ${nodeId} CitationAnchor に写像。`,
    },
  ),
  claude_citations: kindMap(
    {
      zh: `Claude Citations API：citations: [{type:"char_location", cited_text:"...", document_index:0, start_char_index:10, end_char_index:50}]；支持 document/URL/plain text 来源；${nodeId} 映射 Citation/ContentAnchor/SourceProvenance 字符级锚点。`,
      en: `Claude Citations API: citations [{type:"char_location", cited_text:"...", document_index:0, start_char_index:10, end_char_index:50}]; supports document/URL/plain text sources; ${nodeId} maps Citation/ContentAnchor/SourceProvenance char-level anchors.`,
      ja: `Claude Citations char_location start/end_char_index；${nodeId} は ContentAnchor。`,
    },
    {
      zh: `Claude char_location 是 ContentAnchor；SourceProvenance 记录 attribution 链；${nodeId} 不能把 document_index  alone 当完整 SourceReference。`,
      en: `Claude char_location is ContentAnchor; SourceProvenance records attribution chain; ${nodeId} must not treat document_index alone as full SourceReference.`,
      ja: `char_location は ContentAnchor；document_index のみでは SourceReference 不完整。`,
    },
    {
      zh: `无 start_char_index/end_char_index 的 cited_text 摘要不能作为 Claude Citations 式 ${nodeId} ContentAnchor。`,
      en: `cited_text summary without start_char_index/end_char_index cannot serve as Claude Citations-style ${nodeId} ContentAnchor.`,
      ja: `char index 欠落 cited_text は Claude Citations 式 ${nodeId} として拒否。`,
    },
    {
      zh: `Claude Citations 实例：type=char_location document_index=0 start=10 end=50 cited_text="self-attention" → 映射 ${nodeId} ContentAnchor。`,
      en: `Claude Citations instance: type=char_location document_index=0 start=10 end=50 cited_text="self-attention" → maps to ${nodeId} ContentAnchor.`,
      ja: `Claude Citations 实例 char_location が ${nodeId} ContentAnchor に写像。`,
    },
  ),
  dspy_signatures: kindMap(
    {
      zh: `DSPy Signatures 声明式指令："context, question -> answer"；class RAGAnswer(dspy.Signature): context=dspy.InputField(); question=dspy.InputField(); answer=dspy.OutputField()；${nodeId} 映射 PromptTemplate/SystemInstruction/PromptVariable 的可组合字段契约。`,
      en: `DSPy Signatures declarative instruction: "context, question -> answer"; class RAGAnswer(dspy.Signature) with InputField/OutputField; ${nodeId} maps PromptTemplate/SystemInstruction/PromptVariable composable field contracts.`,
      ja: `DSPy Signature context, question -> answer InputField/OutputField；${nodeId} は PromptTemplate。`,
    },
    {
      zh: `DSPy Signature 是 PromptTemplate 规范；compiled prompt 字符串是运行时实例；${nodeId} 不能把 optimized demo 文本当 SystemInstruction 权威源。`,
      en: `DSPy Signature is PromptTemplate spec; compiled prompt string is runtime instance; ${nodeId} must not treat optimized demo text as SystemInstruction authority source.`,
      ja: `Signature は spec；compiled prompt は runtime 实例。`,
    },
    {
      zh: `无 InputField/OutputField 声明的 ad-hoc prompt 字符串不能作为 DSPy 式 ${nodeId} PromptTemplate。`,
      en: `Ad-hoc prompt string without InputField/OutputField declaration cannot serve as DSPy-style ${nodeId} PromptTemplate.`,
      ja: `InputField/OutputField 欠落 prompt は DSPy 式 ${nodeId} ではない。`,
    },
    {
      zh: `DSPy 实例：Signature "context, question -> answer" → PromptTemplate template_id=rag-answer-v1 → 映射 ${nodeId} variable_names=[context, question]。`,
      en: `DSPy instance: Signature "context, question -> answer" → PromptTemplate template_id=rag-answer-v1 → maps to ${nodeId} variable_names=[context, question].`,
      ja: `DSPy 实例 Signature→PromptTemplate が ${nodeId} variable_names に写像。`,
    },
  ),
};

export const NODE_SOURCE_MAP = {
  ContentPart: ['attention', 'vercel_ai_sdk', 'claude_citations'],
  TextContent: ['attention', 'vercel_ai_sdk', 'perplexity'],
  StructuredData: ['instructor', 'outlines', 'dspy_signatures'],
  StructuredDataBlock: ['instructor', 'outlines', 'dspy_signatures'],
  ImageContent: ['attention', 'claude_citations', 'vercel_ai_sdk'],
  SourceReference: ['perplexity', 'claude_citations', 'attention'],
  CitationAnchor: ['perplexity', 'claude_citations', 'attention'],
  ContentAnchor: ['claude_citations', 'perplexity', 'attention'],
  SourceProvenance: ['claude_citations', 'perplexity', 'attention'],
  OutputCitation: ['perplexity', 'claude_citations', 'attention'],
  PromptTemplate: ['dspy_signatures', 'instructor', 'vercel_ai_sdk'],
  PromptTemplateInstance: ['dspy_signatures', 'instructor', 'vercel_ai_sdk'],
  SystemInstruction: ['dspy_signatures', 'instructor', 'attention'],
  PromptArgument: ['dspy_signatures', 'instructor', 'vercel_ai_sdk'],
  FewShotExample: ['dspy_signatures', 'instructor', 'attention'],
  Instruction: ['dspy_signatures', 'instructor', 'attention'],
  OutputSegment: ['vercel_ai_sdk', 'attention', 'outlines'],
  StandardOutput: ['vercel_ai_sdk', 'attention', 'outlines'],
  OutputChunk: ['vercel_ai_sdk', 'attention', 'outlines'],
  MessageHistory: ['attention', 'vercel_ai_sdk', 'claude_citations'],
  Conversation: ['attention', 'vercel_ai_sdk', 'dspy_signatures'],
  UserMessage: ['attention', 'vercel_ai_sdk', 'dspy_signatures'],
  AssistantMessage: ['vercel_ai_sdk', 'instructor', 'attention'],
  SourceSpan: ['claude_citations', 'perplexity', 'attention'],
  SourceLocation: ['claude_citations', 'perplexity', 'attention'],
  SourceRange: ['claude_citations', 'perplexity', 'attention'],
  TextDocumentReference: ['perplexity', 'claude_citations', 'attention'],
  HttpResourceReference: ['perplexity', 'claude_citations', 'attention'],
};

export const MODULE_SOURCE_MAP = {
  'info-prompts-instructions': ['dspy_signatures', 'instructor', 'vercel_ai_sdk', 'attention'],
  'info-storage-sources': ['perplexity', 'claude_citations', 'attention'],
  'info-output-disclosure': ['vercel_ai_sdk', 'perplexity', 'claude_citations'],
  'info-content-parts': ['attention', 'instructor', 'outlines'],
  'info-content-block-modality': ['attention', 'outlines', 'instructor'],
  'info-container-command': ['vercel_ai_sdk', 'outlines', 'attention'],
  'info-messages-instructions': ['attention', 'vercel_ai_sdk', 'claude_citations'],
  'info-indexing': ['perplexity', 'attention', 'dspy_signatures'],
  'info-plane': ['attention', 'vercel_ai_sdk', 'claude_citations', 'dspy_signatures'],
};

export function getModuleKey(relativePath) {
  const norm = relativePath.replace(/\\/g, '/');
  for (const key of Object.keys(MODULE_SOURCE_MAP)) {
    if (norm.includes(key)) return key;
  }
  return 'info-plane';
}

export function getSourcesForNode(nodeId, moduleKey) {
  if (NODE_SOURCE_MAP[nodeId]) return NODE_SOURCE_MAP[nodeId].slice(0, 4);
  return (MODULE_SOURCE_MAP[moduleKey] || MODULE_SOURCE_MAP['info-plane']).slice(0, 4);
}

export function generateDescription(sourceId, ctx) {
  const fn = SOURCE_TEMPLATES[sourceId];
  if (!fn) throw new Error(`Unknown source: ${sourceId}`);
  return fn(ctx);
}
