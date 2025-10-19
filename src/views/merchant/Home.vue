<template>
  <div class="merchant-home">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="商户中心"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      fixed
      z-index="100"
    >
      <template #right>
        <van-icon name="user-o" @click="goToProfile" />
      </template>
    </van-nav-bar>

    <!-- 商户信息卡片 -->
    <div class="merchant-info-card">
      <div class="merchant-avatar">
        <van-image
          round
          :src="merchantInfo.avatar || '/images/merchant-avatar.png'"
          width="80"
          height="80"
        />
      </div>
      <div class="merchant-details">
        <h2 class="merchant-name">{{ merchantInfo.name || '商户名称' }}</h2>
        <p class="merchant-id">商户ID: {{ merchantInfo.id }}</p>
        <div class="merchant-stats">
          <span class="stat-item">
            <strong>{{ merchantStats.todayOrders || 0 }}</strong>
            <span class="stat-label">今日订单</span>
          </span>
          <span class="stat-item">
            <strong>{{ merchantStats.todayAmount || 0 }}</strong>
            <span class="stat-label">今日营收</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 快捷功能入口 -->
    <div class="quick-actions">
      <div class="action-section">
        <h3>订单管理</h3>
        <div class="action-grid">
          <van-grid :column-num="3" gutter="10">
            <van-grid-item
              icon="scan"
              text="扫码核销"
              @click="goToScan"
              :badge="newOrdersCount > 0 ? newOrdersCount : undefined"
            />
            <van-grid-item
              icon="orders"
              text="订单列表"
              @click="goToOrders"
              :badge="totalOrdersCount > 0 ? totalOrdersCount : undefined"
            />
            <van-grid-item
              icon="qr-code"
              text="二维码管理"
              @click="goToQRManagement"
            />
          </van-grid>
        </div>
      </div>

      <div class="action-section">
        <h3>商户工具</h3>
        <div class="action-grid">
          <van-grid :column-num="3" gutter="10">
            <van-grid-item
              icon="chart-line"
              text="统计报表"
              @click="goToStatistics"
            />
            <van-grid-item
              icon="setting"
              text="商户设置"
              @click="goToSettings"
            />
            <van-grid-item
              icon="service"
              text="客户服务"
              @click="goToCustomerService"
            />
          </van-grid>
        </div>
      </div>

      <div class="action-section">
        <h3>财务功能</h3>
        <div class="action-grid">
          <van-grid :column-num="3" gutter="10">
            <van-grid-item
              icon="balance"
              text="结算管理"
              @click="goToSettlement"
            />
            <van-grid-item
              icon="refund"
              text="退款申请"
              @click="goToRefunds"
            />
            <van-grid-item
              icon="invoice"
              text="发票管理"
              @click="goToInvoices"
            />
          </van-grid>
        </div>
      </div>
    </div>

    <!-- 今日统计 -->
    <div class="today-stats">
      <h3>今日统计</h3>
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon order">
            <van-icon name="orders" size="24" color="#3A82F6" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ merchantStats.todayOrders || 0 }}</div>
            <div class="stat-label">订单总数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon amount">
            <van-icon name="balance-o" size="24" color="#10B981" />
          </div>
          <div class="stat-content">
            <div class="stat-number">¥{{ formatAmount(merchantStats.todayAmount || 0) }}</div>
            <div class="stat-label">营业额</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon success">
            <van-icon name="success" size="24" color="#10B981" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ merchantStats.successRate || 0 }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon avg">
            <van-icon name="clock" size="24" color="#F59E0B" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ merchantStats.avgProcessTime || 0 }}分钟</div>
            <div class="stat-label">平均处理时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 近期订单 -->
    <div class="recent-orders">
      <div class="section-header">
        <h3>近期订单</h3>
        <van-button type="primary" size="small" @click="goToOrders">查看全部</van-button>
      </div>

      <div class="order-list">
        <div
          v-for="order in recentOrders"
          :key="order.id"
          class="order-item"
          @click="viewOrderDetail(order.id)"
        >
          <div class="order-info">
            <div class="order-header">
              <span class="order-no">订单号: {{ order.orderNo }}</span>
              <span :class="['order-status', order.status]">{{ formatStatus(order.status) }}</span>
            </div>
            <div class="order-time">{{ formatTime(order.createdAt) }}</div>
          </div>
          <div class="order-amount">¥{{ formatAmount(order.totalAmount) }}</div>
        </div>
      </div>
    </div>

    <!-- 快速操作按钮 -->
    <div class="quick-actions-fab">
      <van-button
        type="primary"
        size="large"
        round
        icon="scan"
        @click="goToScan"
      >
        扫码核销
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showLoadingToast } from 'vant'
import { merchantService } from '@/services/merchant'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 商户信息
const merchantInfo = ref({
  id: 'M001',
  name: '示例商户',
  avatar: '',
  phone: '',
  address: ''
})

