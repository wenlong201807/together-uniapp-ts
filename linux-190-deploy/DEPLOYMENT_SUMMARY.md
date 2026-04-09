# Together 前端 Staging 环境部署总结

## 📅 部署信息

- **部署时间：** 2026-04-09 04:13
- **部署环境：** Staging
- **部署方式：** Docker + Nginx
- **Git 分支：** test9
- **部署状态：** ✅ 成功

## 🎯 部署目标

1. 拉取最新 test9 分支代码
2. 构建前端 H5 项目
3. 使用 Docker + Nginx 部署
4. 连接后端服务 http://23.94.103.190:8125
5. 确保外网可访问

## ✅ 已完成项

### 1. 代码准备
- ✅ 切换到 test9 分支
- ✅ 拉取最新代码
- ✅ 更新环境配置（.env.staging）

### 2. 环境配置
- ✅ 后端 API 地址：http://23.94.103.190:8125/api/v1
- ✅ WebSocket 地址：ws://23.94.103.190:8125/ws
- ✅ 前端端口：8107

### 3. 项目构建
- ✅ 执行 pnpm build:h5:staging
- ✅ 生成静态文件到 dist/build/h5/
- ✅ 修复 crypto-js 模块问题

### 4. Docker 配置
- ✅ 创建 Dockerfile（基于 nginx:alpine）
- ✅ 创建 docker-compose.yml
- ✅ 配置 nginx.conf（API 代理、WebSocket 代理、SPA 路由）
- ✅ 修复文件权限问题

### 5. 部署脚本
- ✅ deploy-staging.sh - 一键部署脚本
- ✅ 01-stop-and-clean.sh - 停止清理脚本
- ✅ 02-start-services.sh - 启动服务脚本
- ✅ 04-health-check.sh - 健康检查脚本
- ✅ config.sh - 配置文件
- ✅ utils.sh - 工具函数库

### 6. 部署文档
- ✅ README.md - 完整部署文档
- ✅ QUICKSTART.md - 快速开始指南
- ✅ DEPLOYMENT_SUMMARY.md - 部署总结（本文档）

### 7. 服务部署
- ✅ 构建 Docker 镜像
- ✅ 启动 Nginx 容器
- ✅ 容器健康检查通过
- ✅ 本地访问测试通过
- ✅ 外网访问测试通过

## 🌐 访问地址

### 前端页面
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

## 📊 服务状态

| 服务 | 容器名 | 状态 | 端口 | 访问地址 |
|------|--------|------|------|---------|
| 前端 | together-frontend-staging | ✅ Running | 8107 | http://23.94.103.190:8107 |
| 后端 | together-app-staging | ✅ Running | 8125 | http://23.94.103.190:8125 |

## 🔧 技术架构

### 前端技术栈
- **框架：** uni-app (Vue 3)
- **构建工具：** Vite
- **包管理器：** pnpm
- **UI 组件：** uni-ui

### 部署架构
```
外网请求 (8107)
    ↓
Docker 容器 (Nginx)
    ↓
静态文件 (/usr/share/nginx/html)
    ↓
API 代理 → 后端服务 (23.94.103.190:8125)
```

### Nginx 配置特性
- ✅ Gzip 压缩
- ✅ 静态资源缓存（7天）
- ✅ API 反向代理
- ✅ WebSocket 支持
- ✅ SPA 路由支持
- ✅ 安全头配置

## 📝 部署流程

### 自动化部署流程
```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./deploy-staging.sh
```

**执行步骤：**
1. 拉取最新代码（test9 分支）
2. 构建前端项目（pnpm build:h5:staging）
3. 停止旧容器
4. 构建 Docker 镜像
5. 启动新容器
6. 健康检查

**执行时间：** 约 3-5 分钟

### 手动部署流程
```bash
# 1. 拉取代码
cd /home/zwl/together-uniapp-ts
git checkout test9 && git pull origin test9

# 2. 构建项目
pnpm build:h5:staging

# 3. 部署容器
cd linux-190-deploy
./01-stop-and-clean.sh
./02-start-services.sh
./04-health-check.sh
```

## ⚠️ 待执行项

### 防火墙配置（需手动执行）

