<template>
  <div v-if="validBanners.length > 0 && currentBanner" class="banner-area">
    <div
      class="banner-carousel"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <transition name="fade" mode="out-in">
        <div
          :key="currentBannerIndex"
          class="category-banner"
          :class="{ clickable: currentBanner.linkUrl }"
          @click="handleBannerClick(currentBanner)"
        >
          <img
            :src="getImageUrl(currentBanner.image)"
            :alt="categoryDisplayName"
            class="banner-image-breathing"
            :style="{ animationDuration: `${breathingDuration}s` }"
          />
        </div>
      </transition>
    </div>
    
    <!-- 指示器 -->
    <div v-if="validBanners.length > 1" class="banner-indicators">
      <div
        v-for="(banner, index) in validBanners"
        :key="banner.id"
        class="indicator-dot"
        :class="{ active: index === currentBannerIndex }"
        @click="goToBanner(index)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { NavigationCategoryBanner } from '@/types/homepage'

interface Props {
  banners: NavigationCategoryBanner[]
  breathingDuration?: number
  categoryDisplayName: string
}

const props = defineProps<Props>()
const router = useRouter()

// 过滤有效的banner
const validBanners = computed(() => {
  if (!props.banners || props.banners.length === 0) {
    return []
  }

  const now = new Date()
  return props.banners.filter((banner: NavigationCategoryBanner) => {
    if (!banner.startTime && !banner.endTime) return true
    
    const startTime = banner.startTime ? new Date(banner.startTime) : null
    const endTime = banner.endTime ? new Date(banner.endTime) : null
    
    if (startTime && now < startTime) return false
    if (endTime && now > endTime) return false
    
    return true
  }).sort((a, b) => a.sortOrder - b.sortOrder)
})

// 轮播状态管理
const currentBannerIndex = ref(0)
const autoPlayTimer = ref<number | null>(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const isSwiping = ref(false)

// 当前显示的banner
const currentBanner = computed(() => {
  if (validBanners.value.length === 0) {
    return null
  }
  return validBanners.value[currentBannerIndex.value]
})

// 呼吸动画时长
const breathingDuration = computed(() => {
  return props.breathingDuration ?? 4
})

// 切换到指定banner
const goToBanner = (index: number) => {
  if (index < 0 || index >= validBanners.value.length) return
  currentBannerIndex.value = index
  resetAutoPlay()
}

// 切换到下一个banner
const nextBanner = () => {
  if (validBanners.value.length === 0) return
  currentBannerIndex.value = (currentBannerIndex.value + 1) % validBanners.value.length
}

// 切换到上一个banner
const prevBanner = () => {
  if (validBanners.value.length === 0) return
  currentBannerIndex.value =
    currentBannerIndex.value === 0
      ? validBanners.value.length - 1
      : currentBannerIndex.value - 1
}

// 启动自动轮播
const startAutoPlay = () => {
  if (validBanners.value.length <= 1) return
  stopAutoPlay()
  autoPlayTimer.value = window.setInterval(() => {
    nextBanner()
  }, 3000)
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

// 触摸开始
const handleTouchStart = (e: TouchEvent) => {
  if (validBanners.value.length <= 1) return
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  isSwiping.value = false
  stopAutoPlay()
}

// 触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (validBanners.value.length <= 1) return
  const touch = e.touches[0]
  touchEndX.value = touch.clientX
  touchEndY.value = touch.clientY
  
  const deltaX = Math.abs(touchEndX.value - touchStartX.value)
  const deltaY = Math.abs(touchEndY.value - touchStartY.value)
  
  if (deltaX > deltaY && deltaX > 10) {
    isSwiping.value = true
    e.preventDefault()
  }
}

// 触摸结束
const handleTouchEnd = () => {
  if (validBanners.value.length <= 1 || !isSwiping.value) {
    resetAutoPlay()
    return
  }
  
  const deltaX = touchEndX.value - touchStartX.value
  const threshold = 50
  
  if (Math.abs(deltaX) > threshold) {
    if (deltaX > 0) {
      prevBanner()
    } else {
      nextBanner()
    }
  }
  
  isSwiping.value = false
  resetAutoPlay()
}

// 监听banner数量变化
watch(
  () => validBanners.value.length,
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

// 组件挂载时启动自动轮播
onMounted(() => {
  if (validBanners.value.length > 1) {
    startAutoPlay()
  }
})

// 组件销毁时清理定时器
onBeforeUnmount(() => {
  stopAutoPlay()
})

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

// 处理Banner点击
const handleBannerClick = (banner: NavigationCategoryBanner) => {
  if (!banner.linkUrl) return

  if (banner.linkUrl.startsWith('http://') || banner.linkUrl.startsWith('https://')) {
    window.open(banner.linkUrl, '_blank')
  } else {
    router.push(banner.linkUrl)
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.banner-area {
  margin: 12px 0 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.banner-carousel {
  position: relative;
  width: 100%;
  height: 60px;
  overflow: hidden;
  border-radius: 8px;
}

.category-banner {
  width: 100%;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;
  position: relative;

  &.clickable {
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:active {
      opacity: 0.8;
    }
  }

  .banner-image-breathing {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    will-change: transform;
    animation: breathing ease-in-out infinite;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes breathing {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.banner-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
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
</style>
