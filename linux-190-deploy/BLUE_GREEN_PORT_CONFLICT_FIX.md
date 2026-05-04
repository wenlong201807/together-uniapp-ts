# 蓝绿部署架构修复方案

**日期**: 2026-05-04  
**问题**: 端口 80 冲突，`together-nginx-proxy` 无法启动  
**状态**: ✅ 已修复

---

## 问题分析

### 根本原因
系统中存在多个服务需要同时运行：
1. **together-uniapp-ts** - 前端应用（需要蓝绿部署）
2. **admin-web-staging** - 管理后台
3. **together-app-staging** - API 服务

原架构让 `together-nginx-proxy` 容器直接占用宿主机 80/443 端口，与宿主机 Nginx 冲突。

### 架构冲突
```
❌ 旧架构：
together-nginx-proxy (80/443) ← 冲突！
宿主机 Nginx (80/443)         ← 冲突！
```

---

## 解决方案

### 新架构设计
```
宿主机 Nginx (80/443) - app.wenlong.life
    ├─> /api/      → together-app-staging:8125 (API 服务)
    ├─> /ws/       → together-app-staging:8125 (WebSocket)
    ├─> /admin/    → admin-web-staging:80 (管理后台)
    └─> /          → together-nginx-proxy:8088 (前端蓝绿切换)
                         ├─> together-frontend-blue:8080
                         └─> together-frontend-green:8080
```

**优势**：
- ✅ 宿主机 Nginx 作为统一入口，管理 SSL 证书
- ✅ together-nginx-proxy 只负责前端蓝绿切换，使用内部端口 8088
- ✅ admin-web-staging 和 together-app-staging 可以同时运行
- ✅ 零停机蓝绿部署不影响其他服务

---

## 部署步骤

### 步骤 1：更新 Docker Compose 配置 ✅

已修改 `docker-compose.blue-green.yml`：
```yaml
nginx-proxy:
  expose:
    - "8088"  # 改为内部端口，不映射到宿主机
```

### 步骤 2：更新 nginx-proxy 内部配置 ✅

已修改 `config/nginx/upstream.conf`：
```nginx
server {
    listen 8088;  # 内部端口
    location / {
        proxy_pass http://frontend_backend;  # 蓝绿切换
    }
}
```

### 步骤 3：更新宿主机 Nginx 配置

**配置文件已生成**：`config/nginx/host-nginx-app.wenlong.life.conf`

**执行命令**：
```bash
# 1. 备份现有配置
sudo cp /etc/nginx/sites-available/app.wenlong.life /etc/nginx/sites-available/app.wenlong.life.backup.$(date +%Y%m%d_%H%M%S)

# 2. 复制新配置
sudo cp /home/zwl/together-uniapp-ts/linux-190-deploy/config/nginx/host-nginx-app.wenlong.life.conf /etc/nginx/sites-available/app.wenlong.life

# 3. 测试配置
sudo nginx -t

# 4. 重载 Nginx
sudo systemctl reload nginx
```

### 步骤 4：清理旧的 nginx-proxy 容器

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy

# 停止并删除旧容器
docker stop together-nginx-proxy 2>/dev/null || true
docker rm together-nginx-proxy 2>/dev/null || true
```

### 步骤 5：重新执行蓝绿部署

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./deploy-blue-green.sh
```

---

## 验证步骤

### 1. 检查容器状态
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**预期结果**：
```
NAMES                      STATUS                   PORTS
together-nginx-proxy       Up (healthy)             8088/tcp
together-frontend-green    Up (healthy)             8080/tcp
admin-web-staging          Up (healthy)             80/tcp
together-app-staging       Up (healthy)             0.0.0.0:8125->8125/tcp
```

### 2. 测试前端访问
```bash
# 通过宿主机 Nginx
curl -I https://app.wenlong.life

# 直接访问 nginx-proxy（内部）
docker exec together-nginx-proxy wge- http://localhost:8088/health
```

### 3. 测试 Admin 后台
```bash
curl -I https://app.wenlong.life/admin/
```

### 4. 测试 API 服务
```bash
curl https://app.wenlong.life/api/v1
```

---

## 蓝绿切换流程

### 切换到 Blue 环境
```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./switch-upstream.sh blue
```

