import { defineStore } from 'pinia'
import { ref } from 'vue'
import { friendApi } from '@/api'
import type { Friend } from '@/types'

export const useFriendStore = defineStore('friend', () => {
  const friendList = ref<Friend[]>([])
  const followingList = ref<Friend[]>([])
  const blocklist = ref<Friend[]>([])

  const fetchFriendList = async () => {
    const res = await friendApi.getFriendList()
    friendList.value = res.data.data
  }

  const fetchFollowingList = async () => {
    const res = await friendApi.getFollowingList()
    followingList.value = res.data.data
  }

  const follow = async (userId: number) => {
    await friendApi.follow(userId)
    await fetchFollowingList()
  }

  const unlockChat = async (userId: number) => {
    await friendApi.unlockChat(userId)
  }

  const deleteFriend = async (userId: number) => {
    await friendApi.deleteFriend(userId)
    await fetchFriendList()
  }

  const blockUser = async (userId: number, reason?: string) => {
    await friendApi.blockUser(userId, reason)
    await fetchBlocklist()
  }

  const fetchBlocklist = async () => {
    const res = await friendApi.getBlocklist()
    blocklist.value = res.data.data
  }

  return {
    friendList,
    followingList,
    blocklist,
    fetchFriendList,
    fetchFollowingList,
    follow,
    unlockChat,
    deleteFriend,
    blockUser,
    fetchBlocklist
  }
})