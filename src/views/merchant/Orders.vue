<template>
  <div class="merchant-orders">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="订单管理"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
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
        <div class="stat-item">
          <div class="stat-icon">
            <van-icon name="orders" size="20" color="#3A82F6" />
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ orderStats.total || 0 }}</div>
            <div class="stat-label">总订单</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <van-icon name="waiting" size="20" color="#F59E0B" />
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ orderStats.pending || 0 }}</div>
            <div class="stat-label">待核销</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <van-icon name="success" size="20" color="#10B981" />
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ orderStats.completed || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <van-icon name="close" size="20" color="#EF4444" />
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ orderStats.cancelled || 0 }}</div>
            <div class="stat-label">已取消</div>
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
            <span :class="['order-status', order.status]">
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

  // 订单列表
  const orderList = ref<MerchantOrder[]>([])
  const loading = ref(false)
  const finished = ref(false)
  const error = ref(false)

  // 订单统计
  const orderStats = ref({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  })

  // 筛选相关
  const showFilterPopup = ref(false)
  const showDatePicker = ref(false)
  const filterParams = reactive({
    status: '' as MerchantOrderStatus | '',
    dateRange: [] as string[],
    search: ''
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

  // 工具方法
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending_verification: '待核销',
      verified: '已核销',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款'
    }
    return statusMap[status] || status
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

  const formatAmount = (amount: number): string => {
    return amount.toFixed(2)
  }

  // 加载订单列表
  const loadOrders = async () => {
    if (loading.value || finished.value) return

    loading.value = true
    error.value = false

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filterParams.status || undefined,
        search: filterParams.search || undefined,
        dateRange:
          filterParams.dateRange.length > 0
            ? {
                startDate: filterParams.dateRange[0],
                endDate: filterParams.dateRange[1]
              }
            : undefined
      }

      const response = await merchantService.getMerchantOrders(params as any)

      if (pagination.page === 1) {
        orderList.value = response.orders
      } else {
        orderList.value = [...orderList.value, ...response.orders]
      }

      pagination.total = response.total
      pagination.page++

      if (orderList.value.length >= response.total) {
        finished.value = true
      }

      // 更新统计
      updateOrderStats(response)
    } catch (err) {
      error.value = true
      showToast('加载订单失败')
      console.error('Failed to load orders:', err)
    } finally {
      loading.value = false
    }
  }

  // 更新订单统计
  const updateOrderStats = (response: any) => {
    // 这里可以根据实际API响应的统计数据来更新
    // 目前使用分页数据的统计
    orderStats.value = {
      total: response.total,
      pending: orderList.value.filter(order => order.status === 'pending_verification').length,
      completed: orderList.value.filter(order => order.status === 'completed').length,
      cancelled: orderList.value.filter(order => order.status === 'cancelled').length
    }
  }

  // 查看订单详情
  const router = useRouter()
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

      // 刷新订单列表
      refreshOrders()
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

      // 刷新订单列表
      refreshOrders()
    } catch (error) {
      showToast('取消失败')
      console.error('Failed to cancel order:', error)
    }
  }

  // 刷新订单列表
  const refreshOrders = () => {
    pagination.page = 1
    finished.value = false
    orderList.value = []
    loadOrders()
  }

  // 筛选相关方法
  const onFilterSubmit = () => {
    refreshOrders()
    showFilterPopup.value = false
  }

  const resetFilter = () => {
    filterParams.status = ''
    filterParams.dateRange = []
    filterParams.search = ''
    refreshOrders()
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
    loadOrders()
  })
</script>

<style scoped lang="scss">
  .merchant-orders {
    padding-top: 120px;
    background-color: #f5f5f5;
    min-height: 100vh;
  }

  .order-stats {
    background: white;
    padding: 15px;
    margin: 0 15px 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .stats-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 6px;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 50%;
  }

  .stat-info {
    flex: 1;
  }

  .stat-number {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    line-height: 1;
  }

  .stat-label {
    font-size: 12px;
    color: #666;
    line-height: 1;
  }

  .order-list {
    padding: 0 15px;
  }

  .order-card {
    background: white;
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: box-shadow 0.2s;
  }

  .order-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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
    color: #333;
  }

  .order-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
  }

  .order-status.pending_verification {
    background: #fef3c7;
    color: #92400e;
  }

  .order-status.verified {
    background: #d1fae5;
    color: #065f46;
  }

  .order-status.completed {
    background: #d1fae5;
    color: #065f46;
  }

  .order-status.cancelled {
    background: #fee2e2;
    color: #991b1b;
  }

  .order-status.refunded {
    background: #e0e7ff;
    color: #3730a3;
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
    color: #666;
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
    color: #333;
  }

  .more-items {
    font-size: 12px;
    color: #999;
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
    color: #666;
  }

  .amount-value {
    font-size: 16px;
    font-weight: bold;
    color: #333;
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
