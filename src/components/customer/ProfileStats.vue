<template>
  <div class="user-stats">
    <div class="stat-item">
      <div class="stat-value">{{ stats.points || 0 }}</div>
      <div class="stat-label">积分</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{{ stats.coupons || 0 }}</div>
      <div class="stat-label">优惠券</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{{ stats.favorites || 0 }}</div>
      <div class="stat-label">收藏</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  stats: {
    points: number
    coupons: number
    favorites: number
  }
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.user-stats {
  display: flex;
  justify-content: space-around;
  @include glassmorphism-card(base);
  padding: 20px 16px;
  position: relative;
  z-index: 1;

  .stat-item {
    text-align: center;
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 6px;
      background: var(--theme-bg-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: var(--primary-color);
    }

    .stat-label {
      font-size: 13px;
      color: #666666;
      font-weight: 500;
      letter-spacing: 0.2px;
    }
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .user-stats {
    background: rgba(26, 26, 26, 0.95);
    backdrop-filter: blur(10px);

    .stat-label {
      color: #b0b0b0;
    }
  }
}

// 响应式设计
@media (max-width: 375px) {
  .user-stats {
    padding: 16px 12px;
    border-radius: 14px;

    .stat-value {
      font-size: 22px;
    }

    .stat-label {
      font-size: 12px;
    }
  }
}

@media (max-width: 320px) {
  .user-stats {
    padding: 14px 10px;
    border-radius: 12px;

    .stat-item {
      .stat-value {
        font-size: 20px;
      }

      .stat-label {
        font-size: 11px;
      }
    }
  }
}
</style>





