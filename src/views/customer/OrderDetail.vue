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
      <OrderHeader :order="order" />

      <!-- 二维码和支付信息 -->
      <QRCodePayment
        :order="order"
        :qr-code-data="qrCodeData"
        :qr-code-loading="qrCodeLoading"
        :qr-code-error="qrCodeError"
        :qr-code-verified="qrCodeVerified"
        @qrcode-click="handleQRCodeClick"
        @retry-load="loadQRCode"
      />

      <!-- 促销活动信息 -->
      <ProductInfo
        v-if="order.items && order.items.length > 0"
        :items="order.items"
        @product-click="goToProductDetail"
      />

      <!-- 退款申请详情 -->
      <RefundRequestInfo
        v-if="order.status === 'refund_requested' && refundRequestDetail"
        :refund-request-detail="refundRequestDetail"
        @image-preview="previewImage"
      />

      <!-- 操作按钮 -->
      <OrderActions
        :order="order"
        :can-refund="canRefund"
        :refund-disabled-reason="refundDisabledReason"
        @payment="goToPayment"
        @cancel="cancelOrder"
        @refund="goToRefundRequest"
        @review="reviewProduct"
        @buy-again="buyAgain"
        @continue-shopping="goToProducts"
        @cancel-refund="handleCancelRefundRequest"
      />
    </template>

    <!-- 确认对话框 -->
    <OrderDialogs
      v-model:show-cancel-order="showCancelOrderDialog"
      v-model:show-confirm-receive="showConfirmReceiveDialog"
      v-model:show-cancel-refund="showCancelRefundDialog"
      @confirm-cancel-order="confirmCancelOrder"
      @confirm-receive="confirmReceiveOrder"
      @confirm-cancel-refund="confirmCancelRefund"
      @cancel="handleDialogCancel"
    />
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
  import OrderHeader from '@/components/customer/OrderHeader.vue'
  import QRCodePayment from '@/components/customer/QRCodePayment.vue'
  import ProductInfo from '@/components/customer/ProductInfo.vue'
  import RefundRequestInfo from '@/components/customer/RefundRequestInfo.vue'
  import OrderActions from '@/components/customer/OrderActions.vue'
  import OrderDialogs from '@/components/customer/OrderDialogs.vue'


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

  // 格式化日期（包含时间）- 用于退款申请详情
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

  // 预览图片（由 RefundRequestInfo 组件内部处理）
  const previewImage = (url: string, images: string[]) => {
    // 图片预览逻辑已移至 RefundRequestInfo 组件内部
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
    // 优先使用订单上的 promotionId 或 订单项中附带的 promotion.id 作为促销活动 ID
    const promotionIdFromOrder = (order.value as any).promotionId || (item as any).promotion?.id

    // 商品维度的 productId（用于普通商品详情）
    const productId = item.productId || item.id

    if (!promotionIdFromOrder && !productId) {
      showToast('商品信息不完整')
      return
    }
    
    // 判断是否为促销活动订单
    const isPromotion = !!promotionIdFromOrder || order.value.notes?.includes('促销活动') || item.productName?.includes('促销活动')
    
    if (isPromotion && promotionIdFromOrder) {
      // 对于促销订单，使用促销活动 ID 跳转促销详情，避免错误地用 productId 当作促销 ID
      router.push({ name: 'PromotionDetail', params: { id: String(promotionIdFromOrder) } })
    } else if (productId) {
      // 普通商品或没有促销 ID 的场景，仍然按商品详情跳转
      router.push({ name: 'ProductDetail', params: { id: productId } })
    } else {
      showToast('无法跳转到详情')
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
      // 暂时停用额外的 /promotions/{id} 请求，避免 404 干扰调试
      // 后续如需重新启用，可在此处基于 promotionId 调用促销详情接口
      let promotionEndTime: string | null = null
      const itemsWithOriginalPrice = await Promise.all(
        (orderData.items || []).map(async (item: any) => {
          const existingPromotion = item.promotion

          // 如果订单项或订单本身已经带有促销信息，则优先使用其中的原价和结束时间
          const originalPriceFromPromotion =
            (existingPromotion as any)?.originalPrice ??
            (item as any).originalPrice ??
            item.price

          const endTimeFromPromotion =
            (existingPromotion as any)?.endTime ??
            (orderData as any).expiryDate ??
            null

          if (!promotionEndTime && endTimeFromPromotion) {
            promotionEndTime = endTimeFromPromotion
          }

          return {
            ...item,
            originalPrice:
              typeof originalPriceFromPromotion === 'string'
                ? parseFloat(originalPriceFromPromotion)
                : originalPriceFromPromotion || 0,
            price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
            quantity: item.quantity || 1,
            merchantName: (item as any).merchantName || '',
            merchantAddress: (item as any).merchantAddress || '',
            merchantFloor: (item as any).merchantFloor || '',
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
        // 促销活动 ID（如果有），用于前端跳转促销详情和查询促销信息
        promotionId: (orderData as any).promotionId || null,
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

  // 处理二维码点击（由 QRCodePayment 组件内部处理全屏显示）
  const handleQRCodeClick = () => {
    // 全屏显示逻辑已移至 QRCodePayment 组件内部
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

  // 处理对话框取消
  const handleDialogCancel = () => {
    showCancelOrderDialog.value = false
    showConfirmReceiveDialog.value = false
    showCancelRefundDialog.value = false
  }

  onUnmounted(() => {
    // 确保恢复body滚动
    document.body.style.overflow = ''
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
    padding-bottom: 20px;

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
</style>
