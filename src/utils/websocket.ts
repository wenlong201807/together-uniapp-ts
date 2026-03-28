import { API_CONFIG } from '@/config'
import { useChatStore } from '@/stores'
import { useAuthStore } from '@/stores'

class WebSocketManager {
  private socketTask: UniApp.SocketTask | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private isConnecting = false
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private isConnected = false

  connect() {
    if (this.isConnecting || this.isConnected) {
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

    // 使用原生 WebSocket URL 格式
    const wsUrl = `${API_CONFIG.wsURL}?token=${token}`
    console.log('WebSocket: Connecting to', wsUrl)

    this.socketTask = uni.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('WebSocket: Connection initiated')
      },
      fail: (err) => {
        console.error('WebSocket: Connection failed', err)
        this.isConnecting = false
        this.handleReconnect()
      }
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socketTask) return

    this.socketTask.onOpen(() => {
      console.log('WebSocket: Connected')
      this.isConnecting = false
      this.isConnected = true
      this.reconnectAttempts = 0
      this.startHeartbeat()
    })

    this.socketTask.onMessage((res) => {
      try {
        const data = res.data as string
        console.log('WebSocket: Raw message', data)
        
        const jsonData = JSON.parse(data)
        this.handleMessage(jsonData)
      } catch (error) {
        console.error('WebSocket: Failed to parse message', error)
      }
    })

    this.socketTask.onClose((res) => {
      console.log('WebSocket: Connection closed', res)
      this.isConnecting = false
      this.isConnected = false
      this.stopHeartbeat()
      this.handleReconnect()
    })

    this.socketTask.onError((err) => {
      console.error('WebSocket: Error', err)
      this.isConnecting = false
      this.isConnected = false
      this.stopHeartbeat()
    })
  }

  private handleMessage(data: any) {
    console.log('WebSocket: Handling message', data)
    const chatStore = useChatStore()

    if (data.type === 'message' && data.data) {
      chatStore.addMessage(data.data)
    } else if (data.type === 'connected') {
      console.log('WebSocket: Server confirmed connection', data)
    } else if (data.type === 'pong') {
      // pong response
    } else if (data.id && data.senderId) {
      // 直接是消息对象
      chatStore.addMessage(data)
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' })
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
      this.socketTask = null
      this.isConnected = false
      this.connect()
    }, this.reconnectDelay)
  }

  send(data: object) {
    if (this.socketTask && this.isConnected) {
      const message = JSON.stringify(data)
      this.socketTask.send({
        data: message,
        success: () => {
          console.log('WebSocket: Message sent', message)
        },
        fail: (err) => {
          console.error('WebSocket: Failed to send message', err)
        }
      })
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

    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }

    this.isConnecting = false
    this.isConnected = false
    this.reconnectAttempts = 0
  }
}

export const wsManager = new WebSocketManager()
