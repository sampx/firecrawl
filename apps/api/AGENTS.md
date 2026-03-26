# Firecrawl API — 项目规范

> **定位**：Firecrawl 核心 API 服务 — 多引擎网页抓取、爬取、搜索与结构化提取的后端引擎
> **架构蓝图**：`docs/ARCHITECTURE.md`
> **本地部署文档**：`docs/DEPLOYMENT.md`

---

## 1. 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│  API Gateway (Express + WebSocket)                              │
│  V0 (deprecated) | V1 (maintenance) | V2 (current)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Service Layer: Queue (NuQ/Bull) | Auth (ACUC) | Billing | Webhook │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Scraping Engine: Multi-engine fallback + Transformers          │
│  fire-engine > playwright > fetch > pdf/document                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Infrastructure: PostgreSQL | Redis | RabbitMQ | Supabase | GCS │
└─────────────────────────────────────────────────────────────────┘
```

> 组件关系、接口契约与技术决策详见 [DESIGN 文档](../../docs/ARCHITECTURE.md)。

---

## 2. 目录与模块

```
src/
├── index.ts                       # Express 应用入口（HTTP + WS 服务启动）
├── harness.ts                     # 开发/生产模式编排器（进程管理、容器管理）
├── config.ts                      # Zod schema 配置管理（环境变量验证）
├── types.ts                       # 全局类型定义
├── natives.ts                     # Go 共享库路径解析
├── controllers/                   # 请求处理器
│   ├── auth.ts                    # 认证逻辑
│   ├── v0/                        # V0 API（已弃用）
│   ├── v1/                        # V1 API（维护中）
│   └── v2/                        # V2 API（当前版本）— scrape, crawl, search, extract, agent, browser, map
├── routes/                        # 路由注册
│   ├── v0.ts                      # V0 路由
│   ├── v1.ts                      # V1 路由
│   ├── v2.ts                      # V2 路由（主路由，含所有端点注册）
│   ├── shared.ts                  # 共享中间件链（auth, credits, rate-limit, blocklist, idempotency）
│   └── admin.ts                   # 管理端路由
├── scraper/                       # 抓取引擎核心
│   ├── scrapeURL/                 # 单 URL 抓取流程
│   │   ├── index.ts               # 抓取主入口（引擎选择 + 执行 + 转换）
│   │   ├── engines/               # 抓取引擎集合
│   │   │   ├── index.ts           # 引擎选择逻辑（feature flags → robots.txt）
│   │   │   ├── fire-engine/       # Chrome CDP 引擎（高保真渲染）
│   │   │   ├── playwright/        # Playwright 引擎（浏览器自动化）
│   │   │   ├── fetch/             # 原生 HTTP 引擎（快速）
│   │   │   ├── pdf/               # PDF 解析引擎（LlamaParse）
│   │   │   ├── document/          # DOCX/XLSX 处理引擎
│   │   │   ├── index/             # 缓存索引引擎
│   │   │   └── wikipedia/         # Wikipedia 专用引擎
│   │   ├── transformers/          # 结果转换器
│   │   │   ├── index.ts           # 转换器调度
│   │   │   ├── llmExtract.ts      # LLM 结构化提取
│   │   │   ├── agent.ts           # Agent 模式转换
│   │   │   ├── diff.ts            # 变更追踪
│   │   │   └── uploadScreenshot.ts
│   │   ├── postprocessors/        # 后处理器（youtube.ts）
│   │   ├── lib/                   # 抓取工具库
│   │   └── error.ts               # 抓取错误定义
│   ├── crawler/                   # 爬取逻辑（URL 发现、深度控制）
│   └── WebScraper/                # 遗留抓取器 + 工具（blocklist, engine-forcing）
├── search/                        # 搜索功能
├── services/                      # 业务服务层
│   ├── queue-service.ts           # BullMQ 队列管理
│   ├── queue-worker.ts            # BullMQ Worker
│   ├── redis.ts                   # Redis 连接
│   ├── supabase.ts                # Supabase 客户端
│   ├── rate-limiter.ts            # 速率限制
│   ├── webhook/                   # Webhook 通知
│   ├── billing/                   # 计费服务
│   ├── idempotency/               # 幂等性控制
│   ├── indexing/                  # 搜索索引
│   ├── autumn/                    # Autumn 计费集成
│   ├── worker/                    # NuQ Worker 系统
│   │   ├── nuq.ts                 # NuQ 核心（PostgreSQL + RabbitMQ）
│   │   ├── nuq-worker.ts          # NuQ Worker 进程
│   │   ├── nuq-prefetch-worker.ts # NuQ 预取 Worker
│   │   ├── nuq-reconciler-worker.ts # NuQ 对账 Worker
│   │   └── scrape-worker.ts       # 抓取 Worker
│   ├── extract-worker.ts          # 提取 Worker
│   └── sentry.ts                  # Sentry 监控
├── lib/                           # 共享库
│   ├── logger.ts                  # Winston 日志
│   ├── error.ts                   # 可序列化错误类（TransportableError 系列）
│   ├── deployment.ts              # 部署环境检测
│   ├── x402.ts                    # X402 微支付协议
│   ├── extract/                   # 提取服务
│   ├── deep-research/             # 深度研究
│   ├── crawl-redis.ts             # 爬取 Redis 状态
│   ├── concurrency-limit.ts       # 并发限制
│   ├── url-utils.ts               # URL 工具
│   └── ...                        # 其他工具库
├── types/                         # 类型定义
│   └── x402.d.ts
└── __tests__/                     # 测试套件
    ├── snips/                     # E2E 测试（首选）
    ├── e2e_withAuth/              # 带认证的 E2E 测试
    ├── e2e_noAuth/                # 无认证 E2E 测试
    ├── e2e_extract/               # 提取功能测试
    ├── e2e_map/                   # Map 功能测试
    └── lib/                       # 单元测试
