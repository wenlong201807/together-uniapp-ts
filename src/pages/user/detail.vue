<template>
  <view class="user-detail-container">
    <UserDetailSkeleton v-if="profileStore.loading" />

    <view v-else-if="profileStore.profile" class="user-detail">
      <!-- 用户头部信息 -->
      <view class="user-header">
        <view class="avatar-wrapper" :class="{ 'avatar-blur': profileStore.profile.avatarBlur }">
          <Avatar
            :avatar-id="profileStore.profile?.avatarId"
            :avatar-url="profileStore.profile?.avatarUrl"
            size="large"
          />
          <!-- 头像隐私遮罩 -->
          <view v-if="profileStore.profile.avatarBlur" class="avatar-overlay">
            <text class="lock-icon">🔒</text>
          </view>
        </view>
        <view class="user-info">
          <view class="nickname-row">
            <text class="nickname">{{ profileStore.profile.nickname }}</text>
            <image
              v-if="profileStore.profile.isVerified"
              class="verified-icon"
              src="/static/images/verified.png"
              mode="aspectFit"
            />
            <!-- 关系徽章 -->
            <view
              v-if="!profileStore.isSelf"
              :class="['relationship-badge', profileStore.relationshipBadgeClass]"
            >
              <text class="badge-text">{{ profileStore.relationshipBadge }}</text>
            </view>
          </view>
          <!-- MBTI标签 + 在线状态 -->
          <view class="meta-row">
            <text v-if="profileStore.profile.mbtiType" class="mbti-tag">
              {{ profileStore.profile.mbtiType }}
            </text>
            <view v-if="profileStore.profile.onlineStatus" class="online-status" :class="profileStore.profile.onlineStatus">
              <view class="status-dot" />
              <text class="status-text">{{ onlineStatusText }}</text>
            </view>
          </view>
          <!-- 年龄显示 -->
          <view class="age-row">
            <text v-if="profileStore.profile.age" class="age-text">{{ profileStore.profile.age }}岁</text>
            <text v-else-if="profileStore.profile.ageRange" class="age-text">{{ profileStore.profile.ageRange }}岁</text>
            <text v-if="profileStore.privacyHints.has('age_range_only')" class="privacy-hint">（仅显示年龄段）</text>
            <text v-if="profileStore.privacyHints.has('age_hidden')" class="privacy-hint">（对方隐藏了年龄）</text>
          </view>
        </view>
        <!-- 更多操作按钮 -->
        <view v-if="!profileStore.isSelf" class="more-btn" @click="showMoreActions">
          <text class="icon">⋯</text>
        </view>
      </view>

      <!-- MBTI匹配度卡片（仅非自己且对方允许显示时） -->
      <view
        v-if="profileStore.profile.mbtiMatchScore != null && !profileStore.isSelf"
        class="mbti-match-card"
      >
        <view class="match-header">
          <text class="match-title">MBTI 匹配度</text>
          <text :class="['match-level', `level-${profileStore.profile.mbtiMatchLevel}`]">
            {{ matchLevelText }}
          </text>
        </view>
        <view class="match-score-row">
          <view class="score-bar">
            <view
              class="score-fill"
              :style="{ width: `${profileStore.profile.mbtiMatchScore}%` }"
              :class="`fill-${profileStore.profile.mbtiMatchLevel}`"
            />
          </view>
          <text class="score-number">{{ profileStore.profile.mbtiMatchScore }}</text>
        </view>
        <text class="match-desc">{{ profileStore.profile.mbtiMatchDescription }}</text>
      </view>

      <!-- 好友进度条（已关注但未成为好友时显示） -->
      <view
        v-if="profileStore.isFollowing && profileStore.profile.friendshipProgress && !profileStore.isFriend"
        class="friend-progress-card"
      >
        <view class="progress-header">
          <text class="progress-title">好友进度</text>
          <text class="progress-hint">
            聊天 {{ profileStore.profile.friendshipProgress.chatCount }}/{{ profileStore.profile.friendshipProgress.requiredChatCount }}
          </text>
        </view>
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: `${profileStore.friendProgressPercent}%` }"
          />
        </view>
        <view class="progress-actions">
          <text class="progress-tip">
            {{ profileStore.canAddFriend
              ? `可消耗 ${profileStore.profile.friendshipProgress.requiredPoints} 积分添加好友`
              : `还需互发 ${profileStore.profile.friendshipProgress.requiredChatCount - profileStore.profile.friendshipProgress.chatCount} 条消息`
            }}
          </text>
          <button
            v-if="profileStore.canAddFriend"
            class="add-friend-btn"
            @click="handleAddFriend"
          >
            <text>添加好友</text>
          </button>
        </view>
      </view>

      <!-- 用户统计（根据隐私设置决定是否显示） -->
      <view v-if="profileStore.profile.followListVisible || profileStore.isSelf" class="user-stats">
        <view class="stat-item" @click="goToFollowingList">
          <text class="stat-value">{{ profileStore.profile.followingCount || 0 }}</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-item" @click="goToFollowersList">
          <text class="stat-value">{{ profileStore.profile.followerCount || 0 }}</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ profileStore.profile.postCount || 0 }}</text>
          <text class="stat-label">动态</text>
        </view>
      </view>
      <!-- 统计数据被隐藏提示 -->
      <view v-else-if="!profileStore.isSelf" class="stats-hidden">
        <text class="hidden-text">对方仅对好友公开关注数据</text>
      </view>

      <!-- 操作按钮 -->
      <view v-if="!profileStore.isSelf && !profileStore.isBlocked" class="action-buttons">
        <button
          :class="['action-btn', 'follow-btn', { following: profileStore.isFollowing }]"
          @click="handleFollow"
        >
          <text>{{ profileStore.isFollowing ? '已关注' : '+ 关注' }}</text>
        </button>
        <button
          class="action-btn chat-btn"
          :class="{ 'btn-loading': chatLoading }"
          @click="handleChat"
        >
          <text v-if="!chatLoading">💬 发私信</text>
          <text v-else>处理中...</text>
        </button>
      </view>
      <!-- 已屏蔽状态 -->
      <view v-if="profileStore.isBlocked" class="blocked-notice">
        <text class="blocked-text">你已屏蔽该用户</text>
        <button class="unblock-btn" @click="handleUnblock">
          <text>取消屏蔽</text>
        </button>
      </view>

      <!-- Level 0: 基础信息卡片（所有人可见） -->
      <view v-if="profileStore.profile.basicInfo" class="info-card">
        <view class="card-title">基础信息</view>
        <view class="card-content">
          <view class="info-row">
            <text class="label">年龄：</text>
            <text>{{ profileStore.profile.basicInfo.ageRange }}</text>
          </view>
          <view class="info-row">
            <text class="label">城市：</text>
            <text>{{ profileStore.profile.basicInfo.city }}</text>
          </view>
          <view class="info-row">
            <text class="label">身高：</text>
            <text>{{ profileStore.profile.basicInfo.heightRange }}</text>
          </view>
          <view class="info-row">
            <text class="label">学历：</text>
            <text>{{ profileStore.profile.basicInfo.educationLevel }}</text>
          </view>
          <view class="info-row">
            <text class="label">职业：</text>
            <text>{{ profileStore.profile.basicInfo.occupationType }}</text>
          </view>
          <view v-if="profileStore.profile.basicInfo.tags && profileStore.profile.basicInfo.tags.length > 0" class="info-row">
            <text class="label">标签：</text>
            <view class="tags">
              <text v-for="tag in profileStore.profile.basicInfo.tags" :key="tag" class="tag">
                {{ tag }}
              </text>
            </view>
          </view>
          <view v-if="profileStore.profile.basicInfo.bio" class="info-row">
            <text class="label">简介：</text>
            <text class="bio-text">{{ profileStore.profile.basicInfo.bio }}</text>
          </view>
        </view>
      </view>

      <!-- Level 1: 详细信息（关注后可见） -->
      <view v-if="profileStore.profile.detailedInfo" class="info-card">
        <view class="card-title">详细资料</view>
        <view class="card-content">
          <view v-if="profileStore.profile.detailedInfo.age" class="info-row">
            <text class="label">年龄：</text>
            <text>{{ profileStore.profile.detailedInfo.age }}岁</text>
          </view>
          <view v-if="profileStore.profile.detailedInfo.height" class="info-row">
            <text class="label">身高：</text>
            <text>{{ profileStore.profile.detailedInfo.height }}cm</text>
          </view>
          <view v-if="profileStore.profile.detailedInfo.weight" class="info-row">
            <text class="label">体重：</text>
            <text>{{ profileStore.profile.detailedInfo.weight }}kg</text>
          </view>
          <view v-if="profileStore.profile.detailedInfo.occupation" class="info-row">
            <text class="label">职业：</text>
            <text>{{ profileStore.profile.detailedInfo.occupation }}</text>
          </view>

          <!-- 生活方式 -->
          <view v-if="profileStore.profile.detailedInfo.lifestyle" class="section-subtitle">生活方式</view>
          <view v-if="profileStore.profile.detailedInfo.lifestyle?.smokingStatus" class="info-row">
            <text class="label">吸烟：</text>
            <text>{{ profileStore.profile.detailedInfo.lifestyle.smokingStatus }}</text>
          </view>
          <view v-if="profileStore.profile.detailedInfo.lifestyle?.drinkingStatus" class="info-row">
            <text class="label">饮酒：</text>
            <text>{{ profileStore.profile.detailedInfo.lifestyle.drinkingStatus }}</text>
          </view>
          <view v-if="profileStore.profile.detailedInfo.lifestyle?.exerciseFrequency" class="info-row">
            <text class="label">运动：</text>
            <text>{{ profileStore.profile.detailedInfo.lifestyle.exerciseFrequency }}</text>
          </view>
          <view v-if="profileStore.profile.detailedInfo.lifestyle?.dietPreference" class="info-row">
            <text class="label">饮食：</text>
            <text>{{ profileStore.profile.detailedInfo.lifestyle.dietPreference }}</text>
          </view>
          <view v-if="profileStore.profile.detailedInfo.lifestyle?.hasPets !== null" class="info-row">
            <text class="label">宠物：</text>
            <text>{{ profileStore.profile.detailedInfo.lifestyle.hasPets ? '有宠物' : '无宠物' }}</text>
            <text v-if="profileStore.profile.detailedInfo.lifestyle.petType"> ({{ profileStore.profile.detailedInfo.lifestyle.petType }})</text>
          </view>
        </view>
      </view>

      <!-- 解锁提示（关注后可见详细信息） -->
      <view v-else-if="!profileStore.isFollowing && !profileStore.isFriend && !profileStore.isSelf" class="locked-card">
        <text class="lock-icon">🔒</text>
        <text class="lock-text">关注后可查看更多详细信息</text>
        <button class="unlock-btn" @click="handleFollow">关注 TA</button>
      </view>

      <!-- Level 2: 好友可见信息 -->
      <template v-if="profileStore.profile.friendVisibleInfo">
        <!-- 教育背景 -->
        <view v-if="profileStore.profile.friendVisibleInfo.education" class="info-card">
          <view class="card-title">教育背景</view>
          <view class="card-content">
            <view v-if="profileStore.profile.friendVisibleInfo.education.school" class="info-row">
              <text class="label">毕业院校：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.education.school }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.education.major" class="info-row">
              <text class="label">专业：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.education.major }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.education.education" class="info-row">
              <text class="label">学历：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.education.education }}</text>
            </view>
          </view>
        </view>

        <!-- 职业信息 -->
        <view v-if="profileStore.profile.friendVisibleInfo.career" class="info-card">
          <view class="card-title">职业信息</view>
          <view class="card-content">
            <view v-if="profileStore.profile.friendVisibleInfo.career.industry" class="info-row">
              <text class="label">行业：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.career.industry }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.career.company" class="info-row">
              <text class="label">公司：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.career.company }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.career.workYears" class="info-row">
              <text class="label">工作年限：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.career.workYears }}年</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.career.incomeRange" class="info-row">
              <text class="label">收入：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.career.incomeRange }}</text>
            </view>
          </view>
        </view>

        <!-- 家庭背景 -->
        <view v-if="profileStore.profile.friendVisibleInfo.family" class="info-card">
          <view class="card-title">家庭背景</view>
          <view class="card-content">
            <view v-if="profileStore.profile.friendVisibleInfo.family.hometown" class="info-row">
              <text class="label">家乡：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.family.hometown }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.family.familyMembers" class="info-row">
              <text class="label">家庭成员：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.family.familyMembers }}人</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.family.isOnlyChild !== null" class="info-row">
              <text class="label">是否独生子女：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.family.isOnlyChild ? '是' : '否' }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.family.familyEconomic" class="info-row">
              <text class="label">家庭经济：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.family.familyEconomic }}</text>
            </view>
          </view>
        </view>

        <!-- 婚恋状况 -->
        <view v-if="profileStore.profile.friendVisibleInfo.marital" class="info-card">
          <view class="card-title">婚恋状况</view>
          <view class="card-content">
            <view v-if="profileStore.profile.friendVisibleInfo.marital.maritalStatus" class="info-row">
              <text class="label">婚姻状况：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.marital.maritalStatus }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.marital.hasChildren !== null" class="info-row">
              <text class="label">是否有孩子：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.marital.hasChildren ? '是' : '否' }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.marital.marriagePlan" class="info-row">
              <text class="label">结婚计划：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.marital.marriagePlan }}</text>
            </view>
          </view>
        </view>

        <!-- 资产状况 -->
        <view v-if="profileStore.profile.friendVisibleInfo.assets" class="info-card">
          <view class="card-title">资产状况</view>
          <view class="card-content">
            <view v-if="profileStore.profile.friendVisibleInfo.assets.housingStatus" class="info-row">
              <text class="label">购房情况：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.assets.housingStatus }}</text>
            </view>
            <view v-if="profileStore.profile.friendVisibleInfo.assets.carStatus" class="info-row">
              <text class="label">购车情况：</text>
              <text>{{ profileStore.profile.friendVisibleInfo.assets.carStatus }}</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 解锁提示（成为好友后可见） -->
      <view v-else-if="profileStore.isFollowing && !profileStore.isFriend && !profileStore.isSelf" class="locked-card">
        <text class="lock-icon">🔒</text>
        <text class="lock-text">成为好友后可查看更多信息</text>
        <text v-if="remainingChats > 0" class="lock-hint">还需互发 {{ remainingChats }} 条消息</text>
      </view>

      <!-- Level 3: 联系方式 -->
      <view v-if="profileStore.profile.contactInfo" class="info-card">
        <view class="card-title">联系方式</view>
        <view class="card-content">
          <view v-if="profileStore.profile.contactInfo.wechat" class="info-row">
            <text class="label">微信：</text>
            <text class="contact-value">{{ profileStore.profile.contactInfo.wechat }}</text>
            <button class="copy-btn" @click="copyWechat">复制</button>
          </view>
          <view v-if="profileStore.profile.contactInfo.qq" class="info-row">
            <text class="label">QQ：</text>
            <text class="contact-value">{{ profileStore.profile.contactInfo.qq }}</text>
            <button class="copy-btn" @click="copyQQ">复制</button>
          </view>
        </view>
      </view>

      <!-- 隐私提示区域 -->
      <view v-if="visiblePrivacyHints.length > 0" class="privacy-hints-card">
        <text class="hints-title">可见性说明</text>
        <view v-for="hint in visiblePrivacyHints" :key="hint.key" class="hint-item">
          <text class="hint-icon">🔒</text>
          <text class="hint-text">{{ hint.label }}</text>
        </view>
      </view>

      <!-- 用户动态列表 -->
      <view v-if="profileStore.profile.photosVisible || profileStore.isSelf" class="user-posts">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserProfileStore } from '@/stores/userProfile'
