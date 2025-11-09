// 核心类型定义

// 应用版本类型
export type AppVersion = 'customer' | 'merchant'

// 用户角色类型
export type UserRole = 'customer' | 'admin' | 'operator' | 'merchant'

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
  isVerified?: boolean
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
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// 商品相关类型
export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  images: string[]
  category: string
  categoryId: string
  brand?: string
  stock: number
  sales: number
  salesCount: number
  rating: number
  isHot: boolean
  isNew: boolean
  discount: number
  shopName: string
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

// 订单商品项
export interface OrderItem {
  id: string
  productId: string
  productName: string
  productImage: string
  specification: string
  quantity: number
  price: number
  totalPrice: number
}

// 收货地址
export interface ShippingAddress {
  province: string
  city: string
  district: string
  detail: string
}

// 客户订单相关类型
export interface Order {
  id: string
  orderNo: string
  userId: string
  status: 'pending' | 'paid' | 'verified' | 'cancelled' | 'refunded'
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'other'
  paymentStatus: 'pending' | 'success' | 'failed' | 'cancelled' | 'unpaid' | 'paid' | 'refunded'
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
  items: OrderItem[]
  totalAmount: number
  
  // 结算相关字段
  settlementMode?: 'normal_split' | 'mall_subsidy' | 'points_exchange'
  splitRatio?: number // 分成比例（普通分账模式）
  subsidyAmount?: number // 补贴金额（商场补贴模式，分）
  settlementPrice?: number // 结算价（积分兑换模式，分）
  paymentFee?: number // 支付手续费（分）
  settlementAmount?: number // 待结算金额（分）
  merchantAmount?: number // 商铺分账金额（分）
  mallAmount?: number // 商场分账金额（分）
  settlementStatus?: 'pending' | 'calculated' | 'settled' // 结算状态
  settledAt?: string // 结算时间
}

// 商户订单相关类型
export interface MerchantOrder {
  id: string
  orderNo: string
  customerId: string
  customerName: string
  customerPhone: string
  customerAvatar: string
  status: MerchantOrderStatus
  paymentMethod: 'wechat' | 'alipay' | 'cash'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  totalAmount: number
  createdAt: string
  updatedAt: string
  paidAt?: string
  confirmedAt?: string
  verifiedAt?: string
  shippedAt?: string
  deliveredAt?: string
  refundedAt?: string
  receiverName: string
  receiverPhone: string
  shippingAddress: ShippingAddress
  items: OrderItem[]
  notes?: string
}

// 订单状态类型
export type OrderStatus = 'pending' | 'paid' | 'verified' | 'cancelled' | 'refunded'

// 商户订单状态类型
export type MerchantOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'pending_verification' | 'verified' | 'completed'

// 支付方法类型
export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'other'

// 支付状态类型
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled'

// 订单状��映射
export const OrderStatusMap = {
  pending: { label: '待支付', color: '#ff976a' },
  paid: { label: '已支付（待使用）', color: '#07c160' },
  verified: { label: '已核销（已使用）', color: '#1989fa' },
  cancelled: { label: '已取消', color: '#ee0a24' },
  refunded: { label: '已退款', color: '#969799' }
} as const

// 订单查询参数
export interface OrderQueryParams extends PaginationParams {
  status?: Order['status']
  dateRange?: [string, string]
  paymentMethod?: Order['paymentMethod']
  sortBy?: 'createdAt' | 'paidAt' | 'verifiedAt' | 'totalAmount'
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

// 退款申请相关类��
export interface RefundRequest {
  orderId: string
  amount: number
  reason: string
  description?: string
  refundMethod?: 'original' | 'balance'
  images?: string[]
  contact?: string
}

// 退款状态类型
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed'

// 退款记录类型
export interface RefundRecord {
  id: string
  orderId: string
  refundNo: string
  amount: number
  status: RefundStatus
  reason: string
  description?: string
  refundMethod: 'original' | 'balance'
  refundTo?: string
  images?: string[]
  contact?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  processedAt?: string
  processedBy?: string
  processorNotes?: string
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

export interface LoginRequest {
  username?: string
  password?: string
  phone?: string
  code?: string
}

export interface LoginResponse {
  success: boolean
  data: {
    accessToken?: string  // 后端返回的字段名
    token?: string        // 兼容字段名
    refreshToken: string
    user: User
  }
  message: string
}

export interface RegisterRequest {
  username: string
  password: string
  phone?: string
  email?: string
  nickname: string
}

export interface RegisterResponse {
  success: boolean
  data: {
    accessToken: string  // 统一使用 accessToken（后端返回的字段名）
    refreshToken: string
    user: User
  }
  message: string
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
  userId?: string
  from?: string
  scene?: string
  shareTicket?: string
  path?: string
  query?: Record<string, any>
}

// 二维码数据
export interface QRCodeData {
  type: 'order' | 'product' | 'promotion'
  id: string
  data?: any
}

// 核销结果
export interface VerificationResult {
  success: boolean
  order?: Order
  message: string
  canRevoke?: boolean
}

// 商户订单统计
export interface MerchantOrderStats {
  todayOrders: number
  todayAmount: number
  successRate: number
  avgProcessTime: number
  total: number
  pending: number
  confirmed: number
  shipped: number
  delivered: number
  cancelled: number
  refunded: number
  totalAmount: number
}

// 订单创建请求
export interface OrderCreateRequest {
  productId: string
  quantity: number
  shippingAddress: Address
  contactName: string
  contactPhone: string
  notes?: string
  items: OrderItem[]
}

// 订单支付请求
export interface OrderPaymentRequest {
  orderId: string
  paymentMethod: PaymentMethod
  amount: number
}

// 订单搜索参数
export interface OrderSearchParams extends PaginationParams {
  status?: OrderStatus
  dateRange?: [string, string]
  paymentMethod?: PaymentMethod
  keyword?: string
}

// 支付请求
export interface PaymentRequest {
  orderId: string
  amount: number
  method: PaymentMethod
  returnUrl?: string
}

// 支付响应
export interface PaymentResponse {
  success: boolean
  paymentId: string
  paymentUrl?: string
  qrCode?: string
  message: string
}

// 商品搜索参数
export interface ProductSearchParams extends PaginationParams {
  category?: string
  brand?: string
  priceRange?: [number, number]
  tags?: string[]
  keyword?: string
  sortBy?: 'price' | 'sales' | 'createdAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

// 商品列表响应
export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 分类类型
export interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  level: number
  sort: number
  icon?: string
  image?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
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
export type ToastType = 'success' | 'fail' | 'loading' | 'error' | 'warning'

export interface ToastOptions {
  message: string
  type?: ToastType
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

// Vant 组件类型
export type TagSize = 'large' | 'medium' | 'small'
export type Numeric = string | number

// 上传组件类型
export type UploaderAfterRead = (file: File) => Promise<void>
export type UploaderBeforeRead = (file: File) => boolean

// 结算相关类型
export interface OrderSettlementParams {
  orderId: string
  totalAmount: number
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'other'
  quantity: number
  settlementMode: 'normal_split' | 'mall_subsidy' | 'points_exchange'
  splitRatio?: number
  subsidyAmount?: number
  settlementPrice?: number
}

export interface OrderSettlementResult {
  success: boolean
  settlementAmount: number
  merchantAmount: number
  mallAmount: number
  paymentFee: number
  message: string
  settledAt?: string
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