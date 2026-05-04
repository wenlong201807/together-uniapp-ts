#!/bin/bash
# 架构迁移一键脚本
# 从旧架构迁移到统一架构

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
APP_NETWORK="app-network"
OLD_NETWORK="linux-190-deploy_frontend-network"

TOGETHER_DIR="/home/zwl/together-uniapp-ts"
ADMIN_DIR="/home/zwl/admin-web"

# ============================================
# 检查前置条件
# ============================================
check_prerequisites() {
    log_step "检查前置条件"

    # 检查是否有 root 权限（需要修改宿主机 Nginx）
    if ! sudo -n true 2>/dev/null; then
        log_error "需要 sudo 权限来修改宿主机 Nginx 配置"
        log_info "请运行: sudo -v"
        exit 1
    fi

    # 检查项目目录
    if [ ! -d "$TOGETHER_DIR" ]; then
        log_error "together-uniapp-ts 项目目录不存在: $TOGETHER_DIR"
        exit 1
    fi

    if [ ! -d "$ADMIN_DIR" ]; then
        log_error "admin-web 项目目录不存在: $ADMIN_DIR"
        exit 1
    fi

    log_success "前置条件检查通过"
    echo ""
}

# ============================================
# 备份现有配置
# ============================================
backup_configs() {
    log_step "备份现有配置"

    local timestamp=$(date +%Y%m%d_%H%M%S)

    # 备份宿主机 Nginx 配置
    if [ -f /etc/nginx/sites-available/app.wenlong.life ]; then
        sudo cp /etc/nginx/sites-available/app.wenlong.life \
            /etc/nginx/sites-availableng.life.backup.$timestamp
        log_success "宿主机 Nginx 配置已备份"
    fi

    # 备份 admin-web 配置
    cd "$ADMIN_DIR/linux-190-deploy"
    cp docker-compose.yml docker-compose.yml.backup.$timestamp
    cp nginx.conf nginx.conf.backup.$timestamp
    log_success "admin-web 配置已备份"

    # 备份 together 配置
    cd "$TOGETHER_DIR/linux-190-deploy"
    cp docker-compose.blue-green.yml docker-compose.blue-green.yml.backup.$timestamp
    log_success "together-uniapp-ts 配置已备份"

    echo ""
}

# ============================================
# 创建统一网络
# ====================================
create_unified_network() {
    log_step "创建统一网络: $APP_NETWORK"

    if docker network ls | grep -q "$APP_NETWORK"; then
        log_warning "网络 $APP_NETWORK 已存在"
    else
        docker network create "$APP_NETWORK"
        log_success "网络 $APP_NETWORK 创建成功"
    fi

    echo ""
}

# ============================================
# 更新宿主机 Nginx 配置
# ============================================
update_host_nginx() {
    log_step "更新宿主机 Nginx 配置"

    local config_file="$TOGETHER_DIR/linux-190-deploy/config/nginx/host-nginx-app.wenlong.life.conf"

    if [ ! -f "$config_file" ]; then
        log_error "配置文件不存在: $config_file"
        exit 1
    fi

    # 复制配置
    sudo cp "$config_file" /etc/nginx/sites-available/app.wenlong.life

    # 测试配置
    if sudo nginx -t; then
        log_success "Nginx 配置测试通过"

        # 重载 Nginx
        sudo systemctl reload nginx
        log_success "Nginx 已重载"
    else
        log_error "Nginx 配置测试失败"
        log_info "恢复备份配置..."
        sudo cp /etc/nginx/sites-available/app.wenlong.life.backup.* /etc/nginx/sites-available/app.wenlong.life
        exit 1
    fi

    echo ""
}

# ============================================
# 迁移 admin-web
# ============================================
migrate_admin_web() {
    log_step "迁移 admin-web 到新架构"

    cd "$ADMIN_DIR/linux-190-deploy"

    # 停止旧容器
    log_info "停止 admin-web-staging 容器"
    docker-compose down || true

    # 应用新配置（已在任务 7 中修改）
    log_info "启动 admin-web-staging（新配置）"
    docker-compose up -d --build

    # 等待健康检查
    sleep 5
    if docker ps | grep -q "admin-web-staging.*healthy"; then
        log_success "admin-web-staging 启动成功"
    else
        log_warning "admin-web-staging 健康检查未通过，请检查日志"
    fi

    echo ""
}

