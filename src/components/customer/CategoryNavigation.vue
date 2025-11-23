<template>
  <section class="category-navigation">
    <div 
      class="nav-grid" 
      v-if="categories.length > 0"
      :style="{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }"
    >
      <div
        v-for="category in categories"
        :key="category.id"
        class="nav-item"
        @click="handleCategoryClick(category)"
      >
        <div class="nav-icon-wrapper">
          <van-icon :name="getValidIconName(category.icon)" class="nav-icon" />
        </div>
        <p class="nav-text">{{ category.displayName }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { NavigationCategoryConfig } from '@/types/homepage'

interface Props {
  categories: NavigationCategoryConfig[]
}

const props = defineProps<Props>()
const router = useRouter()

// 计算网格列数：默认显示5个，如果少于5个则使用实际数量
const gridColumns = computed(() => {
  const count = props.categories.length
  return count < 5 ? count : 5
})

// 图标名称映射：将不存在的图标名称映射到存在的图标
const iconNameMap: Record<string, string> = {
  'restaurant': 'shop-o',      // 餐饮 -> 商店图标
  'study': 'notes-o',          // 教育 -> 笔记图标
  'beauty': 'fire-o',          // 美容 -> 火焰图标
  'food': 'shop-o',            // 食物 -> 商店图标
  'education': 'notes-o',      // 教育 -> 笔记图标
  'school': 'notes-o',         // 学校 -> 笔记图标
}

// 获取有效的图标名称
const getValidIconName = (iconName: string): string => {
  if (!iconName) return 'shop-o' // 默认图标
  // 如果图标名称在映射表中，使用映射后的名称
  if (iconNameMap[iconName]) {
    return iconNameMap[iconName]
  }
  // 否则直接使用原名称（如果存在的话）
  return iconName
}

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
@use '@/styles/mixins.scss' as *;

.category-navigation {
  margin: 16px 12px;
  padding: 16px 12px;
  @include glassmorphism-card(base);
}

.nav-grid {
  display: grid;
  gap: 16px 8px;
  justify-items: center;
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
  @include glassmorphism-card(light);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

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





