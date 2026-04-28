/**
 * 图片加载队列管理器
 * 支持优先级队列和并发控制
 */

export enum ImagePriority {
  CRITICAL = 'critical', // 立即加载（首屏头像、Banner第一张）
  HIGH = 'high',         // 100ms延迟（首屏相册、可视区域图片）
  LOW = 'low'            // 500ms延迟（缓冲区、预加载图片）
}

export interface ImageLoadTask {
  id: string
  url: string
  priority: ImagePriority
  retryCount: number
  maxRetries: number
  onSuccess: (url: string) => void
  onError: (error: Error) => void
  timestamp: number
}

export class ImageLoadQueue {
  private queue: ImageLoadTask[] = []
  private loading: Set<string> = new Set()
  private allTasks: Set<string> = new Set() // 所有任务ID（队列+加载中）
  private cancelledTasks: Set<string> = new Set() // 已取消的任务ID
  private maxConcurrent: number
  private retryDelay: number = 1000

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * 添加加载任务
   */
  add(
    id: string,
    url: string,
    priority: ImagePriority = ImagePriority.HIGH,
    onSuccess: (url: string) => void,
    onError: (error: Error) => void,
    maxRetries: number = 3
  ) {
    // 检查是否已存在（O(1) 查找）
    if (this.allTasks.has(id)) {
      if (import.meta.env.DEV) {
        console.log(`[ImageLoadQueue] Task ${id} already exists`)
      }
      return
    }

    // 检查是否已被取消
    if (this.cancelledTasks.has(id)) {
      this.cancelledTasks.delete(id) // 清除取消标记，允许重新添加
    }

    const task: ImageLoadTask = {
      id,
      url,
      priority,
      retryCount: 0,
      maxRetries,
      onSuccess,
      onError,
      timestamp: Date.now()
    }

    // 根据优先级插入队列
    this.insertByPriority(task)
    this.allTasks.add(id)

    // 尝试处理队列
    this.processQueue()
  }

  /**
   * 按优先级插入任务
   */
  private insertByPriority(task: ImageLoadTask) {
    const priorityOrder = {
      [ImagePriority.CRITICAL]: 0,
      [ImagePriority.HIGH]: 1,
      [ImagePriority.LOW]: 2
    }

    let insertIndex = this.queue.length

    for (let i = 0; i < this.queue.length; i++) {
      if (priorityOrder[task.priority] < priorityOrder[this.queue[i].priority]) {
        insertIndex = i
        break
      }
    }

    this.queue.splice(insertIndex, 0, task)
  }

  /**
   * 处理队列（非阻塞，填满所有并发槽位）
   */
  private processQueue() {
    // 尽可能多地启动任务，直到达到并发上限
    while (this.loading.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()
      if (!task) break

      // 标记为加载中
      this.loading.add(task.id)

      // 异步执行加载（不阻塞）
      this.loadImage(task)
    }
  }

  /**
   * 获取优先级对应的延迟时间
   */
  private getDelayByPriority(priority: ImagePriority): number {
    switch (priority) {
      case ImagePriority.CRITICAL:
        return 0
      case ImagePriority.HIGH:
        return 100
      case ImagePriority.LOW:
        return 500
      default:
        return 0
    }
  }

