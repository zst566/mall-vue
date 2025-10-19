import { BaseApiService } from './base'
import { 
  OrderSettlementParams, 
  OrderSettlementResult, 
  PaymentMethodConfig,
  PaymentMethodConfigResponse 
} from '@/types/payment'

/**
 * 订单结算API服务
 * 负责与后端API交互，处理订单结算相关操作
 */
export class SettlementApiService extends BaseApiService {
  constructor() {
    super()
  }

  /**
   * 计算订单结算
   * @param params 结算参数
   * @returns 结算结果
   */
  async calculateOrderSettlement(params: OrderSettlementParams): Promise<OrderSettlementResult> {
    try {
      const response = await this.client.post<OrderSettlementResult>('/settlement/calculate', params)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 确认订单结算
   * @param orderId 订单ID
   * @param settlementResult 结算结果
   * @returns 确认结果
   */
  async confirmOrderSettlement(orderId: string, settlementResult: OrderSettlementResult): Promise<any> {
    try {
      const response = await this.client.post(`/settlement/confirm/${orderId}`, settlementResult)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 获取支付方式配置
   * @returns 支付方式配置列表
   */
  async getPaymentMethodConfigs(): Promise<PaymentMethodConfig[]> {
    try {
      const response = await this.client.get<PaymentMethodConfigResponse>('/settlement/payment-configs')
      return response.data.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 更新支付方式配置
   * @param config 支付方式配置
   * @returns 更新结果
   */
  async updatePaymentMethodConfig(config: PaymentMethodConfig): Promise<PaymentMethodConfig> {
    try {
      const response = await this.client.put<PaymentMethodConfig>(`/settlement/payment-configs/${config.id}`, config)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 获取订单结算历史
   * @param orderId 订单ID
   * @returns 结算历史
   */
  async getOrderSettlementHistory(orderId: string): Promise<OrderSettlementResult[]> {
    try {
      const response = await this.client.get<{ data: OrderSettlementResult[] }>(`/settlement/history/${orderId}`)
      return response.data.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 批量计算订单结算
   * @param orderIds 订单ID列表
   * @returns 批量结算结果
   */
  async batchCalculateSettlement(orderIds: string[]): Promise<{ [orderId: string]: OrderSettlementResult }> {
    try {
      const response = await this.client.post<{ [orderId: string]: OrderSettlementResult }>('/settlement/batch-calculate', {
        orderIds
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 获取结算统计
   * @param params 查询参数
   * @returns 结算统计
   */
  async getSettlementStats(params: {
    startDate?: string
    endDate?: string
    merchantId?: string
    settlementMode?: string
  }): Promise<{
    totalOrders: number
    totalAmount: number
    totalPaymentFee: number
    totalSettlementAmount: number
    totalMerchantAmount: number
    totalMallAmount: number
    settlementModeStats: {
      [mode: string]: {
        count: number
        amount: number
      }
    }
    paymentMethodStats: {
      [method: string]: {
        count: number
        amount: number
        fee: number
      }
    }
  }> {
    try {
      const response = await this.client.get('/settlement/stats', { params })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 导出结算报表
   * @param params 导出参数
   * @returns 导出结果
   */
  async exportSettlementReport(params: {
    startDate?: string
    endDate?: string
    merchantId?: string
    settlementMode?: string
    format: 'excel' | 'csv' | 'pdf'
  }): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const response = await this.client.post('/settlement/export', params, {
        responseType: 'blob'
      })
      
      // 创建下载链接
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const filename = `settlement-report-${new Date().toISOString().split('T')[0]}.${params.format}`
      
      return { downloadUrl, filename }
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 验证结算结果
   * @param settlementResult 结算结果
   * @returns 验证结果
   */
  async validateSettlementResult(settlementResult: OrderSettlementResult): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    try {
      const response = await this.client.post('/settlement/validate', settlementResult)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }
}

// 导出单例实例
export const settlementApiService = new SettlementApiService()
