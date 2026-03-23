import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatApi } from '@/api'
import type { Message, Conversation } from '@/types'
import type { SendMessageDto } from '@/api/modules/chat'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const currentChat = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const unreadCount = ref(0)

  const fetchConversations = async () => {
    const res = await chatApi.getConversations()
    conversations.value = res.data.data
    unreadCount.value = res.data.unreadCount || 0
  }

  const fetchHistory = async (userId: number, params?: any) => {
    const res = await chatApi.getHistory(userId, params)
    messages.value = res.data.data
  }

  const sendMessage = async (data: SendMessageDto) => {
    const res = await chatApi.sendMessage(data)
    messages.value.push(res.data)
    return res.data
  }

  const markAsRead = async (userId: number) => {
    await chatApi.markAsRead(userId)
    const conversation = conversations.value.find((c) => c.userId === userId)
    if (conversation) {
      conversation.unreadCount = 0
    }
  }

  const addMessage = (message: Message) => {
    messages.value.push(message)

    const conversation = conversations.value.find((c) => c.userId === message.senderId)
    if (conversation) {
      conversation.lastMessage = message.content
      conversation.lastMessageTime = message.createdAt
      if (message.senderId !== currentChat.value?.userId) {
        conversation.unreadCount++
        unreadCount.value++
      }
    }
  }

  const setCurrentChat = (chat: Conversation | null) => {
    currentChat.value = chat
  }

  const clearMessages = () => {
    messages.value = []
  }

  return {
    conversations,
    currentChat,
    messages,
    unreadCount,
    fetchConversations,
    fetchHistory,
    sendMessage,
    markAsRead,
    addMessage,
    setCurrentChat,
    clearMessages
  }
})