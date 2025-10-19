<template>
  <van-nav-bar
    :title="title"
    :left-arrow="showBack"
    :right-arrow="showRight"
    :fixed="true"
    :border="false"
    :z-index="1040"
    @click-left="onBack"
    @click-right="onRightClick"
  >
    <template #left v-if="showBack">
      <van-icon name="arrow-left" color="#666" />
    </template>

    <template #right v-if="showRight">
      <slot name="right">
        <van-icon name="ellipsis" color="#666" />
      </slot>
    </template>
  </van-nav-bar>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const appStore = useAppStore()
  const authStore = useAuthStore()

  // Props
  interface Props {
    title?: string
    showBack?: boolean
    showRight?: boolean
    hideHeader?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '滨江宏岸商场',
    showBack: false,
    showRight: false,
    hideHeader: false
  })

  // 计算是否显示头部
  const showHeader = computed(() => !props.hideHeader && !appStore.isLoading)

  // 方法
  const onBack = () => {
    if (router.currentRoute.value.meta.hideBackButton) {
      return
    }
    router.back()
  }

  const onRightClick = () => {
    // 可以在这里添加更多操作，比如菜单等
    console.log('右侧按钮点击')
  }
</script>

<style lang="scss" scoped>
  .van-nav-bar {
    background: transparent;
    box-shadow: none;

    .van-nav-bar__title {
      color: #333;
      font-weight: 500;
    }

    .van-nav-bar__arrow {
      color: #666;
    }

    .van-nav-bar__content {
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
    }
  }

  // 商户模式样式
  .merchant-mode {
    .van-nav-bar {
      background: transparent;

      .van-nav-bar__content {
        background: linear-gradient(to bottom, rgba(240, 242, 245, 0.95), rgba(240, 242, 245, 0.9));
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .van-nav-bar {
      .van-nav-bar__content {
        background: linear-gradient(to bottom, rgba(30, 30, 30, 0.95), rgba(30, 30, 30, 0.9));
      }

      .van-nav-bar__title {
        color: #fff;
      }
    }
  }
</style>
