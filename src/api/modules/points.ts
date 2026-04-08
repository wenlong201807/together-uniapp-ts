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
    request.get<{ balance: number }>('/points/balance'),

  sign: () =>
    request.post<SignResult>('/points/sign'),

  getSignStatus: () =>
    request.get<SignStatus>('/points/sign/status'),

  getLogs: (page = 1, pageSize = 20, type?: number) =>
    request.get<{ list: PointsLog[]; total: number }>('/points/logs', {
      page,
      pageSize,
      type
    }),

  getConfig: () =>
    request.get<PointsConfig[]>('/points/config'),

  getConfigList: () =>
    request.get<PointsConfig[]>('/points-configs')
}
