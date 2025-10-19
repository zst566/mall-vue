// 订单相关类型定义

import { Order, OrderQueryParams, MerchantOrderQueryParams, Address, Payment } from './index'

// 订单状态类型
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

// 订单状态配置
export const OrderStatusConfig = {
  pending: {
    label: '待支付',
    color: '#ff976a',
    action: 'payment',
    nextStates: ['paid', 'cancelled']
  },
  paid: {
    label: '已支付',
    color: '#07c160',
    action: 'shipping',
    nextStates: ['shipped', 'refunded']
  },
  shipped: {
    label: '已发货',
    color: '#1989fa',
    action: 'delivery',
    nextStates: ['delivered', 'returned']
  },
  delivered: {
    label: '已送达',
    color: '#07c160',
    action: 'complete',
    nextStates: []
  },
  cancelled: {
    label: '已取消',
    color: '#ee0a24',
    action: 'none',
    nextStates: []
  },
  refunded: {
    label: '已退款',
    color: '#969799',
    action: 'none',
    nextStates: []
  }
} as const

// 订单商品项
export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
  totalPrice: number
  specifications?: Record<string, string>
  isVerified: boolean
  verifiedAt?: string
  verifiedBy?: string
  notes?: string
}

// 订单创建请求
export interface OrderCreateRequest {
  items: Array<{
    productId: string
    quantity: number
    specifications?: Record<string, string>
    notes?: string
  }>
  shippingAddress: Address
  contactName: string
  contactPhone: string
  paymentMethod: Payment['method']
  promotionId?: string
  couponId?: string
  message?: string
}

// 订单创建响应
export interface OrderCreateResponse extends ApiResponse<{
  order: Order
  paymentUrl?: string
  estimatedAmount: number
}> {}

// 订单支付请求
export interface OrderPaymentRequest {
  orderId: string
  paymentMethod: Payment['method']
  couponId?: string
  promotionId?: string
}

// 订单支付响应
export interface OrderPaymentResponse extends ApiResponse<{
  payment: Payment
  order: Order
}> {}

// 订单状态更新请求
export interface OrderStatusUpdateRequest {
  orderId: string
  status: OrderStatus
  reason?: string
  notes?: string
  operator?: string
  delay?: number
}

// 订单状态更新响应
export interface OrderStatusUpdateResponse extends ApiResponse<Order> {}

// 订单查询响应
export interface OrderListResponse extends ApiResponse<PaginatedResponse<Order>> {}

// 商户订单查询响应
export interface MerchantOrderListResponse extends ApiResponse<PaginatedResponse<Order>> {}

// 订单详情响应
export interface OrderDetailResponse extends ApiResponse<{
  order: Order
  items: OrderItem[]
  payment: Payment
  promotions?: any[]
  coupons?: any[]
  shippingInfo?: any
  timeline: Array<{
    action: string
    description: string
    time: string
    operator?: string
  }>
}> {}

// 订单统计
export interface OrderStats {
  today: {
    total: number
    amount: number
    paid: number
    cancelled: number
    refunded: number
  }
  month: {
    total: number
    amount: number
    paid: number
    cancelled: number
    refunded: number
  }
  year: {
    total: number
    amount: number
    paid: number
    cancelled: number
    refunded: number
  }
  hourly: Array<{
    hour: string
    count: number
    amount: number
  }>
  daily: Array<{
    date: string
    count: number
    amount: number
  }>
  monthly: Array<{
    month: string
    count: number
    amount: number
  }>
  statusDistribution: Record<OrderStatus, number>
  paymentMethodDistribution: Record<Payment['method'], number>
  categoryDistribution: Array<{
    category: string
    count: number
    amount: number
  }>
}

// 订单统计响应
export interface OrderStatsResponse extends ApiResponse<OrderStats> {}

// 订单导出请求
export interface OrderExportRequest {
  filters?: {
    status?: OrderStatus
    paymentMethod?: Payment['method']
    dateRange?: [string, string]
    userId?: string
    productId?: string
  }
  format: 'csv' | 'excel' | 'json'
  columns?: (keyof Order)[]
}

// 订单导出响应
export interface OrderExportResponse extends ApiResponse<{
  url: string
  filename: string
  expiresAt: string
}> {}

// 订单批量操作
export interface OrderBatchOperation {
  orderIds: string[]
  operation: 'payment' | 'ship' | 'deliver' | 'cancel' | 'refund' | 'verify' | 'archive'
  data?: {
    paymentMethod?: Payment['method']
    trackingNumber?: string
    shippingCompany?: string
    refundAmount?: number
    refundReason?: string
    operator?: string
  }
  reason?: string
}

