# 用户详情页头像显示修复

## COT 思考链路

### 第一步：问题分析 ✅

**问题描述：**
- 用户详情页顶部的用户头像没有正确展示
- 动态列表中的用户头像可以正确显示
- 访问路径：`/#/pages/user/detail?id=18`

**现象对比：**
- ❌ 顶部头像：不显示或显示默认头像
- ✅ 动态列表头像：正确显示（包括预设 MBTI 头像）

### 第二步：根因分析 ✅

**代码对比：**

**❌ 用户详情页顶部（修复前）：**
```vue
<image
  class="avatar"
  :src="userInfo.avatarUrl || '/static/images/default-avatar.png'"
  mode="aspectFill"
/>
```

**问题：**
1. 只使用了 `userInfo.avatarUrl`
2. 没有处理 `userInfo.avatarId`（预设 MBTI 头像 1-16）
3. 当用户使用预设头像时，`avatarUrl` 为空，导致显示默认头像

**✅ 动态列表（PostCard 组件）：**
```vue
<Avatar
  :avatar-id="post.user?.avatarId"
  :avatar-url="post.user?.avatarUrl"
  size="medium"
/>
```

**正确原因：**
1. 使用了 `Avatar` 组件
2. 同时传入 `avatarId` 和 `avatarUrl`
3. `Avatar` 组件内部使用 `getAvatarDisplay()` 工具函数正确处理

**Avatar 组件逻辑：**
```typescript
// src/utils/avatar.ts
export function getAvatarDisplay(avatarId?: number, avatarUrl?: string) {
  // 1. 优先使用自定义头像
  if (avatarUrl) {
    return { type: 'custom', displayUrl: avatarUrl };
  }
  
  // 2. 使用预设 MBTI 头像 (1-16)
  if (avatarId && avatarId >= 1 && avatarId <= 16) {
    const mbtiAvatar = getMbtiAvatarById(avatarId);
    return { type: 'preset', icon: mbtiAvatar.icon };
  }
  
  // 3. 默认头像
  return { type: 'custom', displayUrl: '/static/images/default-avatar.png' };
}
```

### 第三步：修复方案 ✅

**解决方案：**
使用 `Avatar` 组件替换 `<image>` 标签，统一头像显示逻辑。

**修改内容：**

#### 1. 模板部分
```vue
<!-- 修复前 -->
<image
  class="avatar"
  :src="userInfo.avatarUrl || '/static/images/default-avatar.png'"
  mode="aspectFill"
/>

<!-- 修复后 -->
<Avatar
  :avatar-id="userInfo.avatarId"
  :avatar-url="userInfo.avatarUrl"
  size="large"
  class="avatar"
/>
```

#### 2. 导入 Avatar 组件
```typescript
import Avatar from '@/components/common/Avatar.vue';
```

#### 3. 调整样式
```scss
.avatar {
  // 移除固定尺寸，由 Avatar 组件的 size 属性控制
  // width: 120rpx;
  // height: 120rpx;
  // border-radius: 50%;
  // background: #f0f0f0;
  
  // 只保留布局相关样式
  margin-right: 24rpx;
  flex-shrink: 0;
}
```

**Avatar 组件的 size 属性：**
- `size="small"`: 60rpx × 60rpx
- `size="medium"`: 80rpx × 80rpx
- `size="large"`: 120rpx × 120rpx（用户详情页顶部）

### 第四步：验证测试 ✅

**测试场景：**

1. **预设 MBTI 头像（avatarId: 1-16）**
   - 应该显示对应的 emoji 图标
   - 背景为紫色渐变
   - 例如：INTJ 显示 🏛️

2. **自定义头像（avatarUrl）**
   - 应该显示用户上传的图片
   - 圆形裁剪

3. **默认头像**
   - 当 avatarId 和 avatarUrl 都为空时
   - 显示默认头像图片

**测试步骤：**
1. 访问使用预设头像的用户详情页
2. 访问使用自定义头像的用户详情页
3. 对比顶部头像和动态列表头像是否一致

## 修改文件清单

### 修改的文件
1. **`src/pages/user/detail.vue`**
   - 模板：使用 `Avatar` 组件替换 `<image>` 标签
   - 脚本：导入 `Avatar` 组件
   - 样式：移除固定尺寸，保留布局样式

### 相关文件（无需修改）
1. **`src/components/common/Avatar.vue`** - Avatar 组件
2. **`src/utils/avatar.ts`** - 头像处理工具函数
3. **`src/components/business/PostCard.vue`** - 动态卡片组件（参考实现）

## 技术要点

### 1. Avatar 组件的优势
- ✅ 统一处理预设头像和自定义头像
- ✅ 自动处理 MBTI emoji 图标显示
- ✅ 响应式尺寸控制
- ✅ 统一的样式和交互

### 2. 头像显示优先级
```
1. avatarUrl（自定义头像）
   ↓
2. avatarId（预设 MBTI 头像 1-16）
   ↓
3. 默认头像
```

### 3. MBTI 头像配置
```typescript
// 16 种 MBTI 类型
const MBTI_AVATARS = [
  { id: 1, type: 'INTJ', name: '建筑师', icon: '🏛️' },
  { id: 2, type: 'INTP', name: '逻辑学家', icon: '🧠' },
  // ... 种
];
```

## 代码对比

### 修复前
```vue
<template>
  <view class="user-header">
    <image
      class="avatar"
      :src="userInfo.avatarUrl || '/static/images/default-avatar.png'"
      mode="aspectFill"
    />
    <!-- ... -->
  </view>
</template>

<script setup lang="ts">
// 没有导入 Avatar 组件
</script>

<style scoped lang="scss">
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #f0f0f0;
}
</style>
```

### 修复后
```vue
<template>
  <view class="user-header">
    <Avatar
      :avatar-id="userInfo.avatarId"
      :avatar-url="userrl"
      size="large"
      class="avatar"
    />
    <!-- ... -->
  </view>
</template>

<script setup lang="ts">
import Avatar from '@/components/common/Avatar.vue';
</script>

<style scoped lang="scss">
.avatar {
  margin-right: 24rpx;
  flex-shrink: 0;
}
</style>
```

## 总结

✅ 使用 COT 方法完成问题分析和修复
✅ 找到根因：未使用 Avatar 组件处理预设头像
✅ 统一头像显示逻辑：顶部和动态列表都使用 Avatar 组件
✅ 支持预设 MBTI 头像（1-16）和自定义头像
✅ 保持样式一致性和响应式布局

用户详情页头像显示问题已完全修复！🎉
