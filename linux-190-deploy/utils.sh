#!/bin/bash

# ============================================
# 工具函数库
# ============================================

# 颜色定义
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export NC='\033[0m' # No Color

# ============================================
# 日志函数
# ============================================

# 打印标题
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 打印步骤
print_step() {
    echo -e "${CYAN}▶️  ═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}▶️  $1${NC}"
    echo -e "${CYAN}▶️  ═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# 信息日志
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 成功日志
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 警告日志
log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 错误日志
log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 步骤日志
log_step() {
    echo -e "${CYAN}▶️  $1${NC}"
}

# ============================================
# 等待函数
# ============================================

# 等待容器健康
wait_for_healthy() {
    local container_name=$1
    local timeout=${2:-60}
    local elapsed=0

    log_step "等待容器 ${container_name} 健康检查通过..."

    while [ $elapsed -lt $timeout ]; do
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "${container_name}" 2>/dev/null || echo "none")

        if [ "$health_status" = "healthy" ]; then
            echo ""
            log_success "容器 ${container_name} 健康"
            return 0
        fi

        echo -n "."
        sleep 2
        elapsed=$((elapsed + 2))
    done

    echo ""
    log_error "容器 ${container_name} 健康检查超时"
    return 1
}

# 等待端口可用
wait_for_port() {
    local host=$1
    local port=$2
    local timeout=${3:-60}
    local elapsed=0

    log_step "等待端口 ${host}:${port} 可用..."

    while [ $elapsed -lt $timeout ]; do
        if nc -z "${host}" "${port}" 2>/dev/null; then
            echo ""
            log_success "端口 ${host}:${port} 可用"
            return 0
        fi

        echo -n "."
        sleep 2
        elapsed=$((elapsed + 2))
    done

    echo ""
    log_error "端口 ${host}:${port} 超时"
    return 1
}

# ============================================
# 蓝绿部署函数
# ============================================

# 获取当前活跃环境
get_active_env() {
    if grep -q "together-frontend-blue:8080" "${UPSTREAM_CONF}" && \
       ! grep -q "# server together-frontend-blue:8080" "${UPSTREAM_CONF}"; then
        echo "blue"
    elif grep -q "together-frontend-green:8080" "${UPSTREAM_CONF}" && \
         ! grep -q "# server together-frontend-green:8080" "${UPSTREAM_CONF}"; then
        echo "green"
    else
        echo "blue"
    fi
}

# 获取目标环境（当前活跃环境的对立面）
get_target_env() {
    local active
    active=$(get_active_env)
    if [ "$active" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# 切换 upstream 配置到目标环境
switch_upstream() {
    local target=$1
    local backup="${UPSTREAM_CONF}.backup"

    log_step "备份当前 upstream 配置"
    cp "${UPSTREAM_CONF}" "${backup}"

    log_step "切换 upstream 到 ${target} 环境"

    if [ "$target" = "green" ]; then
        sed -i 's/^\s*server together-frontend-blue:8080/    # server together-frontend-blue:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^\s*# server together-frontend-green:8080/    server together-frontend-green:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^# 活跃环境：blue/# 活跃环境：green/' "${UPSTREAM_CONF}"
    else
        sed -i 's/^\s*server together-frontend-green:8080/    # server together-frontend-green:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^\s*# server together-frontend-blue:8080/    server together-frontend-blue:8080/' "${UPSTREAM_CONF}"
        sed -i 's/^# 活跃环境：green/# 活跃环境：blue/' "${UPSTREAM_CONF}"
    fi

    log_success "upstream 已切换到 ${target}"
}

# 重载 Nginx 配置（nginx-proxy 容器）
reload_nginx() {
    log_step "测试 Nginx 配置"
    local test_output
    test_output=$(docker exec "${NGINX_PROXY_CONTAINER}" nginx -t 2>&1)

    if [ $? -ne 0 ]; then
        log_warning "Nginx 配置测试失败，尝试重启容器"
        log_info "错误信息: ${test_output}"

        log_step "重启 nginx-proxy 容器以加载新配置"
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" restart nginx-proxy

        if [ $? -eq 0 ]; then
            log_success "Nginx 容器已重启"
            sleep 3

            # 验证重启后的状态
            if docker ps | grep -q "${NGINX_PROXY_CONTAINER}.*Up"; then
                log_success "Nginx 容器运行正常"
                return 0
            else
                log_error "Nginx 容器重启后状态异常"
                return 1
            fi
        else
            log_error "Nginx 容器重启失败"
            return 1
        fi
    fi

    log_step "重载 Nginx 配置"
    if docker exec "${NGINX_PROXY_CONTAINER}" nginx -s reload 2>&1; then
        log_success "Nginx 配置已重载"
        return 0
    else
        log_warning "Nginx 重载失败，尝试重启容器"
        ${COMPOSE_CMD} -f "${DEPLOY_COMPOSE_FILE}" restart nginx-proxy

        if [ $? -eq 0 ]; then
            log_success "Nginx 容器已重启"
            sleep 3
            return 0
        else
            log_error "Nginx 容器重启失败"
            return 1
        fi
    fi
}
