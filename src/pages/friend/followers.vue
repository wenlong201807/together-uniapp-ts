<template>
  <view class="followers-list-container">
    <view class="followers-list">
      <view
        v-for="follower in followersList"
        :key="follower.friendId"
        class="follower-item"
        @click="goToUserDetail(follower.friendId)"
      >
        <image class="avatar" :src="follower.user?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill" />
        <view class="follower-info">
          <text class="nickname">{{ follower.user?.nickname }}</text>
        </view>
        <button class="action-btn" @click.stop="handleFollow(follower)">
          <text>{{ follower.isFollowing ? '已关注' : '+ 关注' }}</text>
        </button>
      </view>

      <Loading v-if="loading" text="加载中..." />
      <Empty v-if="!loading && followersList.length === 0" text="暂无粉丝" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { friendApi } from '@/api/modules/friend'
import { useAuthStore } from '@/stores'
import Loading from '@/components/common/Loading.vue'
import Empty from '@/components/common/Empty.vue'

const authStore = useAuthStore()
const followersList = ref<any[]>([])
const loading = ref(false)
const targetUserId = ref<number>(0)

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options

  targetUserId.value = options.userId ? parseInt(options.userId) : authStore.userInfo?.id || 0

  await loadFollowersList()
})

const loadFollowersList = async () => {
  loading.value = true
  try {
    let res
    if (targetUserId.value === authStore.userInfo?.id) {
      // 查看自己的粉丝
      res = await friendApi.getFollowersList()
    } else {
      // 查看他人的粉丝
      res = await friendApi.getUserFollowersList(targetUserId.value)
    }

    followersList.value = res.data.data || res.data || []

    // 检查每个粉丝是否已被当前用户关注
    for (const follower of followersList.value) {
      try {
        const statusRes = await friendApi.getFriendshipStatus(follower.friendId)
        follower.isFollowing = statusRes.data.isFollowing
      } catch (error) {
        follower.isFollowing = false
      }
    }
  } catch (error) {
    console.error('Load followers list error:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const handleFollow = async (follower: any) => {
  if (follower.friendId === authStore.userInfo?.id) {
    uni.showToast({
      title: '不能关注自己',
      icon: 'none'
    })
    return
  }

  const originalStatus = follower.isFollowing

  // 乐观更新
  follower.isFollowing = !originalStatus

  try {
    if (originalStatus) {
      await friendApi.unfollow(follower.friendId)
      uni.showToast({
        title: '已取消关注',
        icon: 'success'
      })
    } else {
      await friendApi.follow(follower.friendId)
      uni.showToast({
        title: '关注成功',
        icon: 'success'
      })
    }
  } catch (error: any) {
    // 回滚
    follower.isFollowing = originalStatus
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    })
  }
}

const goToUserDetail = (userId: number) => {
  uni.navigateTo({
    url: `/pages/user/detail?id=${userId}`
  })
}
</script>

<style scoped lang="scss">
.followers-list-container {
  min-height: 100vh;
  background: #f8f8f8;

  .followers-list {
    padding: 20rpx;

    .follower-item {
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

      .follower-info {
        flex: 1;

        .nickname {
          display: block;
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
        }
      }

      .action-btn {
        padding: 12rpx 24rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border-radius: 24rpx;
        font-size: 24rpx;
        border: none;
        line-height: 1;

        &::after {
          border: none;
        }
      }
    }
  }
}
</style>
