/**
 * 首页相关类型定义
 */

// 导航分类小banner配置
export interface NavigationCategoryBanner {
  id: string
  image: string
  linkUrl?: string
  startTime?: string
  endTime?: string
  sortOrder: number
}

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
  titleColor?: string // 标题渐变颜色（格式：linear-gradient(to right, #color1, #color2)）
  banners?: NavigationCategoryBanner[] // 小banner配置数组（最多3个）
  breathingDuration?: number // Banner呼吸动画时长（单位：秒，默认4秒）
  thumbnail?: string // 分类缩略图URL（优先于icon显示）
  layout?: 'horizontal' | 'vertical' // 促销活动布局：水平排列或纵向排列（默认horizontal）
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
  breathingDuration?: number // 呼吸动画时长（单位：秒，默认7秒）
  animationType?: 'breathing' | 'shimmer' | 'none' // 微动态类型：呼吸放大、随机流光、无动画
}

// 首页数据响应（旧版接口使用，保留以兼容；新聚合接口在 services/homepage.ts 中单独定义）
export interface HomepageData {
  banners: HomepageBannerConfig[]
  navigationCategories: NavigationCategoryConfig[]
  categoryPromotions: Record<string, any[]>
}





