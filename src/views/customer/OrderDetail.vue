<template>
  <div class="order-detail-page">
    <!-- 订单头部信息 -->
    <div class="order-header">
      <div class="order-status">
        <h2>订单详情</h2>
        <div class="status-badge" :class="order.status">
          {{ getStatusLabel(order.status) }}
        </div>
      </div>
      <div class="order-meta">
        <div class="order-no">订单号：{{ order.orderNo }}</div>
        <div class="order-time">下单时间：{{ formatDate(order.createdAt) }}</div>
      </div>
    </div>

    <!-- 订单状态进度 -->
    <div class="order-timeline">
      <van-steps :active="getTimelineActiveStep" direction="vertical">
        <van-step>
          <span>订单已提交</span>
          <div class="step-time">{{ order.createdAt }}</div>
        </van-step>
        <van-step v-if="order.paidAt">
          <span>订单已支付</span>
          <div class="step-time">{{ order.paidAt }}</div>
        </van-step>
        <van-step v-if="order.shippedAt">
          <span>订单已发货</span>
          <div class="step-time">{{ order.shippedAt }}</div>
        </van-step>
        <van-step v-if="order.deliveredAt">
          <span>订单已送达</span>
          <div class="step-time">{{ order.deliveredAt }}</div>
        </van-step>
      </van-steps>
    </div>

    <!-- 收货信息 -->
    <div class="shipping-info">
      <h3>收货信息</h3>
      <div class="info-content">
        <div class="contact-info">
          <div class="contact-name">{{ order.shippingAddress.name }}</div>
          <div class="contact-phone">{{ order.contactPhone }}</div>
        </div>
        <div class="address-info">
          {{ order.shippingAddress.province }} {{ order.shippingAddress.city }}
          {{ order.shippingAddress.district }} {{ order.shippingAddress.detail }}
        </div>
      </div>
    </div>

    <!-- 商品信息 -->
    <div class="product-info">
      <h3>商品信息</h3>
      <div class="product-item">
        <img :src="order.productImage" :alt="order.productName" class="product-image" />
        <div class="product-details">
          <h4 class="product-name">{{ order.productName }}</h4>
          <div class="product-specs">
            <span>数量：{{ order.quantity }}</span>
            <span>单价：¥{{ order.price }}</span>
          </div>
        </div>
        <div class="product-price">¥{{ order.totalAmount }}</div>
      </div>
    </div>

    <!-- 支付信息 -->
    <div class="payment-info">
      <h3>支付信息</h3>
      <div class="payment-details">
        <div class="payment-row">
          <span>商品金额</span>
          <span>¥{{ order.price * order.quantity }}</span>
        </div>
        <div class="payment-row">
          <span>运费</span>
          <span>¥0.00</span>
        </div>
        <div class="payment-row total">
          <span>实付金额</span>
          <span class="total-amount">¥{{ order.totalAmount }}</span>
        </div>
        <div class="payment-row">
          <span>支付方式</span>
          <span>{{ getPaymentMethodLabel(order.paymentMethod) }}</span>
        </div>
        <div class="payment-row" v-if="order.paidAt">
          <span>支付时间</span>
          <span>{{ order.paidAt }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="order-actions">
      <template v-if="order.status === 'pending'">
        <van-button type="primary" block @click="goToPayment">立即支付</van-button>
        <van-button type="default" block @click="cancelOrder">取消订单</van-button>
      </template>
      <template v-else-if="order.status === 'shipped'">
        <van-button type="primary" block @click="confirmReceive">确认���货</van-button>
      </template>
      <template v-else-if="order.status === 'delivered'">
        <van-button type="primary" block @click="reviewProduct">评价商品</van-button>
        <van-button type="default" block @click="buyAgain">再次购买</van-button>
      </template>
      <van-button type="default" block @click="goToProducts">继续购物</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showLoadingToast, closeToast, showDialog } from 'vant'
  import type { OrderStatus } from '@/types'

  const router = useRouter()

  // 订单数据
  const order = ref({
    id: '1',
    orderNo: 'ORD20241018001',
    productName: 'iPhone 15 Pro 256GB',
    productImage: '/images/product1.jpg',
    quantity: 1,
    price: 8999,
    totalAmount: 8999,
    status: 'delivered' as OrderStatus,
    paymentMethod: 'wechat' as const,
    createdAt: '2024-10-15 14:30:00',
    paidAt: '2024-10-15 14:35:00',
    shippedAt: '2024-10-16 09:20:00',
    deliveredAt: '2024-10-17 16:45:00',
    shippingAddress: {
      name: '张三',
      phone: '138****8888',
      province: '广东省',
      city: '广州市',
      district: '天河区',
      detail: '天河路123号'
    },
    contactName: '张三',
    contactPhone: '138****8888',
    notes: ''
  })

  // 订单状态配置
  const orderStatusMap = {
    pending: { label: '待支付', color: '#ff976a' },
    paid: { label: '待发货', color: '#1989fa' },
    shipped: { label: '待收货', color: '#ff976a' },
    delivered: { label: '已完成', color: '#07c160' },
    cancelled: { label: '已取消', color: '#969799' }
  }

  // 支付方式配置
  const paymentMethodMap = {
    wechat: '微信支付',
    alipay: '支付宝',
    cash: '现金支付',
    other: '其他'
  }

  // 计算时间轴步骤
  const getTimelineActiveStep = computed(() => {
    switch (order.value.status) {
      case 'pending':
        return 0
      case 'paid':
        return 1
      case 'shipped':
        return 2
      case 'delivered':
        return 3
      case 'cancelled':
        return 0
      default:
        return 0
    }
  })

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    return orderStatusMap[status as keyof typeof orderStatusMap]?.label || status
  }

  // 获取支付方式标签
  const getPaymentMethodLabel = (method: string) => {
    return paymentMethodMap[method as keyof typeof paymentMethodMap] || method
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 去支付
  const goToPayment = () => {
    showToast('跳转到支付页面...')
    // 这里应该跳转到支付页面
  }

  // 取消订单
  const cancelOrder = () => {
    showDialog({
      title: '取消订单',
      message: '确定要取消此订单吗？',
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
      .then(() => {
        showToast('订单已取消')
        // 这里应该调用API取消订单
      })
      .catch(() => {
        // 取消操作
      })
  }

  // 确认收货
  const confirmReceive = () => {
    showDialog({
      title: '确认收货',
      message: '确认已收到商品吗？',
      showCancelButton: true,
      confirmButtonText: '确认收货',
      cancelButtonText: '再想想'
    })
      .then(() => {
        showToast('确认收货成功')
        // 这里应该调用API确认收货
      })
      .catch(() => {
        // 取消操作
      })
  }

  // 评价商品
  const reviewProduct = () => {
    showToast('跳转到评价页面...')
    // 这里应该跳转到评价页面
  }

  // 再次购买
  const buyAgain = () => {
    showToast('添加到购物车')
    // 这里应该将商品添加到购物车并跳转到购物车
  }

  // 继续购物
  const goToProducts = () => {
    router.push({ name: 'Products' })
  }

  // 初始化
  onMounted(() => {
    // 这里可以根据订单ID加载订单详情
    console.log('加载订单详情', router.currentRoute.value.params.id)
  })
</script>

<style lang="scss" scoped>
  .order-detail-page {
    min-height: 100vh;
    background-color: var(--van-background);
    padding-bottom: 100px;
  }

  .order-header {
    background: var(--van-background-2);
    padding: 20px 16px;
    margin-bottom: 16px;

    .order-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--van-text-color);
        margin: 0;
      }

      .status-badge {
        padding: 6px 12px;
        border-radius: var(--van-radius-md);
        font-size: 14px;
        font-weight: 500;

        &.pending {
          background: rgba(255, 151, 106, 0.1);
          color: #ff976a;
        }

        &.paid {
          background: rgba(25, 137, 250, 0.1);
          color: #1989fa;
        }

        &.shipped {
          background: rgba(255, 151, 106, 0.1);
          color: #ff976a;
        }

        &.delivered {
          background: rgba(7, 193, 96, 0.1);
          color: #07c160;
        }

        &.cancelled {
          background: rgba(150, 151, 153, 0.1);
          color: #969799;
        }
      }
    }

    .order-meta {
      .order-no,
      .order-time {
        font-size: 14px;
        color: var(--van-text-color-3);
        margin-bottom: 4px;
      }
    }
  }

  .order-timeline {
    background: var(--van-background-2);
    padding: 20px 16px;
    margin-bottom: 16px;

    .step-time {
      font-size: 12px;
      color: var(--van-text-color-3);
      margin-top: 4px;
    }
  }

  .shipping-info,
  .product-info,
  .payment-info {
    background: var(--van-background-2);
    padding: 20px 16px;
    margin-bottom: 16px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--van-text-color);
      margin: 0 0 16px 0;
    }

    .info-content {
      .contact-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;

        .contact-name {
          font-size: 16px;
          color: var(--van-text-color);
          font-weight: 500;
        }

        .contact-phone {
          font-size: 14px;
          color: var(--van-text-color-3);
        }
      }

      .address-info {
        font-size: 14px;
        color: var(--van-text-color-2);
        line-height: 1.5;
      }
    }
  }

  .product-item {
    display: flex;
    align-items: center;
    gap: 12px;

    .product-image {
      width: 80px;
      height: 80px;
      border-radius: var(--van-radius-md);
      object-fit: cover;
    }

    .product-details {
      flex: 1;

      .product-name {
        font-size: 14px;
        color: var(--van-text-color);
        margin-bottom: 8px;
        line-height: 1.4;
      }

      .product-specs {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--van-text-color-3);
      }
    }

    .product-price {
      font-size: 16px;
      font-weight: 600;
      color: var(--van-danger-color);
    }
  }

  .payment-details {
    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: var(--van-text-color-2);
      margin-bottom: 8px;

      &.total {
        font-size: 16px;
        font-weight: 600;
        color: var(--van-text-color);

        .total-amount {
          color: var(--van-danger-color);
        }
      }
    }
  }

  .order-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--van-background-2);
    padding: 16px;
    border-top: 1px solid var(--van-border-color);
    display: flex;
    flex-direction: column;
    gap: 8px;

    .van-button {
      margin: 0;
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .order-detail-page {
      background-color: #1a1a1a;
    }

    .order-header,
    .order-timeline,
    .shipping-info,
    .product-info,
    .payment-info,
    .order-actions {
      background: #2a2a2a;
    }

    .order-status h2,
    .shipping-info h3,
    .product-info h3,
    .payment-info h3 {
      color: #fff;
    }

    .contact-info .contact-name {
      color: #fff;
    }

    .product-details .product-name {
      color: #fff;
    }

    .payment-row.total {
      color: #fff;

      .total-amount {
        color: #ff6b6b;
      }
    }
  }
</style>
