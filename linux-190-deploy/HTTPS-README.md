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
- **443**: HTTPS
- **8107**: 宿主机 HTTP 端口映射
- **8108**: 宿主机 HTTPS 端口映射

## 首次部署步骤

### 1. 修改邮箱地址

编辑 `init-letsencrypt.sh`，将邮箱地址改为你的：

```bash
EMAIL="your-email@example.com"  # 修改这里
```

### 2. 确保域名已解析

确认 `app.wenlong.life` 已正确解析到服务器 IP：

```bash
nslookup app.wenlong.life
```

### 3. 初始化 SSL 证书

运行初始化脚本：

```bash
cd ~/together-uniapp-ts/linux-190-deploy
./init-letsencrypt.sh
```

脚本会自动：
1. 下载推荐的 TLS 参数
2. 创建临时自签名证书
3. 启动 nginx
4. 申请 Let's Encrypt 真实证书
5. 重新加载 nginx

### 4. 验证 HTTPS

访问以下地址验证：

- HTTP: http://app.wenlong.life:8107 （应自动重定向到 HTTPS）
- HTTPS: https://app.wenlong.life:8108

## 证书续期

证书会自动续期，certbot 容器每 12 小时检查一次证书状态并在需要时自动续期。

手动续期命令：

```bash
docker-compose run --rm certbot renew
docker-compose exec frontend nginx -s reload
```

## 测试模式

如果想先在 Let's Encrypt staging 环境测试（避免触发速率限制），编辑 `init-letsencrypt.sh`：

```bash
STAGING=1  # 设置为 1 启用测试模式
```

测试成功后改回 `STAGING=0` 并重新运行脚本获取正式证书。

## 故障排查

### 证书申请失败

1. 检查域名是否正确解析到服务器
2. 检查防火墙是否开放 80 和 443 端口
3. 查看 certbot 日志：
   ```bash
   docker-compose logs certbot
   ```

### Nginx 配置错误

测试配置文件语法：

```bash
docker-compose exec frontend nginx -t
```

### 查看证书信息

```bash
docker-compose run --rm certbot certificates
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

## 回退到 HTTP

如果需要临时回退到纯 HTTP：

1. 恢复旧的 nginx.conf
2. 修改 docker-compose.yml 移除 443 端口和 certbot 服务
3. 重新部署

## 相关链接

- [Let's Encrypt 官网](https://letsencrypt.org/)
- [Certbot 文档](https://certbot.eff.org/)
- [Nginx SSL 配置](https://nginx.org/en/docs/http/configuring_https_servers.html)
