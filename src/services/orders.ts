import { BaseApiService } from './api'
import type { Order, OrderItem, OrderCreateRequest, OrderPaymentRequest, OrderSearchParams, OrderStatus, PaymentMethod } from '@/types'

export class OrderService extends BaseApiService {
  constructor() {
    super()
  }

  // 创建订单
  async createOrder(orderData: OrderCreateRequest): Promise<Order> {
    try {
      const response = await this.client.post<Order>('/orders/create', orderData)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取订单列表
  async getOrders(params?: OrderSearchParams): Promise<Order[]> {
    try {
      const response = await this.client.get<Order[]>('/orders', { params })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取订单详情
  async getOrderDetail(orderId: string): Promise<Order> {
    try {
      const response = await this.client<Order>(`/orders/${orderId}`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 取消订单
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      await this.client.post(`/orders/${orderId}/cancel`, { reason })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 确认收货
  async confirmOrder(orderId: string): Promise<void> {
    try {
      await this.client.post(`/orders/${orderId}/confirm`)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 申请退款
  async requestRefund(orderId: string, reason: string, refundAmount?: number, images?: File[]): Promise<void> {
    try {
      const formData = new FormData()
      formData.append('reason', reason)

      if (refundAmount !== undefined) {
        formData.append('refundAmount', refundAmount.toString())
      }

      if (images) {
        images.forEach((image, index) => {
          formData.append(`images[${index}]`, image)
        })
      }

      await this.client.post(`/orders/${orderId}/refund`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 查看退款进度
  async getRefundProgress(refundId: string): Promise<any> {
    try {
      const response = await this.client.get(`/refunds/${refundId}`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 支付订单
  async payOrder(orderId: string, paymentMethod: PaymentMethod, paymentData?: any): Promise<any> {
    try {
      const response = await this.client.post(`/orders/${orderId}/pay`, {
        paymentMethod,
        paymentData
      })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 查看支付状态
  async checkPaymentStatus(orderId: string): Promise<{ status: string; paymentId?: string }> {
    try {
      const response = await this.client.get(`/orders/${orderId}/payment-status`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 申请发票
  async requestInvoice(orderId: string, invoiceData: any): Promise<void> {
    try {
      await this.client.post(`/orders/${orderId}/invoice`, invoiceData)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 查看发票
  async getInvoice(orderId: string): Promise<any> {
    try {
      const response = await this.client.get(`/orders/${orderId}/invoice`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取物流信息
  async getShippingInfo(orderId: string): Promise<any> {
    try {
      const response = await this.client.get(`/orders/${orderId}/shipping`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 修改收货地址
  async updateShippingAddress(orderId: string, addressData: any): Promise<void> {
    try {
      await this.client.post(`/orders/${orderId}/address`, addressData)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取订单评价
  async getOrderReviews(orderId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/orders/${orderId}/reviews`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 提交订单评价
  async submitOrderReview(orderId: string, rating: number, content: string, images?: File[]): Promise<void> {
    try {
      const formData = new FormData()
      formData.append('orderId', orderId)
      formData.append('rating', rating.toString())
      formData.append('content', content)

      if (images) {
        images.forEach((image, index) => {
          formData.append(`images[${index}]`, image)
        })
      }

      await this.client.post(`/orders/${orderId}/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 重新购买
  async repurchase(orderId: string): Promise<OrderCreateRequest> {
    try {
      const response = await this.client.get<OrderCreateRequest>(`/orders/${orderId}/repurchase`)
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取订单统计信息
  async getOrderStatistics(params?: { startDate?: string; endDate?: string }): Promise<any> {
    try {
      const response = await this.client.get('/orders/statistics', { params })
      return response.data
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 导出订单数据
  async exportOrders(params: OrderSearchParams): Promise<Blob> {
    try {
      const response = await this.client.post('/orders/export', params, {
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
          return data.message || '请求参数错误'
        case 401:
          return '登录已过期，请重新登录'
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
export const orderService = new OrderService()