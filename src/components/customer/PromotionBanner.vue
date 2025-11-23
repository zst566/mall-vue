<template>
  <section class="promotion-banner">
    <div v-if="banners.length > 0" class="banner-carousel">
      <transition name="fade" mode="out-in">
        <div
          :key="currentBannerIndex"
          class="banner-card"
          :class="{ clickable: currentBanner?.linkType && currentBanner?.linkValue }"
          @click="handleBannerClick(currentBanner!)"
        >
          <div
            class="banner-image"
            :class="{
              'animation-breathing': currentBanner?.animationType === 'breathing',
              'animation-shimmer': currentBanner?.animationType === 'shimmer',
              'animation-none': currentBanner?.animationType === 'none' || !currentBanner?.animationType
            }"
            :style="{
              '--banner-image-url': `url(${getImageUrl(currentBanner?.image || '')})`,
              animationDuration: currentBanner?.animationType === 'breathing' && currentBanner?.breathingDuration
                ? `${currentBanner.breathingDuration}s`
                : undefined
            }"
          >
            <!-- 模糊背景层 -->
            <div class="banner-background-blur"></div>
            <!-- 主图片层 -->
            <div class="banner-image-main"></div>
            <div class="banner-overlay"></div>
          </div>
          <div v-if="currentBanner?.title || currentBanner?.subtitle" class="banner-content">
            <p class="banner-title" v-if="currentBanner?.title">{{ currentBanner.title }}</p>
            <p class="banner-subtitle" v-if="currentBanner?.subtitle">{{ currentBanner.subtitle }}</p>
          </div>
        </div>
      </transition>
      
      <!-- 指示器 -->
      <div v-if="banners.length > 1" class="banner-indicators">
        <div
          v-for="(banner, index) in banners"
          :key="banner.id"
          class="indicator-dot"
          :class="{ active: index === currentBannerIndex }"
          @click="goToBanner(index)"
        ></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { HomepageBannerConfig } from '@/types/homepage'
import { homepageService } from '@/services/homepage'

// 获取图片URL
const getImageUrl = (image: any): string => {
  if (typeof image === 'string') {
    return image
  }
  if (image && typeof image === 'object') {
    return image.url || image.src || ''
  }
  return ''
}

interface Props {
  banners: HomepageBannerConfig[]
}

const props = defineProps<Props>()
const router = useRouter()

// 轮播状态
const currentBannerIndex = ref(0)
const autoPlayTimer = ref<number | null>(null)
const autoRotateInterval = ref(3) // 默认3秒

// 当前显示的banner
const currentBanner = computed(() => {
  if (props.banners.length === 0) {
    return null
  }
  return props.banners[currentBannerIndex.value]
})

// 加载轮播配置
const loadCarouselConfig = async () => {
  try {
    const config = await homepageService.getCarouselConfig()
    autoRotateInterval.value = config.autoRotateInterval || 3
  } catch (error) {
    console.error('加载轮播配置失败:', error)
    autoRotateInterval.value = 3 // 使用默认值
  }
}

// 切换到指定banner
const goToBanner = (index: number) => {
  if (index < 0 || index >= props.banners.length) return
  currentBannerIndex.value = index
  resetAutoPlay()
}

// 切换到下一个banner
const nextBanner = () => {
  if (props.banners.length === 0) return
  currentBannerIndex.value = (currentBannerIndex.value + 1) % props.banners.length
}

// 启动自动轮播
const startAutoPlay = () => {
  if (props.banners.length <= 1) return
  stopAutoPlay()
  autoPlayTimer.value = window.setInterval(() => {
    nextBanner()
  }, autoRotateInterval.value * 1000)
}

