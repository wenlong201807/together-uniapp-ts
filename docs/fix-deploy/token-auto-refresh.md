# Token 自动刷新机制修复

## 问题描述

用户反馈"登录过期"问题，虽然配置了 refresh token，但没有生效，导致：
1. **访问令牌 15 分钟后过期**，用户被强制退出登录
2. **刷新令牌未被使用**，前端没有实现自动刷新逻辑
3. **用户体验差**，需要频繁重新登录

## 问题分析

### 后端配置（正确）

**文件**：`.env.staging`

```env
JWT_ACCESS_EXPIRES_IN=15m      # 访问令牌 15 分钟过期
JWT_REFRESH_EXPIRES_IN=7d      # 刷新令牌 7 天过期
```

后端配置是正确的，采用了双 token 机制：
- **Access Token**：短期有效（15分钟），用于日常 API 请求
- **Refresh Token**：长期有效（7天），用于刷新 Access Token

### 前端问题（错误）

**文件**：`together-uniapp-ts/src/api/request.ts`

**原有逻辑**：
```typescript
} else if (res.statusCode === 401) {
  // 收到 401 错误，直接清除所有 token 并跳转登录页 ❌
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
  });
  uni.removeStorageSync('token');
  uni.removeStorageSync('refreshToken');
  uni.removeStorageSync('userInfo');
  uni.navigateTo({ url: '/pages/auth/login' });
  reject(new Error('未授权'));
}
```

**问题**：
1. 前端虽然有 `refreshAccessToken` 方法，但从未被调用
2. 收到 401 错误时，直接清除所有 token，没有尝试刷新
3. 导致用户每 15 分钟就要重新登录一次

### 错误流程

```
用户登录成功
    ↓
获得 Access Token (15分钟) + Refresh Token (7天)
    ↓
15 分钟后，Access Token 过期
    ↓
发起 API 请求
    ↓
后端返回 401 Unauthorized
    ↓
前端收到 401 错误
    ↓
清除所有 token ❌
    ↓
跳转到登录页
    ↓
用户被迫重新登录
```

## 修复方案

### 实现自动刷新 Token 机制

**文件**：`together-uniapp-ts/src/api/request.ts`

#### 1. 添加刷新状态管理

```typescript
class Request {
  private baseURL: string;
  private timeout: number;
  private isRefreshing: boolean = false;  // 是否正在刷新 token
  private refreshSubscribers: Array<(token: string) => void> = [];  // 等待刷新的请求队列
}
```

**说明**：
- `isRefreshing`：防止多个请求同时触发刷新
- `refreshSubscribers`：存储等待刷新完成的请求，刷新成功后统一重试

#### 2. 实现 refreshToken 方法

```typescript
private async refreshToken(): Promise<string> {
  const refreshToken = uni.getStorageSync('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  try {
    const res = await uni.request({
      url: this.baseURL + '/auth/refresh',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      data: {
        refreshToken: refreshToken,
      },
    });

    if (res.statusCode === 200 || res.statusCode === 201) {
      const response = res.data as ApiResponse<{ token: string; refreshToken: string }>;
      if (response.code === 0 && response.data) {
        const newToken = response.data.token;
        const newRefreshToken = response.data.refreshToken;

   的 token
        uni.setStorageSync('token', newToken);
        if (newRefreshToken) {
          uni.setStorageSync('refreshToken', newRefreshToken);
        }

        return newToken;
      }
    }

    throw new Error('Refresh token failed');
  } catch (error) {
    throw error;
  }
}
```

#### 3. 修改 401 错误处理逻辑