import { useAuthStore } from '@/stores'
import { userApi } from '@/api/modules/user'
import { squareApi } from '@/api/modules/square'
import { friendApi } from '@/api/modules/friend'
import PostCard from '@/components/business/PostCard.vue'
import Avatar from '@/components/common/Avatar.vue'
import Empty from '@/components/common/Empty.vue'
import UserDetailSkeleton from './components/UserDetailSkeleton.vue'
import { useAvatarSync } from '@/composables/useAvatarSync'
import { eventBus, EVENTS } from '@/utils/event-bus'

const profileStore = useUserProfileStore()
const authStore = useAuthStore()

const posts = ref<any[]>([])
const chatLoading = ref(false)

// 头像同步 - 仅为动态列表中的头像
// 顶部用户头像通过事件监听手动更新
const postsData = computed(() => ({ list: posts.value }))
useAvatarSync(postsData, { nestedUserField: 'user' })

// 监听全局头像更新事件，更新顶部用户头像
const handleAvatarUpdate = (payload: {
  userId: number
  avatarId?: number
  avatarUrl?: string
}) => {
  // 如果当前查看的用户头像更新了，同步更新
  if (profileStore.profile && profileStore.profile.id === payload.userId) {
    profileStore.updateAvatar(payload.avatarId ?? null, payload.avatarUrl ?? null)
  }
}

