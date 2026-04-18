<template>
  <view class="user-detail-container">
    <view v-if="loading" class="loading-wrapper">
      <Loading text="加载中..." />
    </view>

    <view v-else-if="userInfo" class="user-detail">
      <!-- 用户头部信息 -->
      <view class="user-header">
        <image
          class="avatar"
          :src="userInfo.avatarUrl || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="user-info">
          <view class="nickname-row">
            <text class="nickname">{{ userInfo.nickname }}</text>
            <image
              v-if="userInfo.isVerified"
              class="verified-icon"
              src="/static/images/verified.png"
              mode="aspectFit"
            />
          </view>
          <text v-if="userInfo.mbtiType" class="mbti-tag">{{ userInfo.mbtiType }}</text>
        </view>
        <!-- 更多操作按钮 -->
        <view v-if="!isSelf" class="more-btn" @click="showMoreActions">
          <text class="icon">⋯</text>
        </view>
      </view>

      <!-- 用户统计 -->
      <view class="user-stats">
        <view class="stat-item">
          <text class="stat-value">{{ userInfo.followingCount || 0 }}</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userInfo.followerCount || 0 }}</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userInfo.postCount || 0 }}</text>
          <text class="stat-label">动态</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button
          v-if="!isSelf"
          :class="['action-btn', 'follow-btn', { following: userInfo.isFollowing }]"
          @click="handleFollow"
        >
          <text>{{ userInfo.isFollowing ? '已关注' : '+ 关注' }}</text>
        </button>
        <button
          v-if="!isSelf"
          class="action-btn chat-btn"
          :class="{ 'btn-loading': chatLoading }"
          @click="handleChat"
        >
          <text v-if="!chatLoading">💬 发私信</text>
          <text v-else>处理中...</text>
        </button>
      </view>

      <!-- 用户动态列表 -->
      <view class="user-posts">
        <view class="section-title">
          <text>TA的动态</text>
        </view>

        <view v-if="posts.length > 0" class="posts-list">
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            @click="goToPostDetail(post.id)"
            @like="handleLike(post)"
          />
        </view>

        <Empty v-else text="暂无动态" />
      </view>
    </view>

    <Empty v-else text="用户不存在" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores';
import { userApi } from '@/api/modules/user';
import { squareApi } from '@/api/modules/square';
import { friendApi } from '@/api/modules/friend';
import PostCard from '@/components/business/PostCard.vue';
import Loading from '@/components/common/Loading.vue';
import Empty from '@/components/common/Empty.vue';

const authStore = useAuthStore();

const userId = ref<number>(0);
const userInfo = ref<any>(null);
const posts = ref<any[]>([]);
const loading = ref(true);
const chatLoading = ref(false);

const isSelf = computed(() => {
  return userId.value === authStore.user?.id;
});

onMounted(async () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as any;
  const options = currentPage.options;

  userId.value = parseInt(options.id);

  await loadUserDetail();
  await loadUserPosts();
});

