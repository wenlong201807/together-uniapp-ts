#!/bin/bash

# ============================================
# Together 前端 Staging 环境配置
# ============================================

# 项目路径
export PROJECT_ROOT="/home/zwl/together-uniapp-ts"
export DEPLOY_DIR="/home/zwl/together-uniapp-ts/linux-190-deploy"

# Docker Compose 文件
export COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.yml"

# 容器名称
export CONTAINER_NAME="together-frontend-staging"

# 端口配置
export FRONTEND_PORT="80"
export FRONTEND_HTTPS_PORT="443"
export BACKEND_API_URL="http://app.wenlong.life:8125"

# Git 配置
export GIT_BRANCH="test9"

# 超时配置（秒）
export HEALTH_CHECK_TIMEOUT=60

# 自动确认（用于 CI/CD）
export AUTO_CONFIRM="${AUTO_CONFIRM:-false}"
