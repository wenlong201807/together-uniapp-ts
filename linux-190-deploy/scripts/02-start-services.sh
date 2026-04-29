#!/bin/bash

# ============================================
# 启动服务 - 蓝绿部署版
# ============================================

set -euo pipefail

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${DEPLOY_ROOT}/config.sh"
source "${DEPLOY_ROOT}/utils.sh"

main() {
    print_header "启动 Staging 环境服务"

    cd "${DEPLOY_DIR}"

    # 检查构建产物
    log_step "检查构建产物"
    if [ ! -d "${PROJECT_ROOT}/dist/build/h5" ]; then
        log_error "构建产物不存在，请先运行构建"
        log_info "执行: cd ${PROJECT_ROOT} && pnpm build:h5:staging"
        exit 1
    fi
    log_success "构建产物存在"
    echo ""

    # 确保外部卷存在
    log_step "检查 Docker 外部卷"
    for vol in ${DOCKER_VOLUMES}; do
        if ! docker volume inspect "${vol}" &>/dev/null; then
            log_info "创建外部卷: ${vol}"
            docker volume create "${vol}"
        fi
    done
    log_success "外部卷就绪"
    echo ""

    # 构建并启动（默认蓝色环境）
    log_step "构建 Docker 镜像"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" build frontend-blue
    log_success "镜像构建完成"
    echo ""

    # 启动所有服务
    log_step "启动容器"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" up -d nginx-proxy frontend-blue certbot
    log_success "容器启动完成"
    echo ""

    # 等待健康检查
    log_step "等待健康检查"
    sleep 5

    if wait_for_healthy "${BLUE_CONTAINER}" "${HEALTH_CHECK_TIMEOUT}"; then
        log_success "前端服务启动成功"
    else
        log_warning "健康检查超时"
    fi

    if wait_for_healthy "${NGINX_PROXY_CONTAINER}" "${HEALTH_CHECK_TIMEOUT}"; then
        log_success "Nginx Proxy 启动成功"
    else
        log_warning "Nginx Proxy 健康检查超时"
    fi
    echo ""

    # 显示状态
    log_step "容器状态"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" ps
    echo ""

    print_header "服务启动完成！"

    log_info "访问地址："
    echo "  - 前端: https://${DOMAIN}"
    echo "  - 版本: https://${DOMAIN}/version.txt"
    echo "  - Admin: https://${DOMAIN}:8108"
    echo "  - 后端: ${BACKEND_API_URL}/api/v1"
    echo ""
}

main "$@"
