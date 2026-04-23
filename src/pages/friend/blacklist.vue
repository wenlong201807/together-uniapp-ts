<template>
  <view class="blacklist-container">
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
      <Empty v-if="!loading && blacklist.length === 0" text="暂无黑名单" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { friendApi } from '@/api/modules/friend'
import Loading from '@/components/common/Loading.vue'
import Empty from '@/components/common/Empty.vue'

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
  } catch (error) {
    console.error('Load blacklist error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const handleUnblock = (item: any) => {
  uni.showModal({
    title: '确认移除',
    content: `确定要将 ${item.user?.nickname} 移出黑名单吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await friendApi.unblockUser(item.blockedUserId)
          uni.showToast({
            title: '已移除',
            icon: 'success'
          })
          // 刷新列表
          await loadBlacklist()
        } catch (error: any) {
          console.error('Unblock error:', error)
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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
</script>

<style scoped lang="scss">
.blacklist-container {
  min-height: 100vh;
  background: #f8f8f8;

  .blacklist-list {
    padding: 20rpx;

    .blacklist-item {
      display: flex;
      align-items: center;
      padding: 24rpx;
      background: #fff;
      border-radius: 16rpx;
      margin-bottom: 20rpx;

      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
        background: #f0f0f0;
        flex-shrink: 0;
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .nickname {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
        }

        .reason {
          font-size: 24rpx;
          color: #666;
          line-height: 1.4;
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

        &::after {
          border: none;
        }

        &:active {
          opacity: 0.8;
        }
      }
    }
  }
}
</style>
