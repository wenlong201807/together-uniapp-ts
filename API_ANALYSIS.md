# API 接口分析报告

生成时间: 2026-04-08

## 一、接口路径不一致问题

### 1. 用户模块 (user.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `POST /user/profile` | `PUT /api/v1/user/profile` | 方法错误 (POST → PUT) | 高 |
| `POST /user/upload-avatar` | `POST /api/v1/user/avatar` | 路径错误 | 高 |
| 缺失 | `GET /api/v1/user/me` | 缺少获取当前用户信息接口 | 高 |
| 缺失 | `PUT /api/v1/user/me` | 缺少更新用户信息接口 | 高 |
| 缺失 | `GET /api/v1/user/points` | 缺少查询用户积分接口 | 中 |
| 缺失 | `GET /api/v1/user/{id}` | 缺少查看用户详情接口 | 中 |

### 2. 聊天模块 (chat.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `POST /chat/send` | `POST /api/v1/chat/send` | 缺少 /api/v1 前缀 | 高 |
| `GET /chat/history/{userId}` | `GET /api/v1/chat/history/{userId}` | 缺少 /api/v1 前缀 | 高 |
| `GET /chat/conversations` | `GET /api/v1/chat/conversations` | 缺少 /api/v1 前缀 | 高 |
| `PUT /chat/read/{userId}` | `PUT /api/v1/chat/read/{userId}` | 缺少 /api/v1 前缀 | 高 |
| 缺失 | `GET /api/v1/chat/messages` | 缺少获取消息列表接口 | 中 |

### 3. 广场模块 (square.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `POST /square/posts` | `POST /api/v1/square/posts` | 缺少 /api/v1 前缀 | 高 |
| `GET /square/posts` | `GET /api/v1/square/posts` | 缺少 /api/v1 前缀 | 高 |
| `GET /square/posts/{id}` | `GET /api/v1/square/posts/{id}` | 缺少 /api/v1 前缀 | 高 |
| `DELETE /square/posts/{id}` | `DELETE /api/v1/square/posts/{id}` | 缺少 /api/v1 前缀 | 高 |
| `POST /square/comment` | `POST /api/v1/square/comment` | 缺少 /api/v1 前缀 | 高 |
| `GET /square/posts/{id}/comments` | `GET /api/v1/square/posts/{id}/comments` | 缺少 /api/v1 前缀 | 高 |
| `GET /square/comments/{id}/replies` | `GET /api/v1/square/comments/{id}/replies` | 缺少 /api/v1 前缀 | 高 |
| `POST /square/like` | `POST /api/v1/square/like` | 缺少 /api/v1 前缀 | 高 |
| `POST /square/report` | `POST /api/v1/square/report` | 缺少 /api/v1 前缀 | 高 |
| 缺失 | `POST /api/v1/square/posts/{id}/like` | 缺少帖子点赞接口 | 中 |
| 缺失 | `DELETE /api/v1/square/posts/{id}/like` | 缺少取消点赞接口 | 中 |
| 缺失 | `POST /api/v1/square/posts/{id}/comments` | 缺少评论接口（另一种方式） | 低 |

### 4. 好友模块 (friend.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `GET /friend/list` | `GET /api/v1/friend/list` | 缺少 /api/v1 前缀 | 高 |
| `GET /friend/following` | `GET /api/v1/friend/following` | 缺少 /api/v1 前缀 | 高 |
| `POST /friend/follow` | `POST /api/v1/friend/follow` | 缺少 /api/v1 前缀 | 高 |
| `POST /friend/unlock-chat` | `POST /api/v1/friend/unlock-chat` | 缺少 /api/v1 前缀 | 高 |
| `GET /friend/status/{userId}` | `GET /api/v1/friend/status/{userId}` | 缺少 /api/v1 前缀 | 高 |
| `DELETE /friend/{userId}` | `DELETE /api/v1/friend/{userId}` | 缺少 /api/v1 前缀 | 高 |
| `POST /friend/block` | `POST /api/v1/friend/block` | 缺少 /api/v1 前缀 | 高 |
| `GET /friend/blocklist` | `GET /api/v1/friend/blocklist` | 缺少 /api/v1 前缀 | 高 |
| 缺失 | `POST /api/v1/friend/request` | 缺少添加好友请求接口 | 高 |
| 缺失 | `POST /api/v1/friend/accept` | 缺少接受好友请求接口 | 高 |

