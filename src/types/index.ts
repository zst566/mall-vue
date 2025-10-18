// 核心类型定义

// 应用版本类型
export type AppVersion = 'customer' | 'merchant'

// 用户角色类型
export type UserRole = 'customer' | 'admin' | 'operator'

// 用户类型
export interface User {
  id: string
  username?: string
  nickname: string
  avatar?: string
  phone?: string
  email?: string
  role: UserRole
  openid?: string
  unionid?: string
  createdAt: string
  updatedAt: string
}

// 基础API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 分页请求参数
export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
}

// 分页响应数据
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 地址类型
export interface Address {
  id?: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault?: boolean
}

// 商品相关类型
export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  brand?: string
  stock: number
  sales: number
  tags: string[]
  status: 'active' | 'inactive' | 'deleted'
  specifications?: Record<string, string>
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 商品查询参数
export interface ProductQueryParams extends PaginationParams {
  category?: string
  brand?: string
  priceRange?: [number, number]
  tags?: string[]
  sortBy?: 'price' | 'sales' | 'createdAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

// 订单相关类型
export interface Order {
  id: string
  orderNo: string
  userId: string
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
  totalAmount: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'other'
  shippingAddress: Address
  contactName: string
  contactPhone: string
  notes?: string
  verificationCode?: string
  isVerified: boolean
  verifiedAt?: string
  verifiedBy?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  refundedAt?: string
  refundedAmount?: number
}

// 订单状��映射
export const OrderStatusMap = {
  pending: { label: '待支付', color: '#ff976a' },
  paid: { label: '已支付', color: '#07c160' },
  shipped: { label: '已发货', color: '#1989fa' },
  delivered: { label: '已送达', color: '#07c160' },
  cancelled: { label: '已取消', color: '#ee0a24' },
  refunded: { label: '已退款', color: '#969799' }
} as const

// 订单查询参数
export interface OrderQueryParams extends PaginationParams {
  status?: Order['status']
  dateRange?: [string, string]
  paymentMethod?: Order['paymentMethod']
  sortBy?: 'createdAt' | 'paidAt' | 'shippedAt' | 'totalAmount'
  sortOrder?: 'asc' | 'desc'
}

// 商户订单查询参数
export interface MerchantOrderQueryParams extends PaginationParams {
  status?: Order['status']
  dateRange?: [string, string]
  verifiedAt?: string
  sortBy?: 'createdAt' | 'verifiedAt' | 'totalAmount'
  sortOrder?: 'asc' | 'desc'
}

// 支付相关类型
export interface Payment {
  id: string
  orderId: string
  amount: number
  method: Order['paymentMethod']
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  transactionId?: string
  createdAt: string
  updatedAt: string
}

// 订单核销响应
export interface OrderVerificationResponse {
  success: boolean
  order: Order
  message: string
  canRevoke: boolean
}

// 二维码扫描结果
export interface QRCodeResult {
  success: boolean
  content: string
  type: 'order' | 'product' | 'promotion' | 'unknown'
  data?: any
}

// 身份验证相关类型
export interface LoginCredentials {
  username?: string
  password?: string
  phone?: string
  code?: string
}

export interface WechatLoginData {
  code: string
  encryptedData?: string
  iv?: string
}

export interface AuthResponse {
  token: string
  user: User
  refreshToken?: string
  expiresAt: string
}

// 刷新令牌请求
export interface RefreshTokenRequest {
  token: string
}

// 微信小程序相关类型
export interface WechatParams {
  token?: string
  openid?: string
  unionid?: string
  version?: AppVersion
}

// 环境检测类型
export interface EnvironmentInfo {
  isWechatMiniProgram: boolean
  isWechatBrowser: boolean
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  userAgent: string
  viewport: {
    width: number
    height: number
  }
}

// 错误类型
export interface ApiError {
  code: number
  message: string
  details?: any
  stack?: string
}

// 表单验证类型
export interface ValidationRule {
  required?: boolean
  type?: string
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: any) => boolean | Promise<boolean>
  message?: string
}

// 组件props类型
export interface BaseComponentProps {
  className?: string
  style?: string | Record<string, any>
}

// 工具函数类型
export interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

export interface ThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

// 应用状态类型
export interface AppState {
  version: AppVersion
  isOnline: boolean
  isLoading: boolean
  error: ApiError | null
  systemInfo: EnvironmentInfo
}

// 认证状态类型
export interface AuthState {
  user: User | null
  token: string
  refreshToken: string | null
  userRole: UserRole
  isLoggedIn: boolean
  isWechatMode: boolean
}

