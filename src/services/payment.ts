import { BaseApiService } from './api'
import type { PaymentRequest, PaymentResponse, PaymentMethod, RefundRequest, PaymentStatus } from '@/types'

export class PaymentService extends BaseApiService {
  constructor() {
    super()
  }

  // 创建支付订单
  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await this.client.post<PaymentResponse>('/payments/create', paymentData)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 查询支付状态
  async getPaymentStatus(paymentId: string): Promise<{ status: PaymentStatus; paymentInfo?: any }> {
    try {
      const response = await this.client.get<{ status: PaymentStatus; paymentInfo?: any }>(`/payments/${paymentId}/status`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 取消支付
  async cancelPayment(paymentId: string, reason?: string): Promise<void> {
    try {
      await this.client.post(`/payments/${paymentId}/cancel`, { reason })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 重新支付
  async replayPayment(orderId: string, paymentMethod: PaymentMethod): Promise<PaymentResponse> {
    try {
      const response = await this.client.post<PaymentResponse>(`/payments/${orderId}/replay`, {
        paymentMethod
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取支付方式列表
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await this.client.get<PaymentMethod[]>('/payments/methods')
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 验证支付结果
  async verifyPayment(paymentId: string, orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post<{ success: boolean; message: string }>(`/payments/${paymentId}/verify`, {
        orderId
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 申请退款
  async requestRefund(refundRequest: RefundRequest): Promise<{ refundId: string; message: string }> {
    try {
      const response = await this.client.post<{ refundId: string; message: string }>('/payments/refund', refundRequest)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 查询退款状态
  async getRefundStatus(refundId: string): Promise<{ status: string; message: string }> {
    try {
      const response = await this.client.get<{ status: string; message: string }>(`/payments/refunds/${refundId}/status`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取支付限额
  async getPaymentLimits(paymentMethod: PaymentMethod): Promise<{ min: number; max: number }> {
    try {
      const response = await this.client.get<{ min: number; max: number }>(`/payments/limits`, {
        params: { paymentMethod }
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 验证银行卡信息
  async validateBankCard(cardNumber: string, cardHolder: string, expiryDate: string, cvv: string): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await this.client.post<{ valid: boolean; message: string }>('/payments/validate-bank-card', {
        cardNumber,
        cardHolder,
        expiryDate,
        cvv
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 保存银行卡信息
  async saveBankCard(cardNumber: string, cardHolder: string, expiryDate: string, cvv: string, isDefault: boolean = false): Promise<{ cardId: string; lastFour: string }> {
    try {
      const response = await this.client.post<{ cardId: string; lastFour: string }>('/payments/bank-card/save', {
        cardNumber,
        cardHolder,
        expiryDate,
        cvv,
        isDefault
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取保存的银行卡列表
  async getSavedBankCards(): Promise<Array<{ cardId: string; lastFour: string; expiryDate: string; isDefault: boolean }>> {
    try {
      const response = await this.client.get<Array<{ cardId: string; lastFour: string; expiryDate: string; isDefault: boolean }>>('/payments/bank-card/list')
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 删除保存的银行卡
  async deleteBankCard(cardId: string): Promise<void> {
    try {
      await this.client.delete(`/payments/bank-card/${cardId}`)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 设置默认银行卡
  async setDefaultBankCard(cardId: string): Promise<void> {
    try {
      await this.client.post(`/payments/bank-card/${cardId}/default`)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取支付宝扫码信息
  async getAlipayQrCode(orderId: string): Promise<{ qrCodeUrl: string; paymentId: string; expireTime: number }> {
    try {
      const response = await this.client.post<{ qrCodeUrl: string; paymentId: string; expireTime: number }>(`/payments/alipay/qr-code`, { orderId })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 查询支付宝支付状态
  async checkAlipayStatus(paymentId: string): Promise<{ status: string; tradeNo?: string }> {
    try {
      const response = await this.client.get<{ status: string; tradeNo?: string }>(`/payments/alipay/status/${paymentId}`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取微信支付参数
  async getWechatPaymentParams(orderId: string, paymentMethod: PaymentMethod): Promise<{ appId: string; timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string }> {
    try {
      const response = await this.client.post<{ appId: string; timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string }>(`/payments/wechat/params`, {
        orderId,
        paymentMethod
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 验证微信支付结果
  async verifyWechatPayment(paymentId: string, openid: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post<{ success: boolean; message: string }>(`/payments/wechat/verify`, {
        paymentId,
        openid
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取支付统计信息
  async getPaymentStatistics(params?: { startDate?: string; endDate?: string; paymentMethod?: PaymentMethod }): Promise<any> {
    try {
      const response = await this.client.get('/payments/statistics', { params })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 导出支付记录
  async exportPaymentRecords(params: { startDate?: string; endDate?: string; paymentMethod?: PaymentMethod }): Promise<Blob> {
    try {
      const response = await this.client.post('/payments/export', params, {
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

      switch (status) {
        case 400:
          return data.message || '支付参数错误'
        case 401:
          return '登录已过期，请重新登录'
        case 404:
          return '支付订单不存在'
        case 422:
          return data.message || '数据验证失败'
        case 429:
          return '支付请求过于频繁，请稍后重试'
        case 500:
          return '支付服务内部错误'
        default:
          return data.message || `支付失败 (${status})`
      }
    } else if (error.request) {
      return '网络连接失败，请检查网络设置'
    } else {
      return error.message || '支付失败'
    }
  }
}

// 导出单例实例
export const paymentService = new PaymentService()