# 快速开始指南

## 🚀 一键部署（推荐）

```bash
cd /home/zwl/together-uniapp-ts/linux-190-deploy
./deploy-staging.sh
```

**执行时间：** 约 3-5 分钟

**自动完成：**
- ✅ 拉取最新代码（test9 分支）
- ✅ 构建前端项目
- ✅ 停止旧容器
- ✅ 构建并启动新容器
- ✅ 健康检查

## 📋 分步执行

如果需要更细粒度的控制：

```bash
# 1. 拉取代码并构建
cd /home/zwl/together-uniapp-ts
git checkout test9 && git pull origin test9
pnpm build:h5:staging

# 2. 停止旧容器
cd linux-190-deploy
./01-stop-and-clean.sh

# 3. 启动新容器
./02-start-services.sh

# 4. 健康检查
./04-health-check.sh
```

## 🌐 访问地址

部署完成后：

**前端页面：**
```
http://23.94.103.190:8107
```

**后端 API：**
```
http://23.94.103.190:8125/api/v1
```

**Swagger 文档：**
```
http://23.94.103.190:8125/api/docs
```

## 🔥 防火墙配置

如需远程访问，开放端口：

```bash
sudo ufw allow 8107/tcp
sudo ufw reload
```

## 📝 常用命令

```bash
# 查看日志
docker logs together-frontend-staging -f

# 重启服务
cd /home/zwl/together-uniapp-ts/linux-190-deploy
docker-compose restart

# 停止服务
docker-compose stop

# 健康检查
./04-health-check.sh
```

## ❓ 遇到问题？

查看完整文档：
```bash
cat README.md
```

或查看日志：
```bash
docker logs together-frontend-staging --tail 100
```

## 🔗 相关服务

- **后端服务：** /home/zwl/server-nest
- **后端部署文档：** /home/zwl/server-nest/linux-190-deploy/README.md
