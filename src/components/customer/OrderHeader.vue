<template>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus } from '@/types'

interface Props {
  order: {
    orderNo: string
    status: OrderStatus | string
    createdAt: string
    expiryDate?: string
  }
}

const props = defineProps<Props>()

// 订单状态配置
const orderStatusMap = {
  pending: { label: '待支付', color: '#ff976a' },
  paid: { label: '已支付（待使用）', color: '#1989fa' },
  verified: { label: '已核销（已使用）', color: '#07c160' },
  cancelled: { label: '已取消', color: '#969799' },
  refunded: { label: '已退款', color: '#969799' },
  refund_requested: { label: '申请退款中', color: '#ff976a' }
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  return orderStatusMap[status as keyof typeof orderStatusMap]?.label || status
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
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

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
</style>


