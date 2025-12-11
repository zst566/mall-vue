<template>
  <div v-if="refundRequestDetail" class="refund-request-info">
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
            @click="handleImagePreview(img, refundRequestDetail.images || [])"
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
</template>

<script setup lang="ts">
import { formatMoney } from '@/utils/format'
import { showImagePreview } from 'vant'

interface RefundReason {
  name: string
}

interface RefundRequestDetail {
  refundReason?: RefundReason
  requestedAmount?: number
  description?: string
  images?: string[]
  contactPhone?: string
  createdAt: string
}

interface Props {
  refundRequestDetail: RefundRequestDetail | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'image-preview': [url: string, images: string[]]
}>()

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

// 预览图片
const handleImagePreview = (url: string, images: string[]) => {
  showImagePreview({
    images: images,
    startPosition: images.indexOf(url),
    closeable: true
  })
  emit('image-preview', url, images)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

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
}
</style>





