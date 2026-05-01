<template>
  <view class="photos-container">
    <!-- 顶部统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ photos.length }}</text>
        <text class="stat-label">已上传</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ 20 - photos.length }}</text>
        <text class="stat-label">还可上传</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <view class="stat-value completion-icon" :class="{ 'completed': photos.length >= 3 }">
          <text v-if="photos.length >= 3" class="icon-check">✓</text>
          <text v-else class="icon-cross">✕</text>
        </view>
        <text class="stat-label">完成度</text>
      </view>
    </view>

    <!-- 提示信息 -->
    <view v-if="photos.length < 3" class="tips-card">
      <text class="tips-icon">💡</text>
      <view class="tips-content">
        <text class="tips-title">至少上传3张照片</text>
        <text class="tips-desc">真实照片可以提高匹配成功率</text>
      </view>
    </view>

    <!-- 照片网格 -->
    <view class="photos-grid">
      <!-- 已上传的照片 -->
      <view
        v-for="photo in photos"
        :key="photo.id"
        class="photo-item"
        @tap="handlePhotoTap(photo)"
      >
        <image v-img-proxy="photo.photoUrl" class="photo-image" mode="aspectFill" />
        <view v-if="photo.isAvatar" class="avatar-badge">
          <text class="badge-text">头像</text>
        </view>
        <view v-if="editMode" class="photo-actions">
          <view class="action-btn delete" @tap.stop="handleDelete(photo.id)">
            <text class="action-icon">✕</text>
          </view>
        </view>
      </view>

      <!-- 上传按钮 -->
      <view
        v-if="photos.length < 20"
        class="photo-item upload-btn"
        @tap="handleUpload"
      >
        <text class="upload-icon">+</text>
        <text class="upload-text">上传照片</text>
      </view>
    </view>

    <!-- 编辑按钮 -->
    <view v-if="photos.length > 0" class="edit-button">
      <button v-if="!editMode" class="btn-edit" @tap="editMode = true">
        编辑照片
      </button>
      <button v-else class="btn-done" @tap="editMode = false">
        完成
      </button>
    </view>

    <!-- 照片详情弹窗 -->
    <view v-if="showDetailModal" class="modal-overlay" @tap="showDetailModal = false">
      <view class="modal-content detail-modal" @tap.stop>
        <image
          v-img-proxy="selectedPhoto?.photoUrl"
          class="detail-image"
          mode="aspectFit"
        />
        <view class="detail-actions">
          <button
            v-if="!selectedPhoto?.isAvatar"
            class="btn-action primary"
            @tap="handleSetAvatar"
          >
            <text class="btn-icon">👤</text>
            <text class="btn-text">设为头像</text>
          </button>
          <button class="btn-action danger" @tap="handleDeleteFromDetail">
            <text class="btn-icon">✕</text>
            <text class="btn-text">删除照片</text>
          </button>
        </view>
        <view class="detail-close" @tap="showDetailModal = false">
          <text class="close-icon">✕</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPhotos, addPhoto, deletePhoto, setAvatar } from '@/api/profile'
import { uploadFile } from '@/api/modules/file'
import { useAuthStore } from '@/stores'
import { userApi } from '@/api'
import type { UserPhoto } from '@/api/profile'

const authStore = useAuthStore()

// 照片列表
const photos = ref<UserPhoto[]>([])

// 编辑模式
const editMode = ref(false)

// 详情弹窗
const showDetailModal = ref(false)
const selectedPhoto = ref<UserPhoto | null>(null)

// 加载照片列表
onMounted(async () => {
  await loadPhotos()
})

const loadPhotos = async () => {
  try {
    const res = await getPhotos()
    photos.value = res.data
  } catch (error: any) {
    console.error('[Photos] 加载失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    })
  }
}

// 上传照片
const handleUpload = () => {
  uni.chooseImage({
    count: 20 - photos.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths

      uni.showLoading({
        title: '上传中...',
        mask: true,
      })

      try {
        for (const filePath of tempFilePaths) {
          // 上传到七牛云
          const uploadRes = await uploadFile(filePath, { type: 'album' })

          // 添加照片记录
          await addPhoto({
            photoUrl: uploadRes.url,
            photoPath: uploadRes.filePath,
            category: '生活照',
            isPublic: true,
          })
        }

        uni.hideLoading()
        uni.showToast({
          title: '上传成功',
          icon: 'success',
        })

        // 重新加载列表
        await loadPhotos()
      } catch (error: any) {
        uni.hideLoading()
        console.error('[Photos] 上传失败:', error)
        uni.showToast({
          title: error.message || '上传失败',
          icon: 'none',
        })
      }
    },
  })
}

// 点击照片
const handlePhotoTap = (photo: UserPhoto) => {
  if (editMode.value) return

  selectedPhoto.value = photo
  showDetailModal.value = true
}

// 删除照片
const handleDelete = async (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这张照片吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deletePhoto(id)

          uni.showToast({
            title: '删除成功',
            icon: 'success',
          })

          // 重新加载列表
          await loadPhotos()
        } catch (error: any) {
          console.error('[Photos] 删除失败:', error)
          uni.showToast({
            title: error.message || '删除失败',
            icon: 'none',
          })
        }
      }
    },
  })
}

