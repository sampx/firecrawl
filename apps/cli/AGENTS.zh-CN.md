---
name: fc-cli
description: CLI wrapper that calls Firecrawl API and formats terminal output
---

# fc-cli — 项目规范

## 1. Canonical References

- 项目级规范（含架构、部署）：`../../AGENTS.md`
- 设计文档（含 §6.1 fc-cli 命令接口）：`../../docs/DESIGN.md`

## 2. Architecture and Directories

执行链：`用户/REPL → Commander.js 子命令 → utils（client/config/output/error）→ @mendable/firecrawl-js SDK → Firecrawl API`

| 目录/文件 | 职责 |
|-----------|------|
| `src/index.ts` | 入口：Commander 程序定义、全局选项、子命令注册 |
| `src/repl.ts` | 交互式 REPL 模式（readline 循环，spawn 子进程执行命令） |
| `src/commands/` | 子命令定义，每个文件一个 Command 导出 |
| `src/utils/client.ts` | Firecrawl SDK 单例客户端（`getClient`） |
| `src/utils/config.ts` | 配置加载（`FIRECRAWL_API_URL`、`FIRECRAWL_API_KEY`） |
| `src/utils/output.ts` | 输出格式化 + 文件写入（`handleOutput`、`writeCrawlDocuments`） |
| `src/utils/error.ts` | 错误格式化（`formatError`、`handleError`） |
| `bin/fc-cli` | 入口 shebang → `dist/index.js` |

## 3. Development Commands

| 场景 | 命令 | 工作目录 |
|------|------|----------|
| 安装依赖 | `pnpm install` | `apps/cli/` |
| 构建 | `pnpm build` | `apps/cli/` |
| 开发（watch） | `pnpm dev` | `apps/cli/` |
| 测试 | `pnpm test` | `apps/cli/` |

## 4. Implementation Rules

- **命令模式**：每个子命令一个文件，导出 `xxxCommand`（`new Command('xxx')`），在 `src/index.ts` 通过 `program.addCommand()` 注册。
- **职责边界**：CLI 只解析参数、调用 SDK、格式化输出。抓取策略、数据提取、错误重试等业务逻辑属于 API 层。
- **ESM 模块**：`"type": "module"`，导入路径必须带 `.js` 后缀。
- **TypeScript strict** 模式，tsup 打包（ESM + sourcemap，入口 `src/index.ts`，输出 `dist/`）。
- **配置**：`Config` 接口包含 `apiUrl`、`apiKey`、`verbose`，通过全局选项传递。
- **输出格式化**：`handleOutput` 处理 stdout / 文件输出；`writeCrawlDocuments` 按目录结构写入爬取结果；`filterLinks` 通配符过滤 URL。
- **禁止记录**：API Key、环境变量值、请求 headers 等敏感数据。

## 5. Testing

- 遵循 TDD：先写失败测试，再实现代码使其通过。
- 测试框架：Jest（`--experimental-vm-modules` 支持 ESM），配置见 `jest.config.js`。
- CLI 变更至少运行 `pnpm build` + `pnpm test`。
- 涉及真实 API 调用时用 `./my-fc health` 或手动冒烟测试验证。

## 6. User-Supplied Rules