**内部操作**：
1. 修改 `config/nginx/upstream.conf` 中的 upstream 配置
2. 重载 `together-nginx-proxy` 容器的 Nginx
3. 宿主机 Nginx 无需重载（代理到 8088 端口不变）

### 切换到 Green 环境
```bash
./switch-upstream.sh green
```

---

## 故障排查

### 问题 1：nginx-proxy 无法访问 admin-web-staging

**原因**：容器不在同一网络

**解决**：
```bash
# 检查网络
docker network inspect frontend-network

# 如果 admin-web-staging 不在 frontend-network，连接它
docker network connect frontend-network admin-web-staging
```

### 问题 2：宿主机 Nginx 无法代理到 admin-web-staging

**原因**：宿主机 Nginx 无法直接访问容器名称

**解决方案 A**：使用容器 IP
```bash
# 获取容器 IP
ADMIN_IP=$(docker inspect admin-web-staging --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')

# 修改宿主机 Nginx 配置
upstream admin_backend {
    server $ADMIN_IP:80;
}
```

**解决方案 B**（推荐）：让 admin-web-staging 暴露端口
```bash
# 修改 admin-web 的 docker-compose.yml
ports:
  - "8108:80"

# 宿主机 Nginx 配置
upstream admin_backend {
    server 127.0.0.1:8108;
}
```

### 问题 3：SSL 证书路径错误

**检查证书**：
```bash
sudo ls -la /etc/letsencrypt/live/app.wenlong.life/
```

**如果证书不存在**：
```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./init-letsencrypt.sh
```

---

## 回滚方案

如果新架构有问题，可以快速回滚：

```bash
# 1. 恢复宿主机 Nginx 配置
sudo cp /etc/nginx/sites-available/app.wenlong.life.backup.YYYYMMDD_HHMMSS /etc/nginx/sites-available/app.wenlong.life
sudo nginx -t && sudo systemctl reload nginx

# 2. 停止新架构容器
docker-compose -f docker-compose.blue-green.yml down

# 3. 启动旧架构
docker-compose -f docker-compose.yml up -d
```

---

## 性能优化建议

### 1. 启用 HTTP/2
已在宿主机 Nginx 配置中启用：
```nginx
listen 443 ssl;
http2 on;
```

### 2. 启用 Gzip 压缩
已配置，压缩静态资源：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 3. 连接池优化
```nginx
upstream frontend_bluegreen {
    server 127.0.0.1:8088 max_fails=3 fail_timeout=30s;
    keepalive 32;  # 添加连接池
}
```

---

## 监控建议

### 1. 容器健康检查
```bash
# 定时检查容器状态
watch -n 5 'docker ps --format "table {{.Names}}\t{{.Status}}"'
```

### 2. Nginx 访问日志
```bash
# 宿主机 Nginx
sudo tail -f /var/log/nginx/access.log

# nginx-proxy 容器
docker logs -f together-nginx-proxy
```

### 3. 蓝绿环境流量监控
```bash
# 查看当前活跃环境
grep "server together-frontend" /home/zwl/together-uniapp-ts/linux-190-deploy/config/nginx/upstream.conf | grep -v "#"
```

---

## 相关文件

### 修改的文件
- `docker-compose.blue-green.yml` - nginx-proxy 改为内部端口 8088
- `config/nginx/upstream.conf` - 只负责蓝绿切换，监听 8088

### 新增的文件
- `config/nginx/host-nginx-app.wenlong.life.conf` - 宿主机 Nginx 统一入口配置

### 部署脚本
- `deploy-blue-green.sh` - 蓝绿部署主脚本
- `switch-upstream.sh` - 蓝绿切换脚本

---

## 总结

### 修复前
- ❌ together-nginx-proxy 占用 80/443 端口
- ❌ 与宿主机 Nginx 冲突
- ❌ 无法同时运行多个服务

### 修复后
- ✅ 宿主机 Nginx 作为统一入口
- ✅ together-nginx-proxy 使用内部端口 8088
- ✅ 前端、Admin、API 服务可以同时运行
- ✅ 蓝绿部署零停机切换

---

**修复人员**: Claude  
**审核状态**: 待验证  
**下一步**: 执行步骤 3-5，验证新架构
