<template>
  <view class="interests-container">
    <!-- 顶部统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ interests.length }}</text>
        <text class="stat-label">已添加</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ 10 - interests.length }}</text>
        <text class="stat-label">还可添加</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ interests.length >= 3 ? '✓' : '✗' }}</text>
        <text class="stat-label">完成度</text>
      </view>
    </view>

    <!-- 提示信息 -->
    <view v-if="interests.length < 3" class="tips-card">
      <text class="tips-icon">💡</text>
      <view class="tips-content">
        <text class="tips-title">至少添加3个兴趣</text>
        <text class="tips-desc">完成后可获得积分奖励，提高匹配度</text>
      </view>
    </view>

    <!-- 兴趣列表 -->
    <view v-if="interests.length > 0" class="interests-list">
      <view class="list-header">
        <text class="list-title">我的兴趣（{{ interests.length }}）</text>
        <text v-if="!editMode" class="edit-btn" @tap="editMode = true">编辑</text>
        <text v-else class="done-btn" @tap="editMode = false">完成</text>
      </view>

      <view class="interest-items">
        <view
          v-for="interest in interests"
          :key="interest.id"
          class="interest-item"
          :class="{ 'edit-mode': editMode }"
        >
          <view class="interest-content">
            <view class="interest-header">
              <text class="interest-name">{{ interest.name }}</text>
              <text class="interest-category">{{ interest.category }}</text>
            </view>
            <view class="interest-level">
              <text
                v-for="i in 5"
                :key="i"
                class="level-star"
                :class="{ active: i <= interest.level }"
              >
                ★
              </text>
            </view>
          </view>
          <view v-if="editMode" class="interest-actions">
            <view class="action-btn delete" @tap="handleDelete(interest.id)">
              <text class="action-icon">🗑️</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">🎯</text>
      <text class="empty-title">还没有添加兴趣</text>
      <text class="empty-desc">添加兴趣可以让别人更了解你</text>
    </view>

    <!-- 添加按钮 -->
    <view class="add-button" @tap="showAddModal = true">
      <text class="add-icon">+</text>
      <text class="add-text">添加兴趣</text>
    </view>

    <!-- 添加兴趣弹窗 -->
    <view v-if="showAddModal" class="modal-overlay" @tap="showAddModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">添加兴趣</text>
          <text class="modal-close" @tap="showAddModal = false">✕</text>
        </view>

        <view class="modal-body">
          <!-- 分类选择 -->
          <view class="form-item">
            <text class="form-label">分类</text>
            <view class="category-options">
              <view
                v-for="cat in categories"
                :key="cat"
                class="category-option"
                :class="{ active: newInterest.category === cat }"
                @tap="newInterest.category = cat"
              >
                <text>{{ cat }}</text>
              </view>
            </view>
          </view>

          <!-- 兴趣名称 -->
          <view class="form-item">
            <text class="form-label">兴趣名称</text>
            <input
              v-model="newInterest.name"
              class="form-input"
              placeholder="例如：篮球、阅读、旅游"
              maxlength="20"
            />
          </view>

          <!-- 喜好程度 -->
          <view class="form-item">
            <text class="form-label">喜好程度</text>
            <view class="level-selector">
              <view
                v-for="i in 5"
                :key="i"
                class="level-item"
                @tap="newInterest.level = i"
              >
                <text
                  class="level-star"
                  :class="{ active: i <= newInterest.level }"
                >
                  ★
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="modal-footer">
          <button class="btn-cancel" @tap="showAddModal = false">取消</button>
          <button
            class="btn-confirm"
            :disabled="!canSubmit"
            @tap="handleAdd"
          >
            添加
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getInterests, addInterest, removeInterest } from '@/api/profile'
import type { UserInterest } from '@/api/profile'

// 兴趣列表
const interests = ref<UserInterest[]>([])

// 编辑模式
const editMode = ref(false)

// 添加弹窗
const showAddModal = ref(false)

// 新兴趣数据
const newInterest = ref({
  category: '运动',
  name: '',
  level: 3,
})

// 分类选项
const categories = ['运动', '音乐', '电影', '旅游', '美食', '阅读', '游戏', '艺术', '其他']

// 是否可以提交
const canSubmit = computed(() => {
  return newInterest.value.category && newInterest.value.name.trim().length > 0
})

// 加载兴趣列表
onMounted(async () => {
  await loadInterests()
})

const loadInterests = async () => {
  try {
    const res = await getInterests()
    interests.value = res.data
  } catch (error: any) {
    console.error('[Interests] 加载失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none',
    })
  }
}

// 添加兴趣
const handleAdd = async () => {
  if (!canSubmit.value) return

  try {
    await addInterest({
      category: newInterest.value.category,
      name: newInterest.value.name.trim(),
      level: newInterest.value.level,
    })

    uni.showToast({
      title: '添加成功',
      icon: 'success',
    })

    // 重置表单
    newInterest.value = {
      category: '运动',
      name: '',
      level: 3,
    }

    showAddModal.value = false

    // 重新加载列表
    await loadInterests()
  } catch (error: any) {
    console.error('[Interests] 添加失败:', error)
    uni.showToast({
      title: error.message || '添加失败',
      icon: 'none',
    })
  }
}

// 删除兴趣
const handleDelete = async (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个兴趣吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeInterest(id)

          uni.showToast({
            title: '删除成功',
            icon: 'success',
          })

          // 重新加载列表
          await loadInterests()
        } catch (error: any) {
          console.error('[Interests] 删除失败:', error)
          uni.showToast({
            title: error.message || '删除失败',
            icon: 'none',
          })
        }
      }
    },
  })
}
</script>

<style scoped lang="scss">
.interests-container {
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

// ========== 兴趣列表 ==========
.interests-list {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.list-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.edit-btn,
.done-btn {
  font-size: 28rpx;
  color: #667eea;
}

.interest-items {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.interest-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  transition: all 0.3s;

  &.edit-mode {
    padding-right: 16rpx;
  }
}

.interest-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.interest-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.interest-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.interest-category {
  padding: 4rpx 12rpx;
  background: #667eea;
  color: #fff;
  font-size: 22rpx;
  border-radius: 8rpx;
}

.interest-level {
  display: flex;
  gap: 4rpx;
}

.level-star {
  font-size: 28rpx;
  color: #ddd;

  &.active {
    color: #ffd700;
  }
}

.interest-actions {
  display: flex;
  gap: 8rpx;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;

  &.delete {
    background: #ffebee;
  }
}

.action-icon {
  font-size: 32rpx;
}

// ========== 空状态 ==========
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #666;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}

// ========== 添加按钮 ==========
.add-button {
  position: fixed;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 48rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}

.add-icon {
  font-size: 36rpx;
  color: #fff;
  font-weight: 300;
}

.add-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 500;
}

// ========== 弹窗 ==========
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  width: 680rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
}

.modal-body {
  padding: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.category-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.category-option {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border: 2rpx solid transparent;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.3s;

  &.active {
    background: #667eea;
    border-color: #667eea;
    color: #fff;
  }
}

.form-input {
  width: 100%;
  height: 68rpx;
  padding-left: 24rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.level-selector {
  display: flex;
  gap: 16rpx;
}

.level-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  border: none;

  &::after {
    border: none;
  }
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;

  &:disabled {
    opacity: 0.5;
  }
}
</style>
