<template>
  <view class="following-list-container">
    <view class="following-list">
      <view
        v-for="friend in followingList"
        :key="friend.friendId"
        class="friend-item"
        @click="goToUserDetail(friend.friendId)"
      >
        <image class="avatar" :src="friend.user?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill" />
        <view class="friend-info">
          <text class="nickname">{{ friend.user?.nickname }}</text>
        </view>
        <view v-if="isSelf" class="action-btn" @click.stop="handleUnfollow(friend)">
          <text>取消关注</text>
        </view>
      </view>

      <Loading v-if="loading" text="加载中..." />
      <Empty v-if="!loading && followingList.length === 0" text="暂无关注" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { friendApi } from '@/api/modules/friend'
import { useAuthStore } from '@/stores'
import Loading from '@/components/common/Loading.vue'
import Empty from '@/components/common/Empty.vue'

const authStore = useAuthStore()
const followingList = ref<any[]>([])
const loading = ref(false)
const targetUserId = ref<number>(0)

const isSelf = computed(() => {
  return targetUserId.value === authStore.userInfo?.id || targetUserId.value === 0
})

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options

  targetUserId.value = options.userId ? parseInt(options.userId) : authStore.userInfo?.id || 0

  await loadFollowingList()
})

const loadFollowingList = async () => {
  loading.value = true
  try {
    let res
    if (isSelf.value) {
      // 查看自己的关注列表
      res = await friendApi.getFollowingList()
    } else {
      // 查看他人的关注列表
      res = await friendApi.getUserFollowingList(targetUserId.value)
    }

    followingList.value = res.data.data || res.data || []
  } catch (error) {
    console.error('Load following list error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const handleUnfollow = async (friend: any) => {
  uni.showModal({
    title: '提示',
    content: `确定要取消关注 ${friend.user?.nickname} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await friendApi.unfollow(friend.friendId)
          uni.showToast({
            title: '已取消关注',
            icon: 'success'
          })
          // 刷新列表
          await loadFollowingList()
        } catch (error) {
          console.error('Unfollow error:', error)
          uni.showToast({
            title: '操作失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

const goToUserDetail = (userId: number) => {
  uni.navigateTo({
    url: `/pages/user/detail?id=${userId}`
  })
}
</script>

<style scoped lang="scss">
.following-list-container {
  min-height: 100vh;
  background: #f8f8f8;

  .following-list {
    padding: 20rpx;

    .friend-item {
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
      }

      .friend-info {
        flex: 1;

        .nickname {
          display: block;
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
          margin-bottom: 8rpx;
        }

        .mobile {
          display: block;
          font-size: 24rpx;
          color: #999;
        }
      }

      .action-btn {
        padding: 12rpx 24rpx;
        background: #999;
        color: #fff;
        border-radius: 24rpx;
        font-size: 24rpx;
      }
    }
  }
}
</style>