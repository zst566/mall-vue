<template>
  <div class="merchant-orders">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="订单管理"
      left-arrow
      @click-left="handleBack"
      fixed
      z-index="100"
    >
      <template #right>
        <van-icon name="filter" @click="showFilterPopup = true" />
      </template>
    </van-nav-bar>

    <!-- 订单统计 -->
    <div class="order-stats">
      <div class="stats-container">
        <div 
          class="stat-item" 
          :class="{ active: activeStatFilter === 'total' }"
          @click="filterByStat('total')"
        >
          <div class="stat-info">
            <div class="stat-number">{{ formatStatNumber(orderStats.total || 0) }}</div>
            <div class="stat-label">总订单</div>
          </div>
        </div>
        <div 
          class="stat-item" 
          :class="{ active: activeStatFilter === 'paid' }"
          @click="filterByStat('paid')"
        >
          <div class="stat-info">
            <div class="stat-number">{{ formatStatNumber(orderStats.paid || 0) }}</div>
            <div class="stat-label">已支付</div>
          </div>
        </div>
        <div 
          class="stat-item" 
          :class="{ active: activeStatFilter === 'verified' }"
          @click="filterByStat('verified')"
        >
          <div class="stat-info">
            <div class="stat-number">{{ formatStatNumber(orderStats.verified || 0) }}</div>
            <div class="stat-label">已核销</div>
          </div>
        </div>
        <div 
          class="stat-item" 
          :class="{ active: activeStatFilter === 'refunded' }"
          @click="filterByStat('refunded')"
        >
          <div class="stat-info">
            <div class="stat-number">{{ formatStatNumber(orderStats.refunded || 0) }}</div>
            <div class="stat-label">已退款</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="order-list">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadOrders"
        :error.sync="error"
        error-text="加载失败，点击重试"
      >
        <div
          v-for="order in orderList"
          :key="order.id"
          class="order-card"
          @click="viewOrderDetail(order.id)"
        >
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderNo }}</span>
            <span :class="['order-status', normalizeStatusClass(order.status)]">
              {{ formatStatus(order.status) }}
            </span>
          </div>

          <div class="order-content">
            <div class="order-info">
              <div class="order-meta">
                <span>{{ formatTime(order.createdAt) }}</span>
                <span>客户: {{ order.customerName || '未知客户' }}</span>
              </div>

              <div class="order-items" v-if="order.items && order.items.length > 0">
                <div v-for="item in order.items.slice(0, 2)" :key="item.id" class="item-preview">
                  <span class="item-name">{{ item.productName }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span>
                </div>
                <div v-if="order.items.length > 2" class="more-items">
                  +{{ order.items.length - 2 }} 个商品
                </div>
              </div>
            </div>

            <div class="order-footer">
              <div class="order-amount">
                <span class="amount-label">金额:</span>
                <span class="amount-value">¥{{ formatAmount(order.totalAmount) }}</span>
              </div>

              <div class="order-actions">
                <van-button
                  v-if="order.status === 'pending_verification'"
                  size="small"
                  type="primary"
                  @click.stop="verifyOrder(order.id)"
                >
                  核销
                </van-button>

                <van-button
                  v-if="order.status === 'pending_verification'"
                  size="small"
                  type="warning"
                  @click.stop="cancelOrder(order.id)"
                >
                  取消
                </van-button>

                <van-button
                  v-if="order.status === 'verified'"
                  size="small"
                  @click.stop="viewOrderDetail(order.id)"
                >
                  查看详情
                </van-button>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </div>

    <!-- 筛选弹窗 -->
    <van-popup
      v-model:show="showFilterPopup"
      position="bottom"
      closeable
      round
      :style="{ height: '60%' }"
    >
      <div class="filter-popup">
        <h3>筛选订单</h3>

        <van-form @submit="onFilterSubmit">
          <!-- 状态筛选 -->
          <van-field name="status" label="订单状态" :rules="[{ required: false }]">
            <template #input>
              <van-picker
                v-model="filterParams.status as any"
                :columns="statusOptions"
                @confirm="onStatusConfirm"
                @cancel="onStatusCancel"
                :show-toolbar="false"
              />
            </template>
          </van-field>

          <!-- 时间范围 -->
          <van-field name="dateRange" label="时间范围" :rules="[{ required: false }]">
            <template #input>
              <van-field
                v-model="filterParams.dateRange as any"
                placeholder="选择时间范围"
                readonly
                @click="showDatePicker = true"
              />
            </template>
          </van-field>

          <!-- 搜索 -->
          <van-field
            v-model="filterParams.search"
            label="搜索"
            placeholder="输入订单号或客户名称"
            :rules="[{ required: false }]"
          />

          <div class="filter-actions">
            <van-button block type="primary" @click="onFilterSubmit">应用筛选</van-button>
            <van-button block @click="resetFilter">重置筛选</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { showToast, showLoadingToast } from 'vant'
  import { merchantService } from '@/services/merchant'
  import { useRouter } from 'vue-router'
  import type { MerchantOrder, MerchantOrderStatus } from '@/types'
  import { formatMoney } from '@/utils/format'

  // 订单列表
  const orderList = ref<MerchantOrder[]>([])
  const loading = ref(false)
  const finished = ref(false)
  const error = ref(false)

  // 订单统计（独立获取，不受过滤影响）
  const orderStats = ref({
    total: 0,
    paid: 0,
    verified: 0,
    refunded: 0
  })

  // 筛选相关
  const showFilterPopup = ref(false)
  const showDatePicker = ref(false)
  const activeStatFilter = ref<'total' | 'paid' | 'verified' | 'refunded' | null>(null)
  const filterParams = reactive({
    status: '' as MerchantOrderStatus | '',
    dateRange: [] as string[],
    search: '',
    sortBy: 'createdAt' as 'createdAt' | 'paidAt' | 'verifiedAt' | 'refundedAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  // 状态选项
  const statusOptions = [
    { text: '全部', value: '' as MerchantOrderStatus | '' },
    { text: '待核销', value: 'pending_verification' as MerchantOrderStatus },
    { text: '已核销', value: 'verified' as MerchantOrderStatus },
    { text: '已完成', value: 'completed' as MerchantOrderStatus },
    { text: '已取消', value: 'cancelled' as MerchantOrderStatus },
    { text: '已退款', value: 'refunded' as MerchantOrderStatus }
  ]

  // 日期范围
  const minDate = new Date(2024, 0, 1)
  const maxDate = new Date()

  // 分页参数
  const pagination = reactive({
    page: 1,
    limit: 20,
    total: 0
  })

  // 自动加载标记（用于过滤后无数据时自动加载下一页）
  const autoLoadingRef = ref(false)

  // 工具方法
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: '待支付',
      paid: '已支付',
      pending_verification: '待核销',
      verified: '已核销',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款',
      refund_requested: '退款中',
      // 处理大写状态
      PENDING: '待支付',
      PAID: '已支付',
      PENDING_VERIFICATION: '待核销',
      VERIFIED: '已核销',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      REFUNDED: '已退款',
      REFUND_REQUESTED: '退款中'
    }
    return statusMap[status] || status
  }

  // 格式化统计数字（最大显示99+）
  const formatStatNumber = (num: number): string => {
    if (num > 99) {
      return '99+'
    }
    return num.toString()
  }

  // 规范化状态类名（用于CSS类名）
  const normalizeStatusClass = (status: string): string => {
    if (!status) return ''
    // 将大写状态转换为小写，并处理下划线
    return status.toLowerCase().replace(/_/g, '_')
  }

  const formatTime = (time: string): string => {
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化金额（统一使用 formatMoney，包含千分位分隔符）
  const formatAmount = formatMoney

  // 加载订单列表
  const loadOrders = async () => {
    if (loading.value || finished.value) return

    loading.value = true
    error.value = false

    try {
      // 构建 API 请求参数（不包含状态过滤，除非是筛选弹窗中的状态筛选）
      // 注意：统计按钮的过滤只在前端进行，不传递给 API
      const params = {
        page: pagination.page,
        limit: pagination.limit,
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

      const response = await merchantService.getMerchantOrders(params as any)

      // 前端排序和过滤
      let orders = response.orders || []
      if (orders.length > 0) {
        // 根据当前筛选类型进行前端过滤
        if (activeStatFilter.value === 'total') {
          // 总订单：排除已取消的订单
          orders = orders.filter(order => {
            const status = order.status?.toLowerCase() || ''
            return status !== 'cancelled' && status !== 'CANCELLED'
          })
        } else if (activeStatFilter.value === 'paid') {
          // 已支付：筛选 paid、pending_verification、pending 状态
          orders = orders.filter(order => {
            const status = order.status?.toLowerCase() || ''
            return status === 'paid' || status === 'pending_verification' || status === 'pending' || 
                   status === 'PAID' || status === 'PENDING_VERIFICATION' || status === 'PENDING'
          })
        } else if (activeStatFilter.value === 'verified') {
          // 已核销：筛选 verified、completed 状态
          orders = orders.filter(order => {
            const status = order.status?.toLowerCase() || ''
            return status === 'verified' || status === 'completed' || 
                   status === 'VERIFIED' || status === 'COMPLETED'
          })
        } else if (activeStatFilter.value === 'refunded') {
          // 已退款：筛选 refunded、refund_requested 状态
          orders = orders.filter(order => {
            const status = order.status?.toLowerCase() || ''
            return status === 'refunded' || status === 'refund_requested' || 
                   status === 'REFUNDED' || status === 'REFUND_REQUESTED'
          })
        } else if (filterParams.status) {
          // 如果是在筛选弹窗中选择了状态，则按状态过滤
          orders = orders.filter(order => {
            const status = order.status?.toLowerCase() || ''
            const filterStatus = filterParams.status?.toLowerCase() || ''
            return status === filterStatus
          })
        }
        
        // 排序
        orders = sortOrders(orders, filterParams.sortBy, filterParams.sortOrder)
      }

      // 更新总数（如果进行了前端过滤，需要调整总数）
      // 注意：由于分页的原因，前端过滤后的总数可能不准确
      // 但这是为了用户体验的折中方案
      let adjustedTotal = response.total
      if (activeStatFilter.value && orders.length !== response.orders.length) {
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
      } else if (activeStatFilter.value) {
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
                  loadOrders()
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

      // 只在第一次加载时异步更新统计（不阻塞订单列表显示）
      if (pagination.page === 2) {
        // 异步加载统计，不阻塞订单列表显示
        loadOrderStats().catch(err => {
          console.error('Failed to load order stats:', err)
        })
      }
    } catch (err) {
      error.value = true
      showToast('加载订单失败')
      console.error('Failed to load orders:', err)
    } finally {
      loading.value = false
    }
  }

  // 前端排序订单（确保排序正确）
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

  // 加载订单统计（独立获取，不受过滤影响）
  // 改为按需分页读取，而不是一次性读取 1000 条
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

      // 统计已支付订单（包括 paid、pending_verification、pending 状态）
      const paidOrders = allOrdersForStats.filter(order => {
        const status = order.status?.toLowerCase() || ''
        return status === 'paid' || status === 'pending_verification' || status === 'pending' ||
               status === 'PAID' || status === 'PENDING_VERIFICATION' || status === 'PENDING'
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

  // 查看订单详情
  const router = useRouter()
  const handleBack = () => {
    router.back()
  }
  const viewOrderDetail = (orderId: string) => {
    router.push(`/merchant/orders/${orderId}`)
  }

  // 核销订单
  const verifyOrder = async (orderId: string) => {
    showLoadingToast({
      message: '正在核销...',
      forbidClick: true,
      duration: 1000
    })

    try {
      const response = await merchantService.verifyOrder(orderId)

      showToast({
        message: '核销成功',
        type: 'success'
      })

      // 刷新订单列表（核销后需要更新统计）
      refreshOrders(true)
    } catch (error) {
      showToast('核销失败')
      console.error('Failed to verify order:', error)
    }
  }

  // 取消订单
  const cancelOrder = async (orderId: string) => {
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

      // 刷新订单列表（取消后需要更新统计）
      refreshOrders(true)
    } catch (error) {
      showToast('取消失败')
      console.error('Failed to cancel order:', error)
    }
  }

  // 刷新订单列表
  const refreshOrders = (updateStats: boolean = false) => {
    pagination.page = 1
    finished.value = false
    orderList.value = []
    autoLoadingRef.value = false // 重置自动加载标记
    if (updateStats) {
      // 如果订单状态发生变化（如核销、取消），需要更新统计
      loadOrderStats().then(() => {
        loadOrders()
      })
    } else {
      loadOrders()
    }
  }

  // 根据统计项过滤订单
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
    
    // 刷新订单列表
    refreshOrders()
  }

  // 筛选相关方法
  const onFilterSubmit = () => {
    // 筛选弹窗中的状态筛选会传递给 API
    // 使用筛选弹窗时，清空统计按钮的过滤
    activeStatFilter.value = null
    refreshOrders(false) // 筛选不更新统计
    showFilterPopup.value = false
  }

  const resetFilter = () => {
    filterParams.status = ''
    filterParams.dateRange = []
    filterParams.search = ''
    filterParams.sortBy = 'createdAt'
    filterParams.sortOrder = 'desc'
    activeStatFilter.value = null
    refreshOrders(false) // 重置筛选不更新统计
    showFilterPopup.value = false
  }

  // 状态选择相关
  const onStatusConfirm = () => {
    showFilterPopup.value = false
  }

  const onStatusCancel = () => {
    filterParams.status = ''
    showFilterPopup.value = false
  }

  const onDateConfirm = () => {
    showFilterPopup.value = false
  }

  const onDateCancel = () => {
    filterParams.dateRange = []
    showFilterPopup.value = false
  }

  // 生命周期钩子
  onMounted(() => {
    // 先加载订单列表（立即显示），再异步加载统计（不阻塞）
    loadOrders()
    // 异步加载统计，不阻塞订单列表显示
    loadOrderStats().catch(err => {
      console.error('Failed to load order stats:', err)
    })
  })
</script>

<style scoped lang="scss">
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .merchant-orders {
    padding-top: 46px;
    background: var(--theme-bg-gradient, $glass-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
    min-height: 100vh;
  }

  .order-stats {
    @include glassmorphism-card(base);
    padding: 15px;
    margin: 0 15px 15px;
  }

  .stats-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;

    &:active {
      transform: scale(0.95);
    }

    &.active {
      background: linear-gradient(135deg, #3A82F6 0%, #2563EB 100%);
      box-shadow: 0 2px 8px rgba(58, 130, 246, 0.3);

      .stat-number,
      .stat-label {
        color: white;
      }
    }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-number {
    font-size: 18px;
    font-weight: bold;
    color: var(--theme-text-on-glass, $text-color-primary);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 12px;
    color: var(--theme-text-secondary, $text-color-secondary);
    line-height: 1.2;
  }

  .order-list {
    padding: 0 15px;
  }

  .order-card {
    @include glassmorphism-card(base);
    margin-bottom: 15px;
    cursor: pointer;
  }

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid #f0f0f0;
  }

  .order-no {
    font-size: 14px;
    font-weight: 500;
    color: var(--theme-text-on-glass, $text-color-primary);
  }

  .order-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
    text-transform: lowercase;
  }

  .order-status.pending,
  .order-status.PENDING {
    background: #fef3c7;
    color: #92400e;
  }

  .order-status.paid,
  .order-status.PAID {
    background: #dbeafe;
    color: #1e40af;
  }

  .order-status.pending_verification,
  .order-status.PENDING_VERIFICATION {
    background: #fef3c7;
    color: #92400e;
  }

  .order-status.verified,
  .order-status.VERIFIED {
    background: #d1fae5;
    color: #065f46;
  }

  .order-status.completed,
  .order-status.COMPLETED {
    background: #d1fae5;
    color: #065f46;
  }

  .order-status.cancelled,
  .order-status.CANCELLED {
    background: #fee2e2;
    color: #991b1b;
  }

  .order-status.refunded,
  .order-status.REFUNDED {
    background: #e0e7ff;
    color: #3730a3;
  }

  .order-status.refund_requested,
  .order-status.REFUND_REQUESTED {
    background: #fef3c7;
    color: #92400e;
  }

  .order-content {
    padding: 15px;
  }

  .order-info {
    margin-bottom: 12px;
  }

  .order-meta {
    display: flex;
    gap: 15px;
    font-size: 13px;
    color: var(--theme-text-secondary, $text-color-secondary);
    margin-bottom: 8px;
  }

  .order-items {
    margin-bottom: 8px;
  }

  .item-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 13px;
    color: var(--theme-text-on-glass, $text-color-primary);
  }

  .more-items {
    font-size: 12px;
    color: var(--theme-text-tertiary, $text-color-tertiary);
    text-align: center;
    padding: 4px 0;
  }

  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
  }

  .order-amount {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .amount-label {
    font-size: 14px;
    color: var(--theme-text-secondary, $text-color-secondary);
  }

  .amount-value {
    font-size: 16px;
    font-weight: bold;
    color: var(--theme-text-on-glass, $text-color-primary);
  }

  .order-actions {
    display: flex;
    gap: 8px;
  }

  .filter-popup {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }

  .filter-popup h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
  }

  .filter-actions {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  @media (max-width: 375px) {
    .stats-container {
      grid-template-columns: repeat(2, 1fr);
    }

    .order-stats {
      margin: 0 10px 10px;
    }

    .order-list {
      padding: 0 10px;
    }
  }
</style>