// 在线状态文本
const onlineStatusText = computed(() => {
  switch (profileStore.profile?.onlineStatus) {
    case 'online': return '在线'
    case 'recently': return '刚刚在线'
    case 'today': return '今天在线'
    case 'offline': return '离线'
    default: return ''
  }
})

// MBTI匹配等级文本
const matchLevelText = computed(() => {
  switch (profileStore.profile?.mbtiMatchLevel) {
    case 'best': return '天作之合'
    case 'good': return '相性良好'
    case 'neutral': return '中性匹配'
    case 'challenging': return '需要磨合'
    default: return ''
  }
})

// 剩余需要聊天的消息数
const remainingChats = computed(() => {
  const progress = profileStore.profile?.friendshipProgress
  if (!progress) return 0
  return Math.max(0, progress.requiredChatCount - progress.chatCount)
})

// 可显示的隐私提示
const visiblePrivacyHints = computed(() => {
  const hints: { key: string; label: string }[] = []
  const ph = profileStore.privacyHints

  if (ph.has('avatar_blurred')) {
    hints.push({ key: 'avatar_blurred', label: '头像仅对好友清晰可见' })
  }
  if (ph.has('avatar_hidden')) {
    hints.push({ key: 'avatar_hidden', label: '头像仅对好友可见' })
  }
  if (ph.has('contact_friends_only')) {
    hints.push({ key: 'contact_friends_only', label: '联系方式仅好友可见' })
  }
  if (ph.has('income_friends_only')) {
    hints.push({ key: 'income_friends_only', label: '收入信息仅好友可见' })
  }
  if (ph.has('family_friends_only')) {
    hints.push({ key: 'family_friends_only', label: '家庭背景仅好友可见' })
  }
  if (ph.has('photos_friends_only')) {
    hints.push({ key: 'photos_friends_only', label: '照片仅好友可见' })
  }
  if (ph.has('online_status_hidden')) {
    hints.push({ key: 'online_status_hidden', label: '对方隐藏了在线状态' })
  }
  if (ph.has('online_status_friends_only')) {
    hints.push({ key: 'online_status_friends_only', label: '在线状态仅好友可见' })
  }
  if (ph.has('mbti_match_hidden')) {
    hints.push({ key: 'mbti_match_hidden', label: '对方隐藏了MBTI匹配度' })
  }

  return hints
})

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options

  const userId = parseInt(options.id)

  try {
    await profileStore.fetchProfile(userId)
    await loadUserPosts()
  } catch (error) {
    console.error('Load user detail error:', error)
  }

  // 注册头像更新事件监听
  eventBus.on(EVENTS.AVATAR_UPDATED, handleAvatarUpdate)
})