```typescript
} else if (res.statusCode === 401) {
  // Token 过期，尝试刷新
  if (!this.isRefreshing) {
    // 第一个收到 401 的请求，开始刷新
    this.isRefreshing = true;

    try {
      const newToken = await this.refreshToken();
      this.isRefreshing = false;
      this.onRefreshed(newToken);  // 通知所有等待的请求

      // 重试原请求
  const retryConfig = {
        ...requestConfig,
        header: {
          ...requestConfig.header,
          Authorization: `Bearer ${newToken}`,
        },
      };

      uni.request({
        ...retryConfig,
        success: (retryRes) => {
          const retryResponse = retryRes.data as ApiResponse<T>;
          if ([200, 201].includes(retryRes.statusCode) && retryResponse.code === 0) {
            resolve(retryResponse);
          } else {
            reject(new Error(retryResponse.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
          });
    } catch (error) {
      // 刷新 token 失败，清除登录状态
      this.isRefreshing = false;
      this.refreshSubscribers = [];

      uni.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
      });
      uni.removeStorageSync('token');
      uni.removeStorageSync('refreshToken');
      uni.removeStorageSync('userInfo');
      uni.navigateTo({ url: '/pages/auth/login' });
      reject(new Error('未授权'));
    }
  } else {
    // 正在刷新 token，将请求加入队列
    this.addRefreshSubscriber((newToken: string) => {
      const retryConfig = {
        ...requestConfig,
        header: {
          ...requestConfig.header,
          Authoion: `Bearer ${newToken}`,
        },
      };

      uni.request({
        ...retryConfig,
        success: (retryRes) => {
          const retryResponse = retryRes.data as ApiResponse<T>;
          if ([200, 201].includes(retryRes.statusCode) && retryResponse.code === 0) {
            resolve(retryResponse);
          } else {
            reject(new Error(retryResponse.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
  }
}
```

#### 4. 添加队列管理方法

```typescript
private onRefreshed(token: string) {
  // 刷新成功，通知所有等待的请求
  this.refreshSubscribers.forEach((callback) => callback(token));
  this.refreshSubscribers = [];
}

private addRefreshSubscriber(callback: (token: string) => void) {
  // 将请求加入等待队列
  this.refreshSubscribers.push(callback);
}
```

## 修复后的流程

### 正常流程

```
用户登录成功
    ↓
获得 Access Token (15分钟) + Refresh Token (7天)
    ↓
15 分钟后，Access Token 过期
    ↓
发起 API 请求
    ↓
后端返回 401 Unauthorized
    ↓
前端收到 401 错误
    ↓
检查是否正在刷新 token
    ↓
使用 Refresh Token 调用 /auth/refresh ✅
    ↓
获得新的 Access Token
    ↓
保存新 token 到本地存储
    ↓
使用新 token 重试原请求 ✅
    ↓
请求成功，用户无感知
```

### 并发请求处理

```
多个请求同时收到 401
    ↓
第一个请求：开始刷新 token (isRefreshing = true)
    ↓
其他请求：加入等待队列 (refreshSubscribers)
    ↓
刷新成功，获得新 token
    ↓
通知所有等待的请求 (onRefreshed)
    ↓
所有请求使用新 token 重试
    ↓
全部成功
```

### 刷新失败处理

```
尝试刷新 token
    ↓
Refresh Token 也过期了（7天后）
    ↓
刷新失败
    ↓
清除所有 token
    ↓
跳转到登录页
    ↓
用户重新登录
```

## 关键技术点

### 1. 防止并发刷新

使用 `isRefreshing` 标志位，确保同一时间只有一个刷新请求：

```typescript
if (!this.isRefreshing) {
  this.isRefreshing = true;
  // 执行刷新
} else {
  // 加入等待队列
  this.addRefreshSubscriber(callback);
}
```

### 2. 请求队列管理

使用 `refreshSubscribers` 数组存储等待刷新的请求：

```typescript
private refreshSubscribers: Array<(token: string) => void> = [];

// 添加到队列
this.addRefreshSubscriber((newToken) => {
  // 使用新 token 重试请求
});

// 刷新成功后，通知所有等待的请求
this.onRefreshed(newToken);
```

### 3. 请求重试

刷新成功后，使用新 token 重试原请求：

```typescript
const retryConfig = {
  ...requestConfig,
  header: {
    ...requestConfig.header,
    Authorization: `Bearer ${newToken}`,
  },
};

uni.request({
  ...retryConfig,
  success: (retryRes) => {
    resolve(retryRes.data);
  },
});
```

