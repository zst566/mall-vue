# PromotionDetail.vue 重构分拆方案

## 📋 现状分析

**文件信息**：
- 总行数：1729 行
- Template：201 行
- Script：908 行
- Style：620 行

**问题**：
1. 单个文件过大，违反"单文件不超过 500 行"的最佳实践
2. 业务逻辑与 UI 耦合严重，难以测试和维护
3. 样式代码过多，影响可读性
4. 功能模块混杂，职责不清

---

## 🎯 重构目标

1. **模块化拆分**：将大文件拆分为多个职责单一的小文件
2. **逻辑复用**：提取可复用的业务逻辑到 composables
3. **组件化**：将 UI 区域拆分为独立组件
4. **可维护性**：提高代码可读性和可测试性

---

## 📦 分拆方案

### 1. UI 组件拆分

#### 1.1 `PromotionBanner.vue` (约 150 行)
**位置**：`src/components/customer/PromotionBanner.vue`

**职责**：
- 显示促销活动主图轮播
- 处理图片加载和错误处理
- Banner 模糊背景效果

**Props**：
```typescript
interface Props {
  images: any[] | null
}
```

**功能**：
- 图片轮播（van-swipe）
- 模糊背景层效果
- 占位图显示

---

#### 1.2 `PromotionInfo.vue` (约 350 行)
**位置**：`src/components/customer/PromotionInfo.vue`

**职责**：
- 显示促销活动基本信息
- 价格展示（支持商场补贴模式）
- 服务特色标签
- 规格选择
- 元数据展示（库存、销量、时间）
- 商铺信息

**Props**：
```typescript
interface Props {
  promotion: Promotion
  selectedVariant: PromotionVariant | null
  variants: PromotionVariant[]
  tags: Tag[]
  isActivityActive: boolean
}

interface Emits {
  (e: 'update:selectedVariant', variant: PromotionVariant | null): void
  (e: 'tag-click', tagId: string): void
}
```

**功能**：
- 价格计算和展示（原价、现价、补贴价）
- 服务标签 Popover 交互
- 规格选择器集成
- 商铺信息展示

---

#### 1.3 `PromotionDetailImages.vue` (约 100 行)
**位置**：`src/components/customer/PromotionDetailImages.vue`

**职责**：
- 显示促销活动详情图片列表
- 图片懒加载
- 图片错误处理

**Props**：
```typescript
interface Props {
  images: any[]
}
```

**功能**：
- 详情图片列表展示
- 图片排序（按 position）
- 懒加载优化

---

#### 1.4 `PromotionBottomBar.vue` (约 250 行)
**位置**：`src/components/customer/PromotionBottomBar.vue`

**职责**：
- 底部操作栏（首页、收藏、客服、购买按钮）
- 滚动显示/隐藏控制
- 主题色动态适配

**Props**：
```typescript
interface Props {
  isFavorite: boolean
  canPurchase: boolean
  purchaseButtonText: string
  isVisible: boolean
}

interface Emits {
  (e: 'home'): void
  (e: 'favorite'): void
  (e: 'service'): void
  (e: 'purchase'): void
}
```

**功能**：
- 底部栏显示/隐藏动画
- 主题色动态计算
- 操作按钮交互

---

### 2. Composables 拆分

#### 2.1 `usePromotionDetail.ts` (约 200 行)
**位置**：`src/composables/usePromotionDetail.ts`

**职责**：
- 促销详情数据加载
- 促销数据状态管理
- 规格选择逻辑

**返回**：
```typescript
interface UsePromotionDetailReturn {
  // 状态
  promotion: Ref<Promotion>
  loading: Ref<boolean>
  variants: ComputedRef<PromotionVariant[]>
  selectedVariant: Ref<PromotionVariant | null>
  
  // 方法
  loadPromotionDetail: () => Promise<void>
  selectVariant: (variant: PromotionVariant) => void
}
```

**功能**：
- API 数据加载
- 规格默认选择
- 数据格式化

---