// 停止自动轮播
const stopAutoPlay = () => {
  if (autoPlayTimer.value !== null) {
    clearInterval(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

// 重置自动轮播
const resetAutoPlay = () => {
  stopAutoPlay()
  startAutoPlay()
}

// 监听banner数量变化
watch(
  () => props.banners.length,
  (newLength) => {
    if (newLength > 0) {
      currentBannerIndex.value = 0
      if (newLength > 1) {
        startAutoPlay()
      } else {
        stopAutoPlay()
      }
    } else {
      stopAutoPlay()
    }
  },
  { immediate: true }
)

// 组件挂载时加载配置并启动轮播
onMounted(async () => {
  await loadCarouselConfig()
  if (props.banners.length > 1) {
    startAutoPlay()
  }
})

// 组件销毁时清理定时器
onBeforeUnmount(() => {
  stopAutoPlay()
})

const handleBannerClick = (banner: HomepageBannerConfig) => {
  if (!banner.linkType || !banner.linkValue) {
    return
  }

  switch (banner.linkType) {
    case 'promotion_detail':
      router.push(`/promotion/${banner.linkValue}`)
      break
    case 'category_list':
      router.push(`/promotions?navigationCategoryId=${banner.linkValue}`)
      break
    case 'custom_url':
      if (banner.linkValue.startsWith('http://') || banner.linkValue.startsWith('https://')) {
        // 外部链接，新窗口打开
        window.open(banner.linkValue, '_blank')
      } else {
        // 内部链接
        router.push(banner.linkValue)
      }
      break
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.promotion-banner {
  margin: 12px 12px 0; // 底部margin设为0，避免留白
}

.banner-carousel {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.banner-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: $shadow-sm;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column; // 使用flex布局，确保内容区域紧贴图片

  &.clickable {
    cursor: pointer;

    &:active {
      transform: scale(0.98);
    }

    &:hover {
      box-shadow: $shadow-base;
    }
  }
}

.banner-image {
  width: 100%;
  min-height: 160px; // 设置最小高度，移除固定aspect-ratio
  max-height: 300px; // 设置最大高度，避免过高
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #f5f5f5; // 默认背景色
  
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
    min-height: 160px;
    background-image: var(--banner-image-url);
    background-size: contain; // 使用contain，完整显示图片
    background-position: center;
    background-repeat: no-repeat;
    z-index: 1;
    will-change: transform; // 提示浏览器优化动画
    transform: translateZ(0); // 启用GPU加速
    backface-visibility: hidden; // 优化渲染性能
    -webkit-backface-visibility: hidden; // Safari兼容
  }
  
  // 呼吸放大动画 - 应用到主图片层
  &.animation-breathing {
    .banner-image-main {
      animation: breathing ease-in-out infinite;
    }
  }
  
  // 随机流光动画
  &.animation-shimmer {
    .banner-image-main {
      animation: shimmer 3s ease-in-out infinite;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: shimmer-sweep 3s ease-in-out infinite;
      z-index: 2;
      pointer-events: none;
    }
  }
  
  // 无动画
  &.animation-none {
    .banner-image-main {
      animation: none;
    }
  }
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
  z-index: 2; // 确保overlay在主图片之上
  pointer-events: none; // 不阻挡点击事件
}

.banner-content {
  padding: 12px 16px;
  background: #fff;
  flex-shrink: 0; // 防止内容区域被压缩
  // 如果没有内容，不显示
  &:empty {
    display: none;
  }
}

.banner-title {
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-color-primary;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.banner-subtitle {
  font-size: $font-size-sm;
  font-weight: 400;
  color: $text-color-tertiary;
  margin: 0;
  line-height: 1.4;
}

// 淡入淡出过渡效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 呼吸放大动画 - 使用transform优化性能
@keyframes breathing {
  0%, 100% {
    transform: translateZ(0) scale(1);
  }
  50% {
    transform: translateZ(0) scale(1.05);
  }
}

// 随机流光动画
@keyframes shimmer {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.1);
  }
}

@keyframes shimmer-sweep {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

// 指示器样式
.banner-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 0;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &.active {
    width: 20px;
    height: 6px;
    border-radius: 3px;
    background: $primary;
  }

  &:active {
    transform: scale(0.9);
  }
}

@media (max-width: 768px) {
  .promotion-banner {
    margin: 12px 8px 0; // 移动端也移除底部margin
  }

  .banner-content {
    padding: 10px 12px;
  }

  .banner-title {
    font-size: $font-size-base;
  }

  .banner-subtitle {
    font-size: $font-size-xs;
  }
}

@media (prefers-color-scheme: dark) {
  .banner-card {
    background: #1e1e1e;
  }

  .banner-content {
    background: #1e1e1e;
  }

  .banner-title {
    color: #e0e0e0;
  }

  .banner-subtitle {
    color: #a0a0a0;
  }
}
</style>

