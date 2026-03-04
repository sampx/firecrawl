# SearXNG 整合使用说明

## 概述

SearXNG 已作为子服务完全整合到 Firecrawl 的 docker-compose 架构中，提供统一的搜索功能支持。

## 架构说明

```
Firecrawl 项目 (统一网络: firecrawl_backend)
├── api (依赖 searxng 健康检查)
├── redis (Firecrawl 专用)
├── rabbitmq
├── nuq-postgres
├── playwright-service
├── searxng (仅内部访问)
└── searxng-redis (SearXNG 专用)
```

## 快速开始

### 启动所有服务

```bash
./scripts/start.sh
```

或手动启动：

```bash
docker-compose up -d
```

### 停止所有服务

```bash
./scripts/stop.sh
```

或手动停止：

```bash
docker-compose down
```

### 重启所有服务

```bash
./scripts/restart.sh
```

或手动重启：

```bash
docker-compose restart
```

### 查看服务状态

```bash
./scripts/status.sh
```

或手动查看：

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看所有服务日志
./scripts/logs.sh

# 查看 SearXNG 日志
./scripts/logs.sh searxng

# 查看 API 日志
./scripts/logs.sh api

# 查看最近 100 行日志
./scripts/logs.sh api 100
```

## 服务列表

| 服务名称 | 容器名称 | 端口 | 说明 |
|---------|---------|------|------|
| api | firecrawl-api-1 | 3002 | Firecrawl API 服务 |
| redis | firecrawl-redis-1 | 6379 | Firecrawl Redis |
| rabbitmq | firecrawl-rabbitmq-1 | 5672, 15672 | 消息队列 |
| nuq-postgres | firecrawl-nuq-postgres-1 | 5432 | PostgreSQL 数据库 |
| playwright-service | firecrawl-playwright-service-1 | 3000 | Playwright 服务 |
| searxng | firecrawl-searxng-1 | 8080 (内部) | SearXNG 搜索服务 |
| searxng-redis | firecrawl-searxng-redis-1 | 6379 | SearXNG Redis |

## 使用示例

### 测试搜索功能

```bash
curl -X POST http://localhost:3002/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "firecrawl web scraping",
    "limit": 5
  }'
```

### 测试抓取功能

```bash
curl -X POST http://localhost:3002/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

## 配置文件

### 主要配置文件

- `.env` - 环境变量配置（包含 SEARXNG_ENDPOINT）
- `docker-compose.override.yml` - SearXNG 整合配置
- `searxng/settings.yml` - SearXNG 配置文件

### 环境变量

```bash
# SearXNG 端点（容器内部地址）
SEARXNG_ENDPOINT=http://searxng:8080

# 可选：指定搜索引擎
# SEARXNG_ENGINES=google,bing,duckduckgo

# 可选：指定搜索类别
# SEARXNG_CATEGORIES=general,images
```

## 故障排查

### 检查服务健康状态

```bash
docker-compose ps
```

确保所有服务状态为 `Up`，searxng 和 rabbitmq 状态为 `healthy`。

### 查看服务日志

```bash
# 查看 SearXNG 日志
docker-compose logs searxng --tail 50

# 查看 API 日志
docker-compose logs api --tail 50 | grep -i searx
```

### 检查网络连接

```bash
# 检查所有容器是否在同一网络
docker network inspect firecrawl_backend --format '{{range .Containers}}{{.Name}} {{end}}'
```

### 常见问题

1. **SearXNG 健康检查失败**
   - 检查 searxng 容器日志
   - 确保 searxng/settings.yml 配置正确
   - 等待 30 秒让服务完全启动

2. **API 无法连接到 SearXNG**
   - 确认 SEARXNG_ENDPOINT 设置为 `http://searxng:8080`
   - 检查两个容器是否在同一网络
   - 重启 API 服务：`docker-compose restart api`

3. **搜索功能不工作**
   - 检查 SearXNG 日志是否有错误
   - 验证 SearXNG 配置是否允许 JSON 格式输出
   - 检查网络连接是否正常

## 升级和维护

### 更新 Firecrawl

```bash
# 1. 停止服务
docker-compose down

# 2. 拉取最新代码
git stash
git pull origin main
git stash pop

# 3. 重启服务
docker-compose up -d
```

### 更新 SearXNG 镜像

```bash
# 1. 拉取最新镜像
docker-compose pull searxng

# 2. 重启 SearXNG
docker-compose up -d searxng
```

### 备份配置

```bash
# 备份重要配置文件
tar -czf firecrawl-config-backup-$(date +%Y%m%d).tar.gz \
  .env \
  searxng/settings.yml \
  docker-compose.override.yml
```

## 资源使用

### 预估资源占用

| 服务 | CPU | 内存 |
|------|-----|------|
| api | 2-4核 | 2-4GB |
| playwright-service | 1-2核 | 2-3GB |
| redis | <0.5核 | ~50MB |
| searxng-redis | <0.5核 | ~30MB |
| searxng | <1核 | ~200MB |
| rabbitmq | <1核 | ~200MB |
| nuq-postgres | <1核 | ~100MB |
| **总计** | **6+核** | **5-8GB** |

### 推荐配置

- **最低配置**: 8GB RAM, 4核 CPU
- **推荐配置**: 16GB RAM, 8核 CPU

## 安全注意事项

1. **SearXNG 不暴露端口** - 仅容器内部访问，外部无法直接访问
2. **修改默认密钥** - 确保 BULL_AUTH_KEY 已修改
3. **定期更新** - 保持镜像和代码为最新版本
4. **监控日志** - 定期检查异常访问日志

## 相关文档

- [Firecrawl 官方文档](https://github.com/mendableai/firecrawl)
- [SearXNG 官方文档](https://github.com/searxng/searxng)
- [Docker Compose 文档](https://docs.docker.com/compose/)

## 支持

如有问题，请查看：
1. 本文档的故障排查部分
2. Docker 容器日志
3. Firecrawl GitHub Issues
