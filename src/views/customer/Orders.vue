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
          <van-tab title="待支付" name="pending" />
          <van-tab title="待发货" name="paid" />
          <van-tab title="待收货" name="shipped" />
          <van-tab title="已完成" name="delivered" />
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
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-time">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-status" :class="order.status">
              {{ getStatusLabel(order.status) }}
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
                v-if="order.status === 'pending'"
                @click.stop="goToPayment(order)"
              >
                去支付
              </van-button>
              <van-button
                size="small"
                type="primary"
                plain
                v-if="order.status === 'shipped'"
                @click.stop="confirmReceive(order)"
              >
                确认收货
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
  import { ref, reactive, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'
  import type { Order } from '@/types'

  const router = useRouter()
  const route = useRoute()

  // 搜索相关
  const searchQuery = ref('')
  const onSearchInput = (value: string) => {
    searchQuery.value = value
    loadOrders(true)
  }

  // 标签页相关
  const activeTab = ref('all')
  const onTabChange = (name: string) => {
    loadOrders(true)
  }

  // 订单数据
  const loading = ref(false)
  const orders = ref<Order[]>([])
  const hasMore = ref(true)
  const page = ref(1)
  const pageSize = ref(10)

  // 模拟订单数据
  const mockOrders: Order[] = [
    {
      id: '1',
      orderNo: 'ORD20241018001',
      userId: 'user1',
      status: 'delivered',
      totalAmount: 8999,
      paymentMethod: 'wechat',
      paymentStatus: 'paid',
      shippingAddress: {
        id: 'addr1',
        name: '张三',
        phone: '13800138000',
        province: '广东省',
        city: '广州市',
        district: '天河区',
        detail: '天河路123号',
        isDefault: true,
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z'
      },
      contactName: '张三',
      contactPhone: '13800138000',
      isVerified: true,
      items: [
        {
          id: 'item1',
          productId: 'product1',
          productName: 'iPhone 15 Pro 256GB',
          productImage: '/images/product1.jpg',
          quantity: 1,
          price: 8999,
          totalPrice: 8999,
          specification: '256GB 深空黑色'
        }
      ],
      createdAt: '2024-10-15T14:30:00Z',
      updatedAt: '2024-10-15T14:30:00Z'
    },
    {
      id: '2',
      orderNo: 'ORD20241018002',
      userId: 'user1',
      status: 'shipped',
      totalAmount: 6999,
      paymentMethod: 'alipay',
      paymentStatus: 'paid',
      shippingAddress: {
        id: 'addr2',
        name: '李四',
        phone: '13900139000',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detail: '科技园123号',
        isDefault: false,
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z'
      },
      contactName: '李四',
      contactPhone: '13900139000',
      isVerified: false,
      items: [
        {
          id: 'item2',
          productId: 'product2',
          productName: '华为 Mate 60 Pro',
          productImage: '/images/product2.jpg',
          quantity: 1,
          price: 6999,
          totalPrice: 6999,
          specification: '512GB 雅川青'
        }
      ],
      createdAt: '2024-10-16T10:15:00Z',
      updatedAt: '2024-10-16T10:15:00Z'
    },
    {
      id: '3',
      orderNo: 'ORD20241018003',
      userId: 'user1',
      status: 'paid',
      totalAmount: 11998,
      paymentMethod: 'wechat',
      paymentStatus: 'paid',
      shippingAddress: {
        id: 'addr3',
        name: '王五',
        phone: '13700137000',
        province: '广东省',
        city: '佛山市',
        district: '禅城区',
        detail: '祖庙路123号',
        isDefault: false,
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z'
      },
      contactName: '王五',
      contactPhone: '13700137000',
      isVerified: false,
      items: [
        {
          id: 'item3',
          productId: 'product3',
          productName: '小米14 Ultra',
          productImage: '/images/product3.jpg',
          quantity: 2,
          price: 5999,
          totalPrice: 11998,
          specification: '1TB 钛金属'
        }
      ],
      createdAt: '2024-10-17T09:45:00Z',
      updatedAt: '2024-10-17T09:45:00Z'
    },
    {
      id: '4',
      orderNo: 'ORD20241018004',
      userId: 'user1',
      status: 'pending',
      totalAmount: 3999,
      paymentMethod: 'wechat',
      paymentStatus: 'unpaid',
      shippingAddress: {
        id: 'addr4',
        name: '赵六',
        phone: '13600136000',
        province: '广东省',
        city: '东莞市',
        district: '南城区',
        detail: '鸿福路123号',
        isDefault: false,
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-10-01T00:00:00Z'
      },
      contactName: '赵六',
      contactPhone: '13600136000',
      isVerified: false,
      items: [
        {
          id: 'item4',
          productId: 'product4',
          productName: 'OPPO Find X6',
          productImage: '/images/product4.jpg',
          quantity: 1,
          price: 3999,
          totalPrice: 3999,
          specification: '256GB 雪山金'
        }
      ],
      createdAt: '2024-10-18T16:20:00Z',
      updatedAt: '2024-10-18T16:20:00Z'
    }
  ]

  // 订单状态配置
  const orderStatusMap = {
    pending: { label: '待支付', color: '#ff976a' },
    paid: { label: '待发货', color: '#1989fa' },
    shipped: { label: '待收货', color: '#ff976a' },
    delivered: { label: '已完成', color: '#07c160' },
    cancelled: { label: '已取消', color: '#969799' }
  }

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    return orderStatusMap[status as keyof typeof orderStatusMap]?.label || status
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return dateStr.split(' ')[0]
  }

  // 加载订单
  const loadOrders = (reset = false) => {
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

    // 模拟API请求延迟
    setTimeout(() => {
      let filteredOrders = [...mockOrders]

      // 搜索过滤
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filteredOrders = filteredOrders.filter(
          order =>
            order.items.some(item => item.productName.toLowerCase().includes(query)) ||
            order.orderNo.toLowerCase().includes(query)
        )
      }

      // 状态过滤
      if (activeTab.value !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === activeTab.value)
      }

      // 分页
      const startIndex = (page.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      const newOrders = filteredOrders.slice(startIndex, endIndex)

      orders.value.push(...newOrders)
      hasMore.value = endIndex < filteredOrders.length

      loading.value = false
      closeToast()

      if (reset) {
        showToast('刷新成功')
      }
    }, 1000)
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

  // 初始化
  onMounted(() => {
    loadOrders()
  })
</script>

<style lang="scss" scoped>
  .orders-page {
    min-height: 100vh;
    background-color: var(--van-background);
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
      background: var(--van-background-2);
      border-radius: var(--van-radius-lg);
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
          .order-no {
            font-size: 14px;
            color: var(--van-text-color);
            margin-bottom: 4px;
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

          &.paid {
            color: #1989fa;
          }

          &.shipped {
            color: #ff976a;
          }

          &.delivered {
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
