#!/bin/bash

# ============================================
# 配置验证脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NGINX_CONF_DIR="${DEPLOY_ROOT}/config/nginx"

echo "### 验证部署配置 ###"
echo ""

# 测试 1: Nginx 配置语法（standalone）
echo "1. 检查 nginx.conf 语法（standalone 模式）..."
if docker run --rm -v "${NGINX_CONF_DIR}/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ nginx.conf 语法正确"
else
    echo "❌ nginx.conf 语法错误"
    docker run --rm -v "${NGINX_CONF_DIR}/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine nginx -t
    exit 1
fi
echo ""

# 测试 2: Nginx 配置语法（blue-green internal）
echo "2. 检查 nginx-internal.conf 语法（蓝绿模式）..."
if docker run --rm -v "${NGINX_CONF_DIR}/nginx-internal.conf:/etc/nginx/conf.d/default.conf:ro" -v "${NGINX_CONF_DIR}/nginx-proxy.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ nginx-internal.conf 语法正确"
else
    echo "❌ nginx-internal.conf 语法错误"
    docker run --rm -v "${NGINX_CONF_DIR}/nginx-internal.conf:/etc/nginx/conf.d/default.conf:ro" -v "${NGINX_CONF_DIR}/nginx-proxy.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t
fi
echo ""

# 测试 3: Docker Compose 配置
echo "3. 检查 docker-compose.blue-green.yml..."
if docker compose -f "${DEPLOY_ROOT}/docker-compose.blue-green.yml" config > /dev/null 2>&1; then
    echo "✅ docker-compose.blue-green.yml 配置正确"
else
    echo "❌ docker-compose.blue-green.yml 配置错误"
    docker compose -f "${DEPLOY_ROOT}/docker-compose.blue-green.yml" config
    exit 1
fi
echo ""

# 测试 4: 版本文件
echo "4. 检查版本文件..."
if [ -f "${DEPLOY_ROOT}/config/VERSION" ]; then
    current_version=$(cat "${DEPLOY_ROOT}/config/VERSION")
    echo "✅ 当前版本: ${current_version}"
else
    echo "⚠️  VERSION 文件不存在（首次部署时会自动创建）"
fi
echo ""

# 测试 5: 证书目录
echo "5. 检查证书目录..."
if [ -d "${DEPLOY_ROOT}/certbot/conf" ]; then
    echo "✅ certbot 证书目录已存在"
else
    echo "⚠️  certbot 证书目录不存在（首次部署时会自动创建）"
fi
echo ""

# 测试 6: 端口占用
echo "6. 检查端口占用..."
for port in 80 443; do
    if ss -tuln 2>/dev/null | grep -q ":${port} " || netstat -tuln 2>/dev/null | grep -q ":${port} "; then
        echo "⚠️  端口 ${port} 已被占用"
    else
        echo "✅ 端口 ${port} 可用"
    fi
done
echo ""

echo "### 验证完成 ###"
echo ""
echo "下一步："
echo "  1. 如果是首次部署 HTTPS，运行: ./init-letsencrypt.sh"
echo "  2. 零停机部署: ./deploy-blue-green.sh"
