#!/bin/bash

# ============================================
# 蓝绿部署脚本 - 零停机部署
# ============================================

set -e

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

# 部署配置
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.blue-green.yml"
UPSTREAM_CONF="${DEPLOY_DIR}/upstream.conf"

# 获取当前活跃环境
get_active_env() {
    if grep -q "together-frontend-blue:8080" "${UPSTREAM_CONF}" && \
       ! grep -q "# server together-frontend-blue:8080" "${UPSTREAM_CONF}"; then
        echo "blue"
    elif grep -q "together-frontend-green:8080" "${UPSTREAM_CONF}" && \
         ! grep -q "# server together-frontend-green:8080" "${UPSTREAM_CONF}"; then
        echo "green"
    else
        echo "blue"  # 默认蓝色
    fi
}

# 获取目标环境
get_target_env() {
    local active=$(get_active_env)
    if [ "$active" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# 切换上游配置
switch_upstream() {
    local target=$1
    local backup="${UPSTREAM_CONF}.backup"

    log_step "备份当前配置"
    cp "${UPSTREAM_CONF}" "${backup}"

    log_step "切换到 ${target} 环境"

    if [ "$target" = "green" ]; then
        # 切换到绿色
        sed -i 's/^\s*server together-frontend-blue:8080/    # server together-frontend-blue:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^\s*# server together-frontend-green:8080/    server together-frontend-green:8080/' "${UPSTREAM_CONF}"
    else
        # 切换到蓝色
        sed -i 's/^\s*server together-frontend-green:8080/    # server together-frontend-green:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^\s*# server together-frontend-blue:8080/    server together-frontend-blue:8080/' "${UPSTREAM_CONF}"
    fi

    log_success "配置已切换到 ${target}"
}

# 重载 Nginx 配置
reload_nginx() {
    log_step "重载 Nginx 配置"
    docker exec together-nginx-proxy nginx -t && \
    docker exec together-nginx-proxy nginx -s reload
    log_success "Nginx 配置已重载"
}

# 发送部署通知
send_notification() {
    local status=$1
    local env=$2
    local message=$3
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 记录到日志文件
    local log_file="${DEPLOY_DIR}/deployment.log"
    echo "[${timestamp}] [${status}] 环境: ${env} - ${message}" >> "${log_file}"

    # 发送桌面通知（如果支持）
    if command -v notify-send &> /dev/null; then
        notify-send "Together 部署通知" "${message}" -u normal
    fi

    # 输出到终端
    if [ "$status" = "SUCCESS" ]; then
        log_success "${message}"
    elif [ "$status" = "ERROR" ]; then
        log_error "${message}"
    else
        log_info "${message}"
    fi
}

# 健康检查
health_check() {
    local container=$1
    local max_attempts=30
    local attempt=0

    log_step "等待 ${container} 健康检查"

    while [ $attempt -lt $max_attempts ]; do
        if docker inspect --format='{{.State.Health.Status}}' "${container}" 2>/dev/null | grep -q "healthy"; then
            log_success "${container} 健康检查通过"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    echo ""
    log_error "${container} 健康检查失败"
    return 1
}

# 回滚函数
rollback() {
    local target=$1
    log_warning "开始回滚..."

    # 恢复配置
    if [ -f "${UPSTREAM_CONF}.backup" ]; then
        cp "${UPSTREAM_CONF}.backup" "${UPSTREAM_CONF}"
        reload_nginx
    fi

    # 停止失败的容器
    docker-compose -f "${COMPOSE_FILE}" stop "frontend-${target}"

    send_notification "ERROR" "${target}" "部署失败，已回滚到之前版本"
}

# ============================================
# 主函数
# ============================================

main() {
    print_header "Together 前端蓝绿部署 - 零停机更新"

    # 获取当前和目标环境
    local active_env=$(get_active_env)
    local target_env=$(get_target_env)

    log_info "当前活跃环境: ${active_env}"
    log_info "目标部署环境: ${target_env}"
    echo ""

    log_info "此脚本将执行以下操作："
    echo "  1. 拉取最新代码（${GIT_BRANCH} 分支）"
    echo "  2. 构建前端项目"
    echo "  3. 在 ${target_env} 环境构建新容器"
    echo "  4. 健康检查新容器"
    echo "  5. 切换流量到 ${target_env} 环境"
    echo "  6. 停止旧的 ${active_env} 环境"
    echo "  7. 发送部署通知"
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

    send_notification "INFO" "${target_env}" "开始部署到 ${target_env} 环境"

    # 步骤 1: 拉取代码
    print_step "步骤 1/7: 拉取最新代码"
    cd "${PROJECT_ROOT}"

    log_step "切换到 ${GIT_BRANCH} 分支"
    git fetch origin
    git checkout "${GIT_BRANCH}"

    # 获取更新信息
    local old_commit=$(git rev-parse HEAD)
    git pull origin "${GIT_BRANCH}"
    local new_commit=$(git rev-parse HEAD)

    if [ "$old_commit" = "$new_commit" ]; then
        log_info "代码无更新"
    else
        log_success "代码已更新: ${old_commit:0:7} -> ${new_commit:0:7}"
        # 显示更新内容
        log_info "更新内容:"
        git log --oneline --no-merges "${old_commit}..${new_commit}" | head -5
    fi
    echo ""

    # 步骤 2: 构建前端
    print_step "步骤 2/7: 构建前端项目"
    log_step "执行 pnpm build:h5:staging"
    pnpm build:h5:staging
    log_success "前端构建完成"
    echo ""

    # 步骤 3: 构建目标环境容器
    print_step "步骤 3/7: 构建 ${target_env} 环境容器"
    cd "${DEPLOY_DIR}"

    log_step "构建 Docker 镜像"
    if [ "$target_env" = "green" ]; then
        docker-compose -f "${COMPOSE_FILE}" --profile green build frontend-green --no-cache
        log_step "启动 ${target_env} 容器"
        docker-compose -f "${COMPOSE_FILE}" --profile green up -d frontend-green
    else
        docker-compose -f "${COMPOSE_FILE}" build frontend-blue --no-cache
        log_step "启动 ${target_env} 容器"
        docker-compose -f "${COMPOSE_FILE}" up -d frontend-blue
    fi
    log_success "${target_env} 容器已启动"
    echo ""

    # 步骤 4: 健康检查
    print_step "步骤 4/7: 健康检查"
    if ! health_check "together-frontend-${target_env}"; then
        rollback "${target_en   exit 1
    fi
    echo ""

    # 步骤 5: 切换流量
    print_step "步骤 5/7: 切换流量到 ${target_env}"
    switch_upstream "${target_env}"
    reload_nginx

    log_info "等待流量切换生效..."
    sleep 3
    log_success "流量已切换到 ${target_env} 环境"
    echo ""

    # 步骤 6: 停止旧环境
    print_step "步骤 6/7: 停止旧的 ${active_env} 环境"
    log_step "停止 ${active_env} 容器"
    docker-compose -f "${COMPOSE_FILE}" stop "frontend-${active_env}"
    log_success "${active_env} 环境已停止"
    echo ""

    # 步骤 7: 发送通知
    print_step "步骤 7/7: 发送部署通知"

    # 获取部署信息
    local deploy_info="部署成功！\n"
    deploy_info+="环境: ${target_env}\n"
    deploy_info+="提交: ${new_commit:0:7}\n"
    deploy_info+="时间: $(date '+%Y-%m-%d %H:%M:%S')"

    send_notification "SUCCESS" "${target_env}" "${deploy_info}"
    echo ""

    # 显示容器状态
    log_step "容器状态"
    docker-compose -f "${COMPOSE_FILE}" ps
    echo ""

    # 部署完成
    print_header "✅ 部署完成！"

    log_info "当前活跃环境: ${target_env}"
    log_info "访问地址："
    echo "  - 前端页面 (HTTPS): https://app.wenlong.life"
    echo "  - 后端 API: ${BACKEND_API_URL}/api/v1"
    en
    log_info "查看日    echo "  docker logs together-frontend-${target_env} -f"
    echo ""

    log_info "如需回滚："
    echo "  ./rollback.sh"
    echo ""

    log_info "部署日志："
    echo "  cat ${DEPLOY_DIR}/deployment.log"
    echo ""
}

# 执行主函数
main "$@"
