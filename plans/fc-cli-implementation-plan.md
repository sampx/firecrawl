# fc-cli 实现计划

## 1. 项目概述

- **项目名称**: `@firecrawl/cli`
- **可执行命令**: `fc-cli`
- **项目位置**: `apps/cli`
- **技术栈**: TypeScript + Commander.js + 复用 js-sdk
- **目标用户**: AI Agent (主要), 人类开发者调试 (次要)
- **设计原则**: 
  - 极简参数，默认配置覆盖 80% 场景
  - JSON 为默认输出，便于 Agent 解析
  - 非交互式为主，`--interactive` 用于调试

## 2. 环境变量

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `FIRECRAWL_API_URL` | API 端点 | `http://localhost:3002` |
| `FIRECRAWL_API_KEY` | API 密钥 | 无 (本地模式) |
| `FIRECRAWL_OUTPUT` | 输出格式 | `json` |

## 3. 命令总览

```
fc-cli <command> [options]

Commands:
  scrape <url>        抓取单个页面
  search <query>      Web 搜索
  crawl <url>         爬取网站 (异步)
  crawl-status <id>   查询爬取状态
  map <url>           发现链接
  extract <urls...>   AI 提取数据
  batch <file>        批量抓取 (异步)
  batch-status <id>   查询批量状态
  agent <prompt>      Agent 任务
  deep-research <query>  深度研究
  llmstxt <url>       生成 LLMs.txt
  usage               使用量查询

Global Options:
  --api-url <url>     覆盖 FIRECRAWL_API_URL
  --api-key <key>     覆盖 FIRECRAWL_API_KEY
  --format <json|yaml|table>  输出格式 (默认: json)
  --output, -o <file>  输出到文件
  --verbose, -v       详细日志
  --interactive, -i   进入 REPL 模式
  --help              帮助
  --version           版本
```

## 4. 命令详细设计

### 4.1 scrape - 抓取单个页面

```bash
fc-cli scrape <url>

# 默认返回 markdown 格式，适合 AI 消费
# 示例: fc-cli scrape https://example.com

选项:
  --format <type>     输出内容格式: markdown (默认), html, links
  --output, -o <file>  保存到文件
```

**默认行为**:
- formats: `["markdown"]`
- timeout: 30000ms
- 返回: `{ success: true, data: { markdown: "...", metadata: {...} } }`

### 4.2 search - Web 搜索

```bash
fc-cli search <query>

# 默认返回 5 条搜索结果
# 示例: fc-cli search "web scraping tools"

选项:
  --limit <n>         结果数量 (默认: 5)
  --scrape            同时抓取每个结果
```

**默认行为**:
- 返回: `{ success: true, data: [{ title, url, description }, ...] }`

### 4.3 crawl - 爬取网站

```bash
fc-cli crawl <url>

# 异步模式，返回 job ID
# 示例: fc-cli crawl https://docs.example.com

选项:
  --limit <n>         最大页面数 (默认: 100)
  --wait              同步等待完成
  --output, -o <file>  保存结果 (需 --wait)
```

**默认行为**:
- maxDiscoveryDepth: 3
- 返回: `{ success: true, id: "xxx", status: "pending" }`
- 用 `fc-cli crawl-status <id>` 查询进度

### 4.4 crawl-status - 查询爬取状态

```bash
fc-cli crawl-status <id>

# 示例: fc-cli crawl-status abc123

选项:
  --wait              等待完成
  --output, -o <file>  保存结果
```

**返回**:
- 进行中: `{ success: true, status: "pending", completed: 10, total: 50 }`
- 完成: `{ success: true, status: "completed", data: [...] }`

### 4.5 map - 发现链接

```bash
fc-cli map <url>

# 示例: fc-cli map https://example.com

选项:
  --limit <n>         最大链接数 (默认: 100)
```

**返回**: `{ success: true, links: ["url1", "url2", ...] }`

### 4.6 extract - AI 提取数据

```bash
fc-cli extract <urls...> --prompt <text>

# 示例: fc-cli extract https://example.com/product --prompt "提取产品名称和价格"

选项:
  --prompt <text>     提取提示 (必需)
  --schema <file>    JSON Schema 文件路径
```

**默认行为**:
- 自动推断 schema (基于 prompt)
- 返回: `{ success: true, data: { ... } }`

### 4.7 batch - 批量抓取

```bash
fc-cli batch <file>

# file: 每行一个 URL，或 JSON 数组
# 示例: fc-cli batch urls.txt

选项:
  --wait              同步等待完成
  --output, -o <file>  保存结果
```

**返回**: `{ success: true, id: "xxx", status: "pending" }`

### 4.8 batch-status - 查询批量状态

```bash
fc-cli batch-status <id>

选项:
  --wait              等待完成
  --output, -o <file>  保存结果
```

### 4.9 agent - Agent 任务

```bash
fc-cli agent --prompt <text>

# 示例: fc-cli agent --prompt "找出所有产品页面并提取价格"

选项:
  --prompt <text>     任务描述 (必需)
  --urls <urls...>    起始 URLs
  --wait              等待完成
```

