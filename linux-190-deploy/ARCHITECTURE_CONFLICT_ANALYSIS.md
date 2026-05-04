# 架构冲突分析报告

**日期**: 2026-05-04  
**分析范围**: together-uniapp-ts + admin-web 双项目架构

---

## 🔍 当前架构分析

### **容器清单**

| 容器名称 | 镜像 | 状态 | 端口映射 | 网络 |
|---------|------|------|---------|------|
| together-app-staging | server-nest_app | Up (healthy) | 0.0.0.0:8125->8125/tcp | - |
| together-mysql-staging | mysql:8.0 | Up (healthy) | 0.0.0.0:3307->3306/tcp | - |
| together-redis-staging | redis:7-alpine | Up (healthy) | 0.0.0.0:6383->6379/tcp | - |
| together-nginx-proxy | nginx:alpine | Created (未运行) | - | - |
| together-certbot-staging | certbot/certbot | Up | 80/tcp, 443/tcp | linux-190-deploy_frontend-network |
| admin-web-staging | linux-190-deploy_frontend | Up (healthy) | 80/tcp, 443/tcp (未映射) | linux-190-deploy_frontend-network (172.20.0.2) |

### **网络拓扑**

```
linux-190-deploy_frontend-network (172.20.0.0/16)
    ├─> admin-web-staging (172.20.0.2)
    └─> together-certbot-staging (172.20.0.3)

宿主机 Nginx (80/443)
    └─> 当前未配置代理
```

---

## ❌ 核心冲突问题

### **问题 1：网络隔离**
- `admin-web-staging` 在 `linux-190-deploy_frontend-network`
- `together-nginx-proxy` 尝试创建新的 `frontend-network`
- **冲突**：两个项目使用不同的网络名称，无法互相访问

### **问题 2：端口占用**
- `together-nginx-proxy` 尝试绑定 80/443 端口
- 宿主机 Nginx 已占用 80/443 端口
- **冲突**：端口冲突导致 `together-nginx-proxy` 无法启动

### **问题 3：配置不一致**

#### admin-web 配置问题：
```nginx
# admin-web/linux-190-deploy/nginx.conf
location /api/ {
    proxy_pass http://23.94.103.190:8125/api/;  # ❌ 硬编码 IP
}
```
- ❌ 硬编码服务器 IP，不灵活
- ❌ 容器内部直接代理 API，应该由宿主机 Nginx 统一处理
- ❌ 没有使用 Docker 网络，无法利用容器名解析

#### together-uniapp-ts 配置问题：
```yaml
# docker-compose.blue-green.yml
nginx-proxy:
  ports:
    - "80:80"    # ❌ 与宿主机冲突
    - "443:443"  # ❌ 与宿主机冲突
```

### **问题 4：certbot 容器归属混乱**
- `together-certbot-staging` 在 `linux-190-deploy_frontend-network`
- 但名称带 `together` 前缀，归属不明确
- 两个项目都需要 SSL 证书，但只有一个 certbot 容器

---

## ✅ 统一架构设计

### **新架构拓扑**

```
宿主机 Nginx (80/443) - app.wenlong.life
    ├─> /api/      → together-app-staging:8125 (API 服务)
    ├─> /ws/       → together-app-staging:8125 (WebSocket)
    ├─> /admin/    → admin-web-staging:8108 (管理后台)
    └─> /          → together-nginx-proxy:8088 (前端蓝绿切换)
                         ├─> together-frontend-blue:8080
                         └─> together-frontend-green:8080

统一网络: app-network (新建)
    ├─> together-nginx-proxy
    ├─> together-frontend-blue
    ├─> together-frontend-green
    ├─> admin-web-staging
    └─> together-certbot
```

### **端口分配**

| 服务 | 宿主机端口 | 容器内部端口 | 说明 |
|------|-------|-------------|------|
| 宿主机 Nginx | 80, 443 | - | 统一入口 |
| together-nginx-proxy | - | 8088 | 蓝绿切换（内部） |
| together-frontend-blue | - | 8080 | 前端蓝环境（内部） |
| together-frontend-green | - | 8080 | 前端绿环境（内部） |
| admin-web-staging | 8108 | 80 | 管理后台 |
| together-app-staging | 8125 | 8125 | API 服务 |
| together-mysql-staging | 3307 | 3306 | MySQL |
| together-redis-staging | 6383 | 6379 | Redis |

---

## 🔧 需要修改的配置

### **1. admin-web 配置修改**

