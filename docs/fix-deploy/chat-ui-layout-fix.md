# 聊天页面 UI 布局修复

## 问题描述

聊天页面存在以下 UI 问题：
1. **消息列表被输入框遮挡**：最后一条消息无法完整显示
2. **键盘弹起时布局错乱**：输入框位置不正确，消息被遮挡
3. **自动滚动不生效**：新消息发送后不会自动滚动到底部
4. **高度计算不准确**：固定的 `inputBarHeight` 导致布局问题

## 修复方案

### 1. 动态计算滚动区域高度

**问题**：原代码使用固定的 `inputBarHeight = 100px`，但实际输入框高度是 rpx 单位，且没有考虑状态栏和导航栏。

**修复**：
```typescript
const scrollViewHeight = ref(0);
const inputBarHeight = 100; // 输入框固定高度（px）

const calculateScrollHeight = () => {
  const systemInfo = uni.getSystemInfoSync();
  const windowHeight = systemInfo.windowHeight;
  const statusBarHeight = systemInfo.statusBarHeight || 0;
  const navBarHeight = 44; // 导航栏高度

  // 可用高度 = 窗口高度 - 状态栏 - 导航栏 - 输入框 - 键盘
  scrollViewHeight.value = windowHeight - statusBarHeight - navBarHeight - inputBarHeight - keyboardHeight.value;
};
```

### 2. 修改模板结构

**问题**：原代码使用底部占位 `bottom-spacer`，但高度计算不准确。

**修复**：
```vue
<scroll-view
  class="messages-list"
  scroll-y
  :scroll-into-view="scrollToView"
  :scroll-with-animation="true"
  :style="{ height: scrollViewHeight + 'px' }"
>
  <view class="messages-wrapper">
    <MessageBubble
      v-for="message in chatStore.messages"
      :key="message.id"
      :id="`msg-${message.id}`"
      :message="message"
      @retry="handleRetry"
    />
  </view>
</scroll-view>
```

**关键改进**：
- 移除 `bottom-spacer`，改用动态计算的 `scrollViewHeight`
- 添加 `messages-wrapper` 包裹消息列表，便于样式控制
- 为每个 `MessageBubble` 添加 `id` 属性，确保 `scroll-into-view` 生效

### 3. 监听消息变化自动滚动

**问题**：新消息到达时不会自动滚动到底部。

**修复**：
```typescript
// 监听消息变化，自动滚动到底部
watch(() => chatStore.messages.length, async () => {
  await nextTick();
  scrollToBottom();
}, { flush: 'post' });
```

### 4. 优化滚动到底部逻辑

**问题**：`scrollToView` 设置后不会重置，导致下次滚动失效。

**修复**：
```typescript
const scrollToBottom = () => {
  const lastMessage = chatStore.messages[chatStore.messages.length - 1];
  if (lastMessage) {
    scrollToView.value = `msg-${lastMessage.id}`;
    // 重置 scrollToView，允许下次滚动
    setTimeout(() => {
      scrollToView.value = '';
    }, 300);
  }
};
```

### 5. 键盘弹起时重新计算高度

**问题**：键盘弹起时没有重新计算滚动区域高度。

**修复**：
```typescript
const handleFocus = () => {
  uni.onKeyboardHeightChange((res) => {
    keyboardHeight.value = res.height;
    calculateScrollHeight(); // 重新计算高度

    nextTick(() => {
      scrollToBottom();
    });
  });
};

const handleBlur = () => {
  setTimeout(() => {
    keyboardHeight.value = 0;
    calculateScrollHeight(); // 重新计算高度
  }, 100);
};
```

### 6. 优化样式布局

**修复前**：
```scss
.messages-list {
  flex: 1;
  padding: $padding-md;
  overflow-y: auto;

  .bottom-spacer {
    width: 100%;
    flex-shrink: 0;
  }
}
```

**修复后**：
```scss
.chat-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-secondary;
  position: relative;

  .messages-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    .messages-wrapper {
      padding: $padding-md;
      padding-bottom: $padding-xl;
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }
  }

  .input-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    // ... 其他样式
  }
}
```

**关键改进**：
- 移除 `bottom-spacer`
- 添加 `messages-wrapper` 包裹消息，设置 `padding-bottom` 留出空间
- 输入框使用 `position: fixed` 固定在底部
- 添加 `-webkit-overflow-scrolling: touch` 优化滚动体验

## 布局原理

```
┌─────────────────────────────────┐
│      状态栏 (statusBarHeight)    │
├─────────────────────────────────┤
│      导航栏 (navBarHeight: 44)   │
├─────────────────────────────────┤
│                                 │
│                                 │
│      消息列表 (scroll-view)      │
│      高度 = windowHeight        │
│            - statusBarHeight    │
│            - navBarHeight       │
│            - inputBarHeight     │
│            - keyboardHeight     │
│                                 │
│                                 │
├─────────────────────────────────┤
│      输入框 (fixed, 100px)       │
├─────────────────────────────────┤
│      键盘 (keyboardHeight)       │
└─────────────────────────────────┘
```

## 自动滚动流程

```
消息变化
    ↓
watch 监听 messages.length
    ↓
await nextTick()
    ↓
scrollToBottom()
    ↓
设置 scrollToView = `msg-${lastId}`
    ↓
scroll-view 滚动到指定元素
    ↓
300ms 后重置 scrollToView
```

## 验证步骤

### 1. 测试消息不被遮挡

1. 进入聊天页面
2. 发送多条消息，直到超过一屏
3. 检查最后一条消息是否完整显示
4. 检查输入框是否遮挡消息

### 2. 测试键盘弹起

1. 点击输入框，键盘弹起
2. 检查消息列表是否正确缩小
3. 检查输入框是否跟随键盘上移
4. 检查最后一条消息是否可见

### 3. 测试自动滚动

1. 发送新消息
2. 检查是否自动滚动到底部
3. 接收对方消息
4. 检查是否自动滚动到底部

### 4. 测试键盘收起

1. 点击输入框外部，键盘收起
2. 检查消息列表是否恢复正常高度
3. 检查输入框是否回到底部
4. 检查布局是否正常

## 常见问题

### Q1: 消息仍然被遮挡？

**检查**：
1. `scrollViewHeight` 是否正确计算
2. `inputBarHeight` 是否与实际高度一致
3. `navBarHeight` 是否正确（不同平台可能不同）

**解决**：
```typescript
// 调整 navconst navBarHeight = 44; // iOS
// 或
const navBarHeight = 48; // Android
```

### Q2: 自动滚动不生效？

**检查**：
1. `MessageBubble` 是否有 `id` 属性
2. `scrollToView` 的值是否正确
3. `scroll-into-view` 是否拼写正确

**解决**：
```vue
<!-- 确保 MessageBubble 有 id -->
<MessageBubble
  :id="`msg-${message.id}`"
  :message="message"
/>
```

### Q3: 键盘弹起时布局错乱？

**检查**：
1. `adjust-position` 是否设置为 `false`
2. `calculateScrollHeight` 是否在键盘变化时调用

**解决**：
```vue
<input
  :adjust-position="false"
  @focus="handleFocus"
/>
```

## 相关文件

- `together-uniapp-ts/src/pages/chat/detail.vue` - 聊天详情页
- `together-uniapp-ts/src/components/business/MessageBubble.vue` - 消息气泡组件

修复时间

2026-04-20