### 5. 积分模块 (points.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `GET /points/balance` | `GET /api/v1/points/balance` | 缺少 /api/v1 前缀 | 高 |
| `POST /points/sign` | `POST /api/v1/points/sign` | 缺少 /api/v1 前缀 | 高 |
| `GET /points/sign/status` | `GET /api/v1/points/sign/status` | 缺少 /api/v1 前缀 | 高 |
| `GET /points/logs` | `GET /api/v1/points/logs` | 缺少 /api/v1 前缀 | 高 |
| 缺失 | `GET /api/v1/points/config` | 缺少获取积分配置接口 | 中 |
| 缺失 | `GET /api/v1/points-configs` | 缺少获取积分配置列表接口 | 低 |

### 6. 认证模块 (certification.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `GET /certification-types` | `GET /api/v1/certification-types` | 缺少 /api/v1 前缀 | 高 |
| `POST /certification` | `POST /api/v1/certification` | 缺少 /api/v1 前缀 | 高 |
| `GET /certification/list` | `GET /api/v1/certification/list` | 缺少 /api/v1 前缀 | 高 |
| `GET /certification/{id}` | `GET /api/v1/certification/{id}` | 缺少 /api/v1 前缀 | 高 |
| 缺失 | `GET /api/v1/certification-type` | 缺少获取单个认证类型接口 | 低 |

### 7. 配置模块 (config.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `GET /public/config` | `GET /api/v1/public/config` | 缺少 /api/v1 前缀 | 高 |

### 8. 文件模块 (file.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `GET /file/config` | `GET /api/v1/file/config` | 缺少 /api/v1 前缀 | 高 |
| `POST /file/presigned-put` | `POST /api/v1/file/presigned-put` | 缺少 /api/v1 前缀 | 高 |
| `POST /file/upload` | `POST /api/v1/file/upload` | 缺少 /api/v1 前缀 | 高 |
| `GET /file/{id}/url` | `GET /api/v1/file/{id}/url` | 缺少 /api/v1 前缀 | 高 |
| `GET /file/{id}` | `GET /api/v1/file/{id}` | 缺少 /api/v1 前缀 | 高 |
| `GET /file/my/list` | `GET /api/v1/file/my/list` | 缺少 /api/v1 前缀 | 高 |
| `DELETE /file/{id}` | `DELETE /api/v1/file/{id}` | 缺少 /api/v1 前缀 | 高 |
| `POST /user/avatar` | `POST /api/v1/user/avatar` | 缺少 /api/v1 前缀 | 高 |
| 缺失 | `POST /api/v1/file/upload-token` | 缺少获取七牛云上传凭证接口 | 中 |
| 缺失 | `POST /api/v1/file/save` | 缺少保存文件记录接口 | 中 |

### 9. 认证授权模块 (auth.ts)
| 前端接口 | 后端接口 | 问题 | 优先级 |
|---------|---------|------|--------|
| `POST /auth/sms/send` | `POST /api/v1/auth/sms/send` | 缺少 /api/v1 前缀 | 高 |
| `POST /auth/register` | `POST /api/v1/auth/register` | 缺少 /api/v1 前缀 | 高 |
| `POST /auth/login` | `POST /api/v1/auth/login` | 缺少 /api/v1 前缀 | 高 |
| `POST /auth/refresh` | `POST /api/v1/auth/refresh` | 缺少 /api/v1 前缀 | 高 |
| `PUT /user/me` | `PUT /api/v1/user/me` | 缺少 /api/v1 前缀 | 高 |
| 缺失 | `POST /api/v1/auth/reset-password` | 缺少重置密码接口 | 中 |

