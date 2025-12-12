/**
 * 订单操作 Composable
 */
import { showToast, showLoadingToast } from 'vant'
import { merchantService } from '@/services/merchant'

export function useOrderOperations() {
  /**
   * 核销订单
   */
  const verifyOrder = async (orderId: string, onSuccess?: () => void) => {
    showLoadingToast({
      message: '正在核销...',
      forbidClick: true,
      duration: 1000
    })

    try {
      await merchantService.verifyOrder(orderId)

      showToast({
        message: '核销成功',
        type: 'success'
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      showToast('核销失败')
      console.error('Failed to verify order:', error)
      throw error
    }
  }

  /**
   * 取消订单
   */
  const cancelOrder = async (orderId: string, onSuccess?: () => void) => {
    showLoadingToast({
      message: '正在取消...',
      forbidClick: true,
      duration: 1000
    })

    try {
      await merchantService.cancelMerchantOrder(orderId, '客户主动取消')

      showToast({
        message: '取消成功',
        type: 'success'
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      showToast('取消失败')
      console.error('Failed to cancel order:', error)
      throw error
    }
  }

  return {
    verifyOrder,
    cancelOrder
  }
}




