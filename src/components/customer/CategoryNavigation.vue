<template>
  <section class="category-navigation">
    <div class="nav-grid" v-if="categories.length > 0">
      <div
        v-for="category in categories"
        :key="category.id"
        class="nav-item"
        @click="handleCategoryClick(category)"
      >
        <div class="nav-icon-wrapper">
          <van-icon :name="category.icon" class="nav-icon" />
        </div>
        <p class="nav-text">{{ category.displayName }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { NavigationCategoryConfig } from '@/types/homepage'

interface Props {
  categories: NavigationCategoryConfig[]
}

const props = defineProps<Props>()
const router = useRouter()

const handleCategoryClick = (category: NavigationCategoryConfig) => {
  if (category.linkType === 'category_list') {
    router.push(`/promotions?navigationCategoryId=${category.id}`)
  } else if (category.linkType === 'custom_url' && category.linkUrl) {
    if (category.linkUrl.startsWith('http://') || category.linkUrl.startsWith('https://')) {
      // 外部链接，新窗口打开
      window.open(category.linkUrl, '_blank')
    } else {
      // 内部链接
      router.push(category.linkUrl)
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.category-navigation {
  margin: 16px 12px;
  padding: 16px 12px;
  background: #f6f8fb;
  border-radius: 16px;
  box-shadow: $shadow-sm;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.95);
  }
}

.nav-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;

  .nav-item:active & {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}

.nav-icon {
  font-size: 24px;
  color: $primary;
}

.nav-text {
  font-size: $font-size-xs;
  font-weight: 500;
  color: $text-color-primary;
  margin: 0;
  text-align: center;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .category-navigation {
    margin: 12px 8px;
    padding: 12px 8px;
  }

  .nav-grid {
    gap: 12px 6px;
  }

  .nav-icon-wrapper {
    width: 42px;
    height: 42px;
  }

  .nav-icon {
    font-size: 20px;
  }

  .nav-text {
    font-size: 11px;
  }
}

@media (prefers-color-scheme: dark) {
  .category-navigation {
    background: #1e1e1e;
  }

  .nav-icon-wrapper {
    background: #2a2a2a;
  }

  .nav-text {
    color: #e0e0e0;
  }
}
</style>


