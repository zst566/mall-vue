<template>
  <footer class="app-footer" :class="{ 'merchant-mode': isMerchantMode }">
    <van-tabbar
      v-model="active"
      route
      :border="false"
      class="footer-tabbar"
    >
      <van-tabbar-item replace to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item replace to="/parking" icon="location-o">停车</van-tabbar-item>
      <van-tabbar-item replace to="/orders" icon="orders-o">订单</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </footer>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAppStore } from '@/stores/app'

  const appStore = useAppStore()
  const router = useRouter()
  const route = useRoute()
  const active = ref(0)

  // 计算当前是否为商户模式
  const isMerchantMode = computed(() => appStore.isMerchantMode)

  // 监听路由变化更新底部导航栏状态
  const updateActiveTab = () => {
    const path = route.path

    if (path === '/') {
      active.value = 0
    } else if (path.startsWith('/parking')) {
      active.value = 1
    } else if (path.startsWith('/orders')) {
      active.value = 2
    } else if (path.startsWith('/profile')) {
      active.value = 3
    }
  }

  // 监听路由变化
  watch(
    () => route.path,
    () => {
      updateActiveTab()
    },
    { immediate: true }
  )
</script>

<style lang="scss">
  .app-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-index-tabbar);
    width: 100%;
    height: calc(var(--tabbar-height) + var(--safe-area-inset-bottom, 0px));
    background: var(--van-background);
    border-top: 1px solid var(--van-border-color);
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    isolation: isolate;
    padding-bottom: var(--safe-area-inset-bottom, 0px);
    box-sizing: border-box;
    transition: background-color 0.2s ease;
    flex-shrink: 0;

    // Vant Tabbar 样式覆盖
    .footer-tabbar {
      position: static !important;
      width: 100% !important;
      height: var(--tabbar-height) !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;

      :deep(.van-tabbar) {
        position: static;
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        box-shadow: none;
        border-radius: 0;
      }

      :deep(.van-tabbar-item) {
        padding: 8px 0;
        height: 100%;
        color: var(--van-text-color-3);
        transition: color 0.2s ease;

        &.van-tabbar-item--active {
          color: var(--van-primary-color);

          .van-tabbar-item__icon {
            color: var(--van-primary-color);
          }

          .van-tabbar-item__text {
            color: var(--van-primary-color);
            font-weight: 500;
          }
        }

        .van-tabbar-item__icon {
          font-size: 24px;
          margin-bottom: 4px;
          color: var(--van-text-color-3);
          transition: color 0.2s ease;
        }

        .van-tabbar-item__text {
          font-size: 12px;
          color: var(--van-text-color-3);
          transition: color 0.2s ease;
          line-height: 1;
          font-weight: 400;
        }
      }
    }
  }

  // 商户模式样式
  .merchant-mode {
    background: #f0f2f5;
    border-top-color: #e8e8e8;

    .footer-tabbar {
      :deep(.van-tabbar-item) {
        color: #646566;

        &.van-tabbar-item--active {
          color: var(--van-primary-color);

          .van-tabbar-item__icon {
            color: var(--van-primary-color);
          }

          .van-tabbar-item__text {
            color: var(--van-primary-color);
          }
        }

        .van-tabbar-item__icon {
          color: #646566;
        }

        .van-tabbar-item__text {
          color: #646566;
        }
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .app-footer {
      background: #1a1a1a;
      border-top-color: #333;
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.3);

      .footer-tabbar {
        :deep(.van-tabbar-item) {
          color: #7c7c7c;

          &.van-tabbar-item--active {
            color: var(--van-primary-color);

            .van-tabbar-item__icon {
              color: var(--van-primary-color);
            }

            .van-tabbar-item__text {
              color: var(--van-primary-color);
            }
          }

          .van-tabbar-item__icon {
            color: #7c7c7c;
          }

          .van-tabbar-item__text {
            color: #7c7c7c;
          }
        }
      }
    }

    .merchant-mode {
      background: #2a2a2a;
      border-top-color: #404040;
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.4);
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .app-footer {
      // 在小屏幕上确保完整显示
      height: calc(var(--tabbar-height) + var(--safe-area-inset-bottom, 0px));
    }
  }

  // 大屏幕优化
  @media (min-width: 769px) {
    .app-footer {
      max-width: 768px;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 16px 16px 0 0;
    }
  }

  // 动画效果
  .app-footer {
    :deep(.van-tabbar-item) {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 2px;
        background: var(--van-primary-color);
        border-radius: 1px;
        transition: width 0.2s ease;
      }

      &.van-tabbar-item--active::after {
        width: 20px;
      }
    }
  }
</style>