# ============================================
# 部署 together-uniapp-ts
# ============================================
deploy_together() {
    log_step "部署 together-uniapp-ts 蓝绿环境"

    cd "$TOGETHER_DIR/linux-190-deploy"

    # 清理旧的 nginx-proxy 容器
    log_info "清理旧容器"
    docker stop together-nginx-proxy 2>/dev/null || true
    docker rm together-nginx-proxy 2>/dev/null || true

    # 执行蓝绿部署
    log_info "执行蓝绿部署脚本"
    ./deploy-blue-green.sh

    echo ""
}

# ============================================
# 清理历史数据
# ============================================
cleanup_old_resources() {
    log_step "清理历史数据"

    # 检查旧网络是否还有容器
    local containers_in_old_network=$(docker network inspect "$OLD_NETWORK" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "")

    if [ -n "$containers_in_old_network" ]; then
        log_warning "旧网络中还有容器: $containers_in_old_network"
        log_info "跳过删除旧网络"
    else
        log_info "删除旧网络: $OLD_NETWORK"
        docker network rm "$OLD_NETWORK" 2>/dev/null || log_warning "旧网络已不存在"
    fi

    # 清理悬空镜像
    log_info "清理悬空镜像"
    docker image prune -f >/dev/null 2>&1 || true

    # 清理旧备份镜像（保留最近3个）
    log_info "清理旧备份镜像"
    docker images --filter "reference=linux-190-deploy_frontend:backup-*" \
        --format "{{.ID}} {{.CreatedAt}}" | \
        sort -k2 -r | tail -n +4 | awk '{print $1}' | \
        xargs -r docker rmi -f 2>/dev/null || true

    log_success "历史数据清理完成"
    echo ""
}

# ============================================
# 验证部署
# ============================================
verify_deployment() {
    log_step "验证部署"

    echo ""
    log_info "容器状态："
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(together|admin)"

    echo ""
    log_info "网络状态："
    docker network inspect "$APP_NETWORK" --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'

    echo ""
    log_info "测试访问："

    # 测试前端
    if curl -s -o /dev/null -w "%{http_code}" https://app.wenlong.life | grep -q "200\|301\|302"; then
        log_success "前端访问正常: https://app.wenlong.life"
    else
        log_warning "前端访问异常: https://app.wenlong.life"
    fi

    # 测试 Admin
    if curl -s -o /dev/null -w "%{http_code}" https://app.wenlong.life/admin/ | grep -q "200\|301\|302"; then
        log_success "Admin 访问正常: https://app.wenlong.life/admin/"
    else
        log_warning "Admin 访问异常: https://app.wenlong.life/admin/"
    fi

    # 测试 API
    if curl -s -o /dev/null -w "%{http_code}" https://app.wenlong.life/api/v1 | grep -q "200\|404"; then
        log_success "API 访问正常: https://app.wenlong.life/api/v1"
    else
        log_warning "API 访问异常: https://app.wenlong.life/api/v1"
    fi

    echo ""
}

# ============================================
# 主函数
# ============================================
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Together 项目架构迁移脚本"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_info "此脚本将执行以下操作："
    echo "  1. 检查前置条件"
    echo "  2. 备份现有配置"
    echo "  3. 创建统一网络 ($APP_NETWORK)"
    echo "  4. 更新宿主机 Nginx 配置"
    echo "  5. 迁移 admin-web 到新架构"
    echo "  6. 部署 together-uniapp-ts 蓝绿环境"
    echo "  7. 清理历史数据"
    echo "  8. 验证部署"
    echo ""

    log_warning "⚠️  此操作会修改宿主机 Nginx 配置并重启容器"
    log_warning "⚠️  请确保已阅读 ARCHITECTURE_CONFLICT_ANALYSIS.md"
    echo ""

    read -p "确定要继续吗？ [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi

    echo ""

    # 执行迁移步骤
    check_prerequisites
    backup_configs
    create_unified_network
    update_host_nginx
    migrate_admin_web
    deploy_together
    cleanup_old_resources
    verify_deployment

    # 完成
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "🎉 架构迁移完成！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    log_info "访问地址："
    echo "  - 前端: https://app.wenlong.life"
    echo "  - Admin: https://app.wenlong.life/admin/"
    echo "  - API: https://app.wenlong.life/api/v1"
    echo ""

    log_info "查看日志："
    echo "  - 前端: docker logs together-nginx-proxy -f"
    echo "  - Admin: docker logs admin-web-staging -f"
    echo "  - API: docker logs together-app-staging -f"
    echo ""

    log_info "回滚方案："
    echo "  详见 ARCHITECTURE_CONFLICT_ANALYSIS.md"
    echo ""
}

# 执行主函数
main "$@"
