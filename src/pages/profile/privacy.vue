<template>
  <view class="privacy-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>

    <template v-else>
      <!-- 信息可见性设置 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">信息可见性</text>
          <text class="section-desc">控制谁可以看到你的个人信息</text>
        </view>

        <view class="setting-items">
          <view
            v-for="item in visibilitySettings"
            :key="item.key"
            class="setting-item"
            @tap="showVisibilityPicker(item)"
          >
            <view class="setting-info">
              <text class="setting-label">{{ item.label }}</text>
              <text class="setting-value">{{ getVisibilityLabel(settings[item.key]) }}</text>
            </view>
            <text class="setting-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 互动权限设置 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">互动权限</text>
          <text class="section-desc">管理其他用户与你的互动方式</text>
        </view>

        <view class="setting-items">
          <view
            v-for="item in permissionSettings"
            :key="item.key"
            class="setting-item"
          >
            <view class="setting-info">
              <text class="setting-label">{{ item.label }}</text>
              <text class="setting-hint">{{ item.hint }}</text>
            </view>
            <switch
              :checked="settings[item.key]"
              color="#667eea"
              @change="handleSwitchChange(item.key, $event)"
            />
          </view>
        </view>
      </view>

      <!-- 黑名单管理 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">黑名单管理</text>
          <text class="section-desc">管理已拉黑的用户</text>
        </view>

        <view v-if="blacklist.length > 0" class="blacklist-items">
          <view
            v-for="item in blacklist"
            :key="item.id"
            class="blacklist-item"
          >
            <image :src="item.blockedUser.avatar" class="user-avatar" mode="aspectFill" />
            <view class="user-info">
              <text class="user-name">{{ item.blockedUser.nickname }}</text>
              <text class="user-meta">
                {{ item.blockedUser.age ? `${item.blockedUser.age}岁` : '' }}
                {{ item.blockedUser.city ? ` · ${item.blockedUser.city}` : '' }}
              </text>
            </view>
            <view class="remove-btn" @tap="handleRemoveBlacklist(item)">
              <text class="remove-text">移除</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-icon">🎉</text>
          <text class="empty-title">黑名单为空</text>
          <text class="empty-desc">暂无拉黑的用户</text>
        </view>
      </view>
    </template>

    <!-- 可见性选择器 -->
    <picker
      v-if="showPicker"
      :value="pickerIndex"
      :range="visibilityOptions"
      range-key="label"
      @change="handlePickerChange"
      @cancel="showPicker = false"
    >
      <view />
    </picker>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getPrivacySettings,
  updatePrivacySettings,
  getBlacklist,
  removeFromBlacklist,
  type PrivacySettings,
  type BlacklistUser,
  type VisibilityLevel,
} from '@/api/profile'

// 隐私设置
const settings = ref<PrivacySettings>({
  id: 0,
  userId: 0,
  basicInfoVisibility: 'friends',
  contactVisibility: 'friends',
  incomeVisibility: 'private',
  familyVisibility: 'friends',
  photoVisibility: 'friends',
  locationVisibility: 'certified',
  allowSearch: true,
  allowRecommend: true,
  allowStrangerMessage: false,
  onlyCertifiedUser: false,
  createdAt: '',
  updatedAt: '',
})

// 黑名单列表
const blacklist = ref<BlacklistUser[]>([])

// 加载状态
const loading = ref(true)

// 选择器相关
const showPicker = ref(false)
const pickerIndex = ref(0)
const currentPickerItem = ref<any>(null)

// 可见性选项
const visibilityOptions = [
  { value: 'public', label: '所有人可见' },
  { value: 'friends', label: '好友可见' },
  { value: 'certified', label: '认证用户可见' },
  { value: 'private', label: '仅自己可见' },
]

// 信息可见性配置
const visibilitySettings = [
  { key: 'basicInfoVisibility', label: '基础信息' },
  { key: 'contactVisibility', label: '联系方式' },
  { key: 'incomeVisibility', label: '收入信息' },
  { key: 'familyVisibility', label: '家庭背景' },
  { key: 'photoVisibility', label: '照片相册' },
  { key: 'locationVisibility', label: '位置信息' },
]

