# HTTPS 配置说明

## 概述

本部署配置已升级支持 HTTPS，使用 Let's Encrypt 免费 SSL 证书，并保持 HTTP 向下兼容（自动重定向到 HTTPS）。

## 功能特性

- ✅ HTTPS 支持（443 端口）
- ✅ HTTP 自动重定向到 HTTPS
- ✅ Let's Encrypt 自动证书申请和续期
- ✅ TLS 1.2/1.3 支持
- ✅ HSTS 安全头
- ✅ 向下兼容 HTTP（用于证书验证）

## 端口配置

- **80**: HTTP（重定向到 HTTPS，除了 Let's Encrypt 验证路径）
- **443**: HTTPS（主要访问端口）

## 首次部署步骤

### 前提条件

1. **确保域名已解析**
   ```bash
   nslookup app.wenlong.life
   # 应该返回服务器 IP: 23.94.103.190
   ```

2. **停止宿主机 nginx（如果占用了 80/443 端口）**
   ```bash
   sudo systemctl stop nginx
   # 或者配置宿主机 nginx 不监听 80/443 端口
   ```

### 部署步骤

1. **部署前端应用**
   ```bash
   cd ~/together-uniapp-ts/linux-190-deploy
   ./deploy-staging.sh
   ```

2. **初始化 SSL 证书**
   ```bash
   ./init-letsencrypt.sh
   ```

   脚本会自动：
   - 创建临时自签名证书
   - 启动 nginx
   - 申请 Let's Encrypt 真实证书
   - 重新加载 nginx

3. **验证 HTTPS**
   ```bash
   curl -I https://app.wenlong.life
   ```

## 访问地址

- **HTTP**: http://app.wenlong.life → 自动重定向到 HTTPS
- **HTTPS**: https://app.wenlong.life ✅ 推荐使用
- **后端 API**: http://app.wenlong.life:8125/api/v1

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

## 测试模式

如果想先在 Let's Encrypt staging 环境测试（避免触发速率限制），编辑 `init-letsencrypt.sh`：

```bash
STAGING=1  # 设置为 1 启用测试模式
```

测试成功后改回 `STAGING=0` 并重新运行脚本获取正式证书。

## 故障排查

### 证书申请失败

1. **检查域名解析**
   ```bash
   nslookup app.wenlong.life
   ping app.wenlong.life
   ```

2. **检查端口占用**
   ```bash
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   ```
   
   如果宿主机 nginx 占用了端口，需要停止或重新配置：
   ```bash
   sudo systemctl stop nginx
   # 或者修改宿主机 nginx 配置，不监听 80/443
   ```

3. **检查防火墙**
   ```bash
   sudo ufw status
   # 确保 80 和 443 端口开放
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

4. **查看 certbot 日志**
   ```bash
   docker-compose logs certbot
   ```

### Nginx 配置错误

测试配置文件语法：
```bash
docker-compose exec frontend nginx -t
```

### 容器无法启动

查看容器日志：
```bash
docker-compose logs frontend
```

## 文件结构

```
linux-190-deploy/
├── nginx.conf              # Nginx 配置（支持 HTTP/HTTPS）
├── docker-compose.yml      # Docker Compose 配置
├── init-letsencrypt.sh     # SSL 证书初始化脚本
├── deploy-staging.sh       # 部署脚本
└── certbot/                # 证书存储目录（自动创建）
    ├── conf/               # Let's Encrypt 配置和证书
    └── www/                # ACME 验证文件
```

## 安全建议

1. 定期检查证书有效期
2. 保持 Docker 镜像更新
3. 定期备份证书文件（certbot/conf 目录）
4. 监控证书续期日志

## 与宿主机 Nginx 共存

如果服务器上已有 nginx 监听 80/443 端口，有两种方案：

### 方案 1：停止宿主机 nginx（推荐）

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### 方案 2：配置宿主机 nginx 反向代理

修改宿主机 nginx 配置，将请求代理到容器：

```nginx
server {
    listen 80;
    server_name app.wenlong.life;
    
    location / {
        proxy_pass http://127.0.0.1:8080;  # 修改容器端口映射
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

然后修改 `docker-compose.yml` 使用其他端口（如 8080:80）。

## 回退到 HTTP

如需临时回退到纯 HTTP：

1. 修改 `nginx.conf`，注释掉 HTTPS server 块
2. 修改 `docker-compose.y`，移除 443 端口映射
3. 重新部署：`./deploy-staging.sh`

## 相关链接

- [Let's Encrypt 官网](https://letsencrypt.org/)
- [Certbot 文档](https://certbot.eff.org/)
- [Nginx SSL 配置](https://nginx.org/en/docs/http/configuring_https_servers.html)
