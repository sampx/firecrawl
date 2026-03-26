# Firecrawl 架构设计文档

## 1. 系统概览

### 1.1 项目定位

Firecrawl 是一个将网站转换为 LLM 可用数据的 API 服务，为 AI 应用提供实时网络数据采集能力。

| 属性 | 值 |
|------|-----|
| GitHub | https://github.com/firecrawl/firecrawl |
| 许可证 | AGPL-3.0 (核心), MIT (SDK) |
| 主要语言 | TypeScript (Node.js) |
| 代码规模 | ~113,000+ 行 TypeScript |

### 1.2 核心功能

| 功能 | 描述 |
|------|------|
| **Scrape** | 单页面抓取，输出 Markdown/HTML/截图/结构化 JSON |
| **Crawl** | 全站爬取，支持深度限制、并发控制 |
| **Search** | 网络搜索 + 结果页面完整内容抓取 |
| **Map** | 即时发现网站所有 URL |
| **Extract** | 结构化数据提取 (LLM 驱动) |
| **Agent** | AI Agent 自动化数据收集 (FIRE-1) |
| **Deep Research** | 深度研究功能 |

---

## 2. 整体架构

### 2.1 架构分层

```
┌─────────────────────────────────────────────────────────────────┐
│  SDK Layer                                                        │
│  TypeScript | Python | Rust | Go | CLI                           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  API Gateway Layer (Express + WebSocket)                         │
│  V0 (deprecated) | V1 | V2 (current)                            │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Controller Layer                                                │
│  scrape.ts | crawl.ts | search.ts | extract.ts | map.ts         │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Service Layer                                                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│  │ Queue       │ Auth        │ Billing     │ Webhook         │ │
│  │ (NuQ/Bull) │ (ACUC)      │ (Stripe)    │ (Async Events)  │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘ │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Scraping Engine Layer                                          │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐ │
│  │ Engines     │Transformer │Postprocessor│ Search         │ │
│  │ (Multi)     │ (Markdown) │ (Diff)      │ (SearXNG)      │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘ │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Infrastructure Layer                                            │
│  PostgreSQL | Redis | RabbitMQ | Supabase | GCS                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 请求处理流程

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│  Client  │────▶│  Middleware │────▶│  Controller   │────▶│  Queue      │
│  Request │     │  Chain      │     │  (Sync/Async) │     │  (NuQ/Bull) │
└──────────┘     └──────────────┘     └────────────────┘     └──────┬──────┘
                                                                     │
                              ┌──────────────────────────────────────┘
                              ▼
                    ┌────────────────┐     ┌─────────────┐
                    │  Scraping      │────▶│  Transform  │
                    │  Engine        │     │  (Markdown) │
                    └────────────────┘     └──────┬──────┘
                                                   │
                              ┌────────────────────┘
                              ▼
                    ┌────────────────┐     ┌─────────────┐
                    │  Webhook/      │◀────│  Response   │
                    │  Storage       │     │  (Async)    │
                    └────────────────┘     └─────────────┘
```

---

## 3. 核心组件设计

### 3.1 API Gateway

**职责**：请求接收、路由分发、认证鉴权、限流控制

| 组件 | 路径 | 说明 |
|------|------|------|
| Express 应用 | `apps/api/src/index.ts` | Web + WebSocket |
| V2 路由 | `apps/api/src/routes/v2.ts` | 当前主版本 |
| 中间件链 | `apps/api/src/routes/shared.ts` | 认证→限流→计费 |

**中间件链顺序**：
```
authMiddleware → countryCheck → checkCreditsMiddleware → blocklistMiddleware → controller
```

### 3.2 爬虫引擎

**设计模式**：多引擎回退 + 责任链

**引擎优先级**：
```
index (缓存) > fire-engine > playwright > fetch > pdf/document
```

| 引擎 | 路径 | 特点 |
|------|------|------|
| **Fire-Engine** | `engines/fire-engine/` | Chrome CDP，高保真渲染 |
| **Playwright** | `engines/playwright/` | 浏览器自动化，跨平台 |
| **Fetch** | `engines/fetch/` | 原生 HTTP，快速 |
| **PDF** | `engines/pdf/` | LlamaParse 解析 |
| **Document** | `engines/document/` | DOCX/XLSX 处理 |
| **Index** | `engines/index/` | 缓存索引 |

**引擎选择逻辑**：
```
Request → Feature Flags → Robots.txt → Engine Fallback Loop → Transformers → Document
```

### 3.3 队列系统

**双队列架构**：

| 队列 | 后端 | 用途 | 特点 |
|------|------|------|------|
| **NuQ** | PostgreSQL + RabbitMQ | scrape/crawl 作业 | 高性能、低延迟 |
| **BullMQ** | Redis | billing, deep research, precrawl | 通用队列 |