#### 2.2 `usePromotionPurchase.ts` (约 250 行)
**位置**：`src/composables/usePromotionPurchase.ts`

**职责**：
- 购买流程处理
- 支付跳转逻辑
- 积分兑换处理
- 微信小程序支付处理

**参数**：
```typescript
interface UsePromotionPurchaseOptions {
  promotionId: string
  promotion: Ref<Promotion>
  selectedVariant: Ref<PromotionVariant | null>
  variants: ComputedRef<PromotionVariant[]>
}
```

**返回**：
```typescript
interface UsePromotionPurchaseReturn {
  canPurchase: ComputedRef<boolean>
  purchaseButtonText: ComputedRef<string>
  handlePurchase: () => Promise<void>
}
```

**功能**：
- 购买前验证（登录、规格、库存）
- 分账模式判断（商场补贴/普通分账/积分兑换）
- 支付页面跳转
- 微信小程序环境检测

---

#### 2.3 `usePromotionFavorite.ts` (约 100 行)
**位置**：`src/composables/usePromotionFavorite.ts`

**职责**：
- 收藏状态管理
- 收藏/取消收藏操作

**参数**：
```typescript
interface UsePromotionFavoriteOptions {
  promotionId: string
}
```

**返回**：
```typescript
interface UsePromotionFavoriteReturn {
  isFavorite: Ref<boolean>
  favoriteLoading: Ref<boolean>
  toggleFavorite: () => Promise<void>
  initFavoriteStatus: () => Promise<void>
}
```

**功能**：
- 收藏状态初始化
- 收藏/取消收藏 API 调用
- 登录状态检查

---

#### 2.4 `usePromotionImages.ts` (约 150 行)
**位置**：`src/composables/usePromotionImages.ts`

**职责**：
- 图片数据处理
- 主图和详情图分离
- 图片 URL 格式化

**参数**：
```typescript
interface UsePromotionImagesOptions {
  images: Ref<any> | ComputedRef<any>
}
```

**返回**：
```typescript
interface UsePromotionImagesReturn {
  mainImages: ComputedRef<any[]>
  detailImages: ComputedRef<any[]>
  getImageUrl: (image: any) => string
  handleImageError: (event: Event) => void
}
```

**功能**：
- 主图提取（isMain 标记或第一张）
- 详情图排序（按 position）
- 图片格式统一处理

---

#### 2.5 `usePromotionPrice.ts` (约 120 行)
**位置**：`src/composables/usePromotionPrice.ts`

**职责**：
- 价格计算逻辑
- 商场补贴模式处理
- 价格格式化

**参数**：
```typescript
interface UsePromotionPriceOptions {
  promotion: Ref<Promotion>
  selectedVariant: Ref<PromotionVariant | null>
}
```

**返回**：
```typescript
interface UsePromotionPriceReturn {
  isMallSubsidy: ComputedRef<boolean>
  subsidyAmount: ComputedRef<number>
  finalAmount: ComputedRef<number>
  salePrice: ComputedRef<number>
  originalPrice: ComputedRef<number>
  formatPrice: (price: number) => string
}
```

**功能**：
- 商场补贴模式判断
- 补贴金额计算
- 实付金额计算
- 价格格式化（千分位）

---

#### 2.6 `usePromotionTags.ts` (约 180 行)
**位置**：`src/composables/usePromotionTags.ts`

**职责**：
- 服务特色标签管理
- Popover 位置计算
- 标签交互处理

**参数**：
```typescript
interface UsePromotionTagsOptions {
  tags: Ref<Tag[]>
}
```

**返回**：
```typescript
interface UsePromotionTagsReturn {
  tagPopoverVisible: Ref<Record<string, boolean>>
  getPopoverPlacement: (tagId: string) => 'top' | 'bottom'
  getPopoverOffset: (tagId: string) => [number, number]
  showTagDescription: (tagId: string) => void
  handleDocumentClick: (event: MouseEvent) => void
}
```