// 订单批量操作响应
export interface OrderBatchOperationResponse extends ApiResponse<{
  successCount: number
  failureCount: number
  results: Array<{
    orderId: string
    success: boolean
    message: string
  }>
}> {}

// 订单日志
export interface OrderLog {
  id: string
  orderId: string
  action: string
  description: string
  operator?: string
  ip?: string
  location?: string
  timestamp: string
  data?: any
}

// 订单日志响应
export interface OrderLogResponse extends ApiResponse<Array<OrderLog>> {}

// 订单模板
export interface OrderTemplate {
  id: string
  name: string
  items: Array<{
    productId: string
    quantity: number
    specifications?: Record<string, string>
  }>
  shippingAddress: Address
  contactName: string
  contactPhone: string
  isPublic: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 订单模板响应
export interface OrderTemplateResponse extends ApiResponse<Array<OrderTemplate>> {}

// 订单商品评价
export interface OrderReview {
  id: string
  orderId: string
  userId: string
  userName: string
  userAvatar?: string
  items: Array<{
    productId: string
    productName: string
    productImage: string
    rating: number
    review?: string
    images?: string[]
  }>
  anonymous: boolean
  createdAt: string
  updatedAt: string
}

// 订单商品评价响应
export interface OrderReviewResponse extends ApiResponse<Array<OrderReview>> {}

// 订单配送信息
export interface OrderShippingInfo {
  id: string
  orderId: string
  trackingNumber: string
  shippingCompany: string
  shippingMethod: string
  estimatedDelivery: string
  actualDelivery?: string
  status: 'preparing' | 'shipped' | 'delivered' | 'exception'
  trackingUrl?: string
  createdAt: string
  updatedAt: string
}

// 订单配送信息响应
export interface OrderShippingInfoResponse extends ApiResponse<Array<OrderShippingInfo>> {}

// 订单发票信息
export interface OrderInvoice {
  id: string
  orderId: string
  type: 'electronic' | 'paper'
  title: string
  taxNumber: string
  taxRate: number
  amount: number
  status: 'pending' | 'issued' | 'cancelled'
  invoiceUrl?: string
  issueDate?: string
  pdfUrl?: string
  createdAt: string
  updatedAt: string
}

// 订单发票信息响应
export interface OrderInvoiceResponse extends ApiResponse<Array<OrderInvoice>> {}

// 订单支付状态
export interface OrderPaymentStatus {
  orderId: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  paymentMethod: Payment['method']
  paymentId?: string
  transactionId?: string
  amount: number
  paidAt?: string
  failedReason?: string
}

// 订单支付状态响应
export interface OrderPaymentStatusResponse extends ApiResponse<Array<OrderPaymentStatus>> {}

// 订单重试支付
export interface OrderRetryPaymentRequest {
  orderId: string
  paymentMethod: Payment['method']
}

// 订单重试支付响应
export interface OrderRetryPaymentResponse extends ApiResponse<{
  payment: Payment
  paymentUrl?: string
}> {}

// 订单取消
export interface OrderCancelRequest {
  orderId: string
  reason: string
  operator?: string
}

// 订单取消响应
export interface OrderCancelResponse extends ApiResponse<Order> {}

// 订单退款
export interface OrderRefundRequest {
  orderId: string
  amount?: number
  reason: string
  operator?: string
  refundType: 'full' | 'partial'
  refundMethod?: 'original' | 'other'
  refundAccount?: string
}

// 订单退款响应
export interface OrderRefundResponse extends ApiResponse<{
  refund: {
    id: string
    orderId: string
    amount: number
    reason: string
    status: 'pending' | 'success' | 'failed'
    createdAt: string
    updatedAt: string
  }
}> {}

// 订单核销
export interface OrderVerificationRequest {
  orderId: string
  verificationCode: string
  operator?: string
  notes?: string
}

// 订单核销响应
export interface OrderVerificationResponse extends ApiResponse<{
  order: Order
  verifiedAt: string
  operator: string
  verifiedItems: Array<{
    itemId: string
    productId: string
    verifiedAt: string
    operator: string
    notes?: string
  }>
}> {}

// 订单撤销
export interface OrderRevokeRequest {
  orderId: string
  operator?: string
  reason?: string
}

// 订单撤销响应
export interface OrderRevokeResponse extends ApiResponse<{
  order: Order
  revokedAt: string
  operator: string
  reason?: string
}> {}

// 订单配送地址
export interface OrderShippingAddress {
  id: string
  orderId: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
  longitude?: number
  latitude?: number
  createdAt: string
  updatedAt: string
}

// 订单配送地址响应
export interface OrderShippingAddressResponse extends ApiResponse<Array<OrderShippingAddress>> {}

// 订单商品规格
export interface OrderItemSpecification {
  name: string
  value: string
  price?: number
  stock?: number
}

// 订单商品规格响应
export interface OrderItemSpecificationResponse extends ApiResponse<Array<OrderItemSpecification>> {}

// 订单促销信息
export interface OrderPromotion {
  id: string
  type: 'discount' | 'coupon' | 'bundle' | 'free_shipping'
  title: string
  description: string
  value: number
  discountType: 'percentage' | 'fixed' | 'buy_x_get_y'
  discountValue: number
  maxDiscount?: number
  applicableTo?: 'all' | 'specific' | 'category'
  applicableIds?: string[]
  applicableCategories?: string[]
  validFrom: string
  validTo: string
  priority: number
  status: 'active' | 'expired' | 'deleted'
  createdAt: string
  updatedAt: string
}

// 订单促销信息响应
export interface OrderPromotionResponse extends ApiResponse<Array<OrderPromotion>> {}

// 订单优惠券
export interface OrderCoupon {
  id: string
  orderId: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minAmount?: number
  maxDiscount?: number
  validFrom: string
  validTo: string
  status: 'active' | 'expired' | 'used' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// 订单优惠券响应
export interface OrderCouponResponse extends ApiResponse<Array<OrderCoupon>> {}

// 订单优惠信息响应
export interface OrderDiscountInfoResponse extends ApiResponse<{
  subtotal: number
  discount: number
  shippingFee: number
  tax: number
  total: number
  promotions: Array<OrderPromotion>
  coupons: Array<OrderCoupon>
}> {}

// 订单时间线
export interface OrderTimeline {
  orderId: string
  events: Array<{
    id: string
    action: string
    description: string
    timestamp: string
    operator?: string
    data?: any
  }>
}

// 订单时间线响应
export interface OrderTimelineResponse extends ApiResponse<OrderTimeline> {}

// 订单导出模板
export interface OrderExportTemplate {
  id: string
  name: string
  columns: Array<{
    key: string
    label: string
    format?: string
  }>
  filters?: Record<string, any>
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// 订单导出模板响应
export interface OrderExportTemplateResponse extends ApiResponse<Array<OrderExportTemplate>> {}

// 订单分析
export interface OrderAnalysis {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  conversionRate: number
  averageItemsPerOrder: number
  refundRate: number
  averageProcessingTime: number
  averageDeliveryTime: number
  peakHours: Array<{
    hour: string
    orders: number
    revenue: number
  }>
  monthlyTrend: Array<{
    month: string
    orders: number
    revenue: number
    growth: number
  }>
  topProducts: Array<{
    productId: string
    productName: string
    orders: number
    revenue: number
    percentage: number
  }>
  topCustomers: Array<{
    userId: string
    userName: string
    orders: number
    revenue: number
    percentage: number
  }>
  paymentMethodDistribution: Record<Payment['method'], {
    count: number
    revenue: number
    percentage: number
  }>
  statusDistribution: Record<OrderStatus, {
    count: number
    percentage: number
  }>
}

// 订单分析响应
export interface OrderAnalysisResponse extends ApiResponse<OrderAnalysis> {}

// 订单预测
export interface OrderForecast {
  period: 'week' | 'month' | 'quarter' | 'year'
  forecast: Array<{
    date: string
    predictedOrders: number
    predictedRevenue: number
    confidence: number
    factors: Array<{
      name: string
      impact: positive | negative | neutral
      value: number
    }>
  }>
  trends: Array<{
    type: 'seasonal' | 'trend' | 'promotional' | 'external'
    description: string
    impact: positive | negative | neutral
    confidence: number
  }>
}

// 订单预测响应
export interface OrderForecastResponse extends ApiResponse<OrderForecast> {}

// 订单异常处理
export interface OrderException {
  id: string
  orderId: string
  type: 'payment_failure' | 'inventory_issue' | 'shipping_error' | 'customer_complaint' | 'system_error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  resolved: boolean
  assignedTo?: string
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

// 订单异常响应
export interface OrderExceptionResponse extends ApiResponse<Array<OrderException>> {}

// 订单自动处理规则
export interface OrderAutoRule {
  id: string
  name: string
  condition: {
    status?: OrderStatus
    paymentMethod?: Payment['method']
    amount?: { min?: number; max?: number }
    timeSinceCreation?: number
    customerType?: 'new' | 'regular' | 'vip'
  }
  action: {
    type: 'auto_payment' | 'auto_ship' | 'auto_deliver' | 'auto_cancel' | 'auto_refund'
    parameters?: Record<string, any>
  }
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

// 订单自动处理规则响应
export interface OrderAutoRuleResponse extends ApiResponse<Array<OrderAutoRule>> {}