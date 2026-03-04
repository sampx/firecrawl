#!/bin/bash

# Firecrawl + SearXNG 启动脚本
# 用途：启动所有服务

set -e

echo "================================"
echo "启动 Firecrawl + SearXNG 服务"
echo "================================"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "错误：Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误：docker-compose 未安装"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo "警告：.env 文件不存在"
    echo "请复制 .env.example 并配置必要的环境变量"
    exit 1
fi

# 检查必要的环境变量
if ! grep -q "SEARXNG_ENDPOINT=http://searxng:8080" .env; then
    echo "警告：SEARXNG_ENDPOINT 未正确配置"
    echo "请在 .env 文件中设置：SEARXNG_ENDPOINT=http://searxng:8080"
    exit 1
fi

echo "正在启动服务..."
docker-compose up -d

echo ""
echo "等待服务启动（30秒）..."
sleep 30

echo ""
echo "检查服务状态..."
docker-compose ps

echo ""
echo "================================"
echo "✅ 服务启动完成"
echo "================================"
echo ""
echo "访问地址："
echo "  - Firecrawl API: http://localhost:3002"
echo "  - RabbitMQ 管理界面: http://localhost:15672 (guest/guest)"
echo ""
echo "常用命令："
echo "  - 查看状态: ./scripts/status.sh"
echo "  - 查看日志: ./scripts/logs.sh"
echo "  - 停止服务: ./scripts/stop.sh"
echo "  - 重启服务: ./scripts/restart.sh"
echo ""
