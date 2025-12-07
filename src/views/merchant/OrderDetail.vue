<template>
  <div class="merchant-order-detail-page">
    <AppHeader :title="pageTitle" :showBack="true" />

    <div class="order-detail-content">
      <!-- 加载状态 -->
      <van-loading v-if="loading" type="spinner" vertical style="padding: 50px 0;">
        加载中...
      </van-loading>

      <!-- 订单内容 -->
      <template v-else>
      <!-- 订单状态 -->
      <div class="order-status">
        <div class="status-header">
          <h2>订单详情</h2>
          <span class="order-no">订单号：{{ orderInfo.orderNo }}</span>
        </div>
        <div class="status-badge" :class="orderInfo.status">
          {{ getStatusLabel(orderInfo.status) }}
        </div>
      </div>

      <!-- 时间线 -->
      <div class="order-timeline">
        <van-steps :active="getTimelineActiveStep" direction="vertical">
          <van-step>
            <span>订单已创建</span>
            <div class="step-time">{{ formatDateTime(orderInfo.createdAt) }}</div>
          </van-step>
          <van-step v-if="orderInfo.paidAt">
            <span>订单已支付</span>
            <div class="step-time">{{ formatDateTime(orderInfo.paidAt) }}</div>
          </van-step>
          <van-step v-if="orderInfo.verifiedAt">
            <span>订单已核销</span>
            <div class="step-time">{{ formatDateTime(orderInfo.verifiedAt) }}</div>
          </van-step>
          <van-step v-if="orderInfo.confirmedAt">
            <span>商户已确认</span>
            <div class="step-time">{{ formatDateTime(orderInfo.confirmedAt) }}</div>
          </van-step>
          <van-step v-if="orderInfo.shippedAt">
            <span>订单已发货</span>
            <div class="step-time">{{ formatDateTime(orderInfo.shippedAt) }}</div>
          </van-step>
          <van-step v-if="orderInfo.deliveredAt">
            <span>订单已送达</span>
            <div class="step-time">{{ formatDateTime(orderInfo.deliveredAt) }}</div>
          </van-step>
          <van-step v-if="orderInfo.refundedAt">
            <span>订单已退款</span>
            <div class="step-time">{{ formatDateTime(orderInfo.refundedAt) }}</div>
          </van-step>
        </van-steps>
      </div>

      <!-- 订单信息 -->
      <div class="order-info-section">
        <h3 class="section-title">订单信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">订单编号</span>
            <span class="value">{{ orderInfo.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">下单时间</span>
            <span class="value">{{ formatDateTime(orderInfo.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">订单金额</span>
            <span class="value price">¥{{ (orderInfo.finalAmount || orderInfo.totalAmount || 0).toFixed(2) }}</span>
          </div>
          <div class="info-item" v-if="orderInfo.finalAmount && orderInfo.finalAmount !== orderInfo.totalAmount">
            <span class="label">实付金额</span>
            <span class="value price">¥{{ orderInfo.finalAmount.toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付方式</span>
            <span class="value">{{ getPaymentMethodText(orderInfo.paymentMethod) }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付状态</span>
            <span class="value" :class="getPaymentStatusClass(orderInfo.paymentStatus)">
              {{ getPaymentStatusText(orderInfo.paymentStatus) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 用户信息
      <div class="customer-info-section">
        <h3 class="section-title">用户信息</h3>
        <div class="customer-card">
          <div class="customer-avatar">
            <img
              :src="orderInfo.customerAvatar || '/default-avatar.png'"
              :alt="orderInfo.customerName"
              class="avatar-image"
            />
          </div>
          <div class="customer-details">
            <div class="customer-name">{{ orderInfo.customerName }}</div>
            <div class="customer-phone">{{ orderInfo.customerPhone }}</div>
          </div>
        </div>
      </div>  -->

      <!-- 收货地址 
      <div class="shipping-info-section" v-if="orderInfo.receiverName || orderInfo.shippingAddress">
        <h3 class="section-title">收货地址</h3>
        <div class="address-card">
          <div class="address-header" v-if="orderInfo.receiverName || orderInfo.receiverPhone">
            <van-icon name="location-o" />
            <div class="address-contact">
              <span class="name">{{ orderInfo.receiverName || '未填写' }}</span>
              <span class="phone" v-if="orderInfo.receiverPhone">{{ orderInfo.receiverPhone }}</span>
            </div>
          </div>
          <div class="address-detail" v-if="hasAddress">
            {{ formatAddress(orderInfo.shippingAddress) }}
          </div>
          <div class="address-detail" v-else>
            <span class="no-address">暂无收货地址</span>
          </div>
        </div>
      </div>  -->

      <!-- 商品信息 -->
      <div class="products-section">
        <h3 class="section-title">商品信息</h3>
        <div class="product-list" v-if="orderInfo.items && orderInfo.items.length > 0">
          <div v-for="item in orderInfo.items" :key="item.id || item.productId" class="product-item">
            <img
              :src="item.productImage || '/placeholder-product.png'"
              :alt="item.productName"
              class="product-image"
              @error="handleImageError"
            />
            <div class="product-info">
              <h4 class="product-name">{{ item.productName || '未知商品' }}</h4>
              <p class="product-spec" v-if="item.specification">{{ item.specification }}</p>
              <div class="product-footer">
                <span class="product-price">¥{{ (item.price || 0).toFixed(2) }}</span>
                <span class="product-quantity">x{{ item.quantity || 1 }}</span>
                <span class="product-total" v-if="item.totalPrice && item.totalPrice !== item.price * item.quantity">
                  小计：¥{{ (item.totalPrice || 0).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-products" v-else>
          <van-empty description="暂无商品信息" />
        </div>
      </div>

      <!-- 订单备注 -->
      <div class="notes-section" v-if="orderInfo.notes">
        <h3 class="section-title">订单备注</h3>
        <div class="notes-content">
          {{ orderInfo.notes }}
        </div>
      </div>
      </template>
    </div>

    <!-- 操作按钮 -->
    <div class="order-actions">
      <template v-if="canCancelOrder">
        <van-button type="warning" block round @click="handleCancelOrder" :loading="isCanceling">
          {{ isCanceling ? '撤销中...' : '撤销订单' }}
        </van-button>
      </template>

      <template v-if="canRefund">
        <van-button type="danger" block round @click="handleRefund" :loading="isRefunding">
          {{ isRefunding ? '申请退款中...' : '申请退款' }}
        </van-button>
      </template>

      <template v-if="canConfirm">
        <van-button type="primary" block round @click="handleConfirmOrder" :loading="isConfirming">
          {{ isConfirming ? '确认中...' : '确认订单' }}
        </van-button>
      </template>

      <template v-if="canShip">
        <van-button type="primary" block round @click="handleShipOrder" :loading="isShipping">
          {{ isShipping ? '发货中...' : '确认发货' }}
        </van-button>
      </template>

      <van-button type="default" block round @click="goBack">返回</van-button>
    </div>

    <!-- 确认对话框：撤销订单 -->
    <van-dialog
      v-model:show="showCancelDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确定撤销'"
      :cancel-button-text="'取消'"
      @confirm="confirmCancelOrder"
      @cancel="showCancelDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="warning-o" size="48" />
        </div>
        <h3 class="dialog-title">确认撤销</h3>
        <p class="dialog-message">
          确定要撤销此订单吗？<br />
          撤销后订单状态将变更为已取消。
        </p>
      </div>
    </van-dialog>

    <!-- 确认对话框：申请退款 -->
    <van-dialog
      v-model:show="showRefundDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确定退款'"
      :cancel-button-text="'取消'"
      @confirm="confirmRefund"
      @cancel="showRefundDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="warning-o" size="48" />
        </div>
        <h3 class="dialog-title">确认退款</h3>
        <p class="dialog-message">
          确定要为此订单申请退款吗？<br />
          退款成功后订单金额将原路返回。
        </p>
      </div>
    </van-dialog>

    <!-- 确认对话框：确认订单 -->
    <van-dialog
      v-model:show="showConfirmDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确认'"
      :cancel-button-text="'取消'"
      @confirm="confirmOrder"
      @cancel="showConfirmDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="success" size="48" />
        </div>
        <h3 class="dialog-title">确认订单</h3>
        <p class="dialog-message">
          确认已收到用户订单并开始处理？
        </p>
      </div>
    </van-dialog>

    <!-- 确认对话框：确认发货 -->
    <van-dialog
      v-model:show="showShipDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确认发货'"
      :cancel-button-text="'取消'"
      @confirm="confirmShipOrder"
      @cancel="showShipDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="logistics" size="48" />
        </div>
        <h3 class="dialog-title">确认发货</h3>
        <p class="dialog-message">
          确认已发货？<br />
          发货后用户将收到物流信息。
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showLoadingToast, showSuccessToast } from 'vant'
  import AppHeader from '@/components/common/AppHeader.vue'
  import { useMerchantOrderStore } from '@/stores/merchantOrder'
  import type { MerchantOrderStatus } from '@/types'

  interface OrderItem {
    productId: string
    productName: string
    productImage: string
    specification: string
    price: number
    quantity: number
  }

  interface ShippingAddress {
    province: string
    city: string
    district: string
    detail: string
  }

  interface OrderInfo {
    id: string
    orderNo: string
    customerId: string
    customerName: string
    customerPhone: string
    customerAvatar: string
    status: MerchantOrderStatus
    paymentMethod: 'wechat' | 'alipay' | 'cash'
    paymentStatus: 'unpaid' | 'paid' | 'refunded'
    totalAmount: number
    createdAt: string
    updatedAt: string
    paidAt?: string
    confirmedAt?: string
    shippedAt?: string
    deliveredAt?: string
    receiverName: string
    receiverPhone: string
    shippingAddress: ShippingAddress
    notes?: string
    items: OrderItem[]
  }

  const router = useRouter()
  const route = useRoute()
  const merchantOrderStore = useMerchantOrderStore()

  const pageTitle = ref('订单详情')
  const loading = ref(false)
  const isCanceling = ref(false)
  const isRefunding = ref(false)
  const isConfirming = ref(false)
  const isShipping = ref(false)

  // 对话框状态
  const showCancelDialog = ref(false)
  const showRefundDialog = ref(false)
  const showConfirmDialog = ref(false)
  const showShipDialog = ref(false)

  const orderInfo = ref<OrderInfo>({
    id: '',
    orderNo: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAvatar: '',
    status: 'pending',
    paymentMethod: 'wechat',
    paymentStatus: 'unpaid',
    totalAmount: 0,
    createdAt: '',
    updatedAt: '',
    receiverName: '',
    receiverPhone: '',
    shippingAddress: {
      province: '',
      city: '',
      district: '',
      detail: ''
    },
    items: []
  })

  // 订单状态配置
  const orderStatusMap = {
    pending: { label: '待支付', color: '#ff976a' },
    paid: { label: '已支付', color: '#1989fa' },
    pending_verification: { label: '待核销', color: '#ff976a' },
    verified: { label: '已核销', color: '#07c160' },
    confirmed: { label: '已确认', color: '#1989fa' },
    shipped: { label: '已发货', color: '#ff976a' },
    delivered: { label: '已送达', color: '#07c160' },
    completed: { label: '已完成', color: '#07c160' },
    cancelled: { label: '已取消', color: '#969799' },
    refunded: { label: '已退款', color: '#ff976a' },
    refund_requested: { label: '退款中', color: '#ff976a' }
  }

  // 支付方式配置
  const paymentMethodMap = {
    wechat: '微信支付',
    alipay: '支付宝',
    cash: '现金支付'
  }

  // 支付状态配置
  const paymentStatusMap = {
    unpaid: { label: '未支付', color: '#ff976a' },
    paid: { label: '已支付', color: '#07c160' },
    refunded: { label: '已退款', color: '#1989fa' }
  }

  // 计算属性
  const getTimelineActiveStep = computed(() => {
    const status = orderInfo.value.status
    if (status === 'cancelled') return 0
    if (status === 'refunded' || status === 'refund_requested') return 5
    if (orderInfo.value.deliveredAt) return 5
    if (orderInfo.value.shippedAt) return 4
    if (orderInfo.value.confirmedAt) return 3
    if (orderInfo.value.verifiedAt) return 2
    if (orderInfo.value.paidAt) return 1
    return 0
  })

  // 权限判断
  const canCancelOrder = computed(() => {
    return ['pending', 'paid', 'pending_verification', 'confirmed'].includes(orderInfo.value.status)
  })

  const canRefund = computed(() => {
    return (
      ['paid', 'verified', 'confirmed', 'shipped'].includes(orderInfo.value.status) &&
      orderInfo.value.paymentStatus === 'paid' &&
      orderInfo.value.status !== 'refunded' &&
      orderInfo.value.status !== 'refund_requested'
    )
  })

  const canConfirm = computed(() => {
    return ['pending', 'paid', 'pending_verification'].includes(orderInfo.value.status)
  })

  const canShip = computed(() => {
    return ['confirmed', 'paid'].includes(orderInfo.value.status)
  })

  // 方法
  const getStatusLabel = (status: string) => {
    return orderStatusMap[status as keyof typeof orderStatusMap]?.label || status
  }

  const getPaymentMethodText = (method: string) => {
    return paymentMethodMap[method as keyof typeof paymentMethodMap] || method
  }

  const getPaymentStatusText = (status: string) => {
    return paymentStatusMap[status as keyof typeof paymentStatusMap]?.label || status
  }

  const getPaymentStatusClass = (status: string) => {
    return `status-${status}`
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleString('zh-CN')
    } catch {
      return dateStr
    }
  }

  // 格式化地址显示
  const formatAddress = (address: any) => {
    if (!address) return ''
    const parts = [
      address.province,
      address.city,
      address.district,
      address.detail
    ].filter(Boolean)
    return parts.join('') || '暂无地址'
  }

  // 检查是否有地址
  const hasAddress = computed(() => {
    const addr = orderInfo.value.shippingAddress
    if (!addr) return false
    return !!(addr.province || addr.city || addr.district || addr.detail)
  })

  // 处理图片加载错误
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    img.src = '/placeholder-product.png'
  }

  // 加载订单详情
  const loadOrderDetail = async () => {
    loading.value = true
    try {
      const orderId = route.params.id as string
      if (!orderId) {
        showToast('订单ID不存在')
        router.go(-1)
        return
      }

      const response = await merchantOrderStore.getMerchantOrderDetail(orderId)

      if (response.success && response.data) {
        orderInfo.value = response.data
        // 不显示成功提示，避免干扰用户体验
      } else {
        const errorMessage = response.message || '加载订单详情失败'
        showToast(errorMessage)
        router.go(-1)
      }
    } catch (error: any) {
      console.error('加载订单详情失败:', error)
      const errorMessage = error?.message || '加载订单详情失败，请稍后重试'
      showToast(errorMessage)
      // 延迟返回，让用户看到错误提示
      setTimeout(() => {
        router.go(-1)
      }, 1500)
    } finally {
      loading.value = false
    }
  }

  // 撤销订单
  const handleCancelOrder = () => {
    showCancelDialog.value = true
  }

  const confirmCancelOrder = async () => {
    try {
      showCancelDialog.value = false
      isCanceling.value = true

      const response = await merchantOrderStore.cancelMerchantOrder(orderInfo.value.id)

      if (response.success) {
        showToast('订单撤销成功')
        await loadOrderDetail()
      } else {
        showToast(response.message || '撤销订单失败')
      }
    } catch (error) {
      console.error('撤销订单失败:', error)
      showToast('撤销订单失败')
    } finally {
      isCanceling.value = false
    }
  }

  // 申请退款
  const handleRefund = () => {
    showRefundDialog.value = true
  }

  const confirmRefund = async () => {
    try {
      showRefundDialog.value = false
      isRefunding.value = true

      const response = await merchantOrderStore.refundMerchantOrder(orderInfo.value.id)

      if (response.success) {
        showToast('退款申请成功')
        await loadOrderDetail()
      } else {
        showToast(response.message || '退款申请失败')
      }
    } catch (error) {
      console.error('申请退款失败:', error)
      showToast('申请退款失败')
    } finally {
      isRefunding.value = false
    }
  }

  // 确认订单
  const handleConfirmOrder = () => {
    showConfirmDialog.value = true
  }

  const confirmOrder = async () => {
    try {
      showConfirmDialog.value = false
      isConfirming.value = true

      const response = await merchantOrderStore.confirmMerchantOrder(orderInfo.value.id)

      if (response.success) {
        showToast('订单确认成功')
        await loadOrderDetail()
      } else {
        showToast(response.message || '确认订单失败')
      }
    } catch (error) {
      console.error('确认订单失败:', error)
      showToast('确认订单失败')
    } finally {
      isConfirming.value = false
    }
  }

  // 确认发货
  const handleShipOrder = () => {
    showShipDialog.value = true
  }

  const confirmShipOrder = async () => {
    try {
      showShipDialog.value = false
      isShipping.value = true

      const response = await merchantOrderStore.shipMerchantOrder(orderInfo.value.id)

      if (response.success) {
        showToast('发货成功')
        await loadOrderDetail()
      } else {
        showToast(response.message || '发货失败')
      }
    } catch (error) {
      console.error('发货失败:', error)
      showToast('发货失败')
    } finally {
      isShipping.value = false
    }
  }

  // 返回
  const goBack = () => {
    router.go(-1)
  }

  // 生命周期
  onMounted(() => {
    loadOrderDetail()
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;
  @use '@/styles/dialog-mixin.scss' as *;

  .merchant-order-detail-page {
    min-height: 100vh;
    background: var(--theme-bg-gradient, $glass-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
    display: flex;
    flex-direction: column;
    padding-top: 46px;
  }

  .order-detail-content {
    flex: 1;
    padding: 16px;
    padding-bottom: 180px;
    overflow-y: auto;
  }

  .order-status {
    background: var(--van-background-2);
    padding: 20px 16px;
    margin-bottom: 16px;
    border-radius: var(--van-radius-lg);

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;

      h2 {
        font-size: 18px;
        font-weight: 600;
        color: var(--van-text-color);
        margin: 0;
      }

      .order-no {
        font-size: 14px;
        color: var(--van-text-color-3);
      }
    }

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: var(--van-radius-md);
      font-size: 16px;
      font-weight: 600;

      &.pending {
        background: rgba(255, 151, 106, 0.1);
        color: #ff976a;
      }

      &.confirmed {
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

      &.refunded {
        background: rgba(25, 137, 250, 0.1);
        color: #1989fa;
      }
    }
  }

  .order-timeline {
    background: var(--van-background-2);
    padding: 20px 16px;
    margin-bottom: 16px;
    border-radius: var(--van-radius-lg);

    .step-time {
      font-size: 12px;
      color: var(--van-text-color-3);
      margin-top: 4px;
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--van-text-color);
    margin: 0 0 12px 0;
  }

  .order-info-section,
  .customer-info-section,
  .shipping-info-section,
  .products-section,
  .notes-section {
    background: var(--van-background-2);
    padding: 16px;
    margin-bottom: 16px;
    border-radius: var(--van-radius-lg);
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 14px;
        color: var(--van-text-color-3);
      }

      .value {
        font-size: 14px;
        color: var(--van-text-color);

        &.price {
          font-size: 16px;
          font-weight: 600;
          color: var(--van-danger-color);
        }

        &.status-unpaid {
          color: #ff976a;
        }

        &.status-paid {
          color: #07c160;
        }

        &.status-refunded {
          color: #1989fa;
        }
      }
    }
  }

  .customer-card {
    display: flex;
    align-items: center;
    gap: 12px;

    .customer-avatar {
      .avatar-image {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .customer-details {
      flex: 1;

      .customer-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--van-text-color);
        margin-bottom: 4px;
      }

      .customer-phone {
        font-size: 14px;
        color: var(--van-text-color-3);
      }
    }
  }

  .address-card {
    .address-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .van-icon {
        color: var(--van-primary-color);
      }

      .address-contact {
        flex: 1;

        .name {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: var(--van-text-color);
          margin-bottom: 4px;
        }

        .phone {
          font-size: 14px;
          color: var(--van-text-color-3);
        }
      }
    }

    .address-detail {
      font-size: 14px;
      color: var(--van-text-color-2);
      line-height: 1.5;
      padding: 12px;
      background: var(--van-background);
      border-radius: var(--van-radius-md);
    }
  }

  .product-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .product-item {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: var(--van-background);
      border-radius: var(--van-radius-md);

      .product-image {
        width: 80px;
        height: 80px;
        border-radius: var(--van-radius-md);
        object-fit: cover;
      }

      .product-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--van-text-color);
        }

        .product-spec {
          font-size: 14px;
          color: var(--van-text-color-3);
        }

        .product-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;

          .product-price {
            font-size: 16px;
            font-weight: 600;
            color: var(--van-danger-color);
          }

          .product-quantity {
            font-size: 14px;
            color: var(--van-text-color-3);
          }

          .product-total {
            font-size: 14px;
            color: var(--van-text-color-2);
            margin-left: auto;
          }
        }
      }
    }
  }

  .empty-products {
    padding: 40px 0;
  }

  .no-address {
    color: var(--van-text-color-3);
    font-style: italic;
  }

  .notes-content {
    padding: 12px;
    background: var(--van-background);
    border-radius: var(--van-radius-md);
    font-size: 14px;
    color: var(--van-text-color-2);
    line-height: 1.5;
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
    max-height: 50vh;
    overflow-y: auto;

    .van-button {
      margin: 0;
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .merchant-order-detail-page {
      background-color: #1a1a1a;
    }

    .order-status,
    .order-timeline,
    .order-info-section,
    .customer-info-section,
    .shipping-info-section,
    .products-section,
    .notes-section,
    .order-actions {
      background: #2a2a2a;
    }

    .section-title {
      color: #fff;
    }

    .info-grid .info-item .value {
      color: #fff;
    }

    .customer-card .customer-name {
      color: #fff;
    }

    .notes-content {
      background: #333;
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .order-detail-content {
      padding: 12px;
      padding-bottom: 140px;
    }

    .info-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .order-actions {
      padding: 12px;
    }

    .product-item {
      flex-direction: column;
      align-items: flex-start;

      .product-image {
        width: 100%;
        height: 120px;
      }
    }
  }

  // 统一对话框样式
  .standard-confirm-dialog {
    @include standard-dialog;
  }

  .dialog-content {
    @include dialog-content;
  }

  .dialog-icon {
    @include dialog-icon(#ff6b6b);
  }

  .dialog-title {
    @include dialog-title;
  }

  .dialog-message {
    @include dialog-message;
  }
</style>
