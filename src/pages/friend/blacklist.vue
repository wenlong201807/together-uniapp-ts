<template>
  <view class="blacklist-container">
    <!-- 顶部提示 -->
    <view v-if="!loading && blacklist.length > 0" class="tip-banner">
      <text class="tip-icon">ℹ️</text>
      <text class="tip-text">拉黑后将无法看到对方的动态和消息</text>
    </view>

    <view class="blacklist-list">
      <view
        v-for="item in blacklist"
        :key="item.id"
        class="blacklist-item"
      >
        <image
          class="avatar"
          :src="item.user?.avatarUrl || '/static/images/default-avatar.png'"
          mode="aspectFill"
          @click="goToUserDetail(item.user?.id)"
        />
        <view class="user-info">
          <text class="nickname">{{ item.user?.nickname }}</text>
          <text v-if="item.reason" class="reason">原因：{{ item.reason }}</text>
          <text class="time">{{ formatTime(item.createdAt) }}</text>
        </view>
        <button class="action-btn" @click.stop="handleUnblock(item)">
          <text>移除</text>
        </button>
      </view>

      <Loading v-if="loading" text="加载中..." />
      <Empty v-if="!loading && blacklist.length === 0" text="暂无黑名单" description="拉黑的用户会显示在这里" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { friendApi } from '@/api/modules/friend'
import { useFriendStore } from '@/stores'
import Loading from '@/components/common/Loading.vue'
import Empty from '@/components/common/Empty.vue'

const friendStore = useFriendStore()
const blacklist = ref<any[]>([])
const loading = ref(false)

onMounted(async () => {
  await loadBlacklist()
})

const loadBlacklist = async () => {
  loading.value = true
  try {
    const res = await friendApi.getBlocklist()
    blacklist.value = res.data.data || res.data || []
    console.log('[Blacklist] 加载成功:', blacklist.value)
  } catch (error: any) {
    console.error('[Blacklist] 加载失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const handleUnblock = (item: any) => {
  uni.showModal({
    title: '确认移除',
    content: `确定要将 ${item.user?.nickname} 移出黑名单吗？移除后可以重新看到对方的动态。`,
    confirmText: '移除',
    confirmColor: '#52c41a',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...', mask: true })
          await friendApi.unblockUser(item.blockedUserId)
          uni.hideLoading()

          uni.showToast({
            title: '已移除',
            icon: 'success'
          })

          // 刷新列表
          await loadBlacklist()

          // 同时刷新 store 中的黑名单数据
          await friendStore.fetchBlocklist()
        } catch (error: any) {
          uni.hideLoading()
          console.error('[Blacklist] 移除失败:', error)
          uni.showToast({
            title: error.message || '操作失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

const goToUserDetail = (userId: number) => {
  if (!userId) return
  uni.navigateTo({
    url: `/pages/user/detail?id=${userId}`
  })
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 1分钟内
  if (diff < 60000) {
    return '刚刚'
  }
  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 24小时内
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 7天内
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }

  // 超过7天显示完整日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hour}:${minute}`
  }

  return `${year}-${month}-${day} ${hour}:${minute}`
}
</script>

<style scoped lang="scss">
.blacklist-container {
  min-height: 100vh;
  background: #f8f8f8;

  .tip-banner {
    display: flex;
    align-items: center;
    padding: 20rpx 32rpx;
    background: #fff3cd;
    margin: 20rpx 20rpx 0;
    border-radius: 12rpx;
    border-left: 4rpx solid #ffc107;

    .tip-icon {
      font-size: 28rpx;
      margin-right: 12rpx;
    }

    .tip-text {
      flex: 1;
      font-size: 24rpx;
      color: #856404;
      line-height: 1.5;
    }
  }

  .blacklist-list {
    padding: 20rpx;

    .blacklist-item {
      display: flex;
      align-items: center;
      padding: 24rpx;
      background: #fff;
      border-radius: 16rpx;
      margin-bottom: 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
      transition: all 0.3s;

      &:active {
        transform: scale(0.98);
        box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.08);
      }

      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
        background: #f0f0f0;
        flex-shrink: 0;
        border: 2rpx solid #f0f0f0;
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        min-width: 0;

        .nickname {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .reason {
          font-size: 24rpx;
          color: #666;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .time {
          font-size: 22rpx;
          color: #999;
        }
      }

      .action-btn {
        padding: 12rpx 24rpx;
        background: #52c41a;
        color: #fff;
        border-radius: 24rpx;
        font-size: 24rpx;
        border: none;
        line-height: 1;
        flex-shrink: 0;
        transition: all 0.3s;

        &::after {
          border: none;
        }

        &:active {
          opacity: 0.8;
          transform: scale(0.95);
        }
      }
    }
  }
}
</style>
