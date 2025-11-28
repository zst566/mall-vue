<template>
  <div class="merchant-home">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="商户中心"
      left-arrow
      @click-left="handleBack"
      fixed
      z-index="100"
    >
      <template #right>
        <van-icon name="user-o" @click="goToProfile" />
      </template>
    </van-nav-bar>

    <!-- 商户信息卡片 -->
    <div class="merchant-info-card">
      <div class="merchant-card-content">
        <!-- 左侧：商户Logo（占50%） -->
        <div class="merchant-logo-section">
          <div class="merchant-logo-wrapper">
            <img 
              v-if="merchantLogo" 
              :src="merchantLogo" 
              alt="商户Logo" 
              class="merchant-logo-img"
              @error="handleLogoError"
            />
            <img 
              v-else 
              src="/wepark-logo.svg" 
              alt="WePark Logo" 
              class="default-logo-img"
            />
          </div>
        </div>
        
        <!-- 右侧：商户信息（占50%） -->
        <div class="merchant-info-section">
          <!-- 上：商户简称 -->
          <div class="info-row info-row-top">
            <h2 class="merchant-name">{{ merchantInfo.name || '商户名称' }}</h2>
          </div>
          
          <!-- 中：商户编号 -->
          <div class="info-row info-row-middle">
            <span class="info-label">商户编号：</span>
            <span class="info-value">{{ merchantInfo.merchantCode || merchantInfo.id || '--' }}</span>
          </div>
          
          <!-- 下：默认店铺编号 -->
          <div class="info-row info-row-bottom">
            <span class="info-label">店铺编号：</span>
            <span class="info-value">{{ currentShop?.shopCode || shops[0]?.shopCode || '--' }}</span>
          </div>
        </div>
      </div>
      
      <!-- 商铺切换（如果有多个商铺） -->
      <div v-if="shops.length > 1" class="shop-selector">
        <van-dropdown-menu>
          <van-dropdown-item v-model="selectedShopId" :options="shopOptions" @change="handleShopChange" />
        </van-dropdown-menu>
      </div>
      
      <!-- 今日统计 -->
      <div class="merchant-stats">
        <span class="stat-item">
          <strong>{{ todayStats.verificationCount || 0 }}</strong>
          <span class="stat-label">今日核销</span>
        </span>
        <span class="stat-item">
          <strong>¥{{ formatAmount(todayStats.verificationAmount || 0) }}</strong>
          <span class="stat-label">今日营收</span>
        </span>
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
              icon="orders-o"
              text="订单列表"
              @click="goToOrders"
              :badge="totalOrdersCount > 0 ? totalOrdersCount : undefined"
            />
            <van-grid-item icon="qr" text="二维码管理" @click="goToQRManagement" />
          </van-grid>
        </div>
      </div>

      <div class="action-section">
        <h3>商户工具</h3>
        <div class="action-grid">
          <van-grid :column-num="3" gutter="10">
            <van-grid-item icon="chart-trending-o" text="统计报表" @click="goToStatistics" />
            <van-grid-item icon="setting-o" text="商户设置" @click="goToSettings" />
            <van-grid-item icon="service-o" text="客户服务" @click="goToCustomerService" />
          </van-grid>
        </div>
      </div>

      <div class="action-section">
        <h3>财务功能</h3>
        <div class="action-grid">
          <van-grid :column-num="3" gutter="10">
            <van-grid-item icon="balance-o" text="结算管理" @click="goToSettlement" />
            <van-grid-item icon="refund-o" text="退款申请" @click="goToRefunds" />
            <van-grid-item icon="description" text="发票管理" @click="goToInvoices" />
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
            <van-icon name="orders-o" size="24" color="#3A82F6" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ todayStats.verificationCount || 0 }}</div>
            <div class="stat-label">核销笔数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon amount">
            <van-icon name="balance-o" size="24" color="#10B981" />
          </div>
          <div class="stat-content">
            <div class="stat-number">¥{{ formatAmount(todayStats.verificationAmount || 0) }}</div>
            <div class="stat-label">核销金额</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon refund">
            <van-icon name="refund-o" size="24" color="#F59E0B" />
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ todayStats.refundCount || 0 }}</div>
            <div class="stat-label">退款笔数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon avg">
            <van-icon name="gold-coin-o" size="24" color="#10B981" />
          </div>
          <div class="stat-content">
            <div class="stat-number">¥{{ formatAmount(todayStats.averagePrice || 0) }}</div>
            <div class="stat-label">客单价</div>
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
        <div v-if="recentOrders.length === 0" class="empty-orders">
          <van-empty description="暂无近期订单" />
        </div>
        <div
          v-for="order in recentOrders"
          :key="order.id"
          class="order-item"
          @click="viewOrderDetail(order.id)"
        >
          <div class="order-info">
            <div class="order-header">
              <span class="order-no">订单号: {{ order.orderNo }}</span>
              <span :class="['order-status', normalizeStatusClass(order.status)]">{{ formatStatus(order.status) }}</span>
            </div>
            <div class="order-time">{{ formatTime(order.createdAt) }}</div>
          </div>
          <div class="order-amount">¥{{ formatAmount(order.finalAmount || order.totalAmount || 0) }}</div>
        </div>
      </div>
    </div>

    <!-- 退出商户管理按钮 -->
    <div class="exit-merchant-section">
      <van-button
        type="danger"
        size="large"
        block
        round
        @click="handleExitMerchant"
        class="exit-merchant-btn"
      >
        退出商户管理
      </van-button>
    </div>

    <!-- 退出商户管理确认对话框 -->
    <van-dialog
      v-model:show="showExitDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确定退出'"
      :cancel-button-text="'取消'"
      @confirm="confirmExitMerchant"
      @cancel="showExitDialog = false"
      :close-on-click-overlay="false"
      class="exit-merchant-dialog"
      :width="320"
    >
      <div class="exit-dialog-content">
        <div class="exit-dialog-icon">
          <van-icon name="warning-o" size="48" />
        </div>
        <h3 class="exit-dialog-title">退出商户管理</h3>
        <p class="exit-dialog-message">
          确定要退出商户管理模式吗？<br />
          退出后将返回客户端应用。
        </p>
      </div>
    </van-dialog>

  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { showToast, showLoadingToast } from 'vant'
  import { merchantService } from '@/services/merchant'
  import { merchantOperatorService, type ShopInfo } from '@/services/merchantOperator'
  import { useAuthStore } from '@/stores/auth'
  import { useAppStore } from '@/stores/app'
  import router from '@/router'
  import type { MerchantOrder } from '@/types'

  // 商户信息
  const merchantInfo = ref({
    id: 'M001',
    merchantCode: '',
    name: '示例商户',
    avatar: '',
    phone: '',
    address: '',
    logo: ''
  })

  // 商户Logo（计算属性，优先使用商户logo，没有则使用默认logo）
  const merchantLogo = computed(() => {
    return merchantInfo.value.logo || null
  })

  // Logo加载错误处理
  const handleLogoError = () => {
    // Logo加载失败时，使用默认logo（通过v-else自动处理）
    console.warn('商户Logo加载失败，使用默认Logo')
  }

  // 今日统计
  const todayStats = ref({
    verificationCount: 0,
    verificationAmount: 0,
    refundCount: 0,
    refundAmount: 0,
    averagePrice: 0
  })

  // 订单计数
  const newOrdersCount = ref(0)
  const totalOrdersCount = ref(0)

  // 退出商户管理对话框
  const showExitDialog = ref(false)

  // 近期订单
  const recentOrders = ref<any[]>([])

  // 认证store
  const authStore = useAuthStore()
  const route = useRoute()

  // 底部导航（已移除，使用 AppFooter 的商户模式导航）

  // 商铺相关
  const shops = ref<ShopInfo[]>([])
  const selectedShopId = ref<string>('')

  // 商铺选项（用于下拉菜单）
  const shopOptions = computed(() => {
    return shops.value.map(shop => ({
      text: `${shop.shopCode} - ${shop.tenantName}`,
      value: shop.id
    }))
  })

  // 当前选中的商铺
  const currentShop = computed(() => {
    return shops.value.find(shop => shop.id === selectedShopId.value) || shops.value[0]
  })

  // 加载商户绑定状态和商铺列表
  const loadMerchantBinding = async () => {
    try {
      const status = await merchantOperatorService.getMyStatus()
      if (status.hasBinding && status.merchantUser) {
        merchantInfo.value = {
          id: status.merchantUser.merchantId,
          merchantCode: status.merchantUser.merchantCode || '',
          name: status.merchantUser.merchantName,
          avatar: '',
          phone: '',
          address: '',
          logo: ''
        }

        // 加载商铺列表
        const shopList = await merchantOperatorService.getShops()
        shops.value = shopList

        // 设置默认选中的商铺
        if (shopList.length > 0) {
          const savedShopId = localStorage.getItem('merchant_selected_shop_id')
          if (savedShopId && shopList.find(s => s.id === savedShopId)) {
            selectedShopId.value = savedShopId
          } else {
            selectedShopId.value = shopList[0].id
            localStorage.setItem('merchant_selected_shop_id', shopList[0].id)
          }
        }

        // 加载商户详情以获取logo和完整的merchantCode
        try {
          const merchantProfile = await merchantService.getMerchantProfile()
          if (merchantProfile && merchantProfile.data) {
            const profileData = merchantProfile.data
            merchantInfo.value = {
              ...merchantInfo.value,
              merchantCode: profileData.merchantCode || merchantInfo.value.merchantCode || merchantInfo.value.id,
              logo: profileData.logo || merchantInfo.value.logo,
              phone: profileData.phone || merchantInfo.value.phone,
              address: profileData.address || merchantInfo.value.address
            }
          } else if (merchantProfile) {
            // 兼容直接返回数据的情况
            merchantInfo.value = {
              ...merchantInfo.value,
              merchantCode: merchantProfile.merchantCode || merchantInfo.value.merchantCode || merchantInfo.value.id,
              logo: merchantProfile.logo || merchantInfo.value.logo,
              phone: merchantProfile.phone || merchantInfo.value.phone,
              address: merchantProfile.address || merchantInfo.value.address
            }
          }
        } catch (error) {
          console.warn('加载商户详情失败，使用基本信息:', error)
        }
      } else {
        // 未绑定，跳转到申请页面
        showToast('您尚未绑定商户，请先申请')
        router.push('/customer/merchant-binding')
      }
    } catch (error) {
      console.error('加载商户绑定状态失败:', error)
      showToast('加载商户信息失败')
    }
  }

  // 加载商户信息（兼容旧接口）
  const loadMerchantInfo = async () => {
    try {
      // 先尝试加载绑定状态
      await loadMerchantBinding()
      
      // 如果旧接口存在，也可以调用
      try {
        const response = await merchantService.getMerchantProfile()
        if (response && !merchantInfo.value.name) {
          merchantInfo.value = { ...merchantInfo.value, ...response }
        }
      } catch (error) {
        // 忽略旧接口错误
      }
    } catch (error) {
      console.error('加载商户信息失败:', error)
    }
  }

  // 加载近期订单
  const loadRecentOrders = async () => {
    try {
      const response = await merchantService.getMerchantOrders({
        limit: 10, // 只获取最近10条
        page: 1
      })
      recentOrders.value = response.orders || []
    } catch (error) {
      console.error('加载近期订单失败:', error)
      recentOrders.value = []
    }
  }

  // 商铺切换
  const handleShopChange = (shopId: string) => {
    selectedShopId.value = shopId
    localStorage.setItem('merchant_selected_shop_id', shopId)
    showToast(`已切换到：${currentShop.value?.shopCode || ''}`)
    // 重新加载统计数据
    loadTodayStats()
    loadOrderCounts()
    loadRecentOrders()
  }

  // 加载今日统计
  const loadTodayStats = async () => {
    try {
      const stats = await merchantOperatorService.getTodayStatistics()
      todayStats.value = {
        verificationCount: stats.verificationCount || 0,
        verificationAmount: stats.verificationAmount || 0,
        refundCount: stats.refundCount || 0,
        refundAmount: stats.refundAmount || 0,
        averagePrice: stats.averagePrice || 0
      }
    } catch (error) {
      console.error('加载今日统计失败:', error)
      showToast({ type: 'fail', message: '加载今日统计失败' })
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
  const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount == null) return '0.00'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '0.00'
    return numAmount.toFixed(2)
  }

  // 规范化状态类名（用于CSS类名）
  const normalizeStatusClass = (status: string): string => {
    // 将大写状态转换为小写，并处理下划线
    return status.toLowerCase().replace(/_/g, '_')
  }

  // 格式化状态显示文本
  const formatStatus = (status: string): string => {
    // 支持后端返回的大写状态和前端小写状态
    const statusMap: Record<string, string> = {
      'PENDING': '待支付',
      'PAID': '已支付',
      'VERIFIED': '已核销',
      'CANCELLED': '已取消',
      'REFUNDED': '已退款',
      'REFUND_REQUESTED': '退款中',
      'pending': '待支付',
      'paid': '已支付',
      'verified': '已核销',
      'cancelled': '已取消',
      'refunded': '已退款',
      'refund_requested': '退款中',
      'pending_verification': '待核销'
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
  const handleBack = () => {
    router.back()
  }

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

  const goToVerifications = () => {
    router.push('/merchant/verifications')
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

  // 退出商户管理
  const handleExitMerchant = () => {
    showExitDialog.value = true
  }

  // 确认退出商户管理
  const confirmExitMerchant = async () => {
    try {
      // 切换到客户端模式
      const appStore = useAppStore()
      appStore.switchToCustomer()

      // 等待状态更新完成
      await nextTick()

      // 显示提示信息
      showToast({
        message: '已退出商户管理',
        type: 'success',
        duration: 1000
      })

      // 延迟跳转，确保 Toast 显示完成且状态已更新
      setTimeout(() => {
        try {
          // 使用 push 而不是 replace，避免路由历史问题
          router.push('/').catch((error) => {
            console.warn('路由跳转失败，尝试使用 window.location:', error)
            // 如果路由跳转失败，使用 window.location 作为后备方案
            window.location.href = '/'
          })
        } catch (error) {
          console.error('路由跳转异常:', error)
          // 最后的后备方案
          window.location.href = '/'
        }
      }, 500)
    } catch (error) {
      console.error('退出商户管理失败:', error)
      showToast({
        message: '退出失败，请重试',
        type: 'fail'
      })
    }
  }

  // 生命周期钩子
  onMounted(() => {
    loadMerchantInfo()
    loadTodayStats()
    loadOrderCounts()
    loadRecentOrders()
  })
</script>

<style scoped lang="scss">
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .merchant-home {
    padding-top: 46px;
    padding-bottom: 100px;
    background: var(--theme-bg-gradient, $glass-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
    min-height: 100vh;
  }

  .merchant-info-card {
    @include glassmorphism-card(strong);
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    padding: 20px;
    margin: 16px;
    margin-bottom: 20px;
    color: white;
    @supports (backdrop-filter: blur(15px)) {
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
    }
  }

  .merchant-card-content {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  // 左侧：商户Logo（占40%）
  .merchant-logo-section {
    flex: 0 0 40%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .merchant-logo-wrapper {
    width: 100%;
    max-width: 100px;
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 50%;
    }

    .merchant-logo-img {
      // 商户上传的logo
    }

    .default-logo-img {
      // 默认wepark logo
      padding: 12px;
    }
  }

  // 右侧：商户信息（占60%）
  .merchant-info-section {
    flex: 0 0 60%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  .info-row {
    display: flex;
    align-items: center;
    line-height: 1.5;
  }

  .info-row-top {
    .merchant-name {
      font-size: 20px;
      font-weight: bold;
      margin: 0;
      color: white;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .info-row-middle,
  .info-row-bottom {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);

    .info-label {
      opacity: 0.8;
      margin-right: 4px;
      white-space: nowrap;
    }

    .info-value {
      font-weight: 500;
      color: white;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .merchant-name {
    font-size: 20px;
    font-weight: bold;
    margin: 0;
  }

  .shop-selector {
    margin-bottom: 10px;
    
    :deep(.van-dropdown-menu) {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }
  }

  .current-shop {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    opacity: 0.9;
    margin-bottom: 10px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 6px;
  }

  .merchant-stats {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .stat-item {
    text-align: center;
    
    strong {
      display: block;
      font-size: 18px;
      font-weight: bold;
      color: var(--van-warning-color, $warning);
      text-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.5),
        0 0 10px rgba(255, 151, 106, 0.4),
        0 0 20px rgba(255, 151, 106, 0.2);
      margin-bottom: 4px;
      filter: brightness(1.1) contrast(1.2);
    }
  }

  .stat-label {
    font-size: 12px;
    color: var(--van-warning-color, $warning);
    opacity: 1;
    font-weight: 600;
    text-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.6),
      0 0 8px rgba(255, 151, 106, 0.3);
    letter-spacing: 0.3px;
    filter: brightness(1.1) contrast(1.2);
  }

  .quick-actions {
    @include glassmorphism-card(base);
    padding: 20px;
    margin: 16px;
    margin-bottom: 20px;
  }

  .action-section h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--theme-text-on-glass, $text-color-primary);
  }

  .action-grid {
    margin-bottom: 20px;

    // 统一所有按钮的样式和尺寸
    :deep(.van-grid-item) {
      padding: 0;
      margin: 0;
    }

    :deep(.van-grid-item__content) {
      @include glassmorphism-card(light);
      border-radius: $border-radius-base;
      padding: 16px 8px;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: all $transition-base;
      border: $glass-border-width $glass-border-style $glass-border-color;

      &:active {
        transform: scale(0.96);
        opacity: 0.9;
      }
    }

    :deep(.van-grid-item__icon) {
      font-size: 24px;
      color: var(--van-primary-color, $primary);
      margin-bottom: 8px;
    }

    :deep(.van-grid-item__text) {
      font-size: 13px;
      color: $text-color-primary;
      font-weight: $font-weight-medium;
      line-height: 1.4;
      text-align: center;
      margin-top: 0;
    }

    // 统一徽章样式
    :deep(.van-badge) {
      .van-badge__wrapper {
        .van-badge {
          background: var(--van-danger-color, $danger);
          color: $white;
          font-size: 11px;
          min-width: 18px;
          height: 18px;
          line-height: 18px;
          padding: 0 5px;
          border-radius: 9px;
        }
      }
    }
  }

  .today-stats {
    @include glassmorphism-card(base);
    padding: 20px;
    margin: 16px;
    margin-bottom: 20px;
  }

  .today-stats h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
    color: var(--theme-text-on-glass, $text-color-primary);
  }

  .stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }

  .stat-card {
    @include glassmorphism-card(light);
    padding: 15px;
    border-radius: $border-radius-base;
    text-align: center;
    border: $glass-border-width $glass-border-style $glass-border-color;
    transition: all $transition-base;

    &:active {
      transform: scale(0.98);
      opacity: 0.9;
    }
  }

  .stat-icon {
    margin-bottom: 8px;
  }

  .stat-number {
    font-size: 18px;
    font-weight: bold;
    color: var(--theme-text-on-glass, $text-color-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 13px;
    color: $text-color-primary;
    font-weight: $font-weight-medium;
    line-height: 1.4;
    text-align: center;
  }

  .recent-orders {
    @include glassmorphism-card(base);
    padding: 20px;
    margin: 16px;
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
    color: var(--theme-text-on-glass, $text-color-primary);
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
  .order-status.PENDING,
  .order-status.pending_verification {
    background: #fef3c7;
    color: #92400e;
  }

  .order-status.paid,
  .order-status.PAID {
    background: #dbeafe;
    color: #1e40af;
  }

  .order-status.verified,
  .order-status.VERIFIED {
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

  .empty-orders {
    padding: 40px 0;
  }

  .order-time {
    font-size: 12px;
    color: var(--theme-text-secondary, $text-color-secondary);
  }

  .order-amount {
    font-size: 16px;
    font-weight: bold;
    color: var(--theme-text-on-glass, $text-color-primary);
  }

  .exit-merchant-section {
    padding: 20px 16px;
    margin-bottom: 80px; // 为底部导航栏留出空间
  }

  .exit-merchant-btn {
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    background: linear-gradient(135deg, #ff4757 0%, #ee5a6f 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 2px 8px rgba(255, 71, 87, 0.4);
    }
  }

  // 退出商户管理对话框样式
  .exit-merchant-dialog {
    :deep(.van-dialog) {
      @include glassmorphism-card(strong);
      border-radius: 20px !important;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
    }

    :deep(.van-dialog__header) {
      display: none !important;
    }

    :deep(.van-dialog__content) {
      padding: 0 !important;
    }

    :deep(.van-dialog__footer) {
      padding: 0 !important;
      border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 0 !important;
      background: transparent !important;
    }

    :deep(.van-dialog__confirm),
    :deep(.van-dialog__cancel) {
      height: 56px !important;
      margin: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      line-height: 56px !important;
    }

    :deep(.van-dialog__confirm) {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%) !important;
      color: white !important;
      order: 2;
      
      &:active {
        background: linear-gradient(135deg, #ee5a6f 0%, #dc4a5f 100%) !important;
        transform: scale(0.98);
      }
    }

    :deep(.van-dialog__cancel) {
      background: rgba(0, 0, 0, 0.03) !important;
      color: $text-color-primary !important;
      order: 1;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
      
      &:active {
        background: rgba(0, 0, 0, 0.06) !important;
      }
    }
  }

  .exit-dialog-content {
    padding: 32px 24px 24px;
    text-align: center;
    background: transparent;
  }

  .exit-dialog-icon {
    margin-bottom: 20px;
    color: #ff6b6b;
    display: flex;
    justify-content: center;
    align-items: center;
    
    :deep(.van-icon) {
      filter: drop-shadow(0 4px 12px rgba(255, 107, 107, 0.4));
      animation: pulse 2s ease-in-out infinite;
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .exit-dialog-title {
    font-size: 20px;
    font-weight: 600;
    color: $text-color-primary;
    margin: 0 0 16px 0;
    line-height: 1.4;
    letter-spacing: 0.5px;
  }

  .exit-dialog-message {
    font-size: 15px;
    color: $text-color-secondary;
    line-height: 1.8;
    margin: 0;
    padding: 0 8px;
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

    .exit-merchant-section {
      padding: 16px;
    }
  }
</style>
