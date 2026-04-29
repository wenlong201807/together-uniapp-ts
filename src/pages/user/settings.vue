<template>
  <view class="settings-container">
    <view class="settings-list">
      <view class="settings-item">
        <text class="settings-label">版本</text>
        <text class="settings-value">1.0.0</text>
      </view>
      <view class="settings-item" @click="clearCache">
        <text class="settings-label">清除缓存</text>
        <text class="settings-arrow">›</text>
      </view>
      <view class="settings-item" @click="showContactService">
        <text class="settings-label">联系客服</text>
        <text class="settings-arrow">›</text>
      </view>
      <view class="settings-item" @click="showAbout">
        <text class="settings-label">关于我们</text>
        <text class="settings-arrow">›</text>
      </view>
    </view>

    <!-- 联系客服弹框 -->
    <view v-if="showServiceModal" class="modal-overlay" @click="closeServiceModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">联系客服</text>
          <text class="modal-close" @click="closeServiceModal">✕</text>
        </view>
        <view class="modal-body">
          <text class="modal-tip">扫描下方二维码添加客服微信</text>
          <image
            class="qrcode-image"
            src="/static/images/wechat-qrcode.jpeg"
            mode="aspectFit"
          />
          <text class="modal-desc">工作时间：9:00 - 18:00</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const showServiceModal = ref(false)

const clearCache = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.showToast({
          title: '缓存已清除',
          icon: 'success'
        })
      }
    }
  })
}

const showContactService = () => {
  showServiceModal.value = true
}

const closeServiceModal = () => {
  showServiceModal.value = false
}

const showAbout = () => {
  uni.showModal({
    title: '关于我们',
    content: 'WeTogether - 遇见美好，从这里开始',
    showCancel: false
  })
}
</script>

<style scoped lang="scss">
.settings-container {
  background: #f8f8f8;

  .settings-list {
    background: #fff;
    margin-bottom: 20rpx;

    .settings-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .settings-label {
        font-size: 28rpx;
        color: #333;
      }

      .settings-value {
        font-size: 28rpx;
        color: #999;
      }

      .settings-arrow {
        font-size: 36rpx;
        color: #999;
      }
    }
  }

  // 联系客服弹框样式
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

    .modal-content {
      width: 600rpx;
      background: #fff;
      border-radius: 24rpx;
      overflow: hidden;

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 32rpx 40rpx;
        border-bottom: 1rpx solid #f0f0f0;

        .modal-title {
          font-size: 32rpx;
          font-weight: 600;
          color: #333;
        }

        .modal-close {
          font-size: 40rpx;
          color: #999;
          line-height: 1;
        }
      }

      .modal-body {
        padding: 40rpx;
        display: flex;
        flex-direction: column;
        align-items: center;

        .modal-tip {
          font-size: 28rpx;
          color: #666;
          margin-bottom: 32rpx;
        }

        .qrcode-image {
          width: 400rpx;
          height: 400rpx;
          border-radius: 16rpx;
          margin-bottom: 32rpx;
        }

        .modal-desc {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
}
</style>