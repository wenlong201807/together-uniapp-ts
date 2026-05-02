# Code Review 修复报告

**修复日期**: 2026-05-02  
**修复范围**: Critical 和 High 优先级问题

---

## ✅ 已修复问题

### 🔴 Critical #1: 消息去重逻辑不完整

**问题描述**:
- HTTP 响应和 WebSocket 推送存在时序竞争
- 临时消息 ID（`Date.now()`）与真实消息 ID（数据库 ID）可能导致重复

**修复方案**:

#### 1. 临时消息 ID 使用负数（chat.ts:59）
```typescript
// 修复前
const tempId = Date.now(); // 可能与数据库 ID 冲突

// 修复后
const tempId = -Date.now(); // 负数永远不会与数据库 ID 冲突
```

#### 2. 增强临时消息查找逻辑（chat.ts:74）
```typescript
// 修复前
const index = messages.value.findIndex(m => m.id === tempId);

// 修复后
const index = messages.value.findIndex(m => m.id === tempId && m.status === 'sending');
```

#### 3. 增加时间窗口匹配（chat.ts:207-211）
```typescript
// 按内容+接收者+时间窗口匹配临时消息
const messageTime = new Date(message.createdAt).getTime()
const tempIndex = messages.value.findIndex(m =>
  m.status === 'sending' &&
  m.receiverId === msgReceiverId &&
  m.content === message.content &&
  Math.abs(new Date(m.createdAt).getTime() - messageTime) < 5000 // 5秒时间窗口
)
```

#### 4. 多端同步去重（chat.ts:227-235）
```typescript
// 多端同步场景：检查是否有相同内容的消息（防止重复）
const duplicateIndex = messages.value.findIndex(m =>
  m.receiverId === msgReceiverId &&
  m.content === message.content &&
  Math.abs(new Date(m.createdAt).getTime() - messageTime) < 2000 // 2秒时间窗口
)

if (duplicateIndex === -1) {
  messages.value.push(messageWithFlag)
} else {
  console.log('[WebSocket] 多端同步：消息已存在（按内容去重）')
}
```

---

### 🟠 High #2: 会话列表遗漏新会话

**问题描述**:
- 新用户发来第一条消息时，会话列表不会更新
- 只更新已存在的会话

**修复方案**（chat.ts:160-183）:
```typescript
// 更新或创建会话
let conversation = conversations.value.find((c) => c.userId === msgSenderId)
if (conversation) {
  // 更新已存在的会话
  conversation.lastMessage = message.content
  conversation.lastMessageTime = message.createdAt
  if (!isCurrentChat) {
    conversation.unreadCount = (conversation.unreadCount || 0) + 1
    unreadCount.value++
    updateMessageBadge()
  }
} else {
  // 新会话：创建会话项
  conversation = {
    userId: msgSenderId,
    nickname: message.sender?.nickname || '未知用户',
    avatar: message.sender?.avatarUrl || '',
    avatarUrl: message.sender?.avatarUrl || '',
    lastMessage: message.content,
    lastMessageTime: message.createdAt,
    lastTime: message.createdAt,
    unreadCount: isCurrentChat ? 0 : 1,
  }
  conversations.value.unshift(conversation) // 添加到列表顶部

  if (!isCurrentChat) {
    unreadCount.value++
    updateMessageBadge()
  }
}
```

---

### 🟠 High #3: senderId 类型安全问题

**问题描述**:
- 临时消息的 `senderId` 硬编码为 `0`
- 依赖 `isSelf` 判断，但 `senderId` 本身不正确

**修复方案**（chat.ts:51-66）:
```typescript
const sendMessage = async (data: SendMessageDto) => {
  const authStore = useAuthStore()
  const currentUserId = authStore.userInfo?.id

  // 增加登录检查
  if (!currentUserId) {
    throw new Error(}

  const tempId = -Date.now();
  const tempMessage: Message = {
    id: tempId,
    senderId: currentUserId, // ✅ 使用真实用户 ID
    receiverId: data.receiverId,
    content: data.content,
    msgType: data.msgType || 1,
    status: 'sending',
    createdAt: new Date().toISOString(),
    isSelf: true,
  } as Message;

  messages.value.push(tempMessage);
  // ...
}
```

---

### 🟠 High #4: 并发消息处理不安全

**问题描述**:
- 用户快速发送多条消息时，HTTP 响应可能乱序
- 直接赋值 `messages.value[index] = ...` 可能不触发 Vue 响应式

**修复方案**（chat.ts:74-84）:
```typescript
// 修复前
const index = messages.value.findIndex(m => m.id === tempId);
if (index !== -1) {
  messages.value[index] = { ...res.data, isSelf: true }; // ❌ 直接赋值
}

// 修复后
const index = messages.value.findIndex(m => m.id === tempId && m.status === 'sending');
if (index !== -1) {
  const realMessage = {
    ...res.data,
    senderId: typeof res.data.senderId === 'string' ? parseInt(res.data.senderId) : res.data.senderId,
    receiverId: typeof res.data.receiverId === 'string' ? parseInt(res.data.receiverId) : res.data.receiverId,
    isSelf: true,
  };
  messages.value.splice(index, 1, realMessage); // ✅ 使用 splice 确保响应式
} else {
  console.warn('[sendMessage] 未找到临时消息:', tempId);
}
```