```

---

## 3. 命令/API 规格速查

### 开发命令

```bash
pnpm dev                           # 开发模式（自动编译 + 重启）
pnpm build                         # TypeScript 编译
pnpm server:production             # 生产模式启动（含编译）
pnpm test                          # 运行测试（排除 E2E 无认证测试）
pnpm test:snips                    # 运行 E2E 测试（snips）
pnpm test:full                     # 运行全部测试
pnpm format                        # Prettier 格式化
pnpm knip                          # 检查无用代码
pnpm harness -- <command>          # 编排器模式运行
```

### Harness 编排器

Harness 是核心进程管理器，负责启动所有服务：

```bash
pnpm harness -- --start            # 开发模式（tsc-watch + 自动重启全部服务）
pnpm harness -- --start-built      # 生产模式（跳过编译，直接启动）
pnpm harness -- --start-docker     # Docker 模式（跳过安装和编译）
pnpm harness -- pnpm test:snips    # 启动全部服务 + 运行测试
```

Harness 启动的服务：API + Worker + NuQ Workers (N个) + NuQ Prefetch Worker + NuQ Reconciler Worker + Extract Worker

### V2 API 端点

| 端点                             | 方法       | 同步/异步 | 描述                |
| -------------------------------- | ---------- | --------- | ------------------- |
| `/v2/scrape`                     | POST       | 异步      | 单页面抓取          |
| `/v2/scrape/:jobId`              | GET        | 同步      | 抓取状态查询        |
| `/v2/batch/scrape`               | POST       | 异步      | 批量抓取            |
| `/v2/crawl`                      | POST       | 异步      | 网站爬取            |
| `/v2/crawl/:jobId`               | GET/DELETE | 同步      | 爬取状态/取消       |
| `/v2/crawl/:jobId`               | WS         | 异步      | WebSocket 实时状态  |
| `/v2/map`                        | POST       | 同步      | URL 发现            |
| `/v2/search`                     | POST       | 异步      | 搜索 + 抓取         |
| `/v2/extract`                    | POST       | 异步      | 结构化提取          |
| `/v2/extract/:jobId`             | GET        | 同步      | 提取状态            |
| `/v2/agent`                      | POST       | 异步      | FIRE-1 Agent        |
| `/v2/agent/:jobId`               | GET/DELETE | 同步      | Agent 状态/取消     |
| `/v2/browser`                    | POST/GET   | 同步      | 浏览器会话创建/列表 |
| `/v2/browser/:sessionId/execute` | POST       | 同步      | 浏览器执行          |
| `/v2/browser/:sessionId`         | DELETE     | 同步      | 浏览器销毁          |
| `/v2/team/credit-usage`          | GET        | 同步      | 信用使用统计        |
| `/v2/concurrency-check`          | GET        | 同步      | 并发检查            |
| `/v2/team/queue-status`          | GET        | 同步      | 队列状态            |

### 中间件链

每个 V2 端点的请求经过：

```
requestTimingMiddleware → authMiddleware → countryCheck → checkCreditsMiddleware → blocklistMiddleware → controller
```

特殊端点额外中间件：

- `/v2/crawl`：`idempotencyMiddleware`
- `/v2/x402/search`：`paymentMiddleware`（X402 微支付）

---

## 4. 核心模块详解

### 4.1 抓取引擎 (scraper/scrapeURL/)

**引擎选择逻辑** (`engines/index.ts`)：

```
Feature Flags → Robots.txt 检查 → 引擎优先级回退
优先级: index (缓存) > fire-engine > playwright > fetch > pdf/document
```

**每个引擎返回**：`{ html, markdown, screenshot, metadata }`

**抓取流程** (`scrapeURL/index.ts`)：

```
Request → Engine Selection → Execute Engine → Transformers → Postprocessors → Document
```

### 4.2 队列系统

| 队列       | 后端                  | 用途                             | Worker 文件                     |
| ---------- | --------------------- | -------------------------------- | ------------------------------- |
| **NuQ**    | PostgreSQL + RabbitMQ | scrape/crawl 作业                | `services/worker/nuq-worker.ts` |
| **BullMQ** | Redis                 | billing, deep research, precrawl | `services/queue-worker.ts`      |

NuQ 作业状态：`queued → active → completed / failed`

### 4.3 认证 (ACUC)

```
Bearer Token → Redis Cache (ACUC) → Supabase RPC → Rate Limiter → ACUC response
```

ACUC 结构：`{ api_key, team_id, rate_limits, remaining_credits, concurrency, flags }`

### 4.4 错误处理

使用 `TransportableError` 系列（`lib/error.ts`）：

```typescript
// 抛出
throw new ScrapeJobTimeoutError("message");
throw new UnknownError(innerError);
throw new RacedRedirectError();

