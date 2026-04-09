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
