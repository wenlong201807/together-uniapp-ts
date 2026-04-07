# 头像功能完整实现方案

## 📋 需求概述

### 核心功能
1. **默认头像显示** - 使用雪碧图中的头像或自定义上传
2. **头像选择器** - 49 个预设头像（7×7 网格）
3. **自定义上传** - 支持用户上传自定义头像
4. **状态管理** - 保存选择的头像 ID 或上传路径
5. **接口集成** - 上传时根据选择类型发送不同字段

---

## 🏗️ 完整架构

### 1. 数据模型

```typescript
// types/avatar.ts
export interface AvatarOption {
  type: 'preset' | 'custom';  // 预设或自定义
  value: string;               // preset: 1-49, custom: 上传路径
  displayUrl: string;          // 显示用的完整 URL
}

export interface UserProfile {
  avatarType: 'preset' | 'custom';
  avatarValue: string;         // ID 或路径
  avatarUrl: string;           // 完整 URL
  nickname: string;
  mobile: string;
}
```

### 2. 状态管理

```typescript
// stores/avatar.ts
export const useAvatarStore = defineStore('avatar', () => {
  // 当前选择的头像
  const selectedAvatar = ref<AvatarOption>({
    type: 'preset',
    value: '1',
    displayUrl: ''
  });

  // 设置选择的头像
  const setSelectedAvatar = (avatar: AvatarOption) => {
    selectedAvatar.value = avatar;
  };

  // 获取头像显示 URL
  const getAvatarUrl = () => {
    if (selectedAvatar.value.type === 'preset') {
      return `sprite-avatar avatar-${selectedAvatar.value.value}`;
    }
    return selectedAvatar.value.displayUrl;
  };

  return {
    selectedAvatar,
    setSelectedAvatar,
    getAvatarUrl
  };
});
```

### 3. 样式文件

```scss
// styles/avatar.scss
.sprite-avatar {
  width: 100px;
  height: 100px;
  background-image: url('/static/images/avatars_sprite.png');
  background-size: 700% 700%;
  background-repeat: no-repeat;
  display: inline-block;
  border-radius: 50%;
}

@for $row from 1 through 7 {
  @for $col from 1 through 7 {
    $i: ($row - 1) * 7 + $col;
    .avatar-#{$i} {
      background-position: -(($col - 1) * 100%) -(($row - 1) * 100%);
    }
  }
}

.avatar-selector {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  padding: 20px;

  .avatar-item {
    position: relative;
    cursor: pointer;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid transparent;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.1);
    }

    &.selected {
      border-color: #007aff;
      box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
    }
  }
}
```

### 4. 组件结构

#### 4.1 AvatarDisplay.vue（显示组件）
```vue
<template>
  <view class="avatar-display" @click="showSelector">
    <!-- 预设头像 -->
    <view v-if="avatarStore.selectedAvatar.type === 'preset'" 
          :class="`sprite-avatar avatar-${avatarStore.selectedAvatar.value}`">
    </view>
    
    <!-- 自定义头像 -->
    <image v-else 
           :src="avatarStore.selectedAvatar.displayUrl"
           mode="aspectFill"
           class="custom-avatar">
    </image>
    
    <!-- 编辑按钮 -->
    <view class="edit-overlay">
      <text class="edit-icon">✏️</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAvatarStore } from '@/stores/avatar';

const avatarStore = useAvatarStore();
const emit = defineEmits(['select']);

const showSelector = () => {
  emit('select');
};
</script>
```

#### 4.2 AvatarSelector.vue（选择器组件）
```vue
<template>
  <view class="avatar-selector-modal">
    <!-- 标签页 -->
    <view class="tabs">
      <view class="tab-item" 
            :class="{ active: activeTab === 'preset' }"
            @click="activeTab = 'preset'">
        预设头像
      </view>
      <view class="tab-item" 
            :class="{ active: activeTab === 'custom' }"
            @click="activeTab = 'custom'">
        自定义上传
      </view>
    </view>

    <!-- 预设头像网格 -->
    <view v-if="activeTab === 'preset'" class="avatar-selector">
      <view v-for="i in 49" 
            :key="i"
            class="avatar-item"
            :class="{ selected: isSelected('preset', String(i)) }"
            @click="selectPreset(i)">
        <view :class="`sprite-avatar avatar-${i}`"></view>
      </view>
    </view>

    <!-- 自定义上传 -->
    <view v-else class="custom-upload">
      <view class="upload-area" @click="chooseImage">
        <text class="upload-icon">📤</text>
        <text class="upload-text">点击选择图片</text>
      </view>
      <image v-if="previewUrl" 
             :src="previewUrl"
             mode="aspectFill"
             class="preview-image">
      </image>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="btn-cancel" @click="handleCancel">取消</button>
      <button class="btn-confirm" @click="handleConfirm">确认</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAvatarStore } from '@/stores/avatar';

const avatarStore = useAvatarStore();
const emit = defineEmits(['confirm', 'cancel']);

const activeTab = ref<'preset' | 'custom'>('preset');
const previewUrl = ref('');
const tempSelection = ref<any>(null);

const selectPreset = (id: number) => {
  tempSelection.value = {
    type: 'preset',
    value: String(id),
    displayUrl: ''
  };
};

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      previewUrl.value = res.tempFilePaths[0];
      tempSelection.value = {
        type: 'custom',
        value: res.tempFilePaths[0],
        displayUrl: res.tempFilePaths[0]
      };
    }
  });
};

const isSelected = (type: string, value: string) => {
  return tempSelection.value?.type === type && tempSelection.value?.value === value;
};

const handleConfirm = () => {
  if (tempSelection.value) {
    avatarStore.setSelectedAvatar(tempSelection.value);
    emit('confirm', tempSelection.value);
  }
};

const handleCancel = () => {
  emit('cancel');
};
</script>
```

