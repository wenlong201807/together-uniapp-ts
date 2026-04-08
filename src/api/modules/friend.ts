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
    request.get<Friendship[]>('/friend/list'),

  getFollowingList: () =>
    request.get<Friendship[]>('/friend/following'),

  follow: (friendId: number) =>
    request.post<Friendship>('/friend/follow', { friendId }),

  friendRequest: (friendId: number, message?: string) =>
    request.post<Friendship>('/friend/request', { friendId, message }),

  acceptFriend: (friendId: number) =>
    request.post<{ success: boolean }>('/friend/accept', { friendId }),

  unlockChat: (friendId: number) =>
    request.post<{ success: boolean }>('/friend/unlock-chat', { friendId }),

  getFriendshipStatus: (userId: number) =>
    request.get<FriendshipStatus>(`/friend/status/${userId}`),

  deleteFriend: (userId: number) =>
    request.delete<{ success: boolean }>(`/friend/${userId}`),

  blockUser: (blockedUserId: number, reason?: string) =>
    request.post<UserBlacklist>('/friend/block', { blockedUserId, reason }),

  getBlocklist: () =>
    request.get<UserBlacklist[]>('/friend/blocklist')
}