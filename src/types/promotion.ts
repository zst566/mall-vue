/**
 * 移动端促销活动类型定义
 * 基于 PC 端类型，但简化为移动端首页展示所需的核心字段
 */

// 促销活动图片（支持多种格式）
export type PromotionImage = 
  | string 
  | { url: string; [key: string]: any }
  | Array<string | { url: string; [key: string]: any }>

// 商户信息（简化版）
export interface PromotionMerchant {
  id?: string
  name?: string
  location?: string
  address?: string
}

// 促销活动规格（默认规格信息）
export interface PromotionVariant {
  id?: string
  promotionMode?: 'mall_subsidy' | 'normal_split' | 'points_exchange'
  subsidyAmount?: number
  salePrice?: number
  originalPrice?: number | null
  referencePrice?: number | null
  isDefault?: boolean
  [key: string]: any // 允许其他字段以保持向后兼容
}

// 促销活动基础信息（移动端首页展示用）
export interface Promotion {
  id: string
  promotionId?: string // 兼容字段
  name: string
  title?: string // 兼容字段，优先使用 name
  description?: string
  merchantId?: string
  merchantName?: string
  merchant?: PromotionMerchant
  productId?: string
  productName?: string
  // 价格信息
  salePrice?: number
  price?: number // 兼容字段，优先使用 salePrice
  originalPrice?: number
  // 默认规格信息（用于判断补贴模式等）
  defaultVariant?: PromotionVariant | null
  // 图片（支持多种格式）
  images?: PromotionImage
  // 时间信息
  startTime?: string
  endTime?: string
  // 状态
  status?: string
  // 其他可选字段
  [key: string]: any // 允许其他字段以保持向后兼容
}