### 4.10 deep-research - 深度研究

```bash
fc-cli deep-research <query>

# 示例: fc-cli deep-research "AI 编程工具市场分析"

选项:
  --wait              等待完成
```

**默认行为**:
- maxDepth: 7
- timeLimit: 270s
- maxUrls: 20

### 4.11 llmstxt - 生成 LLMs.txt

```bash
fc-cli llmstxt <url>

# 示例: fc-cli llmstxt https://example.com
```

**返回**: `{ success: true, llmstxt: "...", llmsfulltxt: "..." }`

### 4.12 usage - 使用量查询

```bash
fc-cli usage

# 返回当前账号的额度使用情况
```

**返回**: `{ success: true, remaining_credits: 1234, used_credits: 567 }`

## 5. 交互式模式 (调试用)

```bash
fc-cli --interactive
fc-cli -i

# 进入 REPL:
fc-cli > scrape https://example.com
fc-cli > search "firecrawl"
fc-cli > crawl https://docs.firecrawl.dev
fc-cli > crawl-status <id>
fc-cli > usage
fc-cli > help
fc-cli > exit
```

**特性**:
- 保持 SDK 客户端连接
- 支持多行输入
- 历史记录 (上下键)
- Tab 补全

## 6. 输出格式

| 格式 | 说明 | Agent 适用 |
|------|------|-----------|
| **json** | 结构化 JSON (默认) | ✅ 主要 |
| yaml | YAML 格式 | ❌ 调试用 |
| table | 表格形式 | ❌ 调试用 |

**JSON 输出规范**:
```json
{
  "success": true,
  "data": { ... }
}
```

**错误输出规范**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Invalid URL: not-a-url"
  }
}
```

## 7. 项目结构

```
apps/cli/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── bin/
│   └── fc-cli              # 可执行文件
├── src/
│   ├── index.ts            # 入口
│   ├── repl.ts             # 交互模式
│   ├── types.ts            # 类型定义
│   ├── commands/
│   │   ├── scrape.ts
│   │   ├── search.ts
│   │   ├── crawl.ts
│   │   ├── crawl-status.ts
│   │   ├── map.ts
│   │   ├── extract.ts
│   │   ├── batch.ts
│   │   ├── batch-status.ts
│   │   ├── agent.ts
│   │   ├── deep-research.ts
│   │   ├── llmstxt.ts
│   │   └── usage.ts
│   └── utils/
│       ├── config.ts       # 配置管理
│       ├── output.ts       # 输出格式化
│       ├── client.ts       # SDK 客户端
│       └── error.ts        # 错误处理
├── tests/
│   ├── commands/
│   │   ├── scrape.test.ts
│   │   ├── search.test.ts
│   │   ├── crawl.test.ts
│   │   ├── crawl-status.test.ts
│   │   ├── map.test.ts
│   │   ├── extract.test.ts
│   │   ├── batch.test.ts
│   │   ├── batch-status.test.ts
│   │   ├── agent.test.ts
│   │   ├── deep-research.test.ts
│   │   ├── llmstxt.test.ts
│   │   └── usage.test.ts
│   └── utils/
│       ├── config.test.ts
│       ├── output.test.ts
│       └── error.test.ts
└── README.md
```

## 8. 实现步骤

| 阶段 | 内容 | 预计工时 |
|------|------|----------|
| **Phase 1** | 项目初始化 + 工具函数 | 2h |
| **Phase 2** | 核心命令 (scrape, search, map, usage) | 3h |
| **Phase 3** | 异步命令 (crawl, batch + status) | 3h |
| **Phase 4** | AI 命令 (extract, agent, deep-research, llmstxt) | 3h |
| **Phase 5** | 交互模式 (REPL) | 2h |
| **Phase 6** | 测试用例 | 3h |
| **Phase 7** | 文档 + CI | 1h |

**总计**: ~17h

## 9. 测试用例

### 9.1 单元测试

#### utils/config.test.ts
```typescript
describe('config', () => {
  it('should load default config')
  it('should load from env vars')
  it('should override with CLI args')
  it('should handle missing API key')
})
```

#### utils/output.test.ts
```typescript
describe('output', () => {
  it('should format JSON output')
  it('should format YAML output')
  it('should format table output')
  it('should write to file')
  it('should handle errors consistently')
})
```

#### utils/error.test.ts
```typescript
describe('error', () => {
  it('should format API errors')
  it('should format validation errors')
  it('should format network errors')
  it('should format timeout errors')
})
```

### 9.2 集成测试

#### commands/scrape.test.ts
```typescript
describe('scrape command', () => {
  it('should scrape URL and return markdown')
  it('should scrape URL with --format html')
  it('should save to file with --output')
  it('should handle invalid URL')
  it('should handle timeout')
  it('should handle API errors')
})
```

#### commands/search.test.ts
```typescript
describe('search command', () => {
  it('should search and return results')
  it('should respect --limit')
  it('should scrape results with --scrape')
  it('should handle no results')
})
```

#### commands/crawl.test.ts
```typescript
describe('crawl command', () => {
  it('should start crawl and return job ID')
  it('should wait for completion with --wait')
  it('should respect --limit')
  it('should handle invalid URL')
})

