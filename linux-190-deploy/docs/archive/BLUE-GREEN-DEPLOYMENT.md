# 蓝绿部署方案 - 零停机部署

## 方案概述

采用蓝绿部署策略，通过 Nginx 反向代理实现零停机更新：

- **蓝色环境 (Blue)**: 当前运行的生产环境
- **绿色环境 (Green)**: 新版本部署环境
- **Nginx 代理**: 负责流量切换，始终保持运行

## 架构设计

```
用户请求
    ↓
Nginx 反向代理 (端口 80/443)
    ↓
upstream 配置 (动态切换)
    ↓
蓝色环境 ←→ 绿色环境
```

## 部署流程

### 1. 初始化部署

首次使用需要启动 Nginx 代理和蓝色环境：

```bash
cd ~/together-uniapp-ts/linux-190-deploy

# 启动初始环境
docker-compose -f docker-compose.blue-green.yml up -d nginx-proxy frontend-blue certbot
```

### 2. 零停机部署

执行蓝绿部署脚本：

```bash
./deploy-blue-green.sh
```

**部署步骤：**
1. 拉取最新代码
2. 构建前端项目
3. 在空闲环境（绿色）构建新容器
4. 健康检查新容器
5. 切换 Nginx 流量到新环境
6. 停止旧环境（蓝色）
7. 发送部署通知

**优势：**
- ✅ 全程无服务中断
- ✅ 新版本健康检查通过后才切换
- ✅ 自动回滚机制
- ✅ 部署日志记录

### 3. 快速回滚

如果发现问题，可以快速回滚到上一版本：

```bash
./rollback.sh
```

回滚操作会：
1. 启动上一版本环境
2. 切换流量回去
3. 停止当前版本

## 配置说明

### 1. Nginx 上游配置

文件：`upstream.conf`

```nginx
upstream frontend_backend {
    # 当前活跃环境
    server together-frontend-blue:8080 max_fails=3 fail_timeout=30s;
    # 备用环境（注释状态）
    # server together-frontend-green:8080 max_fails=3 fail_timeout=30s;
}
```

部署脚本会自动切换注释状态来实现流量切换。

### 2. Docker Compose 配置

文件：`docker-compose.blue-green.yml`

- **nginx-proxy**: 反向代理，占用 80/443 端口
- **frontend-blue**: 蓝色环境，暴露 8080 端口
- **frontend-green**: 绿色环境，暴露 8080 端口（使用 profile）
- **certbot**: SSL 证书自动续期

### 3. 飞书通知配置

设置环境变量启用飞书通知：

```bash
export FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-url"
```

或在 `config.sh` 中添加：

```bash
export FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-url"
```

## 通知功能

### 支持的通知类型

1. **部署成功通知**
   - 环境信息
   - 提交版本
   - 更新内容

2. **部署失败通知**
   - 错误信息
   - 自动回滚状态

3. **回滚通知**
   - 回滚原因
   - 环境切换信息

4. **健康检查失败通知**
   - 服务状态
   - 异常提醒

### 本地通知

如果系统支持 `notify-send`，会同时发送桌面通知。

### 日志记录

所有部署操作都会记录到：`deployment.log`

```bash
# 查看部署日志
cat deployment.log

# 实时监控
tail -f deployment.log
```

## 常用命令

### 查看容器状态

```bash
docker-compose -f docker-compose.blue-green.yml ps
```

### 查看日志

```bash
# 查看当前活跃环境日志
docker logs together-frontend-blue -f
# 或
docker logs together-frontend-green -f

# 查看 Nginx 日志
docker logs together-nginx-proxy -f
```

### 手动切换环境

```bash
# 编辑 upstream.conf
vim upstream.conf

# 重载 Nginx
docker exec together-nginx-proxy nginx -s reload
```

### 健康检查

```bash
# 检查蓝色环境
docker inspect --format='{{.State.Health.Status}}' together-frontend-blue

# 检查绿色环境
docker inspect --format='{{.State.Health.Status}}' together-frontend-green

# HTTP 健康检查
curl http://localhost/health
```

## 故障处理

### 1. 部署失败自动回滚

脚本会自动检测健康检查失败并回滚：
- 恢复 Nginx 配置
- 停止失败的容器
- 发送失败通知

### 2. 手动介入

如果需要手动处理：

```bash
# 查看容器状态
docker ps -a

# 查看容器日志
docker logs together-frontend-green --tail 100

# 手动停止容器
docker stop together-frontend-green

# 手动启动容器
docker-compose -f docker-compose.blue-green.yml up -d frontend-blue
```

### 3. Nginx 配置测试

```bash
# 测试配置
docker exec together-nginx-proxy nginx -t

# 查看当前配置
docker exec together-nginx-proxy cat /etc/nginx/conf.d/upstream.conf
```

## 与旧方案对比

| 特性 | 旧方案 | 新方案（蓝绿部署） |
|------|--------|-------------------|
| 服务中断 | ✗ 需要停止服务 | ✓ 零停机 |
| 回滚速度 | ✗ 需要重新构建 | ✓ 秒级切换 |
| 健康检查 | ✓ 部署后检查 | ✓ 切换前检查 |
| 自动回滚 | ✗ 手动操作 | ✓ 自动回滚 |
| 部署通知 | ✗ 无 | ✓ 飞书/桌面通知 |
| 部署日志 | ✗ 无 | ✓ 完整记录 |

## 最佳实践

1. **部署前检查**
   - 确保代码已提交
   - 本地测试通过
   - 数据库迁移已完成

2. **部署时机**
   - 选择低峰期部署
   - 提前通知相关人员

3. **部署后验证**
   - 检查关键功能
   - 查看错误日志
   - 监控性能指标

4. **定期清理**
   - 清理旧的 Docker 镜像
   - 归档部署日志

```bash
# 清理未使用的镜像
docker image prune -a

# 归档日志
mv deployment.log deployment.log.$(date +%Y%m%d)
```

## 迁移步骤

从旧部署方案迁移到蓝绿部署：

1. **停止旧服务**
   ```bash
   docker-compose down
   ```

2. **启动新架构**
   ```bash
   docker-compose -f docker-compose.blue-green.yml up -d
   ```

3. **验证服务**
   ```bash
   curl https://app.wenlong.life
   ```

4. **配置飞书通知**（可选）
   ```bash
   export FEISHU_WEBHOOK_URL="your-webhook-url"
   ```

5. **执行首次部署**
   ```bash
   ./deploy-blue-green.sh
   ```

## 注意事项

1. **端口占用**: 确保 80/443 端口未被占用
2. **SSL 证书**: 首次部署需要运行 `./init-letsencrypt.sh`
3. **资源要求**: 部署时会同时运行两个环境，需要足够内存
4. **数据库迁移**: 确保数据库变更向后兼容

## 支持

如有问题，请查看：
- 部署日志: `deployment.log`
- 容器日志: `docker logs <container-name>`
- Nginx 日志: `docker logs together-nginx-proxy`