// 错误码类型
type ErrorCodes = "SCRAPE_TIMEOUT" | "SCRAPE_ALL_ENGINES_FAILED" | "CRAWL_DENIAL" | ...
```

### 4.5 日志

```typescript
import { logger } from "../../lib/logger";
logger.info("message", { module: "name", teamId, url });
logger.error("error occurred", { error, path: req.path });
```

Winston 格式化，自动序列化 Error 对象。`zeroDataRetention` 标记的日志会被过滤。

---

## 5. 开发规范

### 构建/测试

```bash
pnpm install                       # 安装依赖
pnpm build                         # 编译 TypeScript → dist/
pnpm test                          # 单元测试（排除 E2E）
pnpm test:snips                    # E2E 测试（首选）
pnpm harness jest src/__tests__/snips/v2/scrape.test.ts  # 单个测试文件
pnpm format                        # Prettier 格式化
pnpm knip                          # 检查无用导入/代码
```

### 测试规范

- **E2E 测试 (snips)**：`src/__tests__/snips/` — **始终首选**
- **单元测试**：`src/**/__tests__/`
- 所有抓取测试必须使用 `scrapeTimeout`
- 条件测试用 `describeIf(!TEST_SELF_HOST)` 和 `itIf(HAS_AI)`
- 测试通过 harness 运行：`pnpm harness jest <test-file>`

### 新增控制器模板

```typescript
// controllers/v2/my-endpoint.ts
import { Request, Response } from "express";
import { RequestWithAuth } from "../v1/types";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().url(),
  // ...
});

export async function myController(req: RequestWithAuth, res: Response) {
  const parsed = requestSchema.parse(req.body);
  // 业务逻辑
  return res.json({ success: true, data: result });
}
```

### 路由注册模板

```typescript
// routes/v2.ts
v2Router.post(
  "/my-endpoint",
  authMiddleware(RateLimiterMode.Scrape),
  countryCheck,
  checkCreditsMiddleware(1),
  blocklistMiddleware,
  wrap(myController),
);
```

### 新增错误类型

```typescript
// lib/error.ts
export class MyCustomError extends TransportableError {
  constructor(message: string) {
    super("MY_ERROR_CODE", message);
  }
  serialize() {
    return super.serialize();
  }
  static deserialize(code: ErrorCodes, data: any) {
    const x = new MyCustomError(data.message);
    x.stack = data.stack;
    return x;
  }
}
```

---

## 6. 代码约束

### 代码风格

| 规范       | 要求                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| 格式化     | Prettier（trailing commas: all, tab width: 2, semicolons, double quotes, width: 80） |
| TypeScript | Target: ES2022, Module: NodeNext, strictNullChecks                                   |
| 运行时验证 | 使用 Zod schema 验证请求体                                                           |
| 导入顺序   | Node.js 内置 → 第三方包 → 内部模块                                                   |
| 文件命名   | `kebab-case.ts`                                                                      |
| 类名       | `PascalCase`                                                                         |
| 函数/变量  | `camelCase`                                                                          |
| 常量       | `UPPER_SNAKE_CASE`                                                                   |

### 错误处理

- 使用 `TransportableError` 系列（`lib/error.ts`），**禁止**直接 throw `new Error()`
- 框架级错误（Zod 验证、JSON 解析）在 `index.ts` 全局错误处理器中处理

### 日志

- 使用 `logger`（`lib/logger.ts`），**禁止** `console.log`
- 日志必须包含 `{ module, ...context }` 元数据
- `zeroDataRetention` 标记的日志会被自动过滤

### 环境变量

- 通过 `config.ts`（Zod schema）集中管理
- **禁止**直接 `process.env.X`（已配置项除外）
- 代码或提交中**禁止**包含 `.env`、密钥等敏感凭证

### Native 模块

- Rust native 模块：`native/` 目录，通过 `@mendable/firecrawl-rs` 包引用
- Go 共享库：`sharedLibs/go-html-to-md/`，编译为 `.so` 文件

### Docker

- 基础镜像：`node:22-slim`
- 多阶段构建：go-build → build → runtime
- 默认端口：8080（容器内部），映射到宿主机 3002
