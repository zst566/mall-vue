// 支付方式配置类型定义
export interface PaymentMethodConfig {
  /** 支付方式ID */
  id: string
  /** 支付方式名称 */
  name: string
  /** 支付方式代码 */
  code: PaymentMethod
  /** 手续费率（百分比，如0.6表示0.6%） */
  feeRate: number
  /** 是否启用 */
  enabled: boolean
  /** 最小手续费（分） */
  minFee?: number
  /** 最大手续费（分） */
  maxFee?: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// 支付方式枚举
export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'other'

// 支付方式配置响应
export interface PaymentMethodConfigResponse extends ApiResponse<PaymentMethodConfig[]> {}

// 订单结算计算参数
export interface OrderSettlementParams {
  /** 订单ID */
  orderId: string
  /** 订单总金额（分） */
  totalAmount: number
  /** 支付方式 */
  paymentMethod: PaymentMethod
  /** 分账模式 */
  settlementMode: SettlementMode
  /** 分成比例（普通分账模式使用） */
  splitRatio?: number
  /** 补贴金额（商场补贴模式使用，分） */
  subsidyAmount?: number
  /** 结算价（积分兑换模式使用，分） */
  settlementPrice?: number
  /** 商品数量 */
  quantity: number
}

// 分账模式枚举
export type SettlementMode = 'normal_split' | 'mall_subsidy' | 'points_exchange'

// 订单结算结果
export interface OrderSettlementResult {
  /** 订单实收金额（分） */
  actualAmount: number
  /** 支付手续费（分） */
  paymentFee: number
  /** 待结算金额（分） */
  settlementAmount: number
  /** 商铺分账金额（分） */
  merchantAmount: number
  /** 商场分账金额（分） */
  mallAmount: number
  /** 手续费率 */
  feeRate: number
  /** 分账明细 */
  settlementDetails: SettlementDetail[]
}

// 分账明细
export interface SettlementDetail {
  /** 分账方类型 */
  type: 'merchant' | 'mall'
  /** 分账金额（分） */
  amount: number
  /** 分账比例 */
  ratio: number
  /** 分账说明 */
  description: string
}

// 通用API响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
