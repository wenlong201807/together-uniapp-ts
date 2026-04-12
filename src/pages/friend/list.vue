<template>
  <view class="friend-list-container">
    <view class="friend-list">
      <view
        v-for="friend in friendStore.friendList"
        :key="friend.id"
        class="friend-item"
        @click="goToChat(friend)"
      >
        <image class="avatar" :src="friend.user?.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
        <view class="friend-info">
          <text class="nickname">{{ friend.user?.nickname }}</text>
          <text class="mobile">{{ friend.user?.mobile }}</text>
        </view>
        <view class="action-btn" @click.stop="handleDelete(friend)">
          <text>删除</text>
        </view>
      </view>

      <Loading v-if="loading" text="加载中..." />
      <Empty v-if="!loading && friendStore.friendList.length === 0" text="暂无好友" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFriendStore, usePointsStore } from '@/stores'
import Loading from '@/components/common/Loading.vue'
import Empty from '@/components/common/Empty.vue'

const friendStore = useFriendStore()
const pointsStore = usePointsStore()
const loading = ref(false)

onMounted(async () => {
  await loadFriendList()
})

const loadFriendList = async () => {
  loading.value = true
  try {
    await friendStore.fetchFriendList()
  } catch (error) {
    console.error('Load friend list error:', error)
  } finally {
    loading.value = false
  }
}

const goToChat = async (friend: any) => {
  try {
    const status = await friendStore.getFriendshipStatus(friend.friendId)
    
    if (!status.canChat) {
      if (!status.isFollowing) {
        uni.showModal({
          title: '提示',
          content: `您还没有关注 ${friend.user?.nickname}，是否先关注？`,
          success: async (res) => {
            if (res.confirm) {
              await friendStore.follow(friend.friendId)
              uni.showToast({
                title: '关注成功',
                icon: 'success'
              })
            }
          }
        })
        return
      }
      
      if (status.chatCount < 8) {
        uni.showModal({
          title: '提示',
          content: `与 ${friend.user?.nickname} 互发8条消息后才能解锁私聊，当前已发送 ${status.chatCount} 条消息。`,
          showCancel: false
        })
        return
      }
      
      if (status.currentPoints < status.requiredPoints) {
        uni.showModal({
          title: '积分不足',
          content: `解锁私聊需要 ${status.requiredPoints} 积分，当前您只有 ${status.currentPoints} 积分，不足以解锁私聊。`,
          showCancel: false
        })
        return
      }
    }
    
    uni.navigateTo({
      url: `/pages/chat/detail?userId=${friend.friendId}&nickname=${friend.user?.nickname}`
    })
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '进入聊天失败',
      icon: 'none'
    })
  }
}

const handleDelete = (friend: any) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除好友 ${friend.user?.nickname} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await friendStore.deleteFriend(friend.friendId)
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
        } catch (error) {
          console.error('Delete friend error:', error)
        }
      }
    }
  })
}
</script>

<style scoped lang="scss">
.friend-list-container {
  
  background: #f8f8f8;

  .friend-list {
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
        background: #ff4d4f;
        color: #fff;
        border-radius: 24rpx;
        font-size: 24rpx;
      }
    }
  }
}
</style>