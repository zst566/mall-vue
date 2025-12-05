<template>
  <div class="promotion-detail-page">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="promotionData?.name || '促销活动详情'"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
      z-index="100"
      class="detail-nav-bar"
    />

    <!-- Banner 主图 -->
    <PromotionBanner :images="imagesRef" />

    <!-- 促销活动基本信息 -->
    <PromotionInfo
      v-if="promotionData"
      :promotion="promotionData"
      :selected-variant="selectedVariant"
      :variants="variants"
      :tags="tags"
      :is-activity-active="isActivityActiveValue"
      :left-quantity="leftQuantity"
      :is-mall-subsidy="isMallSubsidy"
      :final-amount="finalAmount"
      :sale-price="salePrice"
      :original-price="originalPrice"
      :format-price="formatPrice"
      @update:selected-variant="selectedVariant = $event"
      @tag-click="handleTagClick"
    />

    <!-- 详情图片 -->
    <PromotionDetailImages :images="detailImages" />

    <!-- 底部操作栏 -->
    <PromotionBottomBar
      :is-favorite="isFavorite"
      :can-purchase="canPurchase"
      :purchase-button-text="purchaseButtonText"
      :is-visible="isBottomBarVisible"
      :bottom-bar-style="bottomBarStyle"
      @home="goToHome"
      @favorite="toggleFavorite"
      @service="contactService"
      @purchase="handlePurchase"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import PromotionBanner from '@/components/customer/PromotionBanner.vue'
import PromotionInfo from '@/components/customer/PromotionInfo.vue'
import PromotionDetailImages from '@/components/customer/PromotionDetailImages.vue'
import PromotionBottomBar from '@/components/customer/PromotionBottomBar.vue'
import { usePromotionDetail } from '@/composables/usePromotionDetail'
import { usePromotionPurchase } from '@/composables/usePromotionPurchase'
import { usePromotionFavorite } from '@/composables/usePromotionFavorite'
import { usePromotionImages } from '@/composables/usePromotionImages'
import { usePromotionPrice } from '@/composables/usePromotionPrice'
import { usePromotionTags } from '@/composables/usePromotionTags'
import { useBottomBarScroll } from '@/composables/useBottomBarScroll'
import { isActivityActive } from '@/utils/promotionHelpers'
import webViewBridge from '@/utils/webview-bridge'

const router = useRouter()
const route = useRoute()
const promotionId = route.params.id as string

// 数据加载
const {
  promotion,
  loading,
  variants,
  selectedVariant,
  tags,
  loadPromotionDetail
} = usePromotionDetail(promotionId)

// 使用 computed 包装 promotion.value，确保响应式传递
// 这样可以避免在数据加载过程中组件被销毁和重新创建
const promotionData = computed(() => promotion.value)

// 图片处理 - 直接使用 promotion.value.images 确保响应式更新
const imagesRef = computed(() => promotion?.value?.images)
const { mainImages, detailImages } = usePromotionImages(imagesRef)

// 价格计算
const { isMallSubsidy, finalAmount, salePrice, originalPrice, leftQuantity, formatPrice } = usePromotionPrice({
  promotion,
  selectedVariant,
})

// 标签管理
const tagsRef = computed(() => tags.value)
const { showTagDescription, handleDocumentClick } = usePromotionTags(tagsRef)

// 收藏管理
const { isFavorite, toggleFavorite, initFavoriteStatus } = usePromotionFavorite(promotionId)

// 购买逻辑
const leftQuantityRef = computed(() => leftQuantity.value)
const { canPurchase, purchaseButtonText, handlePurchase } = usePromotionPurchase({
  promotionId,
  promotion,
  selectedVariant,
  variants,
  leftQuantity: leftQuantityRef,
})

// 底部栏滚动控制
const { isBottomBarVisible, bottomBarStyle } = useBottomBarScroll()

// 活动状态
const isActivityActiveValue = computed(() => {
  if (!promotionData.value) {
    return false
  }
  return isActivityActive(promotionData.value.startTime, promotionData.value.endTime)
})

// 标签点击处理
const handleTagClick = (tagId: string) => {
  showTagDescription(tagId)
}

// 支付结果处理
const handlePaymentResult = (result: any) => {
  if (result?.success) {
    loadPromotionDetail()
    showToast('支付成功！')
  }
}

// 页面激活刷新
let lastRefreshTime = 0
const REFRESH_INTERVAL = 2000 // 2秒内不重复刷新
const handlePageActivated = () => {
  const now = Date.now()
  // 避免过于频繁的刷新
  if (now - lastRefreshTime < REFRESH_INTERVAL) {
    return
  }
  // 只有在数据不存在时才刷新，避免覆盖已有数据
  if (!promotion.value) {
    lastRefreshTime = now
    loadPromotionDetail()
  } else {
    // 数据已存在，跳过刷新
  }
}

// 页面激活事件处理器
let handleVisibilityChange: (() => void) | null = null
let handlePageShow: ((event: PageTransitionEvent) => void) | null = null

// 返回首页
const goToHome = () => {
  router.push({ name: 'Home' })
}

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 联系客服
const contactService = () => {
  showToast('正在跳转到客服聊天...')
}

// 生命周期
onMounted(() => {
  loadPromotionDetail()
  
  // 监听支付结果消息
  webViewBridge.on('paymentResult', handlePaymentResult)
  
  // 监听页面点击事件，点击外部时关闭提示框
  document.addEventListener('click', handleDocumentClick, true)
  
  // 监听页面激活事件（从其他页面返回时）
  // 使用 visibilitychange 事件检测页面是否可见
  handleVisibilityChange = () => {
    if (!document.hidden) {
      // 页面变为可见时，刷新数据
      handlePageActivated()
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 使用 pageshow 事件检测页面显示（包括从缓存恢复）
  handlePageShow = (event: PageTransitionEvent) => {
    // 如果是从缓存恢复的页面，刷新数据
    if (event.persisted) {
      handlePageActivated()
    }
  }
  window.addEventListener('pageshow', handlePageShow)
})

onUnmounted(() => {
  // 移除支付结果监听
  webViewBridge.off('paymentResult', handlePaymentResult)
  
  // 移除页面点击监听
  document.removeEventListener('click', handleDocumentClick, true)
  
  // 移除页面激活监听
  if (handleVisibilityChange) {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
  if (handlePageShow) {
    window.removeEventListener('pageshow', handlePageShow)
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.promotion-detail-page {
  min-height: 100vh;
  padding-bottom: 80px; // 为底部操作栏留出空间
  background: var(--theme-bg-gradient, $glass-bg-gradient);
  background-attachment: fixed;
  background-size: cover;

  // 导航栏样式 - 透明背景与 banner 融合
  :deep(.detail-nav-bar) {
    background: transparent;
    
    .van-nav-bar__content {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    
    .van-nav-bar__title {
      color: white;
      font-weight: 600;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    
    .van-nav-bar__arrow {
      color: white;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
