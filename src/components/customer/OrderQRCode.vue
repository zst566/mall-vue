<template>
  <div class="order-qrcode" :class="`size-${size}`">
    <!-- 二维码区域 -->
    <div class="qrcode-container">
      <div 
        class="qrcode-wrapper" 
        :class="{ 'verified': isVerified, 'clickable': qrCodeData && !loading && !error && !isVerified }"
        @click="handleQRCodeClick"
      >
        <!-- 加载状态 -->
        <div v-if="loading" class="qrcode-loading">
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
        <div v-else-if="error" class="qrcode-error">
          <van-icon name="warning-o" size="48" color="#ee0a24" />
          <p class="error-message">{{ error }}</p>
          <van-button type="primary" size="small" @click="loadQRCode">重试</van-button>
        </div>

        <!-- 已核销状态 - 大大的勾 -->
        <div v-if="isVerified" class="verified-overlay">
          <div class="checkmark">
            <van-icon name="success" size="80" color="#07c160" />
          </div>
          <div class="verified-text">已核销</div>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="qrcode-hint">
        <p v-if="!isVerified" class="hint-text">点击放大</p>
        <p v-else class="hint-text verified-hint">订单已核销，二维码已失效</p>
      </div>
    </div>

    <!-- 全屏遮罩层 -->
    <div v-if="showFullscreen" class="fullscreen-overlay" @click="closeFullscreen">
      <div class="fullscreen-content" @click.stop>
        <div class="fullscreen-qrcode-wrapper">
          <img
            v-if="qrCodeData"
            :src="qrCodeData"
            alt="订单二维码"
            class="fullscreen-qrcode-image"
          />
        </div>
        <div class="fullscreen-hint">
          <p v-if="!isVerified" class="hint-text">请向商户出示此二维码进行核销</p>
          <p v-else class="hint-text verified-hint">订单已核销，二维码已失效</p>
        </div>
        <div class="fullscreen-close-hint">点击任意位置关闭</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { showToast } from 'vant'
import { orderService } from '@/services/orders'
import type { OrderStatus } from '@/types'

interface Props {
  orderId: string
  orderStatus: OrderStatus
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const qrCodeData = ref<string>('')
const loading = ref(false)
const error = ref<string>('')
const isVerified = ref(false)
const showFullscreen = ref(false)
let pollTimer: ReturnType<typeof setTimeout> | null = null
let pollCount = 0
const MAX_POLL_COUNT = 100 // 最大轮询次数，防止无限轮询

// 生成随机轮询间隔（5~20秒）
const getRandomPollInterval = (): number => {
  return Math.floor(Math.random() * 15000) + 5000 // 5000ms ~ 20000ms
}

// 加载二维码
const loadQRCode = async () => {
  if (props.orderStatus !== 'paid') {
    error.value = '订单状态不正确，无法生成二维码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await orderService.getOrderQRCode(props.orderId)
    qrCodeData.value = result.qrCodeData
  } catch (err: any) {
    error.value = err.message || '获取二维码失败'
    showToast({
      message: error.value,
      type: 'fail'
    })
  } finally {
    loading.value = false
  }
}

// 轮询订单状态
const pollOrderStatus = async () => {
  if (isVerified.value || pollCount >= MAX_POLL_COUNT) {
    stopPolling()
    return
  }

  try {
    const order = await orderService.getOrderDetail(props.orderId)
    
    // 转换订单状态：API返回大写，前端使用小写
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'PAID': 'paid',
      'VERIFIED': 'verified',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded'
    }
    const normalizedStatus = statusMap[order.status as string] || order.status
    
    // 检查订单状态是否变为已核销
    if (normalizedStatus === 'verified') {
      isVerified.value = true
      stopPolling()
      showToast({
        message: '订单已核销',
        type: 'success'
      })
      return
    }

    // 如果订单状态不是 paid，停止轮询
    if (normalizedStatus !== 'paid') {
      stopPolling()
      return
    }

    pollCount++
    console.log(`订单状态轮询 (${pollCount}/${MAX_POLL_COUNT}): 订单状态为 ${normalizedStatus}`)
  } catch (err: any) {
    // 网络错误不中断轮询，继续尝试
    console.error('轮询订单状态失败:', err)
  }

