import { API_CONFIG } from '@/config'
import { useChatStore } from '@/stores'
import { useAuthStore } from '@/stores'
import { io, Socket } from 'socket.io-client'
import { logger } from '@/stores/utils/message-utils'

class WebSocketManager {
  private socket: Socket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private isConnecting = false
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private manualDisconnect = false // 标记是否为手动断开连接

  /** 当前是否已连接 */
  get isConnected(): boolean {
    return !!this.socket && this.socket.connected
  }

  async connect() {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      logger.log('WebSocket: Already connected or connecting')
      return
    }

    this.isConnecting = true
    this.manualDisconnect = false // 重置手动断开标记

    const authStore = useAuthStore()
    let token = authStore.token || uni.getStorageSync('token')

    logger.log('WebSocket: Token:', token ? 'present' : 'missing')

    if (!token) {
      logger.error('WebSocket: No token available')
      this.isConnecting = false
      return
    }

    // 检查token是否即将过期或已过期，如果是则先刷新
    try {
      const tokenPayload = this.parseJwt(token)
      if (tokenPayload && tokenPayload.exp) {
        const expiresAt = tokenPayload.exp * 1000 // 转换为毫秒
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        // 如果token即将过期或已过期，先刷新
        if (timeUntilExpiry < 5 * 60 * 1000) {
          logger.log('WebSocket: Token expiring soon or expired, refreshing...')
          try {
            await authStore.refreshAccessToken()
            token = authStore.token || uni.getStorageSync('token')
            logger.log('WebSocket: Token refreshed successfully')
          } catch (error) {
            logger.error('WebSocket: Failed to refresh token:', error)
            this.isConnecting = false
            return
          }
        }
      }
    } catch (error) {
      logger.error('WebSocket: Failed to parse token:', error)
    }

    // 使用 Socket.IO 客户端连接
    // wsURL 格式: ws://host:port 或 http://host:port
    // path 选项指定 Socket.IO 服务器路径（完整路径，包含 /socket.io）
    const wsUrl = API_CONFIG.wsURL.replace('/api/v1/ws', '')
    logger.log('WebSocket: Connecting to', wsUrl, 'path: /api/v1/ws/socket.io')

    this.socket = io(wsUrl, {
      path: '/api/v1/ws/socket.io',  // 修复：完整的 Socket.IO 路径
      auth: {
        token: token
      },
      transports: ['polling', 'websocket'],  // 修复：先 polling 握手，再升级到 websocket
      reconnection: true, // 启用自动重连
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    this.setupEventListeners()
  }

  // 解析JWT token
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      logger.error('Failed to parse JWT:', error)
      return null
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      logger.log('WebSocket: Connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.startHeartbeat()
    })

    this.socket.on('connected', (data) => {
      logger.log('WebSocket: Server confirmed connection', data)
    })

    this.socket.on('message', (data) => {
      logger.log('WebSocket: Received message', data)
      this.handleMessage(data)
    })

    this.socket.on('pong', (data) => {
      logger.log('WebSocket: Received pong', data)
    })

    this.socket.on('disconnect', (reason) => {
      logger.log('WebSocket: Disconnected', reason)
      this.isConnecting = false
      this.stopHeartbeat()
      this.handleReconnect()
    })

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket: Connection error', error)
      this.isConnecting = false
      this.stopHeartbeat()
      this.handleReconnect()
    })
  }

  private handleMessage(data: any) {
    logger.log('[WebSocket] 收到原始消息:', JSON.stringify(data))
    const chatStore = useChatStore()

    // 验证消息格式
    const isValidMessage = (msg: any): boolean => {
      return msg && typeof msg.id !== 'undefined' && msg.senderId && msg.receiverId && msg.content
    }

    // 职责分离：根据消息类型调用不同的处理方法
    if (data.type === 'message' && isValidMessage(data.data)) {
      // 接收到别人发来的消息
      logger.log('[WebSocket] 处理接收消息 (message):', data.data)
      chatStore.addReceivedMessage(data.data)
    } else if (data.type === 'message_sent' && isValidMessage(data.data)) {
      // 我发送的消息确认（多端同步）
      logger.log('[WebSocket] 处理发送确认 (message_sent):', data.data)
      chatStore.confirmSentMessage(data.data)
    } else if (isValidMessage(data)) {
      // 兼容旧格式：直接是消息对象（默认当作接收消息处理）
      logger.log('[WebSocket] 处理直接消息对象（兼容模式）:', data)
      chatStore.addReceivedMessage(data)
    } else {
      logger.warn('[WebSocket] 无效消息格式:', data)
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping')
      }
    }, 25000)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private handleReconnect() {
    // 如果是手动断开连接，不进行重连
    if (this.manualDisconnect) {
      logger.log('WebSocket: Manual disconnect, skip reconnection')
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('WebSocket: Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    logger.log(`WebSocket: Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.socket = null
      this.connect()
    }, this.reconnectDelay)
  }

  send(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
      logger.log('WebSocket: Message sent', event, data)
    } else {
      logger.error('WebSocket: Not connected')
    }
  }

  disconnect() {
    logger.log('WebSocket: Manual disconnect initiated')
    this.manualDisconnect = true // 标记为手动断开
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      // 移除所有事件监听器，防止内存泄漏
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    this.isConnecting = false
    this.reconnectAttempts = 0
  }
}

export const wsManager = new WebSocketManager()
