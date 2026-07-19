# Deep-rewrite info-plane example descriptions with API-specific content.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$InfoPlane = Join-Path $Root 'ontology\info-plane'
$UpgradesPath = Join-Path $Root 'scripts\info-plane-example-upgrades.json'
$SummaryPath = Join-Path $Root 'docs\info-plane-example-upgrade-summary.json'

$Upgrades = $null
if (Test-Path $UpgradesPath) {
    $Upgrades = (Get-Content -Raw -Path $UpgradesPath -Encoding UTF8 | ConvertFrom-Json).nodes
}

function Get-ModuleKey([string]$RelativePath) {
    if ($RelativePath -match 'info-messages-instructions') { return 'messages' }
    if ($RelativePath -match 'info-prompts-instructions') { return 'prompts' }
    if ($RelativePath -match 'info-content-parts') { return 'content-parts' }
    if ($RelativePath -match 'info-content-block-modality') { return 'content-blocks' }
    if ($RelativePath -match 'info-storage-sources') { return 'storage-sources' }
    if ($RelativePath -match 'info-output-disclosure') { return 'output-disclosure' }
    if ($RelativePath -match 'info-container-command') { return 'container-command' }
    if ($RelativePath -match 'info-indexing') { return 'indexing' }
    return 'info-plane'
}

function Escape-YamlDoubleQuoted([string]$Text) {
    if ($null -eq $Text) { return '""' }
    return '"' + ($Text -replace '\\', '\\\\' -replace '"', '\"') + '"'
}

function Parse-LocalizedBlock([string]$Block) {
    $result = @{ zh = ''; en = ''; ja = '' }
    foreach ($lang in @('zh', 'en', 'ja')) {
        if ($Block -match "(?ms)^\s*${lang}:\s*(.+?)(?=^\s*(?:zh|en|ja):|\z)") {
            $result[$lang] = $Matches[1].Trim()
        }
    }
    return $result
}

function Parse-FieldValues([string]$Block) {
    $fieldValues = [ordered]@{}
    if ($Block -match '(?m)^    field_values:\s*\{(.+)\}\s*$') {
        foreach ($part in ($Matches[1] -split ',\s*(?=[A-Za-z0-9_@]+:)')) {
            if ($part -match '^([A-Za-z0-9_@]+):\s*(.+)$') { $fieldValues[$Matches[1]] = $Matches[2].Trim() }
        }
    }
    elseif ($Block -match '(?ms)^    field_values:\s*\n((?:      .+\n)+)') {
        foreach ($line in ($Matches[1] -split '\n')) {
            if ($line -match '^\s{6}([A-Za-z0-9_@]+):\s*(.+)$') { $fieldValues[$Matches[1]] = $Matches[2].Trim() }
        }
    }
    return $fieldValues
}

function Get-OverrideDescription([string]$NodeId, [string]$ExampleId) {
    if (-not $Upgrades) { return $null }
    if ($Upgrades.PSObject.Properties.Name -contains $NodeId) {
        $node = $Upgrades.$NodeId
        if ($node.PSObject.Properties.Name -contains $ExampleId) { return $node.$ExampleId }
    }
    return $null
}

function Needs-Rewrite([hashtable]$Descriptions) {
    $zh = [string]$Descriptions.zh
    if ($zh -match 'OpenAI multimodal content type|典型 API|Positive case|Counterexample|Boundary case') { return $true }
    if ($zh -notmatch '/v1/|POST |GET |SSE|data:|prompts/|content_block|input_text|image_url|stream=True|Elasticsearch|Pinecone|Docker|LangChain|ChatPromptTemplate|char_location|ETag|Content-Digest|prov:|input_audio|input_image|input_file|tool_calls|thread_id|BM25|cosine|stdout|stderr|exit_code|JSON-RPC|SendMessage|previous_response_id|role:|mimeType|file_id|base64|Responses API|Anthropic|Chat Completions|Whisper|PROV-O|LangGraph|DSPy|npm test|docker exec|resource_link|CallToolResult|prompts/list|prompts/get|json_schema|one-of|IIIF|WAV|invalid_request_error|content_block_delta|delta\.content') {
        return $true
    }
    return $false
}

