# Firecrawl 部署安装配置文档

## 概述

Firecrawl 是一个强大的网页抓取和爬虫平台，支持 Scrape、Crawl、Search、Extract 等功能。

## 环境要求

| 组件 | 要求 |
|------|------|
| Docker | >= 20.10 |
| Docker Compose | >= 2.0 |
| 内存 | >= 8GB |
| 磁盘 | >= 20GB |

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/firecrawl/firecrawl.git
cd firecrawl
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件
```

### 3. 启动服务

```bash
docker compose build
docker compose up -d
```

服务启动后访问：
- **Firecrawl API**: http://localhost:3002
- **RabbitMQ 管理**: http://localhost:15672 (guest/guest)

## 环境变量配置

### 必须配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | API 服务端口 | 3002 |
| HOST | 监听地址 | 0.0.0.0 |
| USE_DB_AUTHENTICATION | 启用数据库认证 | false |

### AI 功能

| 变量 | 说明 |
|------|------|
| OPENAI_API_KEY | OpenAI API Key |
| OPENAI_BASE_URL | OpenAI 兼容 API 地址 |
| MODEL_NAME | 模型名称 |
| OLLAMA_BASE_URL | Ollama API 地址 |
| MODEL_EMBEDDING_NAME | Embedding 模型名称 |

### 搜索功能

| 变量 | 说明 |
|------|------|
| SEARXNG_ENDPOINT | SearXNG 服务地址 |
| SEARXNG_ENGINES | 搜索引擎列表 |
| SEARXNG_CATEGORIES | 搜索类别 |

### 代理配置

| 变量 | 说明 |
|------|------|
| PROXY_SERVER | 代理服务器地址 |
| PROXY_USERNAME | 代理用户名 |
| PROXY_PASSWORD | 代理密码 |

### 数据库

| 变量 | 说明 | 默认值 |
|------|------|--------|
| POSTGRES_USER | 数据库用户 | firecrawl |
| POSTGRES_PASSWORD | 数据库密码 | firecrawl_password |
| POSTGRES_DB | 数据库名称 | firecrawl |

### 其他配置

| 变量 | 说明 |
|------|------|
| SUPABASE_URL | Supabase 地址 |
| SUPABASE_SERVICE_TOKEN | Supabase Service Token |
| LLAMAPARSE_API_KEY | LlamaParse API Key |
| SLACK_WEBHOOK_URL | Slack Webhook |
| BULL_AUTH_KEY | 队列管理面板密钥 |
| MAX_CPU | 最大 CPU 使用率 (0.0-1.0) |
| MAX_RAM | 最大内存使用率 (0.0-1.0) |
| ALLOW_LOCAL_WEBHOOKS | 允许本地 Webhook |

## 服务组件

| 服务 | 端口 | 说明 |
|------|------|------|
| api | 3002 | Firecrawl API |
| playwright-service | 3000 | 浏览器渲染服务 |
| redis | 6379 | 缓存与队列 |
| rabbitmq | 5672/15672 | 消息队列 |
| nuq-postgres | 5432 | PostgreSQL 数据库 |
| searxng | 8080 | 搜索服务 |

## 命令行工具

项目提供了统一的命令行工具 `firecrawl`，可从任意目录管理服务。

### 安装

```bash
# 创建软链接到 ~/tools/bin
ln -sf /Users/sam/coding/wopal/wopal-workspace/labs/fork/sampx/firecrawl/firecrawl ~/tools/bin/firecrawl

# 验证
firecrawl help
```

### 命令列表

| 命令 | 说明 |
|------|------|
| `firecrawl start` | 启动所有服务 |
| `firecrawl stop` | 停止所有服务 |
| `firecrawl restart` | 重启所有服务 |
| `firecrawl status` | 查看服务状态（含健康检查和资源使用） |
| `firecrawl logs` | 查看日志 |
| `firecrawl logs api 100` | 查看 API 日志（指定行数） |
| `firecrawl test search` | 测试搜索功能 |
| `firecrawl test scrape` | 测试抓取功能 |
| `firecrawl shell api` | 进入 API 容器 |
| `firecrawl ps` | 查看容器列表 |
| `firecrawl update` | 更新服务镜像 |
| `firecrawl backup` | 备份配置文件 |

### 示例

```bash
# 启动服务
firecrawl start

# 查看状态
firecrawl status

# 查看日志
firecrawl logs api 100

# 测试功能
firecrawl test search

# 进入容器调试
firecrawl shell api
```

### Docker Compose（备用）

如果不想用命令行工具，也可以直接使用 docker-compose：

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 查看日志
docker compose logs -f api

# 进入容器
docker compose exec api sh
```

## API 测试

### Scrape

```bash
curl -X POST http://localhost:3002/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Crawl

```bash
curl -X POST http://localhost:3002/v1/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Search

```bash
curl -X POST http://localhost:3002/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "firecrawl web scraping", "limit": 3}'
```

## 中国用户构建优化

由于网络原因，国内用户构建 Docker 镜像时可使用镜像源：

```bash
# 阿里云镜像
docker compose build --build-arg APT_MIRROR=mirrors.aliyun.com

# 清华镜像
docker compose build --build-arg APT_MIRROR=mirrors.tuna.tsinghua.edu.cn
```

## 故障排查

### 服务无法启动

1. 检查 Docker 是否运行：`docker info`
2. 检查 .env 文件是否存在
3. 查看日志：`docker compose logs`

### 端口被占用

```bash
lsof -i :3002
# 停止占用进程或修改 .env 中的 PORT
```

### 连接 Redis 失败

确认 `REDIS_URL=redis://redis:6379` 与 docker-compose.yaml 中配置一致。

### 搜索功能不工作

确认 SearXNG 服务正常运行：
```bash
docker compose ps searxng
curl http://localhost:8080
```

## 安全建议

1. **修改默认密钥**：生产环境务必修改 `BULL_AUTH_KEY`
2. **数据库安全**：使用强密码，避免将数据库端口暴露到公网
3. **API 认证**：如需认证，配置 Supabase 并设置 `USE_DB_AUTHENTICATION=true`