**功能**：
- Popover 位置智能计算（视口内）
- 标签点击处理
- 外部点击关闭 Popover

---

#### 2.7 `useBottomBarScroll.ts` (约 100 行)
**位置**：`src/composables/useBottomBarScroll.ts`

**职责**：
- 底部栏滚动显示/隐藏控制
- 主题色动态计算

**返回**：
```typescript
interface UseBottomBarScrollReturn {
  isBottomBarVisible: Ref<boolean>
  bottomBarStyle: Ref<Record<string, string>>
  setBottomBarTheme: () => void
}
```

**功能**：
- 滚动方向检测
- 底部栏显示/隐藏动画
- 主题色提取和反色计算
- 滚动节流处理

---

### 3. 工具函数拆分

#### 3.1 `promotionHelpers.ts` (约 80 行)
**位置**：`src/utils/promotionHelpers.ts`

**职责**：
- 促销活动相关的工具函数

**导出函数**：
```typescript
// 格式化日期范围
export function formatDateRange(start: string, end: string): string

// 判断活动是否有效
export function isActivityActive(startTime: string, endTime: string): boolean

// 计算剩余数量
export function calculateLeftQuantity(
  promotionQuantity: number,
  soldQuantity: number
): number

// 颜色工具函数
export function hexToRgba(hex: string, alpha: number): string
export function invertColor(hex: string): string
```

---

### 4. 类型定义

#### 4.1 `promotionTypes.ts` (约 100 行)
**位置**：`src/types/promotionTypes.ts`

**职责**：
- 促销活动相关的 TypeScript 类型定义

**导出类型**：
```typescript
export interface Promotion {
  id: string
  name: string
  description?: string
  salePrice: number
  originalPrice: number
  promotionQuantity: number
  soldQuantity: number
  startTime: string
  endTime: string
  images: any
  promotionMode?: 'mall_subsidy' | 'normal_split' | 'points_exchange'
  settlementPrice?: number
  pointsValue?: number
  variants?: PromotionVariant[]
  tags?: Tag[]
  shop?: Shop | null
}

export interface PromotionVariant {
  id: string
  name: string
  salePrice: number
  originalPrice?: number
  promotionQuantity: number
  soldQuantity: number
  promotionMode?: 'mall_subsidy' | 'normal_split' | 'points_exchange'
  settlementPrice?: number
  pointsValue?: number
  subsidyAmount?: number
  isDefault?: boolean
  sortOrder?: number
}

export interface Tag {
  id: string
  name: string
  description?: string | null
}

export interface Shop {
  id: string
  shopCode: string
  floor?: string | null
  area?: string | null
  tenantName?: string | null
}
```

---

## 📁 文件结构

```
mall-vue/src/
├── views/customer/
│   └── PromotionDetail.vue (重构后约 200 行)
│
├── components/customer/
│   ├── PromotionBanner.vue (新建)
│   ├── PromotionInfo.vue (新建)
│   ├── PromotionDetailImages.vue (新建)
│   └── PromotionBottomBar.vue (新建)
│
├── composables/
│   ├── usePromotionDetail.ts (新建)
│   ├── usePromotionPurchase.ts (新建)
│   ├── usePromotionFavorite.ts (新建)
│   ├── usePromotionImages.ts (新建)
│   ├── usePromotionPrice.ts (新建)
│   ├── usePromotionTags.ts (新建)
│   └── useBottomBarScroll.ts (新建)
│
├── utils/
│   └── promotionHelpers.ts (新建)
│
└── types/
    └── promotionTypes.ts (新建)
```

---

## 🔄 重构后的主文件结构

### `PromotionDetail.vue` (重构后约 200 行)

