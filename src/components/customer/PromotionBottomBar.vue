<template>
  <div class="bottom-bar" :class="{ 'hidden': !isVisible }" :style="bottomBarStyle">
    <div class="left-buttons">
      <div class="action-item" @click="$emit('home')">
        <van-icon name="home-o" />
        <span>首页</span>
      </div>
      <div class="action-item" @click="$emit('favorite')">
        <van-icon :name="isFavorite ? 'star' : 'star-o'" class="favorite-icon" :class="{ active: isFavorite }" />
        <span>收藏</span>
      </div>
      <div class="action-item" @click="$emit('service')">
        <van-icon name="service-o" />
        <span>客服</span>
      </div>
    </div>
    <div class="right-buttons">
      <van-button
        type="primary"
        size="large"
        @click.stop="$emit('purchase')"
        @touchstart.stop
        :disabled="!canPurchase"
        style="position: relative; z-index: 102; pointer-events: auto;"
      >
        {{ purchaseButtonText }}
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isFavorite: boolean
  canPurchase: boolean
  purchaseButtonText: string
  isVisible: boolean
  bottomBarStyle: Record<string, string>
}

interface Emits {
  (e: 'home'): void
  (e: 'favorite'): void
  (e: 'service'): void
  (e: 'purchase'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

// 底部操作栏
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); // 安全区域适配
  z-index: 100;
  gap: 12px;
  transition: transform 0.3s ease-in-out;
  transform: translateY(0);
  
  // 使用主题色15%，整体不透明度95%
  // 背景颜色通过 JavaScript 动态设置（bottomBarStyle）
  // 默认降级方案：主题色15% × 整体95%不透明度 = 0.1425
  background: rgba(25, 137, 250, 0.1425);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 2px solid transparent; // 边框颜色通过 JavaScript 动态设置
  box-shadow: 0 -4px 24px 0 rgba(0, 0, 0, 0.08), 
              0 -2px 8px 0 rgba(0, 0, 0, 0.05);

  // 降级方案：不支持 backdrop-filter 时保持相同样式
  @supports not (backdrop-filter: blur(20px)) {
    background: rgba(25, 137, 250, 0.1425);
  }

  &.hidden {
    transform: translateY(100%);
  }

  .left-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 10px;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:active {
        opacity: 0.7;
        transform: scale(0.95);
      }

      &:hover {
        background-color: rgba(0, 0, 0, 0.03);
      }

      .van-icon {
        font-size: 22px;
        color: var(--inverted-theme-color, #ffffff);  // 使用反色，默认白色作为降级方案
        transition: color 0.2s ease;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));  // 添加阴影增强对比度
        -webkit-filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));

        &.active {
          // active 状态（非收藏按钮）使用主题色
          color: var(--primary-color);
          filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 6px var(--primary-color));  // active 状态使用主题色高光
          -webkit-filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 6px var(--primary-color));
        }

        // 收藏按钮图标统一使用金色（使用特定class，确保优先级最高）
        &.favorite-icon {
          color: #ffd700 !important;  // 金色，使用 !important 确保优先级
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 4px rgba(255, 215, 0, 0.5)) !important;  // 金色高光
          -webkit-filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 4px rgba(255, 215, 0, 0.5)) !important;
          
          // 覆盖 Vant 图标的内联样式和字体图标
          &[style*="color"] {
            color: #ffd700 !important;
          }
          
          // 字体图标的 ::before 伪元素
          &::before {
            color: #ffd700 !important;
          }
          
          // 确保 SVG 内部元素也使用金色（Vue 3 深度选择器语法）
          :deep(.van-icon__image),
          :deep(svg),
          :deep(path),
          :deep(.van-icon__font),
          :deep(.van-icon__font::before) {
            fill: #ffd700 !important;
            color: #ffd700 !important;
          }
          
          // active 状态也保持金色
          &.active {
            color: #ffd700 !important;  // 金色
            filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 6px rgba(255, 215, 0, 0.6)) !important;  // 增强金色高光
            -webkit-filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 6px rgba(255, 215, 0, 0.6)) !important;
            
            &[style*="color"] {
              color: #ffd700 !important;
            }
            
            &::before {
              color: #ffd700 !important;
            }
            
            :deep(.van-icon__image),
            :deep(svg),
            :deep(path),
            :deep(.van-icon__font),
            :deep(.van-icon__font::before) {
              fill: #ffd700 !important;
              color: #ffd700 !important;
            }
          }
        }
      }

      span {
        font-size: 12px;
        font-weight: 600;  // 增加字重增强对比度
        color: var(--inverted-theme-color, #ffffff);  // 使用反色，默认白色作为降级方案
        transition: color 0.2s ease;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.2);  // 添加文字阴影增强对比度
      }
    }
  }

  .right-buttons {
    flex-shrink: 0;
    position: relative;
    z-index: 101; // 确保按钮在最上层

    .van-button {
      min-width: 140px;
      height: 44px;
      position: relative;
      z-index: 102; // 确保按钮在最上层
      pointer-events: auto; // 确保可以点击
      border: none;
      border-radius: 22px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px 0 rgba(25, 137, 250, 0.3), 0 2px 4px 0 rgba(25, 137, 250, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      // 使用主题色渐变背景
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
      
      &:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px 0 rgba(25, 137, 250, 0.4), 0 4px 8px 0 rgba(25, 137, 250, 0.3);
      }
      
      &:not(:disabled):active {
        transform: translateY(0);
        box-shadow: 0 2px 8px 0 rgba(25, 137, 250, 0.3), 0 1px 2px 0 rgba(25, 137, 250, 0.2);
      }
      
      &:disabled {
        background: linear-gradient(135deg, #c8c9cc 0%, #bfbfbf 100%);
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
        opacity: 0.6;
      }
    }
  }
}
</style>