#### docker-compose.yml
```yaml
services:
  frontend:
    container_name: admin-web-staging
    ports:
      - "8108:80"  # ✅ 暴露端口给宿主机
    networks:
      - app-network  # ✅ 使用统一网络

networks:
  app-network:
    external: true  # ✅ 使用外部网络
```

#### nginx.conf
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    
    # ❌ 删除 API 代理配置（由宿主机 Nginx 处理）
    # location /api/ { ... }
    # location /ws/ { ... }
    
    # ✅ 只保留静态文件服务
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### **2. together-uniapp-ts 配置修改**

#### docker-compose.blue-green.yml
```yaml
services:
  nginx-proxy:
    expose:
      - "8088"  # ✅ 内部端口
    networks:
      - app-network  # ✅ 使用统一网络
  
  frontend-blue:
    networks:
      - app-network
  
  frontend-green:
    networks:
      - app-network
  
  certbot:
    networks:
      - app-network

networks:
  app-network:
    external: true
```

### **3. 宿主机 Nginx 配置**

```nginx
upstream frontend_bluegreen {
    server 127.0.0.1:8088;
}

upstream admin_backend {
    server 127.0.0.1:8108;
}

upstream api_backend {
    server 127.0.0.1:8125;
}

server {
    listen 443 ssl;
    server_name app.wenlong.life;
    
    location /api/ {
        proxy_pass http://api_backend/api/;
    }
    
    location /ws/ {
        proxy_pass http:/_backend/ws/;
    }
    
    location /admin/ {
        proxy_pass http://admin_backend/;
    }
    
    location / {
        proxy_pass http://frontend_bluegreen;
    }
}
```

---

## 🗑️ 需要清理的历史数据

### **1. 旧网络**
```bash
# 停止使用旧网络的容器
docker stop admin-web-staging together-certbot-staging

# 删除旧网络
docker network rm linux-190-deploy_frontend-network
```

### **2. 旧容器**
```bash
# 删除未运行的 nginx-proxy
docker rm together-nginx-proxy
```

### **3. 旧镜像**
```bash
# 清理悬空镜像
docker image prune -f

# 清理旧备份镜像（保留最近3个）
docs --filter "reference=linux-190-deploy_frontend:backup-*" \
    --format "{{.ID}} {{.CreatedAt}}" | \
    sort -k2 -r | tail -n +4 | awk '{print $1}' | \
    xargs -r docker rmi -f
```

---

## 📋 迁移步骤

### **阶段 1：准备工作**
1. ✅ 创建统一网络 `app-network`
2. ✅ 备份现有配置
3. ✅ 更新宿主机 Nginx 配置

### **阶段 2：迁移 admin-web**
1. 停止 `admin-web-staging` 容器
2. 修改 `docker-compose.yml` 和 `nginx.conf`
3. 重新启动，连接到 `app-network`
4. 验证访问：`https://app.wenlong.life/admin/`

### **阶段 3：部署 together-uniapp-ts**
1. 修改 `docker-compose.blue-green.yml`
2. 执行蓝绿部署脚本
3. 验证访问：`https://app.wenlong.life/`

### **阶段 4：清理历史数据**
1. 删除旧网络 `linux-190-deploy_frontend-network`
2. 清理旧镜像和容器
3. 验证所有服务正常

---

## ⚠️ 风险评估

### **高风险操作**
- ❌ 修改宿主机 Nginx 配置（可能影响现有服务）
- ❌ 删除旧网络（需要先停止容器）

### **中风险操作**
- ⚠️ 修改 admin-web 配置（可能导致管理后台暂时不可用）
- ⚠️ 重启容器（短暂服务中断）

### **低风险操作**
- ✅ 创建新网络
- ✅ 清理旧镜像

### **回滚方案**
```bash
# 恢复宿主机 Nginx 配置
sudo cp /etc/nginx/sites-available/app.wenlong.life.backup.YYYYMMDD /etc/nginx/sites-available/app.wenlong.life
sudo systemctl reload nginx

# 恢复 admin-web 容器
cd /home/zwl/admin-web/linux-190-deploy
git checkout docker-compose.yml nginx.conf
docker-compose up -d
```

---

## 📊 预期收益

### **架构优势**
- ✅ 统一入口，便于管理
- ✅ 网络隔离，提高安全性
- ✅ 端口规划清晰，避免冲突
- ✅ 蓝绿部署不影响其他服务

### **运维优势**
- ✅ 配置集中化（宿主机 Nginx）
- ✅ SSL 证书统一管理
- ✅ 日志统一收集
- ✅ 监控统一配置

---

**分析人员**: Claude  
**下一步**: 执行任务 6-10，实施架构调整
