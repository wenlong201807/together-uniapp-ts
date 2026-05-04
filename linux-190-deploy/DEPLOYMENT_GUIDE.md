# Together 项目统一架构部署指南

**日期**: 2026-05-04  
**版本**: 2.0  
**状态**: ✅ 已完成

---

## 📋 目录

1. [架构概述](#架构概述)
2. [前置准备](#前置准备)
3. [快速部署](#快速部署)
4. [详细步骤](#详细步骤)
5. [验证部署](#验证部署)
6. [日常运维](#日常运维)
7. [故障排查](#故障排查)
8. [回滚方案](#回滚方案)

---

## 架构概述

### 新架构拓扑

```
宿主机 Nginx (80/443) - app.wenlong.life
    ├─> /api/      → together-app-staging:8125 (API 服务)
    ├─> /ws/       → together-app-staging:8125 (WebSocket)
    ├─> /admin/    → admin-web-staging:8108 (管理后台)
    └─> /          → together-nginx-proxy:8088 (前端蓝绿切换)
                         ├─> together-frontend-blue:8080
                         └─> together-frontend-green:8080

统一网络: app-network
    ├─> together-nginx-proxy
    ├─> together-frontend-blue
    ├─> together-frontend-green
    ├─> admin-web-staging
    └─> together-certbot
```

### 端口分配

| 服务 | 宿主机端口 | 容器内部端口 | 说明 |
|------|-----------|-------------|------|
| 宿主机 Nginx | 80, 443 | - | 统一入口，SSL 终止 |
| together-nginx-proxy | - | 8088 | 前端蓝绿切换（内部） |
| together-frontend-blue | - | 8080 | 前端蓝环境（内部） |
| together-frontend-green | - | 8080 | 前端绿环境（内部） |
| admin-web-staging | 8108 | 80 | 管理后台 |
| together-app-staging | 8125 | 8125 | API 服务 |
| together-mysql-staging | 3307 | 3306 | MySQL |
| together-redis-staging | 6383 | 6379 | Redis |

---

## 前置准备

### 1. 系统要求

- **操作系统**: Ubuntu 20.04+ / Debian 11+
- **Docker**: 20.10+
- **Docker Compose**: 1.29+
- **Nginx**: 1.18+
- **磁盘空间**: 至少 10GB 可用
- **内存**: 至少 4GB

### 2. 检查现有服务

```bash
# 检查容器状态
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 检查网络
docker network ls

# 检查宿主机 Nginx
sudo systemctl status nginx
```

### 3. 备份现有配置

```bash
# 备份宿主机 Nginx 配置
sudo cp /etc/nginx/sites-available/app.wenlong.life \
    /etc/nginx/sites-available/app.wenlong.life.backup.$(date +%Y%m%d_%H%M%S)

# 备份 admin-web 配置
cd /home/zwl/admin-web/linux-190-deploy
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
cp nginx.conf nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# 备份 together 配置
cd /home/zwl/together-uniapp-ts/linux-190-deploy
cp docker-compose.blue-green.yml docker-compose.blue-green.yml.backup.$(date +%Y%m%d_%H%M%S)
```

---

## 快速部署

### 一键迁移脚本

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./migracture.sh
```

**脚本执行内容**：
1. ✅ 检查前置条件
2. ✅ 备份现有配置
3. ✅ 创建统一网络 `app-network`
4. ✅ 更新宿主机 Nginx 配置
5. ✅ 迁移 admin-web 到新架构
6. ✅ 部署 together-uniapp-ts 蓝绿环境
7. ✅ 清理历史数据
8. ✅ 验证部署

---

## 详细步骤

### 步骤 1：创建统一网络

```bash
# 创建外部网络
docker network create app-network

# 验证网络
docker network ls | grep app-network
```

### 步骤 2：更新宿主机 Nginx 配置

```bash
# 复制新配置
sudo cp /home/zwl/together-uniapp-ts/linux-190-deploy/config/nginx/host-nginx-app.wenlong.life.conf \
    /etc/nginx/sites-available/app.wenlong.life

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemcginx
```

**配置说明**：
- `/api/` → 代理到 `127.0.0.1:8125` (together-app-staging)
- `/ws/` → 代理到 `127.0.0.1:8125` (WebSocket)
- `/admin/` → 代理到 `127.0.0.1:8108` (admin-web-staging)
- `/` → 代理到 `127.0.0.1:8088` (together-nginx-proxy 蓝绿切换)

### 步骤 3：部署 admin-web

```bash
cd /home/zwl/admin-web/linux-190-deploy

# 停止旧容器
docker-compose down

# 启动新容器（新配置已应用）
docker-compose up -d --build

# 检查状态
docker ps | grep admin-web-staging
docker logs admin-web-staging --tail 50
```

**配置变更**：
- ✅ 端口映射：`8108:80`
- ✅ 网络：`app-network`（外部网络）
- ✅ Nginx 配置：移除 API/WebSocket 代理，只保留静态文件服务

### 步骤 4：部署 together-uniapp-ts

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy

# 清理旧容器
docker stop together-nginx-proxy 2>/dev/null || true
docker rm together-nginx-proxy 2>/dev/null || true

# 执行蓝绿部署
./deploy-blue-green.sh
```

**配置变更**：
- ✅ nginx-proxy：`expose: 8088`（内部端口）
- ✅ 网络：`app-network`（外部网络）
- ✅ 所有服务使用统一网络

### 步骤 5：清理历史数据

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy

# 执行清理脚本
./cleanup-history.sh
```

**清理内容**：
- ✅ 旧网络：`linux-190-deploy_frontend-network`
- ✅ 未使用的容器（Created/Exited 状态）
- ✅ 悬空镜像
- ✅ 旧备份镜像（保留最近3个）

---

## 验证部署

### 1. 检查容器状态

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(together|admin)"
```

**预期输出**：
```
together-nginx-proxy       Up (healthy)             8088/tcp
together-frontend-green    Up (healthy)             8080/tcp
admin-web-staging          Up (healthy)             0.0.0.0:8108->80/tcp
together-app-staging       Up (healthy)             0.0.0.0:8125->8125/tcp
together-mysql-staging     Up (healthy)         0.0.0:3307->3306/tcp
together-redis-staging     Up (healthy)             0.0.0.0:6383->6379/tcp
together-certbot-staging   Up                       80/tcp, 443/tcp
```

### 2. 检查网络连接

```bash
docker network inspect app-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}'
```

**预期输出**：
```
together-nginx-proxy: 172.18.0.2/16
together-frontend-green: 172.18.0.3/16
admin-web-staging: 172.18.0.4/16
together-certbot-staging: 172.18.0.5/16
```

### 3. 测试访问

```bash
# 测试前端
curl -I https://app.wenlong.life
# 预期: HTTP/2 200 或 301/302

# 测试 Admin  https://app.wenlong.life/admin/
# 预期: HTTP/2 200

# 测试 API
curl https://app.wenlong.life/api/v1
# 预期: JSON 响应

# 测试 nginx-proxy 内部端口
docker exec together-nginx-proxy wget -q -O- http://localhost:8088/health
# 预期: healthy
```

### 4. 检查日志

```bash
# 宿主机 Nginx 日志
sudo tail -f /var/log/nginx/access.log

# nginx-proxy 日志
docker logs together-nginx-proxy -f

# admin-web 日志
docker logs admin-web-staging -f

# API 日志
docker logs together-app-staging -f
```

---

## 日常运维

### 前端蓝绿部署

#### 部署新版本

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./deploy-blue-green.sh
```

**流程**：
1. 拉取最新代码（test9 分支）
2. 更新版本号
3. 目标环境（blue/green）构建新容器
5. 健康检查新容器
6. 切换流量到新环境
7. 停止旧环境
8. 发送部署通知

#### 手动切换环境

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy

# 切换到 blue 环境
./switch-upstream.sh blue

# 切换到 green 环境
./switch-upstream.sh green
```

### Admin 后台部署

```bash
cd /home/zwl/admin-web/linux-190-deploy
./deploy-staging.sh
```

**流程**：
1. 拉取最新代码（main 分支）
2. 构建前端项目
3. 停止旧容器
4. 构建并启动新容器
5. 健康检查

### 查看服务状态

```bash
# 查看所有容器
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 查看特定服务日志
docker logs <container_name> -f --tail 100

# 查看资源使用
docker stats --no-stream
```

### 重启服务

```bash
# 重启 nginx-proxy（蓝绿切换入口）
docker restart together-nginx-proxy

# 重启 admin-web
cd /home/zwl/admin-web/linux-190-deploy
docker-compose restart

# 重启 API 服务
docker restart together-app-staging

# 重载宿主机 Nginx
sudo systemctl reload nginx
```

---

## 故障排查

### 问题 1：前端无法访问

**症状**：访问 `https://app.wenlong.life` 返回 502/503

**排查步骤**：

```bash
# 1. 检查 nginx-proxy 容器状态
docker ps | grep together-nginx-proxy
docker logs together-nginx-proxy --tail 50

# 2. 检查前端容器状态
docker ps | grep together-frontend
docker logs together-frontend-green --tail 50

# 3. 测试 nginx-proxy 内部端口
docker exec together-nginx-proxy wget -q -O- http://localhost:8088/health

# 4. 检查宿主机 Nginx 配置
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

**解决方案**：
- 如果 nginx-proxy 未运行：`docker-compose -f docker-compose.blue-green.yml up -d nginx-proxy`
- 如果前端容器未运行：`./deploy-blue-green.sh`
- 如果宿主机 Nginx 配置错误：恢复备份配置

### 问题 2：Admin 后台无法访问

**症状**：访问 `https://app.wenlong.life/admin/` 返回 502/503

**排查步骤**：

```bash
# 1. 检查 admin-web 容器状态
docker ps | grep admin-web-staging
docker logs admin-web-staging --tail 50

# 2. 测试容器内部端口
docker exec admin-web-staging wget -q -O- http://localhost/

# 3. 测试宿主机端口映射
curl -I http://localhost:8108

# 4. 检查宿主机 Nginx 代理配置
sudo nginx -t
```

**解决方案**：
- 如果容器未运行：`cd /home/zwl/admin-web/linux-190-deploy && docker-compose up -d`
- 如果端口未映射：检查 `docker-compose.yml` 中的 `ports: - "8108:80"`
- 如果 Nginx 代理错误：检查 `upstream admin_backend { server 127.0.0.1:8108; }`

### 问题 3：API 无法访问

**症状**：访问 `https://app.wenlong.life/api/v1` 返回 502/503

**排查步骤**：

```bash
# 1. 检查 API 容器状态
docker ps | grep together-app-staging
docker logs together-app-staging --tail 50

# 2. 测试 API 端口
curl -I http://localhost:8125/api/v1

# 3. 检查数据库连接
docker exec together-app-staging node -e "console.log('DB test')"
```

**解决方案**：
- 如果容器未运行：`docker restart together-app-staging`
- 如果数据库连接失败：检查 MySQL/Redis 容器状态
- 如果端口未映射：检查 `docker-compose.staging.yml`

### 问题 4：SSL 证书错误

**症状**：HTTPS 访问提示证书无效

**排查步骤**：

```bash
# 1. 检查证书文件
sudo ls -la /etc/letsencrypt/live/app.wenlong.life/

# 2. 检查证书有效期
sudo openssl x509 -in /etc/letsencrypt/live/app.wenlong.life/fullchain.pem -noout -dates

# 3. 检查 certbot 容器
docker ps | grep certbot
docker logs together-certbot-staging --tail 50
```

**解决方案**：
- 如果证书过期：`docker exec together-certbot-staging certbot renew`
- 如果证书不存在：`cd /home/zwl/together-uniapp-ts/linux-190-deploy && ./init-letsencrypt.sh`

### 问题 5：网络连接问题

**症状**：容器之间无法通信

**排查步骤**：

```bash
# 1. 检查网络
docker network ls | grep app-network
docker network inspect app-network

# 2. 检查容器网络连接
docker inspect <container_name> --format '{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}'

# 3. 测试容器间连通性
docker exec together-nginx-proxy ping -c 3 together-frontend-green
```

**解决方案**：
- 如果网络不存在：`docker network create app-network`
- 如果容器未连接到网络：`docker network connect app-network <container_name>`

---

## 回滚方案

### 回滚宿主机 Nginx 配置

```bash
# 1. 查看备份文件
ls -la /etc/nginx/sites-available/app.wenlong.life.backup.*

# 2. 恢复备份
sudo cp /etc/nginx/sites-available/app.wenlong.life.backup.YYYYMMDD_HHMMSS \
    /etc/nginx/sites-available/app.wenlong.life

# 3. 测试并重载
sudo nginx -t && sudo systemctl reload nginx
```

### 回滚 admin-web

```bash
cd /home/zwl/admin-web/linux-190-deploy

# 1. 恢复配置
cp docker-compose.yml.backup.YYYYMMDD_HHMMSS docker-compose.yml
cp nginx.conf.backup.YYYYMMDD_HHMMSS nginx.conf

# 2. 重新部署
docker-compose down
docker-compose up -d --build
```

### 回滚 together-uniapp-ts

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy

# 1. 恢复配置
cp docker-compose.blue-green.yml.backup.YYYYMMDD_HHMMSS docker-compose.blue-green.yml

# 2. 重新部署
docker-compose -f docker-compose.blue-green.yml down
docker-compose -f docker-compose.blue-green.yml up -d --build
```

### 完全回滚到旧架构

```bash
# 1. 停止所有新架构容器
docker stop together-nginx-proxy together-frontend-blue together-frontend-green admin-web-staging

# 2. 删除统一网络
docker network rm app-network

# 3. 重建旧网络
docker network create linux-190-deploy_frontend-network

# 4. 恢复所有配置文件（见上述步骤）

# 5. 重新部署
cd /home/zwl/admin-web/linux-190-deploy && docker-compose up -d
cd /home/zwl/together-uniapp-ts/linux-190-deploy && docker-compose up -d
```

---

## 附录

### 相关文档

- **架构冲突分析**: `ARCHITECTURE_CONFLICT_ANALYSIS.md`
- **蓝绿部署原理**: `BLUE_GREEN_FIRST_PRINCIPLES.md`
- **端口冲突修复**: `BLUE_GREEN_PORT_CONFLICT_FIX.md`

### 相关脚本

- **架构迁移**: `migrate-architecture.sh`
- **历史数据清理**: `cleanup-history.sh`
- **蓝绿部署**: `deploy-blue-green.sh`
- **蓝绿切换**: `switch-upstream.sh`
- **Admin 部署**: `/home/zwl/admin-web/linux-190-deploy/deploy-staging.sh`

### 联系方式

如有问题，请查阅相关文档或检查日志。

---

**文档版本**: 2.0  
**最后更新**: 2026-05-04  
**维护人员**: Claude
