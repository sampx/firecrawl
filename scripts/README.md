# Firecrawl 管理脚本

这个目录包含了便利的启停和管理脚本，用于管理 Firecrawl + SearXNG 服务。

## 脚本列表

### start.sh - 启动服务

启动所有 Firecrawl 和 SearXNG 服务。

```bash
./scripts/start.sh
```

功能：
- 检查 Docker 是否运行
- 验证 .env 配置文件
- 检查必要的环境变量
- 启动所有服务
- 等待服务就绪
- 显示服务状态

### stop.sh - 停止服务

停止所有运行中的服务。

```bash
./scripts/stop.sh
```

功能：
- 显示当前运行的服务
- 确认后停止服务
- 安全关闭

### restart.sh - 重启服务

重启所有服务。

```bash
./scripts/restart.sh
```

功能：
- 停止所有服务
- 等待 5 秒
- 重新启动所有服务
- 显示服务状态

### status.sh - 查看状态

查看所有服务的运行状态、健康检查和资源使用情况。

```bash
./scripts/status.sh
```

功能：
- 显示所有服务列表
- 健康状态检查（标记为 healthy/unhealthy）
- 网络连接验证
- 资源使用统计（CPU、内存）
- 显示常用命令

### logs.sh - 查看日志

查看服务日志。

```bash
# 查看所有服务日志（最近 50 行）
./scripts/logs.sh

# 查看特定服务日志
./scripts/logs.sh api
./scripts/logs.sh searxng
./scripts/logs.sh redis

# 指定日志行数
./scripts/logs.sh api 100
./scripts/logs.sh searxng 200

# 查看帮助
./scripts/logs.sh --help
```

可用服务名：
- `api` - Firecrawl API 服务
- `searxng` - SearXNG 搜索服务
- `redis` - Firecrawl Redis
- `searxng-redis` - SearXNG Redis
- `rabbitmq` - RabbitMQ 消息队列
- `playwright-service` - Playwright 服务
- `nuq-postgres` - PostgreSQL 数据库

## 使用示例

### 日常使用流程

```bash
# 1. 启动服务
./scripts/start.sh

# 2. 检查状态
./scripts/status.sh

# 3. 查看日志（如果有问题）
./scripts/logs.sh api 100

# 4. 停止服务
./scripts/stop.sh
```

### 故障排查

```bash
# 检查服务状态
./scripts/status.sh

# 查看 API 日志
./scripts/logs.sh api 200

# 重启服务
./scripts/restart.sh
```

### 实时日志查看

虽然 scripts/logs.sh 可以查看历史日志，但如果需要实时查看日志，可以使用：

```bash
# 实时查看所有服务日志
docker-compose logs -f

# 实时查看特定服务日志
docker-compose logs -f api
docker-compose logs -f searxng
```

## 注意事项

1. **确保 Docker 正在运行** - 所有脚本都会检查 Docker 状态
2. **配置 .env 文件** - 启动前确保 .env 文件配置正确
3. **等待时间** - 启动和重启脚本会等待 30 秒让服务完全启动
4. **权限** - 所有脚本都有可执行权限（755）

## 相关文档

- [SEARXNG_INTEGRATION.md](../SEARXNG_INTEGRATION.md) - 完整的整合说明文档
- [plans/searxng-integration-plan.md](../plans/searxng-integration-plan.md) - 整合方案文档
