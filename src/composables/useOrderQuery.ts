/**
 * 订单查询 Composable
 */
import { ref, type Ref } from 'vue'
import { showLoadingToast, closeToast } from 'vant'
import { merchantService } from '@/services/merchant'
import type { ScanResult } from '@/types/scan'

export interface UseOrderQueryReturn {
  isQuerying: Ref<boolean>
  queryOrderByNo: (orderNo: string) => Promise<ScanResult | null>
}

export function useOrderQuery(): UseOrderQueryReturn {
  const isQuerying = ref(false)

  /**
   * 解析金额字段（处理 Prisma Decimal 类型）
   */
  const parseAmount = (value: any): number => {
    if (value == null) return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') return parseFloat(value) || 0
    // Prisma Decimal 类型有 toString() 方法
    if (typeof value === 'object' && value.toString) {
      return parseFloat(value.toString()) || 0
    }
    return 0
  }

  /**
   * 根据订单号查询订单详情
   */
  const queryOrderByNo = async (orderNo: string): Promise<ScanResult | null> => {
    if (!orderNo || !orderNo.trim()) {
      return null
    }

    try {
      isQuerying.value = true
      showLoadingToast({ message: '正在查询订单信息...', forbidClick: true, duration: 0 })

      // 先通过订单号查询订单ID
      const ordersResponse = await merchantService.getMerchantOrders({ 
        search: orderNo.trim(),
        limit: 1 
      })
      
      if (!ordersResponse.orders || ordersResponse.orders.length === 0) {
        throw new Error('未找到对应的订单')
      }

      const orderId = ordersResponse.orders[0].id

      // 获取订单详情
      const orderDetail = await merchantService.getMerchantOrderDetail(orderId)
      
      console.log('✅ [查询] 订单详情获取成功:', orderDetail)
      console.log('📋 [查询] 订单状态字段检查:', {
        hasStatus: 'status' in orderDetail,
        statusValue: orderDetail.status,
        statusType: typeof orderDetail.status,
        allKeys: Object.keys(orderDetail)
      })
      
      // 处理金额字段
      const totalAmount = parseAmount(orderDetail.totalAmount)
      const finalAmount = parseAmount(orderDetail.finalAmount)
      
      // 使用实付金额（finalAmount），如果为0则使用总金额（totalAmount）
      const orderAmount = finalAmount > 0 ? finalAmount : (totalAmount > 0 ? totalAmount : 0)
      
      console.log('💰 [查询] 订单金额:', { 
        totalAmountRaw: orderDetail.totalAmount, 
        totalAmountRawType: typeof orderDetail.totalAmount,
        finalAmountRaw: orderDetail.finalAmount,
        finalAmountRawType: typeof orderDetail.finalAmount,
        totalAmount, 
        finalAmount, 
        orderAmount,
        orderDetailKeys: Object.keys(orderDetail)
      })
      
      // 转换订单状态：后端返回大写（PAID），前端使用小写（paid）
      const statusMap: Record<string, string> = {
        'PENDING': 'pending',
        'PAID': 'paid',
        'VERIFIED': 'verified',
        'CANCELLED': 'cancelled',
        'REFUNDED': 'refunded',
        'REFUND_REQUESTED': 'refund_requested'
      }
      const normalizedStatus = statusMap[orderDetail.status as string] || orderDetail.status || 'pending'
      
      console.log('📋 [查询] 订单原始状态:', orderDetail.status)
      console.log('📋 [查询] 订单转换后状态:', normalizedStatus)
      console.log('📋 [查询] 订单详情完整数据:', orderDetail)
      
      // 构建扫描结果
      const result: ScanResult = {
        type: 'order',
        title: '订单核销',
        data: {
          id: orderDetail.id,
          orderId: orderDetail.id,
          orderNo: orderDetail.orderNo || orderNo,
          productName: orderDetail.items?.[0]?.productName || '商品',
          quantity: orderDetail.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 1,
          amount: orderAmount,
          status: normalizedStatus,
          purchasedAt: orderDetail.createdAt || new Date().toISOString()
        }
      }
      
      console.log('📋 [查询] 构建的扫描结果:', result)

      // 关闭 loading toast
      closeToast()
      isQuerying.value = false
      
      return result
    } catch (error: any) {
      console.error('❌ [查询] 查询订单失败:', error)
      // 先关闭 loading toast
      closeToast()
      isQuerying.value = false
      
      // 抛出错误，让调用者处理
      throw error
    }
  }

  return {
    isQuerying,
    queryOrderByNo
  }
}
