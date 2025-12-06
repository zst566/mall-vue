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
    class="glassmorphism-popup"
  >
    <div class="result-popup" @click.stop @mousedown.stop @touchstart.stop>
      <div class="popup-header" @click.stop @mousedown.stop @touchstart.stop>
        <h3>扫描结果</h3>
        <van-icon name="cross" @click.stop="handleClose" @mousedown.stop @touchstart.stop />
      </div>
      <div class="popup-content" @click.stop @mousedown.stop @touchstart.stop>
        <!-- 调试信息（开发环境显示） -->
        <div v-if="isDev" style="padding: 8px; background: #f0f0f0; margin-bottom: 16px; font-size: 12px; border-radius: 4px;">
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
          <div class="result-type">
            <van-icon :name="getResultIcon(scanResult.type)" />
            <span class="type-text">{{ scanResult.title }}</span>
          </div>
          <div class="result-details">
            <van-cell-group inset>
              <van-cell title="订单号" :value="scanResult.data.orderNo" />
              <van-cell title="商品信息" :value="scanResult.data.productName" />
              <van-cell title="购买数量" :value="scanResult.data.quantity" />
              <van-cell title="支付金额" :value="'¥' + scanResult.data.amount" />
              <van-cell title="购买时间" :value="formatTime(scanResult.data.purchasedAt)" />
            </van-cell-group>
          </div>
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
              style="pointer-events: auto !important;"
            >
              {{ isVerifying ? '核销中...' : '确认核销' }}
            </van-button>
            <van-button v-else type="default" block round @click.stop="handleClose" @mousedown.stop @touchstart.stop>
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

// 遮罩样式（玻璃拟态效果）
const overlayStyle = computed(() => ({
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
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
@use '@/styles/mixins.scss' as *;

// 弹窗容器玻璃拟态效果
:deep(.van-popup) {
  z-index: 2000 !important;
  border-radius: 24px 24px 0 0 !important;
  overflow: hidden !important;
}

:deep(.van-overlay) {
  z-index: 1999 !important;
  background: rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
}

.result-popup {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2001 !important;
  @include glassmorphism-card(strong);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(31, 38, 135, 0.4);

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;

    // 顶部光效
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.5) 50%, 
        transparent 100%
      );
    }

    h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }

    .van-icon {
      cursor: pointer;
      font-size: 22px;
      color: rgba(102, 126, 234, 0.8);
      transition: all 0.3s ease;
      padding: 4px;
      border-radius: 50%;
      
      &:hover {
        color: #667eea;
        background: rgba(102, 126, 234, 0.1);
        transform: rotate(90deg);
      }
    }
  }

  .popup-content {
    padding: 24px;
    flex: 1;
    overflow-y: auto;
    background: transparent;

    .result-info {
      .result-type {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        padding: 16px 20px;
        @include glassmorphism-card(light);
        background: rgba(102, 126, 234, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(102, 126, 234, 0.2);
        border-radius: 16px;
        position: relative;
        overflow: hidden;

        // 渐变光效
        &::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }

        .van-icon {
          color: #667eea;
          font-size: 24px;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
        }

        .type-text {
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
          z-index: 1;
        }
      }

      .result-details {
        margin-bottom: 24px;
        
        :deep(.van-cell-group) {
          @include glassmorphism-card(light);
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          overflow: hidden;
        }
        
        :deep(.van-cell) {
          background: transparent;
          color: #323233;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          
          &:last-child {
            border-bottom: none;
          }
          
          .van-cell__title {
            color: rgba(102, 126, 234, 0.8);
            font-weight: 600;
            font-size: 14px;
          }
          
          .van-cell__value {
            color: #323233;
            font-weight: 600;
            font-size: 15px;
          }
        }
      }

      .result-actions {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.3);
        position: relative;
        z-index: 2010 !important;
        
        :deep(.van-button) {
          position: relative;
          z-index: 2011 !important;
          pointer-events: auto !important;
          height: 52px !important;
          border-radius: 16px !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          border: none !important;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        // 玻璃拟态按钮效果 - primary
        :deep(.van-button--primary) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4) !important;
          
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
              transparent, 
              rgba(255, 255, 255, 0.3), 
              transparent
            );
            transition: left 0.5s ease;
          }
          
          &:hover::before {
            left: 100%;
          }
          
          &:active {
            transform: scale(0.98) !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
          }
        }
        
        // 玻璃拟态按钮效果 - default
        :deep(.van-button--default) {
          @include glassmorphism-card(light);
          background: rgba(255, 255, 255, 0.5) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          color: #667eea !important;
          border: 1px solid rgba(102, 126, 234, 0.2) !important;
          
          &:active {
            transform: scale(0.98) !important;
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

// 光效动画
@keyframes shimmer {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) rotate(180deg);
    opacity: 0.6;
  }
}

// 弹窗进入动画
:deep(.van-popup) {
  animation: slideUpFade 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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

@media (prefers-color-scheme: dark) {
  .result-popup {
    background: rgba(26, 26, 26, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .popup-header {
      background: rgba(26, 26, 26, 0.5);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom-color: rgba(255, 255, 255, 0.1);
      
      h3 {
        background: linear-gradient(135deg, #a8b5ff 0%, #c084fc 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .van-icon {
        color: rgba(168, 181, 255, 0.8);
        
        &:hover {
          color: #a8b5ff;
          background: rgba(168, 181, 255, 0.1);
        }
      }
    }
    
    .popup-content {
      background: transparent;
      
      .result-info {
        .result-type {
          background: rgba(102, 126, 234, 0.15);
          border-color: rgba(102, 126, 234, 0.3);
          
          .type-text {
            background: linear-gradient(135deg, #a8b5ff 0%, #c084fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        }
        
        .result-details {
          :deep(.van-cell-group) {
            background: rgba(26, 26, 26, 0.6);
            border-color: rgba(255, 255, 255, 0.1);
          }
          
          :deep(.van-cell) {
            background: transparent;
            color: #ffffff;
            border-bottom-color: rgba(255, 255, 255, 0.1);
            
            .van-cell__title {
              color: rgba(168, 181, 255, 0.8);
            }
            
            .van-cell__value {
              color: #ffffff;
            }
          }
        }
        
        .result-actions {
          border-top-color: rgba(255, 255, 255, 0.1);
          
          :deep(.van-button--default) {
            background: rgba(26, 26, 26, 0.5) !important;
            color: #a8b5ff !important;
            border-color: rgba(168, 181, 255, 0.2) !important;
          }
        }
      }
    }
  }
}
</style>
