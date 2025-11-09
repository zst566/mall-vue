import { BaseApiService } from './api'

/**
 * 积分记录
 */
export interface PointsRecord {
  id: string
  userId: string
  type: 'EARN' | 'REDEEM' | 'EXPIRE'
  amount: number
  balance: number
  description?: string
  orderId?: string
  expiresAt?: string
  createdAt: string
}

/**
 * 积分服务
 */
export class PointsService extends BaseApiService {
  constructor() {
    super()
  }

  /**
   * 获取用户积分余额
   * @param userId 用户ID
   * @returns 积分余额
   */
  async getUserPoints(userId: string): Promise<number> {
    try {
      const response = await this.client.get<{ userId: string; points: number }>(`/users/${userId}/points`)
      return response.data.points
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 获取用户积分记录
   * @param userId 用户ID
   * @param limit 限制数量
   * @returns 积分记录列表
   */
  async getPointsHistory(userId: string, limit: number = 20): Promise<PointsRecord[]> {
    try {
      const response = await this.client.get<{ userId: string; history: PointsRecord[] }>(
        `/users/${userId}/points/history`,
        { params: { limit } }
      )
      return response.data.history
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
          return '积分记录不存在'
        case 422:
          return data.message || '数据验证失败'
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

