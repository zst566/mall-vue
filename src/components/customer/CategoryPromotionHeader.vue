<template>
  <div 
    class="section-header" 
    :class="{ 'has-gradient': isGradientBackground }"
    :style="getSectionHeaderStyle()"
  >
    <div class="title-wrapper">
      <!-- 缩略图或图标 -->
      <div class="category-icon-wrapper" v-if="category.thumbnail || category.icon">
        <img 
          v-if="category.thumbnail" 
          :src="getImageUrl(category.thumbnail)" 
          :alt="category.displayName"
          class="category-thumbnail"
        />
        <van-icon 
          v-else 
          :name="getValidIconName(category.icon)" 
          class="category-icon" 
        />
      </div>
      <h3>{{ category.displayName }}</h3>
    </div>
    <span class="more" @click="handleViewAll">
      <span class="more-text">
        <span class="wave-char" v-for="(char, index) in '查看全部'" :key="index" :style="{ animationDelay: `${index * 0.1}s` }">{{ char }}</span>
      </span>
      <span class="more-arrow">→</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { NavigationCategoryConfig } from '@/types/homepage'

interface Props {
  category: NavigationCategoryConfig
}

const props = defineProps<Props>()
const router = useRouter()

// 图标名称映射：将不存在的图标名称映射到存在的图标
const iconNameMap: Record<string, string> = {
  'restaurant': 'shop-o',
  'study': 'notes-o',
  'beauty': 'fire-o',
  'food': 'shop-o',
  'education': 'notes-o',
  'school': 'notes-o',
}

// 获取有效的图标名称
const getValidIconName = (iconName: string): string => {
  if (!iconName) return 'shop-o'
  if (iconNameMap[iconName]) {
    return iconNameMap[iconName]
  }
  return iconName
}

// 检查是否是渐变背景色
const isGradientBackground = computed(() => {
  if (!props.category.titleColor) return false
  const color = props.category.titleColor
  return color.includes('linear-gradient') || color.includes('radial-gradient')
})

// 获取section-header背景样式
const getSectionHeaderStyle = () => {
  if (!props.category.titleColor) {
    return {}
  }
  
  const color = props.category.titleColor
  
  if (isGradientBackground.value) {
    return {
      background: color,
    }
  }
  
  if (color.startsWith('rgba')) {
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (rgbaMatch) {
      const r = rgbaMatch[1]
      const g = rgbaMatch[2]
      const b = rgbaMatch[3]
      return {
        background: `rgba(${r}, ${g}, ${b}, 0.7)`,
      }
    }
  }
  
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return {
      background: `rgba(${r}, ${g}, ${b}, 0.7)`,
    }
  }
  
  if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const r = rgbMatch[1]
      const g = rgbMatch[2]
      const b = rgbMatch[3]
      return {
        background: `rgba(${r}, ${g}, ${b}, 0.7)`,
      }
    }
  }
  
  return {
    background: 'rgba(255, 255, 255, 0.7)',
  }
}

// 获取图片URL
const getImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/api/')) {
    return url
  }
  if (url.startsWith('/')) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${baseURL}${url}`
  }
  return url
}

// 处理查看全部
const handleViewAll = () => {
  router.push(`/promotions?navigationCategoryId=${props.category.id}`)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.section-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  
  &.has-gradient {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      z-index: 0;
      pointer-events: none;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 60%;
    background: $primary;
    border-radius: 0 2px 2px 0;
    z-index: 1;
  }

  .title-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-height: 28px;
    position: relative;
    z-index: 2;
  }

  .category-icon-wrapper {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .category-thumbnail {
    width: 28px;
    height: 28px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
  }

  .category-icon {
    font-size: 28px;
    color: $primary;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  h3 {
    font-size: $font-size-xxl;
    font-weight: 700;
    color: $text-color-primary;
    margin: 0;
    padding: 0;
    letter-spacing: 0;
    line-height: 1.3;
    display: flex;
    align-items: center;
    height: auto;
  }

  .more {
    font-size: $font-size-sm;
    color: $primary;
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 16px;
    position: relative;
    z-index: 2;

    .more-text {
      display: inline-block;
    }

    .wave-char {
      display: inline-block;
      animation: wave 1.8s ease-in-out infinite;
    }

    .more-arrow {
      font-size: $font-size-lg;
      display: inline-block;
    }

    &:active {
      opacity: 0.8;
    }
  }
}

@keyframes wave {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-4px);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-2px);
  }
}

@media (max-width: 768px) {
  .section-header {
    padding: 12px 16px;
    margin-bottom: 12px;
    border-radius: 10px;

    .title-wrapper {
      gap: 10px;
    }

    .category-icon-wrapper {
      width: 24px;
      height: 24px;
    }

    .category-thumbnail {
      width: 24px;
      height: 24px;
    }

    .category-icon {
      font-size: 24px;
    }

    h3 {
      font-size: $font-size-lg;
      letter-spacing: 0;
      line-height: 1.3;
    }

    .more {
      margin-left: 12px;
      font-size: $font-size-xs;
    }
  }
}

@media (prefers-color-scheme: dark) {
  .section-header {
    background: rgba(30, 30, 30, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    h3 {
      color: #e0e0e0;
    }

    .more {
      color: $primary-light;
    }

    .category-icon {
      color: $primary-light;
    }
  }
}
</style>