```vue
<template>
  <div class="promotion-detail-page">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="promotion.name || '促销活动详情'"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
      z-index="100"
      class="detail-nav-bar"
    />

    <!-- Banner 主图 -->
    <PromotionBanner :images="promotion.images" />

    <!-- 促销活动基本信息 -->
    <PromotionInfo
      :promotion="promotion"
      :selected-variant="selectedVariant"
      :variants="variants"
      :tags="tags"
      :is-activity-active="isActivityActive"
      @update:selected-variant="selectedVariant = $event"
      @tag-click="handleTagClick"
    />

    <!-- 详情图片 -->
    <PromotionDetailImages :images="detailImages" />

    <!-- 底部操作栏 -->
    <PromotionBottomBar
      :is-favorite="isFavorite"
      :can-purchase="canPurchase"
      :purchase-button-text="purchaseButtonText"
      :is-visible="isBottomBarVisible"
      @home="goToHome"
      @favorite="toggleFavorite"
      @service="contactService"
      @purchase="handlePurchase"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import PromotionBanner from '@/components/customer/PromotionBanner.vue'
import PromotionInfo from '@/components/customer/PromotionInfo.vue'
import PromotionDetailImages from '@/components/customer/PromotionDetailImages.vue'
import PromotionBottomBar from '@/components/customer/PromotionBottomBar.vue'
import { usePromotionDetail } from '@/composables/usePromotionDetail'
import { usePromotionPurchase } from '@/composables/usePromotionPurchase'
import { usePromotionFavorite } from '@/composables/usePromotionFavorite'
import { usePromotionImages } from '@/composables/usePromotionImages'
import { usePromotionPrice } from '@/composables/usePromotionPrice'
import { usePromotionTags } from '@/composables/usePromotionTags'
import { useBottomBarScroll } from '@/composables/useBottomBarScroll'
import { isActivityActive } from '@/utils/promotionHelpers'
import webViewBridge from '@/utils/webview-bridge'

const router = useRouter()
const route = useRoute()
const promotionId = route.params.id as string

// 数据加载
const {
  promotion,
  loading,
  variants,
  selectedVariant,
  loadPromotionDetail
} = usePromotionDetail(promotionId)

// 图片处理
const { mainImages, detailImages } = usePromotionImages(() => promotion.value.images)

// 价格计算
const { isMallSubsidy } = usePromotionPrice({
  promotion,
  selectedVariant
})

// 标签管理
const { tags, showTagDescription, handleDocumentClick } = usePromotionTags(() => promotion.value.tags || [])

// 收藏管理
const { isFavorite, toggleFavorite, initFavoriteStatus } = usePromotionFavorite(promotionId)

// 购买逻辑
const { canPurchase, purchaseButtonText, handlePurchase } = usePromotionPurchase({
  promotionId,
  promotion,
  selectedVariant,
  variants
})

// 底部栏滚动控制
const { isBottomBarVisible, setBottomBarTheme } = useBottomBarScroll()

// 活动状态
const isActivityActive = computed(() => {
  return isActivityActive(
    promotion.value.startTime,
    promotion.value.endTime
  )
})

// 标签点击处理
const handleTagClick = (tagId: string) => {
  showTagDescription(tagId)
}

// 支付结果处理
const handlePaymentResult = (result: any) => {
  if (result?.success) {
    loadPromotionDetail()
    showToast('支付成功！')
  }
}

// 页面激活刷新
const handlePageActivated = () => {
  loadPromotionDetail()
}

// 返回首页
const goToHome = () => {
  router.push({ name: 'Home' })
}

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 联系客服
const contactService = () => {
  showToast('正在跳转到客服聊天...')
}

// 生命周期
onMounted(() => {
  setBottomBarTheme()
  loadPromotionDetail()
  webViewBridge.on('paymentResult', handlePaymentResult)
  document.addEventListener('click', handleDocumentClick, true)
  // ... 其他初始化
})

onUnmounted(() => {
  webViewBridge.off('paymentResult', handlePaymentResult)
  document.removeEventListener('click', handleDocumentClick, true)
  // ... 其他清理
})
</script>

<style lang="scss" scoped>
// 只保留页面级别的样式，组件样式移到各自组件中
.promotion-detail-page {
  min-height: 100vh;
  padding-bottom: 80px;
  background: var(--theme-bg-gradient, $glass-bg-gradient);
  background-attachment: fixed;
  background-size: cover;

  :deep(.detail-nav-bar) {
    // 导航栏样式
  }
}
</style>
```

