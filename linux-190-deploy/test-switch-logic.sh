#!/bin/bash

# 测试 upstream 切换逻辑

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

echo "=== 测试 upstream 切换逻辑 ==="
echo ""

# 创建测试配置文件
TEST_CONF="/tmp/test-upstream.conf"
cat > "${TEST_CONF}" << 'EOF'
# 上游服务器配置 - 蓝绿部署
# 活跃环境：blue
# 此文件用于蓝绿切换，由部署脚本自动修改
upstream frontend_backend {
    server together-frontend-blue:8080 max_fails=3 fail_timeout=30s;
    # server together-frontend-green:8080 max_fails=3 fail_timeout=30s;
}
EOF

echo "初始配置 (blue 活跃):"
cat "${TEST_CONF}"
echo ""

# 测试切换到 green
echo "=== 测试切换到 green ==="
sed -i 's/^\s*server together-frontend-blue:8080/    # server together-frontend-blue:8080/' "${TEST_CONF}"
sed -i 's/^\s*# server together-frontend-green:8080/    server together-frontend-green:8080/' "${TEST_CONF}"
sed -i 's/^# 活跃环境：blue/# 活跃环境：green/' "${TEST_CONF}"

echo "切换后配置:"
cat "${TEST_CONF}"
echo ""

# 测试切换回 blue
echo "=== 测试切换回 blue ==="
sed -i 's/^\s*server together-frontend-green:8080/    # server together-frontend-green:8080/' "${TEST_CONF}"
sed -i 's/^\s*# server together-frontend-blue:8080/    server together-frontend-blue:8080/' "${TEST_CONF}"
sed -i 's/^# 活跃环境：green/# 活跃环境：blue/' "${TEST_CONF}"

echo "切换后配置:"
cat "${TEST_CONF}"
echo ""

# 清理
rm -f "${TEST_CONF}"

echo "✅ 切换逻辑测试完成"
