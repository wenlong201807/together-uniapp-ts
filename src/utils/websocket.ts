import { API_CONFIG } from '@/config'
import { useChatStore } from '@/stores'
import { useAuthStore } from '@/stores'
import { io, Socket } from 'socket.io-client'

class WebSocketManager {
  private socket: Socket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private isConnecting = false
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null

  connect() {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      console.log('WebSocket: Already connected or connecting')
      return
    }

    this.isConnecting = true

    const authStore = useAuthStore()
    const token = authStore.token || uni.getStorageSync('token')

    console.log('WebSocket: Token:', token ? 'present' : 'missing')

    if (!token) {
      console.error('WebSocket: No token available')
      this.isConnecting = false
      return
    }

    // 使用 Socket.IO 客户端连接
    const wsUrl = API_CONFIG.wsURL.replace('/ws', '')
    console.log('WebSocket: Connecting to', wsUrl)

    this.socket = io(wsUrl, {
      path: '/ws',
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // 手动控制重连
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket: Connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.startHeartbeat()
    })

    this.socket.on('connected', (data) => {
      console.log('WebSocket: Server confirmed connection', data)
    })

    this.socket.on('message', (data) => {
      console.log('WebSocket: Received message', data)
      this.handleMessage(data)
    })

    this.socket.on('pong', (data) => {
      console.log('WebSocket: Received pong', data)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket: Disconnected', reason)
      this.isConnecting = false
      this.stopHeartbeat()
      this.handleReconnect()
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket: Connection error', error)
      this.isConnecting = false
      this.stopHeartbeat()
      this.handleReconnect()
    })
  }

  private handleMessage(data: any) {
    console.log('[WebSocket] 收到原始消息:', JSON.stringify(data))
    const chatStore = useChatStore()

    if (data.type === 'message' && data.data) {
      console.log('[WebSocket] 处理消息类型: message, 数据:', data.data)
      chatStore.addMessage(data.data)
    } else if (data.type === 'message_sent' && data.data) {
      console.log('[WebSocket] 处理消息类型: message_sent, 数据:', data.data)
      chatStore.confirmSentMessage(data.data)
    } else if (data.id && data.senderId) {
      // 直接是消息对象
      console.log('[WebSocket] 处理直接消息对象:', data)
      chatStore.addMessage(data)
    } else {
      console.log('[WebSocket] 未知消息类型:', data)
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
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket: Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`WebSocket: Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.socket = null
      this.connect()
    }, this.reconnectDelay)
  }

  send(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
      console.log('WebSocket: Message sent', event, data)
    } else {
      console.error('WebSocket: Not connected')
    }
  }

  disconnect() {
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.isConnecting = false
    this.reconnectAttempts = 0
  }
}

export const wsManager = new WebSocketManager()
