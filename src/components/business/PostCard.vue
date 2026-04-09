<template>
  <view class="post-card" @click="handleClick">
    <view class="post-header">
      <image
        class="avatar"
        :src="post.user?.avatarUrl || '/static/images/default-avatar.png'"
        mode="aspectFill"
      />
      <view class="user-info">
        <text class="nickname">{{ post.user?.nickname }}</text>
        <text class="time">{{ formatTime(post.createdAt) }}</text>
      </view>
      <view class="more-btn" @click.stop="showActionSheet">
        <text class="icon">⋯</text>
      </view>
    </view>

    <view class="post-content">
      <text class="content">{{ post.content }}</text>
    </view>

    <view v-if="post.images?.length" class="post-images">
      <view
        v-for="(img, index) in post.images"
        :key="index"
        class="post-image-wrapper"
        @click.stop="previewImage(index)"
      >
        <image
          class="post-image"
          :class="{ loaded: imageLoaded[index] }"
          :src="img"
          mode="aspectFill"
          :lazy-load="true"
          @load="handleImageLoad(index)"
          @error="handleImageError(index)"
        />
        <view v-if="!imageLoaded[index]" class="image-placeholder">
          <view class="placeholder-shimmer" />
        </view>
      </view>
    </view>

    <view class="post-footer">
      <view class="action-item" @click.stop="handleLike">
        <view class="like-wrapper">
          <text :class="['icon', 'like-icon', { liked: post.isLiked, animating: isLikeAnimating }]">
            {{ post.isLiked ? '❤️' : '🤍' }}
          </text>
          <view v-if="showLikeParticles" class="like-particles">
            <view v-for="i in 6" :key="i" class="particle" :style="getParticleStyle(i)" />
          </view>
        </view>
        <text :class="{ 'count-change': isLikeAnimating }">{{ post.likeCount || 0 }}</text>
      </view>
      <view class="action-item" @click.stop="handleComment">
        <text class="icon">💬</text>
        <text>{{ post.commentCount || 0 }}</text>
      </view>
      <view class="action-item" @click.stop="handleShare">
        <text class="icon">📤</text>
      </view>
    </view>

    <!-- 举报输入弹窗 -->
    <view v-if="showReportModal" class="modal-mask" @click="closeReportModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">请输入举报原因</text>
          <view class="close-btn" @click="closeReportModal">
            <text>×</text>
          </view>
        </view>
        <view class="modal-body">
          <textarea
            v-model="reportDescription"
            class="report-textarea"
            placeholder="请详细描述举报原因（限100字）"
            maxlength="100"
            :show-confirm-bar="false"
          />
          <text class="char-count">{{ reportDescription.length }}/100</text>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeReportModal">取消</button>
          <button class="submit-btn" @click="submitReport">提交</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { formatTime } from '@/utils';

const props = defineProps<{
  post: any;
}>();

const emit = defineEmits<{
  click: [];
  like: [];
  comment: [];
  share: [];
  report: [];
}>();

const showReportModal = ref(false);
const reportReason = ref(0);
const reportDescription = ref('');
const isLikeAnimating = ref(false);
const showLikeParticles = ref(false);
const imageLoaded = reactive<Record<number, boolean>>({});

const handleClick = () => {
  emit('click');
};

const getParticleStyle = (index: number) => {
  const angle = (360 / 6) * index;
  const radian = (angle * Math.PI) / 180;
  const distance = 40;
  const x = Math.cos(radian) * distance;
  const y = Math.sin(radian) * distance;

  return {
    '--tx': `${x}rpx`,
    '--ty': `${y}rpx`,
    '--delay': `${index * 0.05}s`,
  };
};

const handleImageLoad = (index: number) => {
  imageLoaded[index] = true;
};

const handleImageError = (index: number) => {
  imageLoaded[index] = true; // 即使加载失败也隐藏占位符
};

const handleLike = () => {
  // 触发点赞动画
  isLikeAnimating.value = true;
  showLikeParticles.value = true;

  // 发射事件
  emit('like');

  // 动画结束后重置状态
  setTimeout(() => {
    isLikeAnimating.value = false;
  }, 600);

  setTimeout(() => {
    showLikeParticles.value = false;
  }, 800);
};

const handleComment = () => {
  emit('comment');
};

const handleShare = () => {
  emit('share');
};

const previewImage = (index: number) => {
  uni.previewImage({
    urls: props.post.images || [],
    current: index,
  });
};

const showActionSheet = () => {
  uni.showActionSheet({
    itemList: ['举报'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 延迟执行，避免与上一个 ActionSheet 冲突
        setTimeout(() => {
          handleReport();
        }, 300);
      }
    }
  });
};

