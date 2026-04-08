import request from '../request'
import type { PointsConfig } from '@/types/api/backend-types'

export interface PointsBalance {
  balance: number
  totalEarned?: number
  totalConsumed?: number
}

export interface SignStatus {
  signedToday: boolean
  continuousDays: number
}

export interface SignResult {
  points: number
  continuousDays: number
  pointsEarned?: number
  balance?: number
}

export interface PointsLog {
  id: number
  type: 1 | 2
  source: string
  amount: number
  balance: number
  remark: string
  createdAt: string
}

export const pointsApi = {
  getBalance: () =>
    request.get<{ balance: number }>('/api/v1/points/balance'),

  sign: () =>
    request.post<SignResult>('/api/v1/points/sign'),

  getSignStatus: () =>
    request.get<SignStatus>('/api/v1/points/sign/status'),

  getLogs: (page = 1, pageSize = 20, type?: number) =>
    request.get<{ list: PointsLog[]; total: number }>('/api/v1/points/logs', {
      page,
      pageSize,
      type
    }),

  getConfig: () =>
    request.get<PointsConfig[]>('/api/v1/points/config'),

  getConfigList: () =>
    request.get<PointsConfig[]>('/api/v1/points-configs')
}
