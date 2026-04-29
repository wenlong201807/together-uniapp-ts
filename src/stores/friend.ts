import { defineStore } from 'pinia';
import { ref } from 'vue';
import { friendApi, type FriendshipStatus } from '@/api/modules/friend';
import type { Friend } from '@/types';
import { triggerAfterAddFriend } from '@/composables/useNPS';

interface RelationshipCache {
  [userId: number]: {
    isFriend: boolean;
    cachedAt: number;
    ttl: number;
  };
}

// 常量定义
const MAX_CACHE_SIZE = 100; // 最大缓存数量
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟缓存过期时间

export const useFriendStore = defineStore('friend', () => {
  const friendList = ref<Friend[]>([]);
  const followingList = ref<Friend[]>([]);
  const blocklist = ref<Friend[]>([]);
  const relationshipCache = ref<RelationshipCache>({});

  const fetchFriendList = async () => {
    const res = await friendApi.getFriendList();
    friendList.value = res.data.data || res.data;
  };

  const fetchFollowingList = async () => {
    const res = await friendApi.getFollowingList();
    followingList.value = res.data.data || res.data;
  };

  const getFriendshipStatus = async (
    userId: number,
  ): Promise<FriendshipStatus> => {
    const res = await friendApi.getFriendshipStatus(userId);
    return res.data;
  };

  const follow = async (userId: number) => {
    await friendApi.follow(userId);
    await fetchFollowingList();

    // 关注成功后，检查是否需要触发 NPS
    triggerAfterAddFriend();
  };

  const unlockChat = async (userId: number) => {
    await friendApi.unlockChat(userId);
  };

  const deleteFriend = async (userId: number) => {
    await friendApi.deleteFriend(userId);
    await fetchFriendList();
  };

  const blockUser = async (userId: number, reason?: string) => {
    await friendApi.blockUser(userId, reason);
    await fetchBlocklist();
  };

  const fetchBlocklist = async () => {
    const res = await friendApi.getBlocklist();
    blocklist.value = res.data.data;
  };

  /**
   * 检查是否是好友（带缓存）
   * @param userId 目标用户ID
   * @returns 是否是好友
   */
  const checkIsFriend = async (userId: number): Promise<boolean> => {
    // 1. 检查缓存
    const cached = relationshipCache.value[userId];
    const now = Date.now();
    if (cached && now - cached.cachedAt < cached.ttl) {
      return cached.isFriend;
    }

    // 2. 调用API查询
    try {
      const status = await getFriendshipStatus(userId);
      const isFriend = status.isFriend || false;

      // 3. 限制缓存大小（LRU策略）
      const cacheKeys = Object.keys(relationshipCache.value).map(Number);
      if (cacheKeys.length >= MAX_CACHE_SIZE) {
        // 找到最旧的缓存项并删除
        const oldestKey = cacheKeys.reduce((oldest, key) => {
          const current = relationshipCache.value[key];
          const old = relationshipCache.value[oldest];
          return current.cachedAt < old.cachedAt ? key : oldest;
        });
        delete relationshipCache.value[oldestKey];
      }

      // 4. 更新缓存
      relationshipCache.value[userId] = {
        isFriend,
        cachedAt: now,
        ttl: CACHE_TTL_MS,
      };

      return isFriend;
    } catch (error) {
      console.error('checkIsFriend error:', error);
      // 降级方案：默认为陌生人
      return false;
    }
  };

  /**
   * 清除关系缓存（好友关系变更时调用）
   * @param userId 目标用户ID，不传则清除所有缓存
   */
  const clearRelationshipCache = (userId?: number) => {
    if (userId) {
      delete relationshipCache.value[userId];
    } else {
      relationshipCache.value = {};
    }
  };

  return {
    friendList,
    followingList,
    blocklist,
    relationshipCache,
    fetchFriendList,
    fetchFollowingList,
    getFriendshipStatus,
    follow,
    unlockChat,
    deleteFriend,
    blockUser,
    fetchBlocklist,
    checkIsFriend,
    clearRelationshipCache,
  };
});