---

## ✅ 重构收益

### 1. 代码可维护性
- **主文件从 1729 行降至约 200 行**，可读性大幅提升
- 每个文件职责单一，易于理解和修改
- 组件和逻辑可独立测试

### 2. 代码复用性
- Composables 可在其他页面复用（如 ProductDetail）
- 组件可在其他场景复用
- 工具函数可在全局使用

### 3. 开发效率
- 多人协作时减少冲突
- 功能修改时影响范围小
- 新功能添加更容易

### 4. 性能优化
- 组件按需加载
- 逻辑拆分便于优化
- 样式按组件隔离

---

## 📝 实施步骤

### 阶段 1：准备工作（1-2 小时）
1. ✅ 创建类型定义文件 `promotionTypes.ts`
2. ✅ 创建工具函数文件 `promotionHelpers.ts`
3. ✅ 备份原文件 `PromotionDetail.vue.backup`

### 阶段 2：Composables 提取（3-4 小时）
1. ✅ 提取 `usePromotionDetail.ts`
2. ✅ 提取 `usePromotionImages.ts`
3. ✅ 提取 `usePromotionPrice.ts`
4. ✅ 提取 `usePromotionTags.ts`
5. ✅ 提取 `usePromotionFavorite.ts`
6. ✅ 提取 `usePromotionPurchase.ts`
7. ✅ 提取 `useBottomBarScroll.ts`

### 阶段 3：组件拆分（3-4 小时）
1. ✅ 创建 `PromotionBanner.vue`
2. ✅ 创建 `PromotionInfo.vue`
3. ✅ 创建 `PromotionDetailImages.vue`
4. ✅ 创建 `PromotionBottomBar.vue`

### 阶段 4：主文件重构（2-3 小时）
1. ✅ 重构 `PromotionDetail.vue`，使用新组件和 composables
2. ✅ 移除冗余代码
3. ✅ 优化样式结构

### 阶段 5：测试验证（2-3 小时）
1. ✅ 功能测试（所有功能正常）
2. ✅ 样式测试（UI 显示正常）
3. ✅ 性能测试（无性能回归）
4. ✅ 兼容性测试（微信小程序环境）

### 阶段 6：代码审查（1-2 小时）
1. ✅ 代码风格检查
2. ✅ TypeScript 类型检查
3. ✅ Lint 检查
4. ✅ 构建验证

**总预计时间**：12-18 小时

---

## ⚠️ 注意事项

### 1. 向后兼容
- 保持 API 接口不变
- 保持路由参数不变
- 保持用户交互体验一致

### 2. 类型安全
- 所有 composables 和组件都要有完整的 TypeScript 类型
- 使用类型定义文件统一管理类型

### 3. 测试覆盖
- 每个 composable 都要有单元测试
- 每个组件都要有组件测试
- 集成测试确保整体功能正常

### 4. 性能考虑
- 避免不必要的响应式转换
- 合理使用 `computed` 和 `ref`
- 图片懒加载优化

### 5. 样式隔离
- 组件样式使用 `scoped`
- 全局样式放在主文件
- 避免样式冲突

---

## 🎯 成功标准

1. ✅ 主文件行数 < 300 行
2. ✅ 每个组件文件 < 400 行
3. ✅ 每个 composable 文件 < 300 行
4. ✅ 所有功能正常工作
5. ✅ 无 TypeScript 类型错误
6. ✅ 无 Lint 错误
7. ✅ 构建成功
8. ✅ 测试通过率 100%

---

## 📚 参考资源

- [Vue 3 Composition API 最佳实践](https://vuejs.org/guide/extras/composition-api-faq.html)
- [组件设计原则](https://vuejs.org/guide/components/props.html)
- [TypeScript 类型定义](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)


