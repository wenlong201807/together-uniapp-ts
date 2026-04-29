#!/bin/bash

# ============================================
# 快速回滚脚本 - 蓝绿部署回滚
# ============================================

set -euo pipefail

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

main() {
    print_header "快速回滚到上一版本"

    local active_env
    active_env=$(get_active_env)
    local previous_env

    if [ "$active_env" = "blue" ]; then
        previous_env="green"
    else
        previous_env="blue"
    fi

    log_warning "当前活跃环境: ${active_env}"
    log_warning "将回滚到: ${previous_env} 环境"
    echo ""

    # 检查旧环境容器是否存在
    local previous_container="together-frontend-${previous_env}"
    if ! docker ps -a --format '{{.Names}}' | grep -qx "${previous_container}"; then
        log_error "旧环境 ${previous_env} 容器不存在，无法回滚"
        log_info "请手动构建: ${COMPOSE_CMD} -f ${DEPLOY_COMPOSE_FILE} ..."
        exit 1
    fi

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
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" --profile green up -d frontend-green
    else
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" up -d frontend-blue
    fi

    # 等待健康检查
    if wait_for_healthy "${previous_container}" "${HEALTH_CHECK_TIMEOUT}"; then
        log_success "${previous_container} 健康检查通过"
    else
        log_warning "${previous_container} 健康检查超时，继续回滚..."
    fi
    echo ""

    # 切换流量
    switch_upstream "${previous_env}"
    reload_nginx
    log_success "已回滚到 ${previous_env} 环境"

    # 停止当前环境
    log_step "停止 ${active_env} 环境"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" stop "frontend-${active_env}" 2>/dev/null || true

    # 记录日志
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ROLLBACK] 从 ${active_env} 回滚到 ${previous_env}" >> "${DEPLOY_DIR}/deployment.log"

    print_header "回滚完成！"

    log_info "当前活跃环境: ${previous_env}"
    log_info "访问地址: https://${DOMAIN}"
    echo ""
}

main "$@"
