<template>
  <div class="promotions-page">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="category?.displayName || '分类促销'"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
      z-index="100"
    />

    <!-- 分类标题 -->
    <div 
      v-if="category"
      class="category-header" 
      :class="{ 'has-gradient': isGradientBackground }"
      :style="getSectionHeaderStyle()"
    >
      <div class="title-wrapper">
        <!-- 缩略图或图标 -->
        <div class="category-icon-wrapper" v-if="category.thumbnail || category.icon">
          <img 
            v-if="category.thumbnail" 
            :src="getImageUrl(category.thumbnail)" 
            :alt="category.displayName"
            class="category-thumbnail"
          />
          <van-icon 
            v-else 
            :name="getValidIconName(category.icon)" 
            class="category-icon" 
          />
        </div>
        <h2>{{ category.displayName }}</h2>
      </div>
    </div>

    <!-- Banner区域 - 轮播 -->
    <div v-if="validBanners.length > 0 && currentBanner" class="banner-area">
      <div
        class="banner-carousel"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <transition name="fade" mode="out-in">
          <div
            :key="currentBannerIndex"
            class="category-banner"
            :class="{ clickable: currentBanner.linkUrl }"
            @click="handleBannerClick(currentBanner)"
          >
            <img
              :src="getImageUrl(currentBanner.image)"
              :alt="category?.displayName"
              class="banner-image-breathing"
              :style="{ animationDuration: `${breathingDuration}s` }"
            />
          </div>
        </transition>
      </div>
      
      <!-- 指示器 -->
      <div v-if="validBanners.length > 1" class="banner-indicators">
        <div
          v-for="(banner, index) in validBanners"
          :key="banner.id"
          class="indicator-dot"
          :class="{ active: index === currentBannerIndex }"
          @click="goToBanner(index)"
        ></div>
      </div>
    </div>

    <!-- 促销列表 -->
    <div class="promotions-container">
      <div v-if="loading && promotions.length === 0" class="loading-container">
        <van-loading type="spinner" size="24px">加载中...</van-loading>
      </div>

      <div v-else-if="promotions.length === 0" class="empty-container">
        <van-empty description="暂无促销活动" />
      </div>

      <div v-else class="promotions-grid">
        <div
          v-for="promotion in promotions"
          :key="promotion.id"
          class="promotion-card"
          @click="handlePromotionClick(promotion)"
        >
          <div class="promotion-image">
            <img
              v-if="getPromotionImage(promotion)"
              :src="getPromotionImage(promotion)"
              :alt="promotion.name || promotion.title"
              class="promo-img"
            />
            <PlaceholderImage v-else width="100%" height="100%" />
          </div>
          <div class="promotion-info">
            <p class="promotion-title">{{ promotion.name || promotion.title }}</p>
            <p class="promotion-desc" v-if="getMerchantLocation(promotion)">
              {{ getMerchantLocation(promotion) }}
            </p>
            <div class="promotion-price">
              <span class="price-symbol">¥</span>
              <span class="price-value">{{ formatPrice(promotion.salePrice || promotion.price) }}</span>
              <span
                class="price-original"
                v-if="promotion.originalPrice && promotion.originalPrice > (promotion.salePrice || promotion.price)"
              >
                ¥{{ formatPrice(promotion.originalPrice) }}
              </span>
            </div>
            <div class="promotion-meta" v-if="getLeftQuantity(promotion) !== undefined">
              <span class="left-quantity">剩余 {{ getLeftQuantity(promotion) }} 件</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading && promotions.length > 0" class="load-more">
        <van-loading type="spinner" size="20px">加载更多</van-loading>
      </div>
      <div v-if="!hasMore && promotions.length > 0" class="load-more">
        <span>没有更多了</span>
      </div>
    </div>

    <!-- 返回顶部按钮 -->
    <van-back-top right="20px" bottom="80px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import { promotionService } from '@/services/promotions'
