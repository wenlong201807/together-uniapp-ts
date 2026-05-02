# WebSocket 消息处理重构说明（方案 A）

## 📋 重构概述

**重构日期**: 2026-05-02  
**重构原因**: 职责分离，提高代码可维护性，修复消息推送逻辑混乱问题

## 🎯 核心改动

### 1. 新增 `addReceivedMessage` 方法

**职责**: 只处理"接收到的消息"（别人发给我的）

**文件**: `src/stores/chat.ts:115-173`

**核心逻辑**:
```typescript
const addReceivedMessage = (message: Message) => {
  // 1. 消息去重
  // 2. 判断是否是当前聊天（发送者 === 当前聊天对象）
  // 3. 构造消息对象（isSelf 始终为 false）
  // 4. 如果是当前聊天 → 添加到列表
  //    如果不是当前聊天 → 触发通知
  // 5. 更新会话列表 + 增加未读数（不是当前聊天时）
}
```

**关键简化**:
- ✅ 不需要判断 `msgSenderId !== currentUserId`（因为这个方法本身就是处理"别人发的"）
- ✅ `isSelf` 始终为 `false`
- ✅ 未读数逻辑简单：不是当前聊天就增加

### 2. 优化 `confirmSentMessage` 方法

**职责**: 只处理"我发送的消息确认"（多端同步）

**文件**: `src/stores/chat.ts:179-232`

**核心逻辑**:
```typescript
const confirmSentMessage = (message: Message) => {
  // 1. 消息去重
  // 2. 判断是否是当前聊天（接收者 === 当前聊天对象）
  // 3. 查找临时消息并替换
  // 4. 如果没有临时消息 + 是当前聊天 → 添加到列表（多端同步）
  // 5. 更新会话列表（不增加未读数）
}
```

**关键简化**:
- ✅ `isSelf` 始终为 `true`
- ✅ 不增加未读数（自己发的消息不产生未读）
- ✅ 多端同步逻辑清晰

### 3. 更新 WebSocket 消息分发

**文件**: `src/utils/websocket.ts:144-162`

**改动**:
```typescript
// 修改前
if (data.type === 'message') {
  chatStore.addMessage(data.data)  // ❌ 职责不清
}

// 修改后
if (data.type === 'message') {
  chatStore.addReceivedMessage(data.data)  // ✅ 语义明确
}
```

### 4. 兼容性处理

**文件**: `src/stores/chat.ts:175-176`

```typescript
// 兼容旧代码：addMessage 重定向到 addReceivedMessage
const addMessage = addReceivedMessage
```

**导出接口**: `src/stores/chat.ts:242-257`
```typescript
return {
  // ... 其他方法
  addMessage,           // 兼容旧代码
  addReceivedMessage,   // 新方法（推荐使用）
  confirmSentMessage,
  // ...
}
```

## 📊 重构前后对比

### 重构前的问题

```typescript
// addMessage 方法职责混乱
const addMessage = (message: Message) => {
  // ❌ 既处理"收到的消息"，又处理"发送的消息"
  const isCurrentChat = currentChat.value && (
    (msgSenderId === currentChat.value.userId && msgReceiverId === currentUserId) ||
    (msgSenderId === currentUserId && msgReceiverId === currentChat.value.userId)
  )
  
  // ❌ 需要复杂判断来区分"我发的"还是"别人发的"
  const messageWithFlag = {
    ...message,
    isSelf: msgSenderId === currentUserId  // ❌ 不确定性
  }
  
  // ❌ 未读数逻辑复杂
  if (!isCurrentChat && msgSenderId !== currentUserId) {
    conversation.unreadCount++
  }
}
```

### 重构后的优势

```typescript
// addReceivedMessage: 只处理接收消息
const addReceivedMessage = (message: Message) => {
  // ✅ 职责单一：只处理"别人发给我的"
  const isCurrentChat = currentChat.value && msgSenderId === currentChat.value.userId
  
  // ✅ isSelf 确定性：始终为 false
  const messageWithFlag = {
    ...message,
    isSelf: false
  }
  
  // ✅ 未读数逻辑简单
  if (!isCurrentChat) {
    conversation.unreadCount++
  }
}

// confirmSentMessage: 只处理发送确认
const confirmSentMessage = (message: Message) => {
  // ✅ 职责单一：只处理"我发送的消息确认"
  const isCurrentChat = currentChat.value && msgReceiverId === currentChat.value.userId
  
  // ✅ isSelf 确定性：始终为 true
  const messageWithFlag = {
    ...message,
    isSelf: true
  }
  
  // ✅ 不增加未读数（自己发的消息）
}
```

