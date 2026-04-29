# HTTPS 升级总结

## 已完成的更改

### 1. Nginx 配置升级 (nginx.conf)

**主要变更：**
- ✅ 添加 HTTP 服务器（80端口）- 自动重定向到 HTTPS
- ✅ 添加 HTTPS 服务器（443端口）- 主要服务
- ✅ 配置 Let's Encrypt 验证路径 `/.well-known/acme-challenge/`
- ✅ SSL/TLS 优化配置（TLS 1.2/1.3）
- ✅ 添加 HSTS 安全头
- ✅ 更新 http2 指令语法（新版本兼容）
- ✅ 保持向下兼容（HTTP 重定向）

### 2. Docker Compose 配置 (docker-compose.yml)

**主要变更：**
- ✅ 端口映射：80:80, 443:443（直接使用标准端口）
- ✅ 添加 certbot 服务（自动证书续期）
- ✅ 添加证书存储卷（certbot-conf, certbot-www）
- ✅ 配置证书目录挂载

### 3. 新增文件

**init-letsencrypt.sh**
- SSL 证书初始化脚本
- 自动申请 Let's Encrypt 证书
- 支持 staging 测试模式
- 完整的步骤提示

**test-config.sh**
- 配置测试脚本
- 验证 nginx 语法
- 检查端口占用

**HTTPS-README.md**
- 完整的 HTTPS 配置文档
- 部署步骤说明
- 故障排查指南

### 4. 更新的配置文件

**config.sh**
- FRONTEND_PORT=80（原 8107）
- FRONTEND_HTTPS_PORT=443（原 8108）

**deploy-staging.sh**
- 更新访问地址显示（移除端口号）
- 添加 SSL 证书提示

## 端口配置

| 服务 | 容器端口 | 宿主机端口 | 协议 | 说明 |
|------|---------|-----------|------|------|
| Frontend | 80 | 80 | HTTP | 重定向到 HTTPS |
| Frontend | 443 | 443 | HTTPS | 主要访问端口 |
| Backend | 8125 | 8125 | HTTP | API 服务 |

## 访问地址

- **HTTP**: http://app.wenlong.life → 自动重定向到 HTTPS
- **HTTPS**: https://app.wenlong.life ✅ 推荐使用
- **后端 API**: http://app.wenlong.life:8125/api/v1

## 设计变更说明

### 原设计（已废弃）
- 容器端口：80, 443
- 宿主机端口：8107, 8108
- 需要宿主机 nginx 反向代理

### 新设计（当前）
- 容器端口：80, 443
- 宿主机端口：80, 443
- 容器直接处理 SSL 证书
- 无需宿主机 nginx 配置

**优势：**
1. 配置更简单，无需配置宿主机 nginx
2. 使用标准端口，无需在 URL 中指定端口号
3. 证书管理完全在容器内，更易维护
4. 部署更独立，不依赖宿主机环境

**注意事项：**
- 如果宿主机 nginx 占用了 80/443 端口，需要先停止或重新配置
- 确保防火墙开放 80 和 443 端口

## 下一步操作

### 首次部署 HTTPS

1. **检查端口占用**
   ```bash
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   ```

2. **如果宿主机 nginx 占用端口，停止它**
   ```bash
   sudo systemctl stop nginx
   sudo systemctl disable nginx  # 可选：禁止开机自启
   ```

3. **部署前端应用**
   ```bash
   cd ~/together-uniapp-ts/linux-190-deploy
   ./deploy-staging.sh
   ```

4. **初始化 SSL 证书**
   ```bash
   ./init-letsencrypt.sh
   ```

5. **验证 HTTPS**
   ```bash
   curl -I https://app.wenlong.life
   ```

### 如果已有运行的容器

1. **停止旧容器**
   ```bash
   cd ~/together-uniapp-ts/linux-190-deploy
   docker-compose down
   ```

2. **重新部署**
   ```bash
   ./deploy-staging.sh
   ```

3. **初始化 SSL 证书**
   ```bash
   ./init-letsencrypt.sh
   ```

## 证书管理

### 自动续期
certbot 容器会每 12 小时自动检查并续期证书（证书到期前 30 天）。

### 手动续期
```bash
docker-compose run --rm certbot renew
docker-compose exec frontend nginx -s reload
```

### 查看证书状态
```bash
docker-compose run --rm certbot certificates
```

## 安全特性

- ✅ TLS 1.2/1.3 支持
- ✅ 强加密套件
- ✅ HSTS（强制 HTTPS）
- ✅ 安全响应头（X-Frame-Options, X-Content-Type-Options 等）
- ✅ 自动证书续期
- ✅ HTTP 自动重定向

## 向下兼容

- HTTP 请求会自动重定向到 HTTPS
- Let's Encrypt 验证路径保持 HTTP 访问
- 旧的 HTTP 端口仍然可用

## 文件清单

```
linux-190-deploy/
├── nginx.conf                  # ✅ 已更新 - HTTPS 配置
├── docker-compose.yml          # ✅ 已更新 - 标准端口 + certbot
├── config.sh                   # ✅ 已更新 - 端口配置
├── deploy-staging.sh           # ✅ 已更新 - 显示地址
├── init-letsencrypt.sh         # ✅ 已更新 - SSL 初始化脚本
├── test-config.sh              # ✅ 新增 - 配置测试脚本
├── HTTPS-README.md             # ✅ 已更新 - HTTPS 文档
└── HTTPS-UPGRADE-SUMMARY.md    # ✅ 本文件 - 升级总结
```

## 已删除的文件

- `app.wenlong.life.nginx.conf` - 不再需要宿主机 nginx 配置
- `setup-https.sh` - 不再需要宿主机配置脚本

## 注意事项

1. **端口冲突**
   - 确保宿主机 80/443 端口未被占用
   - 如有冲突，停止宿主机 nginx 或其他服务

2. **防火墙配置**
   - 确保开放 80 和 443 端口
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **证书有效期**
   - Let's Encrypt 证书有效期 90 天
   - 自动续期会在到期前 30 天触发

4. **测试模式**
   - 首次配置建议使用 staging 模式测试
   - 避免触发 Let's Encrypt 速率限制

## 回滚方案

如需回滚到纯 HTTP：

1. 修改 nginx.conf，注释掉 HTTPS server 块
2. 修改 docker-compose.yml，移除 443 端口映射
3. 重新部署

## 技术支持

遇到问题请查看：
- HTTPS-README.md - 详细文档
- docker-compose logs frontend - 前端日志
- docker-compose logs certbot - 证书日志
