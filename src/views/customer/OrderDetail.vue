<template>
  <div class="order-detail-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="订单详情"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
      z-index="100"
    />

    <!-- 加载状态 -->
    <van-loading v-if="loading" type="spinner" vertical style="padding: 50px 0;">加载中...</van-loading>
    
    <!-- 订单内容 -->
    <template v-else>
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
        <div class="order-expiry" v-if="order.expiryDate">
          <span class="expiry-label">有效期至：</span>
          <span class="expiry-date">{{ formatDateOnly(order.expiryDate) }}</span>
          <span class="expiry-days" :class="getExpiryDaysClass(order.expiryDate)">
            {{ getExpiryDaysText(order.expiryDate) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 订单状态进度 -->
    <div class="order-timeline" v-if="order.paidAt || order.verifiedAt">
      <van-steps :active="getTimelineActiveStep" direction="vertical">
        <van-step v-if="order.paidAt">
          <span>订单已支付</span>
          <div class="step-time">{{ order.paidAt }}</div>
        </van-step>
        <van-step v-if="order.verifiedAt">
          <span>订单已核销</span>
          <div class="step-time">{{ order.verifiedAt }}</div>
        </van-step>
      </van-steps>
    </div>

    <!-- 收货信息 -->
    <div class="shipping-info" v-if="order.shippingAddress || order.contactName">
      <h3>收货信息</h3>
      <div class="info-content">
        <div class="contact-info">
          <div class="contact-name">{{ order.shippingAddress?.name || order.contactName || '' }}</div>
          <div class="contact-phone">{{ order.contactPhone || '' }}</div>
        </div>
        <div class="address-info" v-if="order.shippingAddress">
          {{ (order.shippingAddress.province || '') }} {{ (order.shippingAddress.city || '') }}
          {{ (order.shippingAddress.district || '') }} {{ (order.shippingAddress.detail || '') }}
        </div>
      </div>
    </div>

    <!-- 促销活动信息 -->
    <div class="product-info" v-if="order.items && order.items.length > 0">
      <h3>促销活动信息</h3>
      <div class="product-item" v-for="item in order.items" :key="item.id" @click="goToProductDetail(item)">
        <img :src="item.productImage || '/images/default-product.jpg'" :alt="item.productName" class="product-image" />
        <div class="product-details">
          <h4 class="product-name">{{ item.productName }}</h4>
          <div class="product-specs">
            <span>数量：{{ item.quantity }}</span>
            <span>原价：¥{{ formatMoney((item as any).originalPrice || 0) }}</span>
          </div>
          <div class="merchant-info" v-if="(item as any).merchantName || (item as any).merchantAddress || (item as any).merchantFloor">
            <div class="merchant-name" v-if="(item as any).merchantName">
              <van-icon name="shop-o" class="merchant-icon" />
              <span>{{ (item as any).merchantName }}</span>
            </div>
            <div class="merchant-location" v-if="(item as any).merchantAddress || (item as any).merchantFloor">
              <van-icon name="location-o" class="location-icon" />
              <span v-if="(item as any).merchantAddress">{{ (item as any).merchantAddress }}</span>
              <span v-if="(item as any).merchantFloor" class="floor-text">{{ (item as any).merchantFloor }}</span>
            </div>
          </div>
        </div>
        <div class="product-price">¥{{ formatMoney(item.price * item.quantity) }}</div>
      </div>
    </div>

    <!-- 二维码和支付信息（合并显示） -->
    <div class="qrcode-payment-container" v-if="order.status === 'paid' || order.status === 'verified'">
      <!-- 二维码区域（40%） -->
      <div class="qrcode-area">
        <div 
          class="qrcode-wrapper" 
          :class="{ 'verified': qrCodeVerified, 'clickable': qrCodeData && !qrCodeLoading && !qrCodeError && !qrCodeVerified }"
          @click="handleQRCodeClick"
        >
          <!-- 加载状态 -->
          <div v-if="qrCodeLoading" class="qrcode-loading">
            <van-loading type="spinner" size="24px">加载中...</van-loading>
          </div>
          <!-- 二维码图片 -->
          <img
            v-else-if="qrCodeData"
            :src="qrCodeData"
            alt="订单二维码"
            class="qrcode-image"
          />
          <!-- 错误状态 -->
          <div v-else-if="qrCodeError" class="qrcode-error">
            <van-icon name="warning-o" size="48" color="#ee0a24" />
            <p class="error-message">{{ qrCodeError }}</p>
            <van-button type="primary" size="small" @click="loadQRCode">重试</van-button>
          </div>
          <!-- 已核销状态 -->
          <div v-if="qrCodeVerified" class="verified-overlay">
            <van-icon name="success" size="80" color="#07c160" />
            <div class="verified-text">已核销</div>
          </div>
        </div>
      </div>
      <!-- 支付信息区域（60%） -->
      <div class="payment-info">
        <h3>支付信息</h3>
        <div class="payment-details">
          <div class="payment-row">
            <span>商品金额</span>
            <span>¥{{ formatMoney(order.originalAmount || 0) }}</span>
          </div>
          <div class="payment-row" v-if="order.shippingFee && order.shippingFee > 0">
            <span>运费</span>
            <span>¥{{ formatMoney(order.shippingFee) }}</span>
          </div>
          <div class="payment-row total">
            <span>实付金额</span>
            <span class="total-amount">¥{{ formatMoney(order.totalAmount) }}</span>
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
    </div>

    <!-- 支付信息（当订单状态不是paid或verified时单独显示） -->
    <div class="payment-info" v-if="order.status !== 'paid' && order.status !== 'verified'">
      <h3>支付信息</h3>
      <div class="payment-details">
        <div class="payment-row">
          <span>商品金额</span>
          <span>¥{{ formatMoney(order.originalAmount || 0) }}</span>
        </div>
        <div class="payment-row" v-if="order.shippingFee && order.shippingFee > 0">
          <span>运费</span>
          <span>¥{{ formatMoney(order.shippingFee) }}</span>
        </div>
        <div class="payment-row total">
          <span>实付金额</span>
          <span class="total-amount">¥{{ formatMoney(order.totalAmount) }}</span>
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

    <!-- 退款申请详情（申请退款中状态时显示） -->
    <div v-if="order.status === 'refund_requested' && refundRequestDetail" class="refund-request-info">
      <h3>退款申请信息</h3>
      <div class="refund-info-content">
        <div class="info-row">
          <span class="info-label">退款原因：</span>
          <span class="info-value">{{ refundRequestDetail.refundReason?.name || '-' }}</span>
        </div>
        <div class="info-row" v-if="refundRequestDetail.requestedAmount">
          <span class="info-label">申请金额：</span>
          <span class="info-value">¥{{ formatMoney(refundRequestDetail.requestedAmount) }}</span>
        </div>
        <div class="info-row" v-if="refundRequestDetail.description">
          <span class="info-label">申请说明：</span>
          <span class="info-value">{{ refundRequestDetail.description }}</span>
        </div>
        <div class="info-row" v-if="refundRequestDetail.images && refundRequestDetail.images.length > 0">
          <span class="info-label">图片凭证：</span>
          <div class="info-images">
            <img
              v-for="(img, index) in refundRequestDetail.images"
              :key="index"
              :src="img"
              alt="退款凭证"
              @click="previewImage(img, refundRequestDetail.images || [])"
              class="refund-image"
            />
          </div>
        </div>
        <div class="info-row" v-if="refundRequestDetail.contactPhone">
          <span class="info-label">联系电话：</span>
          <span class="info-value">{{ refundRequestDetail.contactPhone }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">申请时间：</span>
          <span class="info-value">{{ formatDate(refundRequestDetail.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="order-actions">
      <template v-if="order.status === 'pending'">
        <van-button type="primary" block @click="goToPayment">立即支付</van-button>
        <van-button type="default" block @click="cancelOrder">取消订单</van-button>
      </template>
      <template v-else-if="order.status === 'paid'">
        <van-button 
          type="danger" 
          block 
          :disabled="!canRefund"
          @click="goToRefundRequest"
        >
          申请退款
        </van-button>
        <div v-if="!canRefund" class="refund-disabled-tip">
          <van-notice-bar
            color="#ff976a"
            background="#fff7e6"
            left-icon="info-o"
            :text="refundDisabledReason"
          />
        </div>
        <van-button type="default" block @click="goToProducts">继续购物</van-button>
      </template>
      <template v-else-if="order.status === 'refund_requested'">
        <van-button type="default" block @click="handleCancelRefundRequest">撤销退款申请</van-button>
        <van-button type="default" block @click="goToProducts">继续购物</van-button>
      </template>
      <template v-else-if="order.status === 'verified'">
        <van-button type="primary" block @click="reviewProduct">评价商品</van-button>
        <van-button type="default" block @click="buyAgain">再次购买</van-button>
      </template>
      <van-button v-if="order.status !== 'paid' && order.status !== 'refund_requested'" type="default" block @click="goToProducts">继续购物</van-button>
    </div>

    </template>

    <!-- 全屏遮罩层（使用Teleport渲染到body，确保在最顶层） -->
    <Teleport to="body">
      <div v-if="showQRCodeFullscreen" class="fullscreen-overlay" @click="closeQRCodeFullscreen">
        <div class="fullscreen-content" @click.stop>
          <img
            v-if="qrCodeData"
            :src="qrCodeData"
            alt="订单二维码"
            class="fullscreen-qrcode-image"
          />
          <p class="fullscreen-hint">点击任意位置关闭</p>
        </div>
      </div>
    </Teleport>

    <!-- 确认对话框：取消订单 -->
    <van-dialog
      v-model:show="showCancelOrderDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确定'"
      :cancel-button-text="'取消'"
      @confirm="confirmCancelOrder"
      @cancel="showCancelOrderDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="warning-o" size="48" />
        </div>
        <h3 class="dialog-title">取消订单</h3>
        <p class="dialog-message">
          确定要取消此订单吗？
        </p>
      </div>
    </van-dialog>

    <!-- 确认对话框：确认收货 -->
    <van-dialog
      v-model:show="showConfirmReceiveDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确认收货'"
      :cancel-button-text="'再想想'"
      @confirm="confirmReceiveOrder"
      @cancel="showConfirmReceiveDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="success" size="48" />
        </div>
        <h3 class="dialog-title">确认收货</h3>
        <p class="dialog-message">
          确认已收到商品吗？
        </p>
      </div>
    </van-dialog>

    <!-- 确认对话框：撤销退款申请 -->
    <van-dialog
      v-model:show="showCancelRefundDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确定撤销'"
      :cancel-button-text="'取消'"
      @confirm="confirmCancelRefund"
      @cancel="showCancelRefundDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="warning-o" size="48" />
        </div>
        <h3 class="dialog-title">撤销退款申请</h3>
        <p class="dialog-message">
          确定要撤销退款申请吗？<br />
          撤销后订单将恢复为"已支付（待使用）"状态。
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showLoadingToast, closeToast, showImagePreview } from 'vant'
  import type { OrderStatus, Order } from '@/types'
  import { formatMoney } from '@/utils/format'
  import { orderService } from '@/services/orders'
  import { api } from '@/services/api'

  const router = useRouter()
  const route = useRoute()

  // 对话框状态
  const showCancelOrderDialog = ref(false)
  const showConfirmReceiveDialog = ref(false)
  const showCancelRefundDialog = ref(false)

  // 订单数据（使用 any 类型以兼容后端返回的数据结构）
  const order = ref<any>({
    id: '',
    orderNo: '',
    totalAmount: 0,
    originalAmount: 0, // 商品原价总额
    shippingFee: 0, // 运费
    status: 'pending' as OrderStatus,
    paymentMethod: 'wechat' as const,
    createdAt: '',
    paidAt: '',
    verifiedAt: '',
    expiryDate: '', // 有效期（促销活动结束时间）
    shippingAddress: null,
    contactName: '',
    contactPhone: '',
    notes: '',
    items: []
  })

  const loading = ref(false)
  const refundRequestDetail = ref<any>(null)

  // 二维码相关状态
  const qrCodeData = ref<string>('')
  const qrCodeLoading = ref(false)
  const qrCodeError = ref<string>('')
  const qrCodeVerified = ref(false)
  const showQRCodeFullscreen = ref(false)

  // 订单状态配置
  const orderStatusMap = {
    pending: { label: '待支付', color: '#ff976a' },
    paid: { label: '已支付（待使用）', color: '#1989fa' },
    verified: { label: '已核销（已使用）', color: '#07c160' },
    cancelled: { label: '已取消', color: '#969799' },
    refunded: { label: '已退款', color: '#969799' },
    refund_requested: { label: '申请退款中', color: '#ff976a' }
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
    if (order.value.verifiedAt) {
      return 1 // 已核销
    } else if (order.value.paidAt) {
      return 0 // 已支付
    }
    return 0
  })

  // 检查是否允许退款
  const canRefund = computed(() => {
    // 如果订单状态不是已支付，不允许退款
    if (order.value.status !== 'paid') {
      return false
    }

    // 检查订单项中是否有促销活动，以及促销活动的退款规则
    if (order.value.items && order.value.items.length > 0) {
      for (const item of order.value.items) {
        // 从订单项中获取促销活动信息（可能来自 item.promotion 或从后端返回的 useRules）
        const promotion = (item as any).promotion
        if (promotion && promotion.useRules) {
          const useRules = promotion.useRules
          // 如果 allowRefund 为 false，则不允许退款
          if (useRules.allowRefund === false) {
            return false
          }
        }
      }
    }

    // 默认允许退款（向后兼容）
    return true
  })

  // 退款被禁用的原因
  const refundDisabledReason = computed(() => {
    if (order.value.items && order.value.items.length > 0) {
      for (const item of order.value.items) {
        const promotion = (item as any).promotion
        if (promotion && promotion.useRules && promotion.useRules.allowRefund === false) {
          return '促销活动规则为不可退'
        }
      }
    }
    return '该订单不支持退款'
  })

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    return orderStatusMap[status as keyof typeof orderStatusMap]?.label || status
  }

  // 获取支付方式标签
  const getPaymentMethodLabel = (method: string) => {
    return paymentMethodMap[method as keyof typeof paymentMethodMap] || method
  }

  // 格式化日期（包含时间）
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化日期（仅年月日）
  const formatDateOnly = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 计算剩余天数
  const getExpiryDays = (endTime: string): number => {
    if (!endTime) return -1
    const endDate = new Date(endTime)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 获取有效期文本
  const getExpiryDaysText = (endTime: string): string => {
    const days = getExpiryDays(endTime)
    if (days < 0) {
      return '已过期'
    } else if (days === 0) {
      return '今天到期'
    } else if (days === 1) {
      return '明天到期'
    } else {
      return `还有${days}天到期`
    }
  }

  // 获取有效期样式类
  const getExpiryDaysClass = (endTime: string): string => {
    const days = getExpiryDays(endTime)
    if (days < 0) {
      return 'expired'
    } else if (days <= 3) {
      return 'urgent'
    } else if (days <= 7) {
      return 'warning'
    } else {
      return 'normal'
    }
  }

  // 去支付
  const goToPayment = () => {
    showToast('跳转到支付页面...')
    // 这里应该跳转到支付页面
  }

  // 取消订单
  const cancelOrder = () => {
    showCancelOrderDialog.value = true
  }

  const confirmCancelOrder = () => {
    showCancelOrderDialog.value = false
    showToast('订单已取消')
    // 这里应该调用API取消订单
  }

  // 确认收货
  const confirmReceive = () => {
    showConfirmReceiveDialog.value = true
  }

  const confirmReceiveOrder = () => {
    showConfirmReceiveDialog.value = false
    showToast('确认收货成功')
    // 这里应该调用API确认收货
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

  // 返回上一页
  const onClickLeft = () => {
    router.back()
  }

  // 跳转到退款申请页面
  const goToRefundRequest = () => {
    router.push({ name: 'RefundRequest', params: { id: order.value.id } })
  }

  // 预览图片
  const previewImage = (url: string, images: string[]) => {
    showImagePreview({
      images: images,
      startPosition: images.indexOf(url),
      closeable: true
    })
  }

  // 撤销退款申请
  const handleCancelRefundRequest = () => {
    showCancelRefundDialog.value = true
  }

  const confirmCancelRefund = async () => {
    try {
      showCancelRefundDialog.value = false
      showLoadingToast('处理中...')
      await orderService.cancelRefundRequest(order.value.id)
      closeToast()
      showToast('退款申请已撤销')
      // 重新加载订单详情
      await loadOrderDetail()
      refundRequestDetail.value = null
    } catch (error: any) {
      closeToast()
      showToast(error.message || '撤销退款申请失败')
    }
  }

  // 加载退款申请详情
  const loadRefundRequestDetail = async () => {
    if (order.value.status !== 'refund_requested') {
      refundRequestDetail.value = null
      return
    }

    try {
      const detail = await orderService.getRefundRequestDetail(order.value.id)
      refundRequestDetail.value = detail
    } catch (error: any) {
      console.error('加载退款申请详情失败:', error)
      // 不显示错误提示，因为可能是没有退款申请记录
      refundRequestDetail.value = null
    }
  }

  // 跳转到商品/促销活动详情页
  const goToProductDetail = (item: any) => {
    // 优先使用 productId，如果没有则使用 productId 字段
    const productId = item.productId || item.id
    if (!productId) {
      showToast('商品信息不完整')
      return
    }
    
    // 检查是否是促销活动（根据商品名称或类型判断，或者从订单备注中获取）
    // 如果订单备注中包含"促销活动"，则跳转到促销活动详情页
    const isPromotion = order.value.notes?.includes('促销活动') || item.productName?.includes('促销活动')
    
    if (isPromotion) {
      router.push({ name: 'PromotionDetail', params: { id: productId } })
    } else {
      router.push({ name: 'ProductDetail', params: { id: productId } })
    }
  }

  // 加载订单详情
  const loadOrderDetail = async () => {
    const orderId = route.params.id as string
    if (!orderId) {
      showToast('订单ID不存在')
      router.back()
      return
    }

    loading.value = true
    try {
      const orderData = await orderService.getOrderDetail(orderId)
      
      // 转换订单状态：API返回大写（PAID），前端使用小写（paid）
      const statusMap: Record<string, OrderStatus> = {
        'PENDING': 'pending',
        'PAID': 'paid',
        'VERIFIED': 'verified',
        'CANCELLED': 'cancelled',
        'REFUNDED': 'refunded',
        'REFUND_REQUESTED': 'refund_requested'
      }
      const normalizedStatus = statusMap[orderData.status as string] || orderData.status as OrderStatus
      
      // 转换支付方式：API返回大写（WECHAT），前端使用小写（wechat）
      const paymentMethodMap: Record<string, 'wechat' | 'alipay' | 'cash' | 'other'> = {
        'WECHAT': 'wechat',
        'ALIPAY': 'alipay',
        'CASH': 'cash',
        'OTHER': 'other'
      }
      const normalizedPaymentMethod = paymentMethodMap[orderData.paymentMethod as string] || 'wechat'
      
      // 转换金额：API返回字符串，需要转换为数字
      const totalAmount = typeof orderData.totalAmount === 'string' 
        ? parseFloat(orderData.totalAmount) 
        : (orderData.totalAmount || 0)
      
      // 转换日期格式
      const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return ''
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return ''
          return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        } catch {
          return ''
        }
      }
      
      // 加载促销活动原价信息、结束时间和商家信息
      let promotionEndTime: string | null = null
      const itemsWithOriginalPrice = await Promise.all(
        (orderData.items || []).map(async (item: any) => {
          // 优先使用订单项中已有的促销活动信息（包含 useRules）
          const existingPromotion = item.promotion
          
          try {
            // 尝试从促销活动API获取原价、结束时间和商家信息
            if (item.productId) {
              const promotionData = await api.get<{
                originalPrice: number
                salePrice: number
                endTime: string
                usageRules?: any
                merchant?: {
                  name?: string
                  address?: string
                  floor?: string
                }
                merchantName?: string
                merchantAddress?: string
                merchantFloor?: string
              }>(`/promotions/${item.productId}`).catch(() => null)
              
              if (promotionData) {
                // 保存第一个促销活动的结束时间
                if (!promotionEndTime && promotionData.endTime) {
                  promotionEndTime = promotionData.endTime
                }
                
                // 获取商家信息（优先使用直接字段，否则从merchant对象获取）
                const merchantName = promotionData.merchantName || promotionData.merchant?.name || ''
                const merchantAddress = promotionData.merchantAddress || promotionData.merchant?.address || ''
                const merchantFloor = promotionData.merchantFloor || promotionData.merchant?.floor || ''
                
                return {
                  ...item,
                  originalPrice: typeof promotionData.originalPrice === 'string' 
                    ? parseFloat(promotionData.originalPrice) 
                    : (promotionData.originalPrice || 0),
                  price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
                  quantity: item.quantity || 1,
                  merchantName,
                  merchantAddress,
                  merchantFloor,
                  // 保留促销活动信息，包括 useRules（优先使用订单项中的，否则使用API返回的）
                  promotion: existingPromotion || {
                    ...promotionData,
                    useRules: promotionData.usageRules || existingPromotion?.useRules
                  }
                }
              }
            }
          } catch (err) {
            console.warn('获取促销活动信息失败:', err)
          }
          
          // 如果没有获取到原价，使用价格作为原价（兼容处理）
          return {
            ...item,
            originalPrice: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
            price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
            quantity: item.quantity || 1,
            merchantName: '',
            merchantAddress: '',
            merchantFloor: '',
            // 保留订单项中已有的促销活动信息（如果存在）
            promotion: existingPromotion || null
          }
        })
      )
      
      // 计算商品原价总额
      const originalAmount = itemsWithOriginalPrice.reduce((sum, item) => {
        return sum + (item.originalPrice * item.quantity)
      }, 0)
      
      // 转换订单数据格式
      order.value = {
        id: orderData.id,
        orderNo: orderData.orderNo || '',
        totalAmount: totalAmount,
        originalAmount: originalAmount, // 商品原价总额
        shippingFee: typeof (orderData as any).shippingFee === 'string' 
          ? parseFloat((orderData as any).shippingFee) 
          : ((orderData as any).shippingFee || 0),
        status: normalizedStatus,
        paymentMethod: normalizedPaymentMethod,
        createdAt: formatDate(orderData.createdAt),
        paidAt: formatDate((orderData as any).paidAt),
        verifiedAt: formatDate((orderData as any).verifiedAt),
        expiryDate: promotionEndTime || '', // 有效期（促销活动结束时间）
        shippingAddress: orderData.shippingAddress || null,
        contactName: (orderData as any).contactName || '',
        contactPhone: (orderData as any).contactPhone || '',
        notes: (orderData as any).notes || (orderData as any).remark || '',
        items: itemsWithOriginalPrice
      }
      
      console.log('订单数据加载成功:', order.value)
      
      // 如果订单状态为申请退款中，加载退款申请详情
      if (order.value.status === 'refund_requested') {
        await loadRefundRequestDetail()
      }
    } catch (error: any) {
      console.error('加载订单详情失败:', error)
      showToast(error.message || '加载订单详情失败')
      router.back()
    } finally {
      loading.value = false
    }

    // 如果订单状态为paid，自动加载二维码
    if (order.value.status === 'paid') {
      loadQRCode()
    } else if (order.value.status === 'verified') {
      qrCodeVerified.value = true
    }
  }

  // 初始化
  // 加载二维码
  const loadQRCode = async () => {
    if (order.value.status !== 'paid') {
      qrCodeError.value = '订单状态不正确，无法生成二维码'
      return
    }

    qrCodeLoading.value = true
    qrCodeError.value = ''

    try {
      const result = await orderService.getOrderQRCode(order.value.id)
      qrCodeData.value = result.qrCodeData
    } catch (err: any) {
      qrCodeError.value = err.message || '获取二维码失败'
      showToast({
        message: qrCodeError.value,
        type: 'fail'
      })
    } finally {
      qrCodeLoading.value = false
    }
  }

  // 处理二维码点击
  const handleQRCodeClick = () => {
    if (qrCodeData.value && !qrCodeLoading.value && !qrCodeError.value && !qrCodeVerified.value) {
      showQRCodeFullscreen.value = true
      document.body.style.overflow = 'hidden'
    }
  }

  // 关闭全屏
  const closeQRCodeFullscreen = () => {
    showQRCodeFullscreen.value = false
    document.body.style.overflow = ''
  }

  // 监听订单状态变化，更新二维码状态
  watch(() => order.value.status, (newStatus) => {
    if (newStatus === 'verified') {
      qrCodeVerified.value = true
    } else if (newStatus === 'paid') {
      qrCodeVerified.value = false
      loadQRCode()
    }
  })

  onMounted(() => {
    loadOrderDetail()
  })

  onUnmounted(() => {
    // 确保恢复body滚动
    document.body.style.overflow = ''
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;
  @use '@/styles/dialog-mixin.scss' as *;
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .order-detail-page {
    min-height: 100vh;
    background: var(--theme-bg-gradient, $glass-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
    padding-bottom: 100px;

    // 导航栏样式
    :deep(.van-nav-bar) {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      
      .van-nav-bar__title {
        color: $text-color-primary;
        font-weight: 600;
      }
      
      .van-nav-bar__arrow {
        color: $text-color-primary;
      }
    }
  }

  .order-header {
    @include glassmorphism-card(base);
    padding: 24px 20px;
    margin: 16px;
    margin-bottom: 12px;

    .order-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h2 {
        font-size: 20px;
        font-weight: 600;
        color: #323233;
        margin: 0;
      }

      .status-badge {
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 500;

        &.pending {
          background: var(--primary-color-alpha-10, rgba(25, 137, 250, 0.1));
          color: var(--primary-color);
        }

        &.paid {
          background: var(--primary-color-alpha-10, rgba(25, 137, 250, 0.1));
          color: var(--primary-color);
        }

        &.verified {
          background: var(--primary-color-alpha-10, rgba(25, 137, 250, 0.1));
          color: var(--primary-color);
        }

        &.cancelled {
          background: rgba(150, 151, 153, 0.1);
          color: var(--van-text-color-3);
        }

        &.refund_requested {
          background: var(--primary-color-alpha-10, rgba(25, 137, 250, 0.1));
          color: var(--primary-color);
        }
      }
    }

    .order-meta {
      .order-no,
      .order-time {
        font-size: 13px;
        color: #969799;
        margin-bottom: 6px;
        line-height: 1.5;
      }

      .order-expiry {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #ebedf0;
        font-size: 13px;
        flex-wrap: wrap;

        .expiry-label {
          color: #646566;
        }

        .expiry-date {
          color: #323233;
          font-weight: 500;
        }

        .expiry-days {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;

          &.normal {
            background: var(--primary-color-alpha-10, rgba(25, 137, 250, 0.1));
            color: var(--primary-color);
          }

          &.warning {
            background: rgba(255, 151, 106, 0.1);
            color: #ff976a;
          }

          &.urgent {
            background: rgba(238, 10, 36, 0.1);
            color: #ee0a24;
          }

          &.expired {
            background: rgba(150, 151, 153, 0.1);
            color: #969799;
          }
        }
      }
    }
  }

  .order-timeline {
    @include glassmorphism-card(base);
    padding: 20px;
    margin: 16px;
    margin-bottom: 12px;
    border-radius: 0;

    .step-time {
      font-size: 12px;
      color: #969799;
      margin-top: 6px;
    }
  }

  .qrcode-payment-container {
    @include glassmorphism-card(base);
    padding: 20px;
    margin: 16px;
    margin-bottom: 12px;
    border-radius: 0;
    display: flex;
    gap: 20px;
    align-items: stretch; // 改为stretch，让子元素填充高度
    position: relative;

    // 二维码区域（40%）
    .qrcode-area {
      width: 40%;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center; // 垂直居中
      padding: 0;
      padding-top: 16px; // 向下偏移，与支付信息内容区域对齐（标题高度的一半）
      position: relative;
      height: 100%; // 与支付信息区域高度一致

      .qrcode-wrapper {
        position: relative;
        // 高度与支付信息区域一致（通过父容器height: 100%）
        height: 100%; // 高度与支付信息区域一致
        // 宽度自适应，保持正方形（取高度和宽度的较小值）
        width: min(100%, 100%); // 宽度不超过容器，但保持正方形
        aspect-ratio: 1; // 保持正方形
        // 如果高度更小，则按高度调整宽度
        max-width: 100%;
        max-height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f7f8fa;
        border-radius: 8px;
        border: 2px solid #ebedf0;
        overflow: hidden;
        transition: all 0.2s;
        margin: 0 auto; // 水平居中
        box-sizing: border-box; // 确保border包含在宽度内

        &.verified {
          border-color: #07c160;
        }

        &.clickable {
          cursor: pointer;

          &:active {
            transform: scale(0.98);
          }
        }
      }

      .qrcode-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .qrcode-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: #969799;
      }

      .qrcode-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 20px;
        text-align: center;

        .error-message {
          font-size: 12px;
          color: #ee0a24;
          margin: 0;
        }
      }

      .verified-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.95);
        z-index: 10;

        .verified-text {
          font-size: 14px;
          font-weight: bold;
          color: #07c160;
          margin-top: 8px;
        }
      }

    }

    // 支付信息区域（60%）
    .payment-info {
      width: 60%;
      flex: 1;
      margin: 0;
      padding: 16px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      min-width: 0;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #323233;
        margin: 0 0 16px 0;
      }
    }

    // 移动端也保持左右布局，但调整间距和尺寸
    @media (max-width: 767px) {
      gap: 12px;
      padding: 16px;
      align-items: stretch; // 让子元素填充高度

      .qrcode-area {
        width: 40%;
        align-items: center;
        padding-top: 12px; // 移动端向下偏移，与支付信息内容对齐

        .qrcode-wrapper {
          max-width: 180px; // 移动端适当增大
        }
      }

      .payment-info {
        width: 60%;
        padding: 12px;
        border-radius: 8px;
      }
    }
  }

  .shipping-info,
  .product-info,
  .payment-info,
  .refund-request-info {
    @include glassmorphism-card(base);
    padding: 20px;
    margin: 16px;
    margin-bottom: 12px;
    border-radius: 0;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #323233;
      margin: 0 0 16px 0;
    }
  }

  .refund-request-info {
    .refund-info-content {
      .info-row {
        display: flex;
        margin-bottom: 12px;
        font-size: 14px;
        line-height: 1.5;

        .info-label {
          color: #969799;
          min-width: 80px;
          flex-shrink: 0;
        }

        .info-value {
          color: #323233;
          flex: 1;
          word-break: break-all;
        }

        .info-images {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;

          .refund-image {
            width: 80px;
            height: 80px;
            border-radius: 4px;
            object-fit: cover;
            cursor: pointer;
            border: 1px solid #ebedf0;
          }
        }
      }
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
    cursor: pointer;
    transition: all 0.2s;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    
    &:active {
      background-color: #f7f8fa;
    }
    
    display: flex;
    align-items: center;
    gap: 12px;

    .product-image {
      width: 72px;
      height: 72px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .product-details {
      flex: 1;
      min-width: 0;

      .product-name {
        font-size: 15px;
        color: #323233;
        margin-bottom: 8px;
        line-height: 1.4;
        font-weight: 500;
      }

      .product-specs {
        display: flex;
        gap: 16px;
        font-size: 13px;
        color: #969799;
        line-height: 1.5;
        margin-bottom: 8px;
      }

      .merchant-info {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #ebedf0;

        .merchant-name {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #323233;
          margin-bottom: 4px;
          font-weight: 500;

          .merchant-icon {
            font-size: 14px;
            color: var(--primary-color);
          }
        }

        .merchant-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #646566;
          flex-wrap: wrap;

          .location-icon {
            font-size: 13px;
            color: #969799;
            flex-shrink: 0;
          }

          .floor-text {
            margin-left: 4px;
            padding: 1px 6px;
            background: var(--primary-color-alpha-10, rgba(25, 137, 250, 0.1));
            color: var(--primary-color);
            border-radius: 8px;
            font-size: 11px;
          }
        }
      }
    }

    .product-price {
      font-size: 17px;
      font-weight: 600;
      color: #ee0a24;
      flex-shrink: 0;
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

<!-- 全屏遮罩层样式（全局样式，因为Teleport渲染到body） -->
<style lang="scss">
  .fullscreen-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.85) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999 !important;
    cursor: pointer !important;

    .fullscreen-content {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 24px !important;
      cursor: default !important;

      .fullscreen-qrcode-image {
        width: 300px !important;
        height: 300px !important;
        object-fit: contain !important;
        background: #fff !important;
        border-radius: 12px !important;
        padding: 20px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      }

      .fullscreen-hint {
        color: #fff !important;
        font-size: 14px !important;
        margin: 0 !important;
        text-align: center !important;
        opacity: 0.9 !important;
      }
    }
  }
</style>
