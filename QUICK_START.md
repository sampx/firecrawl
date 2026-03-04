# Firecrawl + SearXNG 快速开始

## 🚀 快速命令

### 启动服务
```bash
./scripts/start.sh
```

### 查看状态
```bash
./scripts/status.sh
```

### 查看日志
```bash
# 所有服务
./scripts/logs.sh

# 特定服务
./scripts/logs.sh api
./scripts/logs.sh searxng 100
```

### 停止服务
```bash
./scripts/stop.sh
```

### 重启服务
```bash
./scripts/restart.sh
```

## 📍 访问地址

- **Firecrawl API**: http://localhost:3002
- **RabbitMQ 管理界面**: http://localhost:15672 (guest/guest)

## 🧪 测试命令

### 测试搜索功能
```bash
curl -X POST http://localhost:3002/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "firecrawl web scraping", "limit": 3}'
```

### 测试抓取功能
```bash
curl -X POST http://localhost:3002/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 📚 更多信息

- [完整文档](./SEARXNG_INTEGRATION.md)
- [脚本说明](./scripts/README.md)
- [整合方案](./plans/searxng-integration-plan.md)

## 🆘 常见问题

### 服务无法启动
1. 检查 Docker 是否运行
2. 检查 .env 文件是否存在
3. 查看日志：`./scripts/logs.sh`

### 搜索功能不工作
1. 检查 SearXNG 状态：`./scripts/status.sh`
2. 查看 SearXNG 日志：`./scripts/logs.sh searxng`
3. 重启服务：`./scripts/restart.sh`

### 端口被占用
1. 检查端口使用：`lsof -i :3002`
2. 停止冲突服务
3. 重启 Firecrawl：`./scripts/restart.sh`
