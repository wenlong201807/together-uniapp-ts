#!/bin/bash

# ============================================
# Nginx Upstream 交互式切换脚本
# 用于蓝绿部署后切换流量
# ============================================

set -euo pipefail

# 加载配置和工具函数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/config.sh"
source "${SCRIPT_DIR}/utils.sh"

# 配置文件路径
UPSTREAM_CONF="${SCRIPT_DIR}/config/nginx/upstream-http-only.conf"
UPSTREAM_BACKUP="${UPSTREAM_CONF}.backup"
NGINX_CONTAINER="together-nginx-proxy"

# ============================================
# 获取当前活跃环境
# ============================================

get_current_env() {
    if grep -q "server together-frontend-blue:8080" "${UPSTREAM_CONF}" | grep -v "^[[:space:]]*#"; then
        if grep -q "^[[:space:]]*server together-frontend-blue:8080" "${UPSTREAM_CONF}"; then
            echo "blue"
            return
        fi
    fi

    if grep -q "server together-frontend-green:8080" "${UPSTREAM_CONF}" | grep -v "^[[:space:]]*#"; then
        if grep -q "^[[:space:]]*server together-frontend-green:8080" "${UPSTREAM_CONF}"; then
            echo "green"
            return
        fi
    fi

    echo "unknown"
}

# ============================================
# 检查容器健康状态
# ============================================

check_container_health() {
    local container=$1
    local status

    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        log_error "容器 ${container} 未运行"
        return 1
    fi

    status=$(docker inspect --format='{{.State.Health.Status}}' "${container}" 2>/dev/null || echo "none")

    if [ "$status" = "healthy" ]; then
        log_success "容器 ${container} 健康状态: healthy"
        return 0
    elif [ "$status" = "none" ]; then
        log_warning "容器 ${container} 没有健康检查配置"
        return 0
    else
        log_error "容器 ${container} 健康状态: ${status}"
        return 1
    fi
}

# ============================================
# 测试容器响应
# ============================================

test_container_response() {
    local container=$1
    local max_attempts=3
    local attempt=0

    log_step "测试 ${container} HTTP 响应..."

    while [ $attempt -lt $max_attempts ]; do
        if docker exec "${container}" wget -q -O /dev/null --spider "http://127.0.0.1:8080/" 2>/dev/null; then
            log_success "${container} 响应正常"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 1
    done

    log_error "${container} 响应测试失败"
    return 1
}

# ============================================
# 显示容器对比信息
# ============================================

show_container_comparison() {
    local current_env=$1
    local target_env=$2

    echo ""
    log_info "容器对比信息："
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 当前环境
    local current_container="together-frontend-${current_env}"
    local current_status=$(docker ps -a --filter "name=^${current_container}$" --format "{{.Status}}" 2>/dev/null || echo "不存在")
    echo "  当前环境 (${current_env}):"
    echo "    容器: ${current_container}"
    echo "    状态: ${current_status}"

    # 目标环境
    local target_container="together-frontend-${target_env}"
    local target_status=$(docker ps -a --filter "name=^${target_container}$" --format "{{.Status}}" 2>/dev/null || echo "不存在")
    echo ""
    echo "  目标环境 (${target_env}):"
    echo "    容器: ${target_container}"
    echo "    状态: ${target_status}"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# ============================================
# 备份配置文件
# ============================================

backup_config() {
    log_step "备份当前配置..."
    cp "${UPSTREAM_CONF}" "${UPSTREAM_BACKUP}"
    log_success "配置已备份到: ${UPSTREAM_BACKUP}"
}

# ============================================
# 切换 upstream 配置
# ============================================

switch_upstream_config() {
    local target_env=$1

    log_step "修改 upstream 配置..."

    if [ "$target_env" = "blue" ]; then
        # 切换到 blue
        sed -i 's/^# 活跃环境：.*/# 活跃环境：blue（默认）/' "${UPSTREAM_CONF}"
        sed -i 's/^[[:space:]]*server together-frontend-blue:8080/    server together-frontend-blue:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^[[:space:]]*server together-frontend-green:8080/    # server together-frontend-green:8080/' "${UPSTREAM_CONF}"
    else
        # 切换到 green
        sed -i 's/^# 活跃环境：.*/# 活跃环境：green（默认）/' "${UPSTREAM_CONF}"
        sed -i 's/^[[:space:]]*server together-frontend-blue:8080/    # server together-frontend-blue:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^[[:space:]]*server together-frontend-green:8080/    server together-frontend-green:8080/' "${UPSTREAM_CONF}"
    fi

    log_success "配置已更新为: ${target_env}"
}

# ============================================
# 重启 Nginx
# ============================================

restart_nginx() {
    log_step "重启 Nginx 代理..."

    if ! docker restart "${NGINX_CONTAINER}" >/dev/null 2>&1; then
        log_error "Nginx 重启失败"
        return 1
    fi

    # 等待 Nginx 启动
    sleep 3

    # 检查 Nginx 健康状态
    local max_attempts=10
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local status=$(docker inspect --format='{{.State.Health.Status}}' "${NGINX_CONTAINER}" 2>/dev/null || echo "none")

        if [ "$status" = "healthy" ]; then
            log_success "Nginx 重启成功"
            return 0
        fi

        attempt=$((attempt + 1))
        sleep 2
    done

    log_error "Nginx 健康检查超时"
    return 1
}

# ============================================
# 验证切换结果
# ============================================

verify_switch() {
    log_step "验证切换结果..."

    # 测试 HTTP 访问
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/ 2>/dev/null || echo "000")

    if [ "$http_code" = "200" ]; then
        log_success "HTTP 访问测试通过 (状态码: ${http_code})"
        return 0
    else
        log_error "HTTP 访问测试失败 (状态码: ${http_code})"
        return 1
    fi
}

