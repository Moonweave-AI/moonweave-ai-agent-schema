param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$indexPath = Join-Path $Root 'docs\tool-plane-node-examples-index.txt'
$outPath = Join-Path $Root 'scripts\tool-plane-example-descriptions.json'

function Get-SlugHint([string]$Slug) {
    if ($Slug -match 'weather') { return @{ tool = 'get_weather'; server = '@modelcontextprotocol/server-weather'; args = '{"location":"New York"}'; result = '72 F' } }
    if ($Slug -match 'file|filesystem|read|stdio|tools-list|tool-list') { return @{ tool = 'read_text_file'; server = '@modelcontextprotocol/server-filesystem'; args = '{"path":"/project/README.md"}'; result = 'file contents' } }
    if ($Slug -match 'openai|function|responses|remote-mcp|function-call|function-output') { return @{ tool = 'get_weather'; server = 'OpenAI Responses API'; args = '{"location":"Boston"}'; result = 'function_call_output' } }
    if ($Slug -match 'anthropic|tool_use|tool_result|tool-use') { return @{ tool = 'get_weather'; server = 'Anthropic Messages API'; args = '{"location":"Seattle"}'; result = 'tool_result content' } }
    if ($Slug -match 'a2a|agent|skill|burger') { return @{ tool = 'create_burger_order'; server = 'Google A2A burger_seller_agent AgentCard'; args = '{"size":"large"}'; result = 'Task artifact' } }
    if ($Slug -match 'shell|command|git|powershell') { return @{ tool = 'shell_exec'; server = 'local shell harness'; args = '{"argv":["git","status"]}'; result = 'exit 0' } }
    if ($Slug -match 'schema|violation|invalid') { return @{ tool = 'get_weather'; server = 'MCP weather server'; args = '{"location":42}'; result = 'schema error' } }
    return @{ tool = 'read_file'; server = '@modelcontextprotocol/server-filesystem'; args = '{"path":"/tmp/test.txt"}'; result = 'ok' }
}

function Get-ExampleKind([string]$ExampleId) {
    if ($ExampleId -match '(^|[-_])(positive)([-_]|$)') { return 'positive' }
    if ($ExampleId -match '(^|[-_])(counterexample)([-_]|$)') { return 'counterexample' }
    if ($ExampleId -match '(^|[-_])(boundary)([-_]|$)') { return 'boundary' }
    if ($ExampleId -match '(^|[-_])(instance)([-_]|$)') { return 'instance' }
    return 'positive'
}

function Get-ExampleSlug([string]$ExampleId, [string]$Kind) {
    $slug = $ExampleId -replace "(^|[-_])$Kind([-_]|$)", '-'
    $slug = $slug.Trim('-')
    if ([string]::IsNullOrWhiteSpace($slug)) { return $ExampleId }
    return $slug
}

$overrides = @{
    'MCPToolCallRequest|mcp-tools-call-positive-weather' = @{
        zh = 'MCP client sends tools/call {"jsonrpc":"2.0","method":"tools/call","params":{"name":"read_file","arguments":{"path":"/tmp/test.txt"}},"id":1}. Claude Desktop calls @modelcontextprotocol/server-filesystem after user consent; server returns {"content":[{"type":"text","text":"file contents"}],"isError":false}. MCP requires human-in-the-loop approval.'
        en = 'In MCP protocol, client sends tools/call JSON-RPC request after user consent. Request: {"jsonrpc":"2.0","method":"tools/call","params":{"name":"read_file","arguments":{"path":"/tmp/test.txt"}},"id":1}. Server returns {"jsonrpc":"2.0","result":{"content":[{"type":"text","text":"file contents"}],"isError":false},"id":1}. MCP spec requires user consent before invocation.'
        ja = 'MCP tools/call JSON-RPC request/response example with read_file on @modelcontextprotocol/server-filesystem; user consent required before invocation.'
    }
    'ToolCall|tool-call-positive-mcp' = @{
        zh = 'Claude Desktop dispatches MCP tools/call {"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_weather","arguments":{"location":"New York"}}}. Host records ToolCall local_tool_call_id=tool-call-42, local_source_surface=mcp_jsonrpc, local_native_call_ref=mcp-session-42#id-2 without mutating JSON-RPC.'
        en = 'After user approval Claude Desktop dispatches MCP tools/call {"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_weather","arguments":{"location":"New York"}}}. Host records ToolCall local_tool_call_id=tool-call-42 with local_source_surface=mcp_jsonrpc and local_native_call_ref=mcp-session-42#id-2 without mutating the JSON-RPC object.'
        ja = 'Claude Desktop MCP tools/call dispatch correlated to local ToolCall tool-call-42 without mutating native JSON-RPC payload.'
    }
    'MCPListToolsResult|mcp-tool-list-positive-weather' = @{
        zh = '@modelcontextprotocol/server-filesystem tools/list returns read_text_file and list_directory with JSON Schema inputSchema; maps to OpenAI tools:[{type:function}] and Anthropic tools:[{name,input_schema}].'
        en = '@modelcontextprotocol/server-filesystem tools/list returns read_text_file/list_directory with JSON Schema inputSchema; OpenAI maps to tools:[{type:function,...}]; Anthropic maps to tools:[{name,input_schema}].'
        ja = 'MCP tools/list tool definitions with JSON Schema map to OpenAI/Anthropic tool registration shapes.'
    }
    'MCPStdioTransport|mcp-stdio-positive-tools-list' = @{
        zh = 'Claude Desktop claude_desktop_config.json launches npx -y @modelcontextprotocol/server-filesystem; newline JSON-RPC on stdin/stdout for tools/list; stderr logging only.'
        en = 'Claude Desktop launches npx -y @modelcontextprotocol/server-filesystem; client sends tools/list on stdin and server returns JSON-RPC on stdout; stderr is logging only.'
        ja = 'MCP stdio newline-framed tools/list exchange via stdin/stdout; stderr reserved for logs.'
    }
    'FunctionTool|function-tool-positive-decorated-function' = @{
        zh = 'OpenAI Agents SDK @function_tool on fetch_weather yields FunctionTool with params_json_schema JSON Schema and on_invoke_tool Python handler.'
        en = 'OpenAI Agents SDK @function_tool on fetch_weather yields FunctionTool with params_json_schema JSON Schema and on_invoke_tool Python handler.'
        ja = 'OpenAI Agents SDK FunctionTool from @function_tool with JSON Schema params_json_schema.'
    }
}

