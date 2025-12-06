<template>
  <van-popup 
    v-model:show="isVisible"
    position="bottom" 
    round 
    :style="{ height: '75%', zIndex: 2000 }"
    :close-on-click-overlay="false"
    :close-on-popstate="true"
    :overlay-style="overlayStyle"
    :z-index="2000"
    @close="handleClose"
    class="scan-result-popup"
  >
    <div class="result-popup" @click.stop @mousedown.stop @touchstart.stop>
      <div class="popup-header" @click.stop @mousedown.stop @touchstart.stop>
        <h3>扫描结果</h3>
        <van-icon name="cross" @click.stop="handleClose" @mousedown.stop @touchstart.stop class="close-icon" />
      </div>
      <div class="popup-content" @click.stop @mousedown.stop @touchstart.stop>
        <!-- 调试信息（开发环境显示） -->
        <div v-if="isDev" class="debug-info">
          <div><strong>调试信息：</strong></div>
          <div>弹窗显示: {{ isVisible }}</div>
          <div>外部状态: {{ modelValue }}</div>
          <div v-if="scanResult">
            <div>订单状态: {{ scanResult.data.status }}</div>
            <div>可核销: {{ canVerify(scanResult.data.status) }}</div>
            <div>订单号: {{ scanResult.data.orderNo }}</div>
          </div>
          <div v-else>订单数据: null</div>
        </div>
        <div v-if="scanResult" class="result-info">
          <!-- 功能标识区 -->
          <div class="function-badge">
            <van-icon name="orders-o" class="badge-icon" />
            <span class="badge-text">订单核销</span>
          </div>
          <!-- 订单详情区 -->
          <div class="result-details">
            <div class="detail-item">
              <span class="detail-label">订单号</span>
              <span class="detail-value">{{ scanResult.data.orderNo }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">商品信息</span>
              <span class="detail-value">{{ scanResult.data.productName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">购买数量</span>
              <span class="detail-value">{{ scanResult.data.quantity }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">支付金额</span>
              <span class="detail-value">¥{{ scanResult.data.amount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">购买时间</span>
              <span class="detail-value">{{ formatTime(scanResult.data.purchasedAt) }}</span>
            </div>
          </div>
          <!-- 底部操作按钮 -->
          <div class="result-actions" @click.stop @mousedown.stop @touchstart.stop>
            <van-button
              v-if="canVerify(scanResult.data.status)"
              type="primary"
              block
              round
              @click.stop="handleVerify"
              @mousedown.stop
              @touchstart.stop
              :loading="isVerifying"
              :disabled="isVerifying"
              class="verify-button"
            >
              {{ isVerifying ? '核销中...' : '确认核销' }}
            </van-button>
            <van-button v-else type="default" block round @click.stop="handleClose" @mousedown.stop @touchstart.stop class="close-button">
              关闭 (状态: {{ scanResult.data.status }})
            </van-button>
          </div>
        </div>
        <div v-else class="no-data">
          <van-empty description="暂无订单数据" />
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { ScanResult } from '@/types/scan'
import { getResultIcon, formatTime } from '@/utils/scanHelpers'
import '@/styles/mixins.scss'
import '@/styles/variables.scss'

const props = defineProps<{
  modelValue: boolean
  scanResult: ScanResult | null
  isVerifying: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'verify': []
}>()

// 使用内部状态控制弹窗显示，确保响应式更新
const isVisible = ref(props.modelValue)

// 监听外部 modelValue 变化，同步到内部状态
watch(() => props.modelValue, (newVal) => {
  console.log('📋 [弹窗] 外部状态变化:', newVal)
  isVisible.value = newVal
  
  if (newVal && props.scanResult) {
    console.log('📋 [弹窗] 弹窗已打开，订单数据:', props.scanResult)
    console.log('📋 [弹窗] 订单状态:', props.scanResult.data.status)
    console.log('📋 [弹窗] 是否可以核销:', canVerify(props.scanResult.data.status))
    console.log('📋 [弹窗] isVisible 值:', isVisible.value)
  }
}, { immediate: true })

// 监听内部状态变化，同步到外部
watch(isVisible, (newVal) => {
  console.log('📋 [弹窗] 内部状态变化:', newVal)
  emit('update:modelValue', newVal)
})

// 处理弹窗关闭
const handleClose = () => {
  console.log('📋 [弹窗] 弹窗关闭事件触发')
  isVisible.value = false
}

// 判断是否为开发环境
const isDev = computed(() => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
})

// 遮罩样式
const overlayStyle = computed(() => ({
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  zIndex: 1999
}))

// 处理核销按钮点击
const handleVerify = (event: Event) => {
  // 阻止事件冒泡，防止触发遮罩层关闭
  event.stopPropagation()
  event.preventDefault()
  
  console.log('📋 [弹窗] 点击核销按钮')
  console.log('📋 [弹窗] 当前订单状态:', props.scanResult?.data.status)
  emit('verify')
}

/**
 * 判断是否可以核销
 * 支持的状态：pending, paid, PAID（不区分大小写）
 */
const canVerify = (status: string | undefined): boolean => {
  if (!status) {
    console.warn('⚠️ [弹窗] 订单状态为空，无法核销')
    return false
  }
  const normalizedStatus = status.toLowerCase()
  const canVerifyResult = normalizedStatus === 'pending' || normalizedStatus === 'paid'
  console.log('📋 [弹窗] 订单状态判断:', {
    originalStatus: status,
    normalizedStatus,
    canVerify: canVerifyResult
  })
  return canVerifyResult
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

// 紫色主题色
$purple-primary: #8B5CF6;      // 主紫色
$purple-light: #E9D5FF;        // 浅紫色
$purple-dark: #6D28D9;         // 深紫色
$purple-text: #6D28D9;         // 紫色文字

// 弹窗容器
:deep(.van-popup) {
  z-index: 2000 !important;
  border-radius: 24px 24px 0 0 !important;
  overflow: hidden !important;
  background: #ffffff !important;
}

:deep(.van-overlay) {
  z-index: 1999 !important;
  background: rgba(0, 0, 0, 0.4) !important;
}

.result-popup {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  position: relative;
  z-index: 2001 !important;
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.1);

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    flex-shrink: 0;
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #323233;
      letter-spacing: -0.3px;
    }

    .close-icon {
      cursor: pointer;
      font-size: 20px;
      color: #646566;
      transition: all 0.2s ease;
      padding: 4px;
      border-radius: 50%;
      
      &:hover {
        color: #323233;
        background: rgba(0, 0, 0, 0.05);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  .popup-content {
    padding: 24px;
    flex: 1;
    overflow-y: auto;
    background: #ffffff;

    .debug-info {
      padding: 12px;
      background: #f5f5f5;
      margin-bottom: 16px;
      font-size: 12px;
      border-radius: 8px;
      color: #646566;
    }

    .result-info {
      .function-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 24px;
        padding: 14px 18px;
        background: $purple-light;
        border-radius: 12px;
        position: relative;

        .badge-icon {
          color: $purple-text;
          font-size: 22px;
        }

        .badge-text {
          font-size: 16px;
          font-weight: 600;
          color: $purple-text;
        }
      }

      .result-details {
        margin-bottom: 24px;
        background: #ffffff;
        border-radius: 0;

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);

          &:last-child {
            border-bottom: none;
          }

          .detail-label {
            font-size: 14px;
            color: #969799;
            font-weight: 400;
          }

          .detail-value {
            font-size: 15px;
            color: #323233;
            font-weight: 500;
            text-align: right;
            flex: 1;
            margin-left: 16px;
          }
        }
      }

      .result-actions {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        position: relative;
        z-index: 2010 !important;
        
        .verify-button {
          position: relative;
          z-index: 2011 !important;
          pointer-events: auto !important;
          height: 50px !important;
          border-radius: 12px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          border: none !important;
          background: $purple-primary !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3) !important;
          transition: all 0.2s ease !important;

          &:active {
            transform: scale(0.98) !important;
            box-shadow: 0 1px 4px rgba(139, 92, 246, 0.3) !important;
          }

          &:disabled {
            opacity: 0.6 !important;
          }
        }

        .close-button {
          position: relative;
          z-index: 2011 !important;
          pointer-events: auto !important;
          height: 50px !important;
          border-radius: 12px !important;
          font-size: 16px !important;
          font-weight: 500 !important;
          background: #f7f8fa !important;
          color: #646566 !important;
          border: 1px solid rgba(0, 0, 0, 0.06) !important;
          transition: all 0.2s ease !important;

          &:active {
            transform: scale(0.98) !important;
            background: #ebedf0 !important;
          }
        }
      }
    }

    .no-data {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
  }
}

// 弹窗进入动画
:deep(.van-popup) {
  animation: slideUpFade 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUpFade {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>