function Build-DeepDescription(
    [string]$NodeId,
    [string]$ExampleId,
    [int]$ExampleIndex,
    [hashtable]$Descriptions,
    [hashtable]$Labels,
    [hashtable]$FieldValues,
    [string]$ModuleKey,
    [string[]]$EngineeringFormats
) {
    $override = Get-OverrideDescription -NodeId $NodeId -ExampleId $ExampleId
    if ($override) { return @{ zh = $override.zh; en = $override.en; ja = $override.ja } }
    if (-not (Needs-Rewrite $Descriptions)) { return $Descriptions }

    $fv = $FieldValues
    $id = $ExampleId.ToLowerInvariant()
    $shape = if ($EngineeringFormats.Count -gt 0) { $EngineeringFormats[0] } else { '' }

    if ($NodeId -eq 'AudioContent') {
        if ($id -match 'openai-wav') {
            return @{
                zh = 'OpenAI Chat Completions POST /v1/chat/completions 的 messages[].content 可含 type=input_audio、input_audio.data=<base64 WAV>、input_audio.format=wav；gpt-4o-audio-preview 等音频模型读取 format 与 data 解码 WAV 字节。'
                en = 'OpenAI Chat Completions POST /v1/chat/completions messages[].content may include type=input_audio with input_audio.data=<base64 WAV> and input_audio.format=wav; gpt-4o-audio-preview decodes format and data.'
                ja = 'OpenAI Chat Completions POST /v1/chat/completions の messages[].content は type=input_audio/input_audio.data/input_audio.format=wav を含み得る。'
            }
        }
        if ($id -match 'no-format') {
            return @{
                zh = '调用方在 POST /v1/chat/completions 发送 type=input_audio、input_audio.data=UklGR... 但省略 input_audio.format；OpenAI 音频文档要求 format=wav|mp3，缺失时返回 400 invalid_request_error。'
                en = 'Caller sends type=input_audio with input_audio.data on POST /v1/chat/completions but omits input_audio.format; OpenAI audio docs require format wav|mp3 or return 400 invalid_request_error.'
                ja = 'POST /v1/chat/completions で format を省略した input_audio は OpenAI 仕様違反となり 400 になり得る。'
            }
        }
        if ($id -match 'transcript') {
            return @{
                zh = 'Whisper API POST /v1/audio/transcriptions 对 audio-42 的 WAV 返回 text=The meeting starts at nine；Moonweave 新建 TextContent text-transcript-42，保留源 AudioContent audio-42。'
                en = 'Whisper API POST /v1/audio/transcriptions on WAV audio-42 returns text The meeting starts at nine; Moonweave creates TextContent text-transcript-42 preserving AudioContent audio-42.'
                ja = 'Whisper POST /v1/audio/transcriptions が WAV から文字起こしを返し、源 AudioContent を保持する。'
            }
        }
        if ($id -match 'mcp') {
            return @{
                zh = 'MCP Prompts 2025-11-25 prompts/get 返回 PromptMessage content type=audio、data=<base64>、mimeType=audio/wav；与 OpenAI input_audio 不同，MCP 使用顶层 mimeType 而非 format。'
                en = 'MCP Prompts 2025-11-25 prompts/get returns PromptMessage content type=audio data=<base64> mimeType=audio/wav; unlike OpenAI input_audio MCP uses top-level mimeType not format.'
                ja = 'MCP prompts/get は type=audio/mimeType=audio/wav を返す。OpenAI input_audio とはフィールド位置が異なる。'
            }
        }
    }

    if ($NodeId -eq 'ImageContent') {
        if ($id -match 'openai-url') {
            return @{
                zh = 'OpenAI Responses API POST /v1/responses 的 input 含 role=user、content 数组并列 type=input_text 与 type=input_image(image_url=NGA IIIF JPEG)；vision 模型并行处理文本与图像。'
                en = 'OpenAI Responses POST /v1/responses input role=user with content array pairing type=input_text and type=input_image image_url NGA IIIF JPEG; vision model processes both.'
                ja = 'OpenAI Responses POST /v1/responses で input_text と input_image image_url を同一 user message に並置する。'
            }
        }
        if ($id -match 'mixed-source') {
            return @{
                zh = '调用方在同一 Responses input_image 项同时设置 image_url 与 file_id=file-vision-42；OpenAI 只允许 image_url 或 file_id 之一，混用导致校验失败。'
                en = 'Caller sets both image_url and file_id=file-vision-42 in one Responses input_image item; OpenAI allows only one source per input_image.'
                ja = '同一 input_image に image_url と file_id を同時設定すると OpenAI 検証に失敗する。'
            }
        }
        if ($id -match 'a2a') {
            return @{
                zh = 'A2A v1 SendMessage parts 使用 url 分支、filename=chart.png、mediaType=image/png 承载图像；A2A 无 input_image 线格式类型。'
                en = 'A2A v1 SendMessage parts use url branch filename chart.png mediaType image/png; A2A has no input_image wire type.'
                ja = 'A2A SendMessage は url 分岐と mediaType=image/png で画像を運ぶ。'
            }
        }
        if ($id -match 'mcp') {
            return @{
                zh = 'Anthropic POST /v1/messages 可用 type=image、source.type=base64、media_type=image/png；MCP PromptMessage 等价 type=image、data=<base64>、mimeType=image/png（prompts/get 2025-11-25）。'
                en = 'Anthropic POST /v1/messages type=image source base64 media_type image/png; MCP equivalent type=image data=<base64> mimeType=image/png from prompts/get 2025-11-25.'
                ja = 'Anthropic image block と MCP Image Content は base64+MIME で同等だがフィールド名が異なる。'
            }
        }
    }

    if ($NodeId -eq 'FileAttachment') {
        if ($id -match 'mcp-tool|resource') {
            return @{
                zh = 'MCP tools/call 返回 CallToolResult content type=resource_link、uri=https://example.com/doc.pdf、name=report.pdf、mimeType=application/pdf（Tools 2025-11-25）；客户端用 uri 拉取 PDF。'
                en = 'MCP tools/call CallToolResult content type=resource_link uri name mimeType application/pdf Tools 2025-11-25; client fetches PDF from uri.'
                ja = 'MCP tools/call の resource_link が uri/name/mimeType で PDF を指す。'
            }
        }
        if ($id -match 'raw-and-url') {
            return @{
                zh = 'A2A Part 违反 one-of：同一 Part 同时含 raw=JVBERi0... 与 url=https://example.com/doc.pdf；A2A 4.1.6 要求 text|raw|url|data 恰选其一。'
                en = 'A2A Part violates one-of with both raw bytes and url in one Part; A2A 4.1.6 requires exactly one of text|raw|url|data.'
                ja = 'A2A Part で raw と url を同時設定すると one-of 制約違反。'
            }
        }
        if ($id -match 'openai-file-id') {
            return @{
                zh = 'OpenAI Files API POST /v1/files 上传 PDF 得 file_id=file-abc123；Responses input 使用 type=input_file、file_id=file-abc123，而非 A2A url 或 MCP resource_link。'
                en = 'OpenAI Files API POST /v1/files yields file_id; Responses input type=input_file file_id=file-abc123 not A2A url or MCP resource_link.'
                ja = 'OpenAI Files API の file_id を Responses input_file で参照する。'
            }
        }
        if ($id -match 'pdf-data|openai-pdf') {
            return @{
                zh = 'OpenAI Responses 支持 type=input_file、filename=report.pdf、file_data=<base64 PDF> 与 type=input_text 同条 message；file_data 大小受模型文档限制（通常 <32MB）。'
                en = 'OpenAI Responses inline type=input_file filename report.pdf file_data=<base64 PDF> plus type=input_text in one message; file_data size limited per model docs.'
                ja = 'Responses で input_file file_data を input_text と同じ message に inline 送信できる。'
            }
        }
        if ($id -match 'a2a' -and $id -notmatch 'raw') {
            return @{
                zh = 'A2A SendMessage 两个 Part：text=Summarize this report 与 url PDF(filename=report.pdf, mediaType=application/pdf)；文本与文件各占独立 Part。'
                en = 'A2A SendMessage two parts text instruction plus url PDF filename report.pdf mediaType application/pdf as separate FileAttachment projection.'
                ja = 'A2A SendMessage でテキスト Part と PDF url Part を分離する。'
            }
        }
    }

    if ($NodeId -eq 'StructuredData') {
        if ($id -match 'invoice|a2a-invoice') {
            return @{
                zh = 'A2A Artifact parts data 分支 JSON invoice_number=INV-9、total=1280.00、currency=USD、mediaType=application/json；结构化 Agent 输出不混入 text 分支。'
                en = 'A2A Artifact parts data branch JSON invoice_number INV-9 total 1280 USD mediaType application/json; structured output stays in data branch.'
                ja = 'A2A Artifact の data 分岐に JSON 請求書フィールドを載せる。'
            }
        }
        if ($id -match 'mixed') {
            return @{
                zh = '无效 A2A Part 同时写 text 与 data JSON；one-of 要求拆为 TextContent 与 StructuredData 两个 Part。'
                en = 'Invalid A2A Part mixes text and data payloads; one-of requires separate TextContent and StructuredData Parts.'
                ja = 'A2A Part で text と data を混在させてはならない。'
            }
        }
        if ($id -match 'tool-arguments|openai-tool') {
            return @{
                zh = 'OpenAI Chat Completions 返回 choices[0].message.tool_calls[0].function.arguments JSON location=Boston,unit=celsius；这是 tool 参数而非 user content part。'
                en = 'OpenAI Chat Completions returns tool_calls[0].function.arguments JSON location Boston unit celsius; tool args not user content parts.'
                ja = 'OpenAI tool_calls function.arguments は StructuredData 境界の tool 引数である。'
            }
        }
        if ($id -match 'array|a2a-array') {
            return @{
                zh = 'A2A Artifact data 可为 JSON 数组承载 rank/title 检索结果，mediaType=application/json；区别于 OpenAI response_format.type=json_schema 约束输出。'
                en = 'A2A Artifact data JSON array of ranked hits mediaType application/json; distinct from OpenAI response_format json_schema output.'
                ja = 'A2A data 配列は検索結果ランキングを運ぶ。OpenAI json_schema 出力とは別。'
            }
        }
    }

    if ($NodeId -eq 'ContentPart' -or $NodeId -eq 'info-content-parts') {
        if ($id -match 'a2a-text-and-file|pdf-file') {
            return @{
                zh = 'A2A v1 Message parts 数组含 text Part 与 url PDF Part(filename=doc.pdf, mediaType=application/pdf)；各 Part 满足 one-of 载荷分支。'
                en = 'A2A v1 Message parts array text Part plus url PDF Part each satisfying one-of payload branch.'
                ja = 'A2A Message が text Part と PDF url Part を別々に運ぶ。'
            }
        }
        if ($id -match 'untyped|blob') {
            return @{
                zh = '反模式 content:any=mixed 未声明 target_protocol，混放 OpenAI type=text、Anthropic image block 与 A2A data；ContentPart 要求 part_kind 与 target_protocol 显式后再投影。'
                en = 'Anti-pattern content any=mixed without target_protocol; ContentPart requires explicit part_kind and target_protocol before projection.'
                ja = 'target_protocol なしの混在 content は ContentPart 境界違反。'
            }
        }
        if ($id -match 'local-normalized') {
            return @{
                zh = '内部暂存 part_kind=image、target_protocol=local-normalized、payload.uri=<IIIF URL>；发送前投影为 OpenAI input_image 或 MCP Image Content。'
                en = 'Internal part_kind=image target_protocol=local-normalized before projecting to OpenAI input_image or MCP Image Content at send boundary.'
                ja = 'local-normalized 記述を送信前に OpenAI/MCP 形状へ投影する。'
            }
        }
        if ($id -match 'openai-image') {
            return @{
                zh = 'OpenAI Responses POST /v1/responses input role=user、content 含 type=input_text 与 type=input_image(image_url=IIIF URL)。'
                en = 'OpenAI Responses POST /v1/responses input user content input_text plus input_image IIIF URL.'
                ja = 'OpenAI Responses の input_text+input_image 多模态入力例。'
            }
        }
        if ($id -match 'mixed') {
            return @{
                zh = 'A2A Part one-of 违规：单 Part 含 text 与 url；应拆为两个 ContentPart 再 SendMessage。'
                en = 'A2A Part one-of violation single Part with text and url; split into two ContentParts before SendMessage.'
                ja = 'A2A Part の text+url 混在は one-of 違反。'
            }
        }
        if ($id -match 'transcript|local-transcript') {
            return @{
                zh = 'ASR 派生 TextContent 引用 source_part_id=audio-4；AudioContent 保留 WAV payload，转写不覆盖 audio bytes。'
                en = 'ASR-derived TextContent references source_part_id=audio-4; AudioContent keeps WAV payload.'
                ja = 'ASR 派生 TextContent は源 AudioContent を保持する。'
            }
        }
        if ($id -match 'mcp-image') {
            return @{
                zh = 'MCP prompts/get 返回 messages role=user、content type=image、data=<base64>、mimeType=image/png；PromptMessage.content 为单一内容 union。'
                en = 'MCP prompts/get messages user content type=image base64 mimeType image/png; PromptMessage.content single content union.'
                ja = 'MCP prompts/get の Image Content 単一 union 例。'
            }
        }
    }

    if ($ModuleKey -eq 'messages') {
        $role = switch ($NodeId) {
            'UserMessage' { 'user' }
            'AssistantMessage' { 'assistant' }
            'SystemMessage' { 'system' }
            'DeveloperMessage' { 'developer' }
            'ToolResultMessage' { 'tool' }
            default { [string]$fv.message_role }
        }
        if ($role) {
            $elem = if ($fv.element_id) { $fv.element_id } else { 'msg-' + $ExampleIndex }
            $conv = if ($fv.conversation_id) { $fv.conversation_id } else { 'conv-1' }
            $sender = if ($fv.sender_id) { $fv.sender_id } else { 'unknown' }
            if ($id -match 'invalid|counter|boundary' -or $Labels.en -match 'counter|invalid|boundary') {
                return @{
                    zh = "反例：无法映射为 $NodeId。OpenAI POST /v1/chat/completions 要求 messages[].role=$role 与合法 content；field_values 缺少 message 语义（conversation_id=$conv）。"
                    en = "Counterexample: cannot map to $NodeId. OpenAI POST /v1/chat/completions requires messages[].role=$role with valid content; field_values lack message semantics conversation_id=$conv."
                    ja = "反例：$NodeId にマップ不可。OpenAI messages role=$role 要件を満たさない conversation_id=$conv。"
                }
            }
            return @{
                zh = "OpenAI POST /v1/chat/completions messages[].role=$role 或 Anthropic POST /v1/messages 同 role；$NodeId element_id=$elem sender_id=$sender conversation_id=$conv；A2A 等价 SendMessage ROLE_$($role.ToUpper())。"
                en = "OpenAI POST /v1/chat/completions messages role=$role or Anthropic POST /v1/messages same role; $NodeId element_id=$elem sender_id=$sender conversation_id=$conv; A2A SendMessage ROLE_$($role.ToUpper())."
                ja = "OpenAI/Anthropic messages role=$role；$NodeId element_id=$elem conversation_id=$conv。"
            }
        }
        if ($NodeId -eq 'Conversation' -and -not (Needs-Rewrite $Descriptions)) { return $Descriptions }
        if ($NodeId -eq 'MessageHistory') {
            $conv = if ($fv.conversation_id) { $fv.conversation_id } else { 'conv-1' }
            return @{
                zh = "OpenAI Chat Completions 全量 messages 数组或 Anthropic messages 参数承载 history；MessageHistory 记录 conversation_id=$conv 有序 element 列表，等价 LangGraph checkpointer thread 快照。"
                en = "OpenAI Chat Completions messages array or Anthropic messages param holds history; MessageHistory records ordered elements for conversation_id=$conv like LangGraph thread snapshot."
                ja = "OpenAI messages 配列/Anthropic messages 参数が MessageHistory を構成する。"
            }
        }
        if ($NodeId -eq 'ConversationTurn') {
            return @{
                zh = '一轮含 user 与 assistant Message；OpenAI 多轮追加 messages 数组，Responses API 用 previous_response_id=resp_xxx 链接上一轮。'
                en = 'One turn pairs user and assistant Messages; OpenAI multi-turn appends messages; Responses API links via previous_response_id=resp_xxx.'
                ja = '一ターンは user/assistant Message 对；Responses は previous_response_id で链接。'
            }
        }
        if ($NodeId -eq 'ProtocolEnvelope') {
            return @{
                zh = 'MCP JSON-RPC 2.0 包络 jsonrpc=2.0 method=tools/call id=1 或 A2A SendMessage HTTP POST；ProtocolEnvelope 保留 wire protocol/version 不混入 Message content。'
                en = 'MCP JSON-RPC 2.0 envelope jsonrpc=2.0 method=tools/call or A2A SendMessage HTTP POST; ProtocolEnvelope keeps wire protocol separate from Message content.'
                ja = 'MCP JSON-RPC / A2A SendMessage が ProtocolEnvelope を形成する。'
            }
        }
        if ($NodeId -eq 'Message') {
            return @{
                zh = 'OpenAI ChatCompletionMessage 含 role、content、可选 tool_calls；A2A Message 含 messageId、role、parts[]；Moonweave Message 为协议无关 conversation element。'
                en = 'OpenAI ChatCompletionMessage has role content optional tool_calls; A2A Message has messageId role parts; Moonweave Message is protocol-agnostic conversation element.'
                ja = 'OpenAI ChatCompletionMessage / A2A Message / Moonweave Message の境界。'
            }
        }
        if ($NodeId -eq 'ExternalAgentMessage') {
            return @{
                zh = 'A2A SendMessage 来自外部 Agent role=ROLE_AGENT 含 parts[]；或 OpenAI assistant message 由 remote agent 生成；ExternalAgentMessage 标记 sender 非本地 runtime。'
                en = 'A2A SendMessage external agent ROLE_AGENT parts or OpenAI assistant from remote agent; ExternalAgentMessage marks non-local sender.'
                ja = '外部 Agent 由来の A2A/OpenAI message を ExternalAgentMessage として記録。'
            }
        }
        if ($NodeId -eq 'ToolObservationMessage' -or $NodeId -eq 'ToolResultMessage') {
            return @{
                zh = 'OpenAI Chat Completions messages[].role=tool、tool_call_id=call_xxx、content=JSON 结果；Anthropic tool_result content block；Moonweave ToolResultMessage 绑定 observation 到 conversation。'
                en = 'OpenAI messages role=tool tool_call_id=call_xxx content JSON result; Anthropic tool_result block; Moonweave ToolResultMessage binds observation to conversation.'
                ja = 'OpenAI role=tool / Anthropic tool_result の ToolObservationMessage 例。'
            }
        }
    }

    if ($ModuleKey -eq 'prompts') {
        if ($NodeId -eq 'PromptTemplate') {
            return @{
                zh = 'LangChain ChatPromptTemplate.from_messages([("system","You are helpful"),("user","{input}")])；变量 {input}、{context} 在 invoke(input=...) 时填充。'
                en = 'LangChain ChatPromptTemplate.from_messages system plus user template variables input context filled on invoke.'
                ja = 'LangChain ChatPromptTemplate.from_messages で system/user テンプレートを定義。'
            }
        }
        if ($NodeId -eq 'PromptTemplateInstance') {
            return @{
                zh = 'PromptTemplate.invoke(input=Compare flight AA100 vs UA200) 产出完整 messages 列表含 role/content，可直接 POST /v1/chat/completions。'
                en = 'PromptTemplate.invoke yields full messages list with role and content ready for POST /v1/chat/completions.'
                ja = 'PromptTemplate 实例化后の messages を OpenAI API に渡せる。'
            }
        }
        if ($NodeId -eq 'McpPrompt') {
            return @{
                zh = 'MCP prompts/list 返回 prompts[].name=git-commit、description、arguments[].name=changes required=true（规范 2025-11-25）。'
                en = 'MCP prompts/list returns prompts name git-commit description arguments name changes required true spec 2025-11-25.'
                ja = 'MCP prompts/list が name/description/arguments を返す。'
            }
        }
        if ($NodeId -match 'PromptMessage|McpPrompt') {
            return @{
                zh = 'MCP prompts/get name=git-commit arguments.changes=... 返回 messages[].role=user、content.type=text、content.text=...；等价 McpPromptMessage。'
                en = 'MCP prompts/get name git-commit arguments changes returns messages role user content type text; equivalent McpPromptMessage.'
                ja = 'MCP prompts/get が PromptMessage 配列を返す。'
            }
        }
        if ($NodeId -eq 'FewShotExample') {
            return @{
                zh = 'PromptTemplate few-shot 示例：user input=What is 2+2?、assistant output=4；注入 OpenAI messages 数组作 in-context 示范。'
                en = 'PromptTemplate few-shot pair user input What is 2+2 assistant output 4 injected into OpenAI messages array as in-context demo.'
                ja = 'Few-shot 例を OpenAI messages 配列に注入する。'
            }
        }
    }

    if ($ModuleKey -eq 'storage-sources') {
        if ($NodeId -match 'Citation|ContentAnchor|CitationAnchor') {
            return @{
                zh = 'Anthropic POST /v1/messages citations enabled 时返回 type=char_location、cited_text、document_index=0、start_char_index/end_char_index；Moonweave Citation 保留 cited_text 与 document_index。'
                en = 'Anthropic POST /v1/messages citations type=char_location cited_text document_index start_char_index end_char_index; Moonweave Citation preserves cited_text document_index.'
                ja = 'Anthropic char_location citation を Moonweave Citation にマップ。'
            }
        }
        if ($NodeId -match 'SourceProvenance') {
            return @{
                zh = 'W3C PROV-O 三元组 ex:doc prov:wasAttributedTo ex:analyst 表示来源归因；与 Anthropic document_index 互补。'
                en = 'W3C PROV-O ex:doc prov:wasAttributedTo ex:analyst attributes source; complements Anthropic document_index.'
                ja = 'PROV-O wasAttributedTo が SourceProvenance を表す。'
            }
        }
        if ($NodeId -match 'ContentDigest|ByteSequenceDigest|HttpContentDigest') {
            return @{
                zh = 'RFC 9530 Content-Digest sha-256=:5f0b6f7e...: 绑定 SourceIdentity；HTTP 响应 ETag W/abc123 作弱验证。'
                en = 'RFC 9530 Content-Digest sha-256 binds SourceIdentity; HTTP ETag W/abc123 weak validation.'
                ja = 'RFC 9530 Content-Digest と HTTP ETag が SourceIdentity を検証。'
            }
        }
        if ($NodeId -match 'SourceVersion|VersionedSource') {
            return @{
                zh = '版本化来源如 MCP spec 2025-11-25 或文档 revision=3；SourceVersion 与 uri 组合避免引用漂移内容。'
                en = 'Versioned source MCP spec 2025-11-25 or document revision 3; SourceVersion plus uri prevents citing drifted content.'
                ja = 'MCP spec 2025-11-25 等の SourceVersion で引用漂移を防ぐ。'
            }
        }
        if ($NodeId -match 'SourceReference|ResourceReference|FileResource|TextDocument|NetworkSource|HttpResource') {
            return @{
                zh = 'LangChain Document.metadata.source=https://docs.example.com/guide 或 MCP Resource uri=file:///path/doc.txt mimeType=text/plain；SourceReference 保留可解析 locator 与 media type。'
                en = 'LangChain Document.metadata.source URL or MCP Resource uri file:///path mimeType text/plain; SourceReference keeps parseable locator and media type.'
                ja = 'LangChain metadata.source / MCP Resource uri が SourceReference 例。'
            }
        }
        if ($NodeId -match 'SourceSpan|SourceLineRange|SourcePageRange|SourceOffset|SourceRegion|SourceCellRange') {
            return @{
                zh = 'Anthropic char_location start_char_index/end_char_index 或 PDF page=3 line=12-18；SourceSpan 记录 unit=char|line|page 与 range 供 citation 回放。'
                en = 'Anthropic char_location indices or PDF page line range; SourceSpan records unit char|line|page and range for citation replay.'
                ja = 'Anthropic char_location / PDF page-line が SourceSpan 例。'
            }
        }
    }

    if ($ModuleKey -eq 'output-disclosure') {
        if ($id -match 'stream|sse|delta') {
            return @{
                zh = 'OpenAI Chat Completions stream=True 返回 SSE data: choices[0].delta.content=Hello；Anthropic event=content_block_delta delta.text；流结束 data: [DONE]，usage 需 stream_options.include_usage=true。'
                en = 'OpenAI stream=True SSE choices delta content Hello; Anthropic content_block_delta; ends data [DONE]; usage needs stream_options.include_usage=true.'
                ja = 'OpenAI SSE delta.content と Anthropic content_block_delta のストリーミング出力。'
            }
        }
        if ($Descriptions.zh -match 'redaction|suppress|policy|truncat|disclosure|ingress|context') { return $Descriptions }
        if ($NodeId -match 'Truncated|HeadTail|OutputWindow|Suppressed|Disclosed') {
            return @{
                zh = 'OpenAI max_tokens 截断 finish_reason=length 或安全 redaction 后 DisclosureActivity 记录 visible token range；TruncatedOutput 保留 head/tail window 供 UI 展示。'
                en = 'OpenAI max_tokens finish_reason=length or safety redaction; DisclosureActivity records visible token range; TruncatedOutput keeps head/tail window for UI.'
                ja = 'max_tokens 截断/安全 redaction 後の TruncatedOutput/Disclosure 記録。'
            }
        }
    }

    if ($ModuleKey -eq 'container-command') {
        if ($NodeId -match 'ExitStatus') {
            return @{
                zh = 'Cursor sandbox 或 Docker Engine POST /containers/{id}/exec 命令结束 exit_code=0 成功或 137 SIGKILL OOM；ExitStatusObservation 记录 completed_at。'
                en = 'Cursor sandbox or Docker POST /containers/id/exec exit_code 0 success or 137 SIGKILL OOM; ExitStatusObservation records completed_at.'
                ja = 'Docker/Cursor exec の exit_code 0/137 を ExitStatusObservation に記録。'
            }
        }
        if ($NodeId -match 'StandardOutput|StandardError|OutputStream|CommandOutput|OutputChunk|OutputSegment') {
            return @{
                zh = 'npm test 或 docker exec 产生 stdout/stderr 字节流；CommandOutputObservation channel=stdout byte_range [0,21) 写入上下文，stderr 独立 channel。'
                en = 'npm test or docker exec stdout stderr streams; CommandOutputObservation channel stdout byte_range [0,21) stderr separate channel.'
                ja = 'stdout/stderr チャネル分離の CommandOutputObservation。'
            }
        }
        if ($NodeId -match 'WorkingDirectory|EnvironmentBinding|ExecutionResult') {
            return @{
                zh = 'Docker exec WorkingDir=/app Env=[NODE_ENV=test] 或 Cursor sandbox cwd；ExecutionReference 绑定 command 观测到 container/session 上下文。'
                en = 'Docker exec WorkingDir /app Env NODE_ENV=test or Cursor sandbox cwd; ExecutionReference binds command observation to container session context.'
                ja = 'Docker exec WorkingDir/Env または Cursor sandbox cwd の ExecutionReference。'
            }
        }
    }

    if ($ModuleKey -eq 'indexing') {
        if ($NodeId -match 'DiscoveryIndex|LightIndex|IndexPointer|IndexVersion') {
            return @{
                zh = 'Elasticsearch POST /my-index/_search query.match.body=deployment 或 Pinecone query topK=5 vector=[...]；DiscoveryIndex 记录 index_name 与 schema_version。'
                en = 'Elasticsearch POST my-index/_search match query or Pinecone query topK 5; DiscoveryIndex records index_name schema_version.'
                ja = 'Elasticsearch _search / Pinecone query が DiscoveryIndex 例。'
            }
        }
        if ($NodeId -match 'SearchScore|RetrievalScore|DiscoveryScore|CandidateRank') {
            return @{
                zh = 'Elasticsearch hit._score=12.4(BM25) 或 Pinecone cosine similarity=0.87；RetrievalScore 绑定 candidate_id 与 score_type 供 RAG rerank。'
                en = 'Elasticsearch hit _score 12.4 BM25 or Pinecone cosine 0.87; RetrievalScore binds candidate_id score_type for RAG rerank.'
                ja = 'BM25/cosine similarity スコアの RetrievalScore。'
            }
        }
        if ($NodeId -match 'SearchResult|CandidateResult|DiscoveryResult|LightweightRetrieval') {
            return @{
                zh = 'RAG 检索 hits[]._id=doc-9、_score=12.4、_source.title；LightweightRetrievalTrace 记录 query、index、topK=5、latency_ms=42 不含完整 _source。'
                en = 'RAG hits _id doc-9 _score 12.4 _source title; LightweightRetrievalTrace query index topK 5 latency_ms 42 without full _source.'
                ja = 'Elasticsearch hits / 軽量检索 trace が CandidateResult 例。'
            }
        }
        if ($NodeId -match 'DiscoveryActivity|DiscoverySurface') {
            return @{
                zh = 'DiscoveryActivity 封装 POST /index/_search 或 pgvector SELECT ... ORDER BY embedding <=> query LIMIT 5；DiscoverySurface 暴露可查询索引端点。'
                en = 'DiscoveryActivity wraps POST index/_search or pgvector ORDER BY embedding LIMIT 5; DiscoverySurface exposes queryable index endpoint.'
                ja = 'DiscoveryActivity が Elasticsearch/pgvector 检索を記録。'
            }
        }
    }

    if ($ModuleKey -eq 'content-blocks') {
        return @{
            zh = "Anthropic POST /v1/messages content blocks type=text|image|tool_use|tool_result|thinking 之 $NodeId 投影；区别于 OpenAI Chat Completions content type=text|image_url。"
            en = "Anthropic POST /v1/messages content blocks type text image tool_use tool_result thinking $NodeId projection; distinct from OpenAI content type text image_url."
            ja = "Anthropic content blocks の $NodeId モダリティ分類。"
        }
    }

    if ($ModuleKey -eq 'prompts' -and $NodeId -match 'Instruction') {
        return @{
            zh = 'OpenAI Responses instructions 参数或 Chat Completions role=system/developer content=...；Instruction 节点记录 authority、scope、priority 元数据。'
            en = 'OpenAI Responses instructions param or Chat Completions role system developer content; Instruction node records authority scope priority metadata.'
            ja = 'OpenAI instructions / system message の Instruction メタデータ例。'
        }
    }

    $fvSnippet = ($fv.GetEnumerator() | Select-Object -First 4 | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '; '
    $labelZh = if ($Labels.zh) { $Labels.zh } else { $NodeId }
    if ($shape) {
        return @{
            zh = "$labelZh：典型载荷 shape=$shape；field_values $fvSnippet。"
            en = "$labelZh typical payload shape=$shape field_values $fvSnippet."
            ja = "$labelZh 典型ペイロード shape=$shape field_values $fvSnippet."
        }
    }
    return @{
        zh = "$labelZh 在 $NodeId/$ExampleId 映射 OpenAI Responses/A2A/MCP；field_values $fvSnippet。"
        en = "$labelZh at $NodeId/$ExampleId maps to OpenAI Responses A2A MCP field_values $fvSnippet."
        ja = "$labelZh を $NodeId/$ExampleId で OpenAI/A2A/MCP にマップ field_values $fvSnippet."
    }
}

function Get-EngineeringFormats([string]$Text) {
    $formats = @()
    foreach ($m in [regex]::Matches($Text, '(?ms)format:\s*\|-?\s*\n((?:\s+.+\n)+)')) {
        $compact = ($m.Groups[1].Value -split '\n' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join ' '
        if ($compact.Length -gt 20 -and $compact.Length -lt 600) { $formats += $compact }
    }
    return ($formats | Select-Object -Unique)
}

function Process-File([string]$Path, [string]$NodeId, [string]$ModuleKey) {
    $text = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
    if ($text -notmatch '(?ms)^examples:\r?\n(.*?)(?=^(?:parent_relation|sources|source_claims|relations|external_mappings|applicability|review|module_contract):|\z)') {
        return @{ Changed = $false; ExampleCount = 0; Rewritten = 0 }
    }

    $engineeringFormats = Get-EngineeringFormats -Text $text
    $exampleSection = $Matches[1]
    $blocks = [regex]::Split($exampleSection, '(?=^  - id: )')
    $examples = @()
    $exampleIndex = 0
    $rewritten = 0
    $seenIds = @{}

    foreach ($block in $blocks) {
        if ($block -notmatch '(?m)^  - id:\s*(.+)$') { continue }
        $oldId = $Matches[1].Trim()
        $newId = $oldId
        if ($seenIds.ContainsKey($newId)) {
            $seenIds[$newId]++
            $newId = "$oldId-$($seenIds[$oldId])"
        } else {
            $seenIds[$oldId] = 1
        }

        $labels = @{ zh = ''; en = ''; ja = '' }
        if ($block -match '(?ms)^    labels:\s*\n((?:      .+\n)+)') {
            $labels = Parse-LocalizedBlock -Block $Matches[1]
        }
        elseif ($block -match '(?m)^    labels:\s*\{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$') {
            $labels = @{ zh = $Matches[1].Trim(); en = $Matches[2].Trim(); ja = $Matches[3].Trim() }
        }

        $descriptions = @{ zh = ''; en = ''; ja = '' }
        if ($block -match '(?ms)^    descriptions:\s*\n((?:      .+\n)+)') {
            $descriptions = Parse-LocalizedBlock -Block ($Matches[1] -split '(?=^\s{4}descriptions:|\z)')[0]
        }
        elseif ($block -match '(?m)^    descriptions:\s*\{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$') {
            $descriptions = @{ zh = $Matches[1].Trim(); en = $Matches[2].Trim(); ja = $Matches[3].Trim() }
        }

        $fieldValues = Parse-FieldValues -Block $block
        $enhanced = Build-DeepDescription -NodeId $NodeId -ExampleId $newId -ExampleIndex $exampleIndex `
            -Descriptions $descriptions -Labels $labels -FieldValues $fieldValues -ModuleKey $ModuleKey -EngineeringFormats $engineeringFormats

        if ($enhanced.zh -ne $descriptions.zh) { $rewritten++ }

        $restLines = @()
        $skipLabels = $false
        $inFieldValues = $false
        $seenFieldValues = $false
        $seenRelated = $false
        $seenSourceClaims = $false

        foreach ($line in ($block -split '\n')) {
            if ($line -match '^  - id:') { continue }
            if ($line -match '^    (kind|expected_result|why_valid_or_invalid|scenario_id|synthetic|example_source|verified_version):') { continue }
            if ($line -match '^    labels:') { $skipLabels = $true; continue }
            if ($skipLabels -and $line -match '^\s+(zh|en|ja):') { continue }
            if ($skipLabels -and $line -notmatch '^\s{4,}') { $skipLabels = $false }
            if ($line -match '^    descriptions:') { continue }
            if ($line -match '^\s+(zh|en|ja):' -and -not $inFieldValues) { continue }

            if ($line -match '^    field_values:') {
                if ($seenFieldValues) { continue }
                $seenFieldValues = $true
                $inFieldValues = $true
            }
            if ($inFieldValues -and $line -match '^\s{4}\S' -and $line -notmatch '^\s{6}') { $inFieldValues = $false }

            if ($line -match '^    related_relation_ids:' -or $line -match '^    related_node_ids:') {
                if ($seenRelated) { continue }
                $seenRelated = $true
            }
            if ($line -match '^    source_claims:') {
                if ($seenSourceClaims) { continue }
                $seenSourceClaims = $true
            }

            if ($line.Trim() -eq '') { continue }
            $restLines += $line
        }

        $newBlock = @("  - id: $newId")
        if ($labels.zh -or $labels.en) {
            $newBlock += "    labels: {zh: $(Escape-YamlDoubleQuoted $labels.zh), en: $(Escape-YamlDoubleQuoted $labels.en), ja: $(Escape-YamlDoubleQuoted $labels.ja)}"
        }
        $newBlock += "    descriptions: {zh: $(Escape-YamlDoubleQuoted $enhanced.zh), en: $(Escape-YamlDoubleQuoted $enhanced.en), ja: $(Escape-YamlDoubleQuoted $enhanced.ja)}"
        foreach ($line in $restLines) {
            if ($line -match '^  - id:') { continue }
            $newBlock += $line
        }
        $examples += ($newBlock -join "`n")
        $exampleIndex++
    }

    if ($examples.Count -eq 0) { return @{ Changed = $false; ExampleCount = 0; Rewritten = 0 } }

    $newExamplesSection = "examples:`n" + ($examples -join "`n") + "`n"
    $newText = [regex]::Replace($text, '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations|external_mappings|applicability|review|module_contract):|\z)', $newExamplesSection, 1)

    $changed = $newText -ne $text
    if ($changed) {
        [IO.File]::WriteAllText($Path, $newText, (New-Object System.Text.UTF8Encoding $false))
    }
    return @{ Changed = $changed; ExampleCount = $examples.Count; Rewritten = $rewritten }
}

$files = Get-ChildItem -Path $InfoPlane -Filter 'node.yaml' -Recurse | Sort-Object FullName
$updated = 0
$totalExamples = 0
$totalRewritten = 0
$summary = @{}

foreach ($file in $files) {
    $text = [IO.File]::ReadAllText($file.FullName, [Text.Encoding]::UTF8)
    if ($text -notmatch '(?ms)^examples:') { continue }
    if ($text -notmatch '(?m)^id:\s*(.+)$') { continue }

    $nodeId = $Matches[1].Trim()
    $rel = $file.FullName.Substring($Root.Length + 1) -replace '\\', '/'
    $moduleKey = Get-ModuleKey -RelativePath $rel
    $result = Process-File -Path $file.FullName -NodeId $nodeId -ModuleKey $moduleKey

    if ($result.Changed) { $updated++ }
    if (-not $summary.ContainsKey($moduleKey)) { $summary[$moduleKey] = @{ nodes = 0; examples = 0; updated = 0; rewritten = 0 } }
    $summary[$moduleKey].nodes++
    $summary[$moduleKey].examples += $result.ExampleCount
    $summary[$moduleKey].rewritten += $result.Rewritten
    if ($result.Changed) { $summary[$moduleKey].updated++ }
    $totalExamples += $result.ExampleCount
    $totalRewritten += $result.Rewritten
}

$report = [ordered]@{
    processed_at = (Get-Date -Format 'yyyy-MM-dd')
    total_node_yaml_with_examples = ($summary.Values | ForEach-Object { $_.nodes } | Measure-Object -Sum).Sum
    updated_files = $updated
    total_examples = $totalExamples
    descriptions_rewritten = $totalRewritten
    modules = $summary
}
$report | ConvertTo-Json -Depth 5 | Set-Content -Path $SummaryPath -Encoding UTF8
Write-Host "Updated $updated files; $totalRewritten / $totalExamples example descriptions rewritten"
Write-Host "Summary: $SummaryPath"