describe('crawl-status command', () => {
  it('should return pending status')
  it('should return completed status with data')
  it('should wait for completion with --wait')
  it('should handle invalid job ID')
})
```

#### commands/map.test.ts
```typescript
describe('map command', () => {
  it('should return list of links')
  it('should respect --limit')
  it('should handle no links found')
})
```

#### commands/extract.test.ts
```typescript
describe('extract command', () => {
  it('should extract data with prompt')
  it('should use schema from file')
  it('should handle multiple URLs')
  it('should handle extraction errors')
})
```

#### commands/batch.test.ts
```typescript
describe('batch command', () => {
  it('should start batch and return ID')
  it('should read URLs from file (line-separated)')
  it('should read URLs from file (JSON array)')
  it('should wait for completion with --wait')
  it('should handle invalid file')
})

describe('batch-status command', () => {
  it('should return pending status')
  it('should return completed status')
  it('should wait for completion with --wait')
})
```

#### commands/agent.test.ts
```typescript
describe('agent command', () => {
  it('should run agent with prompt')
  it('should accept starting URLs')
  it('should wait for completion with --wait')
})
```

#### commands/deep-research.test.ts
```typescript
describe('deep-research command', () => {
  it('should run deep research')
  it('should wait for completion with --wait')
})
```

#### commands/llmstxt.test.ts
```typescript
describe('llmstxt command', () => {
  it('should generate llmstxt')
  it('should return llmstxt and llmsfulltxt')
})
```

#### commands/usage.test.ts
```typescript
describe('usage command', () => {
  it('should return usage information')
  it('should handle unauthenticated')
})
```

### 9.3 E2E 测试

```typescript
describe('E2E', () => {
  it('should work with local API (no auth)')
  it('should work with remote API (with auth)')
  it('should handle network errors gracefully')
  it('should respect timeout settings')
  it('should output valid JSON for all commands')
})
```

## 10. 验证通过标准

### 10.1 功能验证

| 命令 | 验证标准 |
|------|----------|
| scrape | 返回有效 markdown，处理超时/错误 |
| search | 返回结果列表，支持 limit |
| crawl | 返回 job ID，status 可查询 |
| crawl-status | 正确报告 pending/completed |
| map | 返回链接列表 |
| extract | 根据 prompt 提取数据 |
| batch | 支持文件输入，返回 job ID |
| batch-status | 正确报告状态 |
| agent | 执行任务并返回结果 |
| deep-research | 完成研究并返回报告 |
| llmstxt | 生成有效 llmstxt |
| usage | 返回额度信息 |

### 10.2 输出验证

- [ ] 所有命令输出有效 JSON
- [ ] 成功输出包含 `success: true`
- [ ] 错误输出包含 `success: false` + `error.code`
- [ ] `--format yaml` 输出有效 YAML
- [ ] `--format table` 输出可读表格
- [ ] `--output` 正确写入文件

### 10.3 错误处理验证

| 场景 | 预期行为 |
|------|----------|
| 无效 URL | `{ success: false, error: { code: "INVALID_URL" } }` |
| API 错误 | `{ success: false, error: { code: "API_ERROR", message: "..." } }` |
| 网络错误 | `{ success: false, error: { code: "NETWORK_ERROR" } }` |
| 超时 | `{ success: false, error: { code: "TIMEOUT" } }` |
| 文件不存在 | `{ success: false, error: { code: "FILE_NOT_FOUND" } }` |
| 未授权 | `{ success: false, error: { code: "UNAUTHORIZED" } }` |

### 10.4 测试覆盖率

- [ ] 单元测试覆盖率 >= 80%
- [ ] 所有命令有集成测试
- [ ] E2E 测试覆盖主要流程
- [ ] 错误场景有测试用例

### 10.5 文档验证

- [ ] README 包含安装说明
- [ ] README 包含所有命令示例
- [ ] README 包含环境变量说明
- [ ] `fc-cli --help` 输出完整帮助

### 10.6 性能验证

| 场景 | 标准 |
|------|------|
| scrape 响应 | < 30s |
| CLI 启动 | < 500ms |
| 内存占用 | < 100MB |

## 11. 代码复用

```typescript
// 复用 js-sdk
import { Firecrawl } from '@mendable/firecrawl-js';

// 客户端初始化
const client = new Firecrawl({
  apiUrl: process.env.FIRECRAWL_API_URL || 'http://localhost:3002',
  apiKey: process.env.FIRECRAWL_API_KEY,
});
```

## 12. 发布清单

- [ ] 所有测试通过
- [ ] 测试覆盖率 >= 80%
- [ ] README 完整
- [ ] CHANGELOG 更新
- [ ] package.json 版本号正确
- [ ] npm publish (或内部 registry)