# Firecrawl CLI — 项目规范

> **定位**：Firecrawl 命令行工具 — 为 AI Agent 和开发者提供终端级网页数据采集能力
> **产品 PRD**：`docs/products/firecrawl/PRD-firecrawl-api.md`

---

## 1. 架构概览

CLI 是 Firecrawl JavaScript SDK (`@mendable/firecrawl-js`) 的薄封装层，通过 Commander.js 将 API 能力映射为终端命令。

```
┌────────────────────────────────────────────────┐
│  fc-cli (Commander.js)                         │
│  global options → subcommand → action          │
└────────────────────┬───────────────────────────┘
                     │
┌────────────────────▼───────────────────────────┐
│  Utils Layer                                   │
│  client.ts (Firecrawl SDK) | config.ts         │
│  output.ts (format/file)  | error.ts           │
└────────────────────┬───────────────────────────┘
                     │ HTTP
┌────────────────────▼───────────────────────────┐
│  Firecrawl API (apps/api)                      │
│  /v2/scrape, /v2/crawl, /v2/search, etc.       │
└────────────────────────────────────────────────┘
```

> CLI 本身不含业务逻辑，所有处理由 API 端完成。CLI 职责：参数解析 → SDK 调用 → 输出格式化。

---

## 2. 目录与模块

```
src/
├── index.ts                     # 入口：Commander 程序定义、全局选项、子命令注册
├── repl.ts                     # 交互式 REPL 模式（readline 循环，spawn 子进程执行命令）
├── commands/                    # 子命令定义（每个文件一个 Command）
│   ├── scrape.ts               # fc-cli scrape <url> — 单页抓取
│   ├── search.ts               # fc-cli search <query> — 网络搜索
│   ├── map.ts                  # fc-cli map <url> — URL 发现（含 --filter 通配过滤）
│   ├── crawl.ts                # fc-cli crawl <url> — 全站爬取（--wait 等待模式写文件）
│   ├── crawl-status.ts         # fc-cli crawl-status <id> — 爬取状态查询
│   ├── batch.ts                # fc-cli batch <file> — 批量抓取（文件读取 URL 列表）
│   ├── batch-status.ts         # fc-cli batch-status <id> — 批量状态查询
│   ├── extract.ts              # fc-cli extract <urls...> — LLM 结构化提取（--prompt/--schema）
│   ├── extract-status.ts       # fc-cli extract-status <id> — 提取状态查询
│   └── llmstxt.ts              # fc-cli llmstxt <path> — 生成 llms.txt（URL 或本地目录）
└── utils/                      # 共享工具
    ├── client.ts               # Firecrawl SDK 单例客户端（getClient）
    ├── config.ts               # 配置加载（环境变量 + 默认值）
    ├── output.ts               # 输出格式化 + 文件写入（handleOutput, writeCrawlDocuments）
    └── error.ts                # 错误格式化（formatError, handleError）
bin/
└── fc-cli                      # 入口 shebang：#!/usr/bin/env node → dist/index.js
```

---

## 3. 命令速查

### 全局选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--api-url <url>` | API 地址 | `$FIRECRAWL_API_URL` 或 `http://localhost:3002` |
| `--api-key <key>` | API Key | `$FIRECRAWL_API_KEY` |
| `-o, --output <file>` | 输出到文件 | stdout |
| `-v, --verbose` | 详细日志 | false |
| `-i, --interactive` | 进入 REPL 模式 | — |

### 子命令

```bash
# 单页抓取
fc-cli scrape <url> [--format markdown|html|links]

# 网络搜索
fc-cli search <query> [--limit <n>]

# URL 发现
fc-cli map <url> [--limit <n>] [--filter <pattern>]

# 全站爬取
fc-cli crawl <url> [--limit <n>] [--timeout <ms>] [--wait]

# 爬取状态
fc-cli crawl-status <jobId>

# 批量抓取
fc-cli batch <file> [--wait] [--poll-interval <s>] [--timeout <s>]

# 批量状态
fc-cli batch-status <jobId>

# LLM 结构化提取
fc-cli extract <urls...> --prompt <text> [--schema <file>] [--wait] [--poll-interval <s>] [--timeout <s>]

# 提取状态
fc-cli extract-status <jobId>

# 生成 llms.txt
fc-cli llmstxt <url|directory> [--full]
```

