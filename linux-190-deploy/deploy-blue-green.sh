#!/bin/bash

# ============================================
# 蓝绿部署脚本 - 零停机部署
# 使用 docker compose V2 + nginx upstream 切换
# ============================================

set -euo pipefail

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

# ============================================
# 版本管理
# ============================================

# 读取当前版本
get_current_version() {
    if [ -f "${VERSION_FILE}" ]; then
        cat "${VERSION_FILE}"
    else
        echo "0.0.0"
    fi
}

# 递增补丁版本号
bump_patch_version() {
    local current=$1
    local major minor patch
    IFS='.' read -r major minor patch <<< "${current}"
    patch=$((patch + 1))
    echo "${major}.${minor}.${patch}"
}

# 更新版本：写入 VERSION 文件 + 更新 package.json
update_version() {
    local old_version
    old_version=$(get_current_version)
    local new_version
    new_version=$(bump_patch_version "${old_version}")

    # 写入 VERSION 文件
    echo "${new_version}" > "${VERSION_FILE}"

    # 更新 package.json version 字段
    if [ -f "${PACKAGE_JSON}" ] && command -v node &> /dev/null; then
        # 安全地转义路径中的单引号
        local escaped_path
        escaped_path=$(printf '%s' "${PACKAGE_JSON}" | sed "s/'/'\\\"'\\\"'/g")
        node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('${escaped_path}','utf8'));p.version='${new_version}';fs.writeFileSync('${escaped_path}',JSON.stringify(p,null,2)+'\n');"
        log_success "package.json version -> ${new_version}" >&2
    fi

    echo "${new_version}"
}

# ============================================
# 健康检查
# ============================================

health_check() {
    local container=$1
    local max_attempts=30
    local attempt=0

    log_step "等待 ${container} 健康检查通过..."

    while [ $attempt -lt $max_attempts ]; do
        local health_status
        health_status=$(docker inspect --format='{{.State.Health.Status}}' "${container}" 2>/dev/null || echo "none")

        if [ "$health_status" = "healthy" ]; then
            log_success "${container} 健康检查通过"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    echo ""
    log_error "${container} 健康检查超时（${max_attempts} 次尝试）"
    return 1
}

# 验证新版本 HTTP 可访问
verify_new_version() {
    local container=$1
    local version=$2
    local max_attempts=10
    local attempt=0

    log_step "验证 ${container} 版本 ${version} 可访问..."

    while [ $attempt -lt $max_attempts ]; do
        local http_code
        http_code=$(docker exec "${container}" wget -q -O /dev/null --spider "http://127.0.0.1:8080/" 2>/dev/null && echo "200" || echo "000")

        if [ "$http_code" = "200" ]; then
            log_success "${container} HTTP 可访问"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 2
    done

    log_error "${container} HTTP 访问验证失败"
    return 1
}

# ============================================
# 部署通知
# ============================================

send_notification() {
    local status=$1
    local env=$2
    local message=$3
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    local log_file="${DEPLOY_DIR}/deployment.log"
    echo "[${timestamp}] [${status}] 环境: ${env} - ${message}" >> "${log_file}"

    if [ "$status" = "SUCCESS" ]; then
        log_success "${message}"
    elif [ "$status" = "ERROR" ]; then
        log_error "${message}"
    else
        log_info "${message}"
    fi
}

# ============================================
# 回滚
# ============================================

rollback() {
    local target=$1
    local active=$2

    log_warning "开始回滚..."

    # 恢复 upstream 配置
    if [ -f "${UPSTREAM_CONF}.backup" ]; then
        cp "${UPSTREAM_CONF}.backup" "${UPSTREAM_CONF}"
        reload_nginx || true
    fi

    # 停止失败的容器
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" stop "frontend-${target}" 2>/dev/null || true
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" rm -f "frontend-${target}" 2>/dev/null || true

    send_notification "ERROR" "${target}" "部署失败，已回滚到 ${active} 环境"
}

# ============================================
# 确保 Docker 外部卷存在
# ============================================

ensure_external_volumes() {
    log_step "检查 Docker 外部卷"
    for vol in ${DOCKER_VOLUMES}; do
        if ! docker volume inspect "${vol}" &>/dev/null; then
            log_info "创建外部卷: ${vol}"
            docker volume create "${vol}"
        else
            log_info "外部卷已存在: ${vol}"
        fi
    done
}

# ============================================
# 主函数
# ============================================

