# 组件封装指南

> **版本**: v1.0.0  
> **更新日期**: 2025-01-12  
> **适用范围**: mall-vue 移动端组件开发

---

## 📋 目录

1. [封装原则](#1-封装原则)
2. [组件结构](#2-组件结构)
3. [常用组件封装](#3-常用组件封装)
4. [样式规范](#4-样式规范)
5. [类型定义](#5-类型定义)
6. [最佳实践](#6-最佳实践)

---

## 1. 封装原则

### 1.1 为什么需要封装

- **统一风格**: 确保整个应用使用一致的UI风格
- **提高效率**: 减少重复代码，提高开发效率
- **易于维护**: 修改样式时只需修改一处
- **类型安全**: 提供完整的TypeScript类型定义

### 1.2 封装策略

- **基于Vant封装**: 在Vant组件基础上进行样式定制
- **保持API兼容**: 尽量保持与Vant组件API兼容
- **扩展功能**: 添加业务相关的功能
- **统一命名**: 使用 `App` 前缀，如 `AppButton`、`AppCard`

---

## 2. 组件结构

### 2.1 目录结构

```
src/components/
├── common/              # 通用组件
│   ├── AppButton.vue   # 按钮组件
│   ├── AppCard.vue     # 卡片组件
│   ├── AppInput.vue    # 输入框组件
│   └── ...
├── customer/            # 客户版组件
│   ├── ProductCard.vue # 商品卡片
│   ├── OrderCard.vue   # 订单卡片
│   └── ...
└── merchant/            # 商户版组件
    └── ...
```

### 2.2 组件文件结构

```vue
<template>
  <!-- 组件模板 -->
</template>

<script setup lang="ts">
// 1. 导入依赖
import { ref, computed } from 'vue'
import type { ComponentProps } from './types'

// 2. 定义Props
interface Props {
  // Props定义
}

const props = withDefaults(defineProps<Props>(), {
  // 默认值
})

// 3. 定义Emits
const emit = defineEmits<{
  // 事件定义
}>()

// 4. 业务逻辑
// ...

// 5. 暴露给父组件的方法（如需要）
defineExpose({
  // 暴露的方法
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

// 组件样式
</style>
```

---

## 3. 常用组件封装

### 3.1 AppButton（按钮组件）

#### 功能特性

- 基于 `van-button` 封装
- 统一的样式和交互
- 支持加载状态
- 支持图标

#### 代码示例

```vue
<template>
  <van-button
    :type="type"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :block="block"
    :round="round"
    :plain="plain"
    class="app-button"
    :class="[`app-button--${type}`, `app-button--${size}`]"
    @click="handleClick"
  >
    <van-icon v-if="icon && !loading" :name="icon" class="app-button__icon" />
    <slot />
  </van-button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'default'
  size?: 'large' | 'normal' | 'small' | 'mini'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  round?: boolean
  plain?: boolean
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'normal',
  loading: false,
  disabled: false,
  block: false,
  round: false,
  plain: false,
  icon: ''
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.app-button {
  // 统一圆角
  border-radius: $border-radius-base;
  
  // 统一阴影
  box-shadow: $shadow-sm;
  
  // 点击反馈
  transition: all $transition-fast;
  
  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-xs;
  }
  
  // 主按钮样式
  &--primary {
    background: $gradient-primary;
    border: none;
    
    &:hover {
      box-shadow: $shadow-base;
    }
  }
  
  // 图标间距
  &__icon {
    margin-right: 4px;
  }
}
</style>
```

#### 使用示例

```vue
<template>
  <AppButton type="primary" size="large" block icon="shopping-cart-o">
    立即购买
  </AppButton>
  
  <AppButton type="default" :loading="isLoading">
    提交
  </AppButton>
</template>
```

### 3.2 AppCard（卡片组件）

#### 功能特性

- 统一的卡片样式
- 支持头部、内容、底部插槽
- 支持点击事件
- 支持阴影层级

#### 代码示例

```vue
<template>
  <div
    class="app-card"
    :class="[`app-card--${shadow}`, { 'app-card--clickable': clickable }]"
    @click="handleClick"
  >
    <div v-if="$slots.header" class="app-card__header">
      <slot name="header" />
    </div>
    
    <div class="app-card__content">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="app-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  shadow?: 'none' | 'sm' | 'base' | 'lg'
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  shadow: 'base',
  clickable: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.app-card {
  background: $bg-color-secondary;
  border-radius: $border-radius-lg;
  overflow: hidden;
  
  // 阴影
  &--none {
    box-shadow: none;
  }
  
  &--sm {
    box-shadow: $shadow-sm;
  }
  
  &--base {
    box-shadow: $shadow-base;
  }
  
  &--lg {
    box-shadow: $shadow-lg;
  }
  
  // 可点击样式
  &--clickable {
    cursor: pointer;
    transition: all $transition-base;
    
    &:active {
      transform: scale(0.98);
      box-shadow: $shadow-sm;
    }
  }
  
  // 头部
  &__header {
    padding: $spacing-md;
    border-bottom: 1px solid $border-color;
  }
  
  // 内容
  &__content {
    padding: $spacing-md;
  }
  
  // 底部
  &__footer {
    padding: $spacing-md;
    border-top: 1px solid $border-color;
  }
}
</style>
```

#### 使用示例

```vue
<template>
  <AppCard shadow="base" clickable @click="handleCardClick">
    <template #header>
      <h3>商品标题</h3>
    </template>
    
    <p>商品描述信息</p>
    
    <template #footer>
      <AppButton type="primary" block>立即购买</AppButton>
    </template>
  </AppCard>
</template>
```

### 3.3 ProductCard（商品卡片组件）

#### 功能特性

- 专门用于商品展示
- 支持图片、标题、价格、标签
- 支持横向和纵向布局
- 支持点击跳转

#### 代码示例

```vue
<template>
  <div
    class="product-card"
    :class="[`product-card--${layout}`]"
    @click="handleClick"
  >
    <div class="product-card__image">
      <van-image
        :src="image"
        :alt="title"
        fit="cover"
        lazy-load
        :placeholder="placeholder"
      />
      <van-tag
        v-if="tag"
        :type="tagType"
        class="product-card__tag"
      >
        {{ tag }}
      </van-tag>
    </div>
    
    <div class="product-card__content">
      <h3 class="product-card__title">{{ title }}</h3>
      
      <div v-if="description" class="product-card__description">
        {{ description }}
      </div>
      
      <div class="product-card__price">
        <span class="product-card__price-current">¥{{ currentPrice }}</span>
        <span v-if="originalPrice" class="product-card__price-original">
          ¥{{ originalPrice }}
        </span>
      </div>
      
      <div v-if="soldCount" class="product-card__meta">
        已售 {{ soldCount }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  image: string
  title: string
  description?: string
  currentPrice: number
  originalPrice?: number
  tag?: string
  tagType?: 'primary' | 'success' | 'warning' | 'danger'
  soldCount?: number
  layout?: 'horizontal' | 'vertical'
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'vertical',
  tagType: 'primary',
  placeholder: 'data:image/svg+xml;base64,...'
})

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.product-card {
  background: $bg-color-secondary;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow-base;
  cursor: pointer;
  transition: all $transition-base;
  
  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-sm;
  }
  
  // 纵向布局（默认）
  &--vertical {
    display: flex;
    flex-direction: column;
    
    .product-card__image {
      width: 100%;
      height: 200px;
    }
  }
  
  // 横向布局
  &--horizontal {
    display: flex;
    flex-direction: row;
    
    .product-card__image {
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }
    
    .product-card__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  }
  
  &__image {
    position: relative;
    overflow: hidden;
    
    .van-image {
      width: 100%;
      height: 100%;
    }
  }
  
  &__tag {
    position: absolute;
    top: 8px;
    left: 8px;
  }
  
  &__content {
    padding: $spacing-md;
  }
  
  &__title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $text-color-primary;
    margin-bottom: $spacing-2;
    // 最多显示2行
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  &__description {
    font-size: $font-size-sm;
    color: $text-color-secondary;
    margin-bottom: $spacing-2;
    // 最多显示1行
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  &__price {
    display: flex;
    align-items: baseline;
    gap: $spacing-2;
    margin-bottom: $spacing-2;
    
    &-current {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $primary;
    }
    
    &-original {
      font-size: $font-size-sm;
      color: $text-color-tertiary;
      text-decoration: line-through;
    }
  }
  
  &__meta {
    font-size: $font-size-xs;
    color: $text-color-tertiary;
  }
}
</style>
```

#### 使用示例

```vue
<template>
  <!-- 纵向布局 -->
  <ProductCard
    image="/path/to/image.jpg"
    title="商品名称"
    description="商品描述"
    :current-price="199"
    :original-price="299"
    tag="限时优惠"
    :sold-count="100"
    layout="vertical"
    @click="goToProductDetail"
  />
  
  <!-- 横向布局 -->
  <ProductCard
    image="/path/to/image.jpg"
    title="商品名称"
    :current-price="199"
    layout="horizontal"
    @click="goToProductDetail"
  />
</template>
```

---

## 4. 样式规范

### 4.1 使用变量

**✅ 正确**:
```scss
.card {
  padding: $spacing-md;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-base;
  color: $text-color-primary;
}
```

**❌ 错误**:
```scss
.card {
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: #323233;
}
```

### 4.2 使用混入

```scss
@use '@/styles/mixins.scss' as *;

.card {
  @include respond-to-max(mobile) {
    padding: $spacing-base;
  }
}
```

### 4.3 作用域样式

- 使用 `scoped` 确保样式不污染全局
- 需要全局样式时，使用 `:deep()` 或 `::v-deep`

```scss
<style lang="scss" scoped>
.card {
  :deep(.van-button) {
    // 深度选择器
  }
}
</style>
```

---

## 5. 类型定义

### 5.1 Props类型

```typescript
// 基础类型
interface Props {
  title: string
  count?: number
  disabled?: boolean
}

// 联合类型
interface Props {
  type: 'primary' | 'success' | 'warning' | 'danger'
  size: 'small' | 'medium' | 'large'
}

// 对象类型
interface Props {
  config: {
    width: number
    height: number
    color: string
  }
}
```

### 5.2 Emits类型

```typescript
const emit = defineEmits<{
  click: [event: MouseEvent]
  change: [value: string]
  update: [data: { id: number; name: string }]
}>()
```

### 5.3 暴露类型

```typescript
defineExpose({
  focus: () => void
  reset: () => void
  getValue: () => string
})
```

---

## 6. 最佳实践

### 6.1 组件设计

- **单一职责**: 每个组件只做一件事
- **可复用性**: 设计时考虑复用场景
- **可配置性**: 通过Props提供足够的配置选项
- **可扩展性**: 使用插槽支持内容扩展

### 6.2 性能优化

- **懒加载**: 图片使用懒加载
- **按需加载**: 大型组件使用动态导入
- **避免重复渲染**: 使用 `v-memo` 或 `computed`

### 6.3 可访问性

- **语义化HTML**: 使用正确的HTML标签
- **ARIA标签**: 为交互元素添加ARIA标签
- **键盘导航**: 支持键盘操作

### 6.4 代码质量

- **类型安全**: 完整的TypeScript类型定义
- **代码注释**: 复杂逻辑添加注释
- **错误处理**: 完善的错误处理机制

---

## 7. 组件清单

### 7.1 通用组件

- [ ] AppButton - 按钮组件
- [ ] AppCard - 卡片组件
- [ ] AppInput - 输入框组件
- [ ] AppTag - 标签组件
- [ ] AppEmpty - 空状态组件
- [ ] AppLoading - 加载组件

### 7.2 业务组件

- [ ] ProductCard - 商品卡片
- [ ] OrderCard - 订单卡片
- [ ] PromotionCard - 促销卡片
- [ ] AddressCard - 地址卡片

---

## 8. 参考资源

- [UI设计规范](./UI_DESIGN_SYSTEM.md)
- [Vant UI 组件库](https://vant-ui.github.io/vant/)
- [Vue 3 官方文档](https://vuejs.org/)

---

**维护者**: 前端团队  
**最后更新**: 2025-01-12

