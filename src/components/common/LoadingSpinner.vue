<template>
  <div class="loading-spinner" v-if="visible">
    <div class="loading-content">
      <div class="spinner" :class="size">
        <div class="spinner-icon"></div>
      </div>
      <div class="loading-text" v-if="text">
        {{ text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible?: boolean
  text?: string
  size?: 'small' | 'normal' | 'large'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  text: '加载中...',
  size: 'normal',
  color: '#1989fa'
})

const sizeClasses = computed(() => {
  return {
    small: 'spinner-small',
    normal: 'spinner-normal',
    large: 'spinner-large'
  }
})
</script>

<style lang="scss" scoped>
.loading-spinner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.spinner {
  margin: 0 auto 10px;
  position: relative;

  &-small {
    width: 24px;
    height: 24px;
  }

  &-normal {
    width: 36px;
    height: 36px;
  }

  &-large {
    width: 48px;
    height: 48px;
  }
}

.spinner-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(25, 137, 250, 0.1);
  border-top-color: v-bind(color);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

// 淡入淡出动画
.loading-spinner {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// 不同主题色
.spinner-icon {
  border-top-color: v-bind(color);
}

// 暗色模式
@media (prefers-color-scheme: dark) {
  .loading-content {
    background: #1a1a1a;
  }

  .loading-text {
    color: #ccc;
  }
}
</style>