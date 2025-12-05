/**
 * 促销活动详情数据管理 Composable
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { api } from '@/services/api'
import { favoriteService } from '@/services/favorites'
import { useAuthStore } from '@/stores/auth'
import type { PromotionDetail, PromotionVariant, PromotionTag } from '@/types/promotion'

export interface UsePromotionDetailReturn {
  // 状态
  promotion: Ref<PromotionDetail | null>
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

  // 使用 ref 而不是 reactive，初始值为 null，便于条件判断
  const promotion = ref<PromotionDetail | null>(null)

  // 规格选择
  const variants = computed(() => promotion.value?.variants || [])
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
    console.log('🔍 [usePromotionDetail] 开始加载促销详情, promotionId:', promotionId)
    loading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })

    try {
      console.log('🔍 [usePromotionDetail] 准备调用 API...')
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

      console.log('🔍 [usePromotionDetail] API 返回原始数据:', JSON.stringify({
        id: data.id,
        name: data.name,
        hasShop: !!data.shop,
        shop: data.shop,
        shopKeys: data.shop ? Object.keys(data.shop) : [],
        shopCode: data.shop?.shopCode,
        floor: data.shop?.floor,
        hasTags: !!data.tags,
        tagsCount: data.tags?.length || 0,
        hasVariants: !!data.variants,
        variantsCount: data.variants?.length || 0,
        salePrice: data.salePrice,
        originalPrice: data.originalPrice,
        promotionQuantity: data.promotionQuantity,
        soldQuantity: data.soldQuantity,
        description: data.description,
      }, null, 2))
      console.log('🔍 [usePromotionDetail] API 返回完整 shop 对象:', JSON.stringify(data.shop, null, 2))
      
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
      
      // 使用整体赋值，确保响应式更新
      const newPromotionData = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        salePrice: data.salePrice || 0,
        originalPrice: data.originalPrice || 0,
        promotionQuantity: data.promotionQuantity || 0,
        soldQuantity: data.soldQuantity || 0,
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        images: processedImages,
        promotionMode: data.promotionMode,
        settlementPrice: data.settlementPrice || 0,
        pointsValue: data.pointsValue || 0,
        variants: data.variants || [],
        tags: data.tags || [],
        shop: data.shop || null,
      }

      console.log('🔍 [usePromotionDetail] 准备赋值 promotion.value, 赋值前:', JSON.stringify({
        'promotion 是否为 ref': promotion && typeof promotion === 'object' && 'value' in promotion,
        'promotion.value 当前值': promotion.value,
      }, null, 2))

      promotion.value = newPromotionData

      console.log('🔍 [usePromotionDetail] 赋值后立即检查:', JSON.stringify({
        'promotion.value 存在': !!promotion.value,
        'promotion.value.id': promotion.value?.id,
        'promotion.value.name': promotion.value?.name,
        'promotion.value.shop': promotion.value?.shop,
        'promotion.value.shopCode': promotion.value?.shop?.shopCode,
        'promotion.value.floor': promotion.value?.shop?.floor,
        'promotion.value.tags': promotion.value?.tags,
        'promotion.value.variants': promotion.value?.variants,
      }, null, 2))

      // 调试日志：确认数据已加载
      console.log('✅ 促销活动数据已加载:', JSON.stringify({
        id: promotion.value.id,
        name: promotion.value.name,
        hasShop: !!promotion.value.shop,
        shopCode: promotion.value.shop?.shopCode,
        floor: promotion.value.shop?.floor,
        tenantName: promotion.value.shop?.tenantName,
        hasTags: (promotion.value.tags?.length ?? 0) > 0,
        tagsCount: promotion.value.tags?.length ?? 0,
        hasVariants: (promotion.value.variants?.length ?? 0) > 0,
        variantsCount: promotion.value.variants?.length ?? 0,
        salePrice: promotion.value.salePrice,
        originalPrice: promotion.value.originalPrice,
        promotionQuantity: promotion.value.promotionQuantity,
        soldQuantity: promotion.value.soldQuantity,
        description: promotion.value.description,
      }, null, 2))
      console.log('✅ promotion.value.shop 完整对象:', JSON.stringify(promotion.value.shop, null, 2))

      // 设置服务特色标签
      tags.value = data.tags || []

      // 初始化规格选择
      if (promotion.value.variants && promotion.value.variants.length > 0) {
        const defaultVariant = promotion.value.variants.find((v) => v.isDefault) || promotion.value.variants[0]
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
    promotion,
    loading,
    variants,
    selectedVariant,
    tags,
    loadPromotionDetail,
    selectVariant,
    initFavoriteStatus,
  }
}
