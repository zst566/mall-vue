/**
 * 订单列表 Composable
 */
import { ref, reactive } from 'vue'
import { showToast } from 'vant'
import { merchantService } from '@/services/merchant'
import type { MerchantOrder } from '@/types'
import type { FilterParams } from './useOrderFilters'

export function useOrderList() {
  // 订单列表
  const orderList = ref<MerchantOrder[]>([])
  const loading = ref(false)
  const finished = ref(false)
  const error = ref(false)

  // 分页参数
  const pagination = reactive({
    page: 1,
    limit: 20,
    total: 0
  })

  // 自动加载标记（用于过滤后无数据时自动加载下一页）
  const autoLoadingRef = ref(false)

  /**
   * 加载订单列表
   */
  const loadOrders = async (
    filterParams: FilterParams,
    activeStatFilter: 'total' | 'paid' | 'verified' | 'refunded' | null,
    filterOrdersFn: (orders: MerchantOrder[]) => MerchantOrder[]
  ) => {
    if (loading.value || finished.value) return

    loading.value = true
    error.value = false

    try {
      // 构建 API 请求参数
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        // 只有在筛选弹窗中选择了状态时才传递 status 参数
        status: (activeStatFilter === null && filterParams.status) ? filterParams.status : undefined,
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

      const response = await merchantService.getMerchantOrders(params as any)

      // 前端排序和过滤
      let orders = filterOrdersFn(response.orders || [])

      // 更新总数（如果进行了前端过滤，需要调整总数）
      // 注意：由于分页的原因，前端过滤后的总数可能不准确
      // 但这是为了用户体验的折中方案
      let adjustedTotal = response.total
      if (activeStatFilter && orders.length !== response.orders.length) {
        // 如果前端进行了过滤，总数需要根据过滤后的结果调整
        // 这是一个近似值，因为分页的原因，实际总数可能不准确
        // 如果过滤后的数量等于原始数量且等于每页限制，说明可能还有更多数据
        if (orders.length === response.orders.length && orders.length === pagination.limit) {
          // 保持原始总数，表示可能还有更多数据
          adjustedTotal = response.total
        } else {
          // 如果过滤后数量减少，说明当前页已经过滤完成
          // 但无法确定是否还有更多数据，所以保持原始总数
          adjustedTotal = response.total
        }
      }

      if (pagination.page === 1) {
        orderList.value = orders
      } else {
        orderList.value = [...orderList.value, ...orders]
      }

      pagination.total = adjustedTotal
      pagination.page++

      // 判断是否加载完成
      // 核心逻辑：如果当前页返回的订单数量少于每页限制，说明已经加载完所有数据
      if (response.orders.length < pagination.limit) {
        // API 返回的数据少于每页限制，说明已经没有更多数据了
        finished.value = true
        autoLoadingRef.value = false // 停止自动加载
      } else if (activeStatFilter) {
        // 如果进行了前端过滤
        // 如果过滤后的数量为0但原始数据还有，说明当前页没有符合条件的数据
        if (orders.length === 0 && response.orders.length > 0) {
          // 当前页过滤后没有数据，但原始数据还有
          // 如果已经加载了很多页（例如 10 页）都没有符合条件的数据，停止加载
          if (pagination.page > 10) {
            finished.value = true
            autoLoadingRef.value = false
          } else {
            // 继续加载，如果当前没有在自动加载，则自动加载下一页
            finished.value = false
            if (!autoLoadingRef.value) {
              autoLoadingRef.value = true
              // 延迟一下再加载，避免过于频繁的请求
              setTimeout(() => {
                if (!finished.value && !loading.value && autoLoadingRef.value) {
                  loadOrders(filterParams, activeStatFilter, filterOrdersFn)
                }
              }, 200)
            }
          }
        } else {
          // 过滤后有数据，停止自动加载
          autoLoadingRef.value = false
          // 过滤后有数据，继续判断
          // 如果已经加载的数据量达到或超过总数，说明加载完成
          if (orderList.value.length >= adjustedTotal) {
            finished.value = true
          } else {
            // 还有更多数据，继续加载
            finished.value = false
          }
        }
      } else {
        // 没有前端过滤，停止自动加载
        autoLoadingRef.value = false
        // 没有前端过滤，直接判断是否加载完
        // 如果已经加载的数据量达到或超过总数，或者当前页返回的数据少于每页限制，说明加载完成
        if (orderList.value.length >= adjustedTotal || response.orders.length < pagination.limit) {
          finished.value = true
        } else {
          finished.value = false
        }
      }
    } catch (err) {
      error.value = true
      showToast('加载订单失败')
      console.error('Failed to load orders:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新订单列表
   */
  const refreshOrders = (
    filterParams: FilterParams,
    activeStatFilter: 'total' | 'paid' | 'verified' | 'refunded' | null,
    filterOrdersFn: (orders: MerchantOrder[]) => MerchantOrder[],
    updateStats?: () => Promise<void>
  ) => {
    pagination.page = 1
    finished.value = false
    orderList.value = []
    autoLoadingRef.value = false // 重置自动加载标记
    if (updateStats) {
      // 如果订单状态发生变化（如核销、取消），需要更新统计
      updateStats().then(() => {
        loadOrders(filterParams, activeStatFilter, filterOrdersFn)
      })
    } else {
      loadOrders(filterParams, activeStatFilter, filterOrdersFn)
    }
  }

  return {
    orderList,
    loading,
    finished,
    error,
    pagination,
    autoLoadingRef,
    loadOrders,
    refreshOrders
  }
}



