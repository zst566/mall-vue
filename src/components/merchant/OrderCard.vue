<template>
  <div class="order-card" @click="handleCardClick">
    <div class="order-header">
      <span class="order-no">订单号: {{ order.orderNo }}</span>
      <span :class="['order-status', normalizeStatusClass(order.status)]">
        {{ formatStatus(order.status) }}
      </span>
    </div>

    <div class="order-content">
      <div class="order-info">
        <div class="order-meta">
          <span>{{ formatTime(order.createdAt) }}</span>
          <span>客户: {{ order.customerName || '未知客户' }}</span>
        </div>

        <div class="order-items-wrapper">
          <!-- 促销活动主图 -->
          <div class="promotion-image" v-if="promotionImageUrl">
            <img
              :src="promotionImageUrl"
              alt="促销活动"
              class="promotion-thumbnail"
              @error="handleImageError"
            />
          </div>

          <div class="order-items" v-if="order.items && order.items.length > 0">
            <div v-for="item in order.items.slice(0, 2)" :key="item.id" class="item-preview">
              <span class="item-name">{{ item.productName }}</span>
              <span class="item-quantity">x{{ item.quantity }}</span>
            </div>
            <div v-if="order.items.length > 2" class="more-items">
              +{{ order.items.length - 2 }} 个商品
            </div>
          </div>
        </div>
      </div>

      <div class="order-footer">
        <div class="order-amount">
          <span class="amount-label">金额:</span>
          <span class="amount-value">¥{{ formatAmount(order.totalAmount) }}</span>
        </div>

        <div class="order-actions">
          <van-button
            v-if="order.status === 'pending_verification'"
            size="small"
            type="primary"
            @click.stop="handleVerify"
          >
            核销
          </van-button>

          <van-button
            v-if="order.status === 'pending_verification'"
            size="small"
            type="warning"
            @click.stop="handleCancel"
          >
            取消
          </van-button>

          <van-button
            v-if="order.status === 'verified'"
            size="small"
            @click.stop="handleViewDetail"
          >
            查看详情
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MerchantOrder } from '@/types'
import { formatStatus, normalizeStatusClass, formatTime } from '@/utils/orderFormatters'
import { formatMoney } from '@/utils/format'
import { getImageUrl, getDefaultImage } from '@/utils/image'

interface Props {
  order: MerchantOrder
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'view-detail', orderId: string): void
  (e: 'verify', orderId: string): void
  (e: 'cancel', orderId: string): void
}>()

const formatAmount = formatMoney

// 获取促销活动主图
// 优先使用后端返回的 promotionImageUrl 或 promotionMainImage 字段
// 如果没有，则尝试从订单项中获取（向后兼容）
const promotionImageUrl = computed(() => {
  // 优先使用后端直接返回的促销活动主图 URL
  const order = props.order as any
  if (order.promotionImageUrl) {
    return getImageUrl(order.promotionImageUrl)
  }
  if (order.promotionMainImage) {
    return getImageUrl(order.promotionMainImage)
  }

  // 向后兼容：如果没有直接返回的字段，尝试从订单项中获取
  if (!props.order.items || props.order.items.length === 0) {
    return ''
  }

  // 从第一个订单项中获取促销活动信息
  const firstItem = props.order.items[0] as any
  
  // 检查订单项是否包含促销活动信息
  if (firstItem.promotion && firstItem.promotion.images) {
    const images = firstItem.promotion.images
    
    // 处理图片数据（可能是数组或对象）
    let imageArray: any[] = []
    if (Array.isArray(images)) {
      imageArray = images
    } else if (typeof images === 'object' && images !== null) {
      imageArray = [images]
    }

    // 获取主图（isMain 为 true 的图片，或第一张图片）
    const mainImage = imageArray.find((img: any) => {
      if (typeof img === 'string') return false
      return img.isMain === true
    }) || imageArray[0]

    if (mainImage) {
      const rawImageUrl = typeof mainImage === 'string'
        ? mainImage
        : (mainImage.url || mainImage.src || '')
      
      return getImageUrl(rawImageUrl)
    }
  }

  return ''
})

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = getDefaultImage()
}

const handleCardClick = () => {
  emit('view-detail', props.order.id)
}

const handleViewDetail = () => {
  emit('view-detail', props.order.id)
}

const handleVerify = () => {
  emit('verify', props.order.id)
}

const handleCancel = () => {
  emit('cancel', props.order.id)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.order-card {
  @include glassmorphism-card(base);
  margin-bottom: 15px;
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-text-on-glass, $text-color-primary);
}

.order-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  text-transform: lowercase;
}

.order-status.pending,
.order-status.PENDING {
  background: #fef3c7;
  color: #92400e;
}

.order-status.paid,
.order-status.PAID {
  background: #dbeafe;
  color: #1e40af;
}

.order-status.pending_verification,
.order-status.PENDING_VERIFICATION {
  background: #fef3c7;
  color: #92400e;
}

.order-status.verified,
.order-status.VERIFIED {
  background: #d1fae5;
  color: #065f46;
}

.order-status.completed,
.order-status.COMPLETED {
  background: #d1fae5;
  color: #065f46;
}

.order-status.cancelled,
.order-status.CANCELLED {
  background: #fee2e2;
  color: #991b1b;
}

.order-status.refunded,
.order-status.REFUNDED {
  background: #e0e7ff;
  color: #3730a3;
}

.order-status.refund_requested,
.order-status.REFUND_REQUESTED {
  background: #fef3c7;
  color: #92400e;
}

.order-content {
  padding: 15px;
}

.order-info {
  margin-bottom: 12px;
}

.order-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: var(--theme-text-secondary, $text-color-secondary);
  margin-bottom: 8px;
}

.order-items-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.promotion-image {
  flex-shrink: 0;
  
  .promotion-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: var(--van-radius-md);
    object-fit: cover;
    background: var(--van-background-2);
  }
}

.order-items {
  flex: 1;
  margin-bottom: 0;
}

.item-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
  color: var(--theme-text-on-glass, $text-color-primary);
}

.more-items {
  font-size: 12px;
  color: var(--theme-text-tertiary, $text-color-tertiary);
  text-align: center;
  padding: 4px 0;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.order-amount {
  display: flex;
  align-items: center;
  gap: 5px;
}

.amount-label {
  font-size: 14px;
  color: var(--theme-text-secondary, $text-color-secondary);
}

.amount-value {
  font-size: 16px;
  font-weight: bold;
  color: var(--theme-text-on-glass, $text-color-primary);
}

.order-actions {
  display: flex;
  gap: 8px;
}
</style>
