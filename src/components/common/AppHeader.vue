<template>
  <van-nav-bar
    :title="displayTitle"
    :left-arrow="showBack"
    :right-arrow="showRight"
    :fixed="true"
    :border="false"
    :z-index="1040"
    @click-left="onBack"
    @click-right="onRightClick"
  >
    <template #left v-if="showBack">
      <div class="back-button-wrapper">
        <van-icon name="arrow-left" class="back-icon" />
      </div>
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
    showTitle?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '',
    showBack: false,
    showRight: false,
    hideHeader: false,
    showTitle: false
  })

  // 计算显示的标题：如果传入了 title 或 showTitle 为 true，则显示标题
  const displayTitle = computed(() => {
    // 如果明确传入了 title，则显示
    if (props.title) {
      return props.title
    }
    // 如果 showTitle 为 true，显示默认标题
    if (props.showTitle) {
      return '滨江宏岸商场'
    }
    // 默认不显示标题
    return ''
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

    // 返回按钮样式
    .back-button-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      cursor: pointer;

      &:active {
        background: rgba(255, 255, 255, 0.9);
        transform: scale(0.95);
      }

      .back-icon {
        font-size: 20px;
        color: #323233;
      }
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
