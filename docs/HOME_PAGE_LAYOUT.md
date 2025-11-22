# 首页布局设计方案

> **版本**: v1.0.0  
> **更新日期**: 2025-01-12  
> **适用范围**: mall-vue 移动端首页

---

## 📋 目录

1. [设计概述](#1-设计概述)
2. [布局结构](#2-布局结构)
3. [组件设计](#3-组件设计)
4. [交互设计](#4-交互设计)
5. [响应式设计](#5-响应式设计)
6. [实现指南](#6-实现指南)

---

## 1. 设计概述

### 1.1 设计目标

- **快速浏览**: 用户能在3秒内了解当前促销活动
- **便捷导航**: 提供清晰的快捷入口，快速到达目标页面
- **视觉吸引力**: 使用蓝色渐变和现代设计，吸引用户注意
- **信息层次**: 清晰的信息架构，重要内容优先展示

### 1.2 设计原则

- 遵循 [UI设计规范](./UI_DESIGN_SYSTEM.md)
- 蓝色主色调，现代简约风格
- 移动优先设计
- 流畅的滚动体验

---

## 2. 布局结构

### 2.1 整体布局

```
┌─────────────────────────────────┐
│  Header (固定顶部)               │
│  - 搜索框                        │
│  - 用户入口                      │
├─────────────────────────────────┤
│                                 │
│  Main Content (可滚动)           │
│  ┌───────────────────────────┐ │
│  │  Hero Banner (轮播图)      │ │
│  │  高度: 200px               │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │  快捷入口 (4个图标)         │ │
│  │  间距: 12px                │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │  热门促销标题               │ │
│  │  "热门促销" + "查看全部"    │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │  促销商品列表 (横向滚动)    │ │
│  │  卡片间距: 12px            │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │  限时抢购 (可选)            │ │
│  │  倒计时 + 商品列表          │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │  推荐商品 (可选)            │ │
│  │  网格布局 2列              │ │
│  └───────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  Footer (固定底部)               │
│  - 首页 / 停车 / 订单 / 我的    │
└─────────────────────────────────┘
```

### 2.2 页面边距

- **页面左右边距**: `12px`
- **区块上下间距**: `24px`
- **卡片间距**: `12px`

### 2.3 内容区域顺序

1. **Hero Banner** - 最重要的促销活动轮播
2. **快捷入口** - 常用功能快速入口
3. **热门促销** - 当前最热门的促销商品
4. **限时抢购** (可选) - 带倒计时的限时活动
5. **推荐商品** (可选) - 个性化推荐

---

## 3. 组件设计

### 3.1 Hero Banner（轮播图）

#### 设计规范

- **高度**: `200px` (移动端)
- **圆角**: `12px` (顶部圆角，底部直角)
- **指示器**: 底部居中，白色圆点
- **自动播放**: 3秒切换
- **触摸滑动**: 支持左右滑动切换

#### 视觉设计

```scss
.hero-banner {
  height: 200px;
  margin: 12px 12px 0;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  box-shadow: $shadow-base;
  
  .banner-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
```

#### 数据结构

```typescript
interface BannerItem {
  id: string;
  image: string;
  title?: string;
  link?: string;
  promotionId?: number;
}
```

### 3.2 快捷入口（QuickNav）

#### 设计规范

- **布局**: 4个图标，横向排列
- **图标尺寸**: `48px × 48px`
- **图标圆角**: `12px`
- **背景**: 白色卡片，带阴影
- **间距**: 图标之间 `12px`，卡片内边距 `16px`

#### 视觉设计

```
┌─────────────────────────────────┐
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│  │ 🎁 │ │ 🔥 │ │ ⭐ │ │ 🛍️ │      │
│  └───┘ └───┘ └───┘ └───┘      │
│  积分  限时  会员  热门         │
│  兑换  优惠  专享  推荐         │
└─────────────────────────────────┘
```

#### 组件代码示例

```vue
<template>
  <div class="quick-nav">
    <div
      v-for="item in navItems"
      :key="item.id"
      class="nav-item"
      @click="handleNavClick(item)"
    >
      <div class="nav-icon">
        <van-icon :name="item.icon" size="24px" />
      </div>
      <div class="nav-text">{{ item.text }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.quick-nav {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  margin: 12px;
  background: $bg-color-secondary;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-base;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  .nav-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-primary;
    border-radius: $border-radius-lg;
    color: white;
  }
  
  .nav-text {
    font-size: $font-size-xs;
    color: $text-color-primary;
  }
}
</style>
```

### 3.3 热门促销区域

#### 设计规范

- **标题区域**: 左侧标题 + 右侧"查看全部"链接
- **商品列表**: 横向滚动，卡片宽度 `280px`
- **卡片设计**: 图片 + 标题 + 价格 + 标签
- **间距**: 卡片之间 `12px`

#### 视觉设计

```
┌─────────────────────────────────┐
│  热门促销           查看全部 →   │
├─────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐          │
│  │商品1│ │商品2│ │商品3│          │
│  └────┘ └────┘ └────┘          │
└─────────────────────────────────┘
```

#### 商品卡片设计

```scss
.promotion-card {
  width: 280px;
  background: $bg-color-secondary;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow-base;
  margin-right: 12px;
  
  .card-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .card-content {
    padding: 12px;
    
    .card-title {
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      color: $text-color-primary;
      margin-bottom: 8px;
      // 最多显示2行，超出省略
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .card-price {
      display: flex;
      align-items: baseline;
      gap: 8px;
      
      .current-price {
        font-size: $font-size-xl;
        font-weight: $font-weight-bold;
        color: $primary;
      }
      
      .original-price {
        font-size: $font-size-sm;
        color: $text-color-tertiary;
        text-decoration: line-through;
      }
    }
  }
}
```

### 3.4 限时抢购区域（可选）

#### 设计规范

- **倒计时**: 顶部显示倒计时，红色高亮
- **商品列表**: 横向滚动，与热门促销类似
- **背景**: 渐变背景，增强视觉吸引力

#### 视觉设计

```
┌─────────────────────────────────┐
│  ⏰ 限时抢购                      │
│  距离结束: 02:30:15              │
├─────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐          │
│  │商品1│ │商品2│ │商品3│          │
│  └────┘ └────┘ └────┘          │
└─────────────────────────────────┘
```

---

## 4. 交互设计

### 4.1 滚动交互

- **平滑滚动**: 使用 `-webkit-overflow-scrolling: touch`
- **横向滚动**: 热门促销和限时抢购支持横向滚动
- **滚动指示**: 横向滚动时显示渐变遮罩，提示可滚动

### 4.2 点击反馈

- **卡片点击**: 点击时轻微缩放 `scale(0.98)`
- **按钮点击**: 点击时颜色加深
- **反馈时长**: `150ms`

### 4.3 加载状态

- **骨架屏**: 数据加载时显示骨架屏
- **加载动画**: 使用 Vant Loading 组件
- **错误处理**: 加载失败显示错误提示和重试按钮

### 4.4 下拉刷新

- **支持下拉刷新**: 下拉时显示刷新动画
- **刷新时长**: 最多3秒，超时显示错误

---

## 5. 响应式设计

### 5.1 移动端（≤ 768px）

- **页面边距**: `12px`
- **Banner高度**: `200px`
- **卡片宽度**: `280px` (横向滚动)
- **字体大小**: 按规范使用

### 5.2 桌面端（> 768px）

- **最大宽度**: `768px`，居中显示
- **页面边距**: `auto`
- **其他样式**: 与移动端保持一致

---

## 6. 实现指南

### 6.1 组件结构

```
src/views/customer/Home.vue
├── HeroBanner (轮播图组件)
├── QuickNav (快捷入口组件)
├── HotPromotions (热门促销组件)
├── FlashSale (限时抢购组件，可选)
└── RecommendedProducts (推荐商品组件，可选)
```

### 6.2 数据获取

```typescript
// 使用 Pinia Store 管理数据
import { usePromotionStore } from '@/stores/promotion'

const promotionStore = usePromotionStore()

// 获取Banner数据
const banners = await promotionStore.fetchBanners()

// 获取热门促销
const hotPromotions = await promotionStore.fetchHotPromotions()
```

### 6.3 性能优化

- **图片懒加载**: 使用 `van-image` 组件的懒加载功能
- **虚拟滚动**: 如果商品列表过长，考虑使用虚拟滚动
- **代码分割**: 使用动态导入减少首屏加载时间

### 6.4 样式实现

```scss
@use '@/styles/variables.scss' as *;

.home-page {
  padding-bottom: 24px;
  background: $gradient-background;
  min-height: 100vh;
  
  // 页面边距
  padding-left: 12px;
  padding-right: 12px;
  
  // 区块间距
  .section {
    margin-bottom: 24px;
  }
}
```

---

## 7. 设计检查清单

### 7.1 视觉检查

- [ ] Banner 轮播图正常显示
- [ ] 快捷入口图标清晰可见
- [ ] 商品卡片信息完整
- [ ] 颜色符合UI规范（蓝色主色）
- [ ] 间距符合规范（12px/24px）

### 7.2 交互检查

- [ ] 所有按钮有点击反馈
- [ ] 横向滚动流畅
- [ ] 下拉刷新正常工作
- [ ] 加载状态正确显示
- [ ] 错误状态有提示

### 7.3 性能检查

- [ ] 首屏加载时间 < 2秒
- [ ] 图片懒加载正常
- [ ] 滚动流畅无卡顿
- [ ] 内存使用正常

---

## 8. 参考资源

- [UI设计规范](./UI_DESIGN_SYSTEM.md)
- [Vant UI 组件库](https://vant-ui.github.io/vant/)
- [现有首页实现](../src/views/customer/Home.vue)

---

**维护者**: 前端团队  
**最后更新**: 2025-01-12











