#!/bin/bash

# Firecrawl 构建脚本
# 用途：重新构建并重启指定服务（默认 api）

set -e

SERVICE=${1:-api}

# 显示帮助
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "用法: ./scripts/build.sh [服务名]"
    echo ""
    echo "服务名选项："
    echo "  api   - 重新构建并重启 API 服务（默认）"
    echo "  all   - 重新构建并重启所有可构建的服务"
    echo ""
    echo "示例："
    echo "  ./scripts/build.sh          # 重建 api"
    echo "  ./scripts/build.sh api      # 重建 api"
    echo "  ./scripts/build.sh all      # 重建所有服务"
    exit 0
fi

echo "================================"
echo "Firecrawl 构建服务: $SERVICE"
echo "================================"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "错误：Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "错误：.env 文件不存在"
    exit 1
fi

# 构建
echo "正在构建..."
if [ "$SERVICE" == "all" ]; then
    DOCKER_BUILDKIT=1 docker compose build
else
    DOCKER_BUILDKIT=1 docker compose build "$SERVICE"
fi

echo ""
echo "构建完成，正在重新部署..."

# 重启对应服务
if [ "$SERVICE" == "all" ]; then
    docker compose up -d --force-recreate --remove-orphans
else
    docker compose up -d --force-recreate --remove-orphans "$SERVICE"
fi

echo ""
echo "检查服务状态..."
docker compose ps

echo ""
echo "================================"
echo "✅ 构建并重启完成"
echo "================================"
echo ""
echo "查看日志: ./scripts/logs.sh $SERVICE"
