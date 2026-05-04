#!/bin/bash
# 清理历史数据脚本
# 清理旧架构的容器、网络、镜像

set -euo pipefail

# ============================================
# 颜色定义
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  [INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}✅ [SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️  [WARN]${NC} $1"; }
log_error() { echo -e "${RED}❌ [ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}▶️  [STEP]${NC} $1"; }

# ============================================
# 配置
# ============================================
OLD_NETWORK="linux-190-deploy_frontend-network"

# ============================================
# 清理旧网络
# ============================================
cleanup_old_network() {
    log_step "清理旧网络: $OLD_NETWORK"

    # 检查网络是否存在
    if ! docker network ls | grep -q "$OLD_NETWORK"; then
        log_info "旧网络不存在，跳过"
        return 0
    fi

    # 检查网络中的容器
    local containers=$(docker network inspect "$OLD_NETWORK" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "")

    if [ -n "$containers" ]; then
        log_warning "旧网络中还有容器: $containers"
        log_info "需要先迁移这些容器到新网络"

        for container in $containers; do
            log_info "断开容器 $container 与旧网络的连接"
            docker network disconnect "$OLD_NETWORK" "$container" 2>/dev/null || true
        done
    fi

    # 删除网络
    if docker network rm "$OLD_NETWORK" 2>/dev/null; then
        log_success "旧网络已删除"
    else
        log_warning "旧网络删除失败，可能已被删除"
    fi

    echo ""
}

# ============================================
# 清理未使用的容器
# ============================================
cleanup_unused_containers() {
    log_step "清理未使用的容器"

    # 清理 Created 状态的容器
    local created_containers=$(docker ps -a --filter "status=created" --format "{{.Names}}" | grep -E "(together|admin)" || echo "")

    if [ -n "$created_containers" ]; then
        log_info "发现 Created 状态的容器:"
        echo "$created_containers"

        for container in $created_containers; do
            log_info "删除容器: $container"
            docker rm "$container" 2>/dev/null || true
        done

        log_success "Created 状态的容器已清理"
    else
        log_info "没有 Created 状态的容器"
    fi

    # 清理 Exited 状态的容器
    local exited_containers=$(docker ps -a --filter "status=exited" --format "{{.Names}}" | grep -E "(together|admin)" || echo "")

    if [ -n "$exited_containers" ]; then
        log_warning "发现 Exited 状态的容器:"
        echo "$exited_containers"

        read -p "是否删除这些容器？ [y/N] " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for container in $exited_containers; do
                log_info "删除容器: $container"
                docker rm "$container" 2>/dev/null || true
            done
            log_success "Exited 状态的容器已清理"
        else
            log_info "跳过清理 Exited 容器"
        fi
    else
        log_info "没有 Exited 状态的容器"
    fi

    echo ""
}

# ============================================
# 清理悬空镜像
# ============================================
cleanup_dangling_images() {
    log_step "清理悬空镜像"

    local dangling_count=$(docker images -f "dangling=true" -q | wc -l)

    if [ "$dangling_count" -gt 0 ]; then
        log_info "发现 $dangling_count 个悬空镜像"
        docker image prune -f
        log_success "悬空镜像已清理"
    else
        log_info "没有悬空镜像"
    fi

    echo ""
}

# ============================================
# 清理旧备份镜像
# ============================================
cleanup_old_backup_images() {
    log_step "清理旧备份镜像（保留最近3个）"

    # 清理 admin-web 备份镜像
    local admin_backups=$(docker images --filter "reference=linux-190-deploy_frontend:backup-*" --format "{{.ID}}" | wc -l)

    if [ "$admin_backups" -gt 3 ]; then
        log_info "发现 $admin_backups 个 admin-web 备份镜像，保留最近3个"

        docker images --filter "reference=linux-190-deploy_frontend:backup-*" \
            --format "{{.ID}} {{.CreatedAt}}" | \
            sort -k2 -r | tail -n +4 | awk '{print $1}' | \
            xargs -r docker rmi -f 2>/dev/null || true

        log_success "旧备份镜像已清理"
    else
        log_info "admin-web 备份镜像数量: $admin_backups（无需清理）"
    fi

    # 清理 together 回滚镜像
    local together_rollbacks=$(docker images --filter "reference=together-app-*:rollback-*" --format "{{.ID}}" | wc -l)

    if [ "$together_rollbacks" -gt 3 ]; then
        log_info "发现 $together_rollbacks 个 together 回滚镜像，保留最近3个"

        docker images --filter "reference=together-app-*:rollback-*" \
            --format "{{.ID}} {{.CedAt}}" | \
            sort -k2 -r | tail -n +4 | awk '{print $1}' | \
            xargs -r docker rmi -f 2>/dev/null || true

        log_success "旧回滚镜像已清理"
    else
        log_info "together 回滚镜像数量: $together_rollbacks（无需清理）"
    fi

    echo ""
}

# ============================================
# 显示清理后的状态
# ============================================
show_cleanup_status() {
    log_step "清理后的状态"

    echo ""
    log_info "当前运行的容器:"
    docker ps --format "table {{.Names}}\t{{.Sta	{{.Ports}}" | grep -E "(together|a)" || echo "  无相关容器"

    echo ""
    log_info "当前网络:"
    docker network ls | grep -E "(app-network|frontend)" || echo "  无相关网络"

    echo ""
    log_info "镜像统计:"
    echo "  - 悬空镜像: $(docker images -f 'dangling=true' -q | wc -l)"
    echo "  - admin-web 备份: $(docker images --filter 'reference=linux-190-deploy_frontend:backup-*' -q | wc -l)"
    echo "  - together 回滚: $(docker images --filter 'reference=together-app-*:rollback-*' -q | wc -l)"

    echo ""
}

# ============================================
# 主函数
# ================================
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  历史数据清理脚本"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_info "此脚本将执行以下操作："
    echo "  1. 清理旧网络 ($OLD_NETWORK)"
    echo "  2. 清理未使用的容器"
    echo "  3. 清理悬空镜像"
    echo "  4. 清理旧备份镜像（保留最近3个）"
    echo ""

    log_warning "⚠️  此操作会删除旧网络和未使用的容器"
    echo ""

    read -p "确定要继续吗？ [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =]; then
        log_info "操作已取消"
        exit 0
    fi

    echo ""

    # 执行清理
    cleanup_old_network
    cleanup_unused_containers
    cleanup_dangling_images
    cleanup_old_backup_images
    show_cleanup_status

    # 完成
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "🎉 历史数据清理完成！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 执行主函数
main "$@"
