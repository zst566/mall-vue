<template>
  <van-popup :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" position="bottom" round :style="{ height: '70%' }">
    <div class="result-popup">
      <div class="popup-header">
        <h3>扫描结果</h3>
        <van-icon name="cross" @click="$emit('update:modelValue', false)" />
      </div>
      <div class="popup-content">
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
          <div class="result-actions">
            <van-button
              v-if="scanResult.data.status === 'pending' || scanResult.data.status === 'paid' || scanResult.data.status === 'PAID'"
              type="primary"
              block
              round
              @click="$emit('verify')"
              :loading="isVerifying"
            >
              确认核销
            </van-button>
            <van-button v-else type="default" block round @click="$emit('update:modelValue', false)">
              关闭
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import type { ScanResult } from '@/types/scan'
import { getResultIcon, formatTime } from '@/utils/scanHelpers'

defineProps<{
  modelValue: boolean
  scanResult: ScanResult | null
  isVerifying: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'verify': []
}>()
</script>

<style lang="scss" scoped>
.result-popup {
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--van-border-color);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .van-icon {
      cursor: pointer;
      font-size: 20px;
    }
  }

  .popup-content {
    padding: 16px;

    .result-info {
      .result-type {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;

        .van-icon {
          color: var(--van-primary-color);
          font-size: 20px;
        }

        .type-text {
          font-size: 16px;
          font-weight: 600;
          color: var(--van-text-color);
        }
      }

      .result-details {
        margin-bottom: 20px;
      }

      .result-actions {
        margin-top: 20px;
      }
    }
  }
}

@media (prefers-color-scheme: dark) {
  .result-popup .popup-header {
    border-bottom-color: var(--van-gray-6);
  }
}
</style>
