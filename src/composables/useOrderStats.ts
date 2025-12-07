/**
 * 订单统计 Composable
 */
import { ref } from 'vue'
import { merchantService } from '@/services/merchant'
import type { MerchantOrder } from '@/types'

export interface OrderStats {
  total: number
  paid: number
  verified: number
  refunded: number
}

export function useOrderStats() {
  const orderStats = ref<OrderStats>({
    total: 0,
    paid: 0,
    verified: 0,
    refunded: 0
  })

  /**
   * 加载订单统计（独立获取，不受过滤影响）
   * 改为按需分页读取，而不是一次性读取 1000 条
   */
  const loadOrderStats = async () => {
    try {
      // 按需分页读取所有订单来计算统计
      // 注意：统计数字应该显示所有订单的统计，不受筛选条件影响
      // 理想情况下应该使用专门的统计 API，但目前后端可能没有提供
      // 如果未来有统计 API，应该替换为：await merchantService.getMerchantStatistics()
      
      const allOrdersForStats: MerchantOrder[] = []
      let currentPage = 1
      const pageSize = 50 // 每页读取 50 条，避免一次性加载太多
      let hasMore = true

      // 分页读取所有订单
      while (hasMore) {
        const statsParams = {
          page: currentPage,
          limit: pageSize
          // 不传任何筛选参数，获取所有订单的统计
        }

        const statsResponse = await merchantService.getMerchantOrders(statsParams as any)
        const orders = statsResponse.orders || []
        
        if (orders.length > 0) {
          allOrdersForStats.push(...orders)
        }

        // 判断是否还有更多数据
        if (orders.length < pageSize || allOrdersForStats.length >= statsResponse.total) {
          hasMore = false
        } else {
          currentPage++
          // 设置一个最大页数限制，避免无限循环（例如最多读取 20 页，即 1000 条）
          if (currentPage > 20) {
            hasMore = false
          }
        }
      }

      // 统计总订单（排除已取消）
      const totalOrders = allOrdersForStats.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status !== 'cancelled' && status !== 'CANCELLED'
      })

      // 统计已支付订单（只包括 paid 和 pending_verification 状态，不包括 pending）
      // pending 是"待支付"状态，属于未支付，不应统计到"已支付"中
      const paidOrders = allOrdersForStats.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status === 'paid' || status === 'pending_verification' ||
               status === 'PAID' || status === 'PENDING_VERIFICATION'
      })

      // 统计已核销订单（包括 verified 和 completed 状态）
      const verifiedOrders = allOrdersForStats.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status === 'verified' || status === 'completed' ||
               status === 'VERIFIED' || status === 'COMPLETED'
      })

      // 统计已退款订单
      const refundedOrders = allOrdersForStats.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status === 'refunded' || status === 'refund_requested' ||
               status === 'REFUNDED' || status === 'REFUND_REQUESTED'
      })

      // 更新统计（使用实际统计的数量，而不是 API 返回的 total）
      orderStats.value = {
        total: totalOrders.length,
        paid: paidOrders.length,
        verified: verifiedOrders.length,
        refunded: refundedOrders.length
      }
    } catch (err) {
      console.error('Failed to load order stats:', err)
      // 如果统计加载失败，不影响订单列表显示
    }
  }

  return {
    orderStats,
    loadOrderStats
  }
}
