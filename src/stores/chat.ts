import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatApi } from '@/api'
import type { Message, Conversation } from '@/types'
import type { SendMessageDto } from '@/api/modules/chat'
import { useAuthStore } from './auth'

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
    const authStore = useAuthStore()
    const res = await chatApi.getHistory(userId, params)

    console.log('fetchHistory - 当前用户ID:', authStore.userInfo?.id)
    console.log('fetchHistory - 消息数量:', res.data.data.length)

    // 为每条消息添加 isSelf 标识
    // 注意：后端 senderId 可能是字符串类型（bigint），需要转换为数字比较
    messages.value = res.data.data.map((msg: Message) => {
      const msgSenderId = typeof msg.senderId === 'string' ? parseInt(msg.senderId) : msg.senderId
      const currentUserId = authStore.userInfo?.id
      const isSelf = msgSenderId === currentUserId
      console.log(`消息ID ${msg.id}: senderId=${msg.senderId}(${msgSenderId}), 当前用户=${currentUserId}, isSelf=${isSelf}`)
      return {
        ...msg,
        senderId: msgSenderId, // 统一转换为数字
        receiverId: typeof msg.receiverId === 'string' ? parseInt(msg.receiverId) : msg.receiverId,
        isSelf
      }
    })
  }

  const sendMessage = async (data: SendMessageDto) => {
    // 生成临时消息 ID
    const tempId = Date.now();

    // 立即添加到消息列表（乐观更新）
    const tempMessage: Message = {
      id: tempId,
      senderId: 0, // 会被 isSelf 判断覆盖
      receiverId: data.receiverId,
      content: data.content,
      msgType: data.msgType || 1,
      status: 'sending',
      createdAt: new Date().toISOString(),
      isSelf: true, // 标记为自己发送的消息
    } as Message;

    messages.value.push(tempMessage);

    try {
      // 发送到后端
      const res = await chatApi.sendMessage(data);

      // 替换临时消息为真实消息
      const index = messages.value.findIndex(m => m.id === tempId);
      if (index !== -1) {
        messages.value[index] = {
          ...res.data,
          isSelf: true,
        };
      }

      return res.data;
    } catch (error) {
      // 发送失败，更新消息状态
      const index = messages.value.findIndex(m => m.id === tempId);
      if (index !== -1) {
        messages.value[index].status = 'failed';
      }
      throw error;
    }
  }

  const markAsRead = async (userId: number) => {
    await chatApi.markAsRead(userId)
    const conversation = conversations.value.find((c) => c.userId === userId)
    if (conversation) {
      conversation.unreadCount = 0
    }
  }

  const addMessage = (message: Message) => {
    const authStore = useAuthStore()

    // 后端 senderId 可能是字符串类型（bigint），需要转换为数字比较
    const msgSenderId = typeof message.senderId === 'string' ? parseInt(message.senderId) : message.senderId
    const currentUserId = authStore.userInfo?.id

    // 为接收到的消息添加 isSelf 标识
    const messageWithFlag = {
      ...message,
      senderId: msgSenderId, // 统一转换为数字
      receiverId: typeof message.receiverId === 'string' ? parseInt(message.receiverId) : message.receiverId,
      isSelf: msgSenderId === currentUserId
    }

    messages.value.push(messageWithFlag)

    const conversation = conversations.value.find((c) => c.userId === msgSenderId)
    if (conversation) {
      conversation.lastMessage = message.content
      conversation.lastMessageTime = message.createdAt
      if (msgSenderId !== currentChat.value?.userId) {
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