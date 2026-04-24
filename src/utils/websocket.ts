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
    // wsURL 格式: ws://host:port 或 http://host:port
    // path 选项指定 Socket.IO 服务器路径（完整路径，包含 /socket.io）
    const wsUrl = API_CONFIG.wsURL.replace('/api/v1/ws', '')
    console.log('WebSocket: Connecting to', wsUrl, 'path: /api/v1/ws/socket.io')

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

    // 处理不同格式的消息
    if (data.type === 'message' && data.data) {
      console.log('[WebSocket] 处理消息类型: message, 数据:', data.data)
      chatStore.addMessage(data.data)
    } else if (data.type === 'message_sent' && data.data) {
      console.log('[WebSocket] 处理消息类型: message_sent, 数据:', data.data)
      chatStore.confirmSentMessage(data.data)
    } else if (data.id && data.senderId && data.content) {
      // 直接是消息对象（兼容旧格式）
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
