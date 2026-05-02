/**
 * 消息处理工具函数
 * 用于减少代码重复，提高可维护性
 */

import type { Message } from '@/types'

/**
 * 标准化用户 ID（处理 bigint 字符串转数字）
 */
export const normalizeUserId = (id: string | number): number => {
  return typeof id === 'string' ? parseInt(id, 10) : id
}

/**
 * 标准化消息对象（统一处理类型转换）
 */
export const normalizeMessage = (msg: Message, currentUserId?: number): Message => {
  const senderId = normalizeUserId(msg.senderId)
  const receiverId = normalizeUserId(msg.receiverId)

  return {
    ...msg,
    senderId,
    receiverId,
    isSelf: currentUserId ? senderId === currentUserId : !!msg.isSelf
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
  return Math.abs(t1 - t2) < windowMs
}

/**
 * 生成临时消息 ID（使用负数避免与数据库 ID 冲突）
 */
export const generateTempMessageId = (): number => {
  return -Date.now()
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

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },
  warn: (...args: any[]) => {
    console.warn(...args)
  },
  error: (...args: any[]) => {
    console.error(...args)
  },
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args)
  }
}
