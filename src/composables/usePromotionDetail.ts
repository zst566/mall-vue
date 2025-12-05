/**
 * 促销活动详情数据管理 Composable
 */
import { ref, reactive, computed, toRef, type Ref, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { api } from '@/services/api'
import { favoriteService } from '@/services/favorites'
import { useAuthStore } from '@/stores/auth'
import type { PromotionDetail, PromotionVariant, PromotionTag } from '@/types/promotion'

export interface UsePromotionDetailReturn {
  // 状态
  promotion: Ref<PromotionDetail>
  loading: Ref<boolean>
  variants: ComputedRef<PromotionVariant[]>
  selectedVariant: Ref<PromotionVariant | null>
  tags: Ref<PromotionTag[]>
  
  // 方法
  loadPromotionDetail: () => Promise<void>
  selectVariant: (variant: PromotionVariant) => void
  initFavoriteStatus: () => Promise<void>
}

export function usePromotionDetail(promotionId: string): UsePromotionDetailReturn {
  const router = useRouter()
  const authStore = useAuthStore()
  const loading = ref(false)

  const promotion = reactive<PromotionDetail>({
    id: promotionId,
    name: '',
    description: '',
    salePrice: 0,
    originalPrice: 0,
    promotionQuantity: 0,
    soldQuantity: 0,
    startTime: '',
    endTime: '',
    images: null,
    promotionMode: '',
    settlementPrice: 0,
    pointsValue: 0,
    variants: [],
    tags: [],
    shop: null,
  })

  // 规格选择
  const variants = computed(() => promotion.variants || [])
  const selectedVariant = ref<PromotionVariant | null>(null)
  const tags = ref<PromotionTag[]>([])

  // 选择规格
  const selectVariant = (variant: PromotionVariant) => {
    selectedVariant.value = variant
  }

  // 初始化收藏状态
  const initFavoriteStatus = async () => {
    if (!authStore.isAuthenticated) {
      return
    }

    try {
      const result = await favoriteService.checkFavorite('PROMOTION', promotionId)
      // 这里不直接设置 isFavorite，由 usePromotionFavorite 管理
    } catch (error) {
      console.error('检查收藏状态失败:', error)
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
        shop?: { id: string; shopCode: string; floor?: string | null; area?: string | null; tenantName?: string | null } | null
        startTime: string
        endTime: string
        images: any
        mainImage?: string | null
        thumbnail?: string | null
        promotionMode?: 'mall_subsidy' | 'normal_split' | 'points_exchange'
        settlementPrice?: number
        pointsValue?: number
        variants?: PromotionVariant[]
        tags?: PromotionTag[]
      }>(`/promotions/${promotionId}`)
      
      // 处理图片数据：如果有 mainImage，优先使用；否则使用 images 数组
      let processedImages = data.images || null
      if (data.mainImage) {
        // 如果 mainImage 存在，优先使用 mainImage
        if (!processedImages || (Array.isArray(processedImages) && processedImages.length === 0)) {
          // 如果 images 为空，将 mainImage 转换为图片对象
          processedImages = [{
            url: data.mainImage,
            isMain: true,
            key: data.mainImage,
            id: 'main-image'
          }]
        } else if (Array.isArray(processedImages) && processedImages.length > 0) {
          // 如果 images 也存在，确保主图标记正确
          const mainImageIndex = processedImages.findIndex((img: any) => 
            (typeof img === 'object' && (img.url === data.mainImage || img.key === data.mainImage)) || 
            (typeof img === 'string' && img === data.mainImage)
          )
          if (mainImageIndex >= 0) {
            // 如果 mainImage 在 images 数组中，标记为主图
            if (typeof processedImages[mainImageIndex] === 'object') {
              processedImages[mainImageIndex].isMain = true
            }
            // 将主图移到数组开头
            const mainImg = processedImages.splice(mainImageIndex, 1)[0]
            processedImages.unshift(mainImg)
          } else {
            // 如果 mainImage 不在 images 数组中，添加到数组开头
            processedImages.unshift({
              url: data.mainImage,
              isMain: true,
              key: data.mainImage,
              id: 'main-image'
            })
          }
        }
      }
      
      // 直接更新 reactive 对象的属性，确保响应式更新
      promotion.id = data.id
      promotion.name = data.name
      promotion.description = data.description || ''
      promotion.salePrice = data.salePrice || 0
      promotion.originalPrice = data.originalPrice || 0
      promotion.variants = data.variants || []
      promotion.promotionQuantity = data.promotionQuantity || 0
      promotion.soldQuantity = data.soldQuantity || 0
      promotion.startTime = data.startTime || ''
      promotion.endTime = data.endTime || ''
      promotion.images = processedImages // 直接赋值，确保响应式更新
      promotion.promotionMode = data.promotionMode || ''
      promotion.settlementPrice = data.settlementPrice || 0
      promotion.pointsValue = data.pointsValue || 0
      promotion.shop = data.shop || null

      // 设置服务特色标签
      tags.value = data.tags || []

      // 初始化规格选择
      if (promotion.variants && promotion.variants.length > 0) {
        const defaultVariant = promotion.variants.find((v) => v.isDefault) || promotion.variants[0]
        if (defaultVariant) {
          selectedVariant.value = defaultVariant
        }
      }

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

  return {
    promotion: computed(() => promotion) as Ref<PromotionDetail>,
    loading,
    variants,
    selectedVariant,
    tags,
    loadPromotionDetail,
    selectVariant,
    initFavoriteStatus,
  }
}
