#!/bin/bash

# ============================================
# Let's Encrypt SSL 证书初始化脚本
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

DOMAIN="${DOMAIN:-app.wenlong.life}"
EMAIL="3818672317@qq.com"
STAGING=0  # 设置为 1 使用 staging 环境测试
COMPOSE_FILE_BG="${DEPLOY_COMPOSE_FILE}"

echo "### 初始化 Let's Encrypt SSL 证书 ###"
echo ""

# 检查是否已存在证书
if docker compose -f "${COMPOSE_FILE_BG}" run --rm --entrypoint "ls /etc/letsencrypt/live/$DOMAIN" certbot 2>/dev/null; then
  read -p "证书已存在，是否要替换？(y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

echo "### 步骤 1/5: 创建临时自签名证书 ###"
echo "为了让 nginx 能够启动，先创建临时证书..."
docker compose -f "${COMPOSE_FILE_BG}" run --rm --entrypoint "sh -c 'mkdir -p /etc/letsencrypt/live/$DOMAIN && openssl req -x509 -nodes -newkey rsa:4096 -days 1 -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem -subj /CN=localhost'" certbot
echo "✅ 临时证书创建完成"
echo ""

echo "### 步骤 2/5: 启动 nginx ###"
docker compose -f "${COMPOSE_FILE_BG}" up --force-recreate -d nginx-proxy certbot
echo "✅ Nginx 已启动"
echo ""

echo "### 步骤 3/5: 等待 nginx 就绪 ###"
sleep 5
echo "✅ Nginx 就绪"
echo ""

echo "### 步骤 4/5: 删除临时证书 ###"
docker compose -f "${COMPOSE_FILE_BG}" run --rm --entrypoint "sh -c 'rm -Rf /etc/letsencrypt/live/$DOMAIN && rm -Rf /etc/letsencrypt/archive/$DOMAIN && rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf'" certbot
echo "✅ 临时证书已删除"
echo ""

echo "### 步骤 5/5: 申请 Let's Encrypt 证书 ###"
case "$STAGING" in
  1) staging_arg="--staging" ;;
  *) staging_arg="" ;;
esac

docker compose -f "${COMPOSE_FILE_BG}" run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot $staging_arg --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN" certbot

if [ $? -eq 0 ]; then
    echo "✅ 证书申请成功"
    echo ""

    echo "### 步骤 6/6: 重新加载 nginx ###"
    docker compose -f "${COMPOSE_FILE_BG}" exec nginx-proxy nginx -s reload || docker exec "${NGINX_PROXY_CONTAINER}" nginx -s reload
    echo "✅ Nginx 已重新加载"
    echo ""

    echo "### 🎉 完成！###"
    echo ""
    echo "HTTPS 已成功配置！"
    echo ""
    echo "访问地址："
    echo "  - HTTP: http://app.wenlong.life （自动重定向到 HTTPS）"
    echo "  - HTTPS: https://app.wenlong.life"
    echo ""
    echo "证书信息："
    docker compose -f "${COMPOSE_FILE_BG}" run --rm --entrypoint "certbot certificates" certbot
    echo ""
    echo "证书将在到期前自动续期（每 12 小时检查一次）"
else
    echo "❌ 证书申请失败"
    echo ""
    echo "请检查："
    echo "  1. 域名 $DOMAIN 是否正确解析到本服务器"
    echo "  2. 防火墙是否开放 80 端口"
    echo "  3. 查看详细日志: docker compose -f ${COMPOSE_FILE_BG} logs certbot"
    exit 1
fi
