# Generates scripts/tool-plane-node-facts.json with per-node technical fact bundles.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$OutPath = Join-Path $Root 'scripts\tool-plane-node-facts.json'

function New-Facts(
    [string]$Entity,
    [string]$Wire,
    [string]$Product,
    [string]$Spec,
    [string]$PositiveRequest,
    [string]$PositiveResponse,
    [string]$CounterViolation,
    [string]$BoundaryLeft,
    [string]$BoundaryRight,
    [string]$AuditField,
    [string]$PositiveClaim
) {
    return [ordered]@{
        entity = $Entity
        wire = $Wire
        product = $Product
        spec = $Spec
        positiveRequest = $PositiveRequest
        positiveResponse = $PositiveResponse
        counterViolation = $CounterViolation
        boundaryLeft = $BoundaryLeft
        boundaryRight = $BoundaryRight
        auditField = $AuditField
        positiveClaim = $PositiveClaim
    }
}

$nodes = @{}

$nodes['tool-plane'] = New-Facts 'tool-plane 跨模块集成面' 'MCP tools/call + OpenAI function_call + Anthropic tool_use' 'Cursor Agent + Claude Desktop' 'MCP 2025-11-25 / OpenAI Function Calling / Anthropic Tool Use' '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"read_file","arguments":{"path":"/tmp/test.txt"}}}' '{"content":[{"type":"text","text":"file contents"}],"isError":false}' '把 tools/call JSON-RPC 直接当作 OpenAI function_call item 写入同一字段' '各协议原生 wire 对象' 'Moonweave 本地 Invocation/ToolCall 追踪' 'local_surface + local_native_call_ref' 'Moonweave tool-plane 设计：保留来源表面不统一 wire schema'

$nodes['ToolCall'] = New-Facts 'ToolCall 工具调用活动' 'MCP tools/call JSON-RPC 或 OpenAI function_call item 引用' 'Claude Desktop MCP host' 'MCP Tools + OpenAI Function Calling' '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_weather","arguments":{"location":"New York"}}}' '{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"72 F"}],"isError":false}}' 'local_source_surface=mcp_jsonrpc 但 local_native_call_ref 指向 OpenAI function_call item' 'OpenAI Responses function_call wire item' 'Moonweave ToolCall 本地活动' 'local_tool_call_id + local_native_call_ref' 'MCP name/arguments 不得冒充 Responses function_call schema'

$nodes['ToolResult'] = New-Facts 'ToolResult 工具结果记录' 'MCP CallToolResult / OpenAI function_call_output / remote mcp_call output' 'Invocation result tracer' 'MCP Tool Result + OpenAI function_call_output' '{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"file contents"}],"isError":false}}' '{"local_tool_result_id":"tool-result-42","local_result_surface":"mcp_tool_result"}' '把 OpenAI call_id 写入 MCP JSON-RPC result.id 字段' 'OpenAI function_call_output item' '本地 ToolResult 证据记录' 'local_tool_result_id + local_native_result_ref' 'MCP isError 与 JSON-RPC error 层级不同'

$nodes['MCPToolCallRequest'] = New-Facts 'MCPToolCallRequest tools/call 请求' 'method=tools/call + params.name/arguments' 'Claude Desktop after user consent' 'MCP Tools Calling Tools' '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"read_file","arguments":{"path":"/tmp/test.txt"}}}' '{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"file contents"}],"isError":false}}' 'arguments.location 类型 number 违反 inputSchema string' 'tools/list Tool definition' 'tools/call invocation' 'params.name + arguments JSON' 'host 必须 human-in-the-loop 同意'

$nodes['MCPListToolsResult'] = New-Facts 'MCPListToolsResult tools/list 结果' 'tools[] with name/description/inputSchema' '@modelcontextprotocol/server-filesystem' 'MCP tools/list Tool' '{"jsonrpc":"2.0","id":7,"result":{"tools":[{"name":"read_text_file","inputSchema":{"type":"object","properties":{"path":{"type":"string"}}}}]}}' '{"nextCursor":null}' 'tool.inputSchema=null 未标记 invalid catalog entry' 'tools/list_changed notification' 'Tool definition for invocation' 'tools[].name + inputSchema' 'list 不等于 call'

$nodes['MCPStdioTransport'] = New-Facts 'MCPStdioTransport stdio 传输' 'stdin/stdout 换行分隔 JSON-RPC' 'Claude Desktop claude_desktop_config.json' 'MCP Transports stdio' '{"jsonrpc":"2.0","id":7,"method":"tools/list"}' '{"jsonrpc":"2.0","id":7,"result":{"tools":[]}}' 'server 在 stdout 输出 banner 日志破坏 JSON-RPC 行' 'stderr 应用日志' 'stdout MCP-only framing' 'local_server_process + pid' 'stdout 不得承载非 MCP 内容'

$nodes['FunctionTool'] = New-Facts 'FunctionTool Agents SDK 函数工具' '@function_tool 或 FunctionTool(name,params_json_schema,on_invoke_tool)' 'openai-agents-python' 'OpenAI Agents SDK Tools' '{"name":"fetch_weather","params_json_schema":{"type":"object","properties":{"location":{"type":"string"}},"required":["location"]},"function_ref":"python://weather/fetch_weather"}' '{"executor_kind":"application-function"}' '仅 docstring 无 params_json_schema' 'MCP Tool record' 'Python handler execution' 'name + params_json_schema' 'summary 不能替代 JSON Schema'

