import request from '../request'
import type { Friend } from '@/types'
import type { Friendship, UserBlacklist } from '@/types/api/backend-types'

export interface FriendshipStatus {
  isFriend: boolean
  isFollowing: boolean
  canChat: boolean
  chatCount: number
  requiredPoints: number
  currentPoints: number
  status: number
}

export const friendApi = {
  getFriendList: () =>
    request.get<Friendship[]>('/api/v1/friend/list'),

  getFollowingList: () =>
    request.get<Friendship[]>('/api/v1/friend/following'),

  follow: (friendId: number) =>
    request.post<Friendship>('/api/v1/friend/follow', { friendId }),

  friendRequest: (friendId: number, message?: string) =>
    request.post<Friendship>('/api/v1/friend/request', { friendId, message }),

  acceptFriend: (friendId: number) =>
    request.post<{ success: boolean }>('/api/v1/friend/accept', { friendId }),

  unlockChat: (friendId: number) =>
    request.post<{ success: boolean }>('/api/v1/friend/unlock-chat', { friendId }),

  getFriendshipStatus: (userId: number) =>
    request.get<FriendshipStatus>(`/api/v1/friend/status/${userId}`),

  deleteFriend: (userId: number) =>
    request.delete<{ success: boolean }>(`/api/v1/friend/${userId}`),

  blockUser: (blockedUserId: number, reason?: string) =>
    request.post<UserBlacklist>('/api/v1/friend/block', { blockedUserId, reason }),

  getBlocklist: () =>
    request.get<UserBlacklist[]>('/api/v1/friend/blocklist')
}