  /**
   * 加载图片
   */
  private async loadImage(task: ImageLoadTask) {
    // 检查是否已被取消
    if (this.cancelledTasks.has(task.id)) {
      this.loading.delete(task.id)
      this.allTasks.delete(task.id)
      this.cancelledTasks.delete(task.id)
      this.processQueue()
      return
    }

    // 根据优先级延迟
    const delay = this.getDelayByPriority(task.priority)
    if (delay > 0) {
      await this.sleep(delay)
    }

    // 再次检查是否已被取消（延迟期间可能被取消）
    if (this.cancelledTasks.has(task.id)) {
      this.loading.delete(task.id)
      this.allTasks.delete(task.id)
      this.cancelledTasks.delete(task.id)
      this.processQueue()
      return
    }

    try {
      // 使用 uni.getImageInfo 预加载图片
      await new Promise<void>((resolve, reject) => {
        uni.getImageInfo({
          src: task.url,
          success: () => {
            // 最后一次检查是否已被取消
            if (this.cancelledTasks.has(task.id)) {
              reject(new Error('Task cancelled'))
            } else {
              resolve()
            }
          },
          fail: (err) => {
            reject(new Error(err.errMsg || 'Image load failed'))
          }
        })
      })

      // 加载成功
      task.onSuccess(task.url)
      this.loading.delete(task.id)
      this.allTasks.delete(task.id)

      // 继续处理队列
      this.processQueue()
    } catch (error) {
      // 检查是否是取消导致的错误
      if (this.cancelledTasks.has(task.id)) {
        this.loading.delete(task.id)
        this.allTasks.delete(task.id)
        this.cancelledTasks.delete(task.id)
        this.processQueue()
        return
      }

      // 加载失败，尝试重试
      if (task.retryCount < task.maxRetries) {
        task.retryCount++
        if (import.meta.env.DEV) {
          console.log(`[ImageLoadQueue] Retry ${task.retryCount}/${task.maxRetries} for ${task.id}`)
        }

        // 使用 setTimeout 异步调度重试，避免递归调用栈过深
        this.loading.delete(task.id)
        setTimeout(() => {
          // 重试前再次检查是否已被取消
          if (!this.cancelledTasks.has(task.id)) {
            this.insertByPriority(task)
            this.processQueue()
          } else {
            this.allTasks.delete(task.id)
            this.cancelledTasks.delete(task.id)
          }
        }, this.retryDelay * task.retryCount)
      } else {
        // 重试次数用尽
        if (import.meta.env.DEV) {
          console.error(`[ImageLoadQueue] Failed to load ${task.id} after ${task.maxRetries} retries`)
        }
        task.onError(error as Error)
        this.loading.delete(task.id)
        this.allTasks.delete(task.id)
        this.processQueue()
      }
    }
  }

  /**
   * 取消任务
   */
  cancel(id: string) {
    // 标记为已取消
    this.cancelledTasks.add(id)

    // 从队列中移除
    const index = this.queue.findIndex(task => task.id === id)
    if (index > -1) {
      this.queue.splice(index, 1)
      this.allTasks.delete(id)
      if (import.meta.env.DEV) {
        console.log(`[ImageLoadQueue] Cancelled task ${id} from queue`)
      }
    }

    // 如果正在加载中，无法立即中断 uni.getImageInfo
    // 但已标记为取消，loadImage 会在各个检查点退出
    if (this.loading.has(id)) {
      if (import.meta.env.DEV) {
        console.log(`[ImageLoadQueue] Task ${id} is loading, will be cancelled at next checkpoint`)
      }
    }
  }

  /**
   * 清空队列
   */
  clear() {
    // 标记所有任务为已取消
    this.allTasks.forEach(id => this.cancelledTasks.add(id))

    this.queue = []
    this.loading.clear()
    this.allTasks.clear()

    if (import.meta.env.DEV) {
      console.log('[ImageLoadQueue] Cleared all tasks')
    }
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      loadingCount: this.loading.size,
      totalPending: this.queue.length + this.loading.size
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 全局单例
let globalQueue: ImageLoadQueue | null = null

/**
 * 获取全局图片加载队列
 */
export function getGlobalImageQueue(maxConcurrent: number = 3): ImageLoadQueue {
  if (!globalQueue) {
    globalQueue = new ImageLoadQueue(maxConcurrent)
  }
  return globalQueue
}

/**
 * 销毁全局图片加载队列
 */
export function destroyGlobalImageQueue() {
  if (globalQueue) {
    globalQueue.clear()
    globalQueue = null
  }
}
