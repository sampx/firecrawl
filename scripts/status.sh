#!/bin/bash

# Firecrawl + SearXNG 状态查看脚本
# 用途：查看所有服务的运行状态

echo "================================"
echo "Firecrawl + SearXNG 服务状态"
echo "================================"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行"
    exit 1
fi

# 检查是否有运行的服务
if [ $(docker-compose ps -q 2>/dev/null | wc -l) -eq 0 ]; then
    echo "⚠️  没有运行的服务"
    echo ""
    echo "启动服务: ./scripts/start.sh"
    exit 0
fi

echo "服务列表："
echo ""
docker-compose ps

echo ""
echo "================================"
echo "健康状态检查"
echo "================================"

# 检查各服务健康状态
services=("api" "redis" "rabbitmq" "searxng" "searxng-redis" "playwright-service" "nuq-postgres")

for service in "${services[@]}"; do
    status=$(docker-compose ps -q $service 2>/dev/null | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null || echo "stopped")
    
    if [ "$status" == "running" ]; then
        # 检查健康状态（如果有健康检查）
        health=$(docker-compose ps -q $service 2>/dev/null | xargs docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null || echo "none")
        
        if [ "$health" == "healthy" ]; then
            echo "✅ $service: 运行中 (健康)"
        elif [ "$health" == "unhealthy" ]; then
            echo "❌ $service: 运行中 (不健康)"
        elif [ "$health" == "starting" ]; then
            echo "⏳ $service: 运行中 (启动中)"
        else
            echo "✅ $service: 运行中"
        fi
    else
        echo "❌ $service: 已停止"
    fi
done

echo ""
echo "网络连接检查："
network_containers=$(docker network inspect firecrawl_backend --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "")
if [ -n "$network_containers" ]; then
    echo "✅ 所有容器在同一网络: firecrawl_backend"
    echo "   容器: $network_containers"
else
    echo "❌ 网络 firecrawl_backend 不存在或无容器"
fi

echo ""
echo "资源使用情况："
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -8

echo ""
echo "================================"
echo "常用命令"
echo "================================"
echo "查看日志:     ./scripts/logs.sh [服务名] [行数]"
echo "查看特定日志: ./scripts/logs.sh api 100"
echo "重启服务:     ./scripts/restart.sh"
echo "停止服务:     ./scripts/stop.sh"
echo ""
