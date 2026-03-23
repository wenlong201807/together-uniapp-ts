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