onUnmounted(() => {
  // 清理事件监听
  eventBus.off(EVENTS.AVATAR_UPDATED, handleAvatarUpdate)
})

const loadUserPosts = async () => {
  try {
    const res = await squareApi.getPosts({
      page: 1,
      pageSize: 20,
      userId: profileStore.targetUserId
    } as any)
    posts.value = res.data.list || []
  } catch (error) {
    console.error('Load user posts error:', error)
  }
}

const handleFollow = async () => {
  const originalType = profileStore.relationshipType

  try {
    if (profileStore.isFollowing) {
      await friendApi.unfollow(profileStore.targetUserId)
      uni.showToast({ title: '已取消关注', icon: 'success' })
    } else {
      await friendApi.follow(profileStore.targetUserId)
      uni.showToast({ title: '关注成功', icon: 'success' })
    }
    // 刷新个人信息
    await profileStore.refreshProfile()
  } catch (error: any) {
    console.error('Follow error:', error)
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  }
}

const handleAddFriend = async () => {
  try {
    // 先检查好友状态
    const statusRes = await friendApi.getFriendshipStatus(profileStore.targetUserId)
    const status = statusRes.data
    const nickname = profileStore.profile?.nickname || '该用户'

    // 如果已经是好友
    if (status.isFriend) {
      uni.showToast({
        title: '已经是好友了',
        icon: 'none'
      })
      return
    }

    // 如果未关注
    if (!status.isFollowing) {
      uni.showModal({
        title: '提示',
        content: `请先关注 ${nickname}`,
        confirmText: '去关注',
        success: async (res) => {
          if (res.confirm) {
            await handleFollow()
          }
        }
      })
      return
    }

    // 检查聊天次数
    const remainingChats = status.requiredChatCount - status.chatCount
    if (remainingChats > 0) {
      uni.showModal({
        title: '提示',
        content: `需要与 ${nickname} 互发 ${remainingChats} 条消息后才能添加好友`,
        confirmText: '去聊天',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: `/pages/chat/detail?userId=${profileStore.targetUserId}&nickname=${nickname}`
            })
          }
        }
      })
      return
    }

    // 检查是否可以添加好友
    if (!status.caddFriend) {
      uni.showModal({
           content: `添加好友需要 ${status.requiredPoints} 积分，当前积分：${status.currentPoints}`,
        showCancel: false
      })
      return
    }

    // 确认添加好友
    uni.showModal({
      title: '添加好友',
      content: `需要消耗 ${status.requiredPoints} 积分添加 ${nickname} 为好友`,
      confirmText: '确认添加',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await friendApi.addFriend(profileStore.targetUserId)
            uni.showToast({
              title: `添加成功，消耗 ${result.data.pointsConsumed} 积分`,
              icon: 'success'
            })
            await profileStore.refreshProfile()
          } catch (error: any) {
            uni.showToast({
              title: error.message || '添加失败',
              icon: 'none'
            })
          }
        }
      }
    })
  } catch (error: any) {
    console.error('Add friend error:', error)
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    })
  }
}

