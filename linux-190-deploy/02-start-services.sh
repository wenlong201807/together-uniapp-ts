#!/bin/bash

# ============================================
# 启动服务
# ============================================

set -e

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

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

    # 构建镜像
    log_step "构建 Docker 镜像"
    docker-compose build
    log_success "镜像构建完成"
    echo ""

    # 启动容器
    log_step "启动容器"
    docker-compose up -d
    log_success "容器启动完成"
    echo ""

    # 等待健康检查
    log_step "等待健康检查"
    sleep 5

    if wait_for_healthy "${CONTAINER_NAME}" "${HEALTH_CHECK_TIMEOUT}"; then
        log_success "服务启动成功"
    else
        log_warning "健康检查超时"
    fi
    echo ""

    # 显示状态
    log_step "容器状态"
    docker-compose ps
    echo ""

    print_header "✅ 服务启动完成！"

    log_info "访问地址："
    echo "  http://23.94.103.190:${FRONTEND_PORT}"
    echo ""
}

main "$@"
