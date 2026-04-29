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
        <text class="stat-value">{{ photos.length >= 3 ? '✓' : '✗' }}</text>
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
        <image :src="ensureHttps(photo.photoUrl)" class="photo-image" mode="aspectFill" />
        <view v-if="photo.isAvatar" class="avatar-badge">
          <text class="badge-text">头像</text>
        </view>
        <view v-if="editMode" class="photo-actions">
          <view class="action-btn delete" @tap.stop="handleDelete(photo.id)">
            <text class="action-icon">🗑️</text>
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
          :src="ensureHttps(selectedPhoto?.photoUrl)"
          class="detail-image"
          mode="aspectFit"
        />
        <view class="detail-actions">
          <button
            v-if="!selectedPhoto?.isAvatar"
            class="btn-action"
            @tap="handleSetAvatar"
          >
            设为头像
          </button>
          <button class="btn-action danger" @tap="handleDeleteFromDetail">
            删除照片
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
import { ensureHttps } from '@/utils/image'
import type { UserPhoto } from '@/api/profile'

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

  try {
    await setAvatar(selectedPhoto.value.id)

    uni.showToast({
      title: '设置成功',
      icon: 'success',
    })

    showDetailModal.value = false

    // 重新加载列表
    await loadPhotos()
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
  padding: 32rpx;
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 600;
  color: #667eea;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #f0f0f0;
}

// ========== 提示卡片 ==========
.tips-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.tips-icon {
  font-size: 40rpx;
}

.tips-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.tips-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #e65100;
}

.tips-desc {
  font-size: 24rpx;
  color: #f57c00;
}

// ========== 照片网格 ==========
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.photo-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
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
  top: 8rpx;
  right: 8rpx;
  padding: 4rpx 12rpx;
  background: rgba(102, 126, 234, 0.9);
  border-radius: 8rpx;
}

.badge-text {
  font-size: 20rpx;
  color: #fff;
}

.photo-actions {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
}

.action-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;

  &.delete {
    background: rgba(255, 59, 48, 0.9);
  }
}

.action-icon {
  font-size: 28rpx;
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 2rpx dashed #ddd;
}

.upload-icon {
  font-size: 48rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

// ========== 编辑按钮 ==========
.edit-button {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
}

.btn-edit,
.btn-done {
  padding: 24rpx 48rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 30rpx;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);

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
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
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
}

.detail-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 48rpx;
}

.btn-action {
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 26rpx;
  border-radius: 32rpx;
  border: none;
  min-width: 160rpx;

  &.danger {
    background: rgba(255, 59, 48, 0.9);
    color: #fff;
  }

  &::after {
    border: none;
  }
}

.detail-close {
  position: absolute;
  top: 80rpx;
  right: 40rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.close-icon {
  font-size: 48rpx;
  color: #fff;
}
</style>