## 验证步骤

### 1. 测试自动刷新

1. 登录应用
2. 等待 15 分钟（或修改后端配置为 1 分钟测试）
3. 发起任意 API 请求（如刷新广场列表）
4. 观察网络请求：
   - 第一个请求返回 401
   - 自动调用 `/auth/refresh`
   - 使用新 token 重试原请求
   - 请求成功
5. 验证用户无需重新登录

### 2. 测试并发请求

1. 登录应用
2. 等待 15 分钟
3. 同时发起多个请求（如快速切换多个页面）
4. 观察网络请求：
   - 多个请求同时返回 401
   - 只有一个 `/auth/refresh` 请求
   - 所有请求都使用新 token 重试
   - 全部成功

### 3. 测试刷新失败

1. 登录应用
2. 手动删除 `refreshToken`（模拟过期）
3. 发起 API 请求
4. 验证：
   - 尝试刷新失败
   - 清除所有 token
   - 跳转到登录页
   - 提示"登录已过期，请重新登录"

### 4. 测试长期使用

1. 登录应用
2. 持续使用 7 天（或修改配置缩短时间）
3. 验证：
   - 前 7 天内，每 15 分钟自动刷新
   - 7 天后，refresh token 过期
   - 提示重新登录

## Token 配置说明

### 开发环境 (.env.dev)

```env
JWT_ACCESS_EXPIRES_IN=7d       # 开发时设置较长，方便调试
JWT_REFRESH_EXPIRES_IN=30d
```

### 测试环境 (.env.staging)

```env
JWT_ACCESS_EXPIRES_IN=15m      # 测试真实场景
JWT_REFRESH_EXPIRES_IN=7d
```

### 生产环境 (.env.prod)

```env
JWT_ACCESS_EXPIRES_IN=15m      # 安全考虑，短期有效
JWT_REFRESH_EXPIRES_IN=7d      # 平衡安全和用户体验
```

## 安全考虑

### 1. Refresh Token 存储

- 存储在 `uni.storage` 中（本地存储）
- 不暴露在 URL 或日志中
- 仅在刷新时发送到后端

### 2. Token 轮换

后端应该在每次刷新时返回新的 refresh token（Token Rotation）：

```typescript
// 后端返回
{
  token: "new_access_token",
  refreshToken: "new_refresh_token"  // 新的 refresh token
}
```

前端保存新的 refresh token：

```typescript
if (newRefreshToken) {
  uni.setStorageSync('refreshToken', newRefreshToken);
}
```

### 3. 刷新失败处理

- 刷新失败后立即清除所有 token
- 防止使用过期的 token 继续请求
- 引导用户重新登录

## 相关文件

- `together-uniapp-ts/src/api/request.ts` - 请求拦截器（主要修改）
- `together-uniapp-ts/src/stores/auth.ts` - 认证状态管理
- `together-uniapp-ts/src/api/modules/auth.ts` - 认证 API
- `server-nest/.env.staging` - 后端配置

## 后续优化建议

### 1. 主动刷新

在 token 即将过期前主动刷新，而不是等到 401：

```typescript
// 解析 token 获取过期时间
const tokenExpiry = parseJWT(token).exp;
const now = Date.now() / 1000;

// 提前 5 分钟刷新
if (tokenExpiry - now < 300) {
  await this.refreshToken();
}
```

### 2. 刷新失败重试

刷新失败时，可以重试 1-2 次：

```typescript
let retryCount = 0;
const maxRetries = 2;

while (retryCount < maxRetries) {
  try {
    return await this.refreshToken();
  } catch (error) {
    retryCount++;
    if (retryCount >= maxRetries) throw error;
    await sleep(1000);
  }
}
```

### 3. Token 过期提醒

在 token 即将过期时，提醒用户：

```typescript
if (tokenExpiry - now < 600) {  // 10 分钟内过期
  uni.showToast({
    title: '登录即将过期，请保存数据',
    icon: 'none',
  });
}
```

## 修复时间

2026-04-20
