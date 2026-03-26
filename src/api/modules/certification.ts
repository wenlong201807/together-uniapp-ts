import request from '../request'

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
    request.get<{ list: CertificationType[] }>('/certification-types'),

  submit: (data: CreateCertificationDto) =>
    request.post<Certification>('/certification', data),

  getMyList: (status?: number) =>
    request.get<{ list: Certification[] }>('/certification/list', {
      params: { status }
    }),

  getDetail: (id: number) =>
    request.get<Certification>(`/certification/${id}`)
}
