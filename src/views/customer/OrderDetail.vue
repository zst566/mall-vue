<template>
  <div class="order-detail-page">
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

    <!-- 订单二维码（仅当订单状态为待使用或已核销时显示） -->
    <div v-if="order.status === 'paid' || order.status === 'verified'" class="order-qrcode-section">
      <OrderQRCode :orderId="order.id" :orderStatus="order.status" />
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

    <!-- 支付信息 -->
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
        <van-button type="danger" block @click="goToRefundRequest">申请退款</van-button>
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
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showLoadingToast, closeToast, showDialog, showImagePreview } from 'vant'
  import type { OrderStatus, Order } from '@/types'
  import { formatMoney } from '@/utils/format'
  import OrderQRCode from '@/components/customer/OrderQRCode.vue'
  import { orderService } from '@/services/orders'
  import { api } from '@/services/api'

  const router = useRouter()
  const route = useRoute()

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
    showDialog({
      title: '撤销退款申请',
      message: '确定要撤销退款申请吗？撤销后订单将恢复为"已支付（待使用）"状态。',
      showCancelButton: true,
      confirmButtonText: '确定撤销',
      cancelButtonText: '取消'
    })
      .then(async () => {
        try {
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
      })
      .catch(() => {
        // 取消操作
      })
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
          try {
            // 尝试从促销活动API获取原价、结束时间和商家信息
            if (item.productId) {
              const promotionData = await api.get<{
                originalPrice: number
                salePrice: number
                endTime: string
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
                  merchantFloor
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
            merchantFloor: ''
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
  }

  // 初始化
  onMounted(() => {
    loadOrderDetail()
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .order-detail-page {
    min-height: 100vh;
    background: var(--theme-bg-gradient, $glass-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
    padding-bottom: 100px;
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

  .order-qrcode-section {
    @include glassmorphism-card(base);
    padding: 24px 20px;
    margin: 16px;
    margin-bottom: 12px;
    border-radius: 0;
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
</style>
