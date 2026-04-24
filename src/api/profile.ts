import request from '@/utils/request'

// ========== 类型定义 ==========

export interface UserProfile {
  id: number
  userId: number
  realName?: string
  birthDate?: string
  hometown?: string
  residence?: string
  height?: number
  weight?: number
  occupation?: string
  income?: number
  education?: string
  bio?: string
  showLocation?: boolean
  latitude?: number
  longitude?: number
  // 外貌体征
  bodyType?: string
  zodiacSign?: string
  chineseZodiac?: string
  faceShape?: string
  hasGlasses?: boolean
  hasTattoo?: boolean
  // 教育职业
  graduateSchool?: string
  major?: string
  industry?: string
  company?: string
  workYears?: number
  // 家庭背景
  nativePlace?: string
  familyMembers?: number
  familyRanking?: string
  parentsOccupation?: string
  isOnlyChild?: boolean
  familyEconomic?: string
  // 婚恋状况
  maritalStatus?: string
  hasChildren?: boolean
  childrenCount?: number
  childrenInfo?: string
  marriagePlan?: string
  // 资产状况
  housingStatus?: string
  carStatus?: string
  housingLocation?: string
  carBrand?: string
  // 生活方式
  smokingStatus?: string
  drinkingStatus?: string
  sleepSchedule?: string
  exerciseFrequency?: string
  dietPreference?: string
  hasPets?: boolean
  petType?: string
  cookingSkill?: string
  // 个性展示
  personalityTags?: string[]
  selfIntroduction?: string
  innerMonologue?: string
  voiceIntroUrl?: string
  // 信息完整度
  profileCompleteness?: number
  lastUpdateAt?: string
  updateRemindAt?: string
}

export interface UserInterest {
  id: number
  userId: number
  category: string
  name: string
  level: number
  sortOrder: number
  createdAt: string
}