const handleChat = async () => {
  if (chatLoading.value) return
  chatLoading.value = true

  try {
    const statusRes = await friendApi.getFriendshipStatus(profileStore.targetUserId)
    const status = statusRes.data
    const nickname = profileStore.profile?.nickname || ''

    if (status.isFriend) {
      uni.navigateTo({
        url: `/pages/chat/detail?userId=${profileStore.targetUserId}&nickname=${nickname}`
      })
    } else if (status.isFollowing) {
      const remainingChats = status.requiredChatCount - status.chatCount

      if (remainingChats > 0) {
        uni.showModal({
          title: '提示',
          content: `需要与 ${nickname} 互发 ${remainingChats} 条消息后才能添加好友`,
          confirmText: '去聊天',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: `/pages/chat/detail?userId=${profileStore.targetUserId}&nickname=${nickname}`
              })
            }
          }
        })
      } else if (status.canAddFriend) {
        uni.showModal({
          title: '添加好友',
          content: `需要消耗 ${status.requiredPoints} 积分添加 ${nickname} 为好友`,
          confirmText: '确认添加',
          success: async (res) => {
            if (res.confirm) {
              try {
                await friendApi.addFriend(profileStore.targetUserId)
                uni.showToast({ title: '添加成功', icon: 'success' })
                await profileStore.refreshProfile()
              } catch (error: any) {
                uni.showToast({ title: error.message || '添加失败', icon: 'none' })
              }
            }
          }
        })
      } else {
        uni.showModal({
          title: '积分不足',
          content: `添加好友需要 ${status.requiredPoints} 积分，当前积分：${status.currentPoints}`,
          showCancel: false
        })
      }
    } else {
      uni.showModal({
        title: '提示',
        content: `请先关注 ${nickname}`,
        confirmText: '去关注',
        success: async (res) => {
          if (res.confirm) {
            await handleFollow()
          }
        }
      })
    }
  } catch (error: any) {
    console.error('Check chat status error:', error)
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  } finally {
    chatLoading.value = false
  }
}

