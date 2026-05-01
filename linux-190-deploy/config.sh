#!/bin/bash

# ============================================
# Together 前端 Staging 环境配置
# ============================================

# 项目路径
export PROJECT_ROOT="/home/zwl/together-uniapp-ts"
export DEPLOY_DIR="/home/zwl/together-uniapp-ts/linux-190-deploy"

# Docker Compose 文件
export DEPLOY_COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.blue-green.yml"
export COMPOSE_CMD="docker compose"

# 容器名称
export NGINX_PROXY_CONTAINER="together-nginx-proxy"
export BLUE_CONTAINER="together-frontend-blue"
export GREEN_CONTAINER="together-frontend-green"
export CERTBOT_CONTAINER="together-certbot-staging"

# 端口配置
export FRONTEND_PORT="80"
export FRONTEND_HTTPS_PORT="443"
export BACKEND_API_URL="https://app.wenlong.life"

# Git 配置
export GIT_BRANCH="test9"

# 超时配置（秒）
export HEALTH_CHECK_TIMEOUT=60

# 自动确认（用于 CI/CD）
export AUTO_CONFIRM="${AUTO_CONFIRM:-false}"

# 蓝绿部署配置
export UPSTREAM_CONF="${DEPLOY_DIR}/config/nginx/upstream.conf"

# 版本配置
export VERSION_FILE="${DEPLOY_DIR}/config/VERSION"
export PACKAGE_JSON="${PROJECT_ROOT}/package.json"

# 域名
export DOMAIN="app.wenlong.life"

# Docker volumes（外部卷，需预先创建）
export DOCKER_VOLUMES="certbot-conf certbot-www"
