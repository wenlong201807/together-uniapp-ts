# 头像更新全局同步方案

## 问题描述

上传头像后，只更新了 `authStore.userInfo`，但其他页面（帖子列表、聊天列表、好友列表等）显示的是缓存在各自数据对象中的用户信息，导致头像不同步。

## 解决方案

采用**事件总线 + Composable Hook**模式实现全局头像同步。

### 1. 核心文件

#### 1.1 事件总线 (`src/utils/event-bus.ts`)

```typescript
// 全局事件管理器
class EventBus {
  private events: Map<string, EventCallback[]> = new Map();
  
  on(event: string, callback: EventCallback) { ... }
  off(event: string, callback: EventCallback) { ... }
  emit(event: string, ...args: any[]) { ... }
}

export const EVENTS = {
  AVATAR_UPDATED: 'avatar:updated',
};
```

#### 1.2 头像同步 Hook (`src/composables/useAvatarSync.ts`)

```typescript
export function useAvatarSync(dataList: any, options = {}) {
  // 监听头像更新事件
  // 自动更新列表中匹配用户的头像
  // 支持嵌套结构 (post.user) 和扁平结构 (conversation.userId)
}
```

### 2. 实现步骤

#### 步骤 1：在 authStore 中触发事件

修改 `src/stores/auth.ts`：

```typescript
import { eventBus, EVENTS } from '@/utils/event-bus';

const updateUserInfo = (info: UserInfo) => {
  userInfo.value = info;
  uni.setStorageSync('userInfo', info);
  
  // 触发全局头像更新事件
  eventBus.emit(EVENTS.AVATAR_UPDATED, {
    userId: info.id,
    avatarId: info.avatarId,
    avatarUrl: info.avatarUrl,
  });
};
```

#### 步骤 2：在各页面中使用 Hook

**帖子列表页面** (`pages/tabbar/square.vue`):

```typescript
import { useAvatarSync } from '@/composables/useAvatarSync';

const posts = computed(() => ({ list: squareStore.posts }));
useAvatarSync(posts, { nestedUserField: 'user' });
```

**聊天列表页面** (`pages/chat/list.vue`):

```typescript
const conversations = computed(() => ({ list: chatStore.conversations }));
useAvatarSync(conversations, {
  userIdField: 'userId',
  avatarIdField: 'avatarId',
  avatarUrlField: 'avatar',
  nestedUserField: undefined
});
```

**好友列表页面** (`pages/friend/list.vue`):

```typescript
const friendList = computed(() => ({ list: friendStore.friendList }));
useAvatarSync(friendList, {
  userIdField: 'friendId',
  nestedUserField: 'user'
});
```

### 3. 工作原理

```
用户上传头像
    ↓
authStore.updateUserInfo()
    ↓
eventBus.emit(AVATAR_UPDATED)
    ↓
各页面的 useAvatarSync 监听到事件
    ↓
遍历列表数据，匹配 userId
    ↓
更新匹配项的 avatarId 和 avatarUrl
    ↓
Vue 响应式系统触发 UI 更新
```

### 4. 优势

1. **解耦**：页面不需要知道头像更新的来源
2. **自动化**：一行代码即可启用头像同步
3. **灵活**：支持多种数据结构（嵌套/扁平）
4. **性能**：只更新必要的数据，不重新请求接口
5. **可扩展**：可轻松添加其他全局同步事件

### 5. 已应用页面

- ✅ 广场页面 (`pages/tabbar/square.vue`)
- ✅ 首页动态 (`pages/tabbar/home.vue`)
- ✅ 聊天列表 (`pages/chat/list.vue`)
- ✅ 好友列表 (`pages/friend/list.vue`)

### 6. 待扩展页面

如需在其他页面启用头像同步，只需添加：

```typescript
import { useAvatarSync } from '@/composables/useAvatarSync';

// 根据数据结构选择配置
useAvatarSync(yourDataRef, { nestedUserField: 'user' });
```

### 7. 注意事项

- 确保数据是响应式的（ref/reactive）
- 数据结构需包含用户 ID 字段
- 组件卸载时会自动取消监听（onUnmounted）
- 支持数组或包含 list 属性的对象

## 测试验证

1. 进入个人资料页面上传新头像
2. 返回广场/首页/聊天列表/好友列表
3. 验证自己发布的帖子/消息/好友卡片中的头像已更新
4. 无需刷新页面或重新加载数据

## 相关文件

- `src/utils/event-bus.ts` - 事件总线
- `src/composables/useAvatarSync.ts` - 头像同步 Hook
- `src/stores/auth.ts` - 用户状态管理
- `src/pages/user/profile.vue` - 个人资料页面
