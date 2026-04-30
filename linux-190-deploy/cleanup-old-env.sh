#!/bin/bash

# ============================================
# 清理旧环境脚本
# 用于在验证新环境稳定后，清理待命的旧环境以节省资源
# ============================================

set -euo pipefail

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

# ============================================
# 主函数
# ============================================

main() {
    print_header "清理旧环境"

    # 获取当前活跃环境
    local active_env
    active_env=$(get_active_env)

    # 确定待命环境
    local standby_env
    if [ "$active_env" = "blue" ]; then
        standby_env="green"
    else
        standby_env="blue"
    fi

    log_info "当前活跃环境: ${active_env}"
    log_info "待命环境: ${standby_env}"
    echo ""

    # 检查待命环境是否在运行
    local standby_container="together-frontend-${standby_env}"
    if ! docker ps --format '{{.Names}}' | grep -q "^${standby_container}$"; then
        log_info "待命环境 ${standby_env} 未运行，无需清理"
        exit 0
    fi

    # 显示容器信息
    log_info "待命环境容器信息:"
    docker ps --filter "name=${standby_container}" --format "  - {{.Names}}: {{.Status}}"
    echo ""

    # 确认提示
    log_warning "确定要停止并删除 ${standby_env} 环境吗？ [y/N]"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi

    # 停止容器
    log_step "停止 ${standby_env} 容器"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" stop "frontend-${standby_env}" 2>/dev/null || true
    log_success "${standby_env} 容器已停止"

    # 可选：删除容器
    log_warning "是否同时删除容器？（删除后需要重新构建才能启动） [y/N]"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_step "删除 ${standby_env} 容器"
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" rm -f "frontend-${standby_env}" 2>/dev/null || true
        log_success "${standby_env} 容器已删除"
    fi

    echo ""
    print_header "清理完成"

    log_info "当前运行的前端容器:"
    docker ps --filter "name=together-frontend" --format "  - {{.Names}}: {{.Status}}"
    echo ""

    log_info "如需重新启动 ${standby_env} 环境："
    echo "  docker compose -f ${DEPLOY_COMPOSE_FILE} up -d frontend-${standby_env}"
    echo ""
}

# 执行主函数
main "$@"
