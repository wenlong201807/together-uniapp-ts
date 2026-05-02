import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { chatApi } from '@/api'
import type { Message, Conversation } from '@/types'
import type { SendMessageDto } from '@/api/modules/chat'
import { useAuthStore } from './auth'
import { useNotificationStore } from './notification'
import {
  normalizeUserId,
  normalizeMessage,
  isWithinTimeWindow,
  generateTempMessageId,
  logger
} from './utils/message-utils'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const currentChat = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const unreadCount = ref(0)

  // 会话列表 Map 缓存（性能优化：O(1) 查找）
  // 使用 shallowRef 避免每次 conversations 变化都重建 Map
  const conversationsMap = shallowRef(new Map<number, Conversation>())

  // 更新 Map 缓存的辅助函数
  const updateConversationsMap = () => {
    const newMap = new Map<number, Conversation>()
    conversations.value.forEach(c => newMap.set(c.userId, c))
    conversationsMap.value = newMap
  }

  const fetchConversations = async () => {
    const res = await chatApi.getConversations()
    // 后端返回 avatarUrl/lastTime，前端统一映射为 avatar/lastMessageTime 兼容
    conversations.value = (res.data.data || []).map((c: any) => ({
      ...c,
      avatar: c.avatarUrl || c.avatar,
      avatarUrl: c.avatarUrl || c.avatar,
      lastMessageTime: c.lastTime || c.lastMessageTime,
      lastTime: c.lastTime || c.lastMessageTime,
    }))
    unreadCount.value = res.data.unreadCount || 0

    // 更新 Map 缓存
    updateConversationsMap()
  }

  const fetchHistory = async (userId: number, params?: any) => {
    const authStore = useAuthStore()
    const res = await chatApi.getHistory(userId, params)

    logger.log('fetchHistory - 当前用户ID:', authStore.userInfo?.id)
    logger.log('fetchHistory - 消息数量:', res.data.data.length)

    // 为每条消息添加 isSelf 标识，使用工具函数统一处理
    messages.value = res.data.data.map((msg: Message) => {
      const normalized = normalizeMessage(msg, authStore.userInfo?.id)
      logger.debug(`消息ID ${msg.id}: senderId=${normalized.senderId}, isSelf=${normalized.isSelf}`)
      return normalized
    })
  }

  const sendMessage = async (data: SendMessageDto) => {
    const authStore = useAuthStore()
    const currentUserId = authStore.userInfo?.id

    if (!currentUserId) {
      throw new Error('用户未登录')
    }

    // 生成临时消息 ID（使用工具函数）
    const tempId = generateTempMessageId()

    // 立即添加到消息列表（乐观更新）
    const tempMessage: Message = {
      id: tempId,
      senderId: currentUserId,
      receiverId: data.receiverId,
      content: data.content,
      msgType: data.msgType || 1,
      status: 'sending',
      createdAt: new Date().toISOString(),
      isSelf: true,
    } as Message;

    messages.value.push(tempMessage);

    try {
      // 发送到后端
      const res = await chatApi.sendMessage(data);

      // 替换临时消息为真实消息（使用 splice 确保响应式）
      const index = messages.value.findIndex(m => m.id === tempId && m.status === 'sending');
      if (index !== -1) {
        const realMessage = normalizeMessage(res.data, currentUserId, true);
        messages.value.splice(index, 1, realMessage);
      } else {
        logger.warn('[sendMessage] 未找到临时消息:', tempId);
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

  const updateMessageBadge = () => {
    if (unreadCount.value > 0) {
      uni.setTabBarBadge({
        index: 2,
        text: String(unreadCount.value > 99 ? '99+' : unreadCount.value),
      })
    } else {
      uni.removeTabBarBadge({ index: 2 })
    }
  }

  const markAsRead = async (userId: number) => {
    await chatApi.markAsRead(userId)
    // 使用 Map 缓存查找（O(1) 性能）
    const conversation = conversationsMap.value.get(userId)
    if (conversation) {
      conversation.unreadCount = 0
    }
    // 重新计算总未读数并更新角标
    unreadCount.value = conversations.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    updateMessageBadge()
  }

  const addReceivedMessage = (message: Message) => {
    const authStore = useAuthStore()
    const currentUserId = authStore.userInfo?.id

    // 使用工具函数标准化消息（强制 isSelf = false）
    const normalized = normalizeMessage(message, currentUserId, false)
    const msgSenderId = normalized.senderId
    const msgReceiverId = normalized.receiverId

    logger.log('[WebSocket] 收到新消息:', {
      messageId: normalized.id,
      senderId: msgSenderId,
      receiverId: msgReceiverId,
      currentUserId,
      currentChatUserId: currentChat.value?.userId,
      content: normalized.content
    })

    // 消息去重：检查是否已存在
    const exists = messages.value.some(m => m.id === normalized.id)
    if (exists) {
      logger.log('[WebSocket] 消息已存在，跳过:', normalized.id)
      return
    }

    // 快照当前聊天对象（防止用户快速切换导致竞态条件）
    const currentChatSnapshot = currentChat.value
    const isCurrentChat = currentChatSnapshot && msgSenderId === currentChatSnapshot.userId

    // 构造消息对象（接收到的消息，isSelf 已在 normalized 中设置为 false）
    const messageWithFlag = normalized

    // 如果是当前聊天的消息，添加到消息列表
    if (isCurrentChat) {
      logger.log('[WebSocket] 添加消息到当前聊天')
      messages.value.push(messageWithFlag)
    } else {
      logger.log('[WebSocket] 消息不属于当前聊天，触发通知')
      const notificationStore = useNotificationStore()
      notificationStore.addNotification(messageWithFlag)
    }

    // 更新或创建会话（使用 Map 缓存查找）
    let conversation = conversationsMap.value.get(msgSenderId)
    if (conversation) {
      conversation.lastMessage = normalized.content
      conversation.lastMessageTime = normalized.createdAt

      // 如果不是当前聊天，增加未读数
      if (!isCurrentChat) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1
        unreadCount.value++
        updateMessageBadge()
      }
    } else {
      // 新会话：创建会话项
      conversation = {
        userId: msgSenderId,
        nickname: message.sender?.nickname || '未知用户',
        avatar: message.sender?.avatarUrl || '',
        avatarUrl: message.sender?.avatarUrl || '',
        lastMessage: normalized.content,
        lastMessageTime: normalized.createdAt,
        lastTime: normalized.createdAt,
        unreadCount: isCurrentChat ? 0 : 1,
      }
      conversations.value.unshift(conversation) // 添加到列表顶部

      // 更新 Map 缓存（新增会话）
      conversationsMap.value.set(msgSenderId, conversation)

      if (!isCurrentChat) {
        unreadCount.value++
        updateMessageBadge()
      }
    }
  }

  // 兼容旧代码：addMessage 重定向到 addReceivedMessage
  const addMessage = addReceivedMessage


  const confirmSentMessage = (message: Message) => {
    const authStore = useAuthStore()
    const currentUserId = authStore.userInfo?.id

    // 使用工具函数标准化消息（强制 isSelf = true）
    const normalized = normalizeMessage(message, currentUserId, true)
    const msgSenderId = normalized.senderId
    const msgReceiverId = normalized.receiverId

    logger.log('[WebSocket] 收到发送确认:', {
      messageId: normalized.id,
      senderId: msgSenderId,
      receiverId: msgReceiverId,
      currentUserId,
      currentChatUserId: currentChat.value?.userId,
      content: normalized.content
    })

    // 消息去重：检查是否已存在相同ID的消息
    const exists = messages.value.some(m => m.id === normalized.id)
    if (exists) {
      logger.log('[WebSocket] 发送确认消息已存在，跳过:', normalized.id)
      return
    }

    // 判断是否是当前聊天（接收者是当前聊天对象）
    const isCurrentChat = currentChat.value && msgReceiverId === currentChat.value.userId

    // 查找临时消息（按内容+接收者+时间窗口匹配，更精确）
    const tempIndex = messages.value.findIndex(m =>
      m.status === 'sending' &&
      m.receiverId === msgReceiverId &&
      m.content === normalized.content &&
      isWithinTimeWindow(m.createdAt, normalized.createdAt, 5000) // 5秒时间窗口
    )

    // 构造消息对象（我发送的消息，isSelf 已在 normalized 中设置为 true）
    const messageWithFlag = normalized

    if (tempIndex !== -1) {
      // 替换临时消息为真实消息（使用 splice 确保响应式）
      logger.log('[WebSocket] 替换临时消息:', messages.value[tempIndex].id, '->', normalized.id)
      messages.value.splice(tempIndex, 1, messageWithFlag)
    } else if (isCurrentChat) {
      // 多端同步场景：检查是否有相同内容的消息（防止重复）
      const duplicateIndex = messages.value.findIndex(m =>
        m.receiverId === msgReceiverId &&
        m.content === normalized.content &&
        isWithinTimeWindow(m.createdAt, normalized.createdAt, 2000) // 2秒时间窗口
      )

      if (duplicateIndex === -1) {
        logger.log('[WebSocket] 多端同步：添加已发送消息到当前聊天')
        messages.value.push(messageWithFlag)
      } else {
        logger.log('[WebSocket] 多端同步：消息已存在（按内容去重）')
      }
    } else {
      logger.log('[WebSocket] 发送确认：不是当前聊天，仅更新会话列表')
    }

    // 更新会话列表（我发送的消息，不增加未读数）
    const conversation = conversationsMap.value.get(msgReceiverId)
    if (conversation) {
      conversation.lastMessage = normalized.content
      conversation.lastMessageTime = normalized.createdAt
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
    addReceivedMessage,
    confirmSentMessage,
    setCurrentChat,
    clearMessages,
    updateMessageBadge,
  }
})