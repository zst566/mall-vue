<template>
  <section class="promotion-banner">
    <div class="banner-scroll" v-if="banners.length > 0">
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="banner-card"
        @click="handleBannerClick(banner)"
      >
        <div
          class="banner-image"
          :style="{ backgroundImage: `url(${getImageUrl(banner.image)})` }"
        >
          <div class="banner-overlay"></div>
        </div>
        <div class="banner-content">
          <p class="banner-title" v-if="banner.title">{{ banner.title }}</p>
          <p class="banner-subtitle" v-if="banner.subtitle">{{ banner.subtitle }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { HomepageBannerConfig } from '@/types/homepage'

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
  margin: 12px 12px 8px;
}

.banner-scroll {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 0 0 4px 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}

.banner-card {
  flex: 0 0 auto;
  width: calc(80vw - 24px);
  min-width: 280px;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &:hover {
    box-shadow: $shadow-base;
  }
}

.banner-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
}

.banner-content {
  padding: 12px 16px;
  background: #fff;
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

@media (max-width: 768px) {
  .promotion-banner {
    margin: 12px 8px 6px;
  }

  .banner-card {
    width: calc(80vw - 16px);
    min-width: 240px;
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

