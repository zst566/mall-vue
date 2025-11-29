/**
 * 首页服务
 * 提供首页数据获取功能，包含缓存机制
 */
import { BaseApiService } from './api'
import type { NavigationCategoryConfig, HomepageBannerConfig } from '@/types/homepage'
import type { Promotion } from '@/types/promotion'

export class HomepageService extends BaseApiService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private cacheExpiry = 30 * 60 * 1000 // 30分钟缓存（优化后）

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
   * 获取轮播配置
   */
  async getCarouselConfig(): Promise<{ autoRotateInterval: number; bannerFullWidth: boolean }> {
    const cacheKey = 'carousel-config'
    const cached = this.getCached<{ autoRotateInterval: number; bannerFullWidth: boolean }>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await this.get<{ autoRotateInterval: number; bannerFullWidth?: boolean }>(
        '/homepage/carousel-config'
      )
      const normalized = {
        autoRotateInterval: data.autoRotateInterval ?? 3,
        bannerFullWidth: data.bannerFullWidth ?? true,
      }
      this.setCache(cacheKey, normalized)
      return normalized
    } catch (error) {
      console.error('获取轮播配置失败:', error)
      return { autoRotateInterval: 3, bannerFullWidth: true } // 默认3秒 + 贯穿式
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
  async getCategoryPromotions(categoryId: string, limit: number = 3): Promise<Promotion[]> {
    const cacheKey = `category-promotions-${categoryId}-${limit}`
    const cached = this.getCached<Promotion[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await this.get<Promotion[]>('/homepage/category-promotions', {
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

  /**
   * 获取首页聚合数据（优化版，一次请求所有数据）
   * 返回：横幅 + 导航分类（含促销数据） + 轮播配置
   */
  async getHomepageData(): Promise<{
    banners: HomepageBannerConfig[]
    carouselConfig: { autoRotateInterval: number; bannerFullWidth: boolean }
    navigationCategories: Array<NavigationCategoryConfig & { promotions: Promotion[] }>
  }> {
    const cacheKey = 'homepage-data'
    const cached = this.getCached<{
      banners: HomepageBannerConfig[]
      carouselConfig: { autoRotateInterval: number; bannerFullWidth: boolean }
      navigationCategories: Array<NavigationCategoryConfig & { promotions: Promotion[] }>
    }>(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const data = await this.get<{
        banners: HomepageBannerConfig[]
        carouselConfig: { autoRotateInterval: number; bannerFullWidth?: boolean }
        navigationCategories: Array<NavigationCategoryConfig & { promotions: Promotion[] }>
      }>('/homepage/data')

      const normalized = {
        ...data,
        carouselConfig: {
          autoRotateInterval: data.carouselConfig?.autoRotateInterval ?? 3,
          bannerFullWidth: data.carouselConfig?.bannerFullWidth ?? true,
        },
      }

      this.setCache(cacheKey, normalized)
      return normalized
    } catch (error) {
      console.error('获取首页聚合数据失败:', error)
      // 返回空数据而不是抛出错误
      return {
        banners: [],
        carouselConfig: { autoRotateInterval: 3, bannerFullWidth: true },
        navigationCategories: [],
      }
    }
  }
}

export const homepageService = new HomepageService()





