#!/bin/bash

# ============================================
# 宿主机 Nginx HTTPS 配置脚本
# 需要 sudo 权限执行
# ============================================

set -e

echo "### 配置宿主机 Nginx 用于 HTTPS ###"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. 创建 certbot 目录
echo "1. 创建 certbot 目录..."
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
echo "✅ 完成"
echo ""

# 2. 复制 nginx 配置
echo "2. 安装 nginx 配置..."
sudo cp "${SCRIPT_DIR}/app.wenlong.life.nginx.conf" /etc/nginx/sites-available/app.wenlong.life
sudo ln -sf /etc/nginx/sites-available/app.wenlong.life /etc/nginx/sites-enabled/app.wenlong.life
echo "✅ 完成"
echo ""

# 3. 测试 nginx 配置
echo "3. 测试 nginx 配置..."
sudo nginx -t
echo "✅ 完成"
echo ""

# 4. 重新加载 nginx
echo "4. 重新加载 nginx..."
sudo systemctl reload nginx
echo "✅ 完成"
echo ""

# 5. 申请 SSL 证书
echo "5. 申请 Let's Encrypt 证书..."
sudo certbot certonly --webroot -w /var/www/certbot \
    --email 3818672317@qq.com \
    --agree-tos \
    --no-eff-email \
    -d app.wenlong.life

if [ $? -eq 0 ]; then
    echo "✅ 证书申请成功"
    echo ""

    # 6. 启用 HTTPS 配置
    echo "6. 启用 HTTPS 配置..."
    sudo sed -i 's/^# server {/server {/g' /etc/nginx/sites-available/app.wenlong.life
    sudo sed -i 's/^#     /    /g' /etc/nginx/sites-available/app.wenlong.life
    sudo sed -i 's/^# }/}/g' /etc/nginx/sites-available/app.wenlong.life

    # 7. 测试并重新加载
    echo "7. 重新加载 nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ 完成"
    echo ""

    echo "### HTTPS 配置成功！###"
    echo ""
    echo "访问地址："
    echo "  - HTTP: http://app.wenlong.life （自动重定向到 HTTPS）"
    echo "  - HTTPS: https://app.wenlong.life"
    echo ""
    echo "证书自动续期："
    echo "  certbot 会自动续期证书，无需手动操作"
else
    echo "❌ 证书申请失败"
    echo ""
    echo "请检查："
    echo "  1. 域名是否正确解析到本服务器"
    echo "  2. 防火墙是否开放 80 端口"
    echo "  3. nginx 是否正常运行"
    exit 1
fi
