import request from '../request'
import type {
  CertificationTypeConfig,
  Certification as BackendCertification,
  CreateCertificationDto as BackendCreateCertificationDto
} from '@/types/api/backend-types'

export interface CertificationType {
  code: string
  name: string
  icon: string
  description: string
  requiredFields: string[]
}

export interface Certification {
  id: number
  userId: number
  type: string
  imageUrl: string
  description: string
  status: 0 | 1 | 2
  rejectReason?: string
  reviewedAt?: string
  createdAt: string
}

export interface CreateCertificationDto {
  type: string
  imageUrl: string
  description?: string
}

export const certificationApi = {
  getTypes: () =>
    request.get<CertificationTypeConfig[]>('/api/v1/certification-types'),

  getType: () =>
    request.get<CertificationTypeConfig>('/api/v1/certification-type'),

  submit: (data: CreateCertificationDto) =>
    request.post<BackendCertification>('/api/v1/certification', data),

  getMyList: (status?: number) =>
    request.get<BackendCertification[]>('/api/v1/certification/list', {
      status
    }),

  getDetail: (id: number) =>
    request.get<BackendCertification>(`/api/v1/certification/${id}`)
}
