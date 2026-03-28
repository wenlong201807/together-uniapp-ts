import request from '../request'
import type { Friend } from '@/types'

export interface FriendshipStatus {
  isFriend: boolean
  isFollowing: boolean
  canChat: boolean
  chatCount: number
  requiredPoints: number
  currentPoints: number
}

export const friendApi = {
  getFriendList: () => request.get<{ data: Friend[] }>('/friend/list'),

  getFollowingList: () => request.get<{ data: Friend[] }>('/friend/following'),

  follow: (userId: number) => request.post('/friend/follow', { userId }),

  unlockChat: (userId: number) => request.post('/friend/unlock-chat', { userId }),

  getFriendshipStatus: (userId: number) => 
    request.get<FriendshipStatus>(`/friend/status/${userId}`),

  deleteFriend: (userId: number) => request.delete(`/friend/${userId}`),

  blockUser: (userId: number, reason?: string) =>
    request.post('/friend/block', { userId, reason }),

  getBlocklist: () => request.get<{ data: Friend[] }>('/friend/blocklist')
}