// 路由元信息类型
export interface RouteMeta {
  requiresAuth?: boolean
  role?: UserRole[]
  title?: string
  hideHeader?: boolean
  hideFooter?: boolean
  hideVersionSwitcher?: boolean
}

// 事件类型
export interface CustomEvent<T = any> {
  type: string
  payload?: T
  timestamp: number
}

// 应用配置类型
export interface AppConfig {
  apiUrl: string
  timeout: number
  retryCount: number
  maxFileSize: number
  supportedImageTypes: string[]
  enableCache: boolean
  cacheTime: number
  enableAnalytics: boolean
  enableLogging: boolean
  environment: 'development' | 'test' | 'production'
}

// 响应式断点类型
export interface Breakpoints {
  xs: number
  mobile: number
  mobileLg: number
  tablet: number
  desktop: number
  desktopLg: number
  desktopXl: number
}

// 常量定义
export const Constants = {
  ApiTimeout: 10000,
  MaxRetryCount: 3,
  MaxFileSize: 5 * 1024 * 1024, // 5MB
  SupportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  CacheTime: 24 * 60 * 60 * 1000, // 24小时
  Pagination: {
    DefaultPageSize: 20,
    MaxPageSize: 100,
  },
  Colors: {
    Primary: '#1989fa',
    Success: '#07c160',
    Warning: '#ff976a',
    Danger: '#ee0a24',
    Default: '#969799',
  },
} as const

// 时间格式化类型
export interface TimeFormatOptions {
  format?: string
  locale?: string
  timezone?: string
  relative?: boolean
}

// 文件类型
export interface FileInfo {
  id?: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

// 通知类型
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  showClose?: boolean
  position?: 'top' | 'bottom' | 'center'
}

// Toast类型
export interface ToastOptions {
  message: string
  type?: 'success' | 'fail' | 'loading'
  duration?: number
  position?: 'top' | 'bottom' | 'center'
  forbidClick?: boolean
}

// Dialog类型
export interface DialogOptions {
  title: string
  message: string
  showConfirmButton?: boolean
  showCancelButton?: boolean
  confirmButtonText?: string
  cancelButtonText?: string
  confirmButtonColor?: string
  cancelButtonColor?: string
  closeOnClickOverlay?: boolean
}

// 主题类型
export interface Theme {
  primaryColor: string
  backgroundColor: string
  textColor: string
  secondaryTextColor: string
  borderColor: string
  shadowColor: string
  radius: string
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
  }
}

// 初始化函数类型
export interface InitializationOptions {
  apiUrl: string
  enableAnalytics: boolean
  enableLogging: boolean
  environment: string
}

// 插件接口类型
export interface Plugin {
  name: string
  version: string
  install(app: any): void
  uninstall?(app: any): void
}

// 中间件类型
export interface Middleware {
  name: string
  handler: (request: any, response: any, next: () => void) => void
}

// 工具库类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export type PromiseType<T> = T extends Promise<infer U> ? U : T

export type ArrayElementType<T extends readonly any[]> = T extends readonly (infer U)[] ? U : never

export type StringKeyOf<T> = Extract<keyof T, string>

export type NumberKeyOf<T> = Extract<keyof T, number>

export type SymbolKeyOf<T> = Extract<keyof T, symbol>

export type KeyOf<T> = StringKeyOf<T> | NumberKeyOf<T> | SymbolKeyOf<T>

export type ValueOf<T> = T[keyof T]

export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

export type RequiredDeep<T> = {
  [P in keyof T]-?: T[P] extends object ? RequiredDeep<T[P]> : T[P]
}

export type PickDeep<T, K extends string> = K extends `${infer K1}.${infer K2}`
  ? K1 extends keyof T
    ? { [P in K1]: PickDeep<T[K1], K2> }
    : never
  : K extends keyof T
  ? Pick<T, K>
  : never

export type OmitDeep<T, K extends string> = T extends object
  ? Omit<T, K> & {
      [P in keyof T]-?: P extends K
        ? never
        : T[P] extends object
        ? OmitDeep<T[P], K>
        : T[P]
    }
  : T

export type ReplaceDeep<T, K extends string, V> = K extends `${infer K1}.${infer K2}`
  ? K1 extends keyof T
    ? { [P in K1]: ReplaceDeep<T[P], K2, V> }
    : never
  : K extends keyof T
  ? { [P in keyof T]: P extends K ? V : T[P] }
  : T

export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>