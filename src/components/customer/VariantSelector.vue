<template>
  <div class="variant-selector" :class="{ 'disabled': disabled }">
    <div class="selector-label" v-if="variants.length > 0">选择规格：</div>
    <div class="variant-grid">
      <button
        v-for="variant in variants"
        :key="variant.id"
        type="button"
        class="variant-btn"
        :class="{
          'active': isSelected(variant),
          'sold-out': isSoldOut(variant)
        }"
        :disabled="disabled || isSoldOut(variant)"
        @click="handleVariantClick(variant)"
      >
        <div class="variant-content">
          <span class="variant-name" :title="variant.name">{{ truncateName(variant.name) }}</span>
          <span class="variant-price">¥{{ formatPrice(variant.finalAmount ?? variant.salePrice) }}</span>
        </div>
        <span v-if="isSoldOut(variant)" class="sold-out-tag">已售罄</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { formatMoney } from '@/utils/format'

/**
 * 促销活动规格类型（基于后端API响应）
 */
interface PromotionVariant {
  id: string
  name: string
  salePrice: number
  originalPrice?: number
  promotionQuantity: number
  soldQuantity: number
  promotionMode?: 'mall_subsidy' | 'normal_split' | 'points_exchange'
  settlementPrice?: number
  pointsValue?: number
  finalAmount?: number // 最终价格（后端计算）
  isDefault?: boolean
  sortOrder?: number
}

/**
 * 组件 Props
 */
interface Props {
  variants: PromotionVariant[]       // 规格列表
  modelValue?: PromotionVariant | null  // 当前选中规格（v-model）
  disabled?: boolean                 // 是否禁用整个选择器
  maxNameLength?: number             // 规格名称最大长度（默认 10 个汉字）
  priceDisplayMode?: 'full' | 'diff'  // 价格显示模式（完整价格 / 差价）
  autoSelectFirst?: boolean          // 是否自动选择首个有库存规格（默认 true）
}

const props = withDefaults(defineProps<Props>(), {
  variants: () => [],
  modelValue: null,
  disabled: false,
  maxNameLength: 10,
  priceDisplayMode: 'full',
  autoSelectFirst: true
})

/**
 * 组件 Emits
 */
interface Emits {
  (e: 'update:modelValue', variant: PromotionVariant | null): void
  (e: 'change', variant: PromotionVariant | null): void
}

const emit = defineEmits<Emits>()

// 内部选中的规格ID
const selectedVariantId = ref<string | null>(null)

/**
 * 计算剩余库存
 */
const getLeftQuantity = (variant: PromotionVariant): number => {
  return Math.max(0, variant.promotionQuantity - variant.soldQuantity)
}

/**
 * 判断规格是否售罄
 */
const isSoldOut = (variant: PromotionVariant): boolean => {
  return getLeftQuantity(variant) <= 0
}

/**
 * 判断规格是否被选中
 */
const isSelected = (variant: PromotionVariant): boolean => {
  return selectedVariant.value?.id === variant.id
}

/**
 * 智能选择规格策略
 * 优先级：默认规格（有库存）> 首个有库存规格 > 默认规格（无库存）> null
 */
const selectedVariant = computed(() => {
  // 如果用户手动选择了规格，优先使用
  if (selectedVariantId.value) {
    return props.variants.find(v => v.id === selectedVariantId.value) || null
  }

  // 如果父组件通过 v-model 传入了规格，使用传入的规格
  if (props.modelValue) {
    return props.modelValue
  }

  // 自动选择策略
  if (!props.autoSelectFirst) {
    return null
  }

  // 1. 尝试选择默认规格（如果有库存）
  const defaultVariant = props.variants.find(v => v.isDefault)
  if (defaultVariant && getLeftQuantity(defaultVariant) > 0) {
    return defaultVariant
  }

  // 2. 选择首个有库存的规格（按 sortOrder 排序）
  const sortedVariants = [...props.variants].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  const firstAvailable = sortedVariants.find(v => getLeftQuantity(v) > 0)
  if (firstAvailable) {
    return firstAvailable
  }

  // 3. 所有规格都售罄，返回默认规格（用于显示售罄状态）
  return defaultVariant || props.variants[0] || null
})

/**
 * 处理规格点击事件
 */
const handleVariantClick = (variant: PromotionVariant) => {
  // 如果规格售罄或组件禁用，忽略点击
  if (isSoldOut(variant) || props.disabled) {
    return
  }

  // 更新选中的规格ID
  selectedVariantId.value = variant.id

  // 触发事件
  emit('update:modelValue', variant)
  emit('change', variant)
}

/**
 * 截断规格名称
 */
const truncateName = (name: string): string => {
  if (!name) return ''
  if (name.length <= props.maxNameLength) return name
  return name.substring(0, props.maxNameLength) + '...'
}

/**
 * 格式化价格
 */
const formatPrice = (price: number): string => {
  return formatMoney(price)
}

/**
 * 监听 modelValue 变化，同步内部状态
 */
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.id !== selectedVariantId.value) {
    selectedVariantId.value = newValue.id
  }
}, { immediate: true })

/**
 * 监听 selectedVariant 变化，自动触发初始选中
 */
watch(selectedVariant, (newValue) => {
  if (newValue && !selectedVariantId.value && newValue.id !== props.modelValue?.id) {
    // 自动选中时触发事件
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
}, { immediate: true })

/**
 * 组件挂载后，确保初始状态正确
 */
onMounted(() => {
  // 如果没有传入 modelValue，且允许自动选择，则自动选择规格
  if (!props.modelValue && props.autoSelectFirst && selectedVariant.value) {
    emit('update:modelValue', selectedVariant.value)
    emit('change', selectedVariant.value)
  }
})
</script>

<style lang="scss" scoped>
.variant-selector {
  padding: 16px;
  background: var(--van-background-2);
  border-radius: 8px;

  .selector-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--van-text-color);
    margin-bottom: 12px;
  }

  .variant-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;

    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
  }

  .variant-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    border: 1px solid var(--van-border-color);
    border-radius: 8px;
    background: var(--van-background-color);
    transition: all 0.2s ease;
    cursor: pointer;
    min-height: 60px;

    &:hover:not(:disabled) {
      border-color: var(--van-danger-color);
    }

    &.active {
      border-color: var(--van-danger-color);
      background: rgba(238, 10, 36, 0.05);

      .variant-price {
        color: var(--van-danger-color);
        font-weight: 600;
      }
    }

    &.sold-out {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--van-gray-1);

      &:hover {
        border-color: var(--van-border-color);
      }
    }

    &:disabled {
      cursor: not-allowed;
    }

    .variant-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      width: 100%;
    }

    .variant-name {
      font-size: 14px;
      color: var(--van-text-color);
      text-align: center;
      word-break: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }

    .variant-price {
      font-size: 16px;
      font-weight: 500;
      color: var(--van-text-color);
    }

    .sold-out-tag {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      color: var(--van-text-color-3);
      background: rgba(255, 255, 255, 0.9);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
  }

  &.disabled {
    pointer-events: none;
    opacity: 0.3;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      pointer-events: none;
    }
  }
}
</style>