// 商户统计
const merchantStats = ref({
  todayOrders: 0,
  todayAmount: 0,
  successRate: 0,
  avgProcessTime: 0
})

// 订单计数
const newOrdersCount = ref(0)
const totalOrdersCount = ref(0)

// 近期订单
const recentOrders = ref([
  {
    id: '1',
    orderNo: '2024010100001',
    status: 'pending_verification',
    totalAmount: 99.9,
    createdAt: '2024-01-01 10:30:00'
  },
  {
    id: '2',
    orderNo: '2024010100002',
    status: 'verified',
    totalAmount: 158.8,
    createdAt: '2024-01-01 09:15:00'
  }
])

// 认证store
const authStore = useAuthStore()

// 加载商户信息
const loadMerchantInfo = async () => {
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
    duration: 1000
  })

  try {
    const response = await merchantService.getMerchantProfile()
    merchantInfo.value = response
  } catch (error) {
    showToast('加载商户信息失败')
    console.error('Failed to load merchant info:', error)
  }
}

// 加载商户统计
const loadMerchantStats = async () => {
  try {
    const response = await merchantService.getMerchantStatistics()
    merchantStats.value = response
  } catch (error) {
    console.error('Failed to load merchant stats:', error)
  }
}

// 加载订单计数
const loadOrderCounts = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const params = { dateRange: { startDate: today, endDate: today } }

    // 新订单计数（待核销状态）
    const newOrders = await merchantService.getMerchantOrders({
      ...params,
      status: 'pending_verification'
    })
    newOrdersCount.value = newOrders.total

    // 总订单计数
    const allOrders = await merchantService.getMerchantOrders(params)
    totalOrdersCount.value = allOrders.total
  } catch (error) {
    console.error('Failed to load order counts:', error)
  }
}

// 格式化金额
const formatAmount = (amount: number): string => {
  return amount.toFixed(2)
}

// 格式化状态
const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending_verification: '待核销',
    verified: '已核销',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return statusMap[status] || status
}

// 格式化时间
const formatTime = (time: string): string => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 页面导航方法
const goToProfile = () => {
  router.push('/merchant/profile')
}

const goToScan = () => {
  router.push('/merchant/scan')
}

const goToOrders = () => {
  router.push('/merchant/orders')
}

const goToQRManagement = () => {
  router.push('/merchant/qr-management')
}

const goToStatistics = () => {
  router.push('/merchant/statistics')
}

const goToSettings = () => {
  router.push('/merchant/settings')
}

const goToCustomerService = () => {
  router.push('/merchant/service')
}

const goToSettlement = () => {
  router.push('/merchant/settlement')
}

const goToRefunds = () => {
  router.push('/merchant/refunds')
}

const goToInvoices = () => {
  router.push('/merchant/invoices')
}

const viewOrderDetail = (orderId: string) => {
  router.push(`/merchant/orders/${orderId}`)
}

// 生命周期钩子
onMounted(() => {
  loadMerchantInfo()
  loadMerchantStats()
  loadOrderCounts()
})
</script>

<style scoped lang="scss">
.merchant-home {
  padding-bottom: 80px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.merchant-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  margin-bottom: 20px;
  color: white;
}

.merchant-avatar {
  text-align: center;
  margin-bottom: 15px;
}

.merchant-details {
  text-align: center;
}

.merchant-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.merchant-id {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 15px;
}

.merchant-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.stat-item strong {
  display: block;
  font-size: 18px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.quick-actions {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.action-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.action-grid {
  margin-bottom: 20px;
}

.today-stats {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.today-stats h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.stat-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.stat-icon {
  margin-bottom: 8px;
}

.stat-number {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.recent-orders {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.order-list {
  max-height: 300px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.order-item:last-child {
  border-bottom: none;
}

.order-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.order-status.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.order-status.refunded {
  background: #e0e7ff;
  color: #3730a3;
}

.order-time {
  font-size: 12px;
  color: #666;
}

.order-amount {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.quick-actions-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

@media (max-width: 375px) {
  .merchant-home {
    padding-bottom: 100px;
  }

  .stats-container {
    grid-template-columns: 1fr 1fr;
  }
}
</style>