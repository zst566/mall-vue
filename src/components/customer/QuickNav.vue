<template>
  <section class="quick-nav">
    <van-grid :column-num="columnNum" :border="false" :gutter="0">
      <van-grid-item
        v-for="(item, index) in items"
        :key="index"
        :icon="item.icon"
        :text="item.text"
        @click="handleClick(item, index)"
      />
    </van-grid>
  </section>
</template>

<script setup lang="ts">
export interface QuickNavItem {
  icon: string
  text: string
  action?: () => void
  [key: string]: any
}

interface Props {
  items: QuickNavItem[]
  columnNum?: number
}

const props = withDefaults(defineProps<Props>(), {
  columnNum: 4
})

const emit = defineEmits<{
  click: [item: QuickNavItem, index: number]
}>()

const handleClick = (item: QuickNavItem, index: number) => {
  if (item.action) {
    item.action()
  }
  emit('click', item, index)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
// 现代化色系定义（统一到全局变量）
$primary-color: $primary;
$text-primary: $text-color-primary;
$shadow-sm: $shadow-sm;

.quick-nav {
  // 统一左右留白：与首页区块保持 12px
  margin: 16px 12px;
  padding: 10px 12px;
  // 防止 margin 与 padding 叠加导致元素总宽度超过视口
  width: calc(100vw - 24px); // 24px = 左右 12px 外边距
  max-width: 100vw; // 防止超过视口宽度
  overflow: hidden; // 隐藏潜在溢出
  box-sizing: border-box;
  @include glassmorphism-card(base);

  :deep(.van-grid) {
    width: 100%;
    // 关闭 van grid 默认的内边距，避免横向可滚动
    --van-grid-item-content-padding: 0px;
  }

  // 让 Vant 的 Grid 自行按列数布局，避免超出视口
  :deep(.van-grid__content) {
    width: 100%;
    padding: 0; // 去掉多余内边距，减少占位
    box-sizing: border-box;
  }

  :deep(.van-grid-item) {
    // 使用 Vant 默认 1/columnNum 的宽度，避免横向溢出
    background: transparent; // 去除单项卡片底
    border-radius: 12px;
    transition: all 0.2s ease;
    padding: 8px 0 !important; // 紧凑
    cursor: pointer;
    box-sizing: border-box;

    &:active {
      transform: scale(0.95);
    }

    &:hover {
      transform: translateY(-2px);
    }

    .van-grid-item__content {
      padding: 2px 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: transparent !important; // 去除 Vant 默认 #edf2f7 背景
    }

    .van-grid-item__icon {
      width: 48px; // 放大 50%
      height: 48px;
      border-radius: 50%;
      background: transparent; // 去掉图标背景色
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary-color;
      font-size: 27px; // 放大 50%
      margin-bottom: 4px;
      flex-shrink: 0;
    }

    .van-grid-item__text {
      font-size: $font-size-xl; // 与字号规范一致
      color: $text-primary;
      font-weight: 500;
      margin-top: 2px;
      text-align: center;
      width: auto; // 保证文字不被过度压缩
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .quick-nav {
    // 移动端统一左右留白：8px
    margin: 12px 8px;
    width: calc(100vw - 16px); // 16px = 左右 8px 外边距
    max-width: 100vw; // 防止移动端溢出
    padding: 8px 8px;

    :deep(.van-grid__content) {}

    :deep(.van-grid-item) {
      padding: 6px 0 !important;

      .van-grid-item__icon {
        width: 42px;
        height: 42px;
        font-size: 24px;
      }

      .van-grid-item__text {
        font-size: $font-size-lg;
      }
    }
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  $bg-dark-card: #1e1e1e;
  $text-dark: #e0e0e0;

  .quick-nav {
    background: $bg-dark-card;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    :deep(.van-grid-item) {
      .van-grid-item__text {
        color: $text-dark;
      }

      &:hover {
        box-shadow: 0 4px 16px rgba(25, 137, 250, 0.2);
      }
    }
  }
}
</style>

