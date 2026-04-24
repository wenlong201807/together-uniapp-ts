#!/bin/bash

# ============================================
# Nginx 配置测试脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "### 测试 Nginx 配置 ###"
echo ""

# 测试配置文件语法
echo "1. 检查 nginx.conf 语法..."
if docker run --rm -v "${SCRIPT_DIR}/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx 配置语法正确"
else
    echo "❌ Nginx 配置语法错误"
    docker run --rm -v "${SCRIPT_DIR}/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine nginx -t
    exit 1
fi
echo ""

# 检查必要的目录
echo "2. 检查证书目录..."
if [ -d "${SCRIPT_DIR}/certbot" ]; then
    echo "✅ certbot 目录已存在"
else
    echo "⚠️  certbot 目录不存在（首次部署时会自动创建）"
fi
echo ""

# 检查 docker-compose 配置
echo "3. 检查 docker-compose.yml..."
if docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml 配置正确"
else
    echo "❌ docker-compose.yml 配置错误"
    docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" config
    exit 1
fi
echo ""

# 检查端口占用
echo "4. 检查端口占用..."
for port in 8107 8108; do
    if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
        echo "⚠️  端口 ${port} 已被占用"
    else
        echo "✅ 端口 ${port} 可用"
    fi
done
echo ""

echo "### 测试完成 ###"
echo ""
echo "下一步："
echo "  1. 如果是首次部署 HTTPS，运行: ./init-letsencrypt.sh"
echo "  2. 或者直接部署: ./deploy-staging.sh"
