# Together 前端 Staging 环境部署文档

## 📋 目录

- [环境说明](#环境说明)
- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [访问地址](#访问地址)
- [常见问题](#常见问题)
- [脚本说明](#脚本说明)

## 🌍 环境说明

**服务器信息：**
- 操作系统：Linux 6.8.0-31-generic
- 部署环境：Staging
- 部署方式：Docker + Nginx
- Git 分支：test9

**端口配置：**
- 前端端口：8107
- 后端 API：http://23.94.103.190:8125

**技术栈：**
- 前端框架：uni-app (Vue 3)
- Web 服务器：Nginx (Alpine)
- 容器化：Docker Compose

## ✅ 前置要求

### 1. 必需软件
- Docker (已安装)
- Docker Compose (已安装)
- Node.js 18+ (已安装)
- pnpm (已安装)
- Git (已安装)

### 2. 检查环境
```bash
# 检查 Docker
docker --version
docker-compose --version

# 检查 Node.js
node --version
pnpm --version

# 检查 Git
git --version
```

## 🚀 快速开始

### 一键部署（推荐）

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./deploy-staging.sh
```

该脚本会自动完成：
1. ✅ 拉取最新代码（test9 分支）
2. ✅ 构建前端项目
3. ✅ 停止旧容器
4. ✅ 构建并启动新容器
5. ✅ 健康检查

**预计耗时：** 3-5 分钟

### 分步执行

如果需要更细粒度的控制，可以分步执行：

```bash
# 1. 拉取代码并构建
cd /home/zwl/together-uniapp-ts
git checkout test9
git pull origin test9
pnpm build:h5:staging

# 2. 停止旧容器
cd linux-190-deploy
./01-stop-and-clean.sh

# 3. 启动新容器
./02-start-services.sh

# 4. 健康检查
./04-health-check.sh
```

## 📝 详细步骤

### 步骤 1：拉取最新代码

```bash
cd /home/zwl/together-uniapp-ts
git fetch origin
git checkout test9
git pull origin test9
```

**执行内容：**
- 切换到 test9 分支
- 拉取最新代码

### 步骤 2：构建前端项目

```bash
pnpm build:h5:staging
```

**执行内容：**
- 使用 staging 环境配置构建
- 生成静态文件到 `dist/build/h5/`
- 配置后端 API 地址：http://23.94.103.190:8125

**构建产物：**
```
dist/build/h5/
├── assets/          # JS、CSS 资源
├── static/          # 静态资源（图片等）
└── index.html       # 入口文件
```

### 步骤 3：停止旧容器

```bash
cd linux-190-deploy
./01-stop-and-clean.sh
```

**执行内容：**
- 停止运行中的容器
- 删除容器
- 可选：清理镜像

### 步骤 4：启动新容器

```bash
./02-start-services.sh
```

**执行内容：**
- 构建 Docker 镜像
- 启动 Nginx 容器
- 等待健康检查通过

**容器配置：**
- 基础镜像：nginx:alpine
- 端口映射：8107:80
- 健康检查：每 30 秒检查一次

### 步骤 5：健康检查

```bash
./04-health-check.sh
```

**检查项目：**
- ✅ 容器运行状态
- ✅ 容器健康状态
- ✅ 端口监听
- ✅ HTTP 访问测试
- ✅ 后端 API 连通性

## 🌐 访问地址

### 前端访问
```
http://23.94.103.190:8107
```

### 后端 API
```
http://23.94.103.190:8125/api/v1
```

### Swagger 文档
```
http://23.94.103.190:8125/api/docs
```

### 测试访问
```bash
# 测试前端页面
curl http://23.94.103.190:8107/

# 测试后端 API
curl http://23.94.103.190:8125/api/v1/public/config
```

## 🔧 常见问题

### Q1: 构建失败 - crypto-js 模块错误

**错误信息：**
```
Rollup failed to resolve import "crypto-js"
```

**解决方案：**
已在 `vite.config.ts` 中配置 external，无需处理。

### Q2: 容器启动失败

**检查日志：**
```bash
docker logs together-frontend-staging --tail 50
```

**常见原因：**
- 端口 8107 被占用
- 构建产物不存在
- Nginx 配置错误

### Q3: 无法访问后端 API

**检查后端服务：**
```bash
curl http://23.94.103.190:8125/api/v1/public/config
```

**检查 Nginx 代理配置：**
```bash
docker exec together-frontend-staging cat /etc/nginx/conf.d/default.conf
```

### Q4: 防火墙配置

**开放前端端口：**
```bash
sudo ufw allow 8107/tcp
sudo ufw reload
```

**检查端口监听：**
```bash
netstat -tlnp | grep 8107
```

### Q5: 页面显示空白

**可能原因：**
1. 路由配置问题
2. API 请求失败
3. 静态资源加载失败

**排查步骤：**
```bash
# 1. 检查容器日志
docker logs together-frontend-staging

# 2. 检查浏览器控制台
# 打开浏览器开发者工具查看错误

# 3. 检查 Nginx 访问日志
docker exec together-frontend-staging tail -f /var/log/nginx/access.log
```

## 📚 脚本说明

### deploy-staging.sh
一键部署脚本，完成所有部署步骤。

**使用场景：**
- 首次部署
- 完整重新部署
- 快速更新代码

**执行流程：**
1. 拉取最新代码
2. 构建前端项目
3. 停止旧容器
4. 启动新容器
5. 健康检查

### 01-stop-and-clean.sh
停止并清理容器。

**使用场景：**
- 清理旧容器
- 重新部署前的准备

### 02-start-services.sh
启动服务容器。

**使用场景：**
- 启动服务
- 重启服务

### 04-health-check.sh
健康检查脚本。

**检查项：**
- 容器状态
- 端口监听
- HTTP 访问
- API 连通性

### config.sh
配置文件，定义环境变量。

**配置项：**
- 项目路径
- 容器名称
- 端口配置
- Git 分支

### utils.sh
工具函数库。

**包含：**
- 颜色输出函数
- 日志函数
- 等待函数

## 🔄 日常运维

### 查看日志
```bash
# 查看实时日志
docker logs together-frontend-staging -f

# 查看最近 100 行日志
docker logs together-frontend-staging --tail 100
```

### 重启服务
```bash
cd /home/zwl/together-uniapp-ts/lloy
docker-compose restart
```

### 停止服务
```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
docker-compose stop
```

### 更新代码
```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./deploy-staging.sh
```

### 进入容器
```bash
docker exec -it together-frontend-staging sh
```

## 🔐 Nginx 配置说明

### 静态资源缓存
- 图片、CSS、JS 等静态资源缓存 7 天
- 启用 gzip 压缩

### API 代理
- `/api/` 代理到后端服务
- 超时时间：60 秒

### WebSocket 代理
- `/ws/` 代理到后端 WebSocket 服务
- 支持长连接

### SPA 路由支持
- 所有路由请求返回 index.html
- 支持前端路由

### 安全头
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

## 📊 性能优化

### 1. 静态资源优化
- 启用 gzip 压缩
- 设置缓存策略
- 使用 CDN（可选）

### 2. 构建优化
- 代码分割
- Tree Shaking
- 压缩混淆

### 3. 网络优化
- HTTP/2（需配置 HTTPS）
- Keep-Alive
- 连接复用

## 🚨 故障排查

### 容器无法启动
```bash
# 1. 检查端口占用
netstat -tlnp | grep 8107

# 2. 检查 Docker 日志
docker logs together-frontend-staging

# 3. 检查构建产物
ls -la /home/zwl/together-uniapp-ts/dist/build/h5/
```

### 页面无法访问
```bash
# 1. 检查容器状态
docker ps | grep together-frontend-staging

# 2. 检查防火墙
sudo ufw status | grep 8107

# 3. 测试本地访问
curl http://localhost:8107/
```

### API 请求失败
```bash
# 1. 检查后端服务
curl http://23.94.103.190:8125/api/v1/public/config

# 2. 检查 Nginx 代理
docker exec together-frontend-staging cat /etc/nginx/conf.d/default.conf

# 3. 查看 Nginx 错误日志
docker exec together-frontend-staging tail -f /var/log/nginx/error.log
```

## 📞 技术支持

如遇到问题，请提供以下信息：
1. 错误日志（docker logs）
2. 容器状态（docker ps）
3. 健康检查结果（./04-health-check.sh）
4. 浏览器控制台错误

---

**最后更新：** 2026-04-09  
**维护者：** 开发团队
