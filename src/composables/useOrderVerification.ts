/**
 * 订单核销 Composable
 */
import { ref, type Ref } from 'vue'
import { showLoadingToast, closeToast, showToast } from 'vant'
import { merchantService } from '@/services/merchant'
import { useAuthStore } from '@/stores/auth'
import type { VerifyOptions } from '@/types/scan'

export interface UseOrderVerificationReturn {
  isVerifying: Ref<boolean>
  verifyOrder: (orderId: string, orderNo: string, options: VerifyOptions) => Promise<void>
}

export function useOrderVerification(): UseOrderVerificationReturn {
  const isVerifying = ref(false)
  const authStore = useAuthStore()

  /**
   * 核销订单
   */
  const verifyOrder = async (
    orderId: string,
    orderNo: string,
    options: VerifyOptions
  ): Promise<void> => {
    try {
      isVerifying.value = true
      showLoadingToast({ message: '核销中...', forbidClick: true, duration: 0 })

      // 如果只有订单号，先查询订单ID
      let finalOrderId = orderId
      if (!finalOrderId && orderNo) {
        const ordersResponse = await merchantService.getMerchantOrders({ 
          search: orderNo,
          limit: 1 
        })
        
        if (ordersResponse.orders && ordersResponse.orders.length > 0) {
          finalOrderId = ordersResponse.orders[0].id
        } else {
          throw new Error('未找到对应的订单')
        }
      }

      if (!finalOrderId) {
        throw new Error('无法获取订单ID')
      }

      // 调用真实API进行核销
      const result = await merchantService.verifyOrder(finalOrderId, {
        operatorName: authStore.user?.nickname || '操作员',
        notes: options.notes
      })

      // 关闭 loading toast，再显示成功提示
      closeToast()
      showToast({ type: 'success', message: '核销成功' })
    } catch (error: any) {
      console.error('核销失败:', error)
      // 先关闭 loading toast，再显示错误提示
      closeToast()
      showToast({ type: 'fail', message: error.message || '核销失败，请重试' })
      throw error
    } finally {
      // 确保无论成功还是失败，都清理加载状态
      isVerifying.value = false
    }
  }

  return {
    isVerifying,
    verifyOrder
  }
}




