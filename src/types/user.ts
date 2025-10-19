// 用户相关类型定义

import { User, UserRole } from './index'

// 用户注册请求
export interface UserRegisterRequest {
  username: string
  password: string
  phone: string
  email?: string
  nickname: string
  avatar?: string
  role: UserRole
}

// 用户登录请求
export interface UserLoginRequest {
  username?: string
  password?: string
  phone?: string
  code?: string
  wechat?: WechatLoginData
}

// 用户微信登录请求
export interface UserWechatLoginRequest {
  code: string
  encryptedData?: string
  iv?: string
  userInfo?: {
    nickName: string
    avatarUrl: string
    gender: number
    country: string
    province: string
    city: string
    language: string
  }
}

// 用户信息更新请求
export interface UserUpdateRequest {
  nickname?: string
  avatar?: string
  phone?: string
  email?: string
  oldPassword?: string
  newPassword?: string
}

// 用户资料响应
export interface UserProfileResponse extends ApiResponse<User> {}

// 用户登录响应
export interface UserLoginResponse extends ApiResponse<{
  user: User
  token: string
  refreshToken: string
  expiresAt: string
}> {}

// 用户注册响应
export interface UserRegisterResponse extends ApiResponse<User> {}

// 用户退出登录响应
export interface UserLogoutResponse extends ApiResponse<null> {}

// 用户令牌刷新响应
export interface UserRefreshTokenResponse extends ApiResponse<{
  token: string
  refreshToken: string
  expiresAt: string
}> {}

// 用户列表响应
export interface UserListResponse extends ApiResponse<PaginatedResponse<User>> {}

// 用户统计信息
export interface UserStats {
  totalUsers: number
  activeUsers: number
  todayNewUsers: number
  thisMonthNewUsers: number
  userGrowthRate: number
  genderDistribution: {
    male: number
    female: number
    unknown: number
  }
  ageDistribution: {
    '18-25': number
    '26-35': number
    '36-45': number
    '46-55': number
    '55+': number
  }
}

// 用户统计响应
export interface UserStatsResponse extends ApiResponse<UserStats> {}

// 用户活动记录
export interface UserActivity {
  id: string
  userId: string
  action: 'login' | 'logout' | 'purchase' | 'browse' | 'favorite' | 'share' | 'comment'
  entityType: 'user' | 'product' | 'order' | 'promotion'
  entityId: string
  description: string
  createdAt: string
  userAgent?: string
  ipAddress?: string
  location?: string
}

// 用户活动记录响应
export interface UserActivitiesResponse extends ApiResponse<Array<UserActivity>> {}

// 用户收藏夹
export interface UserFavorite {
  id: string
  userId: string
  productId: string
  product: Product
  createdAt: string
}

// 用户收藏夹响应
export interface UserFavoritesResponse extends ApiResponse<Array<UserFavorite>> {}

// 用户浏览历史
export interface UserHistory {
  id: string
  userId: string
  productId: string
  product: Product
  viewedAt: string
  duration?: number
  sessionId: string
}

// 用户浏览历史响应
export interface UserHistoryResponse extends ApiResponse<Array<UserHistory>> {}

// 用户标签
export interface UserTag {
  id: string
  name: string
  color: string
  description?: string
  userIds: string[]
  createdAt: string
  updatedAt: string
}

// 用户标签响应
export interface UserTagsResponse extends ApiResponse<Array<UserTag>> {}

// 用户批量操作
export interface UserBatchOperation {
  userIds: string[]
  operation: 'activate' | 'deactivate' | 'delete' | 'assign_role' | 'add_tag' | 'remove_tag'
  roleId?: UserRole
  tagId?: string
  reason?: string
}

// 用户批量操作响应
export interface UserBatchOperationResponse extends ApiResponse<{
  successCount: number
  failureCount: number
  results: Array<{
    userId: string
    success: boolean
    message: string
  }>
}> {}

// 用户导入导出
export interface UserImportRequest {
  file: File
  updateStrategy: 'new' | 'update' | 'merge' | 'replace'
  mapping: Record<string, keyof UserRegisterRequest>
}

export interface UserImportResponse extends ApiResponse<{
  totalRecords: number
  successCount: number
  failureCount: number
  duplicateCount: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
}> {}

// 用户导出请求
export interface UserExportRequest {
  filters?: {
    role?: UserRole
    status?: 'active' | 'inactive'
    dateRange?: [string, string]
    tags?: string[]
  }
  format: 'csv' | 'excel' | 'json'
  columns?: (keyof User)[]
}

// 用户导出响应
export interface UserExportResponse extends ApiResponse<{
  url: string
  filename: string
  expiresAt: string
}> {}

