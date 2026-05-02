/**
 * 消息处理工具函数
 * 用于减少代码重复，提高可维护性
 */

import type { Message } from '@/types'

/**
 * 标准化用户 ID（处理 bigint 字符串转数字）
 */
export const normalizeUserId = (id: string | number): number => {
  if (typeof id === 'number') return id
  const parsed = parseInt(id, 10)
  if (isNaN(parsed)) {
    console.error('[normalizeUserId] Invalid user ID:', id)
    return 0
  }
  return parsed
}

/**
 * 标准化消息对象（统一处理类型转换）
 * @param msg 原始消息对象
 * @param currentUserId 当前用户 ID（用于判断 isSelf）
 * @param forceIsSelf 强制设置 isSelf（优先级最高）
 */
export const normalizeMessage = (
  msg: Message,
  currentUserId?: number,
  forceIsSelf?: boolean
): Message => {
  const senderId = normalizeUserId(msg.senderId)
  const receiverId = normalizeUserId(msg.receiverId)

  return {
    ...msg,
    senderId,
    receiverId,
    isSelf: forceIsSelf !== undefined
      ? forceIsSelf
      : (currentUserId ? senderId === currentUserId : !!msg.isSelf)
  }
}

/**
 * 检查两条消息是否在时间窗口内（用于去重）
 */
export const isWithinTimeWindow = (
  time1: string | Date,
  time2: string | Date,
  windowMs: number
): boolean => {
  const t1 = new Date(time1).getTime()
  const t2 = new Date(time2).getTime()

  // 处理无效日期
  if (isNaN(t1) || isNaN(t2)) {
    console.warn('[isWithinTimeWindow] Invalid date:', time1, time2)
    return false
  }

  return Math.abs(t1 - t2) < windowMs
}

/**
 * 生成临时消息 ID（使用负数避免与数据库 ID 冲突）
 * 使用计数器避免同一毫秒内的 ID 冲突
 */
let tempIdCounter = 0
export const generateTempMessageId = (): number => {
  return -(Date.now() * 1000 + (tempIdCounter++ % 1000))
}

/**
 * 判断是否是临时消息
 */
export const isTempMessage = (messageId: number): boolean => {
  return messageId < 0
}

/**
 * 日志工具（根据环境控制输出）
 */
const isDev = import.meta.env.DEV

interface Logger {
  log: (...args: any[]) => void
  warn: (...args: any[]) void
  error: (...args: any[]) => void
  debug: (...args: any[]) => void
}

export const logger: Logger = isDev ? {
  // 开发环境：完整日志
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  debug: (...args: any[]) => console.debug(...args)
} : {
  // 生产环境：仅警告和错误，且使用空函数避免参数求值
  log: () => {},
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  debug: () => {}
}
