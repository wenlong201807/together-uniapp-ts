import { defineStore } from 'pinia';
import { ref } from 'vue';
import { friendApi, type FriendshipStatus } from '@/api/modules/friend';
import type { Friend } from '@/types';
import { triggerAfterAddFriend } from '@/composables/useNPS';

export const useFriendStore = defineStore('friend', () => {
  const friendList = ref<Friend[]>([]);
  const followingList = ref<Friend[]>([]);
  const blocklist = ref<Friend[]>([]);

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

  return {
    friendList,
    followingList,
    blocklist,
    fetchFriendList,
    fetchFollowingList,
    getFriendshipStatus,
    follow,
    unlockChat,
    deleteFriend,
    blockUser,
    fetchBlocklist,
  };
});
