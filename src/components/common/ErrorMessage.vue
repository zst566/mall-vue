<template>
  <div class="error-message" v-if="visible && error">
    <div class="error-header">
      <van-icon
        :name="getIcon"
        :color="getColor"
        size="24"
        class="error-icon"
      />
      <div class="error-title">{{ title }}</div>
    </div>

    <div class="error-content">
      {{ error.message }}
    </div>

    <div class="error-actions">
      <van-button
        type="primary"
        size="small"
        @click="onRetry"
        v-if="showRetry"
      >
        重试
      </van-button>
      <van-button
        type="default"
        size="small"
        @click="onClose"
        v-if="showClose"
      >
        关闭
      </van-button>
    </div>

    <van-icon
      name="cross"
      class="close-btn"
      @click="onClose"
      v-if="showClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible?: boolean
  error?: any
  title?: string
  type?: 'error' | 'warning' | 'info' | 'success'
  showRetry?: boolean
  showClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  error: null,
  title: '出错了',
  type: 'error',
  showRetry: false,
  showClose: true
})

// Emits
const emit = defineEmits<{
  retry: []
  close: []
}>()

// 计算属性
const getIcon = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'warning-o'
    case 'success':
      return 'success-circle-o'
    case 'info':
      return 'info-o'
    default:
      return 'cross-circle-o'
  }
})

const getColor = computed(() => {
  switch (props.type) {
    case 'warning':
      return '#ff976a'
    case 'success':
      return '#07c160'
    case 'info':
      return '#1989fa'
    default:
      return '#ee0a24'
  }
})

// 方法
const onRetry = () => {
  emit('retry')
}

const onClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

.error-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  @include glassmorphism-card(strong);
  padding: 24px;
  max-width: 300px;
  width: 90%;
  text-align: center;
  z-index: 9999;
}

.error-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.error-icon {
  margin-bottom: 8px;
}

.error-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.error-content {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.4;
}

.error-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #999;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: #333;
  }
}

// 不同主题色的样式
.error-message {
  &.error {
    border: 1px solid rgba(238, 10, 36, 0.3);
    @include glassmorphism-card(strong);

    .error-title {
      color: #ee0a24;
    }

    .error-content {
      color: #333;
    }
  }

  &.warning {
    border: 1px solid rgba(255, 151, 106, 0.3);
    @include glassmorphism-card(strong);

    .error-title {
      color: #ff976a;
    }

    .error-content {
      color: #333;
    }
  }

  &.success {
    border: 1px solid #e9f7ef;
    background: #f0f9f4;

    .error-title {
      color: #07c160;
    }

    .error-content {
      color: #333;
    }
  }

  &.info {
    border: 1px solid #e8f4ff;
    background: #f0f7ff;

    .error-title {
      color: #1989fa;
    }

    .error-content {
      color: #333;
    }
  }
}

// 淡入动画
.error-message {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

// 暗色模式
@media (prefers-color-scheme: dark) {
  .error-message {
    @include glassmorphism-card(strong);

    .error-title {
      color: #ccc;
    }

    .error-content {
      color: #999;
    }
  }
}
</style>