### REPL 模式

```bash
fc-cli -i
# 进入交互模式，支持所有子命令
# fc-cli > scrape https://example.com
# fc-cli > search "python async"
# fc-cli > exit
```

---

## 4. 核心模块详解

### 4.1 命令模式

每个命令遵循统一模板：

```typescript
// src/commands/<name>.ts
export const xxxCommand = new Command('xxx')
  .description('...')
  .argument('<arg>', '...')
  .option('--opt <val>', '...', 'default')
  .action(async (arg, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };
    try {
      const client = getClient(config);
      // SDK 调用
      const response = await client.xxx(arg, { ... });
      handleOutput(response, globalOptions.output);
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
```

### 4.2 输出格式化 (`output.ts`)

| 函数 | 用途 |
|------|------|
| `formatOutput(data)` | 智能格式化：优先输出 markdown，其次 links 数组，否则 JSON |
| `handleOutput(data, file?)` | 格式化后输出到文件或 stdout |
| `writeCrawlDocuments(docs, dir)` | 将爬取结果按 URL 路径写入目录结构（`urlToFilePath`） |
| `filterLinks(urls, pattern)` | 通配符过滤 URL（`*` 匹配任意字符） |

### 4.3 客户端 (`client.ts`)

单例模式，封装 `@mendable/firecrawl-js` SDK：

```typescript
const client = new Firecrawl({ apiUrl, apiKey });
// 调用: client.scrape(), client.crawl(), client.search(), client.extract(), client.map()
```

### 4.4 配置 (`config.ts`)

```typescript
interface Config {
  apiUrl: string;    // FIRECRAWL_API_URL || 'http://localhost:3002'
  apiKey: string;    // FIRECRAWL_API_KEY
  verbose: boolean;  // 详细输出
}
```

---

## 5. 开发规范

### 开发命令

```bash
pnpm install                    # 安装依赖
pnpm build                      # tsup 编译 → dist/
pnpm dev                        # tsup --watch 开发模式
pnpm test                       # Jest 测试
```

### 新增命令模板

1. 创建 `src/commands/my-command.ts`：

```typescript
import { Command } from 'commander';
import { getClient } from '../utils/client.js';
import { handleOutput } from '../utils/output.js';
import { handleError } from '../utils/error.js';
import { Config } from '../utils/config.js';

export const myCommand = new Command('my-command')
  .description('Description of my command')
  .argument('<arg>', 'Required argument')
  .option('--opt <val>', 'Optional parameter', 'default')
  .action(async (arg, options, command) => {
    const globalOptions = command.parent.opts();
    const config: Config = {
      apiUrl: globalOptions.apiUrl,
      apiKey: globalOptions.apiKey,
      verbose: globalOptions.verbose,
    };
    try {
      const client = getClient(config);
      const response = await client.someMethod(arg, { opt: options.opt });
      handleOutput(response, globalOptions.output);
    } catch (error) {
      handleError(error, config.verbose);
    }
  });
```

2. 在 `src/index.ts` 注册：

```typescript
import { myCommand } from './commands/my-command.js';
program.addCommand(myCommand);
```

---

## 6. 代码约束

**代码风格**：
- ESM 模块（`"type": "module"`）
- TypeScript strict 模式
- tsup 打包（ESM 格式，带 sourcemap）
- Commander.js 命令模式，每个文件一个 Command 导出
- 导入路径显式 `.js` 后缀（ESM 要求）

**敏感信息**：**禁止记录**：API Key、环境变量值、请求 headers

**构建约束**：
- tsup 构建，入口 `src/index.ts`，输出 `dist/`
- bin 入口 `bin/fc-cli` 直接 import `dist/index.js`
- 测试用 Jest（`--experimental-vm-modules` 支持 ESM）
