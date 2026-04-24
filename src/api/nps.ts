import request from './request'

export interface SubmitNPSDto {
  score: number
  reason?: string
  suggestion?: string
  tags?: string[]
  triggerType: 'auto' | 'manual'
  triggerScene?: string
}

export interface NPSFeedback {
  id: number
  userId: number
  score: number
  category: 'promoter' | 'passive' | 'detractor'
  reason?: string
  suggestion?: string
  tags?: string[]
  status: number
  priority: number
  createdAt: string
}

export interface CanTriggerResponse {
  canTrigger: boolean
  reason?: string
}

/**
 * 检查是否可以触发NPS
 */
export const canTriggerNPS = () => {
  return request.get<CanTriggerResponse>('/nps/can-trigger')
}

/**
 * 提交NPS反馈
 */
export const submitNPSFeedback = (data: SubmitNPSDto) => {
  return request.post<NPSFeedback>('/nps/submit', data)
}
