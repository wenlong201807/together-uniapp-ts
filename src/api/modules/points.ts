import request from '../request'

export interface PointsBalance {
  balance: number
  totalEarned: number
  totalConsumed: number
}

export interface SignStatus {
  signedToday: boolean
  continuousDays: number
}

export interface SignResult {
  pointsEarned: number
  continuousDays: number
  balance: number
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
  getBalance: () => request.get<PointsBalance>('/points/balance'),

  sign: () => request.post<SignResult>('/points/sign'),

  getSignStatus: () => request.get<SignStatus>('/points/sign/status'),

  getLogs: (page = 1, pageSize = 20, type?: number) =>
    request.get<{ list: PointsLog[]; total: number }>('/points/logs', {
      params: { page, pageSize, type }
    })
}
