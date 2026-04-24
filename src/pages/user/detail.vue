<template>
  <view class="user-detail-container">
    <UserDetailSkeleton v-if="loading" />

    <view v-else-if="userInfo" class="user-detail">
      <!-- 用户头部信息 -->
      <view class="user-header">
        <Avatar
          :avatar-id="userInfo.avatarId"
          :avatar-url="userInfo.avatarUrl"
          size="large"
          class="avatar"
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
        <view class="stat-item" @click="goToFollowingList">
          <text class="stat-value">{{ userInfo.followingCount || 0 }}</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-item" @click="goToFollowersList">
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
            @comment="handleComment(post)"
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
import Avatar from '@/components/common/Avatar.vue';
import Empty from '@/components/common/Empty.vue';
import UserDetailSkeleton from './components/UserDetailSkeleton.vue';

const authStore = useAuthStore();

const userId = ref<number>(0);
const userInfo = ref<any>(null);
const posts = ref<any[]>([]);
const loading = ref(true);
const chatLoading = ref(false);

const isSelf = computed(() => {
  const currentUserId = authStore.user?.id || authStore.userInfo?.id;
  return userId.value === currentUserId;
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

const handleComment = (post: any) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${post.id}`
  });
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
          await friendApi.blockUser(userId.value);
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

const goToFollowingList = () => {
  uni.navigateTo({
    url: `/pages/friend/following?userId=${userId.value}`
  });
};

const goToFollowersList = () => {
  uni.navigateTo({
    url: `/pages/friend/followers?userId=${userId.value}`
  });
};
</script>

<style scoped lang="scss">
@use '@/assets/styles/design-tokens.scss' as *;

.user-detail-container {
  min-height: 100vh;
  background: $bg-secondary;

  .user-detail {
    .user-header {
      background: $bg-primary;
      padding: $padding-xl;
      display: flex;
      align-items: center;
      margin-bottom: $margin-md;
      @include transition(all);

      .avatar {
        margin-right: $margin-lg;
        flex-shrink: 0;
      }

      .user-info {
        flex: 1;

        .nickname-row {
          display: flex;
          align-items: center;
          margin-bottom: $margin-sm;

          .nickname {
            font-size: $font-size-xl;
            font-weight: $font-weight-bold;
            color: $text-primary;
            margin-right: $margin-sm;
          }

          .verified-icon {
            width: $icon-size-sm;
            height: $icon-size-sm;
          }
        }

        .mbti-tag {
          display: inline-block;
          padding: $padding-xs $padding-sm;
          background: $gradient-primary;
          color: $bg-primary;
          font-size: $font-size-sm;
          border-radius: $radius-sm;
          font-weight: $font-weight-medium;
        }
      }

      .more-btn {
        padding: 0 $padding-xs;
        @include transition(opacity);

        &:active {
          opacity: 0.6;
        }

        .icon {
          font-size: $font-size-xxl;
          color: $text-tertiary;
          font-weight: $font-weight-bold;
        }
      }
    }

    .user-stats {
      background: $bg-primary;
      padding: $padding-lg $padding-xl;
      display: flex;
      justify-content: space-around;
      margin-bottom: $margin-md;

      .stat-item {
        @include flex-center;
        flex-direction: column;
        @include transition(transform);

        &:active {
          transform: scale(0.95);
        }

        .stat-value {
          font-size: $font-size-xxl;
          font-weight: $font-weight-bold;
          color: $text-primary;
          margin-bottom: $margin-xs;
        }

        .stat-label {
          font-size: $font-size-sm;
          color: $text-tertiary;
        }
      }
    }

    .action-buttons {
      padding: 0 $padding-xl $padding-md;
      display: flex;
      gap: $spacing-md;

      .action-btn {
        flex: 1;
        height: $button-height-lg;
        line-height: $button-height-lg;
        border-radius: $radius-full;
        font-size: $font-size-base;
        font-weight: $font-weight-medium;
        border: none;
        @include transition(all);
        @include active-scale;

        &::after {
          border: none;
        }

        &.follow-btn {
          background: $primary-color;
          color: $bg-primary;

          &.following {
            background: $bg-tertiary;
            color: $text-secondary;
          }
        }

        &.chat-btn {
          background: $gradient-primary;
          color: $bg-primary;
          position: relative;

          &.btn-loading {
            opacity: 0.7;
            pointer-events: none;
          }
        }
      }
    }

    .user-posts {
      padding: $padding-md;

      .section-title {
        padding: $padding-md 0;
        margin-bottom: $margin-md;

        text {
          font-size: $font-size-lg;
          font-weight: $font-weight-bold;
          color: $text-primary;
        }
      }
    }
  }
}
</style>
