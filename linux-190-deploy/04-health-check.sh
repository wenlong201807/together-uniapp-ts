#!/bin/bash

# ============================================
# 健康检查脚本
# ============================================

set -e

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

main() {
    print_header "Staging 环境健康检查"

    cd "${DEPLOY_DIR}"

    # 检查 1: 容器状态
    log_step "检查 1/4: 容器状态"
    if docker ps | grep -q "${CONTAINER_NAME}"; then
        log_success "容器运行中"
        docker ps | grep "${CONTAINER_NAME}"
    else
        log_error "容器未运行"
        exit 1
    fi
    echo ""

    # 检查 2: 容器健康状态
    log_step "检查 2/4: 容器健康状态"
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo "none")

    if [ "$health_status" = "healthy" ]; then
        log_success "容器健康状态: ${health_status}"
    elif [ "$health_status" = "none" ]; then
        log_warning "容器未配置健康检查"
    else
        log_warning "容器健康状态: ${health_status}"
    fi
    echo ""

    # 检查 3: 端口监听
    log_step "检查 3/4: 端口监听"
    if netstat -tlnp 2>/dev/null | grep -q ":${FRONTEND_PORT}"; then
        log_success "端口 ${FRONTEND_PORT} 正在监听"
    else
        log_error "端口 ${FRONTEND_PORT} 未监听"
    fi
    echo ""

    # 检查 4: HTTP 访问
    log_step "检查 4/4: HTTP 访问测试"

    # 测试前端页面
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${FRONTEND_PORT}/" | grep -q "200"; then
        log_success "前端页面可访问"
    else
        log_error "前端页面访问失败"
    fi

    # 测试后端 API
    if curl -s -o /dev/null -w "%{http_code}" "${BACKEND_API_URL}/api/v1/public/config" | grep -q "200"; then
        log_success "后端 API 可访问"
    else
        log_warning "后端 API 访问失败"
    fi
    echo ""

    # 显示日志
    log_step "最近日志（最后 20 行）"
    docker logs "${CONTAINER_NAME}" --tail 20
    echo ""

    print_header "✅ 健康检查完成！"

    log_info "访问地址："
    echo "  - 前端: http://23.94.103.190:${FRONTEND_PORT}"
    echo "  - 后端: ${BACKEND_API_URL}/api/v1"
    echo ""
}

main "$@"