export interface UserPhoto {
  id: number
  userId: number
  photoUrl: string
  photoPath: string
  category: string
  isAvatar: boolean
  isCertified: boolean
  isPublic: boolean
  sortOrder: number
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface UserMatePreference {
  id: number
  userId: number
  ageMin?: number
  ageMax?: number
  heightMin?: number
  heightMax?: number
  educationRequirement?: string
  incomeRequirement?: string
  locationRequirement?: string
  acceptLongDistance?: boolean
  maritalStatusRequirement?: string
  acceptChildren?: boolean
  housingRequirement?: string
  carRequirement?: string
  smokingRequirement?: string
  drinkingRequirement?: string
  otherRequirements?: string
  idealTypeDescription?: string
  createdAt: string
  updatedAt: string
}

export interface UserValue {
  id: number
  userId: number
  category: string
  question: string
  answer: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CompletenessDetails {
  score: number
  level: string
  missingFields: string[]
}

// ========== API接口 ==========

// 基础资料
export const getProfile = (userId: number) => {
  return request<UserProfile>({
    url: `/profile/${userId}`,
    method: 'GET',
  })
}

export const updateProfile = (data: Partial<UserProfile>) => {
  return request<UserProfile>({
    url: '/profile',
    method: 'PUT',
    data,
  })
}

export const getCompletenessDetails = () => {
  return request<CompletenessDetails>({
    url: '/profile/completeness/details',
    method: 'GET',
  })
}

// 兴趣管理
export const getInterests = () => {
  return request<UserInterest[]>({
    url: '/profile/interests/list',
    method: 'GET',
  })
}

export const addInterest = (data: { category: string; name: string; level: number }) => {
  return request<UserInterest>({
    url: '/profile/interests',
    method: 'POST',
    data,
  })
}

export const removeInterest = (id: number) => {
  return request({
    url: `/profile/interests/${id}`,
    method: 'DELETE',
  })
}

export const updateInterestSort = (sortData: Array<{ id: number; sortOrder: number }>) => {
  return request({
    url: '/profile/interests/sort',
    method: 'PUT',
    data: { sortData },
  })
}

// 照片管理
export const getPhotos = () => {
  return request<UserPhoto[]>({
    url: '/profile/photos/list',
    method: 'GET',
  })
}

export const addPhoto = (data: {
  photoUrl: string
  photoPath: string
  category: string
  isPublic?: boolean
}) => {
  return request<UserPhoto>({
    url: '/profile/photos',
    method: 'POST',
    data,
  })
}

export const deletePhoto = (id: number) => {
  return request({
    url: `/profile/photos/${id}`,
    method: 'DELETE',
  })
}

export const setAvatar = (id: number) => {
  return request({
    url: `/profile/photos/${id}/avatar`,
    method: 'PUT',
  })
}

export const updatePhotoSort = (sortData: Array<{ id: number; sortOrder: number }>) => {
  return request({
    url: '/profile/photos/sort',
    method: 'PUT',
    data: { sortData },
  })
}

// 择偶要求
export const getMatePreferences = () => {
  return request<UserMatePreference>({
    url: '/profile/mate-preferences',
    method: 'GET',
  })
}

export const updateMatePreferences = (data: Partial<UserMatePreference>) => {
  return request<UserMatePreference>({
    url: '/profile/mate-preferences',
    method: 'PUT',
    data,
  })
}

// 隐私设置
export type VisibilityLevel = 'public' | 'friends' | 'certified' | 'private'

export interface PrivacySettings {
  id: number
  userId: number
  // 信息可见性
  basicInfoVisibility: VisibilityLevel
  contactVisibility: VisibilityLevel
  incomeVisibility: VisibilityLevel
  familyVisibility: VisibilityLevel
  photoVisibility: VisibilityLevel
  locationVisibility: VisibilityLevel
  // 互动权限
  allowSearch: boolean
  allowRecommend: boolean
  allowStrangerMessage: boolean
  onlyCertifiedUser: boolean
  createdAt: string
  updatedAt: string
}

export interface BlacklistUser {
  id: number
  userId: number
  blockedUserId: number
  blockedUser: {
    id: number
    nickname: string
    avatar: string
    age?: number
    city?: string
  }
  reastring
  createdAt: string
}

export const getPrivacySettings = () => {
  return request<PrivacySettings>({
    url: '/profile/privacy-settings',
    method: 'GET',
  })
}

export const updatePrivacySettings = (data: Partial<PrivacySettings>) => {
  return request<PrivacySettings>({
    url: '/profile/privacy-settings',
    method: 'PUT',
    data,
  })
}

export const getBlacklist = () => {
  return request<BlacklistUser[]>({
    url: '/profile/blacklist',
    method: 'GET',
  })
}

export const removeFromBlacklist = (blockedUserId: number) => {
  return request({
    url: `/profile/blacklist/${blockedUserId}`,
    method: 'DELETE',
  })
}

// 价值观管理
export const getValues = () => {
  return request<UserValue[]>({
    url: '/profile/values/list',
    method: 'GET',
  })
}

export const saveValue = (data: {
  category: string
  question: string
  answer: string
  isPublic: boolean
}) => {
  return request<UserValue>({
    url: '/profile/values',
    method: 'POST',
    data,
  })
}

export const deleteValue = (id: number) => {
  return request({
    url: `/profile/values/${id}`,
    method: 'DELETE',
  })
}

// 认证管理
export type CertificationType = 'id_card' | 'education' | 'occupation' | 'income' | 'housing' | 'car' | 'photo'
export type CertificationStatus = 'pending' | 'approved' | 'rejected'

export interface Certification {
  id: number
  userId: number
  type: CertificationType
  status: CertificationStatus
  images: string[]
  remark?: string
  rejectReason?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export const getCertifications = () => {
  return request<Certification[]>({
    url: '/profile/certifications/list',
    method: 'GET',
  })
}

export const applyCertification = (data: {
  type: CertificationType
  images: string[]
  remark?: string
}) => {
  return request<Certification>({
    url: '/profile/certifications',
    method: 'POST',
    data,
  })
}

export const getCertificationDetail = (id: number) => {
  return request<Certification>({
    url: `/profile/certifications/${id}`,
    method: 'GET',
  })
}
