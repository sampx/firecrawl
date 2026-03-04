#!/bin/bash

# Firecrawl + SearXNG 停止脚本
# 用途：停止所有服务

set -e

echo "================================"
echo "停止 Firecrawl + SearXNG 服务"
echo "================================"
echo ""

# 检查是否有运行的服务
if [ $(docker-compose ps -q | wc -l) -eq 0 ]; then
    echo "没有运行的服务"
    exit 0
fi

echo "当前运行的服务："
docker-compose ps

echo ""
read -p "确认停止所有服务？(y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消停止"
    exit 0
fi

echo ""
echo "正在停止服务..."
docker-compose down

echo ""
echo "================================"
echo "✅ 服务已停止"
echo "================================"
echo ""
echo "重新启动服务: ./scripts/start.sh"
echo ""
