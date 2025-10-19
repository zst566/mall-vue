<template>
  <div class="not-found">
    <div class="not-found-container">
      <div class="not-found-icon">404</div>
      <h1 class="not-found-title">页面未找到</h1>
      <p class="not-found-description">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <div class="not-found-actions">
        <van-button
          type="primary"
          size="large"
          @click="goHome"
          class="not-found-button"
        >
          返回首页
        </van-button>
        <van-button
          size="large"
          @click="goBack"
          class="not-found-button"
        >
          返回上页
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const goHome = () => {
  router.push('/')
  showToast('正在返回首页')
}

const goBack = () => {
  router.go(-1)
  showToast('正在返回上页')
}
</script>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.not-found-container {
  text-align: center;
  background: white;
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  @include transition(all, $transition-base);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }
}

.not-found-icon {
  font-size: 80px;
  font-weight: bold;
  color: var(--primary-color, #1989fa);
  margin-bottom: 20px;
  background: linear-gradient(45deg, #1989fa, #5cadff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.not-found-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.not-found-description {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 32px;
}

.not-found-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.not-found-button {
  width: 100%;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 500;
  @include border-radius($border-radius-base);
  @include transition(all, $transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 480px) {
  .not-found-container {
    padding: 30px 20px;
    margin: 0 10px;
  }

  .not-found-icon {
    font-size: 60px;
  }

  .not-found-title {
    font-size: 20px;
  }

  .not-found-description {
    font-size: 14px;
  }

  .not-found-button {
    padding: 12px 16px;
    font-size: 14px;
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .not-found {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .not-found-container {
    background: #2a2a2a;
    border: 1px solid #404040;
  }

  .not-found-title {
    color: #ffffff;
  }

  .not-found-description {
    color: #cccccc;
  }
}

// 动画效果
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.not-found-container {
  animation: fadeIn 0.6s ease-out;
}
</style>