## 二、参数结构不一致问题

### 1. SendMessageDto (chat.ts)
- **前端**: `receiverId: string`
- **后端**: `receiverId: number`
- **问题**: 类型不一致

### 2. UpdateProfileDto (user.ts)
- **前端**: 只有 `nickname`, `mobile`, `avatarId`, `avatarUrl`
- **后端**: 包含更多字段如 `gender`, `bio`, `city`, `birthDate`, `avatarPath` 等
- **问题**: 前端缺少部分字段

### 3. Points Logs 参数 (points.ts)
- **前端**: `params: { page, pageSize, type }`
- **后端**: 查询参数应该直接传递，不需要 `params` 包装
- **问题**: 参数传递方式不正确

## 三、响应结构不一致问题

### 1. ApiResponse 结构
- **前端**: `{ code, message, data }`
- **后端**: `{ code, message, data, timestamp }`
- **问题**: 前端缺少 `timestamp` 字段

### 2. 好友列表响应
- **前端**: `{ data: Friend[] }`
- **后端**: 应该是 `Friend[]` 或 `{ items: Friend[], total: number }`
- **问题**: 响应结构包装不一致

## 四、缺失的接口

### 高优先级
1. `GET /api/v1/user/me` - 获取当前用户信息
2. `PUT /api/v1/user/me` - 更新用户信息
3. `POST /api/v1/friend/request` - 添加好友请求
4. `POST /api/v1/friend/accept` - 接受好友请求
5. `POST /api/v1/auth/reset-password` - 重置密码

### 中优先级
1. `GET /api/v1/user/points` - 查询用户积分
2. `GET /api/v1/user/{id}` - 查看用户详情
3. `GET /api/v1/chat/messages` - 获取消息列表
4. `POST /api/v1/file/upload-token` - 获取七牛云上传凭证
5. `POST /api/v1/file/save` - 保存文件记录
6. `GET /api/v1/points/config` - 获取积分配置

### 低优先级
1. `GET /api/v1/points-configs` - 获取积分配置列表
2. `GET /api/v1/certification-type` - 获取单个认证类型
3. `POST /api/v1/square/posts/{id}/comments` - 评论接口（另一种方式）
4. `POST /api/v1/square/posts/{id}/like` - 帖子点赞接口
5. `DELETE /api/v1/square/posts/{id}/like` - 取消点赞接口

## 五、类型定义问题

### 1. 前端类型定义不完整
- 缺少 `UserProfile` 类型
- 缺少 `FileRecord` 完整类型
- 缺少 `Certification` 完整类型
- 缺少 `PointsConfig` 类型
- 缺少 `SystemConfig` 类型

### 2. 枚举类型不一致
- 前端使用自定义枚举
- 后端使用数字或字符串字面量类型
- 需要统一类型定义

## 六、修复建议

### 1. 统一路径前缀
所有接口路径添加 `/api/v1` 前缀，可以在 `request.ts` 中配置 baseURL 或在每个接口调用时添加。

### 2. 修正请求方法
- `user.updateProfile`: POST → PUT
- 确保所有接口方法与后端一致

### 3. 补充缺失接口
按优先级补充缺失的接口定义。

### 4. 统一类型定义
将后端生成的 TypeScript 类型文件复制到前端项目，确保类型一致。

### 5. 修正参数结构
- `SendMessageDto.receiverId`: string → number
- 补充 `UpdateProfileDto` 缺失字段
- 修正 `points.getLogs` 参数传递方式

### 6. 优化请求封装
- 确保 `ApiResponse` 类型包含 `timestamp`
- 统一响应数据结构处理
- 优化错误处理逻辑

## 七、总结

- **路径问题**: 所有接口都缺少 `/api/v1` 前缀
- **缺失接口**: 约 15 个后端接口前端未实现
- **类型不一致**: 多处参数和响应类型不匹配
- **类型定义**: 前端缺少完整的类型定义文件

**建议**: 优先修复路径前缀问题和高优先级缺失接口，然后统一类型定义，最后优化请求封装。
