import { BaseApiService, ApiErrorHandler } from './api'

// 商户操作员绑定状态
export interface MerchantOperatorStatus {
  hasBinding: boolean
  merchantUser?: {
    id: string
    merchantId: string
    merchantName: string
    merchantCode?: string
    role: 'ADMIN' | 'OPERATOR'
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
    isActive: boolean
    appliedAt?: string
    approvedAt?: string
    rejectedAt?: string
    rejectReason?: string
  }
}

// 申请绑定请求
export interface ApplyOperatorRequest {
  inviteCode: string
  realName: string
  phone: string
}

// 申请绑定响应
export interface ApplyOperatorResponse {
  id: string
  merchantId: string
  merchantName: string
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  appliedAt: string
}

// 商铺信息
export interface ShopInfo {
  id: string
  shopCode: string
  floor: string
  area: string
  tenantName: string
}

// 核销记录
export interface VerificationRecord {
  id: string
  orderId: string
  orderNo: string
  shopId?: string
  shopCode?: string
  promotionId: string
  promotionName: string
  customerName: string
  amount: number
  verificationType: string
  verifiedBy: string
  verifiedByName: string
  verifiedAt: string
  status: string
  canCancel: boolean
}

// 核销记录列表响应
export interface VerificationListResponse {
  list: VerificationRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 今日统计
export interface TodayStatistics {
  verificationCount: number
  verificationAmount: number
  refundCount: number
  refundAmount: number
  averagePrice: number
  hourlyStats: Array<{
    hour: string
    count: number
  }>
  topProducts: Array<{
    promotionId: string
    promotionName: string
    amount: number
    count: number
    percentage: number
  }>
}

// 本月统计
export interface MonthStatistics {
  verificationCount: number
  verificationAmount: number
  refundCount: number
  refundAmount: number
  averagePrice: number
  dailyTrends: Array<{
    date: string
    count: number
    amount: number
  }>
}

// 按促销活动统计
export interface PromotionStatistics {
  promotionId: string
  promotionName: string
  verificationCount: number
  verificationAmount: number
  refundCount: number
  refundAmount: number
  averagePrice: number
}

export class MerchantOperatorService extends BaseApiService {
  constructor() {
    super()
  }

  /**
   * 申请绑定商户操作员
   */
  async applyOperator(inviteCode: string, realName: string, phone: string): Promise<ApplyOperatorResponse> {
    try {
      const response = await this.client.post<{
        success: boolean
        data: ApplyOperatorResponse
        message: string
      }>('/merchant-operators/apply', { inviteCode, realName, phone })
      
      if (!response.data.success) {
        throw new Error(response.data.message || '申请失败')
      }
      
      return response.data.data
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * 查询当前用户的商户绑定状态
   */
  async getMyStatus(): Promise<MerchantOperatorStatus> {
    try {
      const response = await this.client.get<{
        success: boolean
        data: MerchantOperatorStatus
      }>('/merchant-operators/my-status')
      
      if (!response.data.success) {
        throw new Error('查询状态失败')
      }
      
      return response.data.data
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取当前商户的商铺列表
   */
  async getShops(): Promise<ShopInfo[]> {
    try {
      const response = await this.client.get<{
        success: boolean
        data: ShopInfo[]
      }>('/merchant-operators/shops')
      
      if (!response.data.success) {
        throw new Error('获取商铺列表失败')
      }
      
      return response.data.data
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取核销记录列表
   */
  async getVerifications(params?: {
    date?: string // 'today' | 'week' | 'month' | 'YYYY-MM-DD'
    shopId?: string
    promotionId?: string
    page?: number
    pageSize?: number
  }): Promise<VerificationListResponse> {
    try {
      // 使用 this.get 而不是 this.client.get，自动提取 response.data.data
      const result = await this.get<VerificationListResponse>('/merchants/verifications', { params })
      return result
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * 取消核销
   */
  async cancelVerification(verificationId: string): Promise<void> {
    try {
      const response = await this.client.post<{
        success: boolean
        message: string
      }>(`/merchants/verifications/${verificationId}/cancel`)
      
      if (!response.data.success) {
        throw new Error(response.data.message || '取消核销失败')
      }
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取今日统计
   */
  async getTodayStatistics(): Promise<TodayStatistics> {
    try {
      // 使用 this.get 自动提取 response.data.data
      const result = await this.get<TodayStatistics>('/merchants/statistics/today')
      return result
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取本月统计
   */
  async getMonthStatistics(params?: {
    shopId?: string
  }): Promise<MonthStatistics> {
    try {
      // 使用 this.get 自动提取 response.data.data
      const result = await this.get<MonthStatistics>('/merchants/statistics/month', { params })
      return result
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * 按促销活动统计
   */
  async getStatisticsByPromotion(params?: {
    date?: string // 'today' | 'month' | 'YYYY-MM-DD'
    shopId?: string
  }): Promise<PromotionStatistics[]> {
    try {
      // 使用 this.get 自动提取 response.data.data
      const result = await this.get<PromotionStatistics[]>('/merchants/statistics/by-promotion', { params })
      return result
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }
}

// 导出单例
export const merchantOperatorService = new MerchantOperatorService()

