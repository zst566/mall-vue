/**
 * 促销活动购买流程 Composable
 */
import { computed, type Ref, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import webViewBridge from '@/utils/webview-bridge'
import type { PromotionDetail, PromotionVariant } from '@/types/promotion'

export interface UsePromotionPurchaseOptions {
  promotionId: string
  promotion: Ref<PromotionDetail>
  selectedVariant: Ref<PromotionVariant | null>
  variants: ComputedRef<PromotionVariant[]>
  leftQuantity: ComputedRef<number>
}

export interface UsePromotionPurchaseReturn {
  canPurchase: ComputedRef<boolean>
  purchaseButtonText: ComputedRef<string>
  handlePurchase: () => Promise<void>
}

/**
 * 处理促销活动购买流程
 */
export function usePromotionPurchase(
  options: UsePromotionPurchaseOptions
): UsePromotionPurchaseReturn {
  const { promotionId, promotion, selectedVariant, variants, leftQuantity } = options
  const router = useRouter()
  const authStore = useAuthStore()

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

  // 积分兑换模式购买
  const handlePointsExchangePurchase = async () => {
    closeToast()
    
    // 跳转到积分兑换页面
    const variantId = selectedVariant.value?.id
    const query: any = {}
    if (variantId) {
      query.variantId = variantId
    }
    
    router.push({
      name: 'PointsExchange',
      params: { id: promotionId },
      query
    })
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

  // 商场补贴/普通分账模式购买（需要微信支付）
  const handlePaymentPurchase = async () => {
    // 先等待 wx 对象注入（微信小程序 webview 会在页面加载后异步注入）
    await waitForWxObject(15, 200) // 最多等待 3 秒（15 * 200ms）
    
    // 检查是否在小程序环境中
    const miniProgram = (window.wx?.miniProgram as any) || null
    const hasNavigateTo = typeof miniProgram?.navigateTo === 'function'
    const hasPostMessage = typeof miniProgram?.postMessage === 'function'
    const hasGetEnv = typeof miniProgram?.getEnv === 'function'
    
    // 如果 navigateTo 存在，说明一定在小程序环境中
    const isInMiniProgramEnv = hasNavigateTo || hasPostMessage || hasGetEnv || webViewBridge.isInMiniProgram
    
    // 直接跳转到小程序原生支付页面，传递 promotionId 和 variantId（如果选择了规格）
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

  // 立即购买
  const handlePurchase = async () => {
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

    // 使用选中规格的分账模式
    const promotionMode = selectedVariant.value?.promotionMode || promotion.value.promotionMode

    try {
      showLoadingToast({
        message: '跳转中...',
        forbidClick: true,
        duration: 0
      })

      // 根据分账模式处理
      if (promotionMode === 'points_exchange') {
        // 积分兑换模式
        await handlePointsExchangePurchase()
      } else {
        // 商场补贴/普通分账模式
        await handlePaymentPurchase()
      }
    } catch (error: any) {
      closeToast()
      showToast(error.message || '购买失败，请稍后重试')
    }
  }

  return {
    canPurchase,
    purchaseButtonText,
    handlePurchase,
  }
}
