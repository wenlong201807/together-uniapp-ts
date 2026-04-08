#!/bin/bash

echo "=========================================="
echo "测试 API 路径是否正确"
echo "=========================================="
echo ""

# 测试后端是否正常
echo "1. 测试后端 API (直接访问):"
BACKEND_RESULT=$(curl -s 'http://localhost:8118/api/v1/public/config' 2>&1)
echo "   后端响应: ${BACKEND_RESULT:0:100}..."
echo ""

# 检查前端构建的 API 路径
echo "2. 检查前端源码中的 API 路径:"
echo "   - auth.ts:"
grep "request\." src/api/modules/auth.ts | head -3
echo "   - user.ts:"
grep "request\." src/api/modules/user.ts | head -3
echo "   - points.ts:"
grep "request\." src/api/modules/points.ts | head -3
echo ""

echo "3. 检查 baseURL 配置:"
echo "   - config/index.ts:"
grep "baseURL" src/config/index.ts
echo "   - .env.dev:"
grep "VITE_APP_API_BASE_URL" .env.dev
echo ""

echo "=========================================="
echo "如果看到路径中有 /api/v1/api/v1，说明有重复"
echo "正确的应该是: baseURL + /auth/login = http://localhost:8118/api/v1/auth/login"
echo "=========================================="
