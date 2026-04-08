#!/bin/bash

echo "=========================================="
echo "测试七牛云上传流程"
echo "=========================================="
echo ""

# 需要先登录获取 token
echo "1. 登录获取 Token..."
LOGIN_RESULT=$(curl -s -X POST "http://localhost:8118/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "13800138001",
    "password": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
  }')

TOKEN=$(echo $LOGIN_RESULT | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，无法获取 Token"
  echo "   响应: $LOGIN_RESULT"
  exit 1
fi

echo "✅ 登录成功"
echo "   Token: ${TOKEN:0:30}..."
echo ""

echo "2. 获取七牛云上传凭证..."
UPLOAD_TOKEN_RESULT=$(curl -s -X POST "http://localhost:8118/api/v1/file/upload-token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "type": "square",
    "fileName": "test.jpg"
  }')

QINIU_TOKEN=$(echo $UPLOAD_TOKEN_RESULT | jq -r '.data.token // empty')
QINIU_KEY=$(echo $UPLOAD_TOKEN_RESULT | jq -r '.data.key // empty')
QINIU_DOMAIN=$(echo $UPLOAD_TOKEN_RESULT | jq -r '.data.domain // empty')

if [ -z "$QINIU_TOKEN" ]; then
  echo "❌ 获取上传凭证失败"
  echo "   响应: $UPLOAD_TOKEN_RESULT"
  exit 1
fi

echo "✅ 获取上传凭证成功"
echo "   Token: ${QINIU_TOKEN:0:50}..."
echo "   Key: $QINIU_KEY"
echo "   Domain: $QINIU_DOMAIN"
echo ""

echo "3. 测试保存文件记录..."
SAVE_RESULT=$(curl -s -X POST "http://localhost:8118/api/v1/file/save" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"key\": \"${QINIU_KEY}\",
    \"type\": \"square\",
    \"originalName\": \"test.jpg\"
  }")

FILE_ID=$(echo $SAVE_RESULT | jq -r '.data.id // empty')

if [ -n "$FILE_ID" ]; then
  echo "✅ 保存文件记录成功"
  echo "   文件ID: $FILE_ID"
else
  echo "❌ 保存文件记录失败"
  echo "   响应: $SAVE_RESULT"
fi

echo ""
echo "=========================================="
echo "七牛云上传流程测试完成"
echo "=========================================="
echo ""
echo "前端上传流程："
echo "1. 调用 /file/upload-token 获取七牛云上传凭证"
echo "2. 使用 uni.uploadFile 上传文件到七牛云"
echo "3. 调用 /file/save 保存文件记录到 MySQL"
echo "4. 返回七牛云 URL: \${domain}/\${key}"
