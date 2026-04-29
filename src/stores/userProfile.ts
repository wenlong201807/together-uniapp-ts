import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/modules/user'
import { friendApi } from '@/api/modules/friend'

/**
 * 关系类型（与后端 FriendService.getRelationshipType 对齐）
 */
export type RelationshipType = 'blocked' | 'stranger' | 'following' | 'friend' | 'self'

/**
 * 好友进度信息
 */
export interface FriendshipProgress {
  chatCount: number
  requiredChatCount: number
  requiredPoints: number
  currentPoints: number
  canAddFriend: boolean
  isFriend: boolean
}

/**
 * 用户详情隐私过滤后的响应类型
 */
export interface UserProfileDetail {
  id: number
  nickname: string
  gender: number
  isVerified: boolean
  mbtiType?: string
  isSelf: boolean
  relationshipType: RelationshipType

  // 头像
  avatarId?: number | null
  avatarUrl?: string | null
  avatarBlur?: boolean

  // 年龄
  age?: number
  ageRange?: string

  // 基础信息
  birthday?: string
  tags?: string[]
  tagsTruncated?: boolean

  // 可见性标记
  photosVisible?: boolean
  locationDetail?: boolean
  locationHint?: string
  contactVisible?: boolean
  incomeVisible?: boolean
  familyVisible?: boolean
  followListVisible?: boolean

  // 在线状态
  onlineStatus?: 'online' | 'recently' | 'today' | 'offline'
  lastActiveAt?: string

  // MBTI匹配
  mbtiMatchScore?: number
  mbtiMatchLevel?: string
  mbtiMatchDescription?: string

  // 好友进度
  friendshipProgress?: FriendshipProgress

  // 隐私提示
  privacyHints?: string[]

  // 统计
  postCount?: number
  followingCount?: number
  followerCount?: number

  // 好友可见
  inviteCode?: string
  createdAt?: string

  // 资料完整度
  profileCompleteness?: number
}

export const useUserProfileStore = defineStore('userProfile', () => {
  // ========== State ==========
  const profile = ref<UserProfileDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const targetUserId = ref<number>(0)

  // ========== Computed ==========
  const relationshipType = computed<RelationshipType>(
    () => profile.value?.relationshipType || 'stranger'
  )

  const isFriend = computed(() => relationshipType.value === 'friend')
  const isFollowing = computed(() => relationshipType.value === 'following')
  const isBlocked = computed(() => relationshipType.value === 'blocked')
  const isSelf = computed(() => profile.value?.isSelf ?? false)
  const isStranger = computed(() => relationshipType.value === 'stranger')

  // 关系徽章文本
  const relationshipBadge = computed(() => {
    switch (relationshipType.value) {
      case 'friend': return '好友'
      case 'following': return '已关注'
      case 'blocked': return '已屏蔽'
      case 'self': return '我'
      default: return '陌生人'
    }
  })

  // 关系徽章样式类
  const relationshipBadgeClass = computed(() => {
    switch (relationshipType.value) {
      case 'friend': return 'badge-friend'
      case 'following': return 'badge-following'
      case 'blocked': return 'badge-blocked'
      default: return 'badge-stranger'
    }
  })

  // 好友进度百分比
  const friendProgressPercent = computed(() => {
    const fp = profile.value?.friendshipProgress
    if (!fp || fp.isFriend) return 100
    const chatPercent = Math.min(
      (fp.chatCount / fp.requiredChatCount) * 100,
      100
    )
    return Math.round(chatPercent)
  })

  // 是否可以添加好友
  const canAddFriend = computed(() => {
    return profile.value?.friendshipProgress?.canAddFriend ?? false
  })

  // 隐私提示集合
  const privacyHints = computed<Set<string>>(() => {
    return new Set(profile.value?.privacyHints || [])
  })

  // ========== Actions ==========
  const fetchProfile = async (userId: number) => {
    targetUserId.value = userId
    loading.value = true
    error.value = null

    try {
      const res = await userApi.getUserProfile(userId)
      profile.value = res.data as UserProfileDetail
    } catch (err: any) {
      error.value = err.message || '加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const refreshProfile = async () => {
    if (targetUserId.value) {
      await fetchProfile(targetUserId.value)
    }
  }

  const reset = () => {
    profile.value = null
    loading.value = false
    error.value = null
    targetUserId.value = 0
  }

  return {
    // state
    profile,
    loading,
    error,
    targetUserId,
    // computed
    relationshipType,
    isFriend,
    isFollowing,
    isBlocked,
    isSelf,
    isStranger,
    relationshipBadge,
    relationshipBadgeClass,
    friendProgressPercent,
    canAddFriend,
    privacyHints,
    // actions
    fetchProfile,
    refreshProfile,
    reset,
  }
})
