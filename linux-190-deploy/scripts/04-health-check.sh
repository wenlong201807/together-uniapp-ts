#!/bin/bash

# ============================================
# 健康检查脚本 - 蓝绿部署版
# ============================================

set -euo pipefail

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${DEPLOY_ROOT}/config.sh"
source "${DEPLOY_ROOT}/utils.sh"

main() {
    print_header "Staging 环境健康检查"

    local active_env
    active_env=$(get_active_env)
    local active_container="together-frontend-${active_env}"

    log_info "当前活跃环境: ${active_env} (${active_container})"
    echo ""

    # 检查 1: Nginx Proxy 容器状态
    log_step "检查 1/5: Nginx Proxy 容器状态"
    if docker ps | grep -q "${NGINX_PROXY_CONTAINER}"; then
        log_success "Nginx Proxy 运行中"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "${NGINX_PROXY_CONTAINER}"
    else
        log_error "Nginx Proxy 未运行"
        exit 1
    fi
    echo ""

    # 检查 2: 前端容器状态
    log_step "检查 2/5: 前端容器状态 (${active_env})"
    if docker ps | grep -q "${active_container}"; then
        log_success "前端容器 ${active_container} 运行中"
    else
        log_error "前端容器 ${active_container} 未运行"
    fi
    echo ""

    # 检查 3: 容器健康状态
    log_step "检查 3/5: 容器健康状态"
    local proxy_health
    proxy_health=$(docker inspect --format='{{.State.Health.Status}}' "${NGINX_PROXY_CONTAINER}" 2>/dev/null || echo "none")
    log_info "Nginx Proxy 健康状态: ${proxy_health}"

    local frontend_health
    frontend_health=$(docker inspect --format='{{.State.Health.Status}}' "${active_container}" 2>/dev/null || echo "none")
    log_info "前端容器健康状态: ${frontend_health}"
    echo ""

    # 检查 4: 端口监听
    log_step "检查 4/5: 端口监听"
    if ss -tlnp 2>/dev/null | grep -q ":${FRONTEND_PORT} "; then
        log_success "端口 ${FRONTEND_PORT} (HTTP) 正在监听"
    elif netstat -tlnp 2>/dev/null | grep -q ":${FRONTEND_PORT} "; then
        log_success "端口 ${FRONTEND_PORT} (HTTP) 正在监听"
    else
        log_error "端口 ${FRONTEND_PORT} (HTTP) 未监听"
    fi

    if ss -tlnp 2>/dev/null | grep -q ":${FRONTEND_HTTPS_PORT} "; then
        log_success "端口 ${FRONTEND_HTTPS_PORT} (HTTPS) 正在监听"
    elif netstat -tlnp 2>/dev/null | grep -q ":${FRONTEND_HTTPS_PORT} "; then
        log_success "端口 ${FRONTEND_HTTPS_PORT} (HTTPS) 正在监听"
    else
        log_error "端口 ${FRONTEND_HTTPS_PORT} (HTTPS) 未监听"
    fi
    echo ""

    # 检查 5: HTTP/HTTPS 访问
    log_step "检查 5/5: HTTP/HTTPS 访问测试"
    if curl -sk -o /dev/null -w "%{http_code}" "https://localhost/" | grep -q "200"; then
        log_success "HTTPS 前端页面可访问"
    else
        log_error "HTTPS 前端页面访问失败"
    fi

    # 测试版本端点
    local version_info
    version_info=$(curl -sk "https://localhost/version.txt" 2>/dev/null || echo "unavailable")
    log_info "当前版本: ${version_info}"

    # 测试后端 API
    if curl -s -o /dev/null -w "%{http_code}" "${BACKEND_API_URL}/api/v1/public/config" 2>/dev/null | grep -q "200"; then
        log_success "后端 API 可访问"
    else
        log_warning "后端 API 访问失败"
    fi
    echo ""

    # 显示所有容器状态
    log_step "所有容器状态"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" ps 2>/dev/null || docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "together|nginx"
    echo ""

    # 显示最近日志
    log_step "前端容器最近日志（最后 20 行）"
    docker logs "${active_container}" --tail 20 2>/dev/null || true
    echo ""

    print_header "健康检查完成！"

    log_info "访问地址："
    echo "  - 前端: https://${DOMAIN}"
    echo "  - 版本: https://${DOMAIN}/version.txt"
    echo "  - Admin: https://${DOMAIN}:8108"
    echo "  - 后端: ${BACKEND_API_URL}/api/v1"
    echo ""
}

main "$@"