const handleUnblock = async () => {
  try {
    await friendApi.unblockUser(profileStore.targetUserId)
    uni.showToast({ title: '已取消屏蔽', icon: 'success' })
    await profileStore.refreshProfile()
  } catch (error: any) {
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  }
}

const goToPostDetail = (postId: number) => {
  uni.navigateTo({ url: `/pages/square/post?id=${postId}` })
}

const handleLike = async (post: any) => {
  const originalIsLiked = post.isLiked
  const originalLikeCount = post.likeCount

  post.isLiked = !originalIsLiked
  post.likeCount = originalIsLiked ? originalLikeCount - 1 : originalLikeCount + 1

  try {
    await squareApi.toggleLike({ targetId: post.id, targetType: 1 })
  } catch (error) {
    post.isLiked = originalIsLiked
    post.likeCount = originalLikeCount
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const handleComment = (post: any) => {
  uni.navigateTo({ url: `/pages/square/post?id=${post.id}` })
}

// 复制微信号
const copyWechat = () => {
  const wechat = profileStore.profile?.contactInfo?.wechat
  if (!wechat) return

  uni.setClipboardData({
    data: wechat,
    success: () => {
      uni.showToast({ title: '已复制微信号', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'none' })
    }
  })
}

// 复制QQ号
const copyQQ = () => {
  const qq = profileStore.profile?.contactInfo?.qq
  if (!qq) return

  uni.setClipboardData({
    data: qq,
    success: () => {
      uni.showToast({ title: '已复制QQ号', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'none' })
    }
  })
}

const showMoreActions = () => {
  const items = profileStore.isBlocked
    ? ['举报用户']
    : ['举报用户', '拉黑用户']

  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      if (res.tapIndex === 0) {
        handleReport()
      } else if (res.tapIndex === 1 && !profileStore.isBlocked) {
        handleBlock()
      }
    }
  })
}

const handleReport = () => {
  uni.showActionSheet({
    itemList: ['垃圾广告', '违法违规', '色情低俗', '侮辱谩骂', '其他'],
    success: async (res) => {
      const reasons = [1, 2, 3, 4, 5]
      const reasonTexts = ['垃圾广告', '违法违规', '色情低俗', '侮辱谩骂', '其他']

      try {
        await userApi.reportUser({
          userId: profileStore.targetUserId,
          reason: reasons[res.tapIndex],
          description: reasonTexts[res.tapIndex]
        })
        uni.showToast({ title: '举报成功', icon: 'success' })
      } catch (error: any) {
        uni.showToast({ title: error.message || '举报失败', icon: 'none' })
      }
    }
  })
}

