<template>
  <div class="orders-page">
    <!-- 搜索和筛选栏 -->
    <div class="orders-header">
      <van-search
        v-model="searchQuery"
        placeholder="搜索订单"
        @input="onSearchInput"
        shape="round"
        background="transparent"
        class="search-bar"
      />

      <div class="filter-tabs">
        <van-tabs v-model="activeTab" @change="onTabChange">
          <van-tab title="全部" name="all" />
          <van-tab title="待使用" name="unused" />
          <van-tab title="待支付" name="pending" />
          <van-tab title="已使用" name="used" />
          <van-tab title="已取消" name="cancelled" />
        </van-tabs>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="orders-container">
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" size="24px">加载中...</van-loading>
      </div>

      <div v-else-if="orders.length === 0" class="empty-container">
        <van-empty description="暂无订单" />
      </div>

      <div v-else class="orders-list">
        <div
          v-for="order in orders"
          :key="order.id"
          class="order-card"
          @click="goToOrderDetail(order.id)"
        >
          <div class="order-header">
            <div class="order-info">
              <div class="order-no">订单号：{{ order.orderNo }}</div>
              <div class="order-time">{{ formatDateTime(order.createdAt) }}</div>
            </div>
            <div class="order-status" :class="getOrderDisplayStatus(order)">
              {{ getStatusLabel(order) }}
            </div>
          </div>

          <div class="order-content">
            <div class="product-item" v-for="item in order.items" :key="item.id">
              <img :src="item.productImage" :alt="item.productName" class="product-image" />
              <div class="product-info">
                <h4 class="product-name">{{ item.productName }}</h4>
                <p class="product-quantity">x {{ item.quantity }}</p>
              </div>
            </div>
          </div>

          <div class="order-footer">
            <div class="order-price">
              实付：
              <span class="price">¥{{ order.totalAmount }}</span>
            </div>
            <div class="order-actions">
              <van-button
                size="small"
                type="primary"
                plain
                v-if="getOrderDisplayStatus(order) === 'pending'"
                @click.stop="goToPayment(order)"
              >
                去支付
              </van-button>
              <van-button size="small" type="default" plain @click.stop="viewOrderDetail(order)">
                查看详情
              </van-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading" class="load-more">
        <van-loading type="spinner" size="20px">加载更多</van-loading>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'
  import type { Order } from '@/types'
  import { orderService } from '@/services/orders'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  // 搜索相关
  const searchQuery = ref('')
  const onSearchInput = (value: string) => {
    searchQuery.value = value
    loadOrders(true)
  }

  // 标签页相关
  const activeTab = ref('all')
  const onTabChange = (name: string) => {
    console.log('🔄 Tab 切换:', name, '当前 activeTab:', activeTab.value)
    activeTab.value = name
    console.log('✅ activeTab 已更新为:', activeTab.value)
    loadOrders(true)
  }

  // 订单数据
  const loading = ref(false)
  const orders = ref<Order[]>([])
  const hasMore = ref(true)
  const page = ref(1)
  const pageSize = ref(10)

  // 订单状态映射（后端大写转前端小写）
  const mapOrderStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'PAID': 'paid',
      'VERIFIED': 'verified',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded'
    }
    return statusMap[status] || status.toLowerCase()
  }

  // 转换后端订单数据为前端格式
  const transformOrder = (order: any): Order => {
    return {
      ...order,
      status: mapOrderStatus(order.status),
      totalAmount: Number(order.finalAmount || order.totalAmount || 0),
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName || '',
        productImage: item.productImage || '',
        quantity: item.quantity || 1,
        price: Number(item.price || 0),
        totalPrice: Number(item.subtotal || item.price || 0),
        specification: item.specification || '',
        isVerified: item.isVerified || false,
        verifiedAt: item.verifiedAt,
        verifiedBy: item.verifiedBy,
        notes: item.notes
      })),
      paymentStatus: order.status === 'PAID' ? 'paid' : order.status === 'PENDING' ? 'unpaid' : 'paid',
      contactName: order.shippingAddress?.name || '',
      contactPhone: order.shippingAddress?.phone || '',
      isVerified: order.isVerified || false
    }
  }

  // 订单状态配置（根据status和isVerified组合判断）
  const getOrderDisplayStatus = (order: Order): string => {
    if (order.status === 'cancelled') {
      return 'cancelled'
    }
    if (order.status === 'refunded') {
      return 'refunded'
    }
    if (order.status === 'verified') {
      return 'used'
    }
    if (order.status === 'pending') {
      return 'pending'
    }
    if (order.status === 'paid') {
      return 'unused'
    }
    // 兼容处理：如果订单已核销但状态不是 verified，则显示已使用
    return order.isVerified ? 'used' : 'unused'
  }

  // 订单状态配置
  const orderStatusMap = {
    pending: { label: '待支付', color: '#ff976a' },
    unused: { label: '待使用', color: '#1989fa' },
    used: { label: '已使用', color: '#07c160' },
    cancelled: { label: '已取消', color: '#969799' }
  }

  // 获取状态标签
  const getStatusLabel = (order: Order) => {
    const displayStatus = getOrderDisplayStatus(order)
    return orderStatusMap[displayStatus as keyof typeof orderStatusMap]?.label || displayStatus
  }

  // 格式化日期时间（后端返回的是北京时间，直接格式化显示，不进行时区转换）
  const formatDateTime = (dateStr: string | Date) => {
    if (!dateStr) return ''
    
    // 如果是字符串，直接解析（假设后端返回的是 ISO 8601 格式或标准格式）
    let date: Date
    if (typeof dateStr === 'string') {
      date = new Date(dateStr)
    } else {
      date = dateStr
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return String(dateStr)
    }
    
    // 格式化：YYYY-MM-DD HH:mm
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  // 加载订单
  const loadOrders = async (reset = false) => {
    // 检查用户是否登录
    if (!authStore.isAuthenticated || !authStore.user) {
      showToast('请先登录')
      router.push({ name: 'Login' })
      return
    }

    if (reset) {
      page.value = 1
      orders.value = []
      hasMore.value = true
    }

    if (loading.value || !hasMore.value) return

    loading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })

    try {
      // 构建查询参数（使用当前页码）
      const currentPage = reset ? 1 : page.value
      const params: any = {
        page: currentPage,
        limit: pageSize.value
      }

      // 状态过滤（将前端状态转换为后端查询参数）
      if (activeTab.value !== 'all') {
        if (activeTab.value === 'pending') {
          // 待支付：status = PENDING
          params.status = 'PENDING'
        } else if (activeTab.value === 'unused') {
          // 待使用：status = PAID && isVerified = false
          params.status = 'PAID'
          params.isVerified = 'false' // 使用字符串，因为URL参数是字符串
        } else if (activeTab.value === 'used') {
          // 已使用：isVerified = true（不限制status，因为已核销的订单可能处于不同状态）
          params.isVerified = 'true' // 使用字符串，因为URL参数是字符串
        } else if (activeTab.value === 'cancelled') {
          // 已取消：status = CANCELLED
          params.status = 'CANCELLED'
        }
      }

      // 调用 API 获取订单列表
      console.log('📋 订单查询参数:', JSON.stringify(params, null, 2))
      const response = await orderService.getOrders(params)
      
      // 处理响应数据
      let newOrders: Order[] = []
      if (response.data && Array.isArray(response.data)) {
        // 如果返回的是 { data: [], pagination: {} } 格式
        newOrders = response.data.map(transformOrder)
        // 更新分页信息
        if (response.pagination) {
          hasMore.value = page.value < response.pagination.totalPages
        }
      } else if (Array.isArray(response)) {
        // 如果直接返回数组（兼容旧格式）
        newOrders = response.map(transformOrder)
      }

      // 前端搜索过滤（如果后端不支持搜索）
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        newOrders = newOrders.filter(
          order =>
            order.items.some(item => item.productName.toLowerCase().includes(query)) ||
            order.orderNo.toLowerCase().includes(query)
        )
      }

      if (reset) {
        orders.value = newOrders
        page.value = 1
      } else {
        orders.value.push(...newOrders)
      }

      // 更新分页信息
      if (response.pagination) {
        // 更新页码（下次加载下一页）
        page.value = response.pagination.page + 1
        hasMore.value = page.value <= response.pagination.totalPages
      } else {
        // 如果没有返回数据，说明没有更多了
        if (newOrders.length < pageSize.value) {
          hasMore.value = false
        } else {
          // 如果有数据，假设还有更多，下次加载下一页
          page.value += 1
        }
      }

      loading.value = false
      closeToast()

      if (reset && newOrders.length > 0) {
        showToast('刷新成功')
      }
    } catch (error: any) {
      console.error('加载订单失败:', error)
      loading.value = false
      closeToast()
      showToast(error.message || '加载订单失败，请稍后重试')
      
      // 如果是未授权错误，跳转到登录页
      if (error.message?.includes('登录') || error.message?.includes('未授权')) {
        router.push({ name: 'Login' })
      }
    }
  }

  // 导航到订单详情
  const goToOrderDetail = (orderId: string) => {
    router.push({
      name: 'OrderDetail',
      params: { id: orderId }
    })
  }

  // 导航到支付
  const goToPayment = (order: any) => {
    showToast('跳转到支付页面...')
    // 这里应该跳转到支付页面
  }

  // 确认收货
  const confirmReceive = (order: any) => {
    showToast('确认收货成功')
    // 这里应该调用API确认收货
  }

  // 查看订单详情
  const viewOrderDetail = (order: any) => {
    goToOrderDetail(order.id)
  }

  // 滚动加载更多
  const handleScroll = () => {
    if (loading.value || !hasMore.value) return
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // 距离底部 100px 时加载更多
    if (scrollTop + windowHeight >= documentHeight - 100) {
      loadOrders(false)
    }
  }

  // 初始化
  onMounted(() => {
    loadOrders()
    
    // 监听滚动事件，实现滚动加载更多
    window.addEventListener('scroll', handleScroll, { passive: true })
  })

  // 清理
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .orders-page {
    min-height: 100vh;
    background: $glass-bg-gradient;
    background-attachment: fixed;
    background-size: cover;
    padding-bottom: 80px;
  }

  .orders-header {
    background: var(--van-background);
    border-bottom: 1px solid var(--van-border-color);
    position: sticky;
    top: 0;
    z-index: 100;

    .search-bar {
      padding: 12px 16px;
    }

    .filter-tabs {
      border-bottom: 1px solid var(--van-border-color);
    }
  }

  .orders-container {
    padding: 16px;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .orders-list {
    .order-card {
      @include glassmorphism-card(base);
      margin-bottom: 16px;
      overflow: hidden;

      &:active {
        transform: scale(0.98);
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--van-border-color);

        .order-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          
          .order-no {
            font-size: 14px;
            color: var(--van-text-color);
            font-weight: 500;
          }

          .order-time {
            font-size: 12px;
            color: var(--van-text-color-3);
          }
        }

        .order-status {
          font-size: 14px;
          font-weight: 500;

          &.pending {
            color: #ff976a;
          }

          &.unused {
            color: #1989fa;
          }

          &.used {
            color: #07c160;
          }

          &.cancelled {
            color: #969799;
          }
        }
      }

      .order-content {
        padding: 16px;

        .product-item {
          display: flex;
          align-items: center;

          .product-image {
            width: 60px;
            height: 60px;
            border-radius: var(--van-radius-md);
            object-fit: cover;
            margin-right: 12px;
          }

          .product-info {
            flex: 1;

            .product-name {
              font-size: 14px;
              color: var(--van-text-color);
              margin-bottom: 4px;
              line-height: 1.4;
            }

            .product-quantity {
              font-size: 12px;
              color: var(--van-text-color-3);
            }
          }
        }
      }

      .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-top: 1px solid var(--van-border-color);

        .order-price {
          font-size: 14px;
          color: var(--van-text-color);

          .price {
            font-size: 16px;
            color: var(--van-danger-color);
            font-weight: 600;
          }
        }

        .order-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .load-more {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 0;
    color: var(--van-text-color-3);
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .orders-page {
      background-color: #1a1a1a;
    }

    .order-card {
      background: #2a2a2a;

      .order-header {
        border-bottom-color: #333;

        .order-info .order-no {
          color: #fff;
        }

        .order-info .order-time {
          color: #999;
        }
      }

      .order-content .product-item .product-info .product-name {
        color: #fff;
      }

      .order-footer {
        border-top-color: #333;
      }
    }
  }
</style>
