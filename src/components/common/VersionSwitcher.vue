<template>
  <div class="version-switcher" v-if="showSwitcher">
    <van-button type="primary" size="small" round @click="toggleVersion" :loading="loading">
      {{ isMerchantMode ? '切换到客户版' : '切换到商户版' }}
    </van-button>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { showToast } from 'vant'

  const appStore = useAppStore()
  const authStore = useAuthStore()
  const loading = ref(false)

  // 计算是否显示版本切换器
  const showSwitcher = computed(() => {
    // 只有用户登录且具有商户权限时才显示切换器
    return (
      authStore.isLoggedIn && (authStore.userRole === 'admin' || authStore.userRole === 'operator')
    )
  })

  // 计算当前是否为商户模式
  const isMerchantMode = computed(() => appStore.isMerchantMode)

  // 切换版本
  const toggleVersion = async () => {
    if (loading.value) return

    loading.value = true

    try {
      if (isMerchantMode.value) {
        // 从商户模式切换到客户模式
        appStore.switchToCustomer()
        showToast('已切换到客户版')
      } else {
        // 从客户模式切换到商户模式
        appStore.switchToMerchant()
        showToast('已切换到商户版')
      }
    } catch (error) {
      console.error('切换版本失败:', error)
      showToast({ message: '切换失败', type: 'fail' })
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .version-switcher {
    position: fixed;
    top: 60px;
    right: 16px;
    z-index: 1000;
  }

  .van-button {
    padding: 8px 16px;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(25, 137, 250, 0.2);

    &:active {
      transform: scale(0.95);
    }
  }

  // 商户模式样式
  .merchant-mode .version-switcher {
    .van-button {
      background: #f0f2f5;
      color: #333;
      border-color: #d9d9d9;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .version-switcher {
      .van-button {
        background: #333;
        color: #fff;
        border-color: #666;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
    }

    .merchant-mode .version-switcher {
      .van-button {
        background: #2a2a2a;
        color: #fff;
        border-color: #555;
      }
    }
  }

  // 响应式调整
  @media (max-width: 768px) {
    .version-switcher {
      top: 56px;
      right: 12px;
    }
  }

  // 触摸反馈
  .version-switcher {
    .van-button {
      transition: all 0.2s ease;

      &:active {
        transform: scale(0.95);
      }
    }
  }

  // 悬停效果
  .version-switcher {
    .van-button {
      &:hover {
        opacity: 0.8;
      }
    }
  }
</style>
