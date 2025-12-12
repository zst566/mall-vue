<template>
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
          <van-button type="primary" size="small" @click="handleRetry">重试</van-button>
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
          <span class="total-amount">¥{{ formatMoney(order.finalAmount ?? order.totalAmount) }}</span>
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
        <span class="total-amount">¥{{ formatMoney(order.finalAmount ?? order.totalAmount) }}</span>
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatMoney } from '@/utils/format'
import type { OrderStatus } from '@/types'

interface Props {
  order: {
    status: OrderStatus | string
    originalAmount?: number
    shippingFee?: number
    totalAmount: number
    finalAmount?: number // 实付金额（补贴后的金额）
    paymentMethod: string
    paidAt?: string
  }
  qrCodeData: string
  qrCodeLoading: boolean
  qrCodeError: string
  qrCodeVerified: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'qrcode-click': []
  'retry-load': []
}>()

const showQRCodeFullscreen = ref(false)

// 支付方式配置
const paymentMethodMap = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金支付',
  other: '其他'
}

// 获取支付方式标签
const getPaymentMethodLabel = (method: string) => {
  return paymentMethodMap[method as keyof typeof paymentMethodMap] || method
}

// 处理二维码点击
const handleQRCodeClick = () => {
  if (props.qrCodeData && !props.qrCodeLoading && !props.qrCodeError && !props.qrCodeVerified) {
    showQRCodeFullscreen.value = true
    document.body.style.overflow = 'hidden'
    emit('qrcode-click')
  }
}

// 关闭全屏
const closeQRCodeFullscreen = () => {
  showQRCodeFullscreen.value = false
  document.body.style.overflow = ''
}

// 处理重试
const handleRetry = () => {
  emit('retry-load')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.qrcode-payment-container {
  @include glassmorphism-card(base);
  padding: 20px;
  margin: 16px;
  margin-bottom: 12px;
  border-radius: 0;
  display: flex;
  gap: 20px;
  align-items: stretch;
  position: relative;

  // 二维码区域（40%）
  .qrcode-area {
    width: 40%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
    padding-top: 16px;
    position: relative;
    height: 100%;

    .qrcode-wrapper {
      position: relative;
      height: 100%;
      width: min(100%, 100%);
      aspect-ratio: 1;
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
      margin: 0 auto;
      box-sizing: border-box;

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
    align-items: stretch;

    .qrcode-area {
      width: 40%;
      align-items: center;
      padding-top: 12px;

      .qrcode-wrapper {
        max-width: 180px;
      }
    }

    .payment-info {
      width: 60%;
      padding: 12px;
      border-radius: 8px;
    }
  }
}

.payment-info {
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






