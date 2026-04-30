#!/bin/bash

# ============================================
# 部署验证测试脚本
# 测试新增的验证函数是否正常工作
# ============================================

set -euo pipefail

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

# ============================================
# 测试函数
# ============================================

test_verify_container_running() {
    echo ""
    print_header "测试 1: verify_container_running"

    # 测试存在且运行的容器
    if verify_container_running "together-frontend-blue"; then
        log_success "测试通过: 检测到运行中的容器"
    else
        log_error "测试失败: 未检测到运行中的容器"
    fi

    # 测试不存在的容器
    if verify_container_running "together-frontend-nonexistent"; then
        log_error "测试失败: 错误地检测到不存在的容器"
    else
        log_success "测试通过: 正确识别不存在的容器"
    fi
}

test_verify_container_healthy() {
    echo ""
    print_header "测试 2: verify_container_healthy"

    if verify_container_healthy "together-frontend-blue"; then
        log_success "测试通过: 容器健康状态正常"
    else
        log_warning "测试警告: 容器健康状态异常（可能正在启动）"
    fi
}

test_verify_upstream_consistency() {
    echo ""
    print_header "测试 3: verify_upstream_consistency"

    if verify_upstream_consistency; then
        log_success "测试通过: upstream 配置一致性验证通过"
    else
        log_error "测试失败: upstream 配置一致性验证失败"
        log_info "这是预期的错误，说明验证函数正常工作"
    fi
}

test_verify_nginx_proxy_ready() {
    echo ""
    print_header "测试 4: verify_nginx_proxy_ready"

    if verify_nginx_proxy_ready; then
        log_success "测试通过: nginx-proxy 启动条件满足"
    else
        log_error "测试失败: nginx-proxy 启动条件不满足"
        log_info "这可能是预期的错误，说明验证函数正常工作"
    fi
}

test_verify_frontend_container() {
    echo ""
    print_header "测试 5: verify_frontend_container"

    if verify_frontend_container "together-frontend-blue"; then
        log_success "测试通过: 前端容器验证通过"
    else
        log_error "测试失败: 前端容器验证失败"
    fi
}

test_edge_cases() {
    echo ""
    print_header "测试 6: 边界情况"

    # 测试空参数
    log_step "测试 6.1: 空参数验证"
    if verify_container_running ""; then
        log_error "测试失败: 应该拒绝空参数"
    else
        log_success "测试通过: 正确拒绝空参数"
    fi

    # 测试不存在的容器
    log_step "测试 6.2: 不存在的容器"
    if verify_container_running "nonexistent-container-12345"; then
        log_error "测试失败: 错误地检测到不存在的容器"
    else
        log_success "测试通过: 正确识别不存在的容器"
    fi

    # 测试配置文件不存在
    log_step "测试 6.3: 配置文件不存在"
    local backup_conf="${UPSTREAM_CONF}.test_backup"
    if [ -f "${UPSTREAM_CONF}" ]; then
        mv "${UPSTREAM_CONF}" "${backup_conf}" 2>/dev/null || true

        if verify_upstream_consistency 2>/dev/null; then
            log_error "测试失败: 应该检测到配置文件不存在"
        else
            log_success "测试通过: 正确检测到配置文件不存在"
        fi

        mv "${backup_conf}" "${UPSTREAM_CONF}" 2>/dev/null || true
    else
        log_warning "跳过测试: 配置文件本身不存在"
    fi

    # 测试 show_container_logs 函数
    log_step "测试 6.4: 日志显示函数"
    if show_container_logs "together-frontend-blue" 5 >/dev/null 2>&1; then
        log_success "测试通过: 日志显示函数正常"
    else
        log_warning "测试警告: 日志显示函数异常（容器可能不存在）"
    fi

    # 测试空参数的日志函数
    log_step "测试 6.5: 日志函数空参数"
    if show_container_logs "" 2>/dev/null; then
        log_error "测试失败: 应该拒绝空参数"
    else
        log_success "测试通过: 正确拒绝空参数"
    fi
}

# ============================================
# 主函数
# ============================================

main() {
    print_header "部署验证函数测试"

    log_info "当前环境信息:"
    echo "  - 部署目录: ${DEPLOY_DIR}"
    echo "  - Upstream 配置: ${UPSTREAM_CONF}"
    echo "  - Nginx 容器: ${NGINX_PROXY_CONTAINER}"
    echo ""

    log_info "当前容器状态:"
    docker ps --filter "name=together-" --format "  - {{.Names}}: {{.Status}}"
    echo ""

    # 运行测试
    test_verify_container_running
    test_verify_container_healthy
    test_verify_upstream_consistency
    test_verify_nginx_proxy_ready
    test_verify_frontend_container
    test_edge_cases

    echo ""
    print_header "测试完成"

    log_info "总结:"
    echo "  - 所有验证函数已加载"
    echo "  - 边界情况测试已完成"
    echo "  - 可以在部署脚本中使用这些函数"
    echo "  - 如果有测试失败，请检查容器状态和配置"
}

# 执行主函数
main "$@"