```bash
# 开放前端端口
sudo ufw allow 8107/tcp
sudo ufw reload

# 验证规则
sudo ufw status | grep 8107
```

## 🔍 验证清单

### 服务验证
- [x] 容器运行正常
- [x] 容器健康检查通过
- [x] 端口监听正常
- [x] 本地访问成功
- [x] 外网访问成功
- [x] 后端 API 连通
- [ ] 防火墙规则已配置

### 功能验证
```bash
# 1. 测试前端页面
curl http://23.94.103.190:8107/

# 2. 测试后端 API
curl http://23.94.103.190:8125/api/v1/public/config

# 3. 查看容器状态
docker ps | grep together-frontend-staging

# 4. 查看容器日志
docker logs together-frontend-staging --tail 50
```

## 🐛 问题修复记录

### 问题 1: crypto-js 模块构建失败
**错误：** Rollup failed to resolve import "crypto-js"

**解决方案：**
在 vite.config.ts 中添加 external 配置：
```typescript
build: {
  rollupOptions: {
    external: ['crypto-js']
  }
}
```

### 问题 2: 文件权限导致 403 错误
**错误：** open() "/usr/share/nginx/html/index.html" failed (13: Permission denied)

**解决方案：**
在 Dockerfile 中添加权限修复：
```dockerfile
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html
```

## 📂 文件结构

```
/home/zwl/together-uniapp-ts/
├── linux-190-deploy/              # 部署目录
│   ├── Dockerfile                 # Docker 镜像配置
│   ├── docker-compose.yml         # Docker Compose 配置
│   ├── nginx.conf                 # Nginx 配置
│   ├── config.sh                  # 环境配置
│   ├── utils.sh                   # 工具函数
│   ├── deploy-staging.sh          # 一键部署脚本
│   ├── 01-stop-and-clean.sh       # 停止清理脚本
│   ├── 02-start-services.sh       # 启动服务脚本
│   ├── 04-health-check.sh         # 健康检查脚本
│   ├── README.md                  # 完整文档
│   ├── QUICKSTART.md              # 快速指南
│   └── DEPLOYMENT_SUMMARY.md      # 部署总结
├── dist/build/h5/                 # 构建产物
├── .env.staging                   # Staging 环境配置
└── vite.config.ts                 # Vite 配置
```

## 🔄 日常运维

### 查看日志
```bash
docker logs together-frontend-staging -f
```

### 重启服务
```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
docker-compose restart
```

### 更新代码
```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./deploy-staging.sh
```

### 健康检查
```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./04-health-check.sh
```

## 🚨 故障排查

### 容器无法启动
```bash
# 检查日志
docker logs together-frontend-staging

# 检查端口占用
netstat -tlnp | grep 8107

# 检查构建产物
ls -la /home/zwl/together-uniapp-ts/dist/build/h5/
```

### 页面无法访问
```bash
# 检查容器状态
docker ps | grep together-frontend-staging

# 检查防火墙
sudo ufw status | grep 8107

# 测试本地访问
curl http://localhost:8107/
```

### API 请求失败
```bash
# 检查后端服务
curl http://23.94.103.190:8125/api/v1/public/config

# 检查 Nginx 配置
docker exec together-frontend-staging cat /etc/nginx/conf.d/default.conf

# 查看 Nginx 错误日志
docker exec together-frontend-staging tail -f /var/log/nginx/error.log
```

## 📞 后续工作

1. **立即执行：** 配置防火墙规则（sudo ufw allow 8107/tcp）
2. **建议配置：** HTTPS 证书（Let's Encrypt）
3. **监控配置：** 日志收集、性能监控
4. **备份策略：** 定期备份构建产物
5. **CI/CD：** 集成自动化部署流程

## 📈 性能优化建议

1. **启用 HTTP/2**（需配置 HTTPS）
2. **配置 CDN** 加速静态资源
3. **优化构建产物** 减小包体积
4. **启用浏览器缓存** 提升加载速度
5. **配置负载均衡**（高并发场景）

---

**部署人员：** 系统管理员  
**文档版本：** v1.0  
**最后更新：** 2026-04-09 04:15  
**部署状态：** ✅ 成功