$descs = @{}
$index = Get-Content $indexPath -Encoding UTF8
foreach ($line in $index) {
    $nodeId = $line.Split('|')[0]
    $examples = $line.Split('|')[1].Split(';')
    foreach ($exId in $examples) {
        $key = "$nodeId|$exId"
        if ($overrides.ContainsKey($key)) {
            $descs[$key] = $overrides[$key]
            continue
        }
        $kind = Get-ExampleKind -ExampleId $exId
        $slug = Get-ExampleSlug -ExampleId $exId -Kind $kind
        $h = Get-SlugHint -Slug $slug
        $req = "{`"jsonrpc`":`"2.0`",`"method`":`"tools/call`",`"params`":{`"name`":`"$($h.tool)`",`"arguments`":$($h.args)},`"id`":1}"
        $resp = "{`"content`":[{`"type`":`"text`",`"text`":`"$($h.result)`"}],`"isError`":false}"
        switch ($kind) {
            'positive' {
                $zh = ('{0} 正例 ({1}): {2} 通过 {3} 调用 {4}，返回 {5}。OpenAI tool_calls 等价于 Chat Completions finish_reason=tool_calls；Anthropic 为 tool_use -> tool_result 循环。' -f $nodeId, $exId, $h.server, $req, $h.tool, $resp)
                $en = ('{0} positive ({1}): {2} invokes {3} via {4} returning {5}. OpenAI uses tool_calls; Anthropic uses tool_use/tool_result loop.' -f $nodeId, $exId, $h.server, $h.tool, $req, $resp)
                $ja = ('{0} 正例 ({1}): {2} が {3} で {4} を呼び出し {5} を返す。' -f $nodeId, $exId, $h.server, $req, $h.tool, $resp)
            }
            'counterexample' {
                $zh = ('{0} 反例 ({1}): 违反 MCP Lifecycle/JSON Schema——initialize 前 tools/call、arguments {2} 不符合 inputSchema，或混合 OpenAI tool_call_id 与 MCP JSON-RPC id。' -f $nodeId, $exId, $h.args)
                $en = ('{0} counterexample ({1}): violates MCP Lifecycle/JSON Schema before initialize, invalid arguments {2}, or mixed OpenAI tool_call_id with MCP JSON-RPC id.' -f $nodeId, $exId, $h.args)
                $ja = ('{0} 反例 ({1}): initialize 前呼び出し、schema 不一致、ID 混同。' -f $nodeId, $exId)
            }
            'boundary' {
                $zh = ('{0} 边界 ({1}): 区分 MCP tools/list 定义、OpenAI function tools、Swagger OpenAPI components/schemas 与 Moonweave 本地 {0} 记录（{2} 场景）。' -f $nodeId, $exId, $slug)
                $en = ('{0} boundary ({1}): separates MCP tools/list, OpenAI function tools, OpenAPI schemas from Moonweave local {0} record ({2}).' -f $nodeId, $exId, $slug)
                $ja = ('{0} 境界 ({1}): MCP/OpenAPI/OpenAI 定義と Moonweave ローカル記録を分離。' -f $nodeId, $exId)
            }
            default {
                $zh = ('{0} 实例 ({1}): MCP Inspector/Cursor 调试 {2} 捕获 id=42 name={3} arguments={4}；可与 LangChain ToolMessage 或 OpenAI Code Interpreter file_id 输出交叉验证。' -f $nodeId, $exId, $h.server, $h.tool, $h.args)
                $en = ('{0} instance ({1}): MCP Inspector/Cursor captures id=42 name={2} args={3} on {4}; cross-check LangChain ToolMessage or Code Interpreter outputs.' -f $nodeId, $exId, $h.tool, $h.args, $h.server)
                $ja = ('{0} 実例 ({1}): MCP Inspector/Cursor が id=42 の証拠を捕捉。' -f $nodeId, $exId)
            }
        }
        $descs[$key] = [ordered]@{ zh = $zh; en = $en; ja = $ja }
    }
}

[ordered]@{ descriptions = $descs } | ConvertTo-Json -Depth 5 | Set-Content -Path $outPath -Encoding UTF8
Write-Host "Generated $($descs.Count) descriptions to $outPath"