# ============================================
# 回滚配置
# ============================================

rollback_config() {
    log_warning "开始回滚配置..."

    if [ -f "${UPSTREAM_BACKUP}" ]; then
        cp "${UPSTREAM_BACKUP}" "${UPSTREAM_CONF}"
        docker restart "${NGINX_CONTAINER}" >/dev/null 2>&1
        log_success "配置已回滚"
    else
        log_error "备份文件不存在，无法回滚"
    fi
}

# ============================================
# 主函数
# ============================================

main() {
    print_header "Nginx Upstream 交互式切换"

    # 检查配置文件
    if [ ! -f "${UPSTREAM_CONF}" ]; then
        log_error "配置文件不存在: ${UPSTREAM_CONF}"
        exit 1
    fi

    # 获取当前环境
    local current_env
    current_env=$(get_current_env)

    if [ "$current_env" = "unknown" ]; then
        log_error "无法识别当前活跃环境"
        exit 1
    fi

    log_info "当前活跃环境: ${current_env}"
    echo ""

    # 交互式选择目标环境
    log_info "请选择要切换到的环境:"
    echo "  1) blue"
    echo "  2) green"
    echo "  3) 取消"
    echo ""

    read -p "请输入选项 [1-3]: " choice

    local target_env
    case $choice in
        1)
            target_env="blue"
            ;;
        2)
            target_env="green"
            ;;
        3)
            log_info "操作已取消"
            exit 0
            ;;
        *)
            log_error "无效的选项"
            exit 1
            ;;
    esac

    # 检查是否切换到相同环境
    if [ "$target_env" = "$current_env" ]; then
        log_warning "目标环境与当前环境相同，无需切换"
        exit 0
    fi

    # 显示容器对比信息
    show_container_comparison "$current_env" "$target_env"

    # 检查目标容器健康状态
    local target_container="together-frontend-${target_env}"
    if ! check_container_health "$target_container"; then
        log_error "目标容器不健康，无法切换"
        exit 1
    fi

    # 测试目标容器响应
    if ! test_container_response "$target_container"; then
        log_error "目标容器响应测试失败，无法切换"
        exit 1
    fi

    # 显示即将执行的操作
    echo ""
    log_warning "即将执行以下操作:"
    echo "  - 备份当前配置"
    echo "  - 修改 upstream 配置: ${current_env} → ${target_env}"
    echo "  - 重启 Nginx 代理容器"
    echo "  - 验证切换结果"
    echo ""

    read -p "确认执行? [y/N]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi

    echo ""

    # 备份配置
    backup_config

    # 切换配置
    switch_upstream_config "$target_env"

    # 重启 Nginx
    if ! restart_nginx; then
        log_error "Nginx 重启失败，开始回滚..."
        rollback_config
        exit 1
    fi

    # 验证切换
    if ! verify_switch; then
        log_error "切换验证失败，开始回滚..."
        rollback_config
        exit 1
    fi

    # 显示完成信息
    echo ""
    print_header "✅ 切换完成！"

    log_info "当前配置:"
    echo "  - 活跃环境: ${target_env}"
    echo "  - 访问地址: http://app.wenlong.life"
    echo "  - 容器状态: ${target_container} (healthy)"
    echo ""

    log_info "查看日志:"
    echo "  docker logs ${target_container} -f"
    echo ""

    log_info "如需回滚:"
    echoSTREAM_BACKUP} ${UPSTREAM_CONF}"
    echo "  docker restart ${NGINX_CONTAINER}"
    echo ""
}

# 执行主函数
main "$@"
