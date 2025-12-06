<template>
  <van-popup 
    v-model:show="isVisible"
    position="bottom" 
    round 
    :style="{ height: '70%', zIndex: 2000 }"
    :close-on-click-overlay="false"
    :close-on-popstate="true"
    :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1999 }"
    :z-index="2000"
    @close="handleClose"
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
// 确保弹窗内容在最上层
:deep(.van-popup) {
  z-index: 2000 !important;
}

:deep(.van-overlay) {
  z-index: 1999 !important;
  background-color: rgba(0, 0, 0, 0.4) !important;
}

.result-popup {
  background: #ffffff;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2001 !important;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--van-border-color);
    background: #ffffff;
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #323233;
    }

    .van-icon {
      cursor: pointer;
      font-size: 20px;
      color: #646566;
      
      &:hover {
        color: #323233;
      }
    }
  }

  .popup-content {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
    background: #ffffff;

    .result-info {
      .result-type {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px;
        background: #f7f8fa;
        border-radius: 8px;

        .van-icon {
          color: var(--van-primary-color);
          font-size: 20px;
        }

        .type-text {
          font-size: 16px;
          font-weight: 600;
          color: #323233;
        }
      }

      .result-details {
        margin-bottom: 20px;
        
        :deep(.van-cell-group) {
          background: #ffffff;
        }
        
        :deep(.van-cell) {
          background: #ffffff;
          color: #323233;
          
          .van-cell__title {
            color: #646566;
            font-weight: 500;
          }
          
          .van-cell__value {
            color: #323233;
            font-weight: 500;
          }
        }
      }

      .result-actions {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #ebedf0;
        position: relative;
        z-index: 2010 !important;
        
        :deep(.van-button) {
          position: relative;
          z-index: 2011 !important;
          pointer-events: auto !important;
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

@media (prefers-color-scheme: dark) {
  .result-popup {
    background: #1a1a1a;
    
    .popup-header {
      background: #1a1a1a;
      border-bottom-color: #3a3a3a;
      
      h3 {
        color: #ffffff;
      }
      
      .van-icon {
        color: #cccccc;
      }
    }
    
    .popup-content {
      background: #1a1a1a;
      
      .result-info {
        .result-type {
          background: #2a2a2a;
          
          .type-text {
            color: #ffffff;
          }
        }
        
        .result-details {
          :deep(.van-cell-group) {
            background: #1a1a1a;
          }
          
          :deep(.van-cell) {
            background: #1a1a1a;
            color: #ffffff;
            
            .van-cell__title {
              color: #cccccc;
            }
            
            .van-cell__value {
              color: #ffffff;
            }
          }
        }
        
        .result-actions {
          border-top-color: #3a3a3a;
        }
      }
    }
  }
}
</style>
