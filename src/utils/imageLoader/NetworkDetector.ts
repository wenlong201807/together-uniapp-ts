/**
 * 网络检测工具
 * 检测网络类型和速度
 */

export enum NetworkType {
  WIFI = 'wifi',
  CELLULAR_5G = '5g',
  CELLULAR_4G = '4g',
  CELLULAR_3G = '3g',
  CELLULAR_2G = '2g',
  UNKNOWN = 'unknown',
  NONE = 'none'
}

export enum NetworkSpeed {
  FAST = 'fast',      // WiFi, 5G
  MEDIUM = 'medium',  // 4G
  SLOW = 'slow',      // 3G, 2G
  OFFLINE = 'offline'
}

export interface NetworkInfo {
  type: NetworkType
  speed: NetworkSpeed
  isSlowNetwork: boolean
  isOffline: boolean
}

export class NetworkDetector {
  private currentNetwork: NetworkInfo = {
    type: NetworkType.UNKNOWN,
    speed: NetworkSpeed.MEDIUM,
    isSlowNetwork: false,
    isOffline: false
  }

  private listeners: Set<(info: NetworkInfo) => void> = new Set()

  constructor() {
    this.detectNetwork()
    this.setupNetworkListener()
  }

  /**
   * 检测当前网络
   */
  private detectNetwork() {
    uni.getNetworkType({
      success: (res) => {
        const networkType = res.networkType.toLowerCase()
        this.updateNetworkInfo(networkType)
      },
      fail: () => {
        this.updateNetworkInfo('unknown')
      }
    })
  }

  /**
   * 更新网络信息
   */
  private updateNetworkInfo(networkType: string) {
    let type: NetworkType
    let speed: NetworkSpeed
    let isSlowNetwork = false
    let isOffline = false

    switch (networkType) {
      case 'wifi':
        type = NetworkType.WIFI
        speed = NetworkSpeed.FAST
        break
      case '5g':
        type = NetworkType.CELLULAR_5G
        speed = NetworkSpeed.FAST
        break
      case '4g':
        type = NetworkType.CELLULAR_4G
        speed = NetworkSpeed.MEDIUM
        break
      case '3g':
        type = NetworkType.CELLULAR_3G
        speed = NetworkSpeed.SLOW
        isSlowNetwork = true
        break
      case '2g':
        type = NetworkType.CELLULAR_2G
        speed = NetworkSpeed.SLOW
        isSlowNetwork = true
        break
      case 'none':
        type = NetworkType.NONE
        speed = NetworkSpeed.OFFLINE
        isOffline = true
        break
      default:
        type = NetworkType.UNKNOWN
        speed = NetworkSpeed.MEDIUM
    }

    this.currentNetwork = { type, speed, isSlowNetwork, isOffline }

    console.log('[NetworkDetector] Network updated:', this.currentNetwork)

    // 通知监听器
    this.notifyListeners()
  }

  /**
   * 监听网络变化
   */
  private setupNetworkListener() {
    uni.onNetworkStatusChange((res) => {
      const networkType = res.networkType.toLowerCase()
      this.updateNetworkInfo(networkType)
    })
  }

  /**
   * 获取当前网络信息
   */
  getNetworkInfo(): NetworkInfo {
    return { ...this.currentNetwork }
  }

  /**
   * 是否为慢速网络
   */
  isSlowNetwork(): boolean {
    return this.currentNetwork.isSlowNetwork
  }

  /**
   * 是否离线
   */
  isOffline(): boolean {
    return this.currentNetwork.isOffline
  }

  /**
   * 添加网络变化监听器
   */
  addListener(callback: (info: NetworkInfo) => void) {
    this.listeners.add(callback)
  }

  /**
   * 移除监听器
   */
  removeListener(callback: (info: NetworkInfo) => void) {
    this.listeners.delete(callback)
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach(callback => {
      callback(this.currentNetwork)
    })
  }
}

// 全局单例
let globalDetector: NetworkDetector | null = null

/**
 * 获取全局网络检测器
 */
export function getGlobalNetworkDetector(): NetworkDetector {
  if (!globalDetector) {
    globalDetector = new NetworkDetector()
  }
  return globalDetector
}

/**
 * 销毁全局网络检测器
 */
export function destroyGlobalNetworkDetector() {
  if (globalDetector) {
    globalDetector = null
  }
}
