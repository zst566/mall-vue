import { BaseApiService } from './api'
import type { MerchantOrder, MerchantOrderStatus, QRCodeData, VerificationResult, MerchantOrderStats, RefundRequest } from '@/types'

export class MerchantService extends BaseApiService {
  constructor() {
    super()
  }

  // 获取商户订单列表
  async getMerchantOrders(params?: {
    status?: MerchantOrderStatus;
    page?: number;
    limit?: number;
    dateRange?: { startDate: string; endDate: string };
    search?: string;
  }): Promise<{ orders: MerchantOrder[]; total: number; page: number; limit: number }> {
    try {
      // 使用正确的接口：/api/merchants/me/orders
      // 使用 this.get 方法，它会自动提取 response.data.data
      const response = await this.get<{ orders: MerchantOrder[]; total: number; page: number; limit: number }>('/merchants/me/orders', { params })
      return response
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取商户订单详情
  async getMerchantOrderDetail(orderId: string): Promise<MerchantOrder> {
    try {
      // 使用通用的订单接口：/api/orders/:orderId
      // 使用 this.get 而不是 this.client.get，因为 BaseApiService.get 会自动提取 response.data.data
      const orderDetail = await this.get<MerchantOrder>(`/orders/${orderId}`)
      return orderDetail
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 核销订单
  async verifyOrder(orderId: string, verificationData?: { operatorName?: string; notes?: string }): Promise<VerificationResult> {
    try {
      // 后端返回 { success: true, data: Order, message: '订单核销成功' }
      // 使用 this.post 会自动提取 response.data.data，得到 Order 对象
      // 注意：路径是 /merchants（复数），不是 /merchant（单数）
      const order = await this.post<any>(`/merchants/orders/${orderId}/verify`, verificationData)
      
      // 构建 VerificationResult 对象
      const result: VerificationResult = {
        success: true,
        order: order,
        message: '订单核销成功',
        canRevoke: true // 默认可以撤销（当天）
      }
      
      return result
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 批量核销订单
  async batchVerifyOrders(orderIds: string[], verificationData?: { operatorName?: string; notes?: string }): Promise<Array<{ orderId: string; success: boolean; message?: string }>> {
    try {
      const response = await this.client.post<Array<{ orderId: string; success: boolean; message?: string }>>('/merchant/orders/batch-verify', {
        orderIds,
        verificationData
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 撤销订单
  async cancelMerchantOrder(orderId: string, reason: string, operatorName?: string): Promise<void> {
    try {
      await this.client.post(`/merchant/orders/${orderId}/cancel`, {
        reason,
        operatorName
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 申请退款
  async requestRefund(orderId: string, refundData: RefundRequest & { operatorName?: string }): Promise<{ refundId: string }> {
    try {
      const response = await this.client.post<{ refundId: string }>(`/merchant/orders/${orderId}/refund`, refundData)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 同意退款
  async approveRefund(refundId: string, operatorName?: string): Promise<void> {
    try {
      await this.client.post(`/merchant/refunds/${refundId}/approve`, { operatorName })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 拒绝退款
  async rejectRefund(refundId: string, reason: string, operatorName?: string): Promise<void> {
    try {
      await this.client.post(`/merchant/refunds/${refundId}/reject`, {
        reason,
        operatorName
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取退款申请列表
  async getRefundRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
    dateRange?: { startDate: string; endDate: string };
  }): Promise<{ refunds: any[]; total: number }> {
    try {
      const response = await this.client.get<{ refunds: any[]; total: number }>('/merchant/refunds', { params })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 生成二维码
  async generateQRCode(orderId: string, options?: { size?: number; format?: string }): Promise<QRCodeData> {
    try {
      const response = await this.client.post<QRCodeData>(`/merchant/orders/${orderId}/qr-code`, options)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 保存二维码
  async saveQRCode(qrCodeId: string, name?: string): Promise<void> {
    try {
      await this.client.post(`/merchant/qr-codes/${qrCodeId}/save`, { name })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取二维码列表
  async getSavedQRCodes(): Promise<Array<{ qrCodeId: string; orderId: string; orderNo: string; qrCodeUrl: string; name: string; createdAt: string }>> {
    try {
      const response = await this.client.get<Array<{ qrCodeId: string; orderId: string; orderNo: string; qrCodeUrl: string; name: string; createdAt: string }>>('/merchant/qr-codes')
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 删除二维码
  async deleteQRCode(qrCodeId: string): Promise<void> {
    try {
      await this.client.delete(`/merchant/qr-codes/${qrCodeId}`)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 更新商户信息
  async updateMerchantProfile(profileData: {
    name?: string;
    phone?: string;
    address?: string;
    businessHours?: string;
    description?: string;
  }): Promise<void> {
    try {
      // 使用正确的接口：/api/merchants/me/profile (PUT)
      await this.client.put('/merchants/me/profile', profileData)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取商户信息
  async getMerchantProfile(): Promise<any> {
    try {
      // 使用正确的接口：/api/merchants/me
      const response = await this.client.get('/merchants/me')
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取商户统计信息
  async getMerchantStatistics(dateRange?: { startDate: string; endDate: string }): Promise<MerchantOrderStats> {
    try {
      // 使用正确的接口：/api/merchants/statistics/today 或 /api/merchants/me/dashboard
      // 优先使用 dashboard 接口，它包含更完整的统计信息
      const response = await this.client.get<MerchantOrderStats>('/merchants/me/dashboard', {
        params: dateRange
      })
      return response.data
    } catch (error) {
      // 如果 dashboard 接口失败，尝试使用 today 接口
      try {
        const response = await this.client.get<MerchantOrderStats>('/merchants/statistics/today')
        return response.data
      } catch (fallbackError) {
        throw new Error(this.handleApiError(error))
      }
    }
  }

  // 导出商户订单数据
  async exportMerchantOrders(params: {
    dateRange?: { startDate: string; endDate: string };
    status?: MerchantOrderStatus;
    search?: string;
    format?: 'csv' | 'excel';
  }): Promise<Blob> {
    try {
      const response = await this.client.post('/merchant/orders/export', params, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 导出退款数据
  async exportRefundData(params: {
    dateRange?: { startDate: string; endDate: string };
    status?: string;
    format?: 'csv' | 'excel';
  }): Promise<Blob> {
    try {
      const response = await this.client.post('/merchant/refunds/export', params, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取订单操作日志
  async getOrderLogs(orderId: string): Promise<Array<{
    id: string;
    action: string;
    operator: string;
    operatorName: string;
    timestamp: string;
    details: any;
  }>> {
    try {
      const response = await this.client.get<Array<{
        id: string;
        action: string;
        operator: string;
        operatorName: string;
        timestamp: string;
        details: any;
      }>>(`/merchant/orders/${orderId}/logs`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 批量导出二维码
  async batchExportQRCodes(orderIds: string[], format?: 'png' | 'svg'): Promise<Blob> {
    try {
      const response = await this.client.post('/merchant/qr-codes/batch-export', {
        orderIds,
        format
      }, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 错误处理代理方法
  private handleApiError(error: any): string {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      // 优先使用 API 返回的错误信息
      if (data?.error) {
        return data.error
      }
      if (data?.message) {
        return data.message
      }

      switch (status) {
        case 400:
          return '请求参数错误'
        case 401:
          return '登录已过期，请重新登录'
        case 403:
          return '权限不足，无法访问'
        case 404:
          return '订单不存在'
        case 422:
          return data.message || '数据验证失败'
        case 429:
          return '请求过于频繁，请稍后重试'
        case 500:
          return '服务器内部错误'
        default:
          return data.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      return '网络连接失败，请检查网络设置'
    } else {
      return error.message || '请求失败'
    }
  }
}

// 导出单例实例
export const merchantService = new MerchantService()