import type { NavigationCategoryConfig, NavigationCategoryBanner } from '@/types/homepage'
import { formatMoney } from '@/utils/format'

const router = useRouter()
const route = useRoute()

// 分类信息
const category = ref<NavigationCategoryConfig | null>(null)
const loading = ref(false)
const promotions = ref<any[]>([])
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(10)

// Banner相关
const validBanners = computed(() => {
  if (!category.value?.banners || category.value.banners.length === 0) {
    return []
  }

  const now = new Date()
  return category.value.banners.filter((banner: NavigationCategoryBanner) => {
    if (!banner.startTime && !banner.endTime) return true
    
    const startTime = banner.startTime ? new Date(banner.startTime) : null
    const endTime = banner.endTime ? new Date(banner.endTime) : null
    
    if (startTime && now < startTime) return false
    if (endTime && now > endTime) return false
    
    return true
  }).sort((a, b) => a.sortOrder - b.sortOrder)
})

const currentBannerIndex = ref(0)
const autoPlayTimer = ref<number | null>(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const isSwiping = ref(false)

const currentBanner = computed(() => {
  if (validBanners.value.length === 0) {
    return null
  }
  return validBanners.value[currentBannerIndex.value]
})

const breathingDuration = computed(() => {
  return category.value?.breathingDuration ?? 4
})

// 图标名称映射
const iconNameMap: Record<string, string> = {
  'restaurant': 'shop-o',
  'study': 'notes-o',
  'beauty': 'fire-o',
  'food': 'shop-o',
  'education': 'notes-o',
  'school': 'notes-o',
}

const getValidIconName = (iconName: string): string => {
  if (!iconName) return 'shop-o'
  if (iconNameMap[iconName]) {
    return iconNameMap[iconName]
  }
  return iconName
}

// 检查是否是渐变背景色
const isGradientBackground = computed(() => {
  if (!category.value?.titleColor) return false
  const color = category.value.titleColor
  return color.includes('linear-gradient') || color.includes('radial-gradient')
})

// 获取section-header背景样式
const getSectionHeaderStyle = () => {
  if (!category.value?.titleColor) {
    return {}
  }
  
  const color = category.value.titleColor
  
  if (isGradientBackground.value) {
    return {
      background: color,
    }
  }
  
  if (color.startsWith('rgba')) {
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (rgbaMatch) {
      const r = rgbaMatch[1]
      const g = rgbaMatch[2]
      const b = rgbaMatch[3]
      return {
        background: `rgba(${r}, ${g}, ${b}, 0.7)`,
      }
    }
  }
  
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return {
      background: `rgba(${r}, ${g}, ${b}, 0.7)`,
    }
  }
  
  if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const r = rgbMatch[1]
      const g = rgbMatch[2]
      const b = rgbMatch[3]
      return {
        background: `rgba(${r}, ${g}, ${b}, 0.7)`,
      }
    }
  }
  
  return {
    background: 'rgba(255, 255, 255, 0.7)',
  }
}

