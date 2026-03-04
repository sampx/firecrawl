# Firecrawl 命令行工具

## 概述

`firecrawl` 是一个统一的命令行工具，让你可以在任何地方轻松管理 Firecrawl + SearXNG 服务。

## 安装

### 已安装状态

✅ `firecrawl` 命令已经安装到 `~/tools/bin/firecrawl`，可以在任何目录使用。

### 重新安装（如需要）

如果软连接被删除或需要重新安装：

```bash
# 进入 Firecrawl 项目目录
cd /Users/sam/coding/good/firecrawl

# 创建软连接到 ~/tools/bin
ln -sf $(pwd)/firecrawl ~/tools/bin/firecrawl

# 验证安装
which firecrawl
firecrawl help
```

### 首次安装（新用户）

如果你是第一次安装，需要确保 ~/tools/bin 在 PATH 中：

```bash
# 确保 ~/tools/bin 目录存在
mkdir -p ~/tools/bin

# 添加到 PATH（如果还没有）
echo 'export PATH="$HOME/tools/bin:$PATH"' >> ~/.zshrc  # 或 ~/.bashrc
source ~/.zshrc  # 或 source ~/.bashrc

# 创建软连接
cd /Users/sam/coding/good/firecrawl
ln -sf $(pwd)/firecrawl ~/tools/bin/firecrawl

# 验证安装
which firecrawl
firecrawl help
```

## 使用方法

### 基本命令

```bash
# 查看帮助
firecrawl help

# 启动所有服务
firecrawl start

# 查看服务状态（含健康检查和资源使用）
firecrawl status

# 查看日志
firecrawl logs [service] [lines]

# 停止所有服务
firecrawl stop

# 重启所有服务
firecrawl restart
```

### 详细命令说明

#### 1. 启动服务

```bash
firecrawl start
```

功能：
- 检查 Docker 是否运行
- 验证配置文件
- 启动所有服务
- 等待服务就绪
- 显示服务状态

#### 2. 停止服务

```bash
firecrawl stop
```

功能：
- 显示当前运行的服务
- 确认后停止服务
- 安全关闭

#### 3. 重启服务

```bash
firecrawl restart
```

功能：
- 停止所有服务
- 等待 5 秒
- 重新启动所有服务
- 显示服务状态

#### 4. 查看状态

```bash
firecrawl status
```

显示信息：
- 所有服务列表
- 健康状态检查（healthy/unhealthy）
- 网络连接验证
- 资源使用统计（CPU、内存）

#### 5. 查看日志

```bash
# 查看所有服务日志（最近 50 行）
firecrawl logs

# 查看特定服务日志
firecrawl logs api
firecrawl logs searxng

# 指定日志行数
firecrawl logs api 100
firecrawl logs searxng 200
```

可用服务：
- `api` - Firecrawl API 服务
- `searxng` - SearXNG 搜索服务
- `redis` - Firecrawl Redis
- `searxng-redis` - SearXNG Redis
- `rabbitmq` - RabbitMQ 消息队列
- `playwright-service` - Playwright 服务
- `nuq-postgres` - PostgreSQL 数据库

#### 6. 测试功能

```bash
# 测试搜索功能
firecrawl test search

# 测试抓取功能
firecrawl test scrape
```

#### 7. 进入容器

```bash
# 进入 API 容器
firecrawl shell api

# 进入 SearXNG 容器
firecrawl shell searxng
```

#### 8. 更新服务

```bash
# 拉取最新镜像并重启服务
firecrawl update
```

#### 9. 备份配置

```bash
# 备份 .env、searxng/settings.yml 和 docker-compose.override.yml
firecrawl backup
```

备份文件保存在：`/Users/sam/coding/good/firecrawl/backups/`

#### 10. 查看容器列表

```bash
firecrawl ps
```

## 使用示例

### 日常使用流程

```bash
# 1. 启动服务
firecrawl start

# 2. 检查状态
firecrawl status

# 3. 查看日志（如果有问题）
firecrawl logs api 100

# 4. 测试功能
firecrawl test search

# 5. 停止服务
firecrawl stop
```

### 故障排查

```bash
# 检查服务状态
firecrawl status

# 查看 API 日志
firecrawl logs api 200

# 查看 SearXNG 日志
firecrawl logs searxng 100

# 重启服务
firecrawl restart

# 进入容器调试
firecrawl shell api
```

### 维护操作

```bash
# 更新镜像
firecrawl update

# 备份配置
firecrawl backup

# 查看资源使用
firecrawl status
```

## 访问地址

- **Firecrawl API**: http://localhost:3002
- **RabbitMQ 管理界面**: http://localhost:15672 (guest/guest)

## 配置文件

- **项目目录**: `/Users/sam/coding/good/firecrawl`
- **环境变量**: `/Users/sam/coding/good/firecrawl/.env`
- **SearXNG 配置**: `/Users/sam/coding/good/firecrawl/searxng/settings.yml`
- **Docker Compose 覆盖**: `/Users/sam/coding/good/firecrawl/docker-compose.override.yml`

## 相关文档

- [快速开始](./QUICK_START.md)
- [完整整合文档](./SEARXNG_INTEGRATION.md)
- [脚本说明](./scripts/README.md)

## 卸载

```bash
# 删除软连接
rm ~/tools/bin/firecrawl

# 如果需要，从 PATH 中移除 ~/tools/bin
# 编辑 ~/.zshrc 或 ~/.bashrc，删除或注释掉：
# export PATH="$HOME/tools/bin:$PATH"
```

## 故障排查

### 命令找不到

```bash
# 检查软连接是否存在
ls -l ~/tools/bin/firecrawl

# 检查 PATH 是否包含 ~/tools/bin
echo $PATH | grep tools/bin

# 如果没有，添加到 PATH
export PATH="$HOME/tools/bin:$PATH"
```

### 权限问题

```bash
# 确保脚本有执行权限
chmod +x /Users/sam/coding/good/firecrawl/firecrawl

# 重新创建软连接
ln -sf /Users/sam/coding/good/firecrawl/firecrawl ~/tools/bin/firecrawl
```

### Docker 未运行

```bash
# 启动 Docker Desktop
open -a Docker

# 或使用命令行
docker info
```

## 提示

1. **在任何目录都可以使用** - `firecrawl` 命令会自动切换到正确的目录
2. **彩色输出** - 使用颜色区分不同类型的信息
3. **自动检查** - 命令会自动检查 Docker 状态和配置文件
4. **交互式确认** - 停止服务前会要求确认
5. **实时日志** - 使用 `docker-compose logs -f <service>` 查看实时日志

## 更新命令

如果更新了 `firecrawl` 脚本，只需重新运行安装：

```bash
cd /Users/sam/coding/good/firecrawl
ln -sf $(pwd)/firecrawl ~/tools/bin/firecrawl
```

## 反馈

如有问题或建议，请查看：
- [故障排查文档](./SEARXNG_INTEGRATION.md#故障排查)
- [项目 Issues](https://github.com/mendableai/firecrawl/issues)