### 5. 页面集成

#### 5.1 profile.vue（个人资料页面）
```vue
<template>
  <view class="profile-container">
    <!-- 头像编辑区 -->
    <view class="avatar-section">
      <AvatarDisplay @select="showAvatarSelector" />
    </view>

    <!-- 其他信息编辑 -->
    <view class="form-section">
      <view class="form-item">
        <text class="label">昵称</text>
        <input v-model="formData.nickname" class="input" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="formData.mobile" class="input" />
      </view>
    </view>

    <!-- 保存按钮 -->
    <button class="save-btn" @click="handleSave">保存</button>

    <!-- 头像选择器弹窗 -->
    <AvatarSelector 
      v-if="showSelector"
      @confirm="handleAvatarConfirm"
      @cancel="showSelector = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAvatarStore } from '@/stores/avatar';
import AvatarDisplay from '@/components/business/AvatarDisplay.vue';
import AvatarSelector from '@/components/business/AvatarSelector.vue';

const authStore = useAuthStore();
const avatarStore = useAvatarStore();

const showSelector = ref(false);
const formData = reactive({
  nickname: authStore.userInfo?.nickname || '',
  mobile: authStore.userInfo?.mobile || ''
});

const handleAvatarConfirm = async (avatar: any) => {
  showSelector.value = false;
  
  // 如果是自定义上传，需要先上传文件
  if (avatar.type === 'custom') {
    await uploadCustomAvatar(avatar.value);
  }
};

const uploadCustomAvatar = async (filePath: string) => {
  try {
    const uploadRes = await new Promise((resolve, reject) => {
      uni.uploadFile({
        url: '/api/user/upload-avatar',
        filePath: filePath,
        name: 'avatar',
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      });
    });
    
    // 更新头像 URL
    const data = JSON.parse(uploadRes.data);
    avatarStore.selectedAvatar.displayUrl = data.avatarUrl;
  } catch (error) {
    uni.showToast({ title: '上传失败', icon: 'error' });
  }
};

const handleSave = async () => {
  try {
    const payload = {
      nickname: formData.nickname,
      mobile: formData.mobile,
      // 根据头像类型发送不同字段
      ...(avatarStore.selectedAvatar.type === 'preset' 
        ? { avatarId: avatarStore.selectedAvatar.value }
        : { avatarUrl: avatarStore.selectedAvatar.displayUrl }
      )
    };

    await authStore.updateProfile(payload);
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: '保存失败', icon: 'error' });
  }
};
</script>
```

### 6. API 接口

```typescript
// api/user.ts
export const userApi = {
  // 更新用户信息
  updateProfile: (data: {
    nickname?: string;
    mobile?: string;
    avatarId?: string;      // 预设头像 ID
    avatarUrl?: string;     // 自定义头像 URL
  }) => {
    return request.post('/user/profile', data);
  },

  // 上传头像
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return request.post('/user/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
```

### 7. 后端接口字段说明

```typescript
// 更新用户信息请求体
{
  nickname: string;
  mobile: string;
  avatarId?: string;        // 如果选择预设头像，发送 1-49
  avatarUrl?: string;       // 如果选择自定义头像，发送上传后的 URL
}

// 响应体
{
  code: 0;
  message: 'success';
  data: {
    userId: string;
    nickname: string;
    mobile: string;
    avatarUrl: string;      // 完整的头像 URL
    avatarType: 'preset' | 'custom';
    avatarValue: string;    // ID 或路径
  }
}
```

---

## 📁 文件清单

### 需要创建的文件
1. `/src/types/avatar.ts` - 类型定义
2. `/src/stores/avatar.ts` - 状态管理
3. `/src/styles/avatar.scss` - 样式文件
4. `/src/components/business/AvatarDisplay.vue` - 显示组件
5. `/src/components/business/AvatarSelector.vue` - 选择器组件

### 需要修改的文件
1. `/src/pages/tabbar/mine.vue` - 添加编辑入口
2. `/src/pages/user/profile.vue` - 集成头像功能
3. `/src/stores/auth.ts` - 添加 updateProfile 方法
4. `/src/api/user.ts` - 添加 API 接口

---

## 🔄 执行流程

### 用户交互流程
1. 用户点击头像 → 打开选择器
2. 选择预设头像或上传自定义 → 预览
3. 点击确认 → 保存到状态管理
4. 点击保存按钮 → 调用 API 更新
5. 后端返回完整 URL → 更新显示

### 数据流向
```
用户选择 → AvatarStore → 页面显示 → API 提交 → 后端保存 → 返回完整 URL → 更新显示
```

---

## ✅ 验收标准

- [ ] 预设头像正常显示（49 个）
- [ ] 可以选择预设头像
- [ ] 可以上传自定义头像
- [ ] 头像选择状态正确保存
- [ ] API 字段根据类型正确发送
- [ ] 头像更新后页面正确显示
- [ ] mine.vue 头像显示正确
- [ ] profile.vue 编辑功能完整

---

## 🚀 执行计划

### Agent 1: 类型和状态管理
- 创建 `/src/types/avatar.ts`
- 创建 `/src/stores/avatar.ts`

### Agent 2: 样式和组件
- 创建 `/src/styles/avatar.scss`
- 创建 `/src/components/business/AvatarDisplay.vue`
- 创建 `/src/components/business/AvatarSelector.vue`

### Agent 3: 页面集成
- 修改 `/src/pages/user/profile.vue`
- 修改 `/src/pages/tabbar/mine.vue`

### Agent 4: API 和状态管理
- 修改 `/src/stores/auth.ts`
- 修改或创建 `/src/api/user.ts`