**NuQ 作业状态**：
```
queued → active → completed / failed
```

**Worker 类型**：
| Worker | 职责 |
|--------|------|
| NuQ Worker | 处理 scrape/crawl 作业 |
| Extract Worker | 结构化提取 |
| Index Worker | 搜索索引 |

### 3.4 认证与计费

**ACUC (Auth Credit Usage Chunk)**：
```typescript
{
  api_key: string;
  team_id: string;
  rate_limits: RateLimits;
  remaining_credits: number;
  concurrency: number;
  flags: TeamFlags;
}
```

### 3.5 AI 功能

**提取服务** (`lib/extract/extraction-service.ts`)：
- 支持模型：OpenAI, Anthropic, Google, Groq, Ollama, DashScope
- JSON Schema 验证
- 批量提取

**Agent 服务**：
- FIRE-1 Agent 自动化
- 支持 `spark-1-mini` / `spark-1-pro` 模型

---

## 4. API 设计

### 4.1 版本策略

| 版本 | 状态 | 前缀 | 特点 |
|------|------|------|------|
| V0 | 已弃用 | `/v0/` | 早期版本 |
| V1 | 维护中 | `/v1/` | 稳定版本 |
| V2 | 当前 | `/v2/` | 最新功能、严格验证 |

### 4.2 V2 API 端点

| 端点 | 方法 | 同步/异步 | 描述 |
|------|------|----------|------|
| `/v2/scrape` | POST | 异步 | 单页面抓取 |
| `/v2/scrape/:jobId` | GET | 同步 | 抓取状态 |
| `/v2/crawl` | POST | 异步 | 网站爬取 |
| `/v2/crawl/:jobId` | GET | 同步 | 爬取状态 |
| `/v2/crawl/:jobId` | DELETE | 同步 | 取消爬取 |
| `/v2/crawl/:jobId` | WS | 异步 | WebSocket 实时状态 |
| `/v2/map` | POST | 同步 | URL 发现 |
| `/v2/search` | POST | 异步 | 搜索 + 抓取 |
| `/v2/extract` | POST | 异步 | 结构化提取 |
| `/v2/agent` | POST | 异步 | AI Agent |
| `/v2/batch/scrape` | POST | 异步 | 批量抓取 |
| `/v2/team/credit-usage` | GET | 同步 | 信用使用统计 |

### 4.3 请求示例

**Scrape**：
```typescript
interface ScrapeRequest {
  url: string;
  formats?: ("markdown" | "html" | "screenshot" | "links" | "changeTracking")[];
  actions?: Action[];
  waitFor?: number;
  timeout?: number;
  headers?: Record<string, string>;
  mobile?: boolean;
  location?: { country: string };
}
```

**Crawl**：
```typescript
interface CrawlRequest {
  url: string;
  limit?: number;
  maxDepth?: number;
  allowBackwardLinks?: boolean;
  allowExternalLinks?: boolean;
  scrapeOptions?: ScrapeRequest;
}
```

---

## 5. 数据流设计

### 5.1 Scrape 流程

```
1. Client POST /v2/scrape
         │
         ▼
2. Middleware Chain (Auth → Rate Limit → Credits)
         │
         ▼
3. Create NuQ Job → Return Job ID
         │
         ▼
4. NuQ Worker picks up job
         │
         ▼
5. Engine Selection (feature flags → robots.txt)
         │
         ▼
6. Execute scraping (fire-engine → playwright → fetch)
         │
         ▼
7. Transform (markdown/html/screenshot)
         │
         ▼
8. Post-process (diff tracking, etc.)
         │
         ▼
9. Store result (Redis/Supabase)
         │
         ▼
10. Webhook notification / Client polling
```

### 5.2 Crawl 流程

```
1. Client POST /v2/crawl
         │
         ▼
2. Middleware Chain
         │
         ▼
3. Create Crawl Job + Redis state
         │
         ▼
4. NuQ Worker processes URLs
         │
         ▼
5. URL Discovery (Map) → Queue child jobs
         │
         ▼
6. Scrape each URL → Update Redis state
         │
         ▼
7. WebSocket progress updates
         │
         ▼
8. Completion → Final result stored
```

### 5.3 Search 流程

```
1. Client POST /v2/search
         │
         ▼
2. Query SearXNG / Google
         │
         ▼
3. Extract URLs from results
         │
         ▼
4. Queue scrape jobs for each URL
         │
         ▼
5. Worker scrapes in parallel
         │
         ▼
6. Aggregate results
         │
         ▼
7. Return combined response
```

---

## 6. 技术选型

