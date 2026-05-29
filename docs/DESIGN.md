# Firecrawl

> **Status**: Active
> **Updated**: 2026-05-29
> **Parent Architecture**: N/A
> **Parent Product**: N/A

## 0. Change Log

| Date | Type | Summary |
|---|---|---|
| 2026-05-29 | Updated | 从研究引用重新定位为正式项目；PRD 合并入设计文档；路径从 labs/ 迁移至 projects/ |
| 2026-03-26 | Created | 初始版本（研究引用定位） |

## 1. Project Role

WopalSpace 的自托管网页数据采集服务。为 fc-cli（CLI 工具）和 fc-local（WopalSpace 技能）提供后台 API 能力，包括单页抓取、全站爬取、URL 发现、网络搜索、结构化提取等。

Fork 自 [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl)，以 Docker Compose 自托管方式运行，通过 HTTP API 对外提供服务。

**使命**：为任何 AI 应用提供可靠、结构化的实时网页数据，屏蔽浏览器渲染、反爬虫、PDF 解析等复杂性。

**核心原则**：
1. **LLM 就绪** — 输出直接适配大模型消费，无需二次清洗
2. **多引擎回退** — 单一引擎失败时自动降级，最大化抓取成功率
3. **异步优先** — 复杂任务走队列，客户端不阻塞
4. **自托管友好** — 完整功能可在本地 Docker 环境运行

| 负责 | 不负责 |
|------|--------|
| 提供抓取/爬取/搜索/提取 API | 上游 SaaS 功能（Stripe 计费、Supabase 用户管理） |
| Docker Compose 自托管部署 | fc-cli / fc-local 的前端交互逻辑 |
| fc-cli CLI 封装 | 上游代码的深度定制（保持 fork 可追踪） |

## 2. Capability Scope

| Capability | Description |
|------------|-------------|
| Scrape | 单页抓取，输出 Markdown/HTML/截图/链接 |
| Crawl | 全站爬取，深度限制、并发控制、实时进度 |
| Batch Scrape | 异步批量 URL 抓取 |
| Map | 即时发现网站所有 URL |
| Search | 网络搜索 + 结果页完整内容抓取 |
| Extract | LLM 驱动结构化数据提取 |

**排除项**：Agent (FIRE-1)、Deep Research、SaaS 计费体系、JS/Python/Rust SDK 分发、前端 UI。

## 3. Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Fork 上游，自托管 API 服务** | 保留上游 API 能力，通过 Docker Compose 自托管；精简 SaaS 依赖 |
| **自建 fc-cli 封装层** | 上游 CLI 不满足 WopalSpace 使用场景，自建 CLI 直接调用自托管 API，匹配 fc-local 技能协议 |

## 4. Module Architecture

| Module | Responsibility | Carrier |
|--------|---------------|---------|
| **API Server** | HTTP API + WebSocket，接收抓取/爬取/搜索/提取请求 | `apps/api/` |
| **fc-cli** | CLI 封装，直接调用自托管 API | `apps/cli/` |
| **Playwright Service** | 浏览器渲染微服务 | `apps/playwright-service-ts/` |
| **my-fc** | 服务生命周期管理（start/stop/status/health/logs） | `my-fc`（根目录脚本） |
| **SearXNG Config** | 搜索服务配置 | `searxng/` |
| **Service Scripts** | Docker 服务启停辅助脚本 | `scripts/` |
| **Docker Compose** | 自托管编排（API + PostgreSQL + Redis + RabbitMQ + Playwright + SearXNG） | `docker-compose.yaml` |

## 5. Technical Stack Choices

| Domain | Choice | Rationale | Boundary |
|--------|--------|-----------|----------|
| API Runtime | Node.js + Express + TypeScript | 上游选型，沿用 | 仅 API Server |
| 请求验证 | Zod | V2 API 严格 schema 验证 | API 层 |
| 作业队列 | NuQ (PostgreSQL + RabbitMQ) + BullMQ (Redis) | 上游双队列设计，scrape/crawl 用 NuQ，通用任务用 BullMQ | 后端服务 |
| 浏览器渲染 | Playwright 微服务 | JS 渲染场景必需 | 独立容器 |
| 搜索引擎 | SearXNG | 自托管元搜索，无 API key 依赖 | 独立容器 |
| CLI 封装 | TypeScript + Commander.js | fc-cli，直接调用自托管 API | `apps/cli/` |
| 服务管理 | Bash 脚本 | Docker Compose 生命周期管理 | 根目录脚本 |
| 容器编排 | Docker Compose | 自托管最小可行方案 | `docker-compose.yaml` |

## 6. Interfaces and Contracts

### 6.1 fc-cli 命令接口

| Command | Input | Output |
|---------|-------|--------|
| `fc-cli scrape <url>` | `-o`, `--format`, `--clean`, `--prompt` | Markdown 文件（默认 stdout） |
| `fc-cli crawl <url>` | `--limit`, `--wait`, `-o`, `--clean`, `--prompt` | 目录（每页一个 .md） |
| `fc-cli batch <file>` | `--wait`, `-o` | JSON |
| `fc-cli map <url>` | `--limit`, `--filter` | URL 列表 |
| `fc-cli search <query>` | `--limit` | Markdown |
| `fc-cli llmstxt <path>` | `--full` | LLMs.txt |
| `*-status <id>` | `--wait` | 作业状态 JSON |

### 6.2 my-fc 服务管理接口

| Command | Behavior |
|---------|----------|
| `my-fc start` | 启动 Docker Compose 全部服务 |
| `my-fc stop` | 停止服务 |
| `my-fc status` | 容器健康状态 |
| `my-fc health` | 完整检查（API + scrape 测试） |
| `my-fc logs <service> [lines]` | 查看服务日志 |
| `my-fc restart` | 重启服务 |

### 6.3 上游 V2 HTTP API

沿用上游 API，不做定制。fc-cli 通过环境变量指向自托管实例。

| Endpoint | Method | Sync/Async |
|----------|--------|------------|
| `/v2/scrape` | POST | Async |
| `/v2/crawl` | POST | Async |
| `/v2/crawl/:jobId` | GET/DELETE/WS | Sync/Realtime |
| `/v2/map` | POST | Sync |
| `/v2/search` | POST | Async |
| `/v2/extract` | POST | Async |
| `/v2/batch/scrape` | POST | Async |

## 7. Data and State Model

| State | Location | Owner | Rules |
|-------|----------|-------|-------|
| API 作业队列 | NuQ PostgreSQL | API Server | 作业状态机：queued → active → completed/failed |
| 作业消息 | RabbitMQ | NuQ Worker | 消息代理，可选 |
| ACUC 缓存 / 速率限制 / 分布式锁 | Redis | API Server | 缓存刷新由上游逻辑管理 |

## 8. Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| 上游架构文档 | `docs/ARCHITECTURE.md` | 完整分层架构、数据流、组件设计 |
| 部署文档 | `docs/DEPLOYMENT.md` | 自托管部署指南 |
| 项目开发规范 | `AGENTS.md` | 代码风格、构建测试、目录结构 |
| fc-local 技能 | `.wopal/skills/fc-local/SKILL.md` | CLI 使用指南与集成协议 |
