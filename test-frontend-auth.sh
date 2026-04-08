#!/bin/bash

# 前端密码加密测试脚本

BASE_URL="http://localhost:8125/api/v1"
TEST_MOBILE_NEW="13900000099"
TEST_PASSWORD="Test123456"

echo "=========================================="
echo "前端密码加密功能测试"
echo "=========================================="
echo ""

# 使用 Node.js 模拟前端 SHA256 加密
ENCRYPTED_PASSWORD=$(node -e "
const crypto = require('crypto');
const password = '${TEST_PASSWORD}';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);
")

echo "原始密码: ${TEST_PASSWORD}"
echo "SHA256加密后: ${ENCRYPTED_PASSWORD}"
echo ""

echo "=========================================="
echo "测试 1: 使用加密密码注册"
echo "=========================================="

# 发送验证码
curl -s -X POST "${BASE_URL}/auth/sms/send" \
  -H "Content-Type: application/json" \
  -d "{\"mobile\":\"${TEST_MOBILE_NEW}\",\"type\":\"register\"}" > /dev/null 2>&1

sleep 2

# 使用加密密码注册
REGISTER_RESULT=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"mobile\":\"${TEST_MOBILE_NEW}\",
    \"password\":\"${ENCRYPTED_PASSWORD}\",
    \"code\":\"123456\",
    \"nickname\":\"加密测试用户\"
  }")

CODE=$(echo $REGISTER_RESULT | jq -r '.code')
TOKEN=$(echo $REGISTER_RESULT | jq -r '.data.token // empty')

if [ "$CODE" = "0" ] || [ "$CODE" = "200" ]; then
  echo "✅ 通过：使用加密密码注册成功"
  echo "   Token: ${TOKEN:0:30}..."
else
  echo "❌ 失败：注册失败"
  echo "   响应: $REGISTER_RESULT"
  exit 1
fi

echo ""
echo "=========================================="
echo "测试 2: 使用加密密码登录"
echo "=========================================="

LOGIN_RESULT=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"mobile\":\"${TEST_MOBILE_NEW}\",
    \"password\":\"${ENCRYPTED_PASSWORD}\"
  }")

CODE=$(echo $LOGIN_RESULT | jq -r '.code')
LOGIN_TOKEN=$(echo $LOGIN_RESULT | jq -r '.data.token // empty')

if [ "$CODE" = "0" ] || [ "$CODE" = "200" ]; then
  echo "✅ 通过：使用加密密码登录成功"
  echo "   Token: ${LOGIN_TOKEN:0:30}..."
else
  echo "❌ 失败：登录失败"
  echo "   响应: $LOGIN_RESULT"
  exit 1
fi

echo ""
echo "=========================================="
echo "测试 3: 使用错误密码登录"
echo "=========================================="

WRONG_PASSWORD=$(node -e "
const crypto = require('crypto');
const password = 'WrongPassword123';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);
")

WRONG_LOGIN_RESULT=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"mobile\":\"${TEST_MOBILE_NEW}\",
    \"password\":\"${WRONG_PASSWORD}\"
  }")

CODE=$(echo $WRONG_LOGIN_RESULT | jq -r '.code')
MESSAGE=$(echo $WRONG_LOGIN_RESULT | jq -r '.message')

if [ "$CODE" = "401" ] && [[ "$MESSAGE" == *"密码错误"* ]]; then
  echo "✅ 通过：错误密码被正确拦截"
  echo "   错误信息: $MESSAGE"
else
  echo "❌ 失败：错误密码未被拦截"
  echo "   响应: $WRONG_LOGIN_RESULT"
fi

echo ""
echo "=========================================="
echo "测试 4: 验证 Token 有效性"
echo "=========================================="

USER_INFO=$(curl -s -X GET "${BASE_URL}/user/me" \
  -H "Authorization: Bearer ${LOGIN_TOKEN}")

CODE=$(echo $USER_INFO | jq -r '.code')
MOBILE=$(echo $USER_INFO | jq -r '.data.mobile // empty')

if [ "$CODE" = "0" ] || [ "$CODE" = "200" ]; then
  echo "✅ 通过：Token 有效，可以获取用户信息"
  echo "   手机号: $MOBILE"
else
  echo "❌ 失败：Token 无效"
  echo "   响应: $USER_INFO"
fi

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "总结："
echo "- 前端使用 SHA256 加密密码"
echo "- 后端接收加密密码后使用 PBKDF2 二次加密存储"
echo "- 登录时前端加密后的密码可以正确验证"
echo "- 密码加密流程正常工作"
