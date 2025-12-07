/**
 * 促销服务
 * 提供促销列表和分类信息获取功能
 */
import { BaseApiService } from './api'
import { homepageService } from './homepage'
import type { NavigationCategoryConfig } from '@/types/homepage'

// 促销列表响应类型
export interface PromotionListResponse {
  data: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 促销查询参数
export interface PromotionQueryParams {
  page?: number
  limit?: number
  categoryId?: string
  navigationCategoryId?: string
  status?: string
  keyword?: string
}

export class PromotionService extends BaseApiService {
  constructor() {
    super()
  }

  /**
   * 获取促销列表
   * @param params 查询参数
   */
  async getPromotions(params: PromotionQueryParams): Promise<PromotionListResponse> {
    try {
      const queryParams: any = {
        page: params.page || 1,
        limit: params.limit || 10,
      }

      if (params.categoryId) {
        queryParams.categoryId = params.categoryId
      }

      if (params.navigationCategoryId) {
        queryParams.navigationCategoryId = params.navigationCategoryId
      }

      if (params.status) {
        queryParams.status = params.status
      }

      if (params.keyword) {
        queryParams.keyword = params.keyword
      }

      const result = await this.get<PromotionListResponse>('/promotions', {
        params: queryParams,
      })

      return result
    } catch (error) {
      console.error('获取促销列表失败:', error)
      throw new Error(this.handleApiError(error))
    }
  }

  /**
   * 通过导航分类ID获取促销列表
   * @param navigationCategoryId 导航分类ID
   * @param params 查询参数（包含分页信息）
   */
  async getPromotionsByNavigationCategory(
    navigationCategoryId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PromotionListResponse> {
    try {
      return await this.getPromotions({
        navigationCategoryId,
        page: params?.page || 1,
        limit: params?.limit || 10,
      })
    } catch (error) {
      console.error(`获取导航分类促销列表失败 (navigationCategoryId: ${navigationCategoryId}):`, error)
      throw error
    }
  }

  /**
   * 获取导航分类信息
   * @param id 导航分类ID
   */
  async getNavigationCategoryById(id: string): Promise<NavigationCategoryConfig | null> {
    try {
      const categories = await homepageService.getNavigationCategories()
      return categories.find((cat) => cat.id === id) || null
    } catch (error) {
      console.error(`获取导航分类信息失败 (id: ${id}):`, error)
      return null
    }
  }

  /**
   * 处理 API 错误
   */
  private handleApiError(error: any): string {
    if (error?.response?.data?.message) {
      return error.response.data.message
    }
    if (error?.message) {
      return error.message
    }
    return '获取促销列表失败，请稍后重试'
  }
}

export const promotionService = new PromotionService()



