### 6.1 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| Web 框架 | Express.js | 4.22.0 |
| WebSocket | express-ws | - |
| 验证 | Zod | 4.1.12 |
| 队列 (通用) | BullMQ | 5.56.7 |
| 队列 (高性能) | NuQ (PostgreSQL + RabbitMQ) | - |
| 缓存/会话 | Redis (ioredis) | 5.6.1 |
| 数据库 | PostgreSQL (pg) | 8.16.3 |
| 消息队列 | RabbitMQ (amqplib) | 0.10.9 |
| HTML 解析 | Cheerio | 1.0.0-rc.12 |
| 浏览器 | Playwright (微服务) | - |
| AI SDK | ai (Vercel) | 5.0.89 |
| 日志 | Winston | 3.14.2 |
| 监控 | Sentry | 10.27.0 |

### 6.2 SDK

| SDK | 路径 | 许可证 |
|-----|------|--------|
| JavaScript | `apps/js-sdk/` | MIT |
| Python | `apps/python-sdk/` | MIT |
| Rust | `apps/rust-sdk/` | MIT |
| CLI | `apps/cli/` | MIT |

---

## 7. 项目结构

```
apps/
├── api/                         # 核心 API 服务
│   └── src/
│       ├── index.ts            # 应用入口
│       ├── config.ts           # 配置管理
│       ├── controllers/        # 请求处理器
│       │   ├── v1/
│       │   └── v2/
│       ├── routes/             # 路由定义
│       ├── services/            # 业务逻辑
│       │   ├── worker/         # NuQ Worker
│       │   ├── billing/        # 计费
│       │   ├── webhook/       # Webhook
│       │   └── ...
│       ├── scraper/            # 爬虫引擎
│       │   └── scrapeURL/
│       │       ├── engines/   # 抓取引擎
│       │       ├── transformers/
│       │       └── postprocessors/
│       ├── lib/                # 共享库
│       │   ├── logger.ts
│       │   ├── error.ts
│       │   └── extract/
│       └── __tests__/          # E2E 测试
│
├── js-sdk/                     # JavaScript SDK
├── python-sdk/                 # Python SDK
├── rust-sdk/                   # Rust SDK
├── cli/                        # 命令行工具
├── playwright-service-ts/      # 浏览器渲染微服务
├── nuq-postgres/               # PostgreSQL 镜像
└── test-suite/                 # 测试套件
```

---

## 8. 部署架构

### 8.1 Docker Compose

```yaml
services:
  playwright-service:
    image: ghcr.io/firecrawl/playwright-service
    environment:
      PORT: 3000
      MAX_CONCURRENT_PAGES: 10
    cpus: 2.0
    mem_limit: 4G

  api:
    build: apps/api
    environment:
      REDIS_URL: redis://redis:6379
      NUQ_RABBITMQ_URL: amqp://rabbitmq:5672
      PLAYWRIGHT_MICROSERVICE_URL: http://playwright-service:3000
    ports:
      - "3002:3002"
    cpus: 4.0
    mem_limit: 8G

  redis:
    image: redis:alpine

  rabbitmq:
    image: rabbitmq:3-management

  nuq-postgres:
    build: apps/nuq-postgres
```

### 8.2 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| api | 3002 | Firecrawl API |
| playwright-service | 3000 | 浏览器渲染 |
| redis | 6379 | 缓存/队列 |
| rabbitmq | 5672/15672 | 消息队列 |
| nuq-postgres | 5432 | PostgreSQL |
| searxng | 8080 | 搜索服务 |

### 8.3 环境变量分类

| 类别 | 变量 |
|------|------|
| **基础** | PORT, HOST, ENV |
| **数据库** | POSTGRES_*, REDIS_URL, NUQ_DATABASE_URL |
| **认证** | SUPABASE_URL, SUPABASE_SERVICE_TOKEN |
| **AI** | OPENAI_API_KEY, OLLAMA_BASE_URL, MODEL_NAME |
| **爬虫** | FIRE_ENGINE_BETA_URL, PLAYWRIGHT_MICROSERVICE_URL |
| **搜索** | SEARXNG_ENDPOINT |
| **计费** | STRIPE_* |

---

## 9. 关键文件索引

| 组件 | 文件路径 |
|------|----------|
| API 入口 | `apps/api/src/index.ts` |
| V2 路由 | `apps/api/src/routes/v2.ts` |
| 配置管理 | `apps/api/src/config.ts` |
| 爬虫主入口 | `apps/api/src/scraper/scrapeURL/index.ts` |
| 引擎选择 | `apps/api/src/scraper/scrapeURL/engines/index.ts` |
| NuQ 队列 | `apps/api/src/services/worker/nuq.ts` |
| 提取服务 | `apps/api/src/lib/extract/extraction-service.ts` |
| LLM 提取 | `apps/api/src/scraper/scrapeURL/transformers/llmExtract.ts` |
| 认证中间件 | `apps/api/src/routes/shared.ts` |
| Docker 配置 | `docker-compose.yaml` |

---

*文档版本: 1.0*
*最后更新: 2026-03-26*
