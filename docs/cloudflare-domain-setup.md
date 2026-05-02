# Cloudflare 域名托管与 Workers 自定义域名配置指南

## 背景

中国大陆移动网络屏蔽了 `*.workers.dev` 域名，导致 Cloudflare Workers 无法在手机浏览器访问。解决方案是将域名托管到 Cloudflare，并为 Workers 绑定自定义域名。

## 问题现象

- 在电脑浏览器可以访问 `https://image-proxy.zhu1573511441.workers.dev`
- 在手机浏览器访问报错：`ERR_CONNECTION_REFUSED` 或 `Failed to fetch`

## 解决方案

将域名 `wenlong.life` 托管到 Cloudflare，并将 Workers 绑定到 `app.wenlong.life`。

---

## 第一步：在 Cloudflare 添加域名

### 1.1 添加站点

1. 访问 https://dash.cloudflare.com
2. 点击右上角 **"Add a Site"** 或 **"添加站点"**
3. 输入根域名：`wenlong.life`（注意：输入根域名，不是子域名）
4. 选择 **Free** 免费计划
5. 点击 **Continue** 继续

### 1.2 扫描 DNS 记录

Cloudflare 会自动扫描现有的 DNS 记录：
- 检查扫描结果，确保重要的记录都在
- 如果缺少记录，可以手动添加
- 点击 **Continue** 继续

### 1.3 获取 Cloudflare Nameservers

Cloudflare 会分配两个 Nameserver 地址，例如：
```
noran.ns.cloudflare.com
randy.ns.cloudflare.com
```

**记下这两个地址，下一步需要用到。**

---

## 第二步：修改域名 Nameservers

### 2.1 查看当前 Nameservers

在终端运行以下命令，查看当前的 Nameservers：

```bash
nslookup -type=NS wenlong.life 8.8.8.8
```

输出示例：
```
wenlong.life	nameserver = launch1.spaceship.net.
wenlong.life	nameserver = launch2.spaceship.net.
```

### 2.2 登录域名注册商

根据你的域名注册商，选择对应的操作：

#### 如果是 Spaceship

1. 访问 https://www.spaceship.com
2. 登录账户
3. 进入 **Domains** → 找到 `wenlong.life`
4. 点击域名进入管理页面

#### 如果是 Namecheap

1. 访问 https://ap.www.namecheap.com
2. 登录账户
3. 点击 **Domain List**
4. 找到 `wenlong.life`，点击 **Manage**

#### 如果是阿里云（万网）

1. 访问 https://dc.aliyun.com
2. 登录账户
3. 找到域名 `wenlong.life`
4. 点击 **管理** → **DNS 修改**

#### 如果是腾讯云 DNSPod

1. 访问 https://console.dnspod.cn
2. 登录账户
3. 找到域名 `wenlong.life`
4. 点击 **修改 DNS 服务器**

### 2.3 修改 Nameservers

1. 找到 **Nameservers** 设置部分
2. 选择 **Custom DNS** 或 **Custom Nameservers**
3. 删除现有的 Nameservers：
   - ❌ `launch1.spaceship.net`
   - ❌ `launch2.spaceship.net`
4. 添加 Cloudflare 的 Nameservers：
   - ✅ `noran.ns.cloudflare.com`
   - ✅ `randy.ns.cloudflare.com`
5. 点击 **Save** 或 **保存**

### 2.4 关闭 DNSSEC（重要）

如果域名开启了 DNSSEC，必须先关闭：

1. 在域名注册商的设置中找到 **DNSSEC** 选项
2. 如果是开启状态，**关闭它**
3. 保存设置

**为什么要关闭？** Cloudflare 使用自己的 DNSSEC 配置，旧的 DNSSEC 设置会导致 DNS 解析失败。

---

## 第三步：确认并等待生效

### 3.1 在 Cloudflare 确认

1. 回到 Cloudflare Dashboard 的 Nameserver 设置页面
2. 点击底部蓝色按钮：**"I updated my nameservers"**
3. Cloudflare 会开始检查 Nameservers

### 3.2 等待 DNS 生效

- **通常时间：** 10-30 分钟
- **最长时间：** 24 小时
- **通知方式：** Cloudflare 会发邮件通知域名已激活

### 3.3 验证是否生效

创建检查脚本：

