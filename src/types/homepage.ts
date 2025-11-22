/**
 * 首页相关类型定义
 */

// 导航分类配置
export interface NavigationCategoryConfig {
  id: string
  displayName: string
  icon: string
  sortOrder: number
  isEnabled: boolean
  linkType: 'category_list' | 'custom_url'
  linkUrl?: string
  promotionCategoryIds: string[]
  merchantCategoryIds: string[]
  displayCount: number
}

// 横幅配置
export interface HomepageBannerConfig {
  id: string
  image: string
  title?: string
  subtitle?: string
  sortOrder: number
  startTime?: string
  endTime?: string
  linkType: 'promotion_detail' | 'category_list' | 'custom_url'
  linkValue?: string
  isEnabled: boolean
}

// 首页数据响应
export interface HomepageData {
  banners: HomepageBannerConfig[]
  navigationCategories: NavigationCategoryConfig[]
  categoryPromotions: Record<string, any[]>
}





