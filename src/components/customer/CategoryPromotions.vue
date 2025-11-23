<template>
  <section class="category-promotions" v-if="promotions.length > 0">
    <div class="section-header" :style="getSectionHeaderStyle()">
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
        <h3>{{ category.displayName }}</h3>
      </div>
      <span class="more" @click="handleViewAll">
        <span class="more-text">
          <span class="wave-char" v-for="(char, index) in '查看全部'" :key="index" :style="{ animationDelay: `${index * 0.1}s` }">{{ char }}</span>
        </span>
        <span class="more-arrow">→</span>
      </span>
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
              :alt="category.displayName"
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

    <div 
      class="promotion-container"
      :class="{ 'promotion-vertical': category.layout === 'vertical', 'promotion-horizontal': category.layout !== 'vertical' }"
    >
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
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import type { NavigationCategoryConfig, NavigationCategoryBanner } from '@/types/homepage'
import { formatMoney } from '@/utils/format'

interface Props {
  category: NavigationCategoryConfig
  promotions: any[]
}

const props = defineProps<Props>()
const router = useRouter()

// 图标名称映射：将不存在的图标名称映射到存在的图标
const iconNameMap: Record<string, string> = {
  'restaurant': 'shop-o',      // 餐饮 -> 商店图标
  'study': 'notes-o',          // 教育 -> 笔记图标
  'beauty': 'fire-o',          // 美容 -> 火焰图标
  'food': 'shop-o',            // 食物 -> 商店图标
  'education': 'notes-o',      // 教育 -> 笔记图标
  'school': 'notes-o',         // 学校 -> 笔记图标
}

// 获取有效的图标名称
const getValidIconName = (iconName: string): string => {
  if (!iconName) return 'shop-o' // 默认图标
  // 如果图标名称在映射表中，使用映射后的名称
  if (iconNameMap[iconName]) {
    return iconNameMap[iconName]
  }
  // 否则直接使用原名称（如果存在的话）
  return iconName
}

// 过滤有效的banner
const validBanners = computed(() => {
  if (!props.category.banners || props.category.banners.length === 0) {
    return []
  }

  const now = new Date()
  return props.category.banners.filter((banner: NavigationCategoryBanner) => {
    // 如果没有设置时间范围，则始终有效
    if (!banner.startTime && !banner.endTime) return true
    
    const startTime = banner.startTime ? new Date(banner.startTime) : null
    const endTime = banner.endTime ? new Date(banner.endTime) : null
    
    // 检查当前时间是否在有效范围内
    if (startTime && now < startTime) return false
    if (endTime && now > endTime) return false
    
    return true
  }).sort((a, b) => a.sortOrder - b.sortOrder)
})