main() {
    print_header "Together 前端蓝绿部署 - 零停机更新"

    # 获取当前和目标环境
    local active_env
    active_env=$(get_active_env)
    local target_env
    target_env=$(get_target_env)

    log_info "当前活跃环境: ${active_env}"
    log_info "目标部署环境: ${target_env}"
    echo ""

    log_info "此脚本将执行以下操作："
    echo "  1. 拉取最新代码（${GIT_BRANCH} 分支）"
    echo "  2. 更新版本号"
    echo "  3. 构建前端项目"
    echo "  4. 在 ${target_env} 环境构建新容器"
    echo "  5. 健康检查新容器"
    echo "  6. 切换流量到 ${target_env} 环境"
    echo "  7. 停止旧的 ${active_env} 环境"
    echo "  8. 发送部署通知"
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
    print_step "步骤 1/8: 拉取最新代码"
    cd "${PROJECT_ROOT}"

    log_step "切换到 ${GIT_BRANCH} 分支"
    git fetch origin
    git checkout "${GIT_BRANCH}"

    # 暂存本地修改（如果有）
    if ! git diff-index --quiet HEAD --; then
        log_info "暂存本地修改"
        git stash push -m "Auto-stash before deployment at $(date '+%Y-%m-%d %H:%M:%S')"
    fi

    local old_commit
    old_commit=$(git rev-parse HEAD)
    git pull origin "${GIT_BRANCH}"
    local new_commit
    new_commit=$(git rev-parse HEAD)

    if [ "$old_commit" = "$new_commit" ]; then
        log_info "代码无更新"
    else
        log_success "代码已更新: ${old_commit:0:7} -> ${new_commit:0:7}"
        log_info "更新内容:"
        git log --oneline --no-merges "${old_commit}..${new_commit}" | head -5
    fi
    echo ""

    # 步骤 2: 更新版本号
    print_step "步骤 2/8: 更新版本号"
    local old_version
    old_version=$(get_current_version)
    local new_version
    new_version=$(update_version)
    log_success "版本号: ${old_version} -> ${new_version}"
    echo ""

    # 步骤 3: 构建前端
    print_step "步骤 3/8: 构建前端项目"
    log_step "执行 pnpm build:h5:staging"
    pnpm build:h5:staging
    log_success "前端构建完成"
    echo ""

    # 步骤 4: 构建目标环境容器
    print_step "步骤 4/8: 构建 ${target_env} 环境容器"
    cd "${DEPLOY_DIR}"

    # 确保外部卷存在
    ensure_external_volumes

    # 确保 nginx-proxy 运行中
    if ! docker ps | grep -q "${NGINX_PROXY_CONTAINER}"; then
        log_step "启动 nginx-proxy 容器"
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" up -d nginx-proxy certbot
        sleep 3
    fi

    log_step "构建 ${target_env} Docker 镜像 (版本: ${new_version})"
    local build_args="--build-arg APP_VERSION=${new_version}"

    if [ "$target_env" = "green" ]; then
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" --profile green build ${build_args} frontend-green --no-cache
    else
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" build ${build_args} frontend-blue --no-cache
    fi
    log_success "${target_env} 镜像构建完成"

    log_step "启动 ${target_env} 容器"
    if [ "$target_env" = "green" ]; then
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" --profile green up -d frontend-green
    else
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" up -d frontend-blue
    fi
    log_success "${target_env} 容器已启动"
    echo ""

    # 步骤 5: 健康检查
    print_step "步骤 5/8: 健康检查"
    local target_container="together-frontend-${target_env}"
    if ! health_check "${target_container}"; then
        log_error "健康检查失败，查看日志："
        docker logs "${target_container}" --tail 30
        rollback "${target_env}" "${active_env}"
        exit 1
    fi

    if ! verify_new_version "${target_container}" "${new_version}"; then
        log_error "版本验证失败"
        rollback "${target_env}" "${active_env}"
        exit 1
    fi
    echo ""

    # 步骤 6: 切换流量
    print_step "步骤 6/8: 切换流量到 ${target_env}"
    switch_upstream "${target_env}"
    reload_nginx

    log_step "重启 nginx-proxy 容器以确保配置生效"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" restart nginx-proxy
    log_success "nginx-proxy 容器已重启"

    log_info "等待流量切换生效..."
    sleep 3
    log_success "流量已切换到 ${target_env} 环境"
    echo ""

    # 步骤 7: 停止旧环境
    print_step "步骤 7/8: 停止旧的 ${active_env} 环境"
    log_step "停止 ${active_env} 容器"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" stop "frontend-${active_env}" 2>/dev/null || true
    log_success "${active_env} 环境已停止"
    echo ""

    # 步骤 8: 发送通知
    print_step "步骤 8/8: 发送部署通知"
    local deploy_info="部署成功！环境: ${target_env}, 版本: ${new_version}, 提交: ${new_commit:0:7}"
    send_notification "SUCCESS" "${target_env}" "${deploy_info}"
    echo ""

    # 显示容器状态
    log_step "容器状态"
    ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" ps
    echo ""

    # 部署完成
    print_header "部署完成！"

    log_info "访问地址："
    echo "  - 前端页面 (HTTP): http://${DOMAIN}"
    echo "  - 版本信息: http://${DOMAIN}/version.txt"
    echo "  - Admin 后台: http://${DOMAIN}:8108"
    echo "  - 后端 API: ${BACKEND_API_URL}/api/v1"
    echo "  - 后端 Swagger: ${BACKEND_API_URL}/api/docs"
    echo ""

    log_info "当前版本: ${new_version}"
    log_info "活跃环境: ${target_env}"
    echo ""

    log_warning "⚠️  重要：需要切换 Nginx 流量"
    echo "  容器已部署到 ${target_env} 环境，但 Nginx 流量尚未切换。"
    echo "  执行以下命令完成流量切换："
    echo ""
    echo "    ./switch-upstream.sh"
    echo ""
    echo "  该脚本将："
    echo "    1. 检查目标容器健康状态"
    echo "    2. 备份当前 Nginx 配置"
    echo "    3. 切换 upstream 到 ${target_env} 环境"
    echo "    4. 重启 Nginx 并验证"
    echo ""

    log_info "查看日志："
    echo "  docker logs together-frontend-${target_env} -f"
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