---

### 🟡 Medium #5: WebSocket 消息类型验证不足

**问题描述**:
- 只检查 `data.data` 是否存在，不验证内部字段
- 空对象 `{}` 会被当作有效消息

**修复方案**（websocket.ts:144-171）:
```typescript
// 增加消息格式验证函数
const isValidMessage = (msg: any): boolean => {
  return msg && typeof msg.id !== 'undefined' && msg.senderId && msg.receiverId && msg.content
}

private handleMessage(data: any) {
  console.log('[WebSocket] 收到原始消息:', JSON.stringify(data))
  const chatStore = useChatStore()

  // 职责分离 + 格式验证
  if (data.type === 'message' && isValidMessage(data.data)) {
    console.log('[WebSocket] 处理接收消息 (message):', data.data)
    chatStore.addReceivedMessage(data.data)
  } else if (data.type === 'message_sent' && isValidMessage(data.data)) {
    console.log('[WebSocket] 处理发送确认 (message_sent):', data.data)
    chatStore.confirmSentMessage(data.data)
  } else if (isValidMessage(data)) {
    console.log('[WebSocket] 处理直接消息对象（兼容模式）:', data)
    chatStore.addReceivedMessage(data)
  } else {
    console.warn('[WebSocket] 无效消息格式:', data)
  }
}
```

---

## 📊 修复总结

| 问题 | 严重程度 | 状态 | 文件 |
|------|---------|------|------|
| 消息去重逻辑不完整 | Critical | ✅ 已修复 | chat.ts |
| 会话列表遗漏新会话 | High | ✅ 已修复 | chat.ts |
| senderId 类型安全 | High | ✅ 已修复 | chat.ts |
| 并发消息处理不安全 | High | ✅ 已修复 | chat.ts |
| 消息类型验证不足 | Medium | ✅ 已修复 | websocket.ts |

---

## 🔍 核心改进点

###  消息去重策略

**三层防护**:
1. **ID 去重**: 检查消息 ID 是存在
2. **时间窗口匹配**: 5 秒内的相同内容消息视为同一条
3. **多端同步去重**: 2 秒内的相同内容消息视为重复

### 2. 临时消息 ID 策略

```
临时消息 ID: -1714567890123 (负数)
真实消息 ID: 12345 (正数，数据库自增)
永远不会冲突 ✅
```

### 3. 响应式更新

```typescript
// ❌ 不推荐
messages.value[index] = newMessage

// ✅ 推荐
messages.value.splice(index, 1, newMessage)
```

### 4. 新会话处理

```typescript
// 自动创建新会话
if (!conversation) {
  conversation = {
    userId: msgSenderId,
    nickname: message.sender?.nickname || '未知用户',
    // ...
  }
  conversations.value.unshift(conversation)
}
```

---

## 🚀 测试建议

### 场景 1: 快速发送多条消息
```
1. 用户 A 快速发送 3 条消息
2. 观察消息列表是否有重复
3. 检查临时消息是否正确替换
```

### 场景 2: 网络延迟
```
1. 模拟网络延迟（Chrome DevTools）
2. 发送消息，观察 WebSocket 先到还是 HTTP 先到
3. 检查消息是否重复
```

### 场景 3: 多端同步
```
1. 用户 A 在手机发送消息
2. 用户 A 在电脑端观察是否收到
3. 检查是否有重复消息
```

### 场景 4: 新用户首次发消息
```
1. 用户 B（新用户）给用户 A 发送第一条消息
2. 用户 A 的会话列表应该自动出现用户 B
3. 检查未读数是否正确
```

### 场景 5: 并发消息
```
1. 用户 A 和用户 B 同时互发消息
2. 观察消息顺序和去重逻辑
3. 检查会话列表更新是否正确
```

---

## 📝 待优化问题（Low Priority）

以下问题不影响核心功能，可在后续迭代中优化：

1. **性能优化**: 会话列表使用 Map 缓存（Issue #7）
2. **代码重复**: 提取类型转换工具函数（Issue #8）
3. **日志管理**: 生产环境减少日志输出（Issue #9）
4. **竞态条件**: 用户快速切换聊天对象（Issue #6）

---

## 🔗 相关文档

- [WebSocket 重构说明](./REFACTOR_WEBSOCKET.md)
- [Code Review 完整报告](由 Agent a31839d31b1d0b10f 生成)

---

## ✅ 验证清单

- [x] 临时消息 ID 使用负数
- [x] 增加时间窗口匹配
- [x] 多端同步去重
- [x] 新会话自动创建
- [x] senderId 使用真实用户 ID
- [x] 使用 splice 确保响应式
- [x] 增加消息格式验证
- [x] 增加登录状态检查

所有 Critical 和 High 优先级问题已修复完成！