const handleReport = () => {
  uni.showActionSheet({
    itemList: ['垃圾广告', '违法违规', '色情低俗', '侮辱谩骂', '其他'],
    success: (res) => {
      const reasons = [1, 2, 3, 4, 5];
      const reasonTexts = ['垃圾广告', '违法违规', '色情低俗', '侮辱谩骂', '其他'];
      const selectedReason = reasons[res.tapIndex];
      const selectedReasonText = reasonTexts[res.tapIndex];

      // 如果选择"其他"，弹出输入框
      if (res.tapIndex === 4) {
        showReportInput(selectedReason);
      } else {
        // 其他选项直接确认
        uni.showModal({
          title: '举报确认',
          content: `确认举报该帖子为"${selectedReasonText}"吗？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              emit('report', {
                reason: selectedReason,
                description: selectedReasonText
              });
            }
          }
        });
      }
    }
  });
};

const showReportInput = (reason: number) => {
  reportReason.value = reason;
  reportDescription.value = '';
  showReportModal.value = true;
};

const closeReportModal = () => {
  showReportModal.value = false;
  reportDescription.value = '';
};

const submitReport = () => {
  const content = reportDescription.value.trim();
  if (!content) {
    uni.showToast({
      title: '请输入举报原因',
      icon: 'none'
    });
    return;
  }
  if (content.length > 100) {
    uni.showToast({
      title: '举报原因不能超过100字',
      icon: 'none'
    });
    return;
  }
  emit('report', {
    reason: reportReason.value,
    description: content
  });
  closeReportModal();
};
</script>

<style scoped lang="scss">
.post-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;

  .post-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;

    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
      background: #f0f0f0;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .nickname {
        font-size: 28rpx;
        font-weight: 500;
        color: #333;
      }

      .time {
        font-size: 24rpx;
        color: #999;
        margin-top: 4rpx;
      }
    }

    .more-btn {
      padding: 0 10rpx;

      .icon {
        font-size: 40rpx;
        color: #999;
        font-weight: bold;
      }
    }
  }

  .post-content {
    margin-bottom: 20rpx;

    .content {
      font-size: 28rpx;
      color: #333;
      line-height: 1.6;
    }
  }

  .post-images {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10rpx;
    margin-bottom: 20rpx;

    .post-image-wrapper {
      position: relative;
      width: 100%;
      height: 200rpx;
      border-radius: 8rpx;
      overflow: hidden;
      background: #f0f0f0;
    }

    .post-image {
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 0.3s ease;

      &.loaded {
        opacity: 1;
      }
    }

    .image-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #f0f0f0;
      overflow: hidden;

      .placeholder-shimmer {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.4),
          transparent
        );
        animation: shimmer 1.5s ease-in-out infinite;
      }
    }
  }

  .post-footer {
    display: flex;
    align-items: center;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;

    .action-item {
      display: flex;
      align-items: center;
      margin-right: 40rpx;
      position: relative;

      .like-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon {
        font-size: 36rpx;
        margin-right: 8rpx;
        transition: all 0.3s ease;

        &.like-icon {
          &.liked {
            animation: heart-beat 0.6s ease;
          }

          &.animating {
            animation: heart-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
        }
      }

      .like-particles {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;

        .particle {
          position: absolute;
          width: 8rpx;
          height: 8rpx;
          background: #ff4d4f;
          border-radius: 50%;
          animation: particle-burst 0.8s ease-out forwards;
          animation-delay: var(--delay);
          transform: translate(var(--tx), var(--ty));
          opacity: 0;
        }
      }

      .count-change {
        animation: count-bounce 0.4s ease;
      }

      text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

@keyframes heart-beat {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(0.9);
  }
  75% {
    transform: scale(1.1);
  }
}

@keyframes heart-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.5) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

@keyframes particle-burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(0);
  }
}

@keyframes count-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.modal-mask {
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
    border-radius: 16rpx;
    overflow: hidden;

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32rpx 32rpx 24rpx;
      border-bottom: 1rpx solid #f0f0f0;

      .modal-title {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
      }

      .close-btn {
        width: 48rpx;
        height: 48rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48rpx;
        color: #999;
        line-height: 1;
      }
    }

    .modal-body {
      padding: 32rpx;

      .report-textarea {
        width: 100%;
        min-height: 200rpx;
        padding: 20rpx;
        border: 1rpx solid #e0e0e0;
        border-radius: 8rpx;
        font-size: 28rpx;
        line-height: 1.6;
        background: #f8f8f8;
        box-sizing: border-box;

        &:focus {
          border-color: #007aff;
          background: #fff;
        }
      }

      .char-count {
        display: block;
        text-align: right;
        font-size: 24rpx;
        color: #999;
        margin-top: 12rpx;
      }
    }

    .modal-footer {
      display: flex;
      border-top: 1rpx solid #f0f0f0;

      button {
        flex: 1;
        height: 88rpx;
        line-height: 88rpx;
        font-size: 32rpx;
        border: none;
        border-radius: 0;
        background: #fff;
        padding: 0;
        margin: 0;

        &::after {
          border: none;
        }
      }

      .cancel-btn {
        color: #666;
        border-right: 1rpx solid #f0f0f0;
      }

      .submit-btn {
        color: #007aff;
        font-weight: 500;
      }
    }
  }
}
</style>
