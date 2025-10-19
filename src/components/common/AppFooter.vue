<template>
  <van-tabbar
    v-model="active"
    :fixed="true"
    :z-index="1040"
    route
    placeholder
    :border="false"
    :class="{ 'merchant-mode': isMerchantMode }"
  >
    <van-tabbar-item replace to="/" icon="home-o">首页</van-tabbar-item>
    <van-tabbar-item replace to="/products" icon="apps-o">商品</van-tabbar-item>
    <van-tabbar-item replace to="/orders" icon="orders-o">订单</van-tabbar-item>
    <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
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
    } else if (path.startsWith('/products')) {
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

<style lang="scss" scoped>
  .van-tabbar {
    background: #ffffff;
    border-top: 1px solid #ebedf0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
    height: 50px;

    .van-tabbar-item {
      padding: 4px 0;

      &.van-tabbar-item--active {
        color: #1989fa;

        .van-tabbar-item__icon {
          color: #1989fa;
        }

        .van-tabbar-item__text {
          color: #1989fa;
          font-weight: 500;
        }
      }

      .van-tabbar-item__icon {
        font-size: 22px;
        margin-bottom: 2px;
        color: #969799;
        transition: color 0.2s ease;
      }

      .van-tabbar-item__text {
        font-size: 10px;
        color: #969799;
        transition: color 0.2s ease;
        line-height: 1;
      }
    }
  }

  // 商户模式样式
  .merchant-mode .van-tabbar {
    background: #f7f8fa;
    border-top-color: #dcdee0;

    .van-tabbar-item {
      &.van-tabbar-item--active {
        color: #1989fa;

        .van-tabbar-item__icon {
          color: #1989fa;
        }

        .van-tabbar-item__text {
          color: #1989fa;
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

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .van-tabbar {
      background: #1a1a1a;
      border-top-color: #333333;

      .van-tabbar-item {
        &.van-tabbar-item--active {
          color: #1989fa;

          .van-tabbar-item__icon {
            color: #1989fa;
          }

          .van-tabbar-item__text {
            color: #1989fa;
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

    .merchant-mode .van-tabbar {
      background: #2a2a2a;
      border-top-color: #404040;
    }
  }

  // 安全区域适配
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .van-tabbar {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
</style>
