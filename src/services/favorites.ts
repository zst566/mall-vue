import { BaseApiService } from './api'
import type { UserFavorite, FavoriteTargetType, CheckFavoriteResponse, ApiResponse } from '@/types'

export class FavoriteService extends BaseApiService {
  constructor() {
    super()
  }

  /**
   * 添加收藏
   * @param targetType 收藏类型（PROMOTION 或 PRODUCT）
   * @param targetId 目标ID（促销活动ID或产品ID）
   */
  async addFavorite(targetType: FavoriteTargetType, targetId: string): Promise<UserFavorite> {
    try {
      return await this.post<UserFavorite>('/favorites', {
        targetType,
        targetId
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 取消收藏
   * @param targetType 收藏类型
   * @param targetId 目标ID
   */
  async removeFavorite(targetType: FavoriteTargetType, targetId: string): Promise<void> {
    try {
      await this.delete(`/favorites/${targetType}/${targetId}`)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 检查收藏状态
   * @param targetType 收藏类型
   * @param targetId 目标ID
   * @returns 是否已收藏
   */
  async checkFavorite(targetType: FavoriteTargetType, targetId: string): Promise<{ isFavorite: boolean }> {
    try {
      return await this.get<{ isFavorite: boolean }>(`/favorites/check/${targetType}/${targetId}`)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 获取收藏列表
   * @param targetType 收藏类型（可选，不传则返回所有类型）
   * @param page 页码（从1开始）
   * @param limit 每页数量
   */
  async getFavorites(
    targetType?: FavoriteTargetType,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: UserFavorite[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    try {
      const params: any = { page, limit }
      if (targetType) {
        params.targetType = targetType
      }

      // 直接使用 get 方法，它会自动处理响应结构
      const response = await this.get<{ data: UserFavorite[]; pagination: any }>('/favorites', { params })

      return {
        data: response.data || [],
        pagination: response.pagination || { page, limit, total: 0, totalPages: 0 }
      }
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 错误处理代理方法
   */
  private handleApiError(error: any): string {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          return data.error || '请求参数错误'
        case 401:
          return '请先登录'
        case 403:
          return '无权访问'
        case 404:
          return data.error || '收藏记录不存在'
        case 422:
          return data.error || '数据验证失败'
        case 500:
          return '服务器内部错误'
        default:
          return data.error || `请求失败 (${status})`
      }
    } else if (error.request) {
      return '网络连接失败，请检查网络设置'
    } else {
      return error.message || '请求失败'
    }
  }
}

// 导出单例实例
export const favoriteService = new FavoriteService()