  // 继续下一次轮询
  if (!isVerified.value && pollCount < MAX_POLL_COUNT) {
    const interval = getRandomPollInterval()
    console.log(`下次轮询将在 ${interval / 1000} 秒后执行`)
    pollTimer = setTimeout(pollOrderStatus, interval)
  } else {
    stopPolling()
  }
}

// 开始轮询
const startPolling = () => {
  if (props.orderStatus !== 'paid' || isVerified.value) {
    return
  }

  pollCount = 0
  const interval = getRandomPollInterval()
  pollTimer = setTimeout(pollOrderStatus, interval)
}

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

// 监听订单状态变化
watch(() => props.orderStatus, (newStatus) => {
  if (newStatus === 'verified') {
    isVerified.value = true
    stopPolling()
  } else if (newStatus === 'paid' && !isVerified.value) {
    startPolling()
  } else {
    stopPolling()
  }
})

// 组件挂载时加载二维码并开始轮询
onMounted(() => {
  if (props.orderStatus === 'paid') {
    loadQRCode()
    startPolling()
  } else if (props.orderStatus === 'verified') {
    isVerified.value = true
  }
})

// 处理二维码点击
const handleQRCodeClick = () => {
  if (qrCodeData.value && !loading.value && !error.value && !isVerified.value) {
    openFullscreen()
  }
}

// 打开全屏
const openFullscreen = () => {
  showFullscreen.value = true
  // 锁定body滚动
  document.body.style.overflow = 'hidden'
}

// 关闭全屏
const closeFullscreen = () => {
  showFullscreen.value = false
  // 恢复body滚动
  document.body.style.overflow = ''
}

// 组件卸载时清理定时器和恢复滚动
onUnmounted(() => {
  stopPolling()
  // 确保恢复body滚动
  document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

.order-qrcode {
  width: 100%;
  padding: 20px;
  @include glassmorphism-card(base);
  margin-bottom: 20px;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  border-radius: 8px;
  border: 2px solid #ebedf0;
  overflow: hidden;
  transition: all 0.2s;

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

// 根据size prop设置尺寸
.order-qrcode.size-small .qrcode-wrapper {
  width: 120px;
  height: 120px;
}

.order-qrcode.size-medium .qrcode-wrapper {
  width: 200px;
  height: 200px;
}

.order-qrcode.size-large .qrcode-wrapper {
  width: 300px;
  height: 300px;
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
    font-size: 14px;
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
  @include glassmorphism-card(strong);
  z-index: 10;

  .checkmark {
    margin-bottom: 12px;
    animation: scaleIn 0.3s ease-out;
  }

  .verified-text {
    font-size: 18px;
    font-weight: bold;
    color: #07c160;
    animation: fadeIn 0.3s ease-out;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.qrcode-hint {
  margin-top: 16px;
  text-align: center;

  .hint-text {
    font-size: 14px;
    color: #646566;
    margin: 0;
  }

  .verified-hint {
    color: #07c160;
    font-weight: 500;
  }
}

// 全屏遮罩层
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;

  .fullscreen-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px;
    animation: scaleIn 0.3s ease-out;
  }

  .fullscreen-qrcode-wrapper {
    width: 300px;
    height: 300px;
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .fullscreen-qrcode-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .fullscreen-hint {
    text-align: center;

    .hint-text {
      font-size: 16px;
      color: #fff;
      margin: 0;
    }

    .verified-hint {
      color: #07c160;
      font-weight: 500;
    }
  }

  .fullscreen-close-hint {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 10px;
  }
}

// 移动端适配
@media (max-width: 768px) {
  .order-qrcode.size-medium .qrcode-wrapper,
  .order-qrcode.size-large .qrcode-wrapper {
    width: 250px;
    height: 250px;
  }

  .verified-overlay {
    .checkmark {
      :deep(.van-icon) {
        font-size: 60px;
      }
    }

    .verified-text {
      font-size: 16px;
    }
  }

  .fullscreen-overlay {
    .fullscreen-qrcode-wrapper {
      width: 280px;
      height: 280px;
      padding: 15px;
    }

    .fullscreen-hint .hint-text {
      font-size: 14px;
    }
  }
}
</style>