const handleBlock = () => {
  uni.showModal({
    title: '拉黑确认',
    content: `确定要拉黑 ${profileStore.profile?.nickname} 吗？拉黑后将无法看到对方的动态和消息。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await friendApi.blockUser(profileStore.targetUserId)
          uni.showToast({ title: '已拉黑', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1500)
        } catch (error: any) {
          uni.showToast({ title: error.message || '操作失败', icon: 'none' })
        }
      }
    }
  })
}

const goToFollowingList = () => {
  uni.navigateTo({ url: `/pages/friend/following?userId=${profileStore.targetUserId}` })
}

const goToFollowersList = () => {
  uni.navigateTo({ url: `/pages/friend/followers?userId=${profileStore.targetUserId}` })
}
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

      .avatar-wrapper {
        margin-right: $margin-lg;
        flex-shrink: 0;
        position: relative;

        &.avatar-blur .avatar {
          filter: blur(8px);
        }

        .avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: $bg-tertiary;
          @include flex-center;

          .placeholder-icon {
            font-size: 40px;
          }
        }

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          @include flex-center;
          background: rgba(0, 0, 0, 0.3);

          .lock-icon {
            font-size: 24px;
          }
        }
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

          .relationship-badge {
            margin-left: $margin-sm;
            padding: 2px 8px;
            border-radius: $radius-sm;
            font-size: $font-size-xs;

            .badge-text {
              color: $bg-primary;
              font-weight: $font-weight-medium;
            }

            &.badge-friend {
              background: $success-color;
            }
            &.badge-following {
              background: $primary-color;
            }
            &.badge-blocked {
              background: $text-tertiary;
            }
            &.badge-stranger {
              background: $bg-tertiary;
              .badge-text { color: $text-tertiary; }
            }
          }
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: $margin-sm;
          margin-bottom: $margin-xs;

          .mbti-tag {
            display: inline-block;
            padding: $padding-xs $padding-sm;
            background: $gradient-primary;
            color: $bg-primary;
            font-size: $font-size-sm;
            border-radius: $radius-sm;
            font-weight: $font-weight-medium;
          }

          .online-status {
            display: flex;
            align-items: center;
            gap: 4px;

            .status-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }

            .status-text {
              font-size: $font-size-xs;
              color: $text-tertiary;
            }

            &.online .status-dot { background: $success-color; }
            &.recently .status-dot { background: #f0ad4e; }
            &.today .status-dot { background: $primary-color; }
            &.offline .status-dot { background: $text-tertiary; }
          }
        }

        .age-row {
          display: flex;
          align-items: center;
          gap: 4px;

          .age-text {
            font-size: $font-size-sm;
            color: $text-secondary;
          }

          .privacy-hint {
            font-size: $font-size-xs;
            color: $text-tertiary;
          }
        }
      }

      .more-btn {
        padding: 0 $padding-xs;
        @include transition(opacity);

        &:active { opacity: 0.6; }

        .icon {
          font-size: $font-size-xxl;
          color: $text-tertiary;
          font-weight: $font-weight-bold;
        }
      }
    }

    // MBTI匹配度卡片
    .mbti-match-card {
      background: $bg-primary;
      margin: 0 $margin-md $margin-md;
      padding: $padding-lg;
      border-radius: $radius-lg;

      .match-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $margin-sm;

        .match-title {
          font-size: $font-size-base;
          font-weight: $font-weight-bold;
          color: $text-primary;
        }

        .match-level {
          font-size: $font-size-sm;
          font-weight: $font-weight-medium;
          padding: 2px 8px;
          border-radius: $radius-sm;

          &.level-best { color: $success-color; background: rgba($success-color, 0.1); }
          &.level-good { color: $primary-color; background: rgba($primary-color, 0.1); }
          &.level-neutral { color: $text-tertiary; background: $bg-tertiary; }
          &.level-challenging { color: #e74c3c; background: rgba(#e74c3c, 0.1); }
        }
      }

      .match-score-row {
        display: flex;
        align-items: center;
        gap: $margin-sm;
        margin-bottom: $margin-xs;

        .score-bar {
          flex: 1;
          height: 8px;
          background: $bg-tertiary;
          border-radius: 4px;
          overflow: hidden;

          .score-fill {
            height: 100%;
            border-radius: 4px;
            @include transition(width);

            &.fill-best { background: $success-color; }
            &.fill-good { background: $primary-color; }
            &.fill-neutral { background: $text-tertiary; }
            &.fill-challenging { background: #e74c3c; }
          }
        }

        .score-number {
          font-size: $font-size-xl;
          font-weight: $font-weight-bold;
          color: $text-primary;
          min-width: 40px;
          text-align: right;
        }
      }

      .match-desc {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }
    }

    // 好友进度条
    .friend-progress-card {
      background: $bg-primary;
      margin: 0 $margin-md $margin-md;
      padding: $padding-lg;
      border-radius: $radius-lg;

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $margin-sm;

        .progress-title {
          font-size: $font-size-base;
          font-weight: $font-weight-bold;
          color: $text-primary;
        }

        .progress-hint {
          font-size: $font-size-sm;
          color: $text-tertiary;
        }
      }

      .progress-bar {
        height: 8px;
        background: $bg-tertiary;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: $margin-sm;

        .progress-fill {
          height: 100%;
          background: $gradient-primary;
          border-radius: 4px;
          @include transition(width);
        }
      }

      .progress-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .progress-tip {
          font-size: $font-size-sm;
          color: $text-tertiary;
          flex: 1;
        }

        .add-friend-btn {
          background: $primary-color;
          color: $bg-primary;
          font-size: $font-size-sm;
          padding: 6px 16px;
          border-radius: $radius-full;
          border: none;
          @include active-scale;

          &::after { border: none; }
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

        &:active { transform: scale(0.95); }

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

    .stats-hidden {
      background: $bg-primary;
      padding: $padding-lg $padding-xl;
      display: flex;
      justify-content: center;
      margin-bottom: $margin-md;

      .hidden-text {
        font-size: $font-size-sm;
        color: $text-tertiary;
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

        &::after { border: none; }

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

          &.btn-loading {
            opacity: 0.7;
            pointer-events: none;
          }
        }
      }
    }

    .blocked-notice {
      padding: $padding-lg $padding-xl;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: $bg-primary;
      margin-bottom: $margin-md;

      .blocked-text {
        color: $text-tertiary;
        font-size: $font-size-base;
      }

      .unblock-btn {
        background: $bg-tertiary;
        color: $text-secondary;
        font-size: $font-size-sm;
        padding: 6px 16px;
        border-radius: $radius-full;
        border: none;

        &::after { border: none; }
      }
    }

    // 隐私提示卡片
    .privacy-hints-card {
      background: $bg-primary;
      margin: 0 $margin-md $margin-md;
      padding: $padding-lg;
      border-radius: $radius-lg;

      .hints-title {
        font-size: $font-size-base;
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-bottom: $margin-sm;
      }

      .hint-item {
        display: flex;
        align-items: center;
        gap: $margin-sm;
        padding: 4px 0;

        .hint-icon {
          font-size: $font-size-sm;
        }

        .hint-text {
          font-size: $font-size-sm;
          color: $text-tertiary;
        }
      }
    }

    // 信息卡片（通用样式）
    .info-card {
      background: $bg-primary;
      margin: 0 $margin-md $margin-md;
      padding: $padding-lg;
      border-radius: $radius-lg;

      .card-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-bold;
        color: $text-primary;
        margin-bottom: $margin-md;
      }

      .card-content {
        .info-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: $margin-sm;
          min-height: 40rpx;

          &:last-child {
            margin-bottom: 0;
          }

          .label {
            min-width: 140rpx;
            color: $text-secondary;
            font-size: $font-size-sm;
            flex-shrink: 0;
          }

          .bio-text,
          .contact-value {
            flex: 1;
            color: $text-primary;
            font-size: $font-size-sm;
            line-height: 1.6;
          }

          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: $margin-xs;
            flex: 1;

            .tag {
              padding: 4rpx 16rpx;
              background: $bg-tertiary;
              border-radius: $radius-sm;
              font-size: $font-size-xs;
              color: $text-secondary;
            }
          }

          .copy-btn {
            margin-left: auto;
            padding: 4rpx 24rpx;
            background: $primary-color;
            color: $bg-primary;
            font-size: $font-size-xs;
            border-radius: $radius-sm;
            border: none;
            flex-shrink: 0;

            &::after {
              border: none;
            }

            &:active {
              opacity: 0.8;
            }
          }
        }

        .section-subtitle {
          font-size: $font-size-base;
          font-weight: $font-weight-medium;
          color: $text-primary;
          margin: $margin-md 0 $margin-sm;
          padding-top: $margin-sm;
          border-top: 1px solid $bg-tertiary;
        }
      }
    }

    // 解锁提示卡片
    .locked-card {
      background: $bg-primary;
      margin: 0 $margin-md $margin-md;
      padding: $padding-xl;
      border-radius: $radius-lg;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $margin-sm;

      .lock-icon {
        font-size: 96rpx;
        margin-bottom: $margin-sm;
      }

      .lock-text {
        font-size: $font-size-base;
        color: $text-secondary;
        font-weight: $font-weight-medium;
      }

      .lock-hint {
        font-size: $font-size-sm;
        color: $text-tertiary;
      }

      .unlock-btn {
        margin-top: $margin-md;
        padding: 16rpx 48rpx;
        background: $primary-color;
        color: $bg-primary;
        border-radius: $radius-full;
        border: none;
        font-size: $font-size-base;
        font-weight: $font-weight-medium;

        &::after {
          border: none;
        }

        &:active {
          opacity: 0.8;
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
