# Firecrawl API

将网站转换为 LLM 可用数据的后端引擎 — 支持网页抓取、全站爬取、搜索与结构化提取。

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式（自动编译 + 热重载）
pnpm dev

# 生产模式
pnpm build && pnpm server:production

# 或使用 harness 编排器
pnpm harness -- --start-built
```

## 核心功能

| 功能        | 描述                                            |
| ----------- | ----------------------------------------------- |
| **Scrape**  | 单页面抓取，输出 Markdown/HTML/截图/结构化 JSON |
| **Crawl**   | 全站爬取，支持深度限制、并发控制                |
| **Search**  | 网络搜索 + 结果页面完整内容抓取                 |
| **Map**     | 即时发现网站所有 URL                            |
| **Extract** | LLM 驱动的结构化数据提取                        |
| **Agent**   | FIRE-1 Agent 自动化数据收集                     |
| **Batch**   | 异步批量抓取数千个 URL                          |

## 技术栈

| 类别   | 技术                                         |
| ------ | -------------------------------------------- |
| 运行时 | Node.js 22                                   |
| 语言   | TypeScript (ES2022, NodeNext)                |
| 框架   | Express.js + express-ws                      |
| 队列   | NuQ (PostgreSQL + RabbitMQ) + BullMQ (Redis) |
| 验证   | Zod                                          |
| 日志   | Winston                                      |
| 监控   | Sentry                                       |
| 测试   | Jest + ts-jest                               |
| 格式化 | Prettier                                     |
| Native | Rust (firecrawl-rs), Go (html-to-markdown)   |

## 项目结构

```
src/
├── index.ts                 # Express 应用入口
├── harness.ts               # 进程编排器
├── config.ts                # Zod 配置管理
├── controllers/v2/          # V2 API 控制器
├── routes/                  # 路由注册与中间件链
├── scraper/scrapeURL/       # 多引擎抓取核心
├── services/                # 业务服务（队列、认证、计费、Webhook）
└── lib/                     # 共享库（日志、错误、工具）
```

## 命令速查

```bash
pnpm dev                           # 开发模式
pnpm build                         # 编译
pnpm test                          # 单元测试
pnpm test:snips                    # E2E 测试（首选）
pnpm harness jest <file>           # 运行指定测试
pnpm format                        # 格式化代码
pnpm knip                          # 检查无用代码
```

## Docker 部署

```bash
# 从 monorepo 根目录
docker compose build api
docker compose up -d
```

API 默认端口：`3002`

## 相关文档

| 文档                                       | 说明                 |
| ------------------------------------------ | -------------------- |
| [AGENTS.md](./AGENTS.md)                   | 项目规范（面向开发） |
| [Architecture](../../docs/ARCHITECTURE.md) | 架构设计文档         |
| [Deployment](../../docs/DEPLOYMENT.md)     | 部署安装指南         |
| [API Reference](./openapi.json)            | OpenAPI 规范         |

## License

AGPL-3.0（核心）| MIT（SDK）
