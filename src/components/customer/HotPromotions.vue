<template>
  <section class="promotion-section">
    <div class="section-header">
      <h3>热门促销</h3>
      <span class="more" @click="$emit('view-all')">查看全部</span>
    </div>

    <div class="promotion-list">
      <div
        v-for="item in displayPromotions"
        :key="item.id"
        class="promo-card"
        @click="$emit('item-click', { promotionId: item.id, productId: item.productId })"
      >
        <div class="promo-thumb">
          <img v-if="item.thumbnail" :src="item.thumbnail" class="promo-img" alt="promotion" />
          <PlaceholderImage v-else width="96px" height="72px" />
          <van-tag v-if="item.badge" :type="item.badgeType" class="promo-badge">{{ item.badge }}</van-tag>
        </div>
        <div class="promo-info">
          <div class="promo-title">{{ item.title }}</div>
          <div class="promo-sub">剩余 {{ item.left }} 件</div>
          <div class="promo-price-wrap">
            <span class="promo-price">¥{{ item.price }}</span>
            <span class="promo-origin" v-if="item.origin && item.origin > item.price">¥{{ item.origin }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
  import { onMounted, ref, computed } from 'vue'
  import { api } from '@/services/api'

  interface PromotionItem {
    id: number
    title: string
    left: number
    price: number
    origin: number
    badge?: string
    badgeType?: 'primary' | 'success' | 'danger' | 'warning'
    productId?: string | number
    thumbnail?: string
  }

  const props = defineProps<{ promotions?: PromotionItem[] }>()
  defineEmits<{ (e: 'view-all'): void; (e: 'item-click', data: { promotionId: number; productId?: string | number }): void }>()

  type BackendPromotion = {
    id: string
    name: string
    images?: any
    productId: string
    promotionQuantity: number
    soldQuantity: number
    salePrice: number // cents
    originalPrice?: number | null // cents or null
  }

  const fetched = ref<PromotionItem[] | null>(null)

  const displayPromotions = computed<PromotionItem[]>(() => {
    if (props.promotions && props.promotions.length > 0) return props.promotions
    return fetched.value ?? []
  })

  const toThumb = (images: any): string | undefined => {
    if (!images) return undefined
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0]
      if (typeof first === 'string') return first
      if (first && typeof first === 'object' && 'url' in first) return (first as any).url
    }
    if (typeof images === 'object' && images !== null) {
      // 兼容单对象
      if ('url' in images) return (images as any).url
    }
    return undefined
  }

  const fromCents = (cents?: number | null): number => {
    if (!cents && cents !== 0) return 0
    return Math.round(cents) / 100
  }

  onMounted(async () => {
    if (props.promotions && props.promotions.length > 0) return
    try {
      const result = await api.get<{ data: BackendPromotion[]; pagination: any }>(
        '/promotions',
        { params: { status: 'active', limit: 4 } }
      )
      const list = (result?.data ?? []).map((p) => {
        const left = Math.max(0, (p.promotionQuantity || 0) - (p.soldQuantity || 0))
        const price = fromCents(p.salePrice)
        const origin = p.originalPrice ? fromCents(p.originalPrice) : 0
        return {
          id: Number.isNaN(Number(p.id)) ? (p.id as unknown as number) : Number(p.id),
          title: p.name,
          left,
          price,
          origin,
          productId: p.productId,
          thumbnail: toThumb(p.images)
        } as PromotionItem
      })
      fetched.value = list
    } catch (e) {
      // 静默失败，组件兜底为空
      fetched.value = []
    }
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  $primary-color: $primary;
  $danger-color: $danger;
  $text-primary: $text-color-primary;
  $text-secondary: $text-color-tertiary;
  $bg-white: $bg-color-secondary;
  $shadow-sm: $shadow-sm;
  $shadow-md: $shadow-base;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 16px 12px;
    background: transparent;

    h3 {
      font-size: $font-size-xl;
      font-weight: 700;
      color: $text-primary;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .more {
      font-size: $font-size-sm;
      color: $primary-color;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;

      &::after {
        content: '→';
        font-size: $font-size-lg;
      }

      &:active {
        opacity: 0.8;
      }
    }
  }

  .promotion-section {
    background: $bg-white;
    border-radius: 12px;
    margin: 8px 12px;
    padding: 8px 8px 2px;
    box-shadow: $shadow-sm;

    .promotion-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 0 8px 8px;
    }

    .promo-card {
      display: flex;
      gap: 12px;
      align-items: center;
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 12px;
      padding: 12px;
      box-shadow: $shadow-sm;
      transition: transform .15s ease, box-shadow .15s ease;

      &:active { transform: scale(0.99); }

      &:hover {
        box-shadow: $shadow-md;
      }

      .promo-thumb {
        position: relative;
        width: 96px;
        height: 72px;
        border-radius: 10px;
        overflow: hidden;

        .promo-badge { position: absolute; left: 6px; top: 6px; }
        .promo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
      }

      .promo-info {
        flex: 1;
        min-width: 0;

        .promo-title { font-size: $font-size-lg; font-weight: 700; color: $text-primary; }
        .promo-sub { margin-top: 4px; font-size: $font-size-xs; color: $text-secondary; }

        .promo-price-wrap { margin-top: 8px; display: flex; align-items: baseline; gap: 10px; }
        .promo-price { color: $danger-color; font-weight: 800; font-size: $font-size-xl; }
        .promo-origin { color: #999; text-decoration: line-through; font-size: $font-size-xs; }
      }
    }
  }

  @media (max-width: 768px) {
    .section-header {
      padding: 16px 12px 8px;
      h3 { font-size: $font-size-lg; }
    }

    .promotion-section {
      margin: 6px 8px;
      padding: 12px;
    }
  }

  @media (prefers-color-scheme: dark) {
    $bg-dark-card: #1e1e1e;
    $text-dark: #e0e0e0;

    .promotion-section { background: $bg-dark-card; border-color: rgba(255,255,255,0.1); }

    .section-header h3 { color: $text-dark; }

    .more { color: #4a9eff !important; }
  }
</style>


