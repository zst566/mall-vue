<template>
  <div class="banner-section" :class="{ 'banner-full-width': carouselConfig.bannerFullWidth }">
    <van-swipe 
      v-if="banners && banners.length > 0" 
      :autoplay="autoplayInterval"
      :loop="banners.length > 1"
      indicator-color="white"
      class="banner-swipe"
    >
      <van-swipe-item 
        v-for="banner in banners" 
        :key="banner.id"
        @click="handleBannerClick(banner)"
      >
        <div 
          class="banner-image"
          :style="{
            '--banner-image-url': `url('${getImageUrl(banner.image)}')`,
            '--animation-duration': `${banner.breathingDuration || 7}s`
          }"
        >
          <!-- 模糊背景层 -->
          <div class="banner-background-blur"></div>
          <!-- 主图片层 -->
          <div 
            class="banner-image-main"
            :class="getAnimationClass(banner)"
          ></div>
          <!-- 标题和副标题文本层 -->
          <div v-if="banner.title || banner.subtitle" class="banner-text-overlay">
            <h3 v-if="banner.title" class="banner-title">{{ banner.title }}</h3>
            <p v-if="banner.subtitle" class="banner-subtitle">{{ banner.subtitle }}</p>
          </div>
        </div>
      </van-swipe-item>
    </van-swipe>
    <PlaceholderImage 
      v-else 
      width="100%" 
      height="170px" 
      class="banner-placeholder"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import type { HomepageBannerConfig } from '@/types/homepage'

interface Props {
  banners: HomepageBannerConfig[]
  carouselConfig: {
    autoRotateInterval: number
    bannerFullWidth: boolean
  }
}

const props = defineProps<Props>()

const router = useRouter()

// 计算自动播放间隔（毫秒）
const autoplayInterval = computed(() => {
  if (props.banners.length <= 1) {
    return 0 // 只有一个Banner时不自动播放
  }
  return props.carouselConfig.autoRotateInterval * 1000
})

// 获取图片URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return ''
  
  // 如果已经是完整 URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  // 如果已经包含 /api/ 前缀，直接返回
  if (imageUrl.startsWith('/api/')) {
    return imageUrl
  }
  // 如果是相对路径，添加 API 前缀
  if (imageUrl.startsWith('/')) {
    return `/api${imageUrl}`
  }
  return imageUrl
}

// 获取动画类名
const getAnimationClass = (banner: HomepageBannerConfig): string => {
  const animationType = banner.animationType || 'breathing'
  if (animationType === 'none') return ''
  return `banner-animation-${animationType}`
}

// 处理Banner点击跳转
const handleBannerClick = (banner: HomepageBannerConfig) => {
  if (!banner.linkType || !banner.linkValue) return
  
  switch (banner.linkType) {
    case 'promotion_detail':
      router.push(`/promotions/${banner.linkValue}`)
      break
    case 'category_list':
      // 跳转到促销列表页，通过查询参数过滤分类
      router.push({
        path: '/promotions',
        query: { category: banner.linkValue }
      })
      break
    case 'custom_url':
      if (banner.linkValue.startsWith('http://') || banner.linkValue.startsWith('https://')) {
        window.open(banner.linkValue, '_blank')
      } else {
        router.push(banner.linkValue)
      }
      break
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

// 顶部Banner主图区域
.banner-section {
  @include glassmorphism-card(light);
  // 默认卡片样式：左右保留间距（关闭贯穿式时）
  box-sizing: border-box;
  // 确保左右对称的 margin
  margin: 0 16px 16px 16px;
  // 使用 calc 确保宽度计算正确，左右各 16px margin
  width: calc(100% - 32px);
  // 确保不会因为父容器padding导致不对称
  max-width: 100%;

  // 贯穿式展示（左右不留白）
  &.banner-full-width {
    margin-left: 0 !important;
    margin-right: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    border-radius: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    // 确保宽度100%，不受父容器padding影响
    width: 100vw !important;
    position: relative;
    left: 50% !important;
    right: 50% !important;
    margin-left: -50vw !important;
    margin-right: -50vw !important;
    
    // 确保子元素也不受父容器影响
    .banner-swipe {
      border-radius: 0;
    }
    
    .banner-image {
      border-radius: 0;
    }
  }

  .banner-swipe {
    width: 100%;
  }

  .banner-image {
    width: 100%;
    height: 170px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: #f5f5f5; // 默认背景色
    cursor: pointer;
    
    // 模糊背景层 - 填充整个容器
    .banner-background-blur {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: var(--banner-image-url);
      background-size: cover; // 背景层使用cover填充整个容器
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(20px);
      transform: scale(1.1) translateZ(0); // 稍微放大避免边缘模糊，启用GPU加速
      z-index: 0;
      will-change: transform, filter; // 提示浏览器优化transform和filter
      backface-visibility: hidden; // 优化渲染性能
      -webkit-backface-visibility: hidden; // Safari兼容
    }
    
    // 主图片层 - 完整显示图片
    .banner-image-main {
      position: relative;
      width: 100%;
      height: 100%;
      background-image: var(--banner-image-url);
      background-size: contain; // 使用contain，完整显示图片
      background-position: center;
      background-repeat: no-repeat;
      z-index: 1;
      will-change: transform; // 提示浏览器优化动画
      transform: translateZ(0); // 启用GPU加速
      backface-visibility: hidden; // 优化渲染性能
      -webkit-backface-visibility: hidden; // Safari兼容
      
      // 微动态效果：呼吸放大
      &.banner-animation-breathing {
        animation: breathing var(--animation-duration, 7s) ease-in-out infinite;
      }
      
      // 微动态效果：随机流光
      &.banner-animation-shimmer {
        overflow: hidden;
        
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 3s ease-in-out infinite;
          z-index: 2;
          pointer-events: none;
        }
      }
    }
    
    // 标题和副标题文本层
    .banner-text-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2;
      padding: 16px 20px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
      pointer-events: none; // 不阻挡点击事件
      
      .banner-title {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        line-height: 1.4;
      }
      
      .banner-subtitle {
        margin: 0;
        font-size: 14px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        line-height: 1.4;
      }
    }
  }

  .banner-placeholder {
    width: 100%;
    height: 170px;
  }
}

@keyframes breathing {
  0%, 100% {
    transform: scale(1) translateZ(0);
  }
  50% {
    transform: scale(1.02) translateZ(0);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>
