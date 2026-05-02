#!/bin/bash
# Cloudflare Workers 代理测试脚本

WORKER_URL="https://app.wenlong.life"
TEST_IMAGE="http://td42nzl7d.hn-bkt.clouddn.com/album/1_1777356682953_z0wMjVdt.556aaff6-d17d-41c4-bc64-993689a75968"

echo "========================================"
echo "测试 Cloudflare Workers 代理"
echo "========================================"
echo ""

echo "1. 测试 Workers 域名连通性..."
curl -I "$WORKER_URL" 2>&1 | head -5
echo ""

echo "2. 测试图片代理..."
PROXY_URL="${WORKER_URL}?url=${TEST_IMAGE}"
echo "代理 URL: $PROXY_URL"
echo ""

curl -I "$PROXY_URL" 2>&1 | grep -E "HTTP|Content-Type|X-Cache"
echo ""

echo "========================================"
echo "如果看到 HTTP/2 200 和 Content-Type: image/png，说明代理成功！"
echo "========================================"