// 获取图片URL
const getImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/api/')) {
    return url
  }
  if (url.startsWith('/')) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${baseURL}${url}`
  }
  return url
}

// Banner轮播控制
const goToBanner = (index: number) => {
  if (index < 0 || index >= validBanners.value.length) return
  currentBannerIndex.value = index
  resetAutoPlay()
}

const nextBanner = () => {
  if (validBanners.value.length === 0) return
  currentBannerIndex.value = (currentBannerIndex.value + 1) % validBanners.value.length
}

const startAutoPlay = () => {
  if (validBanners.value.length <= 1) return
  stopAutoPlay()
  autoPlayTimer.value = window.setInterval(() => {
    nextBanner()
  }, 3000)
}

const stopAutoPlay = () => {
  if (autoPlayTimer.value !== null) {
    clearInterval(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

const resetAutoPlay = () => {
  stopAutoPlay()
  startAutoPlay()
}

const handleTouchStart = (e: TouchEvent) => {
  if (validBanners.value.length <= 1) return
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  isSwiping.value = false
  stopAutoPlay()
}

const handleTouchMove = (e: TouchEvent) => {
  if (validBanners.value.length <= 1) return
  const touch = e.touches[0]
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value
  
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
    isSwiping.value = true
  }
}

const handleTouchEnd = () => {
  if (validBanners.value.length <= 1 || !isSwiping.value) {
    startAutoPlay()
    return
  }
  
  const deltaX = touchEndX.value - touchStartX.value
  if (Math.abs(deltaX) > 50) {
    if (deltaX > 0) {
      // 向右滑动，显示上一个
      if (currentBannerIndex.value === 0) {
        currentBannerIndex.value = validBanners.value.length - 1
      } else {
        currentBannerIndex.value--
      }
    } else {
      // 向左滑动，显示下一个
      nextBanner()
    }
  }
  
  resetAutoPlay()
  isSwiping.value = false
}

// 处理Banner点击
const handleBannerClick = (banner: NavigationCategoryBanner) => {
  if (!banner.linkUrl) return

  if (banner.linkUrl.startsWith('http://') || banner.linkUrl.startsWith('https://')) {
    window.open(banner.linkUrl, '_blank')
  } else {
    router.push(banner.linkUrl)
  }
}

// 获取促销图片
const getPromotionImage = (promotion: any): string | undefined => {
  if (!promotion.images) return undefined

  if (Array.isArray(promotion.images) && promotion.images.length > 0) {
    const first = promotion.images[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object' && 'url' in first) return first.url as string
  }

  if (typeof promotion.images === 'object' && promotion.images !== null) {
    if ('url' in promotion.images) return promotion.images.url as string
  }

  return undefined
}

// 获取商户位置信息
const getMerchantLocation = (promotion: any): string | undefined => {
  if (promotion.merchant?.location) return promotion.merchant.location
  if (promotion.merchant?.address) return promotion.merchant.address
  if (promotion.merchantName) return promotion.merchantName
  return undefined
}

// 获取剩余数量
const getLeftQuantity = (promotion: any): number | undefined => {
  if (promotion.promotionQuantity !== undefined && promotion.soldQuantity !== undefined) {
    return Math.max(0, promotion.promotionQuantity - promotion.soldQuantity)
  }
  return undefined
}

// 格式化价格
const formatPrice = (price: number | undefined | null): string => {
  if (price === null || price === undefined || (typeof price !== 'number') || isNaN(price)) {
    return formatMoney(0)
  }
  return formatMoney(price)
}

// 处理促销点击
const handlePromotionClick = (promotion: any) => {
  const promotionId = promotion.id || promotion.promotionId
  if (promotionId) {
    router.push(`/promotion/${promotionId}`)
  }
}

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 加载分类信息
const loadCategory = async () => {
  const navigationCategoryId = route.query.navigationCategoryId as string
  const categoryId = route.query.categoryId as string

  if (navigationCategoryId) {
    try {
      const cat = await promotionService.getNavigationCategoryById(navigationCategoryId)
      if (cat) {
        category.value = cat
      } else {
        showToast('分类不存在')
      }
    } catch (error) {
      console.error('加载分类信息失败:', error)
    }
  } else if (categoryId) {
    // TODO: 如果使用 categoryId，需要从 CategoryService 获取分类信息
    // 暂时只显示促销列表
  }
}

// 加载促销列表
const loadPromotions = async (reset = false) => {
  if (reset) {
    page.value = 1
    promotions.value = []
    hasMore.value = true
  }

  if (loading.value || !hasMore.value) return

  loading.value = true

  try {
    const navigationCategoryId = route.query.navigationCategoryId as string
    const categoryId = route.query.categoryId as string

    let result
    if (navigationCategoryId) {
      result = await promotionService.getPromotionsByNavigationCategory(navigationCategoryId, {
        page: page.value,
        limit: pageSize.value,
      })
    } else if (categoryId) {
      result = await promotionService.getPromotions({
        categoryId,
        page: page.value,
        limit: pageSize.value,
      })
    } else {
      showToast('缺少分类参数')
      return
    }

    if (reset) {
      promotions.value = result.data || []
    } else {
      promotions.value.push(...(result.data || []))
    }

    hasMore.value = page.value < (result.pagination?.totalPages || 0)
  } catch (error: any) {
    console.error('加载促销列表失败:', error)
    showToast(error.message || '加载促销列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 滚动加载更多
const onScroll = () => {
  const scrollHeight = document.documentElement.scrollHeight
  const scrollTop = document.documentElement.scrollTop
  const clientHeight = document.documentElement.clientHeight

  if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore.value && !loading.value) {
    page.value++
    loadPromotions()
  }
}

// 监听路由参数变化
watch(
  () => [route.query.navigationCategoryId, route.query.categoryId],
  () => {
    loadCategory()
    loadPromotions(true)
  },
  { immediate: false }
)

// 初始化
onMounted(() => {
  loadCategory()
  loadPromotions(true)
  
  if (validBanners.value.length > 1) {
    startAutoPlay()
  }
  
  window.addEventListener('scroll', onScroll)
})

onBeforeUnmount(() => {
  stopAutoPlay()
  window.removeEventListener('scroll', onScroll)
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.promotions-page {
  min-height: 100vh;
  background: var(--theme-bg-gradient, $glass-bg-gradient);
  background-attachment: fixed;
  background-size: cover;
  padding-bottom: 80px;

  // 导航栏样式
  :deep(.van-nav-bar) {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    .van-nav-bar__title {
      color: $text-color-primary;
      font-weight: 600;
    }
    
    .van-nav-bar__arrow {
      color: $text-color-primary;
    }
  }
}

.category-header {
  position: relative;
  margin: 16px 12px;
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  &.has-gradient {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      z-index: 0;
      pointer-events: none;
    }
  }
  
  .title-wrapper {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: $text-color-primary;
    }
  }
  
  .category-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    @include glassmorphism-card(light);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .category-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    
    .category-icon {
      font-size: 20px;
      color: var(--primary-color, $primary);
    }
  }
}

.banner-area {
  margin: 0 12px 16px;
  
  .banner-carousel {
    position: relative;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    @include glassmorphism-card(base);
    
    .category-banner {
      width: 100%;
      position: relative;
      
      &.clickable {
        cursor: pointer;
      }
      
      .banner-image-breathing {
        width: 100%;
        height: auto;
        display: block;
        animation: breathing 4s ease-in-out infinite;
      }
    }
  }
  
  .banner-indicators {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
    
    .indicator-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.2);
      cursor: pointer;
      transition: all 0.3s ease;
      
      &.active {
        background: var(--primary-color, $primary);
        width: 20px;
        border-radius: 3px;
      }
    }
  }
}

.promotions-container {
  padding: 0 12px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.promotions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.promotion-card {
  @include glassmorphism-card(base);
  border-radius: var(--van-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--van-transition-duration);

  &:active {
    transform: scale(0.98);
  }

  .promotion-image {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;

    .promo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .promotion-info {
    padding: 12px;

    .promotion-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--van-text-color);
      margin: 0 0 4px 0;
      line-height: 1.4;
      height: 40px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .promotion-desc {
      font-size: 12px;
      color: var(--van-text-color-3);
      margin: 0 0 8px 0;
      height: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .promotion-price {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;

      .price-symbol {
        color: var(--van-danger-color);
        font-size: 12px;
      }

      .price-value {
        color: var(--van-danger-color);
        font-size: 18px;
        font-weight: 600;
      }

      .price-original {
        color: var(--van-text-color-3);
        font-size: 12px;
        text-decoration: line-through;
      }
    }

    .promotion-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .left-quantity {
        font-size: 11px;
        color: var(--van-text-color-3);
      }
    }
  }
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  color: var(--van-text-color-3);
}

@keyframes breathing {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