// 轮播状态管理
const currentBannerIndex = ref(0)
const autoPlayTimer = ref<number | null>(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const isSwiping = ref(false)

// 当前显示的banner
const currentBanner = computed(() => {
  if (validBanners.value.length === 0) {
    return null
  }
  return validBanners.value[currentBannerIndex.value]
})

// 呼吸动画时长（从配置中获取，默认4秒）
const breathingDuration = computed(() => {
  return props.category.breathingDuration ?? 4
})

// 切换到指定banner
const goToBanner = (index: number) => {
  if (index < 0 || index >= validBanners.value.length) return
  currentBannerIndex.value = index
  resetAutoPlay()
}

// 切换到下一个banner
const nextBanner = () => {
  if (validBanners.value.length === 0) return
  currentBannerIndex.value = (currentBannerIndex.value + 1) % validBanners.value.length
}

// 切换到上一个banner
const prevBanner = () => {
  if (validBanners.value.length === 0) return
  currentBannerIndex.value =
    currentBannerIndex.value === 0
      ? validBanners.value.length - 1
      : currentBannerIndex.value - 1
}

// 启动自动轮播
const startAutoPlay = () => {
  if (validBanners.value.length <= 1) return
  stopAutoPlay()
  autoPlayTimer.value = window.setInterval(() => {
    nextBanner()
  }, 3000)
}

// 停止自动轮播
const stopAutoPlay = () => {
  if (autoPlayTimer.value !== null) {
    clearInterval(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

// 重置自动轮播
const resetAutoPlay = () => {
  stopAutoPlay()
  startAutoPlay()
}

// 触摸开始
const handleTouchStart = (e: TouchEvent) => {
  if (validBanners.value.length <= 1) return
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  isSwiping.value = false
  stopAutoPlay()
}

// 触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (validBanners.value.length <= 1) return
  const touch = e.touches[0]
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
  
  const deltaX = Math.abs(touchEndX.value - touchStartX.value)
  const deltaY = Math.abs(touchEndY.value - touchStartY.value)
  
  // 如果水平滑动距离大于垂直滑动距离，认为是滑动切换
  if (deltaX > deltaY && deltaX > 10) {
    isSwiping.value = true
    e.preventDefault() // 防止页面滚动
  }
}

// 触摸结束
const handleTouchEnd = () => {
  if (validBanners.value.length <= 1 || !isSwiping.value) {
    resetAutoPlay()
    return
  }
  
  const deltaX = touchEndX.value - touchStartX.value
  const threshold = 50 // 滑动阈值
  
  if (Math.abs(deltaX) > threshold) {
    if (deltaX > 0) {
      // 向右滑动，显示上一个
      prevBanner()
    } else {
      // 向左滑动，显示下一个
      nextBanner()
    }
  }
  
  isSwiping.value = false
  resetAutoPlay()
}

// 监听banner数量变化，重新初始化
watch(
  () => validBanners.value.length,
  (newLength) => {
    if (newLength > 0) {
      currentBannerIndex.value = 0
      if (newLength > 1) {
        startAutoPlay()
      } else {
        stopAutoPlay()
      }
    } else {
      stopAutoPlay()
    }
  },
  { immediate: true }
)

// 组件挂载时启动自动轮播
onMounted(() => {
  if (validBanners.value.length > 1) {
    startAutoPlay()
  }
})

// 组件销毁时清理定时器
onBeforeUnmount(() => {
  stopAutoPlay()
})

// 获取section-header背景样式
const getSectionHeaderStyle = () => {
  if (!props.category.titleColor) {
    return {}
  }
  return {
    background: props.category.titleColor,
  }
}

// 获取图片URL
const getImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 如果URL已经包含/api，直接返回
  if (url.startsWith('/api/')) {
    return url
  }
  // 如果URL以/开头但不是/api，需要加上baseURL
  if (url.startsWith('/')) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${baseURL}${url}`
  }
  return url
}

// 处理Banner点击
const handleBannerClick = (banner: NavigationCategoryBanner) => {
  if (!banner.linkUrl) return

  if (banner.linkUrl.startsWith('http://') || banner.linkUrl.startsWith('https://')) {
    // 外部链接，新窗口打开
    window.open(banner.linkUrl, '_blank')
  } else {
    // 内部链接
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

// 格式化价格
const formatPrice = (price: number | undefined): string => {
  if (!price && price !== 0) return '0'
  return formatMoney(price)
}

// 处理促销点击
const handlePromotionClick = (promotion: any) => {
  const promotionId = promotion.id || promotion.promotionId
  if (promotionId) {
    router.push(`/promotion/${promotionId}`)
  }
}

// 处理查看全部
const handleViewAll = () => {
  router.push(`/promotions?navigationCategoryId=${props.category.id}`)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.category-promotions {
  margin: 24px 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 12px;

  .title-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-height: 24px; // 确保有足够的高度来垂直居中
  }

  .category-icon-wrapper {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .category-thumbnail {
    width: 24px;
    height: 24px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
  }

  .category-icon {
    font-size: 24px;
    color: $primary;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  h3 {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-color-primary;
    margin: 0;
    padding: 0;
    letter-spacing: -0.5px;
    line-height: 1.2;
    display: flex;
    align-items: center;
    height: auto;
  }

  .more {
    font-size: $font-size-sm;
    color: $primary;
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 12px;

    .more-text {
      display: inline-block;
    }

    .wave-char {
      display: inline-block;
      animation: wave 1.8s ease-in-out infinite;
    }

    .more-arrow {
      font-size: $font-size-lg;
      display: inline-block;
    }

    &:active {
      opacity: 0.8;
    }
  }
}

// 波浪动画：文字逐个跳动
@keyframes wave {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-4px);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-2px);
  }
}

.banner-area {
  margin: 12px 0 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.banner-carousel {
  position: relative;
  width: 100%;
  height: 60px;
  overflow: hidden;
  border-radius: 8px;
}

.category-banner {
  width: 100%;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;
  position: relative;

  &.clickable {
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:active {
      opacity: 0.8;
    }
  }

  .banner-image-breathing {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    will-change: transform;
    animation: breathing ease-in-out infinite;
    // animation-duration 通过内联样式动态设置
  }
}

// 淡入淡出过渡效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 呼吸缩放动画
@keyframes breathing {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

// 指示器样式
.banner-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 0;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &.active {
    width: 20px;
    height: 6px;
    border-radius: 3px;
    background: $primary;
  }

  &:active {
    transform: scale(0.9);
  }
}

.promotion-container {
  &.promotion-horizontal {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding: 0 4px 4px 0;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */

    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
  }

  &.promotion-vertical {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 0;
  }
}

.promotion-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;

  // 水平布局时的样式
  .promotion-horizontal & {
    flex: 0 0 auto;
    width: 160px;
  }

  // 纵向布局时的样式
  .promotion-vertical & {
    width: 100%;
    flex-direction: row;
    gap: 12px;
    padding: 12px;

    .promotion-image {
      width: 120px;
      height: 120px;
      flex-shrink: 0;
      aspect-ratio: 1;
    }

    .promotion-info {
      flex: 1;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &:hover {
    box-shadow: $shadow-base;
  }
}

.promotion-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f5f5f5;

  .promo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.promotion-info {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.promotion-title {
  font-size: $font-size-base;
  font-weight: 700;
  color: $text-color-primary;
  margin: 0 0 4px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promotion-desc {
  font-size: $font-size-xs;
  font-weight: 400;
  color: $text-color-tertiary;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promotion-price {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price-symbol {
  font-size: $font-size-sm;
  font-weight: 700;
  color: $primary;
}

.price-value {
  font-size: $font-size-lg;
  font-weight: 800;
  color: $primary;
}

.price-original {
  font-size: $font-size-xs;
  color: #999;
  text-decoration: line-through;
}

@media (max-width: 768px) {
  .category-promotions {
    margin: 20px 8px;
  }

  .section-header {
    padding: 0 0 10px;

    h3 {
      font-size: $font-size-lg;
    }
  }

  .promotion-card {
    .promotion-horizontal & {
      width: 140px;
    }

    .promotion-vertical & {
      flex-direction: column;
      padding: 12px;

      .promotion-image {
        width: 100%;
        height: auto;
        aspect-ratio: 1;
      }

      .promotion-info {
        padding: 12px 0 0 0;
      }
    }
  }

  .promotion-info {
    padding: 10px;
  }

  .promotion-title {
    font-size: $font-size-sm;
  }
}

@media (prefers-color-scheme: dark) {
  .promotion-card {
    background: #1e1e1e;
  }

  .promotion-image {
    background: #2a2a2a;
  }

  .section-header h3 {
    color: #e0e0e0;
  }

  .promotion-title {
    color: #e0e0e0;
  }

  .promotion-desc {
    color: #a0a0a0;
  }
}
</style>

