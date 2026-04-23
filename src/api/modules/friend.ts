import request from '../request'
import type { Friend } from '@/types'
import type { Friendship, UserBlacklist } from '@/types/api/backend-types'

export interface FriendshipStatus {
  isFriend: boolean
  isFollowing: boolean
  canAddFriend: boolean
  chatCount: number
  requiredChatCount: number
  requiredPoints: number
  currentPoints: number
  status: number
}

export const friendApi = {
  getFriendList: () =>
    request.get<Friendship[]>('/friend/list'),

  getFollowingList: () =>
    request.get<Friendship[]>('/friend/following'),

  getUserFollowingList: (userId: number) =>
    request.get<Friendship[]>(`/friend/following/${userId}`),

  getFollowersList: () =>
    request.get<Friendship[]>('/friend/followers'),

  getUserFollowersList: (userId: number) =>
    request.get<Friendship[]>(`/friend/followers/${userId}`),

  follow: (friendId: number) =>
    request.post<Friendship>('/friend/follow', { friendId }),

  unfollow: (friendId: number) =>
    request.post<{ success: boolean }>('/friend/unfollow', { friendId }),

  friendRequest: (friendId: number, message?: string) =>
    request.post<Friendship>('/friend/request', { friendId, message }),

  acceptFriend: (friendId: number) =>
    request.post<{ success: boolean }>('/friend/accept', { friendId }),

  addFriend: (friendId: number) =>
    request.post<{ success: boolean; pointsConsumed: number }>('/friend/add-friend', { friendId }),

  getFriendshipStatus: (userId: number) =>
    request.get<FriendshipStatus>(`/friend/status/${userId}`),

  deleteFriend: (userId: number) =>
    request.delete<{ success: boolean }>(`/friend/${userId}`),

  blockUser: (blockedUserId: number, reason?: string) =>
    request.post<UserBlacklist>('/friend/block', { blockedUserId, reason }),

  getBlocklist: () =>
    request.get<UserBlacklist[]>('/friend/blocklist')
}