// 互动权限配置
const permissionSettings = [
  { key: 'allowSearch', label: '允许被搜索', hint: '其他用户可以通过搜索找到你' },
  { key: 'allowRecommend', label: '允许被推荐', hint: '系统可以将你推荐给其他用户' },
  { key: 'allowStrangerMessage', label: '允许陌生人发消息', hint: '非好友用户可以给你发送消息' },
  { key: 'onlyCertifiedUser', label: '只接受认证用户', hint: '只有认证用户可以与你互动' },
]

// 获取可见性标签
const getVisibilityLabel = (value: VisibilityLevel) => {
  const option = visibilityOptions.find((opt) => opt.value === value)
  return option?.label || '未设置'
}

// 显示可见性选择器
const showVisibilityPicker = (item: any) => {
  currentPickerItem.value = item
  const currentValue = settings.value[item.key as keyof PrivacySettings]
  pickerIndex.value = visibilityOptions.findIndex((opt) => opt.value === currentValue)
  showPicker.value = true

  // 触发picker显示
  uni.showActionSheet({
    itemList: visibilityOptions.map((opt) => opt.label),
    success: (res) => {
      handlePickerConfirm(res.tapIndex)
    },
  })
}

// 处理选择器确认
const handlePickerConfirm = async (index: number) => {
  if (!currentPickerItem.value) return

  const selectedOption = visibilityOptions[index]
  const key = currentPickerItem.value.key as keyof PrivacySettings

  // 更新本地状态
  ;(settings.value as any)[key] = selectedOption.value

  // 保存到服务器
  await saveSettings({ [key]: selectedOption.value })

  showPicker.value = false
  currentPickerItem.value = null
}

// 处理选择器变化（兼容picker组件）
const handlePickerChange = (e: any) => {
  handlePickerConfirm(e.detail.value)
}

// 处理开关变化
const handleSwitchChange = async (key: string, e: any) => {
  const value = e.detail.value

  // 更新本地状态
  ;(settings.value as any)[key] = value

  // 保存到服务器
  await saveSettings({ [key]: value })
}

// 保存设置
const saveSettings = async (data: Partial<PrivacySettings>) => {
  try {
    await updatePrivacySettings(data)
    uni.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500,
    })
  } catch (error: any) {
    console.error('[Privacy] 保存失败:', error)
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none',
    })
    // 重新加载设置
    await loadSettings()
  }
}

// 移除黑名单
const handleRemoveBlacklist = (item: BlacklistUser) => {
  uni.showModal({
    title: '确认移除',
    content: `确定要将 ${item.blockedUser.nickname} 移出黑名单吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeFromBlacklist(item.blockedUserId)

          uni.showToast({
            title: '移除成功',
            icon: 'success',
          })

          // 重新加载黑名单
          await loadBlacklist()
        } catch (error: any) {
          console.error('[Privacy] 移除失败:', error)
          uni.showToast({
            title: error.message || '移除失败',
            icon: 'none',
          })
        }
      }
    },
  })
}

// 加载隐私设置
const loadSettings = async () => {
  try {
    const res = await getPrivacySettings()
    settings.value = res.data
  } catch (error: any) {
    console.error('[Privacy] 加载设置失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    })
  }
}

// 加载黑名单
const loadBlacklist = async () => {
  try {
    const res = await getBlacklist()
    blacklist.value = res.data
  } catch (error: any) {
    console.error('[Privacy] 加载黑名单失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    })
  }
}

// 初始化
onMounted(async () => {
  loading.value = true
  await Promise.all([loadSettings(), loadBlacklist()])
  loading.value = false
})
</script>

<style scoped lang="scss">
.privacy-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
}

// ========== 加载状态 ==========
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.loading-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

// ========== 区块卡片 ==========
.section-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.section-desc {
  font-size: 24rpx;
  color: #999;
}

// ========== 设置项 ==========
.setting-items {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.setting-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.setting-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.setting-value {
  font-size: 26rpx;
  color: #667eea;
}

.setting-hint {
  font-size: 24rpx;
  color: #999;
}

.setting-arrow {
  font-size: 48rpx;
  color: #ddd;
  font-weight: 300;
  margin-left: 16rpx;
}

// ========== 黑名单列表 ==========
.blacklist-items {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.blacklist-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
}

.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  margin-right: 24rpx;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.user-meta {
  font-size: 24rpx;
  color: #999;
}

.remove-btn {
  padding: 12rpx 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32rpx;
}

.remove-text {
  font-size: 26rpx;
  color: #fff;
}

// ========== 空状态 ==========
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #666;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}
</style>
