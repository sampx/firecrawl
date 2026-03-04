#!/bin/bash

# Firecrawl + SearXNG 日志查看脚本
# 用途：查看服务日志

# 参数说明
SERVICE=${1:-}
LINES=${2:-50}

echo "================================"
echo "Firecrawl + SearXNG 日志查看"
echo "================================"
echo ""

# 显示帮助信息
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "用法: ./scripts/logs.sh [服务名] [行数]"
    echo ""
    echo "服务名选项："
    echo "  api              - Firecrawl API 服务"
    echo "  searxng          - SearXNG 搜索服务"
    echo "  redis            - Firecrawl Redis"
    echo "  searxng-redis    - SearXNG Redis"
    echo "  rabbitmq         - RabbitMQ 消息队列"
    echo "  playwright-service - Playwright 服务"
    echo "  nuq-postgres     - PostgreSQL 数据库"
    echo "  (不指定)         - 所有服务"
    echo ""
    echo "行数："
    echo "  默认: 50"
    echo ""
    echo "示例："
    echo "  ./scripts/logs.sh              # 查看所有服务最近 50 行日志"
    echo "  ./scripts/logs.sh api          # 查看 API 服务最近 50 行日志"
    echo "  ./scripts/logs.sh api 100      # 查看 API 服务最近 100 行日志"
    echo "  ./scripts/logs.sh searxng 200  # 查看 SearXNG 服务最近 200 行日志"
    echo ""
    exit 0
fi

# 验证行数参数
if ! [[ "$LINES" =~ ^[0-9]+$ ]]; then
    echo "错误：行数必须是数字"
    exit 1
fi

# 查看日志
if [ -z "$SERVICE" ]; then
    echo "查看所有服务日志（最近 $LINES 行）..."
    echo ""
    docker-compose logs --tail $LINES
else
    echo "查看 $SERVICE 服务日志（最近 $LINES 行）..."
    echo ""
    docker-compose logs --tail $LINES $SERVICE
fi

echo ""
echo "================================"
echo "实时日志查看"
echo "================================"
echo "使用以下命令实时查看日志："
echo "  docker-compose logs -f $SERVICE"
echo ""
