/**
 * 订单筛选和排序 Composable
 */
import { ref, reactive } from 'vue'
import type { MerchantOrder, MerchantOrderStatus } from '@/types'

export interface FilterParams {
  status: MerchantOrderStatus | ''
  dateRange: string[]
  search: string
  sortBy: 'createdAt' | 'paidAt' | 'verifiedAt' | 'refundedAt'
  sortOrder: 'asc' | 'desc'
}

export function useOrderFilters() {
  const activeStatFilter = ref<'total' | 'paid' | 'verified' | 'refunded' | null>(null)
  const filterParams = reactive<FilterParams>({
    status: '' as MerchantOrderStatus | '',
    dateRange: [] as string[],
    search: '',
    sortBy: 'createdAt' as 'createdAt' | 'paidAt' | 'verifiedAt' | 'refundedAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  /**
   * 前端排序订单（确保排序正确）
   */
  const sortOrders = (orders: MerchantOrder[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    return [...orders].sort((a, b) => {
      let dateA: Date | null = null
      let dateB: Date | null = null

      switch (sortBy) {
        case 'paidAt':
          // 已支付：按支付时间排序，如果没有支付时间则使用创建时间
          dateA = a.paidAt ? new Date(a.paidAt) : (a.createdAt ? new Date(a.createdAt) : null)
          dateB = b.paidAt ? new Date(b.paidAt) : (b.createdAt ? new Date(b.createdAt) : null)
          break
        case 'verifiedAt':
          // 已核销：按核销时间排序，如果没有核销时间则使用创建时间
          dateA = a.verifiedAt ? new Date(a.verifiedAt) : (a.createdAt ? new Date(a.createdAt) : null)
          dateB = b.verifiedAt ? new Date(b.verifiedAt) : (b.createdAt ? new Date(b.createdAt) : null)
          break
        case 'refundedAt':
          // 已退款：按退款时间排序，如果没有退款时间则使用创建时间
          dateA = a.refundedAt ? new Date(a.refundedAt) : (a.createdAt ? new Date(a.createdAt) : null)
          dateB = b.refundedAt ? new Date(b.refundedAt) : (b.createdAt ? new Date(b.createdAt) : null)
          break
        case 'createdAt':
        default:
          // 总订单：按创建时间排序
          dateA = a.createdAt ? new Date(a.createdAt) : null
          dateB = b.createdAt ? new Date(b.createdAt) : null
          break
      }

      // 处理空值：没有对应时间的订单排在后面
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1

      // 倒序排列（最新的在前）
      if (sortOrder === 'desc') {
        return dateB.getTime() - dateA.getTime()
      } else {
        return dateA.getTime() - dateB.getTime()
      }
    })
  }

  /**
   * 根据统计项过滤订单
   */
  const filterByStat = (statType: 'total' | 'paid' | 'verified' | 'refunded') => {
    // 如果点击的是当前已选中的统计项，则取消筛选
    if (activeStatFilter.value === statType) {
      activeStatFilter.value = null
      filterParams.status = ''
      filterParams.sortBy = 'createdAt'
      filterParams.sortOrder = 'desc'
    } else {
      activeStatFilter.value = statType
      
      // 根据统计类型设置排序（不设置 status，因为过滤只在前端进行）
      switch (statType) {
        case 'total':
          // 总订单：排除已取消，按创建时间倒序
          filterParams.status = '' // 不传 status 给 API，前端过滤排除已取消
          filterParams.sortBy = 'createdAt'
          filterParams.sortOrder = 'desc'
          break
        case 'paid':
          // 已支付：前端过滤，按支付时间倒序
          filterParams.status = '' // 不传 status 给 API，前端过滤已支付状态
          filterParams.sortBy = 'paidAt'
          filterParams.sortOrder = 'desc'
          break
        case 'verified':
          // 已核销：前端过滤，按核销时间倒序
          filterParams.status = '' // 不传 status 给 API，前端过滤已核销状态
          filterParams.sortBy = 'verifiedAt'
          filterParams.sortOrder = 'desc'
          break
        case 'refunded':
          // 已退款：前端过滤，按退款时间倒序
          filterParams.status = '' // 不传 status 给 API，前端过滤已退款状态
          filterParams.sortBy = 'refundedAt'
          filterParams.sortOrder = 'desc'
          break
      }
    }
  }

  /**
   * 应用筛选
   */
  const onFilterSubmit = () => {
    // 筛选弹窗中的状态筛选会传递给 API
    // 使用筛选弹窗时，清空统计按钮的过滤
    activeStatFilter.value = null
  }

  /**
   * 重置筛选
   */
  const resetFilter = () => {
    filterParams.status = ''
    filterParams.dateRange = []
    filterParams.search = ''
    filterParams.sortBy = 'createdAt'
    filterParams.sortOrder = 'desc'
    activeStatFilter.value = null
  }

  /**
   * 前端过滤订单（根据 activeStatFilter 或 filterParams.status）
   */
  const filterOrders = (orders: MerchantOrder[]): MerchantOrder[] => {
    if (orders.length === 0) return orders

    let filtered = [...orders]

    // 根据当前筛选类型进行前端过滤
    if (activeStatFilter.value === 'total') {
      // 总订单：排除已取消的订单
      filtered = filtered.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status !== 'cancelled' && status !== 'CANCELLED'
      })
    } else if (activeStatFilter.value === 'paid') {
      // 已支付：只筛选 paid 和 pending_verification 状态，不包括 pending（待支付）
      filtered = filtered.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status === 'paid' || status === 'pending_verification' || 
               status === 'PAID' || status === 'PENDING_VERIFICATION'
      })
    } else if (activeStatFilter.value === 'verified') {
      // 已核销：筛选 verified、completed 状态
      filtered = filtered.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status === 'verified' || status === 'completed' || 
               status === 'VERIFIED' || status === 'COMPLETED'
      })
    } else if (activeStatFilter.value === 'refunded') {
      // 已退款：筛选 refunded、refund_requested 状态
      filtered = filtered.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status === 'refunded' || status === 'refund_requested' || 
               status === 'REFUNDED' || status === 'REFUND_REQUESTED'
      })
    } else if (filterParams.status) {
      // 如果是在筛选弹窗中选择了状态，则按状态过滤
      filtered = filtered.filter(order => {
        const status = order.status?.toLowerCase() || ''
        const filterStatus = filterParams.status?.toLowerCase() || ''
        return status === filterStatus
      })
    }

    // 排序
    return sortOrders(filtered, filterParams.sortBy, filterParams.sortOrder)
  }

  /**
   * 构建 API 请求参数
   */
  const buildApiParams = () => {
    return {
      // 只有在筛选弹窗中选择了状态时才传递 status 参数
      // 统计按钮的过滤不传递 status，因为我们要获取所有订单然后前端过滤
      status: (activeStatFilter.value === null && filterParams.status) ? filterParams.status : undefined,
      search: filterParams.search || undefined,
      dateRange:
        filterParams.dateRange.length > 0
          ? {
              startDate: filterParams.dateRange[0],
              endDate: filterParams.dateRange[1]
            }
          : undefined,
      sortBy: filterParams.sortBy,
      sortOrder: filterParams.sortOrder
    }
  }

  return {
    activeStatFilter,
    filterParams,
    filterByStat,
    onFilterSubmit,
    resetFilter,
    filterOrders,
    sortOrders,
    buildApiParams
  }
}