## 🔍 消息流向图

### 用户 A 发送消息给用户 B

```
┌─────────────────────────────────────────────────────────────┐
│ 用户 A 点击发送                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 前端：chatStore.sendMessage()                                │
│ - 乐观更新：添加临时消息（status: 'sending'）                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 后端：chat.service.ts:sendMessage()                          │
│ - 保存消息到数据库                                           │
│ - 推送给用户 B: { type: 'message', data: {...} }            │
│ - 推送给用户 A: { type: 'message_sent', data: {...} }       │
└─────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│ 用户 B 收到消息        │   │ 用户 A 收到确认        │
│ type: 'message'       │   │ type: 'message_sent'  │
└───────────────────────┘   └───────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│ addReceivedMessage()  │   │ confirmSentMessage()  │
│ - isSelf: false       │   │ - isSelf: true        │
│ - 增加未读数（如果不  │   │ - 替换临时消息        │
│   在当前聊天）        │   │ - 不增加未读数        │
└───────────────────────┘   └───────────────────────┘
```

## ✅ 测试场景

### 场景 1: 用户 A 给用户 B 发消息（B 在聊天详情页）

**预期行为**:
- ✅ 用户 A: 临时消息 → 替换为真实消息，不增加未读数
- ✅ 用户 B: 收到消息，添加到列表，不增加未读数

### 场景 2: 用户 A 给用户 B 发消息（B 不在聊天详情页）

**预期行为**:
- ✅ 用户 A: 临时消息 → 替换为真实消息，不增加未读数
- ✅ 用户 B: 收到消息，触发通知，增加未读数

### 场景 3: 用户 A 给用户 B 发消息（B 离线）

**预期行为**:
- ✅ 用户 A: 临时消息 → 替换为真实消息
- ✅ 用户 B: 上线后通过 `fetchHistory` 获取历史消息

### 场景 4: 多端同步（用户 A 在手机发消息，电脑端同步）

**预期行为**:
- ✅ 手机端: 临时消息 → 替换为真实消息
- ✅ 电脑端: 收到 `message_sent`，添加到列表（如果在当前聊天）

## 🚀 后续优化建议

### 短期（已完成）
- ✅ 职责分离：`addReceivedMessage` vs `confirmSentMessage`
- ✅ 简化判断逻辑
- ✅ 提高代码可读性

### 中期（可选）
- 🔄 移除 `addMessage` 兼容层，全部改用 `addReceivedMessage`
- 🔄 添加单元测试覆盖消息处理逻辑
- 🔄 优化消息去重机制（使用 Set 代替 Array.some）

### 长期（架构优化）
- 🔄 引入消息队列（如 RxJS）统一管理消息事件
- 🔄 实现事件溯源模式，支持消息回溯
- 🔄 支持离线消息队列和断线重连后的消息同步

## 📝 注意事项

1. **兼容性**: 保留了 `addMessage` 作为 `addReceivedMessage` 的别名，确保旧代码不受影响
2. **类型安全**: 所有方法都保持了原有的类型签名
3. **日志增强**: 增加了更详细的日志输出，便于调试
4. **向后兼容**: WebSocket 消息处理保留了对旧格式的兼容

## 🔗 相关文件

- `src/stores/chat.ts` - 聊天 Store（核心重构）
- `src/utils/websocket.ts` - WebSocket 管理器（消息分发）
- `src/pages/chat/detail.vue` - 聊天详情页（使用方）
- `server-nest/src/modules/chat/chat.service.ts` - 后端消息推送逻辑

## 📚 参考资料

- [第一性原理分析文档](./docs/websocket-refactor-analysis.md)
- [WebSocket 消息推送问题排查](./docs/websocket-issue-debug.md)
