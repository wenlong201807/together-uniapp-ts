import { API_CONFIG } from '@/config'
import { useChatStore } from '@/stores'
import { useAuthStore } from '@/stores'

class WebSocketManager {
  private socket: UniApp.SocketTask | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private isConnecting = false
  private heartbeatTimer: number | null = null

  connect() {
    if (this.isConnecting || this.socket) {
      return
    }

    this.isConnecting = true

    const authStore = useAuthStore()
    const token = authStore.token

    if (!token) {
      console.error('WebSocket: No token available')
      this.isConnecting = false
      return
    }

    this.socket = uni.connectSocket({
      url: `${API_CONFIG.wsURL}?token=${token}`,
      success: () => {
        console.log('WebSocket: Connection initiated')
      },
      fail: (err) => {
        console.error('WebSocket: Connection failed', err)
        this.handleReconnect()
      }
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.onOpen(() => {
      console.log('WebSocket: Connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.startHeartbeat()
    })

    this.socket.onMessage((res) => {
      try {
        const data = JSON.parse(res.data as string)
        this.handleMessage(data)
      } catch (error) {
        console.error('WebSocket: Failed to parse message', error)
      }
    })

    this.socket.onClose(() => {
      console.log('WebSocket: Connection closed')
      this.isConnecting = false
      this.stopHeartbeat()
      this.handleReconnect()
    })

    this.socket.onError((err) => {
      console.error('WebSocket: Error', err)
      this.isConnecting = false
      this.stopHeartbeat()
    })
  }

  private handleMessage(data: any) {
    const chatStore = useChatStore()

    switch (data.type) {
      case 'message':
        chatStore.addMessage(data.payload)
        break
      case 'pong':
        break
      default:
        console.log('WebSocket: Unknown message type', data.type)
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000)
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

  send(data: any) {
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send({
        data: JSON.stringify(data),
        success: () => {
          console.log('WebSocket: Message sent', data)
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

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    this.isConnecting = false
    this.reconnectAttempts = 0
  }
}

export const wsManager = new WebSocketManager()