---
name: Firecrawl AGENT RULES
description: Self-hosted web data collection backend for fc-cli and fc-local
---

# Agent Development Rules

## 1. Canonical References

Canonical references:

- DESIGN: `docs/DESIGN.md`
- Referral Docs: `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `apps/api/AGENTS.md`, `apps/cli/AGENTS.md`

## 2. Architecture and Directories

运行链路：`fc-local / user → fc-cli / HTTP API → apps/api → workers / Playwright / SearXNG → Markdown / JSON output`。

| Directory | Responsibility |
|---|---|
| `apps/api/` | Firecrawl API 服务、Worker、抓取/爬取/搜索/提取后端逻辑 |
| `apps/cli/` | `fc-cli` 命令行封装，调用自托管 API 并格式化输出 |
| `apps/playwright-service-ts/` | 浏览器渲染微服务 |
| `my-fc` | 根目录服务管理脚本，负责 Docker Compose 生命周期操作 |
| `scripts/` | 服务启停、日志、构建等辅助脚本 |
| `searxng/` | SearXNG 自托管搜索配置 |
| `docker-compose.yaml` | 自托管服务编排 |
| `docs/` | 项目设计、架构和部署文档 |

部署：`external/tools/bin/` 通过软链接将脚本暴露到系统 `PATH`。

| 软链接 | 目标 | 用途 |
|--------|------|------|
| `external/tools/bin/my-fc` | `projects/firecrawl/my-fc` | Docker Compose 服务管理 |
| `external/tools/bin/fc-cli` | `projects/firecrawl/apps/cli/bin/fc-cli` | CLI 命令（需先在 `apps/cli/` 执行 `pnpm build`） |

克隆或重新构建 CLI 后：`ln -sf <绝对路径> external/tools/bin/<名称>`

## 3. Development Commands (build format test)

| Scenario | Command | When |
|---|---|---|
| Check services | `./my-fc status` | 检查自托管服务状态 |
| Health check | `./my-fc health` | 修改服务编排、API 或 CLI 集成后 |
| View logs | `./my-fc logs <service> [lines]` | 诊断运行时问题 |
| API dev | `pnpm dev` | Workdir: `apps/api/` |
| API build | `pnpm build` | Workdir: `apps/api/`，修改 API 后 |
| API format | `pnpm format` | Workdir: `apps/api/`，提交前 |
| API unused-code check | `pnpm knip` | Workdir: `apps/api/`，清理或重构后 |
| API snips tests | `pnpm test:snips` | Workdir: `apps/api/`，抓取/爬取相关修改后 |
| API targeted test | `pnpm harness jest <test-file>` | Workdir: `apps/api/`，验证单个 E2E/snips 测试 |
| CLI dev | `pnpm dev` | Workdir: `apps/cli/` |
| CLI build | `pnpm build` | Workdir: `apps/cli/`，修改 CLI 后 |
| CLI test | `pnpm test` | Workdir: `apps/cli/`，修改 CLI 后 |

## 4. Implementation Rules

- 保持上游 fork 可追踪；除非任务明确要求，不做大范围重写或无关格式化。
- 修改 `apps/api/` 时遵循 `apps/api/AGENTS.md`；修改 `apps/cli/` 时遵循 `apps/cli/AGENTS.md`。
- CLI 只做参数解析、API 调用和输出格式化；业务处理、抓取策略和数据提取逻辑归 API 层。
- 新增或修改 API 请求体必须使用 Zod schema 做运行时验证。
- API 错误使用 `TransportableError` 系列；避免直接抛出裸 `Error`。
- 使用项目 logger 记录运行时信息；不要用 `console.log` 写业务日志。
- 不要记录或输出 API key、环境变量值、请求 headers 或其他敏感信息。
- 修改 Docker Compose、`my-fc`、`scripts/` 或 `searxng/` 后，必须用 `./my-fc status` 或 `./my-fc health` 验证。

## 5. Testing

- 遵循 TDD：先写一个会失败的测试，再实现代码让测试通过。
- 抓取、爬取、搜索、提取相关改动优先使用 `apps/api/src/__tests__/snips/` 的 E2E/snips 测试。
- 单个 API 测试用 `pnpm harness jest <test-file>` 运行，确保依赖服务由 harness 编排。
- 所有抓取测试必须使用 `scrapeTimeout`，避免不稳定超时。
- 需要环境能力开关的测试使用既有 `describeIf` / `itIf` 模式。
- CLI 改动至少运行 `apps/cli` 的 build 和 test；涉及真实 API 调用时再运行 `./my-fc health` 或手动 smoke test。

## 6. User-Supplied Rules
