# **🔥 Firecrawl**

**将网站转换为 LLM 可用的数据。**

[**Firecrawl**](https://firecrawl.dev/?ref=github) 是一个 API 服务，可以爬取、抓取和从任何网站提取结构化数据，为 AI 应用提供实时网络数据支持。

Looking for our MCP? Check out the repo [here](https://github.com/firecrawl/firecrawl-mcp-server).

---

## 为什么选择 Firecrawl？

- **LLM 就绪输出**: 干净的 Markdown、结构化 JSON、截图、HTML 等
- **行业领先的可靠性**: 在[基准测试](https://www.firecrawl.dev/blog/the-worlds-best-web-data-api-v25)中覆盖率 >80%
- **处理复杂场景**: 代理、JavaScript 渲染、动态内容
- **高度可定制**: 排除标签、认证墙后爬取、深度限制等
- **媒体解析**: 自动从 PDF、DOCX 和图片中提取文本
- **Actions**: 点击、滚动、输入、等待等交互操作
- **批量处理**: 异步抓取数千个 URL
- **变更追踪**: 监控网站内容变化

---

## 功能概览

| 功能 | 描述 |
|------|------|
| [**Scrape**](#scrape) | 将 URL 转换为 Markdown、HTML、截图或结构化 JSON |
| [**Search**](#search) | 搜索网络并获取结果页面的完整内容 |
| [**Agent**](#agent) | 自动化数据收集，只需描述你需要什么 |
| [**Crawl**](#crawl) | 单次请求爬取网站的所有 URL |
| [**Map**](#map) | 即时发现网站上的所有 URL |
| [**CLI**](#cli) | 命令行工具，适合 AI Agent 和开发者 |

---

## 快速开始

### 云服务

注册 [firecrawl.dev](https://firecrawl.dev) 获取 API Key，秒级开始使用：

```bash
curl -X POST 'https://api.firecrawl.dev/v2/scrape' \
  -H 'Authorization: Bearer fc-YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'
```

### 本地自托管

```bash
# 克隆项目
git clone https://github.com/firecrawl/firecrawl.git
cd firecrawl

# 配置环境变量
cp .env.example .env

# 启动所有服务
./scripts/start.sh

# 或使用统一命令
firecrawl start
```

**本地访问地址:**
- Firecrawl API: http://localhost:3002
- RabbitMQ 管理界面: http://localhost:15672 (guest/guest)

---

## CLI 命令行工具

Firecrawl 提供功能完整的 CLI 工具，专为 AI Agent 和开发者设计。

### 安装

```bash
cd apps/cli
pnpm install
pnpm build
npm link  # 全局链接 fc-cli 命令
```

### 核心命令

```bash
# 抓取单个 URL
fc-cli scrape https://example.com

# 搜索网络
fc-cli search "firecrawl web scraping" --limit 5

# 爬取网站
fc-cli crawl https://example.com --limit 10
fc-cli crawl-status <job_id>

# 映射网站结构
fc-cli map https://example.com

# 查看使用量
fc-cli usage
```

### AI 功能

```bash
# 结构化提取
fc-cli extract https://example.com/product --prompt "提取产品价格和名称"

# 生成 LLMs.txt
fc-cli llmstxt https://example.com
```

### 交互模式

```bash
fc-cli --interactive
```

### 输出格式

支持 `json`（默认）、`yaml`、`table` 三种格式：

```bash
fc-cli scrape https://example.com --format yaml -o result.yaml
```

### 配置

| 环境变量 | CLI 选项 | 描述 | 默认值 |
|----------|----------|------|--------|
| `FIRECRAWL_API_URL` | `--api-url` | API 地址 | `http://localhost:3002` |
| `FIRECRAWL_API_KEY` | `--api-key` | API Key | 无 |
| `FIRECRAWL_OUTPUT` | `--format` | 输出格式 | `json` |

---

## 本地管理命令

项目提供了统一的 `firecrawl` 命令和脚本管理服务：

```bash
# 启动所有服务
firecrawl start
# 或
./scripts/start.sh

# 查看服务状态（含健康检查和资源使用）
firecrawl status
# 或
./scripts/status.sh

# 查看日志
firecrawl logs [service] [lines]
# 或
./scripts/logs.sh api 100

# 停止服务
firecrawl stop
# 或
./scripts/stop.sh

# 重启服务
firecrawl restart
# 或
./scripts/restart.sh
```

**可用服务**: `api`, `searxng`, `redis`, `searxng-redis`, `rabbitmq`, `playwright-service`, `nuq-postgres`

---

## Scrape

将任何 URL 转换为 Markdown、HTML 或结构化数据。

```bash
curl -X POST 'https://api.firecrawl.dev/v2/scrape' \
  -H 'Authorization: Bearer fc-YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://docs.firecrawl.dev",
    "formats": ["markdown", "html"]
  }'
```

### 结构化提取 (JSON Mode)

```python
from firecrawl import Firecrawl
from pydantic import BaseModel

app = Firecrawl(api_key="fc-YOUR_API_KEY")

class CompanyInfo(BaseModel):
    company_mission: str
    is_open_source: bool
    is_in_yc: bool

result = app.scrape(
    'https://firecrawl.dev',
    formats=[{"type": "json", "schema": CompanyInfo.model_json_schema()}]
)
print(result.json)
```

### Actions (抓取前交互)

```python
doc = app.scrape(
    url="https://example.com/login",
    formats=["markdown"],
    actions=[
        {"type": "write", "text": "user@example.com"},
        {"type": "press", "key": "Tab"},
        {"type": "write", "text": "password"},
        {"type": "click", "selector": 'button[type="submit"]'},
        {"type": "wait", "milliseconds": 2000},
        {"type": "screenshot"}
    ]
)
```

---

## Search

搜索网络并可选抓取结果页面。

```bash
curl -X POST 'https://api.firecrawl.dev/v2/search' \
  -H 'Authorization: Bearer fc-YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "firecrawl web scraping",
    "limit": 5
  }'
```

### 搜索并抓取内容

```python
results = firecrawl.search(
    "firecrawl web scraping",
    limit=3,
    scrape_options={"formats": ["markdown", "links"]}
)
```

---

## Agent

**获取网页数据最简单的方式。** 只需描述你需要什么，AI Agent 会自动搜索、导航和提取。

```bash
curl -X POST 'https://api.firecrawl.dev/v2/agent' \
  -H 'Authorization: Bearer fc-YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Find the pricing plans for Notion"
  }'
```

### 结构化输出

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class Founder(BaseModel):
    name: str = Field(description="创始人全名")
    role: Optional[str] = Field(None, description="职位")

class FoundersSchema(BaseModel):
    founders: List[Founder]

result = app.agent(
    prompt="查找 Firecrawl 的创始人",
    schema=FoundersSchema
)
print(result.data)
```

### 模型选择

| 模型 | 成本 | 适用场景 |
|------|------|----------|
| `spark-1-mini` (默认) | 节省 60% | 大多数任务 |
| `spark-1-pro` | 标准 | 复杂研究、关键提取 |

---

## Crawl

爬取整个网站获取所有页面内容。

```bash
curl -X POST 'https://api.firecrawl.dev/v2/crawl' \
  -H 'Authorization: Bearer fc-YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://docs.firecrawl.dev",
    "limit": 100,
    "scrapeOptions": {"formats": ["markdown"]}
  }'
```

### 检查爬取状态

```bash
curl -X GET 'https://api.firecrawl.dev/v2/crawl/123-456-789' \
  -H 'Authorization: Bearer fc-YOUR_API_KEY'
```

---

## Map

即时发现网站上的所有 URL。

```bash
curl -X POST 'https://api.firecrawl.dev/v2/map' \
  -H 'Authorization: Bearer fc-YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://firecrawl.dev"}'
```

---

## SDKs

### Python

```bash
pip install firecrawl-py
```

```python
from firecrawl import Firecrawl

app = Firecrawl(api_key="fc-YOUR_API_KEY")

# 抓取
doc = app.scrape("https://firecrawl.dev", formats=["markdown"])
print(doc.markdown)

# Agent
result = app.agent(prompt="查找 Stripe 的创始人")
print(result.data)

# 爬取
docs = app.crawl("https://docs.firecrawl.dev", limit=50)
for doc in docs.data:
    print(doc.metadata.source_url)

# 搜索
results = app.search("web scraping tools 2024", limit=10)
```

### Node.js

```bash
npm install @mendable/firecrawl-js
```

```javascript
import Firecrawl from '@mendable/firecrawl-js';

const app = new Firecrawl({ apiKey: 'fc-YOUR_API_KEY' });

// 抓取
const doc = await app.scrape('https://firecrawl.dev', { formats: ['markdown'] });
console.log(doc.markdown);

// Agent
const result = await app.agent({ prompt: '查找 Stripe 的创始人' });
console.log(result.data);

// 爬取
const docs = await app.crawl('https://docs.firecrawl.dev', { limit: 50 });

// 搜索
const results = await app.search('web scraping tools 2024', { limit: 10 });
```

### 社区 SDK

- [Go SDK](https://github.com/mendableai/firecrawl-go)
- [Rust SDK](https://docs.firecrawl.dev/sdks/rust)

---

## 架构

```
┌─────────────────────────────────────────────────────────────────┐
│  API Layer (Express + WebSocket)                                │
│  V0 (deprecated) | V1 | V2 (current)                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Service Layer: Scraper | Crawler | Extract | Search            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Worker Layer: NuQ Workers (xN) | Extract/Index Workers         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  Data Layer: PostgreSQL (NuQ) | Redis | RabbitMQ | Supabase     │
│  + SearXNG (搜索服务)                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 服务列表

| 服务 | 端口 | 说明 |
|------|------|------|
| api | 3002 | Firecrawl API |
| searxng | 8080 (内部) | SearXNG 搜索服务 |
| redis | 6379 | 缓存/队列 |
| rabbitmq | 5672, 15672 | 消息队列 |
| nuq-postgres | 5432 | PostgreSQL 数据库 |
| playwright-service | 3000 | 浏览器渲染服务 |

---

## 资源

- [API 文档](https://docs.firecrawl.dev)
- [API 参考](https://docs.firecrawl.dev/api-reference/introduction)
- [Playground](https://firecrawl.dev/playground)
- [更新日志](https://firecrawl.dev/changelog)

---

## 集成

**AI Agent 工具**
- [Firecrawl Skill](https://docs.firecrawl.dev/sdks/cli)
- [Firecrawl MCP](https://github.com/mendableai/firecrawl-mcp-server)

**平台**
- [Lovable](https://docs.lovable.dev/integrations/firecrawl)
- [Zapier](https://zapier.com/apps/firecrawl/integrations)
- [n8n](https://n8n.io/integrations/firecrawl/)

[查看所有集成 →](https://www.firecrawl.dev/integrations)

---

## 开源 vs 云服务

Firecrawl 采用 AGPL-3.0 开源协议。云版本 [firecrawl.dev](https://firecrawl.dev) 提供额外功能：

![Open Source vs Cloud](https://raw.githubusercontent.com/firecrawl/firecrawl/main/img/open-source-cloud-comparison.png)

---

## 贡献

欢迎贡献！请阅读 [Contributing Guide](https://github.com/firecrawl/firecrawl/blob/main/CONTRIBUTING.md)。

### Contributors

<a href="https://github.com/firecrawl/firecrawl/graphs/contributors">
  <img alt="contributors" src="https://contrib.rocks/image?repo=firecrawl/firecrawl"/>
</a>

---

## License

本项目主要采用 GNU Affero General Public License v3.0 (AGPL-3.0) 许可。SDK 和部分 UI 组件采用 MIT 许可。详见各目录的 LICENSE 文件。

---

**用户有责任尊重网站政策进行爬取。** 默认情况下，Firecrawl 遵守 robots.txt 指令。

<p align="right" style="font-size: 14px; color: #555; margin-top: 20px;">
  <a href="#readme-top" style="text-decoration: none; color: #007bff; font-weight: bold;">
    ↑ 返回顶部 ↑
  </a>
</p>