const loadUserDetail = async () => {
  try {
    loading.value = true;
    const res = await userApi.getUserProfile(userId.value);
    userInfo.value = res.data;
  } catch (error) {
    console.error('Load user detail error:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

const loadUserPosts = async () => {
  try {
    const res = await squareApi.getPosts({
      page: 1,
      pageSize: 20,
      userId: userId.value
    });
    posts.value = res.data.list || [];
  } catch (error) {
    console.error('Load user posts error:', error);
  }
};

const handleFollow = async () => {
  if (!userInfo.value) return;

  const originalStatus = userInfo.value.isFollowing;

  // 乐观更新
  userInfo.value.isFollowing = !originalStatus;
  userInfo.value.followerCount = originalStatus
    ? (userInfo.value.followerCount || 1) - 1
    : (userInfo.value.followerCount || 0) + 1;

  try {
    if (originalStatus) {
      await friendApi.unfollow(userId.value);
      uni.showToast({
        title: '已取消关注',
        icon: 'success'
      });
    } else {
      await friendApi.follow(userId.value);
      uni.showToast({
        title: '关注成功',
        icon: 'success'
      });
    }
  } catch (error: any) {
    console.error('Follow error:', error);
    // 回滚
    userInfo.value.isFollowing = originalStatus;
    userInfo.value.followerCount = originalStatus
      ? (userInfo.value.followerCount || 0) + 1
      : (userInfo.value.followerCount || 1) - 1;

    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    });
  }
};

const handleChat = async () => {
  if (!userInfo.value || chatLoading.value) return;

  chatLoading.value = true;

  try {
    // 检查好友关系状态
    const statusRes = await friendApi.getFriendshipStatus(userId.value);
    const status = statusRes.data;

    if (status.isFriend) {
      // 已经是好友，直接跳转聊天
      uni.navigateTo({
        url: `/pages/chat/detail?userId=${userId.value}&nickname=${userInfo.value.nickname}`
      });
    } else if (status.isFollowing) {
      // 已关注但未成为好友
      const remainingChats = status.requiredChatCount - status.chatCount;

      if (remainingChats > 0) {
        // 聊天次数不足
        uni.showModal({
          title: '提示',
          content: `需要与 ${userInfo.value.nickname} 互发 ${remainingChats} 条消息后才能添加好友`,
          confirmText: '去聊天',
          success: (res) => {
            if (res.confirm) {
              // 跳转到聊天页面（关注状态下可以发消息）
              uni.navigateTo({
                url: `/pages/chat/detail?userId=${userId.value}&nickname=${userInfo.value.nickname}`
              });
            }
          }
        });
      } else if (status.canAddFriend) {
        // 满足条件，提示添加好友
        uni.showModal({
          title: '添加好友',
          content: `需要消耗 ${status.requiredPoints} 积分添加 ${userInfo.value.nickname} 为好友`,
          confirmText: '确认添加',
          success: async (res) => {
            if (res.confirm) {
              try {
                await friendApi.addFriend(userId.value);
                uni.showToast({
                  title: '添加成功',
                  icon: 'success'
                });
                // 刷新状态
                await loadUserDetail();
              } catch (error: any) {
                uni.showToast({
                  title: error.message || '添加失败',
                  icon: 'none'
                });
              }
            }
          }
        });
      } else {
        // 积分不足
        uni.showModal({
          title: '积分不足',
          content: `添加好友需要 ${status.requiredPoints} 积分，当前积分：${status.currentPoints}`,
          showCancel: false
        });
      }
    } else {
      // 未关注，提示先关注
      uni.showModal({
        title: '提示',
        content: `请先关注 ${userInfo.value.nickname}`,
        confirmText: '去关注',
        success: async (res) => {
          if (res.confirm) {
            await handleFollow();
          }
        }
      });
    }
  } catch (error: any) {
    console.error('Check chat status error:', error);
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    });
  } finally {
    chatLoading.value = false;
  }
};

