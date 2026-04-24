#!/bin/bash

# ============================================
# Together 前端 Staging 环境一键部署脚本
# ============================================

set -e

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

# ============================================
# 主函数
# ============================================

main() {
    print_header "Together 前端 Staging 环境一键部署"

    log_info "此脚本将执行以下操作："
    echo "  1. 拉取最新代码（test9 分支）"
    echo "  2. 构建前端项目"
    echo "  3. 停止旧容器"
    echo "  4. 构建并启动新容器"
    echo "  5. 健康检查"
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

    log_info "开始部署..."
    echo ""

    # 步骤 1: 拉取代码
    print_step "步骤 1/5: 拉取最新代码"
    cd "${PROJECT_ROOT}"

    log_step "切换到 ${GIT_BRANCH} 分支"
    git fetch origin
    git checkout "${GIT_BRANCH}"
    git pull origin "${GIT_BRANCH}"
    log_success "代码更新完成"
    echo ""

    # 步骤 2: 构建前端
    print_step "步骤 2/5: 构建前端项目"
    log_step "执行 pnpm build:h5:staging"
    pnpm build:h5:staging
    log_success "前端构建完成"
    echo ""

    # 步骤 3: 停止旧容器
    print_step "步骤 3/5: 停止旧容器"
    cd "${DEPLOY_DIR}"

    if docker ps -a | grep -q "${CONTAINER_NAME}"; then
        log_step "停止并删除旧容器"
        docker-compose down
        log_success "旧容器已清理"
    else
        log_info "没有运行中的容器"
    fi
    echo ""

    # 步骤 4: 启动新容器
    print_step "步骤 4/5: 构建并启动新容器"
    log_step "构建 Docker 镜像"
    docker-compose build --no-cache

    log_step "启动容器"
    docker-compose up -d
    log_success "容器启动完成"
    echo ""

    # 步骤 5: 健康检查
    print_step "步骤 5/5: 健康检查"
    sleep 5

    if wait_for_healthy "${CONTAINER_NAME}" "${HEALTH_CHECK_TIMEOUT}"; then
        log_success "健康检查通过"
    else
        log_warning "健康检查超时，但容器可能正在启动"
        log_info "请稍后运行: ./04-health-check.sh"
    fi
    echo ""

    # 显示容器状态
    log_step "容器状态"
    docker-compose ps
    echo ""

    # 部署完成
    print_header "✅ 部署完成！"

    log_info "访问地址："
    echo "  - 前端页面 (HTTP): http://app.wenlong.life:${FRONTEND_PORT}"
    echo "  - 前端页面 (HTTPS): https://app.wenlong.life:${FRONTEND_HTTPS_PORT}"
    echo "  - 后端 API: ${BACKEND_API_URL}/api/v1"
    echo "  - Swagger: ${BACKEND_API_URL}/api/docs"
    echo ""

    log_info "查看日志："
    echo "  docker logs ${CONTAINER_NAME} -f"
    echo ""

    log_info "健康检查："
    echo "  ./04-health-check.sh"
    echo ""

    log_info "SSL 证书："
    echo "  如果是首次部署 HTTPS，请运行: ./init-letsencrypt.sh"
    echo "  查看证书状态: docker-compose run --rm certbot certificates"
    echo ""
}

# 执行主函数
main "$@"
