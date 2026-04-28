#!/bin/bash

# ============================================
# 快速回滚脚本
# ============================================

set -e

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.blue-green.yml"
UPSTREAM_CONF="${DEPLOY_DIR}/upstream.conf"

# 获取当前活跃环境
get_active_env() {
    if grep -q "together-frontend-blue:8080" "${UPSTREAM_CONF}" && \
       ! grep -q "# server together-frontend-blue:8080" "${UPSTREAM_CONF}"; then
        echo "blue"
    else
        echo "green"
    fi
}

main() {
    print_header "快速回滚到上一版本"

    local active_env=$(get_active_env)
    local previous_env

    if [ "$active_env" = "blue" ]; then
        previous_env="green"
    else
        previous_env="blue"
    fi

    log_warning "当前环境: ${active_env}"
    log_warning "将回滚到: ${previous_env}"
    echo ""

    # 确认
    log_warning "确定要回滚吗？ [y/N]"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi

    # 启动旧环境
    log_step "启动 ${previous_env} 环境"
    if [ "$previous_env" = "green" ]; then
        docker-compose -f "${COMPOSE_FILE}" --profile green up -d frontend-green
    else
        docker-compose -f "${COMPOSE_FILE}" up -d frontend-blue
    fi

    # 等待健康检查
    log_step "等待健康检查"
    sleep 10

    # 切换流量
    log_step "切换流量到 ${previous_env}"
    if [ "$previous_env" = "green" ]; then
        sed -i 's/^\s*server together-frontend-blue:8080/    # server together-frontend-blue:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^\s*# server together-frontend-green:8080/    server together-frontend-green:8080/' "${UPSTREAM_CONF}"
    else
        sed -i 's/^\s*server together-frontend-green:8080/    # server together-frontend-green:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^\s*# server together-frontend-blue:8080/    server together-frontend-blue:8080/' "${UPSTREAM_CONF}"
    fi

    # 重载 Nginx
    docker exec together-nginx-proxy nginx -s reload
    log_success "已回滚到 ${previous_env} 环境"

    # 停止当前环境
    log_step "停止 ${active_env} 环境"
    docker-compose -f "${COMPOSE_FILE}" stop "frontend-${active_env}"

    print_header "✅ 回滚完成！"

    # 记录日志
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ROLLBACK] 从 ${active_env} 回滚到 ${previous_env}" >> "${DEPLOY_DIR}/deployment.log"
}

main "$@"
