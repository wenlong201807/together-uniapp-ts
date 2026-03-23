<template>
  <view class="square-container">
    <view class="square-header">
      <view class="tab-list">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab-item', activeTab === tab.value ? 'active' : '']"
          @click="activeTab = tab.value"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>
      <view class="publish-btn" @click="goToPublish">
        <text>+</text>
      </view>
    </view>

    <scroll-view
      class="posts-list"
      scroll-y
      @scrolltolower="loadMore"
    >
      <PostCard
        v-for="post in squareStore.posts"
        :key="post.id"
        :post="post"
        @click="goToPostDetail(post.id)"
        @like="handleLike(post)"
        @comment="handleComment(post)"
      />

      <Loading v-if="squareStore.loading" text="加载中..." />
      <Empty v-if="!squareStore.loading && squareStore.posts.length === 0" text="暂无动态" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSquareStore } from '@/stores'
import PostCard from '@/components/business/PostCard.vue'
import Loading from '@/components/common/Loading.vue'
import Empty from '@/components/common/Empty.vue'

const squareStore = useSquareStore()

const tabs = [
  { label: '最新', value: 'latest' },
  { label: '热门', value: 'hot' }
]

const activeTab = ref('latest')
const page = ref(1)

onMounted(() => {
  loadPosts()
})

const loadPosts = async () => {
  try {
    await squareStore.fetchPosts({
      page: page.value,
      pageSize: 20,
      sort: activeTab.value
    })
  } catch (error) {
    console.error('Load posts error:', error)
  }
}

const loadMore = () => {
  if (!squareStore.hasMore || squareStore.loading) return
  page.value++
  loadPosts()
}

const goToPublish = () => {
  uni.navigateTo({
    url: '/pages/square/publish'
  })
}

const goToPostDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${id}`
  })
}

const handleLike = async (post: any) => {
  try {
    await squareStore.toggleLike({
      targetId: post.id,
      targetType: 1
    })
  } catch (error) {
    console.error('Like error:', error)
  }
}

const handleComment = (post: any) => {
  uni.navigateTo({
    url: `/pages/square/post?id=${post.id}`
  })
}
</script>

<style scoped lang="scss">
.square-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f8f8;

  .square-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 40rpx;
    background: #fff;

    .tab-list {
      display: flex;
      gap: 40rpx;

      .tab-item {
        font-size: 28rpx;
        color: #666;
        position: relative;

        &.active {
          font-weight: bold;
          color: #007aff;

          &::after {
            content: '';
            position: absolute;
            bottom: -8rpx;
            left: 50%;
            transform: translateX(-50%);
            width: 40rpx;
            height: 4rpx;
            background: #007aff;
            border-radius: 2rpx;
          }
        }
      }
    }

    .publish-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #007aff;
      color: #fff;
      border-radius: 50%;
      font-size: 36rpx;
    }
  }

  .posts-list {
    flex: 1;
    padding: 20rpx;
  }
}
</style>