```bash
#!/bin/bash
# 文件路径: /Users/zhuwenlong/Desktop/ai-study/two-join/together-uniapp-ts/scripts/check-dns.sh

echo "========================================"
echo "检查 wenlong.life 的 Nameservers"
echo "========================================"
echo ""

echo "当前 Nameservers:"
nslookup -type=NS wenlong.life 8.8.8.8

echo ""
echo "========================================"
echo "预期结果:"
echo "  noran.ns.cloudflare.com"
echo  randy.ns.cloudflare.com"
echo ""
echo "如果看到 Cloudflare 的 Nameservers，说明已生效！"
echo "========================================"
```

运行脚本：

```bash
chmod +x scripts/check-dns.sh
./scripts/check-dns.sh
```

---

## 第四步：为 Workers 绑定自定义域名

### 4.1 确认域名已激活

在 Cloudflare Dashboard 中：
1. 选择 `wenlong.life` 域名
2. 确认状态显示为 **Active**（绿色）

### 4.2 绑定 Workers 到自定义域名

1. 在 Cloudflare Dashboard 左侧菜单选择 **Workers & Pages**
2. 找到并点击你的 Worker：`image-proxy`
3. 点击顶部的 **Settings** 标签
4. 向下滚动找到 **Triggers** 或 **Domains & Routes** 部分
5. 点击 **Add Custom Domain** 按钮
6. 在弹出的输入框中输入：`aplife`
7. 点击 **Add Custom Domain**

### 4.3 等待 SSL 证书配置

Cloudflare 会自动：
- 创建 DNS 记录（A 或 CNAME）
- 配置 SSL/TLS 证书
- 路由流量到 Worker

通常几秒到几分钟完成，看到绿色的 ✓ 标记表示配置成功。

### 4.4 验证自定义域名

在浏览器访问：

```
https://app.wenlong.life
```

应该看到错误信息（因为没有传 url 参数），但不是连接失败。

测试完整的代理 URL：

```
https://app.wenlong.life?url=http://td42nzl7d.hn-bkt.clouddn.com/album/1_1777356682953_z0wMjVdt.556aaff6-d17d-41c4-bc64-993689a75968
```

应该能看到图片。

---

## 第五步：修改前端配置

### 5.1 修改 Cloudflare 配置文件

编辑文件：`src/config/cloudflare.ts`

```typescripdflare Workers 配置

export const CLOUDFLARE_CONFIG = {
  // Worker URL（请替换为你的实际 URL）
  // ⚠️ 重要：中国大陆网络无法访问 *.workers.dev 域名，必须绑定自定义域名
  // 格式：https://你的子域名.你的域名.com
  // 例如：https://img.zhu1573511441.com 或 https://proxy.zhu1573511441.com
  workerUrl: 'https://app.wenlong.life',  // ✅ 使用自定义域名

  // 是否启用代理
  enabled: true,

  // 超时时间（毫秒）
  timeout: 10000,

  // 是否在开发环境启用
  enableInDev: true
}
```

### 5.2 重新构建项目

```bash
# 停止当前运行的项目
# Ctrl + C

# 重新运行
npm run dev:h5
```

---

## 第六步：在手机浏览器测试

### 6.1 访问测试页面

在手机浏览器打开：

```
http://localhost:8080/#/pages/test/image-upload
```

或者你的实际开发服务器地址。

### 6.2 测试图片上传流程

1. 点击 **"📷 从相册选择"** 或 **"📸 拍照上传"**
2. 选择图片
3. 点击 **"上传到七牛云"**
4. 观察日志输出，确认：
   - ✅ 图片上传成功
   - ✅ 返回七牛云 HTTP URL
   - ✅ 自动转换为 HTTPS 代理 URL（`https://app.wenlong.life?url=...`）
   - ✅ 图片预览正常显示

### 6.3 检查 vConsole 日志

在 vConsole 中应该看到：

```
[convertToHttpsUrl] 开始转换，输入 URL: http://td42nzl7d.hn-bkt.clouddn.com/...
[convertToHttpsUrl] 转换成功
[convertToHttpsUrl] 代理 URL: https://app.wenlong.life?url=http://...
[testProxyUrl] ✅ 代理 URL 可访问
```

---

## 常见问题

### Q1: Nameservers 修改后多久生效？

