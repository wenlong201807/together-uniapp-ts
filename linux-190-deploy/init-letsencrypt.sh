#!/bin/bash

# ============================================
# Let's Encrypt SSL 证书初始化脚本
# ============================================

set -e

DOMAIN="app.wenlong.life"
EMAIL="3818672317@qq.com"
STAGING=0  # 设置为 1 使用 staging 环境测试

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_PATH="${SCRIPT_DIR}/certbot"

echo "### 初始化 Let's Encrypt SSL 证书 ###"
echo ""

# 检查是否已存在证书
if [ -d "$DATA_PATH/conf/live/$DOMAIN" ]; then
  read -p "证书已存在，是否要替换？(y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

# 创建必要的目录
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
  echo "### 下载推荐的 TLS 参数 ..."
  mkdir -p "$DATA_PATH/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$DATA_PATH/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$DATA_PATH/conf/ssl-dhparams.pem"
  echo ""
fi

# 创建临时自签名证书
echo "### 创建临时自签名证书 ..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
docker-compose run --rm --entrypoint "\
  sh -c 'mkdir -p /etc/letsencrypt/live/$DOMAIN && \
  openssl req -x509 -nodes -newkey rsa:4096 -days 1\
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj /CN=localhost'" certbot
echo ""

# 启动 nginx
echo "### 启动 nginx ..."
docker-compose up --force-recreate -d frontend
echo ""

# 删除临时证书
echo "### 删除临时证书 ..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot
echo ""

# 请求真实证书
echo "### 请求 Let's Encrypt 证书 ..."
case "$STAGING" in
  1) staging_arg="--staging" ;;
  *) staging_arg="" ;;
esac

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN" certbot
echo ""

# 重新加载 nginx
echo "### 重新加载 nginx ..."
docker-compose exec frontend nginx -s reload
echo ""

echo "### 完成！###"
echo ""
echo "证书已成功安装。"
echo "证书将在 12 小时后自动续期。"
