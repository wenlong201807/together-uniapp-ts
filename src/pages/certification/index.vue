<template>
  <view class="certification-container">
    <view class="cert-types" v-if="certTypes.length > 0">
      <view class="cert-type-item" v-for="type in certTypes" :key="type.code" @click="goToApply(type.code)">
        <view class="cert-icon">{{ type.icon || '📋' }}</view>
        <view class="cert-info">
          <text class="cert-name">{{ type.name }}</text>
          <text class="cert-desc">{{ type.description }}</text>
        </view>
        <text class="cert-arrow">›</text>
      </view>
    </view>
    <view class="empty" v-else>
      <text>暂无可用认证类型</text>
    </view>

    <view class="my-cert" v-if="myCerts?.length > 0">
      <view class="section-title">我的认证</view>
      <view class="cert-item" v-for="cert in myCerts" :key="cert.id">
        <view class="cert-info">
          <text class="cert-name">{{ getCertTypeName(cert.type) }}</text>
          <text class="cert-time">申请时间: {{ formatTime(cert.createdAt) }}</text>
        </view>
        <text class="cert-status" :class="['status-' + cert.status]">
          {{ getStatusText(cert.status) }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores'
import { certificationApi, type CertificationType, type Certification } from '@/api/modules/certification'

const authStore = useAuthStore()

const certTypes = ref<CertificationType[]>([])
const myCerts = ref<Certification[]>([])

onMounted(() => {
  if (!authStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.navigateBack()
    return
  }
  loadCertTypes()
  loadMyCerts()
})

const loadCertTypes = async () => {
  try {
    const res = await certificationApi.getTypes()
    certTypes.value = res.data.list
  } catch (error) {
    console.error('Failed to load cert types:', error)
  }
}

const loadMyCerts = async () => {
  try {
    const res = await certificationApi.getMyList()
    myCerts.value = res.data.list
  } catch (error) {
    console.error('Failed to load my certs:', error)
  }
}

const getCertTypeName = (code: string) => {
  const type = certTypes.value.find(t => t.code === code)
  return type?.name || code
}

const getStatusText = (status: number) => {
  const map = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
  return map[status as keyof typeof map] || '未知'
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const goToApply = (code: string) => {
  uni.navigateTo({
    url: `/pages/certification/apply?type=${code}`
  })
}
</script>

<style scoped lang="scss">
.certification-container {
  
  background: #f8f8f8;
  padding: 20rpx;

  .cert-types {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;

    .cert-type-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .cert-icon {
        width: 80rpx;
        height: 80rpx;
        background: #f0f0f0;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40rpx;
        margin-right: 20rpx;
      }

      .cert-info {
        flex: 1;

        .cert-name {
          display: block;
          font-size: 30rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }

        .cert-desc {
          font-size: 24rpx;
          color: #999;
        }
      }

      .cert-arrow {
        font-size: 36rpx;
        color: #999;
      }
    }
  }

  .empty {
    padding: 60rpx;
    text-align: center;
    color: #999;
    font-size: 28rpx;
  }

  .my-cert {
    margin-top: 30rpx;

    .section-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
      padding: 20rpx 0;
    }

    .cert-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx;
      background: #fff;
      border-radius: 16rpx;
      margin-bottom: 20rpx;

      .cert-info {
        .cert-name {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 8rpx;
        }

        .cert-time {
          font-size: 24rpx;
          color: #999;
        }
      }

      .cert-status {
        font-size: 26rpx;

        &.status-0 {
          color: #faad14;
        }

        &.status-1 {
          color: #52c41a;
        }

        &.status-2 {
          color: #ff4d4f;
        }
      }
    }
  }
}
</style>
