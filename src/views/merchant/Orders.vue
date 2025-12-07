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
    <OrderStats
      :stats="orderStats"
      :active-stat-filter="activeStatFilter"
      @filter="handleFilterByStat"
    />

    <!-- 订单列表 -->
    <div class="order-list">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="handleLoadOrders"
        :error.sync="error"
        error-text="加载失败，点击重试"
      >
        <OrderCard
          v-for="order in orderList"
          :key="order.id"
          :order="order"
          @view-detail="viewOrderDetail"
          @verify="handleVerifyOrder"
          @cancel="handleCancelOrder"
        />
      </van-list>
    </div>

    <!-- 筛选弹窗 -->
    <OrderFilterPopup
      v-model="showFilterPopup"
      :filter-params="filterParams"
      :status-options="statusOptions"
      @submit="handleFilterSubmit"
      @reset="handleResetFilter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { MerchantOrderStatus } from '@/types'
import OrderStats from '@/components/merchant/OrderStats.vue'
import OrderCard from '@/components/merchant/OrderCard.vue'
import OrderFilterPopup from '@/components/merchant/OrderFilterPopup.vue'
import { useOrderList } from '@/composables/useOrderList'
import { useOrderStats } from '@/composables/useOrderStats'
import { useOrderFilters } from '@/composables/useOrderFilters'
import { useOrderOperations } from '@/composables/useOrderOperations'

// 状态选项
const statusOptions = [
  { text: '全部', value: '' as MerchantOrderStatus | '' },
  { text: '待核销', value: 'pending_verification' as MerchantOrderStatus },
  { text: '已核销', value: 'verified' as MerchantOrderStatus },
  { text: '已完成', value: 'completed' as MerchantOrderStatus },
  { text: '已取消', value: 'cancelled' as MerchantOrderStatus },
  { text: '已退款', value: 'refunded' as MerchantOrderStatus }
]

// 筛选弹窗显示状态
const showFilterPopup = ref(false)

// 使用 composables
const { orderStats, loadOrderStats } = useOrderStats()
const {
  activeStatFilter,
  filterParams,
  filterByStat,
  onFilterSubmit,
  resetFilter,
  filterOrders,
  buildApiParams
} = useOrderFilters()
const {
  orderList,
  loading,
  finished,
  error,
  loadOrders,
  refreshOrders
} = useOrderList()
const { verifyOrder: verifyOrderOp, cancelOrder: cancelOrderOp } = useOrderOperations()

// 路由
const router = useRouter()

// 加载订单列表
const handleLoadOrders = () => {
  loadOrders(filterParams, activeStatFilter.value, filterOrders)
  
  // 只在第一次加载时异步更新统计（不阻塞订单列表显示）
  if (orderList.value.length === 0) {
    // 异步加载统计，不阻塞订单列表显示
    loadOrderStats().catch(err => {
      console.error('Failed to load order stats:', err)
    })
  }
}

// 根据统计项过滤订单
const handleFilterByStat = (statType: 'total' | 'paid' | 'verified' | 'refunded') => {
  filterByStat(statType)
  refreshOrders(filterParams, activeStatFilter.value, filterOrders)
}

// 筛选提交
const handleFilterSubmit = (params: typeof filterParams) => {
  // 更新 filterParams
  Object.assign(filterParams, params)
  onFilterSubmit()
  refreshOrders(filterParams, activeStatFilter.value, filterOrders, loadOrderStats)
  showFilterPopup.value = false
}

// 重置筛选
const handleResetFilter = () => {
  resetFilter()
  refreshOrders(filterParams, activeStatFilter.value, filterOrders, loadOrderStats)
  showFilterPopup.value = false
}

// 查看订单详情
const handleBack = () => {
  router.back()
}

const viewOrderDetail = (orderId: string) => {
  router.push(`/merchant/orders/${orderId}`)
}

// 核销订单
const handleVerifyOrder = async (orderId: string) => {
  await verifyOrderOp(orderId, () => {
    // 刷新订单列表（核销后需要更新统计）
    refreshOrders(filterParams, activeStatFilter.value, filterOrders, loadOrderStats)
  })
}

// 取消订单
const handleCancelOrder = async (orderId: string) => {
  await cancelOrderOp(orderId, () => {
    // 刷新订单列表（取消后需要更新统计）
    refreshOrders(filterParams, activeStatFilter.value, filterOrders, loadOrderStats)
  })
}

// 生命周期钩子
onMounted(() => {
  // 先加载订单列表（立即显示），再异步加载统计（不阻塞）
  handleLoadOrders()
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

.order-list {
  padding: 0 15px;
}

@media (max-width: 375px) {
  .order-list {
    padding: 0 10px;
  }
}
</style>
