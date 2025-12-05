/**
 * 促销活动价格计算 Composable
 */
import { computed, type Ref, type ComputedRef } from 'vue'
import { formatMoney } from '@/utils/format'
import type { PromotionDetail, PromotionVariant } from '@/types/promotion'

export interface UsePromotionPriceOptions {
  promotion: Ref<PromotionDetail | null>
  selectedVariant: Ref<PromotionVariant | null>
}

export interface UsePromotionPriceReturn {
  isMallSubsidy: ComputedRef<boolean>
  subsidyAmount: ComputedRef<number>
  finalAmount: ComputedRef<number>
  salePrice: ComputedRef<number>
  originalPrice: ComputedRef<number>
  leftQuantity: ComputedRef<number>
  formatPrice: (price: number) => string
}

/**
 * 处理促销活动价格计算
 */
export function usePromotionPrice(
  options: UsePromotionPriceOptions
): UsePromotionPriceReturn {
  const { promotion, selectedVariant } = options

  // 判断是否为商场补贴模式
  const isMallSubsidy = computed(() => {
    if (!promotion.value) return false
    const mode = selectedVariant.value?.promotionMode || promotion.value.promotionMode
    const subsidy = selectedVariant.value?.subsidyAmount || 0
    return mode === 'mall_subsidy' && subsidy > 0
  })

  // 获取补贴金额
  const subsidyAmount = computed(() => {
    if (!isMallSubsidy.value) return 0
    return selectedVariant.value?.subsidyAmount || 0
  })

  // 计算实付金额（商场补贴模式下）
  const finalAmount = computed(() => {
    if (!isMallSubsidy.value || !promotion.value) return 0
    const salePrice = selectedVariant.value?.salePrice || promotion.value.salePrice
    const subsidy = subsidyAmount.value
    return Math.max(0, salePrice - subsidy) // 确保实付金额不为负数
  })

  // 当前售价
  const salePrice = computed(() => {
    if (!promotion.value) return 0
    return selectedVariant.value?.salePrice || promotion.value.salePrice
  })

  // 原价
  const originalPrice = computed(() => {
    if (!promotion.value) return 0
    return selectedVariant.value?.originalPrice || promotion.value.originalPrice || 0
  })

  // 剩余数量（使用选中规格的库存）
  const leftQuantity = computed(() => {
    if (selectedVariant.value) {
      return Math.max(0, 
        (selectedVariant.value.promotionQuantity || 0) - (selectedVariant.value.soldQuantity || 0)
      )
    }
    if (!promotion.value) return 0
    return Math.max(0, 
      (promotion.value.promotionQuantity || 0) - (promotion.value.soldQuantity || 0)
    )
  })

  // 格式化价格（统一使用 formatMoney，包含千分位分隔符）
  const formatPrice = formatMoney

  return {
    isMallSubsidy,
    subsidyAmount,
    finalAmount,
    salePrice,
    originalPrice,
    leftQuantity,
    formatPrice,
  }
}