**A:** 通常 10-30 分钟，最长可能需要 24 小时。可以用以下命令检查：

```bash
nslookup -type=NS wenlong.life 8.8.8.8
```

### Q2: 为什么要关闭 DNSSEC？

**A:** Cloudflare 使用自己的 DNSSEC 配置。如果不关闭旧的 DNSSEC 设置，会导致 DNS 解析失败。域名托管到 Cloudflare 后，可以在 Cloudflare Dashboard 重新启用 DNSSEC。

### Q3: 自定义域名绑定失败怎么办？

**A:** 检查以下几点：
1. 域名是否已在 Cloudflare 激活（状态为 Active）
2. 子域名是否已被其他服务占用（检查 DNS 记录）
3. 等待几分钟后重试

### Q4: 手机浏览器仍然无法访问怎么办？

**A:** 检查以下几点：
1. 确认域名 Nameservers 已更新为 Cloudflare 的
2. 确认 Workers 自定义域名已绑定成功
3. 确认前端配置文件已修改并重新构建
4. 清除手机浏览器缓存
5. 尝试使用手机流量（而不是 WiFi）测试

### Q5: 图片仍然显示 HTTP URL 怎么办？

**A:** 检查以下几点：
1. 确认 `src/config/cloudflare.ts` 中 `enabled: true`
2. 确认 `workerUrl` 配置正确
3. 检查 `v-img-proxy` 指令是否正确使用
4. 查看 vConsole 日志，确认 `convertToHttpsUrl` 函数被调用

---

## 相关文件

- **Cloudflare Workers 代码：** `cloudflare-workers-proxy-fixed.js`
- **前端配置文件：** `src/config/cloudflare.ts`
- **图片代理工具：** `src/utils/cloudflare-proxy.ts`
- **v-img-proxy 指令：** `src/directives/img-proxy.ts`
- **测试页面：** `src/pages/test/image-upload.vue`

---

## 检查脚本

### 检查 DNS Nameservers

```bash
#!/bin/bash
# 文件路径: scripts/check-dns.sh

echo "========================================"
echo "检查 wenlong.life 的 Nameservers"
echo "========================================"
echo ""

echo "当前 Nameservers:"
nslookup -type=NS wenlong.life 8.8.8.8

echo ""
echo "========================================"
echo "预期结果:"
echo "  noran.ns.cloudflare.com"
echo "  randy.ns.cloudflare.com"
echo ""
echo "如果看到 Cloudflare 的 Nameservers，说明已生效！"
echo "========================================"
```

### 测试 Workers 代理

```bash
#!/bin/bash
# 文件路径: scripts/test-workers-proxy.sh

WORKER_URL="https://app.wenlong.life"
TEST_IMAGE="http://td42nzl7d.hn-bkt.clouddn.com/album/1_1777356682953_z0wMjVdt.556aaff6-d17d-41c4-bc64-993689a75968"

echo "========================================"
echo "测试 Cloudflare Workers 代理"
echo "========================================"
echo ""

echo "1. 测试 Workers 域名连通性..."
curl -I "$WORKER_URL" 2>&1 | head -5
echo ""

echo "2. 测试图片代理..."
PROXY_URL="${WORKER_URL}?url=${TEST_IMAGE}"
echo "代理 URL: $PROXY_URL"
echo ""

curl -I "$PROXY_URL" 2>&1 | grep -E "HTTP|Content-Type|X-Cache"
echo ""

echo "========================================"
echo "如果看到 HTTP/2 200 和 Content-Type: image/png，说明代理成功！"
echo "========================================"
```

### 使用方法

```bash
# 赋予执行权限
chmod +x scripts/check-dns.sh
chmod +x scripts/test-workers-proxy.sh

# 运行检查
./scripts/check-dns.sh
./scripts/test-workers-proxy.sh
```

---

## 总结

1. ✅ 将域名 `wenlong.life` 托管到 Cloudflare
2. ✅ 修改 Nameservers 为 Cloudflare 的
3. ✅ 为 Workers 绑定自定义域名 `app.wenlong.life`
4. ✅ 修改前端配置使用自定义域名
5. ✅ 在手机浏览器测试图片上传和预览

完成以上步骤后，图片代理功能应该在中国大陆手机网络正常工作。
