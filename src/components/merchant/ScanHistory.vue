<template>
  <div class="scan-history">
    <div class="section-header">
      <h3>最近扫描</h3>
      <van-icon name="arrow" @click="$emit('go-to-history')" />
    </div>
    <div class="history-list">
      <div
        v-for="record in history"
        :key="record.id"
        class="history-item"
        @click="$emit('view-detail', record)"
      >
        <div class="item-icon" :class="record.type">
          <van-icon :name="getRecordIcon(record.type)" />
        </div>
        <div class="item-info">
          <h4 class="item-title">{{ record.title }}</h4>
          <p class="item-desc">{{ record.description }}</p>
          <span class="item-time">{{ formatTime(record.scannedAt) }}</span>
        </div>
        <div class="item-status" :class="record.status">
          {{ getStatusText(record.status) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScanHistoryItem } from '@/types/scan'
import { getRecordIcon, getStatusText, formatTime } from '@/utils/scanHelpers'

defineProps<{
  history: ScanHistoryItem[]
}>()

defineEmits<{
  'view-detail': [record: ScanHistoryItem]
  'go-to-history': []
}>()
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.scan-history {
  margin: 16px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    margin-bottom: 12px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--van-text-color);
      margin: 0;
    }

    .van-icon {
      font-size: 16px;
      color: var(--van-text-color-3);
      cursor: pointer;
    }
  }

  .history-list {
    .history-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      @include glassmorphism-card(light);
      margin-bottom: 12px;
      cursor: pointer;
      transition: all var(--van-transition-duration);

      &:active {
        transform: scale(0.98);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .item-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.order {
          background: var(--van-primary-color-light);
          color: var(--van-primary-color);
        }

        &.product {
          background: var(--van-warning-color-light);
          color: var(--van-warning-color);
        }

        &.promotion {
          background: var(--van-success-color-light);
          color: var(--van-success-color);
        }
      }

      .item-info {
        flex: 1;

        .item-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--van-text-color);
          margin-bottom: 4px;
        }

        .item-desc {
          font-size: 12px;
          color: var(--van-text-color-3);
          margin-bottom: 4px;
        }

        .item-time {
          font-size: 11px;
          color: var(--van-text-color-3);
        }
      }

      .item-status {
        font-size: 12px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: var(--van-radius-sm);

        &.success {
          color: var(--van-success-color);
          background: var(--van-success-color-light);
        }

        &.error {
          color: var(--van-danger-color);
          background: var(--van-danger-color-light);
        }

        &.info {
          color: var(--van-primary-color);
          background: var(--van-primary-color-light);
        }
      }
    }
  }
}

@media (max-width: 375px) {
  .scan-history {
    margin: 12px;

    .history-list .history-item {
      padding: 12px;
      gap: 8px;

      .item-icon {
        width: 32px;
        height: 32px;
      }

      .item-info .item-title {
        font-size: 13px;
      }
    }
  }
}

@media (prefers-color-scheme: dark) {
  .scan-history .history-list .history-item {
    background: var(--van-background-4);
  }
}
</style>