$nodes['AgentAsToolInvocation'] = New-Facts 'AgentAsToolInvocation Agent-as-Tool' 'OpenAI Agents SDK agent.as_tool() 嵌套 Runner.run' 'OpenAI Agents SDK' 'openai-agents-python tools guide' '{"tool_name":"summarize_text","nested_agent":"summarizer","caller":"mainAgent"}' '{"Runner.run":"nested agent output text"}' '把 A2A SendMessage Task 对象直接当作 AgentAsToolInvocation wire payload' 'A2A Message' 'Agents SDK as_tool invocation' 'tool_name + nested_agent ref' 'A2A Task 不是 Agents SDK as_tool'

$nodes['ToolSearch'] = New-Facts 'ToolSearch 发现活动' 'MCP tools/list 分页 + 本地 ToolSearchQuery 过滤' 'Cursor MCP client' 'MCP tools/list 2025-11-25' '{"jsonrpc":"2.0","id":17,"method":"tools/list","params":{"cursor":"page-2"}}' '{"tools":[{"name":"search_docs","description":"Search repo docs","inputSchema":{"type":"object","properties":{"q":{"type":"string"}}}}]}' '把 tools/list 的 nextCursor 当作服务端 keyword 搜索参数' 'MCP tools/list 响应（只读目录）' 'ToolCandidateSet（本地过滤结果）' 'search_id + continuation_cursor' 'MCP 规范 tools/list 不接受 keyword query'

$nodes['MCPSession'] = New-Facts 'MCP 会话' 'newline-delimited JSON-RPC over stdio or Streamable HTTP' 'Claude Desktop' 'MCP 2025-11-25' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"Claude Desktop","version":"1.0"}}}' '{"protocolVersion":"2025-11-25","capabilities":{"tools":{}},"serverInfo":{"name":"filesystem"}}' 'initialize 完成前发送 tools/call read_text_file' '单个 server 进程' '多个 client-server 逻辑会话' 'jsonrpc id + session ref' 'MCP specification normative behavior'

# Load remaining facts from companion JSON if present; otherwise synthesize from module defaults at rewrite time.
$companion = Join-Path $Root 'scripts\tool-plane-node-facts-extra.json'
if (Test-Path $companion) {
    $extra = Get-Content -Raw -Path $companion -Encoding UTF8 | ConvertFrom-Json
    foreach ($prop in $extra.nodes.PSObject.Properties) {
        if (-not $nodes.ContainsKey($prop.Name)) {
            $nodes[$prop.Name] = $prop.Value
        }
    }
}

$moduleDefaults = @{
    'tool-mcp-transport' = New-Facts 'MCP transport/message node' 'JSON-RPC MCP envelope' 'Claude Desktop/Cursor' 'MCP 2025-11-25' '{"jsonrpc":"2.0","id":1,"method":"initialize"}' '{"result":{"protocolVersion":"2025-11-25"}}' 'pre-initialize privileged call' 'MCP wire envelope' 'Moonweave session record' 'jsonrpc id' 'MCP normative lifecycle'
    'tool-invocation-execution' = New-Facts 'invocation node' 'MCP tools/call / OpenAI tool_calls / Anthropic tool_use' 'Agent host' 'multi-protocol invocation' '{"name":"example_tool","arguments":{}}' '{"content":[{"type":"text","text":"ok"}]}' 'mixed protocol identifiers' 'native API item' 'local Invocation record' 'local_invocation_id' 'preserve source surface'
    'tool-registry-definition' = New-Facts 'registry node' 'OpenAI function parameters / MCP inputSchema' 'Tool onboarding' 'schema registration' '{"name":"example","inputSchema":{"type":"object"}}' '{"registered":true}' 'natural language only no JSON Schema' 'ToolDefinition' 'Tool runtime binding' 'tool_id + binding_revision' 'schema required for call'
    'tool-discovery-selection' = New-Facts 'discovery/selection node' 'MCP tools/list / tool_choice / AgentCard' 'Discovery pipeline' 'capability discovery' '{"method":"tools/list"}' '{"tools":[]}' 'assume availability without list' 'catalog snapshot' 'selection decision' 'search_id / decision_id' 'listed != selected'
    'tool-plane' = New-Facts 'tool-plane node' 'cross-module tool integration' 'Agent platform' 'tool-plane design' '{"integration":"mcp+openai+anthropic"}' '{"ok":true}' 'unified fake wire schema' 'protocol-native object' 'Moonweave local trace' 'local audit ref' 'Moonweave tool-plane boundary'
}

$output = [ordered]@{
    planeDefault = $moduleDefaults['tool-plane']
    moduleDefaults = $moduleDefaults
    nodes = $nodes
}

$output | ConvertTo-Json -Depth 6 | Set-Content -Path $OutPath -Encoding UTF8
Write-Host "Wrote $($nodes.Count) explicit node fact bundles to $OutPath"
