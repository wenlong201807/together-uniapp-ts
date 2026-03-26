<template>
  <view class="points-container">
    <view class="points-header">
      <text class="label">当前积分</text>
      <text class="value">{{ pointsStore.balance.balance || 0 }}</text>
      <view class="stats">
        <view class="stat-item">
          <text class="stat-value">{{ pointsStore.balance.totalEarned || 0 }}</text>
          <text class="stat-label">累计获得</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ pointsStore.balance.totalConsumed || 0 }}</text>
          <text class="stat-label">累计消费</text>
        </view>
      </view>
    </view>

    <view class="sign-section">
      <view class="sign-status">
        <text v-if="pointsStore.signStatus.signedToday" class="signed-text">今日已签到</text>
        <text v-else class="unsign-text">今日未签到</text>
        <text class="continuous-text">连续 {{ pointsStore.signStatus.continuousDays }} 天</text>
      </view>
      <button class="sign-btn" :disabled="pointsStore.signStatus.signedToday" @click="handleSign">
        {{ pointsStore.signStatus.signedToday ? '已签到' : '立即签到' }}
      </button>
    </view>

    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 0 }" @click="activeTab = 0">
        <text>全部</text>
      </view>
      <view class="tab" :class="{ active: activeTab === 1 }" @click="activeTab = 1">
        <text>收入</text>
      </view>
      <view class="tab" :class="{ active: activeTab === 2 }" @click="activeTab = 2">
        <text>支出</text>
      </view>
    </view>

    <view class="logs-list">
      <view class="log-item" v-for="log in pointsStore.logs" :key="log.id">
        <view class="log-info">
          <text class="log-source">{{ log.source || log.remark }}</text>
          <text class="log-time">{{ formatTime(log.createdAt) }}</text>
        </view>
        <text class="log-amount" :class="{ income: log.type === 1, expense: log.type === 2 }">
          {{ log.type === 1 ? '+' : '-' }}{{ log.amount }}
        </text>
      </view>
      <view class="empty" v-if="pointsStore.logs.length === 0">
        <text>暂无记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore, usePointsStore } from '@/stores'

const authStore = useAuthStore()
const pointsStore = usePointsStore()

const activeTab = ref(0)

onMounted(() => {
  if (!authStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.navigateBack()
    return
  }
  pointsStore.fetchBalance()
  pointsStore.fetchSignStatus()
  loadLogs()
})

const loadLogs = (type?: number) => {
  const typeMap = [undefined, 1, 2]
  pointsStore.fetchLogs(1, 20, typeMap[activeTab.value])
}

watch(activeTab, () => {
  loadLogs()
})

const handleSign = async () => {
  if (pointsStore.signStatus.signedToday) {
    uni.showToast({ title: '今日已签到', icon: 'none' })
    return
  }
  const result = await pointsStore.sign()
  if (result) {
    uni.showToast({ title: `签到成功，获得 ${result.pointsEarned} 积分`, icon: 'success' })
  }
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.points-container {
  min-height: 100vh;
  background: #f8f8f8;

  .points-header {
    padding: 60rpx 40rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    text-align: center;

    .label {
      display: block;
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 16rpx;
    }

    .value {
      display: block;
      font-size: 80rpx;
      font-weight: bold;
      color: #fff;
      margin-bottom: 30rpx;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 80rpx;

      .stat-item {
        .stat-value {
          display: block;
          font-size: 32rpx;
          font-weight: bold;
          color: #fff;
          margin-bottom: 8rpx;
        }

        .stat-label {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.7);
        }
      }
    }
  }

  .sign-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx 40rpx;
    background: #fff;
    margin-bottom: 20rpx;

    .sign-status {
      .signed-text {
        font-size: 28rpx;
        color: #52c41a;
        margin-right: 20rpx;
      }

      .unsign-text {
        font-size: 28rpx;
        color: #ff4d4f;
        margin-right: 20rpx;
      }

      .continuous-text {
        font-size: 24rpx;
        color: #999;
      }
    }

    .sign-btn {
      padding: 16rpx 40rpx;
      background: #667eea;
      color: #fff;
      border-radius: 30rpx;
      font-size: 26rpx;

      &[disabled] {
        background: #ccc;
      }
    }
  }

  .tabs {
    display: flex;
    background: #fff;
    padding: 0 40rpx;
    margin-bottom: 2rpx;

    .tab {
      flex: 1;
      text-align: center;
      padding: 24rpx 0;
      font-size: 28rpx;
      color: #666;
      position: relative;

      &.active {
        color: #667eea;
        font-weight: bold;

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60rpx;
          height: 4rpx;
          background: #667eea;
          border-radius: 2rpx;
        }
      }
    }
  }

  .logs-list {
    background: #fff;

    .log-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;

      .log-info {
        .log-source {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 8rpx;
        }

        .log-time {
          font-size: 24rpx;
          color: #999;
        }
      }

      .log-amount {
        font-size: 32rpx;
        font-weight: bold;

        &.income {
          color: #52c41a;
        }

        &.expense {
          color: #ff4d4f;
        }
      }
    }

    .empty {
      padding: 60rpx 0;
      text-align: center;
      color: #999;
      font-size: 28rpx;
    }
  }
}
</style>
