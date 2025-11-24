<template>
  <div class="promotion-detail-page">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="promotion.name || '促销活动详情'"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
      z-index="100"
      class="detail-nav-bar"
    />

    <!-- 顶部Banner主图 -->
    <div class="banner-section">
      <van-swipe 
        v-if="mainImages && mainImages.length > 0" 
        :autoplay="3000" 
        indicator-color="white"
        class="banner-swipe"
      >
        <van-swipe-item v-for="(image, index) in mainImages" :key="index">
          <div 
            class="banner-image"
            :style="{
              '--banner-image-url': `url(${getImageUrl(image)})`
            }"
          >
            <!-- 模糊背景层 -->
            <div class="banner-background-blur"></div>
            <!-- 主图片层 -->
            <div class="banner-image-main"></div>
          </div>
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
          <span class="price-value">{{ formatPrice(selectedVariant?.salePrice || promotion.salePrice) }}</span>
        </div>
        <div class="original-price" v-if="selectedVariant?.originalPrice && selectedVariant.originalPrice > selectedVariant.salePrice">
          <span class="original-symbol">¥</span>
          <span class="original-value">{{ formatPrice(selectedVariant.originalPrice) }}</span>
          <span class="discount-text">省¥{{ formatPrice(selectedVariant.originalPrice - selectedVariant.salePrice) }}</span>
        </div>
      </div>

      <h2 class="promotion-name">{{ promotion.name }}</h2>
      
      <!-- 服务特色标签（标题下方、价格上方） -->
      <div class="service-tags" v-if="tags && tags.length > 0">
        <van-popover
          v-for="tag in tags"
          :key="tag.id"
          v-model:show="tagPopoverVisible[tag.id]"
          :actions="[]"
          :placement="getPopoverPlacement(tag.id)"
          theme="dark"
          :offset="getPopoverOffset(tag.id)"
          :class="`tag-popover-${tag.id}`"
        >
          <template #reference>
            <span
              class="service-tag"
              :ref="el => setTagRef(tag.id, el)"
              @click.stop="showTagDescription(tag.id)"
            >
              {{ tag.name }}
            </span>
          </template>
          <div class="tag-popover-content" style="padding: 12px 16px;">
            <div class="tag-name">{{ tag.name }}</div>
            <div class="tag-description" v-if="tag.description">{{ tag.description }}</div>
            <div class="tag-description" v-else>暂无说明</div>
          </div>
        </van-popover>
      </div>

      <p class="promotion-desc" v-if="promotion.description">{{ promotion.description }}</p>

      <!-- 规格选择（多规格时显示） -->
      <VariantSelector
        v-if="variants.length > 1"
        :variants="variants"
        v-model="selectedVariant"
        :disabled="!isActivityActive"
      />

      <div class="promotion-meta">
        <div class="meta-item">
          <span class="meta-label">剩余数量</span>
          <span class="meta-value">{{ leftQuantity }} 件</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">已售数量</span>
          <span class="meta-value">{{ selectedVariant?.soldQuantity || promotion.soldQuantity || 0 }} 件</span>
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
    <div class="bottom-bar" :class="{ 'hidden': !isBottomBarVisible }" :style="bottomBarStyle">
      <div class="left-buttons">
        <div class="action-item" @click="goToHome">
          <van-icon name="home-o" />
          <span>首页</span>
        </div>
        <div class="action-item" @click="toggleFavorite">
          <van-icon :name="isFavorite ? 'star' : 'star-o'" class="favorite-icon" :class="{ active: isFavorite }" />
          <span>收藏</span>
        </div>
        <div class="action-item" @click="contactService">
          <van-icon name="service-o" />
          <span>客服</span>
        </div>
      </div>
      <div class="right-buttons">
        <van-button
          type="primary"
          size="large"
          @click.stop="handlePurchase"
          @touchstart.stop
          :disabled="!canPurchase"
          style="position: relative; z-index: 102; pointer-events: auto;"
        >
          {{ purchaseButtonText }}
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showLoadingToast, closeToast, showConfirmDialog, showDialog } from 'vant'
  import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
  import VariantSelector from '@/components/customer/VariantSelector.vue'
  import { api } from '@/services/api'
  import { orderService } from '@/services/orders'
  import { PointsService } from '@/services/points'
  import { favoriteService } from '@/services/favorites'
  import { useAuthStore } from '@/stores/auth'
  import webViewBridge from '@/utils/webview-bridge'
  import { formatMoney } from '@/utils/format'

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const pointsService = new PointsService()

  // 收藏状态
  const isFavorite = ref(false)
  const favoriteLoading = ref(false)

  // 底部导航显示/隐藏状态
  const isBottomBarVisible = ref(true)
  const lastScrollTop = ref(0)
  const scrollTimer = ref<number | null>(null)
  
  // 底部栏动态样式
  const bottomBarStyle = ref<Record<string, string>>({})
  
  // 将十六进制颜色转换为 rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  // 计算颜色的反色（用于创建强烈对比）
  const invertColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    
    // 计算主题色的相对亮度（用于判断是深色还是浅色）
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // 由于底部栏背景是主题色15%不透明度，背景相对较浅
    // 为了确保强烈对比，我们使用白色或接近白色的颜色
    // 如果主题色本身很亮（luminance > 0.7），则使用深色
    if (luminance > 0.7) {
      // 主题色很亮，使用深色反色
      const invertedR = Math.max(0, 255 - r - 50)
      const invertedG = Math.max(0, 255 - g - 50)
      const invertedB = Math.max(0, 255 - b - 50)
      return `rgb(${invertedR}, ${invertedG}, ${invertedB})`
    } else {
      // 主题色较暗，使用白色确保强烈对比
      return `rgb(255, 255, 255)`
    }
  }
  
  // 设置底部栏主题色渐变背景
  const setBottomBarTheme = () => {
    const root = document.documentElement
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim() || '#1989fa'
    
    // 使用主题色15%，整体不透明度95%
    // 计算最终颜色：主题色15%不透明度 × 整体95%不透明度 = 0.15 * 0.95 = 0.1425
    const finalAlpha = 0.15 * 0.95
    const themeColorWithOpacity = hexToRgba(primaryColor, finalAlpha)
    
    // 计算主题色反色，用于图标和文字
    const invertedColor = invertColor(primaryColor)
    
    const borderColor = hexToRgba(primaryColor, 0.25)      // 边框：主题色 25% 不透明度
    const shadowColor1 = hexToRgba(primaryColor, 0.15)    // 阴影1：主题色 15% 不透明度
    const shadowColor2 = hexToRgba(primaryColor, 0.1)     // 阴影2：主题色 10% 不透明度
    
    bottomBarStyle.value = {
      background: themeColorWithOpacity,  // 使用主题色15% × 整体95%不透明度
      '--inverted-theme-color': invertedColor,  // CSS 变量：反色
      borderTopColor: borderColor,
      boxShadow: `0 -4px 24px 0 ${shadowColor1}, 0 -2px 8px 0 ${shadowColor2}`
    }
  }

  // 服务特色标签
  const tags = ref<Array<{ id: string; name: string; description?: string | null }>>([])
  const tagPopoverVisible = ref<Record<string, boolean>>({})
  const tagRefs = ref<Record<string, HTMLElement | null>>({})
  const tagOffsets = ref<Record<string, [number, number]>>({})

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
    images: null as any,
    promotionMode: '' as 'mall_subsidy' | 'normal_split' | 'points_exchange' | '', // 分账模式
    settlementPrice: 0, // 结算价（积分兑换模式）
    pointsValue: 0, // 积分价值（积分兑换模式）
    variants: [] as any[], // 规格列表
  })

  // 规格选择
  const variants = computed(() => promotion.variants || [])
  const selectedVariant = ref<any>(null)

  // 设置标签引用
  const setTagRef = (tagId: string, el: Element | ComponentPublicInstance | null) => {
    if (el) {
      // 如果是组件实例，获取其 $el 属性；否则直接使用元素
      const htmlElement = (el as any).$el || el as HTMLElement
      tagRefs.value[tagId] = htmlElement
    }
  }

  // 存储每个标签的提示框位置
  const tagPlacements = ref<Record<string, 'top' | 'bottom'>>({})

  // 动态计算每个标签的偏移量，确保提示框在视口内
  const getPopoverOffset = (tagId: string): [number, number] => {
    const tagElement = tagRefs.value[tagId]
    if (!tagElement) {
      return [0, 8] // 默认偏移：水平0，垂直8px
    }

    const rect = tagElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const minLeftMargin = 10
    const minRightMargin = 10

    // 估算提示框宽度（与 CSS 中的 max-width 保持一致）
    const estimatedPopoverWidth = Math.min(280, viewportWidth - 20)

    let xOffset = 0

    // 计算提示框默认居中显示时的左右边界
    const popoverLeft = rect.left + rect.width / 2 - estimatedPopoverWidth / 2
    const popoverRight = rect.left + rect.width / 2 + estimatedPopoverWidth / 2

    // 检查左边界
    if (popoverLeft < minLeftMargin) {
      // 需要向右偏移
      xOffset = minLeftMargin - popoverLeft
    }
    // 检查右边界
    else if (popoverRight > viewportWidth - minRightMargin) {
      // 需要向左偏移
      xOffset = (viewportWidth - minRightMargin) - popoverRight
    }

    return [xOffset, 8]
  }

  // 根据标签在视口中的位置智能选择提示框位置
  const getPopoverPlacement = (tagId: string): 'top' | 'bottom' => {
    // 如果已经计算过位置，直接返回
    if (tagPlacements.value[tagId]) {
      return tagPlacements.value[tagId]
    }

    const tagElement = tagRefs.value[tagId]
    if (!tagElement) {
      // 默认下方，等待 DOM 更新后重新计算
      return 'bottom'
    }

    const rect = tagElement.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceTop = rect.top
    const spaceBottom = viewportHeight - rect.bottom

    // 估算提示框高度（包含内容、内边距和箭头），增加安全边距
    const estimatedPopoverHeight = 140
    const minTopMargin = 10
    const minBottomMargin = 10

    // 计算实际可用空间（减去安全边距）
    const availableSpaceTop = spaceTop - minTopMargin
    const availableSpaceBottom = spaceBottom - minBottomMargin

    // 优先选择空间更大的方向
    if (availableSpaceTop < estimatedPopoverHeight && availableSpaceBottom >= estimatedPopoverHeight) {
      // 上方空间不足，但下方有足够空间
      tagPlacements.value[tagId] = 'bottom'
      return 'bottom'
    } else if (availableSpaceBottom < estimatedPopoverHeight && availableSpaceTop >= estimatedPopoverHeight) {
      // 下方空间不足，但上方有足够空间
      tagPlacements.value[tagId] = 'top'
      return 'top'
    } else if (availableSpaceTop >= estimatedPopoverHeight && availableSpaceBottom >= estimatedPopoverHeight) {
      // 上下都有足够空间，优先选择下方
      tagPlacements.value[tagId] = 'bottom'
      return 'bottom'
    } else {
      // 上下空间都不足，选择空间更大的方向
      const placement: 'top' | 'bottom' = availableSpaceTop > availableSpaceBottom ? 'top' : 'bottom'
      tagPlacements.value[tagId] = placement
      return placement
    }
  }

  // 显示标签说明
  const showTagDescription = (tagId: string) => {
    // 直接切换显示状态（位置已通过 offset 和 placement 动态计算）
    tagPopoverVisible.value[tagId] = !tagPopoverVisible.value[tagId]
  }

  // 处理页面点击事件，点击外部时关闭所有提示框
  const handleDocumentClick = (event: MouseEvent) => {
    // 检查是否有打开的提示框
    const hasOpenPopover = Object.values(tagPopoverVisible.value).some(visible => visible)
    if (!hasOpenPopover) {
      return // 没有打开的提示框，不需要处理
    }
    
    const target = event.target as HTMLElement
    
    // 检查点击的目标是否在提示框内部或标签上
    const isClickInsidePopover = target.closest('.van-popover')
    const isClickOnTag = target.closest('.service-tag')
    
    // 如果点击在提示框外部且不在标签上，关闭所有提示框
    if (!isClickInsidePopover && !isClickOnTag) {
      // 关闭所有打开的提示框
      Object.keys(tagPopoverVisible.value).forEach(tagId => {
        if (tagPopoverVisible.value[tagId]) {
          tagPopoverVisible.value[tagId] = false
        }
      })
    }
  }

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

  // 剩余数量（使用选中规格的库存）
  const leftQuantity = computed(() => {
    if (selectedVariant.value) {
      return Math.max(0, (selectedVariant.value.promotionQuantity || 0) - (selectedVariant.value.soldQuantity || 0))
    }
    return Math.max(0, (promotion.promotionQuantity || 0) - (promotion.soldQuantity || 0))
  })

  // 判断活动是否处于有效期内
  const isActivityActive = computed(() => {
    if (!promotion.startTime || !promotion.endTime) return true
    const now = new Date().getTime()
    const startTime = new Date(promotion.startTime).getTime()
    const endTime = new Date(promotion.endTime).getTime()
    return now >= startTime && now <= endTime
  })

  // 判断是否可以购买
  const canPurchase = computed(() => {
    // 多规格时，必须选择规格
    if (variants.value.length > 1 && !selectedVariant.value) {
      return false
    }
    // 检查库存
    return leftQuantity.value > 0
  })

  // 购买按钮文字
  const purchaseButtonText = computed(() => {
    if (variants.value.length > 1 && !selectedVariant.value) {
      return '请选择规格'
    }
    if (leftQuantity.value <= 0) {
      return '已售罄'
    }
    return '立即购买'
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

  // 格式化价格（统一使用 formatMoney，包含千分位分隔符）
  const formatPrice = formatMoney

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

  // 返回上一页
  const onClickLeft = () => {
    router.back()
  }

  // 初始化收藏状态
  const initFavoriteStatus = async () => {
    if (!authStore.isAuthenticated) {
      isFavorite.value = false
      return
    }

    try {
      const result = await favoriteService.checkFavorite('PROMOTION', promotionId)
      isFavorite.value = result.isFavorite
    } catch (error) {
      console.error('检查收藏状态失败:', error)
      // 失败时默认为未收藏，不影响用户体验
      isFavorite.value = false
    }
  }

  // 切换收藏
  const toggleFavorite = async () => {
    // 检查登录状态
    if (!authStore.isAuthenticated || !authStore.user) {
      showToast('请先登录')
      router.push({ name: 'Login' })
      return
    }

    // 防止重复点击
    if (favoriteLoading.value) {
      return
    }

    favoriteLoading.value = true
    try {
      if (isFavorite.value) {
        // 取消收藏
        await favoriteService.removeFavorite('PROMOTION', promotionId)
        isFavorite.value = false
        showToast('已取消收藏')
      } else {
        // 添加收藏
        await favoriteService.addFavorite('PROMOTION', promotionId)
        isFavorite.value = true
        showToast('已添加到收藏')
      }
    } catch (error: any) {
      console.error('收藏操作失败:', error)
      showToast(error.message || '操作失败，请稍后重试')
    } finally {
      favoriteLoading.value = false
    }
  }

  // 联系客服
  const contactService = () => {
    showToast('正在跳转到客服聊天...')
  }

  // 立即购买
  const handlePurchase = async (event?: Event) => {
    // 阻止事件冒泡和默认行为
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // 多规格验证：确保用户已选择规格
    if (variants.value.length > 1 && !selectedVariant.value) {
      showToast('请选择规格')
      return
    }

    // 验证选中规格的库存
    if (selectedVariant.value) {
      const variantLeftQuantity = Math.max(0,
        (selectedVariant.value.promotionQuantity || 0) - (selectedVariant.value.soldQuantity || 0)
      )
      if (variantLeftQuantity <= 0) {
        showToast('该规格已售罄')
        return
      }
    }

    if (leftQuantity.value <= 0) {
      showToast('该促销活动已售罄')
      return
    }

    // 检查用户是否登录
    if (!authStore.isAuthenticated || !authStore.user) {
      showToast('请先登录')
      router.push({ name: 'Login' })
      return
    }

    const userId = authStore.user.id
    // 使用选中规格的分账模式
    const promotionMode = selectedVariant.value?.promotionMode || promotion.promotionMode
    const variantId = selectedVariant.value?.id

    try {
      showLoadingToast({
        message: '跳转中...',
        forbidClick: true,
        duration: 0
      })

      // 根据分账模式处理
      if (promotionMode === 'points_exchange') {
        // 积分兑换模式
        await handlePointsExchangePurchase(userId)
      } else {
        // 商场补贴/普通分账模式
        await handlePaymentPurchase(userId)
      }
    } catch (error: any) {
      closeToast()
      showToast(error.message || '购买失败，请稍后重试')
    }
  }

  // 积分兑换模式购买
  const handlePointsExchangePurchase = async (userId: string) => {
    // 使用选中规格的结算价和积分价值
    const settlementPrice = selectedVariant.value?.settlementPrice || promotion.settlementPrice || 0
    const pointsValue = selectedVariant.value?.pointsValue || promotion.pointsValue || 20
    const requiredPoints = Math.round(settlementPrice * pointsValue)

    // 先验证积分
    const currentPoints = await pointsService.getUserPoints(userId)
    
    if (currentPoints < requiredPoints) {
      closeToast()
      showToast(`积分不足，当前积分：${currentPoints}，所需积分：${requiredPoints}`)
      return
    }

    // 确认购买
    try {
      await showConfirmDialog({
        title: '确认兑换',
        message: `使用 ${requiredPoints} 积分兑换此促销活动？`,
        confirmButtonText: '确认兑换',
        cancelButtonText: '取消'
      })
    } catch {
      // 用户取消
      closeToast()
      return
    }

    // 创建订单（后端会扣减积分）
    const variantId = selectedVariant.value?.id
    const result = await orderService.createPromotionOrder(promotionId, 1, variantId)
    
    closeToast()
    showToast('兑换成功！')
    
    // 跳转到订单详情
    setTimeout(() => {
      router.push({ name: 'OrderDetail', params: { id: result.order.id } })
    }, 1500)
  }

  // 等待 wx 对象注入（微信小程序 webview 会在页面加载后异步注入）
  const waitForWxObject = (maxAttempts = 10, interval = 200): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0
      const checkWx = () => {
        attempts++
        const hasWx = typeof window !== 'undefined' && !!window.wx?.miniProgram
        
        if (hasWx) {
          resolve(true)
          return
        }
        
        if (attempts >= maxAttempts) {
          resolve(false)
          return
        }
        
        setTimeout(checkWx, interval)
      }
      checkWx()
    })
  }

  // 商场补贴/普通分账模式购买（需要微信支付）
  const handlePaymentPurchase = async (userId: string) => {
    // 先等待 wx 对象注入（微信小程序 webview 会在页面加载后异步注入）
    const wxReady = await waitForWxObject(15, 200) // 最多等待 3 秒（15 * 200ms）
    
    // 检查是否在小程序环境中
    // 优先检查 navigateTo 是否存在，因为这是最直接的判断方式
    const miniProgram = (window.wx?.miniProgram as any) || null
    const hasNavigateTo = typeof miniProgram?.navigateTo === 'function'
    const hasPostMessage = typeof miniProgram?.postMessage === 'function'
    const hasGetEnv = typeof miniProgram?.getEnv === 'function'
    
    // 如果 navigateTo 存在，说明一定在小程序环境中
    // 如果只有 postMessage 或 getEnv，也可以认为在小程序环境中
    const isInMiniProgramEnv = hasNavigateTo || hasPostMessage || hasGetEnv || webViewBridge.isInMiniProgram
    
    // 直接跳转到小程序原生支付页面，传递 promotionId 和 variantId（如果选择了规格）
    // 小程序会从后端获取促销活动详情，显示给用户确认，然后创建订单并支付
    let paymentUrl = `/pages/payment/payment?promotionId=${encodeURIComponent(promotionId)}`
    // 如果用户选择了规格，传递 variantId 参数
    if (selectedVariant.value?.id) {
      paymentUrl += `&variantId=${encodeURIComponent(selectedVariant.value.id)}`
    }
    
    // 尝试多种方式跳转
    try {
      // 方式1: 使用 navigateTo（推荐）
      if (hasNavigateTo) {
        miniProgram.navigateTo({
          url: paymentUrl,
          success: () => {
            // 跳转成功，保持loading直到页面切换
            // loading会在页面切换时自动关闭
          },
          fail: (error: any) => {
            closeToast()
            // 尝试使用 postMessage 方式
            tryPostMessageFallback(paymentUrl, error)
          }
        })
        return
      }
      
      // 方式2: 使用 postMessage（备用）
      if (hasPostMessage) {
        tryPostMessageFallback(paymentUrl)
        return
      }
      
      // 方式3: 都不存在，提示用户
      closeToast()
      showToast('请在微信小程序中打开')
    } catch (error: any) {
      closeToast()
      showToast(error.message || '跳转失败，请稍后重试')
    }
  }
  
  // 使用 postMessage 作为备用跳转方式
  const tryPostMessageFallback = (paymentUrl: string, previousError?: any) => {
    try {
      const miniProgram = window.wx?.miniProgram as any
      if (miniProgram?.postMessage) {
        miniProgram.postMessage({
          data: {
            type: 'navigate',
            url: paymentUrl
          }
        })
      } else {
        throw new Error('postMessage 不可用')
      }
    } catch (error: any) {
      closeToast()
      showToast(previousError?.errMsg || error.message || '跳转失败，请稍后重试')
    }
  }

  // 处理微信支付（跳转到小程序支付页面）
  const handleWechatPayment = async (orderId: string, amount: number, order?: any) => {
    try {
      const miniProgram = window.wx?.miniProgram as any

      // 检查是否在小程序环境中
      if (!webViewBridge.isInMiniProgram || !miniProgram?.navigateTo) {
        closeToast()
        showToast('请在微信小程序中打开')
        return
      }

      // 直接使用 wx.miniProgram.navigateTo 跳转到小程序原生支付页面
      // 传递 promotionId 和 variantId（如果选择了规格），让小程序从后端获取促销活动详情（价格、分账模式等）
      let paymentUrl = `/pages/payment/payment?promotionId=${encodeURIComponent(promotionId)}`
      // 如果用户选择了规格，传递 variantId 参数
      if (selectedVariant.value?.id) {
        paymentUrl += `&variantId=${encodeURIComponent(selectedVariant.value.id)}`
      }
      
      miniProgram.navigateTo({
        url: paymentUrl,
        success: () => {
          // 跳转成功，保持loading直到页面切换
        },
        fail: (error: any) => {
          closeToast()
          showToast(error.errMsg || '跳转失败，请稍后重试')
        }
      })
      
      // 注意：支付结果会在支付页面完成后处理
      // 如果用户取消支付或支付失败，会返回到当前页面
      // 如果支付成功，支付页面会自动处理跳转
    } catch (error: any) {
      closeToast()
      showToast(error.message || '跳转到支付页面失败，请稍后重试')
    }
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
      const data = await api.get<{
        id: string
        name: string
        description?: string
        salePrice: number
        originalPrice: number
        promotionQuantity: number
        soldQuantity: number
        startTime: string
        endTime: string
        images: any
        promotionMode?: 'mall_subsidy' | 'normal_split' | 'points_exchange'
        settlementPrice?: number
        pointsValue?: number
        variants?: any[] // 规格列表
        tags?: Array<{ id: string; name: string; description?: string | null }> // 服务特色标签
      }>(`/promotions/${promotionId}`)
      
      Object.assign(promotion, {
        id: data.id,
        name: data.name,
        description: data.description || '',
        salePrice: data.salePrice || 0,
        originalPrice: data.originalPrice || 0,
        variants: data.variants || [], // 规格列表
      })

      // 设置服务特色标签
      tags.value = data.tags || []

      // 初始化规格选择（VariantSelector 组件会自动选择默认规格）
      // 这里只需要确保 variants 数据已加载
      if (promotion.variants && promotion.variants.length > 0) {
        const defaultVariant = promotion.variants.find((v: any) => v.isDefault) || promotion.variants[0]
        if (defaultVariant) {
          selectedVariant.value = defaultVariant
        }
      }

      Object.assign(promotion, {
        promotionQuantity: data.promotionQuantity || 0,
        soldQuantity: data.soldQuantity || 0,
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        images: data.images || null,
        promotionMode: data.promotionMode || '',
        settlementPrice: data.settlementPrice || 0,
        pointsValue: data.pointsValue || 0,
      })

      // 初始化收藏状态
      await initFavoriteStatus()
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

  // 处理支付结果消息
  const handlePaymentResult = (result: any) => {
    console.log('收到支付结果消息:', result)
    if (result && result.success) {
      // 支付成功，刷新促销详情数据
      console.log('支付成功，刷新促销详情数据')
      loadPromotionDetail()
      showToast('支付成功！')
    }
  }

  // 页面激活时刷新数据（从收银台返回时）
  let lastRefreshTime = 0
  const REFRESH_INTERVAL = 2000 // 2秒内不重复刷新
  const handlePageActivated = () => {
    const now = Date.now()
    // 避免过于频繁的刷新
    if (now - lastRefreshTime < REFRESH_INTERVAL) {
      console.log('页面激活刷新被节流，跳过')
      return
    }
    lastRefreshTime = now
    console.log('页面激活，刷新促销详情数据')
    loadPromotionDetail()
  }

  // 页面激活事件处理器
  let handleVisibilityChange: (() => void) | null = null
  let handlePageShow: ((event: PageTransitionEvent) => void) | null = null

  // 初始化
  onMounted(() => {
    // 设置底部栏主题色样式
    setBottomBarTheme()
    
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

  // 顶部Banner主图区域
  .banner-section {
    width: 100%;
    @include glassmorphism-card(light);

    .banner-swipe {
      width: 100%;
    }

    .banner-image {
      width: 100%;
      min-height: 300px;
      max-height: 500px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background-color: #f5f5f5; // 默认背景色
      
      // 模糊背景层 - 填充整个容器
      .banner-background-blur {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: var(--banner-image-url);
        background-size: cover; // 背景层使用cover填充整个容器
        background-position: center;
        background-repeat: no-repeat;
        filter: blur(20px);
        transform: scale(1.1) translateZ(0); // 稍微放大避免边缘模糊，启用GPU加速
        z-index: 0;
        will-change: transform, filter; // 提示浏览器优化transform和filter
        backface-visibility: hidden; // 优化渲染性能
        -webkit-backface-visibility: hidden; // Safari兼容
      }
      
      // 主图片层 - 完整显示图片
      .banner-image-main {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 300px;
        background-image: var(--banner-image-url);
        background-size: contain; // 使用contain，完整显示图片
        background-position: center;
        background-repeat: no-repeat;
        z-index: 1;
        will-change: transform; // 提示浏览器优化动画
        transform: translateZ(0); // 启用GPU加速
        backface-visibility: hidden; // 优化渲染性能
        -webkit-backface-visibility: hidden; // Safari兼容
      }
    }

    .banner-placeholder {
      width: 100%;
      height: 400px;
    }
  }

  // 促销活动基本信息
  .promotion-info {
    @include glassmorphism-card(base);
    padding: 16px;
    margin: 16px;
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
          color: var(--primary-dark);
        }

        .price-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--primary-dark);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 4px rgba(0, 0, 0, 0.05);
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
          font-weight: 600;
          color: white;
          background-color: var(--primary-color);
          padding: 4px 8px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          display: inline-block;
          line-height: 1.2;
        }
      }
    }

    .service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.service-tag {
  display: inline-block;
  padding: 4px 12px;
  background-color: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.service-tag:hover {
  background-color: #e0e0e0;
}

.service-tag:active {
  background-color: #d0d0d0;
}

// 优化 Popover 在视口范围内的显示
:deep(.van-popover[class*="tag-popover-"]) {
  max-width: min(280px, calc(100vw - 20px)) !important; // 左右各留10px边距
}

// Popover 内容容器样式
:deep(.van-popover__wrapper) {
  .van-popover__content {
    max-width: 100%;
    word-wrap: break-word;
    word-break: break-word;
    padding: 0 !important; // 移除默认 padding，使用内容区域的 padding
    box-sizing: border-box !important;
  }
}

// 内容区域样式（padding 通过内联样式设置）
.tag-popover-content {
  min-width: 120px;
  max-width: 100%;
  word-wrap: break-word;
  word-break: break-word;
  box-sizing: border-box;
}

.tag-name {
  font-weight: bold;
  margin-bottom: 8px !important; // 增加标题和描述之间的间距
  margin-top: 0 !important; // 确保顶部没有额外间距
  color: #fff;
  font-size: 14px;
  line-height: 1.4;
  padding: 0;
}

.tag-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  white-space: normal; // 允许换行
  margin: 0 !important; // 确保没有额外间距
  padding: 0;
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
    @include glassmorphism-card(base);
    margin: 16px;
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
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); // 安全区域适配
    z-index: 100;
    gap: 12px;
    transition: transform 0.3s ease-in-out;
    transform: translateY(0);
    
    // 使用主题色15%，整体不透明度95%
    // 背景颜色通过 JavaScript 动态设置（bottomBarStyle）
    // 默认降级方案：主题色15% × 整体95%不透明度 = 0.1425
    background: rgba(25, 137, 250, 0.1425);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 2px solid transparent; // 边框颜色通过 JavaScript 动态设置
    box-shadow: 0 -4px 24px 0 rgba(0, 0, 0, 0.08), 
                0 -2px 8px 0 rgba(0, 0, 0, 0.05);

    // 降级方案：不支持 backdrop-filter 时保持相同样式
    @supports not (backdrop-filter: blur(20px)) {
      background: rgba(25, 137, 250, 0.1425);
    }

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
        padding: 6px 10px;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s ease;

        &:active {
          opacity: 0.7;
          transform: scale(0.95);
        }

        &:hover {
          background-color: rgba(0, 0, 0, 0.03);
        }

        .van-icon {
          font-size: 22px;
          color: var(--inverted-theme-color, #ffffff);  // 使用反色，默认白色作为降级方案
          transition: color 0.2s ease;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));  // 添加阴影增强对比度
          -webkit-filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));

          &.active {
            // active 状态（非收藏按钮）使用主题色
            color: var(--primary-color);
            filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 6px var(--primary-color));  // active 状态使用主题色高光
            -webkit-filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 6px var(--primary-color));
          }

          // 收藏按钮图标统一使用金色（使用特定class，确保优先级最高）
          &.favorite-icon {
            color: #ffd700 !important;  // 金色，使用 !important 确保优先级
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 4px rgba(255, 215, 0, 0.5)) !important;  // 金色高光
            -webkit-filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 4px rgba(255, 215, 0, 0.5)) !important;
            
            // 覆盖 Vant 图标的内联样式和字体图标
            &[style*="color"] {
              color: #ffd700 !important;
            }
            
            // 字体图标的 ::before 伪元素
            &::before {
              color: #ffd700 !important;
            }
            
            // 确保 SVG 内部元素也使用金色（Vue 3 深度选择器语法）
            :deep(.van-icon__image),
            :deep(svg),
            :deep(path),
            :deep(.van-icon__font),
            :deep(.van-icon__font::before) {
              fill: #ffd700 !important;
              color: #ffd700 !important;
            }
            
            // active 状态也保持金色
            &.active {
              color: #ffd700 !important;  // 金色
              filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 6px rgba(255, 215, 0, 0.6)) !important;  // 增强金色高光
              -webkit-filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 6px rgba(255, 215, 0, 0.6)) !important;
              
              &[style*="color"] {
                color: #ffd700 !important;
              }
              
              &::before {
                color: #ffd700 !important;
              }
              
              :deep(.van-icon__image),
              :deep(svg),
              :deep(path),
              :deep(.van-icon__font),
              :deep(.van-icon__font::before) {
                fill: #ffd700 !important;
                color: #ffd700 !important;
              }
            }
          }
        }

        span {
          font-size: 12px;
          font-weight: 600;  // 增加字重增强对比度
          color: var(--inverted-theme-color, #ffffff);  // 使用反色，默认白色作为降级方案
          transition: color 0.2s ease;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.2);  // 添加文字阴影增强对比度
        }
      }
    }

    .right-buttons {
      flex-shrink: 0;
      position: relative;
      z-index: 101; // 确保按钮在最上层

      .van-button {
        min-width: 140px;
        height: 44px;
        position: relative;
        z-index: 102; // 确保按钮在最上层
        pointer-events: auto; // 确保可以点击
        border: none;
        border-radius: 22px;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 4px 12px 0 rgba(25, 137, 250, 0.3), 0 2px 4px 0 rgba(25, 137, 250, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        
        // 使用主题色渐变背景
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
        
        &:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px 0 rgba(25, 137, 250, 0.4), 0 4px 8px 0 rgba(25, 137, 250, 0.3);
        }
        
        &:not(:disabled):active {
          transform: translateY(0);
          box-shadow: 0 2px 8px 0 rgba(25, 137, 250, 0.3), 0 1px 2px 0 rgba(25, 137, 250, 0.2);
        }
        
        &:disabled {
          background: linear-gradient(135deg, #c8c9cc 0%, #bfbfbf 100%);
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
          opacity: 0.6;
        }
      }
    }
  }
</style>