const goToPostDetail = (postId: number) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${postId}`
  });
};

const handleLike = async (post: any) => {
  const originalIsLiked = post.isLiked;
  const originalLikeCount = post.likeCount;

  // 乐观更新
  post.isLiked = !originalIsLiked;
  post.likeCount = originalIsLiked ? originalLikeCount - 1 : originalLikeCount + 1;

  try {
    await squareApi.toggleLike({
      targetId: post.id,
      targetType: 1
    });
  } catch (error) {
    // 回滚
    post.isLiked = originalIsLiked;
    post.likeCount = originalLikeCount;
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  }
};

const showMoreActions = () => {
  uni.showActionSheet({
    itemList: ['举报用户', '拉黑用户'],
    success: (res) => {
      if (res.tapIndex === 0) {
        handleReport();
      } else if (res.tapIndex === 1) {
        handleBlock();
      }
    }
  });
};

const handleReport = () => {
  uni.showActionSheet({
    itemList: ['垃圾广告', '违法违规', '色情低俗', '侮辱谩骂', '其他'],
    success: async (res) => {
      const reasons = [1, 2, 3, 4, 5];
      const reasonTexts = ['垃圾广告', '违法违规', '色情低俗', '侮辱谩骂', '其他'];
      const selectedReason = reasons[res.tapIndex];
      const selectedReasonText = reasonTexts[res.tapIndex];

      try {
        // 调用举报接口
        await userApi.reportUser({
          userId: userId.value,
          reason: selectedReason,
          description: selectedReasonText
        });

        uni.showToast({
          title: '举报成功',
          icon: 'success'
        });
      } catch (error: any) {
        console.error('Report user error:', error);
        uni.showToast({
          title: error.message || '举报失败',
          icon: 'none'
        });
      }
    }
  });
};

const handleBlock = () => {
  uni.showModal({
    title: '拉黑确认',
    content: `确定要拉黑 ${userInfo.value?.nickname} 吗？拉黑后将无法看到对方的动态和消息。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await userApi.blockUser(userId.value);
          uni.showToast({
            title: '已拉黑',
            icon: 'success'
          });
          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } catch (error: any) {
          console.error('Block user error:', error);
          uni.showToast({
            title: error.message || '操作失败',
            icon: 'none'
          });
        }
      }
    }
  });
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.user-detail-container {
  min-height: 100vh;
  background: #f8f8f8;

  .loading-wrapper {
    padding: 200rpx 0;
    text-align: center;
  }

  .user-detail {
    .user-header {
      background: #fff;
      padding: 40rpx;
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;

      .avatar {
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
        margin-right: 24rpx;
        background: #f0f0f0;
      }

      .user-info {
        flex: 1;

        .nickname-row {
          display: flex;
          align-items: center;
          margin-bottom: 12rpx;

          .nickname {
            font-size: 36rpx;
            font-weight: 600;
            color: #333;
            margin-right: 12rpx;
          }

          .verified-icon {
            width: 32rpx;
            height: 32rpx;
          }
        }

        .mbti-tag {
          display: inline-block;
          padding: 8rpx 16rpx;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 24rpx;
          border-radius: 8rpx;
          font-weight: 500;
        }
      }

      .more-btn {
        padding: 0 10rpx;
        cursor: pointer;

        .icon {
          font-size: 40rpx;
          color: #999;
          font-weight: bold;
        }
      }
    }

    .user-stats {
      background: #fff;
      padding: 32rpx 40rpx;
      display: flex;
      justify-content: space-around;
      margin-bottom: 20rpx;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
          font-size: 40rpx;
          font-weight: 600;
          color: #333;
          margin-bottom: 8rpx;
        }

        .stat-label {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    .action-buttons {
      padding: 0 40rpx 20rpx;
      display: flex;
      gap: 20rpx;

      .action-btn {
        flex: 1;
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        font-size: 28rpx;
        font-weight: 500;
        border: none;
        transition: all 0.3s ease;

        &::after {
          border: none;
        }

        &.follow-btn {
          background: $primary-color;
          color: #fff;

          &.following {
            background: #f0f0f0;
            color: #666;
          }

          &:active {
            transform: scale(0.98);
            opacity: 0.9;
          }
        }

        &.chat-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          position: relative;

          &:active:not(.btn-loading) {
            transform: scale(0.98);
            opacity: 0.9;
          }

          &.btn-loading {
            opacity: 0.7;
            pointer-events: none;
          }
        }
      }
    }

    .user-posts {
      padding: 20rpx;

      .section-title {
        padding: 20rpx 0;
        margin-bottom: 20rpx;

        text {
          font-size: 32rpx;
          font-weight: 600;
          color: #333;
        }
      }

      .posts-list {
        // PostCard 自带 margin-bottom
      }
    }
  }
}
</style>
