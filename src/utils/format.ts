import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const formatTime = (time: string | Date): string => {
  if (!time) return ''
  const date = dayjs(time)
  const now = dayjs()
  const diff = now.diff(date, 'day')

  if (diff === 0) {
    return date.format('HH:mm')
  } else if (diff === 1) {
    return '昨天'
  } else if (diff < 7) {
    return date.format('dddd')
  } else {
    return date.format('MM-DD')
  }
}

export const formatRelativeTime = (time: string | Date): string => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

export const formatDateTime = (time: string | Date): string => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

export const formatDate = (time: string | Date): string => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD')
}

/**
 * 格式化数量显示
 * @param count 数量
 * @returns 格式化后的字符串（如：1.2w）
 */
export function formatCount(count?: number): string {
  if (count === undefined || count === null) return '0';
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w';
  }
  return count.toString();
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串（如：1.2MB）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}