#!/bin/bash

# ============================================
# 停止并清理容器
# ============================================

set -e

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

main() {
    print_header "停止并清理 Staging 环境"

    log_warning "此操作将："
    echo "  1. 停止前端容器"
    echo "  2. 删除容器"
    echo "  3. 清理镜像（可选）"
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
    log_step "停止并删除容器"
    docker-compose down
    log_success "容器已清理"
    echo ""

    # 询问是否清理镜像
    if [ "${AUTO_CONFIRM}" != "true" ]; then
        log_warning "是否清理 Docker 镜像？ [y/N]"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            log_step "清理镜像"
            docker-compose down --rmi all
            log_success "镜像已清理"
        fi
    fi

    print_header "✅ 清理完成！"
}

main "$@"
