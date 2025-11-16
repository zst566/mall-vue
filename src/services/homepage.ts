/**
 * 首页服务
 * 提供首页数据获取功能，包含缓存机制
 */
import { BaseApiService } from './api'
import type { NavigationCategoryConfig, HomepageBannerConfig } from '@/types/homepage'

export class HomepageService extends BaseApiService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheExpiry = 60 * 1000 // 1分钟缓存

  constructor() {
    super()
  }

  /**
   * 从缓存获取数据
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data as T
    }
    return null
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * 获取横幅列表
   */
  async getBanners(): Promise<HomepageBannerConfig[]> {
    const cacheKey = 'banners'
    const cached = this.getCached<HomepageBannerConfig[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await this.get<HomepageBannerConfig[]>('/homepage/banners')
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('获取横幅列表失败:', error)
      return []
    }
  }

  /**
   * 获取导航分类列表
   */
  async getNavigationCategories(): Promise<NavigationCategoryConfig[]> {
    const cacheKey = 'navigation-categories'
    const cached = this.getCached<NavigationCategoryConfig[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await this.get<NavigationCategoryConfig[]>('/homepage/navigation-categories')
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('获取导航分类列表失败:', error)
      return []
    }
  }

  /**
   * 获取分类促销列表
   */
  async getCategoryPromotions(categoryId: string, limit: number = 3): Promise<any[]> {
    const cacheKey = `category-promotions-${categoryId}-${limit}`
    const cached = this.getCached<any[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await this.get<any[]>('/homepage/category-promotions', {
        params: {
          categoryId,
          limit,
        },
      })
      this.setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error(`获取分类促销列表失败 (categoryId: ${categoryId}):`, error)
      return []
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}

export const homepageService = new HomepageService()


