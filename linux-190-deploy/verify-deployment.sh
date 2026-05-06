#!/bin/bash

# ============================================
# 部署验证脚本 - 验证蓝绿部署是否正确工作
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

# ============================================
# 验证函数
# ============================================

# 验证 upstream 配置一致性
verify_upstream_config() {
    print_step "验证 upstream 配置"

    local active_env=$(get_active_env)
    log_info "当前活跃环境: ${active_env}"

    # 检查 upstream.conf 内容
    log_step "检查 upstream.conf 配置"
    if [ "$active_env" = "blue" ]; then
        if grep -q "^\s*server together-frontend-blue:8080" "${UPSTREAM_CONF}" && \
           grep -q "^\s*# server together-frontend-green:8080" "${UPSTREAM_CONF}"; then
            log_success "upstream.conf 配置正确 (blue 活跃)"
        else
            log_error "upstream.conf 配置不正确"
            return 1
        fi
    else
        if grep -q "^\s*server together-frontend-green:8080" "${UPSTREAM_CONF}" && \
           grep -q "^\s*# server together-frontend-blue:8080" "${UPSTREAM_CONF}"; then
            log_success "upstream.conf 配置正确 (green 活跃)"
        else
            log_error "upstream.conf 配置不正确"
            return 1
        fi
    fi

    # 检查 nginx 容器内的配置
    log_step "检查 nginx 容器内的配置"
    local container_upstream=$(docker exec "${NGINX_PROXY_CONTAINER}" cat /etc/nginx/conf.d/upstream.conf)
    if echo "$container_upstream" | grep -q "server together-frontend-${active_env}:8080" && \
       ! echo "$container_upstream" | grep "server together-frontend-${active_env}:8080" | grep -q "^[[:space:]]*#"; then
        log_success "nginx 容器内配置正确"
    else
        log_error "nginx 容器内配置不正确"
        return 1
    fi

    echo ""
    return 0
}

# 验证容器状态
verify_containers() {
    print_step "验证容器状态"

    local active_env=$(get_active_env)
    local active_container="together-frontend-${active_env}"

    # 检查活跃容器
    log_step "检查活跃容器: ${active_container}"
    if docker ps --format '{{.Names}}' | grep -q "^${active_container}$"; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' "${active_container}" 2>/dev/null || echo "none")
        if [ "$health" = "healthy" ]; then
            log_success "${active_container} 运行正常且健康"
        else
            log_warning "${active_container} 运行但健康状态: ${health}"
        fi
    else
        log_error "${active_container} 未运行"
        return 1
    fi

    # 检查 nginx-proxy
    log_step "检查 nginx-proxy 容器"
    if docker ps --format '{{.Names}}' | grep -q "^${NGINX_PROXY_CONTAINER}$"; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' "${NGINX_PROXY_CONTAINER}" 2>/dev/null || echo "none")
        if [ "$health" = "healthy" ]; then
            log_success "${NGINX_PROXY_CONTAINER} 运行正常且健康"
        else
            log_warning "${NGINX_PROXY_CONTAINER} 运行但健康状态: ${health}"
        fi
    else
        log_error "${NGINX_PROXY_CONTAINER} 未运行"
        return 1
    fi

    echo ""
    return 0
}

# 验证版本一致性
verify_version() {
    print_step "验证版本一致性"

    local active_env=$(get_active_env)
    local active_container="together-frontend-${active_env}"

    # 获取容器内版本
    log_step "获取容器内版本"
    local container_version=$(docker exec "${active_container}" cat /usr/share/nginx/html/version.txt 2>/dev/null || echo "unknown")
    log_info "容器版本: ${container_version}"

    # 获取线上版本
    log_step "获取线上版本"
    local online_version=$(curl -s https://${DOMAIN}/version.txt 2>/dev/null || echo "unknown")
    log_info "线上版本: ${online_version}"

    # 对比版本
    if [ "$container_version" = "$online_version" ]; then
        log_success "版本一致: ${container_version}"
    else
        log_error "版本不一致！容器: ${container_version}, 线上: ${online_version}"
        return 1
    fi

    echo ""
    return 0
}

# 验证 HTTP 访问
verify_http_access() {
    print_step "验证 HTTP 访问"

    # 测试内部访问
    log_step "测试内部访问 (localhost:8088)"
    local internal_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8088/ 2>/dev/null || echo "000")
    if [ "$internal_code" = "200" ]; then
        log_success "内部访问正常 (${internal_code})"
    else
        log_error "内部访问失败 (${internal_code})"
        return 1
    fi

    # 测试外部访问
    log_step "测试外部访问 (https://${DOMAIN})"
    local external_code=$(curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/ 2>/dev/null || echo "000")
    if [ "$external_code" = "200" ]; then
        log_success "外部访问正常 (${external_code})"
    else
        log_error "外部访问失败 (${external_code})"
        return 1
    fi

    # 测试健康检查端点
    log_step "测试健康检查端点"
    local health_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8088/health 2>/dev/null || echo "000")
    if [ "$health_code" = "200" ]; then
        log_success "健康检查端点正常 (${health_code})"
    else
        log_error "健康检查端点失败 (${health_code})"
        return 1
    fi

    echo ""
    return 0
}

# 验证 nginx 配置语法
verify_nginx_config() {
    print_step "验证 Nginx 配置语法"

    log_step "测试 nginx-proxy 配置"
    local nginx_test_output=$(docker exec "${NGINX_PROXY_CONTAINER}" nginx -t 2>&1)
    if echo "$nginx_test_output" | grep -q "syntax is ok" && echo "$nginx_test_output" | grep -q "test is successful"; then
        log_success "Nginx 配置语法正确"
    else
        log_error "Nginx 配置语法错误"
        echo "$nginx_test_output"
        return 1
    fi

    echo ""
    return 0
}

# ============================================
# 主函数
# ============================================

main() {
    print_header "蓝绿部署验证"

    local failed=0

    # 执行所有验证
    verify_upstream_config || failed=$((failed + 1))
    verify_containers || failed=$((failed + 1))
    verify_nginx_config || failed=$((failed + 1))
    verify_http_access || failed=$((failed + 1))
    verify_version || failed=$((failed + 1))

    # 显示结果
    echo ""
    print_header "验证结果"

    if [ $failed -eq 0 ]; then
        log_success "所有验证通过！蓝绿部署工作正常 ✅"
        echo ""
        log_info "当前状态:"
        echo "  - 活跃环境: $(get_active_env)"
        echo "  - 访问地址: https://${DOMAIN}"
        echo "  - 版本信息: https://${DOMAIN}/version.txt"
        echo ""
        return 0
    else
        log_error "验证失败！共 ${failed} 项检查未通过 ❌"
        echo ""
        log_warning "建议操作:"
        echo "  1. 检查容器日志: docker logs ${NGINX_PROXY_CONTAINER}"
        echo "  2. 检查 upstream 配置: cat ${UPSTREAM_CONF}"
        echo "  3. 重启 nginx: docker restart ${NGINX_PROXY_CONTAINER}"
        echo ""
        return 1
    fi
}

# 执行主函数
main "$@"
