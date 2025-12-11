<template>
  <div class="order-stats">
    <div class="stats-container">
      <div 
        class="stat-item" 
        :class="{ active: activeStatFilter === 'total' }"
        @click="handleStatClick('total')"
      >
        <div class="stat-info">
          <div class="stat-number">{{ formatStatNumber(stats.total || 0) }}</div>
          <div class="stat-label">总订单</div>
        </div>
      </div>
      <div 
        class="stat-item" 
        :class="{ active: activeStatFilter === 'paid' }"
        @click="handleStatClick('paid')"
      >
        <div class="stat-info">
          <div class="stat-number">{{ formatStatNumber(stats.paid || 0) }}</div>
          <div class="stat-label">已支付</div>
        </div>
      </div>
      <div 
        class="stat-item" 
        :class="{ active: activeStatFilter === 'verified' }"
        @click="handleStatClick('verified')"
      >
        <div class="stat-info">
          <div class="stat-number">{{ formatStatNumber(stats.verified || 0) }}</div>
          <div class="stat-label">已核销</div>
        </div>
      </div>
      <div 
        class="stat-item" 
        :class="{ active: activeStatFilter === 'refunded' }"
        @click="handleStatClick('refunded')"
      >
        <div class="stat-info">
          <div class="stat-number">{{ formatStatNumber(stats.refunded || 0) }}</div>
          <div class="stat-label">已退款</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatStatNumber } from '@/utils/orderFormatters'

interface OrderStats {
  total: number
  paid: number
  verified: number
  refunded: number
}

interface Props {
  stats: OrderStats
  activeStatFilter: 'total' | 'paid' | 'verified' | 'refunded' | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'filter', statType: 'total' | 'paid' | 'verified' | 'refunded'): void
}>()

const handleStatClick = (statType: 'total' | 'paid' | 'verified' | 'refunded') => {
  emit('filter', statType)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.order-stats {
  @include glassmorphism-card(base);
  padding: 15px;
  margin: 0 15px 15px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: linear-gradient(135deg, #3A82F6 0%, #2563EB 100%);
    box-shadow: 0 2px 8px rgba(58, 130, 246, 0.3);

    .stat-number,
    .stat-label {
      color: white;
    }
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 18px;
  font-weight: bold;
  color: var(--theme-text-on-glass, $text-color-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-secondary, $text-color-secondary);
  line-height: 1.2;
}

@media (max-width: 375px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .order-stats {
    margin: 0 10px 10px;
  }
}
</style>



