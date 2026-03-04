#!/bin/bash

# Firecrawl + SearXNG 重启脚本
# 用途：重启所有服务

set -e

echo "================================"
echo "重启 Firecrawl + SearXNG 服务"
echo "================================"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "错误：Docker 未运行，请先启动 Docker"
    exit 1
fi

echo "正在停止服务..."
docker-compose down

echo ""
echo "等待 5 秒..."
sleep 5

echo ""
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
echo "✅ 服务重启完成"
echo "================================"
echo ""