// 从详情页删除
const handleDeleteFromDetail = async () => {
  if (!selectedPhoto.value) return

  showDetailModal.value = false

  await handleDelete(selectedPhoto.value.id)
}

// 设为头像
const handleSetAvatar = async () => {
  if (!selectedPhoto.value) return

  console.log('[handleSetAvatar] 开始设置头像，照片ID:', selectedPhoto.value.id)
  console.log('[handleSetAvatar] 照片URL:', selectedPhoto.value.photoUrl)

  try {
    const setAvatarRes = await setAvatar(selectedPhoto.value.id)
    console.log('[handleSetAvatar] 设为头像API响应:', setAvatarRes)

    uni.showToast({
      title: '设置成功',
      icon: 'success',
    })

    showDetailModal.value = false

    // 重新加载照片列表
    await loadPhotos()

    // 刷新用户信息，同步头像到全局状态
    try {
      console.log('[handleSetAvatar] 开始刷新用户信息...')
      const userRes = await userApi.getCurrentUser()
      console.log('[handleSetAvatar] 获取用户信息API响应:', userRes)

      if (userRes.data) {
        console.log('[handleSetAvatar] 用户信息中的头像URL:', userRes.data.avatarUrl)
        console.log('[handleSetAvatar] 用户信息中的头像Path:', userRes.data.avatarPath)
        console.log('[handleSetAvatar] 更新前的authStore.userInfo:', authStore.userInfo)

        authStore.updateUserInfo(userRes.data)

        console.log('[handleSetAvatar] 更新后的authStore.userInfo:', authStore.userInfo)
        console.log('[handleSetAvatar] 头像更新成功')
      }
    } catch (error) {
      console.error('[Photos] 刷新用户信息失败:', error)
      // 刷新失败不影响主流程，只记录日志
    }
  } catch (error: any) {
    console.error('[Photos] 设置头像失败:', error)
    uni.showToast({
      title: error.message || '设置失败',
      icon: 'none',
    })
  }
}
</script>

<style scoped lang="scss">
.photos-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 120rpx;
}

// ========== 统计卡片 ==========
.stats-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.25);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

  &.completion-icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;

    &.completed {
      background: rgba(82, 196, 26, 0.3);
      box-shadow: 0 0 20rpx rgba(82, 196, 26, 0.4);
    }

    .icon-check {
      font-size: 40rpx;
      font-weight: 700;
      color: #fff;
    }

    .icon-cross {
      font-size: 36rpx;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.stat-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.stat-divider {
  width: 2rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.25);
}

// ========== 提示卡片 ==========
.tips-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 28rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  border-left: 6rpx solid #ff9800;
  box-shadow: 0 4rpx 16rpx rgba(255, 152, 0, 0.08);
}

.tips-icon {
  font-size: 44rpx;
  line-height: 1;
  margin-top: 4rpx;
}

.tips-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tips-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.tips-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

// ========== 照片网格 ==========
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-bottom: 140rpx; // 为底部按钮留出空间
}

.photo-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
  }
}

.photo-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.avatar-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  padding: 6rpx 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.badge-text {
  font-size: 22rpx;
  color: #fff;
  font-weight: 600;
}

.photo-actions {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10rpx);

  &.delete {
    background: rgba(255, 59, 48, 0.95);
  }

  &:active {
    transform: scale(0.9);
  }
}

.action-icon {
  font-size: 36rpx;
  color: #fff;
  font-weight: 300;
  line-height: 1;
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafbfc;
  border: 3rpx dashed #d0d7de;
  transition: all 0.3s ease;

  &:active {
    background: #f6f8fa;
    border-color: #667eea;
    transform: scale(0.95);
  }
}

.upload-icon {
  font-size: 56rpx;
  color: #667eea;
  margin-bottom: 12rpx;
  font-weight: 300;
}

.upload-text {
  font-size: 26rpx;
  color: #667eea;
  font-weight: 500;
}

// ========== 编辑按钮 ==========
.edit-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 80%, rgba(255, 255, 255, 0) 100%);
  backdrop-filter: blur(10rpx);
  z-index: 100;
}

.btn-edit,
.btn-done {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  padding: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
  }

  &::after {
    border: none;
  }
}

// ========== 详情弹窗 ==========
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(20rpx);
}

.detail-modal {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.detail-image {
  width: 100%;
  height: 80%;
  padding: 0 40rpx;
}

.detail-actions {
  display: flex;
  gap: 32rpx;
  margin-top: 64rpx;
  padding: 0 40rpx;
}

.btn-action {
  flex: 1;
  height: 88rpx;
  padding: 0 24rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
  backdrop-filter: blur(10rpx);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  white-space: nowrap;

  &:active {
    transform: scale(0.95);
  }

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &.danger {
    background: rgba(255, 59, 48, 0.95);
    color: #fff;
  }

  .btn-icon {
    font-size: 32rpx;
    line-height: 1;
    flex-shrink: 0;
  }

  .btn-text {
    font-size: 30rpx;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }

  &::after {
    border: none;
  }
}

.detail-close {
  position: absolute;
  top: 80rpx;
  right: 40rpx;
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.9);
    background: rgba(255, 255, 255, 0.25);
  }
}

.close-icon {
  font-size: 52rpx;
  color: #fff;
  font-weight: 300;
}
</style>
