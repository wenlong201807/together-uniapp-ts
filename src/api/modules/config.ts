import request from '../request'

export interface PublicConfig {
  app: {
    name: string
  }
  signup: {
    invite_required: boolean
  }
  square: {
    enabled: boolean
    max_images: number
  }
  chat: {
    enabled: boolean
  }
  friend: {
    max_count: number
    unlock_points: number
  }
  points: {
    enabled: boolean
  }
  certification: {
    enabled: boolean
  }
}

export const configApi = {
  getPublicConfig: () =>
    request.get<PublicConfig>('/public/config')
}
