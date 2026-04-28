/**
 * IntersectionObserver 管理器
 * 用于监听图片进入/离开可视区域
 */

export type ObserverCallback = (isIntersecting: boolean, entry?: any) => void

export interface ObserverOptions {
  root?: any
  rootMargin?: string
  threshold?: number | number[]
}

export class IntersectionObserverManager {
  private observers: Map<string, UniApp.IntersectionObserver> = new Map()
  private callbacks: Map<string, ObserverCallback> = new Map()
  private observedElements: Set<string> = new Set()
  private options: ObserverOptions

  constructor(options: ObserverOptions = {}) {
    this.options = {
      rootMargin: '200px 0px', // 提前 200px 触发
      threshold: [0, 0.1, 0.5, 1.0],
      ...options
    }
  }

  /**
   * 为每个元素创建独立的 Observer
   */
  private createObserver(elementId: string): UniApp.IntersectionObserver {
    const observer = uni.createIntersectionObserver(null, {
      thresholds: Array.isArray(this.options.threshold)
        ? this.options.threshold
        : [this.options.threshold || 0],
      initialRatio: 0,
      observeAll: false
    })

    // 设置相对区域（rootMargin）
    const margins = this.parseRootMargin(this.options.rootMargin || '0px')
    observer.relativeToViewport(margins)

    return observer
  }

  /**
   * 解析 rootMargin 字符串
   */
  private parseRootMargin(rootMargin: string): {
    top?: number
    right?: number
    bottom?: number
    left?: number
  } {
    const parts = rootMargin.split(' ').map(p => parseInt(p))

    if (parts.length === 1) {
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] }
    } else if (parts.length === 2) {
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }
    } else if (parts.length === 4) {
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
    }

    return {}
  }

  /**
   * 观察元素
   */
  observe(elementId: string, callback: ObserverCallback) {
    if (this.observedElements.has(elementId)) {
      console.warn(`[IntersectionObserver] Element ${elementId} is already observed`)
      return
    }

    this.callbacks.set(elementId, callback)
    this.observedElements.add(elementId)

    // 为每个元素创建独立的 observer
    const observer = this.createObserver(elementId)
    this.observers.set(elementId, observer)

    // 观察元素
    observer.observe(`#${elementId}`, (res: any) => {
      const cb = this.callbacks.get(elementId)
      if (cb) {
        cb(res.intersectionRatio > 0, res)
      }
    })
  }

  /**
   * 取消观察元素
   */
  unobserve(elementId: string) {
    if (!this.observedElements.has(elementId)) {
      return
    }

    // 断开并销毁该元素的 observer
    const observer = this.observers.get(elementId)
    if (observer) {
      observer.disconnect()
      this.observers.delete(elementId)
    }

    this.callbacks.delete(elementId)
    this.observedElements.delete(elementId)
  }

  /**
   * 断开所有观察
   */
  disconnect() {
    this.observers.forEach(observer => {
      observer.disconnect()
    })
    this.observers.clear()
    this.callbacks.clear()
    this.observedElements.clear()
  }

  /**
   * 获取当前观察的元素数量
   */
  getObservedCount(): number {
    return this.observedElements.size
  }
}

// 全局单例
let globalObserver: IntersectionObserverManager | null = null

/**
 * 获取全局 IntersectionObserver 实例
 */
export function getGlobalObserver(options?: ObserverOptions): IntersectionObserverManager {
  if (!globalObserver) {
    globalObserver = new IntersectionObserverManager(options)
  }
  return globalObserver
}

/**
 * 销毁全局 IntersectionObserver 实例
 */
export function destroyGlobalObserver() {
  if (globalObserver) {
    globalObserver.disconnect()
    globalObserver = null
  }
}