// 用户权限
export interface UserPermission {
  id: string
  name: string
  code: string
  description: string
  module: string
  actions: string[]
  createdAt: string
  updatedAt: string
}

// 用户角色权限
export interface UserRolePermission {
  role: UserRole
  permissions: string[]
}

// 用户权限响应
export interface UserPermissionsResponse extends ApiResponse<{
  permissions: Array<UserPermission>
  rolePermissions: Record<UserRole, string[]>
}> {}

// 用户登录统计
export interface UserLoginStats {
  daily: Array<{
    date: string
    logins: number
    uniqueUsers: number
  }>
  monthly: Array<{
    month: string
    logins: number
    uniqueUsers: number
  }>
  hourly: Array<{
    hour: string
    logins: number
  }>
}

// 用户登录统计响应
export interface UserLoginStatsResponse extends ApiResponse<UserLoginStats> {}

// 用户行为分析
export interface UserBehaviorAnalysis {
  popularProducts: Array<{
    productId: string
    productName: string
    viewCount: number
    purchaseCount: number
    conversionRate: number
  }>
  popularCategories: Array<{
    category: string
    viewCount: number
    purchaseCount: number
    conversionRate: number
  }>
  userRetention: {
    day1: number
    day7: number
    day30: number
    day90: number
  }
  averageSessionDuration: number
  averagePagesPerSession: number
}

// 用户行为分析响应
export interface UserBehaviorAnalysisResponse extends ApiResponse<UserBehaviorAnalysis> {}

// 用户画像
export interface UserProfile {
  demographics: {
    age: number
    gender: 'male' | 'female' | 'unknown'
    location: string
    occupation: string
    income: string
  }
  preferences: {
    categories: string[]
    priceRange: [number, number]
    brands: string[]
    colors: string[]
    sizes: string[]
  }
  behavior: {
    purchaseFrequency: number
    averageOrderValue: number
    lastPurchaseDate: string
    favoriteProducts: string[]
    browsingHistory: string[]
  }
  engagement: {
    loginFrequency: number
    socialActivity: number
    loyaltyScore: number
  }
}

// 用户画像响应
export interface UserProfileResponse extends ApiResponse<UserProfile> {}

// 用户成长
export interface UserGrowth {
  level: number
  experience: number
  nextLevelExperience: number
  levelName: string
  badges: Array<{
    id: string
    name: string
    icon: string
    description: string
    earnedAt: string
  }>
  achievements: Array<{
    id: string
    name: string
    description: string
    progress: number
    maxProgress: number
    type: string
  }>
}

// 用户成长响应
export interface UserGrowthResponse extends ApiResponse<UserGrowth> {}

// 社交媒体账户
export interface SocialAccount {
  provider: 'wechat' | 'qq' | 'weibo' | 'douyin'
  providerId: string
  accessToken: string
  refreshToken?: string
  expiresAt: string
  bindAt: string
}

// 社交媒体账户响应
export interface SocialAccountsResponse extends ApiResponse<Array<SocialAccount>> {}

// 用户通知设置
export interface UserNotificationSettings {
  email: {
    enabled: boolean
    types: string[]
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  sms: {
    enabled: boolean
    types: string[]
    frequency: 'immediate' | 'daily'
  }
  push: {
    enabled: boolean
    types: string[]
  }
}

// 用户通知设置响应
export interface NotificationSettingsResponse extends ApiResponse<UserNotificationSettings> {}

// 用户隐私设置
export interface UserPrivacySettings {
  profileVisible: boolean
  emailVisible: boolean
  phoneVisible: boolean
  locationVisible: boolean
  activityVisible: boolean
  dataRetention: 30 | 90 | 180 | 365
  marketingConsent: boolean
}

// 用户隐私设置响应
export interface PrivacySettingsResponse extends ApiResponse<UserPrivacySettings> {}

// 用户安全设置
export interface UserSecuritySettings {
  twoFactorAuth: boolean
  loginMethods: Array<'password' | 'wechat' | 'sms' | 'email'>
  sessionTimeout: number
  requirePasswordChange: boolean
  lastPasswordChange: string
  loginHistory: Array<{
    id: string
    ipAddress: string
    userAgent: string
    location: string
    time: string
    success: boolean
  }>
}

// 用户安全设置响应
export interface SecuritySettingsResponse extends ApiResponse<UserSecuritySettings> {}

// 用户数据导出
export interface UserDataExportRequest {
  format: 'json' | 'csv' | 'pdf'
  includePersonalData: boolean
  includeActivityData: boolean
  includePreferences: boolean
  dateRange?: [string, string]
}

// 用户数据导出响应
export interface UserDataExportResponse extends ApiResponse<{
  url: string
  filename: string
  expiresAt: string
  totalSize: number
}> {}

// Product类型（循环引用）
type Product = any