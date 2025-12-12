<template>
  <div class="detail-section" v-if="detailImages && detailImages.length > 0">
    <div class="section-header">
      <h3>活动详情</h3>
    </div>
    <div class="detail-content">
      <div class="detail-images">
        <div 
          v-for="(image, index) in detailImages" 
          :key="image.id || index"
          class="detail-image-item"
        >
          <img 
            :src="getImageUrl(image)" 
            :alt="`活动详情图片 ${index + 1}`"
            class="detail-image"
            @error="handleImageError"
            :loading="index === 0 ? 'eager' : 'lazy'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePromotionImages } from '@/composables/usePromotionImages'

interface Props {
  images: any[]
}

const props = defineProps<Props>()

// 使用 composable 处理图片
const imagesRef = computed(() => props.images)
const { detailImages, getImageUrl, handleImageError } = usePromotionImages(imagesRef)
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

// 详情区域
.detail-section {
  @include glassmorphism-card(base);
  margin: 16px;
  margin-bottom: 12px;

  .section-header {
    padding: 16px;
    border-bottom: 1px solid var(--van-border-color);

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--van-text-color);
      margin: 0;
    }
  }

  .detail-content {
    padding: 16px;

    .detail-images {
      display: flex;
      flex-direction: column;
      gap: 0;

      .detail-image-item {
        width: 100%;
        border-radius: 8px;
        overflow: visible; // 改为 visible，不裁剪图片
        background-color: #f5f5f5;

        .detail-image {
          width: 100%;
          height: auto; // 使用 auto 保持原始宽高比
          min-height: 200px;
          object-fit: contain; // 使用 contain 确保图片完整显示，不被裁剪
          display: block;
          transition: opacity 0.3s ease;

          &[loading="lazy"] {
            opacity: 0;
            animation: fadeIn 0.3s ease forwards;
          }

          @keyframes fadeIn {
            to {
              opacity: 1;
            }
          }
        }
      }
    }
  }
}
</style>








