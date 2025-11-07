<template>
  <div class="promotion-detail-page">
    <!-- 顶部Banner主图 -->
    <div class="banner-section">
      <van-swipe 
        v-if="mainImages && mainImages.length > 0" 
        :autoplay="3000" 
        indicator-color="white"
        class="banner-swipe"
      >
        <van-swipe-item v-for="(image, index) in mainImages" :key="index">
          <img 
            :src="getImageUrl(image)" 
            :alt="`促销活动主图 ${index + 1}`"
            class="banner-image"
            @error="handleImageError"
          />
        </van-swipe-item>
      </van-swipe>
      <PlaceholderImage 
        v-else 
        width="100%" 
        height="400px" 
        class="banner-placeholder"
      />
    </div>

    <!-- 促销活动基本信息 -->
    <div class="promotion-info">
      <div class="price-section">
        <div class="current-price">
          <span class="price-symbol">¥</span>
          <span class="price-value">{{ formatPrice(promotion.salePrice) }}</span>
        </div>
        <div class="original-price" v-if="promotion.originalPrice && promotion.originalPrice > promotion.salePrice">
          <span class="original-symbol">¥</span>
          <span class="original-value">{{ formatPrice(promotion.originalPrice) }}</span>
          <span class="discount-text">省¥{{ formatPrice(promotion.originalPrice - promotion.salePrice) }}</span>
        </div>
      </div>

      <h2 class="promotion-name">{{ promotion.name }}</h2>
      <p class="promotion-desc" v-if="promotion.description">{{ promotion.description }}</p>

      <div class="promotion-meta">
        <div class="meta-item">
          <span class="meta-label">剩余数量</span>
          <span class="meta-value">{{ leftQuantity }} 件</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">已售数量</span>
          <span class="meta-value">{{ promotion.soldQuantity || 0 }} 件</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">活动时间</span>
          <span class="meta-value">{{ formatDateRange(promotion.startTime, promotion.endTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 促销活动详情图片 -->
    <div class="detail-section" v-if="detailImages && detailImages.length > 0">
      <div class="section-header">
        <h3>活动详情</h3>
      </div>
      <div class="detail-content">
        <div class="detail-images">
          <div 
            v-for="(image, index) in detailImages" 
            :key="image.id || index"
            class="detail-image-item"
          >
            <img 
              :src="getImageUrl(image)" 
              :alt="`活动详情图片 ${index + 1}`"
              class="detail-image"
              @error="handleImageError"
              :loading="index === 0 ? 'eager' : 'lazy'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar" :class="{ 'hidden': !isBottomBarVisible }">
      <div class="left-buttons">
        <div class="action-item" @click="goToHome">
          <van-icon name="home-o" />
          <span>首页</span>
        </div>
        <div class="action-item" @click="toggleFavorite">
          <van-icon :name="isFavorite ? 'star' : 'star-o'" :class="{ active: isFavorite }" />
          <span>收藏</span>
        </div>
        <div class="action-item" @click="contactService">
          <van-icon name="service-o" />
          <span>客服</span>
        </div>
      </div>
      <div class="right-buttons">
        <van-button 
          type="danger" 
          size="large" 
          @click="handlePurchase"
          :disabled="leftQuantity <= 0"
        >
          {{ leftQuantity > 0 ? '立即购买' : '已售罄' }}
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'
  import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
  import { api } from '@/services/api'

  const router = useRouter()
  const route = useRoute()

  // 收藏状态
  const isFavorite = ref(false)

  // 底部导航显示/隐藏状态
  const isBottomBarVisible = ref(true)
  const lastScrollTop = ref(0)
  const scrollTimer = ref<number | null>(null)

  // 促销活动信息
  const promotionId = route.params.id as string
  const loading = ref(false)
  const promotion = reactive({
    id: promotionId,
    name: '',
    description: '',
    salePrice: 0,
    originalPrice: 0,
    promotionQuantity: 0,
    soldQuantity: 0,
    startTime: '',
    endTime: '',
    images: null as any
  })

  // 主图列表（用于顶部banner）- 只显示主图，如无主图标记则显示第1张图
  const mainImages = computed(() => {
    if (!promotion.images) return []
    
    // 处理图片数据，支持多种格式
    let images: any[] = []
    
    if (Array.isArray(promotion.images)) {
      images = promotion.images
    } else if (typeof promotion.images === 'object' && promotion.images !== null) {
      // 如果是对象，尝试提取url
      if ('url' in promotion.images) {
        images = [promotion.images]
      }
    }
    
    if (images.length === 0) return []
    
    // 获取主图（isMain为true的图片）
    const mainImage = images.find((img: any) => {
      if (typeof img === 'string') return false
      return img.isMain === true
    })
    
    // 如果有主图，返回主图；否则返回第1张图
    return mainImage ? [mainImage] : [images[0]]
  })

  // 详情图片列表（显示所有图片，按排序逐个显示）
  const detailImages = computed(() => {
    if (!promotion.images) return []
    
    let images: any[] = []
    
    if (Array.isArray(promotion.images)) {
      images = promotion.images
    } else if (typeof promotion.images === 'object' && promotion.images !== null) {
      if ('url' in promotion.images) {
        images = [promotion.images]
      }
    }
    
    if (images.length === 0) return []
    
    // 处理图片数据，统一格式并提取排序字段
    const processedImages = images.map((img: any, index: number) => {
      if (typeof img === 'string') {
        return {
          url: img,
          position: index,
          id: '',
          isMain: false
        }
      }
      return {
        url: img.url || img.src || '',
        position: img.position ?? img.sortOrder ?? index,
        id: img.id || img.key || '',
        isMain: img.isMain === true,
        ...img // 保留其他字段
      }
    })
    
    // 按position/sortOrder排序，如果相同则保持原顺序
    return processedImages.sort((a: any, b: any) => {
      return (a.position ?? 0) - (b.position ?? 0)
    })
  })

  // 剩余数量
  const leftQuantity = computed(() => {
    return Math.max(0, (promotion.promotionQuantity || 0) - (promotion.soldQuantity || 0))
  })

  // 获取图片URL
  const getImageUrl = (image: any): string => {
    if (typeof image === 'string') {
      return image
    }
    if (image && typeof image === 'object') {
      return image.url || image.src || ''
    }
    return ''
  }

  // 格式化价格（从分转换为元，统一使用与首页相同的处理标准）
  const formatPrice = (price: number): string => {
    if (!price && price !== 0) return '0.00'
    // 后端返回的价格始终以分为单位，需要除以100转换为元
    const priceInYuan = Math.round(price) / 100
    return priceInYuan.toFixed(2)
  }

  // 格式化日期范围
  const formatDateRange = (start: string, end: string): string => {
    if (!start || !end) return ''
    const startDate = new Date(start)
    const endDate = new Date(end)
    const formatDate = (date: Date) => {
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${month}-${day}`
    }
    return `${formatDate(startDate)} 至 ${formatDate(endDate)}`
  }

  // 图片加载错误处理
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    img.src = '/placeholder-product.png'
  }

  // 返回首页
  const goToHome = () => {
    router.push({ name: 'Home' })
  }

  // 切换收藏
  const toggleFavorite = () => {
    isFavorite.value = !isFavorite.value
    showToast(isFavorite.value ? '已添加到收藏' : '已取消收藏')
  }

  // 联系客服
  const contactService = () => {
    showToast('正在跳转到客服聊天...')
  }

  // 立即购买
  const handlePurchase = () => {
    if (leftQuantity.value <= 0) {
      showToast('该促销活动已售罄')
      return
    }
    showToast('正在跳转到购买页面...')
    // TODO: 跳转到购买页面
  }

  // 加载促销活动详情
  const loadPromotionDetail = async () => {
    loading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })

    try {
      const data = await api.get(`/promotions/${promotionId}`)
      
      Object.assign(promotion, {
        id: data.id,
        name: data.name,
        description: data.description || '',
        salePrice: data.salePrice || 0,
        originalPrice: data.originalPrice || 0,
        promotionQuantity: data.promotionQuantity || 0,
        soldQuantity: data.soldQuantity || 0,
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        images: data.images || null
      })
    } catch (error: any) {
      console.error('加载促销活动详情失败:', error)
      showToast(error.message || '加载促销活动详情失败，请稍后重试')
      
      setTimeout(() => {
        router.back()
      }, 1500)
    } finally {
      loading.value = false
      closeToast()
    }
  }

  // 处理滚动事件
  const handleScroll = (event?: Event) => {
    // 获取滚动位置（优先使用.app-main容器，如果没有则使用window）
    const appMain = document.querySelector('.app-main') as HTMLElement
    const currentScrollTop = appMain 
      ? appMain.scrollTop
      : (window.pageYOffset || document.documentElement.scrollTop)
    
    // 向下滚动时隐藏底部导航（需要滚动超过50px才隐藏）
    if (currentScrollTop > lastScrollTop.value && currentScrollTop > 50) {
      isBottomBarVisible.value = false
    } else if (currentScrollTop < lastScrollTop.value) {
      // 向上滚动时立即显示底部导航
      isBottomBarVisible.value = true
    }
    
    lastScrollTop.value = currentScrollTop
    
    // 清除之前的定时器
    if (scrollTimer.value !== null) {
      clearTimeout(scrollTimer.value)
    }
    
    // 停止滚动1秒后显示底部导航
    scrollTimer.value = window.setTimeout(() => {
      isBottomBarVisible.value = true
      scrollTimer.value = null
    }, 1000)
  }

  // 初始化
  onMounted(() => {
    loadPromotionDetail()
    
    // 等待DOM渲染完成后添加滚动监听
    setTimeout(() => {
      // 优先监听.app-main容器（这是实际的滚动容器）
      const appMain = document.querySelector('.app-main') as HTMLElement
      if (appMain) {
        appMain.addEventListener('scroll', handleScroll, { passive: true })
      } else {
        // 如果没有.app-main，则监听window
        window.addEventListener('scroll', handleScroll, { passive: true })
      }
    }, 100)
  })

  // 清理
  onUnmounted(() => {
    // 移除滚动监听
    const appMain = document.querySelector('.app-main') as HTMLElement
    if (appMain) {
      appMain.removeEventListener('scroll', handleScroll)
    } else {
      window.removeEventListener('scroll', handleScroll)
    }
    
    // 清除定时器
    if (scrollTimer.value !== null) {
      clearTimeout(scrollTimer.value)
    }
  })
</script>

<style lang="scss" scoped>
  .promotion-detail-page {
    min-height: 100vh;
    padding-bottom: 80px; // 为底部操作栏留出空间
    background-color: #f5f5f5;
  }

  // 顶部Banner主图区域
  .banner-section {
    width: 100%;
    background-color: #fff;

    .banner-swipe {
      width: 100%;
    }

    .banner-image {
      width: 100%;
      height: auto;
      min-height: 300px;
      max-height: 500px;
      object-fit: contain; // 使用 contain 确保图片完整显示，不被裁剪
      display: block;
      background-color: #f5f5f5;
    }

    .banner-placeholder {
      width: 100%;
      height: 400px;
    }
  }

  // 促销活动基本信息
  .promotion-info {
    background-color: #fff;
    padding: 16px;
    margin-bottom: 12px;

    .price-section {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 12px;

      .current-price {
        display: flex;
        align-items: baseline;

        .price-symbol {
          font-size: 18px;
          font-weight: 600;
          color: var(--van-danger-color);
        }

        .price-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--van-danger-color);
        }
      }

      .original-price {
        display: flex;
        align-items: baseline;
        gap: 8px;

        .original-symbol {
          font-size: 14px;
          color: var(--van-text-color-3);
        }

        .original-value {
          font-size: 18px;
          color: var(--van-text-color-3);
          text-decoration: line-through;
        }

        .discount-text {
          font-size: 12px;
          color: var(--van-success-color);
          background-color: rgba(7, 193, 96, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
      }
    }

    .promotion-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--van-text-color);
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    .promotion-desc {
      font-size: 14px;
      color: var(--van-text-color-2);
      line-height: 1.6;
      margin: 0 0 16px 0;
    }

    .promotion-meta {
      display: flex;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--van-border-color);

      .meta-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .meta-label {
          font-size: 12px;
          color: var(--van-text-color-3);
        }

        .meta-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--van-text-color);
        }
      }
    }
  }

  // 详情区域
  .detail-section {
    background-color: #fff;
    margin-bottom: 12px;

    .section-header {
      padding: 16px;
      border-bottom: 1px solid var(--van-border-color);

      h3 {
        font-size: 18px;
        font-weight: 700;
        color: var(--van-text-color);
        margin: 0;
      }
    }

    .detail-content {
      padding: 16px;

      .detail-images {
        display: flex;
        flex-direction: column;
        gap: 0;

        .detail-image-item {
          width: 100%;
          border-radius: 8px;
          overflow: visible; // 改为 visible，不裁剪图片
          background-color: #f5f5f5;

          .detail-image {
            width: 100%;
            height: auto; // 使用 auto 保持原始宽高比
            min-height: 200px;
            object-fit: contain; // 使用 contain 确保图片完整显示，不被裁剪
            display: block;
            transition: opacity 0.3s ease;

            &[loading="lazy"] {
              opacity: 0;
              animation: fadeIn 0.3s ease forwards;
            }

            @keyframes fadeIn {
              to {
                opacity: 1;
              }
            }
          }
        }
      }
    }
  }

  // 底部操作栏
  .bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background-color: #fff;
    border-top: 1px solid var(--van-border-color);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
    gap: 12px;
    transition: transform 0.3s ease-in-out;
    transform: translateY(0);

    &.hidden {
      transform: translateY(100%);
    }

    .left-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 4px 8px;
        cursor: pointer;
        transition: opacity 0.2s;

        &:active {
          opacity: 0.6;
        }

        .van-icon {
          font-size: 20px;
          color: var(--van-text-color-2);

          &.active {
            color: var(--van-warning-color);
          }
        }

        span {
          font-size: 12px;
          color: var(--van-text-color-2);
        }
      }
    }

    .right-buttons {
      flex-shrink: 0;

      .van-button {
        min-width: 120px;
      }
    }
  }
</style>

