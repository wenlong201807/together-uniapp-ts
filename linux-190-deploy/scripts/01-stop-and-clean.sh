#!/bin/bash

# ============================================
# 停止并清理容器 - 蓝绿部署版
# ============================================

set -euo pipefail

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${DEPLOY_ROOT}/config.sh"
source "${DEPLOY_ROOT}/utils.sh"

main() {
    print_header "停止并清理 Staging 环境"

    log_warning "此操作将："
    echo "  1. 停止所有前端容器（blue + green）"
    echo "  2. 停止 nginx-proxy 和 certbot"
    echo "  3. 删除容器"
    echo "  4. 清理镜像（可选）"
    echo ""

    # 确认提示
    if [ "${AUTO_CONFIRM}" != "true" ]; then
        log_warning "确定要继续吗？ [y/N]"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "操作已取消"
            exit 0
        fi
    fi

    cd "${DEPLOY_DIR}"

    # 停止并删除容器
    log_step "停止并删除所有容器"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" --profile green down
    log_success "容器已清理"
    echo ""

    # 询问是否清理镜像
    if [ "${AUTO_CONFIRM}" != "true" ]; then
        log_warning "是否清理 Docker 镜像？ [y/N]"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            log_step "清理镜像"
            ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" --profile green down --rmi all
            log_success "镜像已清理"
        fi
    fi

    print_header "清理完成！"

    log_info "外部卷未被删除（certbot-conf, certbot-www）"
    log_info "如需删除卷: docker volume rm certbot-conf certbot-www"
    echo ""
}

main "$@"
