# 滨江宏岸商场 - 移动端 UI 设计规范

> **版本**: v1.0.0  
> **更新日期**: 2025-01-12  
> **适用范围**: mall-vue 移动端应用

---

## 📋 目录

1. [设计原则](#1-设计原则)
2. [颜色系统](#2-颜色系统)
3. [字体系统](#3-字体系统)
4. [间距系统](#4-间距系统)
5. [圆角系统](#5-圆角系统)
6. [阴影系统](#6-阴影系统)
7. [组件规范](#7-组件规范)
8. [布局规范](#8-布局规范)
9. [交互规范](#9-交互规范)
10. [图标规范](#10-图标规范)
11. [页面模板](#11-页面模板)
12. [响应式设计](#12-响应式设计)
13. [无障碍设计](#13-无障碍设计)

---

## 1. 设计原则

### 1.1 品牌定位

- **品牌主色**: 蓝色系（现代、专业、可信赖）
- **目标用户**: 青年及中年用户群体（25-50岁）
- **设计风格**: 现代简约、年轻活力
- **核心价值**: 便捷、高效、愉悦的购物体验

### 1.2 设计理念

1. **简约而不简单**: 界面简洁清晰，但功能完整强大
2. **年轻有活力**: 使用现代设计语言，保持视觉活力
3. **用户为中心**: 每个设计决策都以提升用户体验为目标
4. **一致性**: 保持视觉和交互的一致性，降低学习成本
5. **可访问性**: 确保所有用户都能轻松使用

### 1.3 用户体验原则

- **易用性**: 操作简单直观，3秒内理解界面
- **效率**: 减少操作步骤，快速完成任务
- **反馈**: 每个操作都有明确的视觉反馈
- **容错性**: 允许用户犯错，提供撤销和重试机制
- **性能**: 流畅的动画和快速的响应

---

## 2. 颜色系统

### 2.1 主色调（蓝色系）

主色调采用蓝色系，传达专业、可信赖、现代的品牌形象。

| 颜色名称 | 色值 | 使用场景 | 示例 |
|---------|------|---------|------|
| **Primary** | `#1989fa` | 主要按钮、链接、强调元素 | 立即购买按钮 |
| **Primary Light** | `#5cadff` | 悬停状态、次要按钮 | 按钮悬停 |
| **Primary Dark** | `#0068c5` | 按下状态、深色背景上的主色 | 按钮按下 |
| **Primary Gradient** | `linear-gradient(135deg, #1989fa 0%, #0a86ff 100%)` | 背景渐变、卡片装饰 | Banner背景 |

### 2.2 功能色

| 颜色名称 | 色值 | 使用场景 |
|---------|------|---------|
| **Success** | `#07c160` | 成功状态、完成提示 |
| **Success Light** | `#52c41a` | 成功状态浅色 |
| **Warning** | `#ff976a` | 警告提示、待处理状态 |
| **Warning Light** | `#ffa940` | 警告浅色 |
| **Danger** | `#ee0a24` | 错误提示、删除操作 |
| **Danger Light** | `#ff4d4f` | 错误浅色 |
| **Info** | `#1989fa` | 信息提示（与主色相同） |

### 2.3 中性色

| 颜色名称 | 色值 | 使用场景 |
|---------|------|---------|
| **Text Primary** | `#323233` | 主要文本、标题 |
| **Text Secondary** | `#646566` | 次要文本、描述 |
| **Text Tertiary** | `#969799` | 辅助文本、占位符 |
| **Text Disabled** | `#c8c9cc` | 禁用状态文本 |
| **Border** | `#ebedf0` | 边框、分割线 |
| **Background Base** | `#f7f8fa` | 页面背景 |
| **Background Secondary** | `#ffffff` | 卡片背景 |
| **Background Tertiary** | `#edf2f7` | 次要背景 |

### 2.4 渐变色

| 渐变名称 | 色值 | 使用场景 |
|---------|------|---------|
| **Primary Gradient** | `linear-gradient(135deg, #1989fa 0%, #0a86ff 100%)` | 按钮、卡片装饰 |
| **Success Gradient** | `linear-gradient(135deg, #07c160 0%, #06ae56 100%)` | 成功状态背景 |
| **Warning Gradient** | `linear-gradient(135deg, #ff976a 0%, #ff7f00 100%)` | 警告状态背景 |
| **Background Gradient** | `linear-gradient(180deg, #f7f8fa 0%, #ffffff 100%)` | 页面背景渐变 |

### 2.5 颜色使用规范

#### ✅ 正确使用

- 主色用于主要操作按钮和重要链接
- 功能色用于状态提示和反馈
- 中性色用于文本和背景，保持层次清晰
- 渐变用于装饰性元素，增强视觉吸引力

#### ❌ 错误使用

- 不要在同一页面使用过多颜色（建议不超过5种）
- 不要使用低对比度的颜色组合（影响可读性）
- 不要随意改变功能色的语义（红色=错误，绿色=成功）

---

## 3. 字体系统

### 3.1 字体家族

```scss
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
```

**使用原则**:
- 优先使用系统字体，确保最佳性能和兼容性
- 中文字体使用系统默认字体
- 英文和数字使用系统无衬线字体

### 3.2 字号规范

| 字号名称 | 大小 | 行高 | 使用场景 | 示例 |
|---------|------|------|---------|------|
| **XXS** | `10px` | `14px` | 标签、辅助信息 | 价格单位 |
| **XS** | `12px` | `16px` | 次要文本、说明 | 商品描述 |
| **SM** | `13px` | `18px` | 正文、列表项 | 订单信息 |
| **Base** | `14px` | `20px` | 正文、默认文本 | 商品名称 |
| **LG** | `16px` | `24px` | 重要文本、按钮 | 按钮文字 |
| **XL** | `18px` | `26px` | 小标题 | 卡片标题 |
| **XXL** | `20px` | `28px` | 页面标题 | 页面标题 |
| **XXXL** | `24px` | `32px` | 大标题、价格 | 商品价格 |

### 3.3 字重规范

| 字重名称 | 值 | 使用场景 |
|---------|-----|---------|
| **Normal** | `400` | 正文、默认文本 |
| **Medium** | `500` | 强调文本、按钮 |
| **Semibold** | `600` | 标题、重要信息 |
| **Bold** | `700` | 大标题、价格 |

### 3.4 行高规范

| 行高名称 | 值 | 使用场景 |
|---------|-----|---------|
| **Tight** | `1.25` | 标题、单行文本 |
| **Base** | `1.5` | 正文、多行文本 |
| **Loose** | `1.75` | 长文本、说明 |

### 3.5 字体使用示例

```vue
<!-- 标题 -->
<h1 class="text-xxxl font-semibold">商品标题</h1>

<!-- 价格 -->
<div class="text-xxxl font-bold text-primary">¥199</div>

<!-- 正文 -->
<p class="text-base font-normal">商品描述信息</p>

<!-- 辅助信息 -->
<span class="text-xs text-tertiary">发布时间</span>
```

---

## 4. 间距系统

### 4.1 基础间距（4px基准）

间距系统采用 **4px** 基准，确保视觉对齐和一致性。

| 间距名称 | 大小 | 使用场景 |
|---------|------|---------|
| **XS** | `4px` | 紧密元素间距 |
| **SM** | `8px` | 相关元素间距 |
| **Base** | `12px` | 默认间距 |
| **MD** | `16px` | 卡片内边距 |
| **LG** | `24px` | 区块间距 |
| **XL** | `32px` | 大区块间距 |
| **XXL** | `48px` | 页面边距 |

### 4.2 组件间距

| 组件类型 | 内边距 | 外边距 |
|---------|--------|--------|
| **按钮** | `12px 24px` | `8px` |
| **卡片** | `16px` | `12px` |
| **输入框** | `12px 16px` | `8px` |
| **列表项** | `16px` | `0` |

### 4.3 页面间距

| 页面区域 | 间距 |
|---------|------|
| **页面边距** | `12px` |
| **区块间距** | `24px` |
| **卡片间距** | `12px` |

### 4.4 间距使用示例

```scss
// 卡片内边距
.card {
  padding: $spacing-md; // 16px
}

// 区块间距
.section {
  margin-bottom: $spacing-lg; // 24px
}

// 元素间距
.item {
  margin-right: $spacing-base; // 12px
}
```

---

## 5. 圆角系统

### 5.1 圆角规范

| 圆角名称 | 大小 | 使用场景 |
|---------|------|---------|
| **XS** | `2px` | 标签、小元素 |
| **SM** | `4px` | 输入框、小按钮 |
| **Base** | `8px` | 默认圆角、卡片 |
| **LG** | `12px` | 大卡片、弹窗 |
| **XL** | `16px` | 大卡片、Banner |
| **Full** | `50%` | 圆形头像、图标 |

### 5.2 圆角使用示例

```scss
// 按钮
.button {
  border-radius: $border-radius-base; // 8px
}

// 卡片
.card {
  border-radius: $border-radius-lg; // 12px
}

// 头像
.avatar {
  border-radius: $border-radius-full; // 50%
}
```

---

## 6. 阴影系统

### 6.1 阴影层级

| 阴影名称 | 值 | 使用场景 |
|---------|-----|---------|
| **XS** | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | 轻微提升 |
| **SM** | `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)` | 卡片、按钮 |
| **Base** | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` | 悬浮卡片 |
| **LG** | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` | 弹窗、下拉菜单 |
| **XL** | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` | 模态框 |

### 6.2 阴影使用示例

```scss
// 卡片阴影
.card {
  box-shadow: $shadow-base;
}

// 悬浮状态
.card:hover {
  box-shadow: $shadow-lg;
}

// 弹窗阴影
.modal {
  box-shadow: $shadow-xl;
}
```

---

## 7. 组件规范

### 7.1 按钮（Button）

#### 主要按钮（Primary）

```vue
<van-button type="primary" size="large" block>
  立即购买
</van-button>
```

**样式规范**:
- 背景色: `#1989fa`
- 文字颜色: `#ffffff`
- 圆角: `8px`
- 内边距: `12px 24px`
- 字重: `500`
- 阴影: `shadow-sm`（悬浮时 `shadow-base`）

#### 次要按钮（Default）

```vue
<van-button type="default" size="large" block>
  查看详情
</van-button>
```

**样式规范**:
- 背景色: `#ffffff`
- 文字颜色: `#323233`
- 边框: `1px solid #ebedf0`
- 圆角: `8px`

#### 文字按钮（Text）

```vue
<van-button type="default" plain>
  取消
</van-button>
```

### 7.2 输入框（Input）

```vue
<van-field
  v-model="value"
  label="手机号"
  placeholder="请输入手机号"
  type="tel"
/>
```

**样式规范**:
- 高度: `44px`
- 内边距: `12px 16px`
- 圆角: `8px`
- 边框: `1px solid #ebedf0`
- 聚焦边框: `2px solid #1989fa`

### 7.3 卡片（Card）

```vue
<div class="product-card">
  <img src="..." alt="商品图片" />
  <div class="card-content">
    <h3 class="card-title">商品名称</h3>
    <p class="card-price">¥199</p>
  </div>
</div>
```

**样式规范**:
- 背景色: `#ffffff`
- 圆角: `12px`
- 内边距: `16px`
- 阴影: `shadow-base`
- 间距: `12px`（卡片之间）

### 7.4 列表（List）

```vue
<van-cell-group inset>
  <van-cell title="我的订单" is-link />
  <van-cell title="地址管理" is-link />
</van-cell-group>
```

**样式规范**:
- 背景色: `#ffffff`
- 内边距: `16px`
- 圆角: `12px`（组容器）
- 分割线: `1px solid #ebedf0`

### 7.5 标签（Tag）

```vue
<van-tag type="primary">限时优惠</van-tag>
<van-tag type="success">已售罄</van-tag>
```

**样式规范**:
- 内边距: `4px 8px`
- 圆角: `4px`
- 字号: `12px`
- 字重: `500`

### 7.6 弹窗（Dialog）

```vue
<van-dialog
  v-model:show="show"
  title="提示"
  message="确定要删除吗？"
  show-cancel-button
/>
```

**样式规范**:
- 圆角: `16px`
- 内边距: `24px`
- 阴影: `shadow-xl`
- 最大宽度: `90%`

---

## 8. 布局规范

### 8.1 栅格系统

项目采用 **Flexbox** 布局，不使用传统栅格系统。

**布局原则**:
- 使用 `flex` 进行弹性布局
- 使用 `grid` 进行网格布局（如商品列表）
- 响应式断点: `768px`（移动端/桌面端）

### 8.2 页面布局结构

```
┌─────────────────────────────────┐
│  Header (固定顶部)               │
│  高度: 56px                      │
├─────────────────────────────────┤
│                                 │
│  Main Content (可滚动区域)       │
│  最小高度: calc(100vh - 116px)   │
│                                 │
├─────────────────────────────────┤
│  Footer (固定底部)               │
│  高度: 60px + safe-area         │
└─────────────────────────────────┘
```

### 8.3 容器宽度

| 设备类型 | 最大宽度 | 边距 |
|---------|---------|------|
| **移动端** | `100%` | `12px` |
| **桌面端** | `768px` | `auto`（居中） |

### 8.4 响应式断点

```scss
// 移动端（默认）
@media (max-width: 768px) {
  // 移动端样式
}

// 桌面端
@media (min-width: 769px) {
  // 桌面端样式
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
}
```

---

## 9. 交互规范

### 9.1 动画时长

| 动画类型 | 时长 | 缓动函数 | 使用场景 |
|---------|------|---------|---------|
| **Fast** | `150ms` | `ease` | 悬停、点击反馈 |
| **Base** | `200ms` | `ease` | 默认过渡 |
| **Slow** | `300ms` | `ease` | 页面切换、弹窗 |

### 9.2 动画类型

#### 淡入淡出（Fade）

```scss
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

#### 滑入滑出（Slide）

```scss
.slide-up-enter-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
```

#### 缩放（Scale）

```scss
.scale-enter-active {
  transition: transform 0.2s ease;
}

.scale-enter-from {
  transform: scale(0.95);
}
```

### 9.3 反馈规范

#### 点击反馈

```scss
.clickable {
  transition: transform 0.1s ease;
  
  &:active {
    transform: scale(0.98);
  }
}
```

#### 加载状态

```vue
<van-loading type="spinner" size="24px">加载中...</van-loading>
```

#### 空状态

```vue
<van-empty description="暂无数据" />
```

#### 错误状态

```vue
<van-empty description="加载失败，请重试" image="error" />
```

### 9.4 状态规范

| 状态 | 视觉表现 | 交互反馈 |
|------|---------|---------|
| **默认** | 正常样式 | 无 |
| **悬停** | 阴影加深、颜色变深 | 鼠标指针变化 |
| **激活** | 颜色加深、轻微缩放 | 点击反馈 |
| **禁用** | 透明度降低、灰色 | 禁止交互 |
| **加载** | 加载动画 | 禁止交互 |

---

## 10. 图标规范

### 10.1 图标库

项目使用 **Vant Icon** 图标库。

**使用方式**:
```vue
<van-icon name="home-o" />
<van-icon name="arrow-left" />
```

### 10.2 图标尺寸

| 尺寸名称 | 大小 | 使用场景 |
|---------|------|---------|
| **XS** | `16px` | 标签内图标 |
| **SM** | `18px` | 列表项图标 |
| **Base** | `20px` | 默认图标 |
| **LG** | `24px` | 导航栏图标 |
| **XL** | `32px` | 大图标 |

### 10.3 图标颜色

- **默认**: `#646566`
- **激活**: `#1989fa`（主色）
- **禁用**: `#c8c9cc`
- **错误**: `#ee0a24`

### 10.4 图标使用示例

```vue
<!-- 导航图标 -->
<van-icon name="home-o" size="24px" color="#1989fa" />

<!-- 列表图标 -->
<van-icon name="arrow" size="18px" color="#969799" />
```

---

## 11. 页面模板

### 11.1 首页模板

```vue
<template>
  <div class="home-page">
    <!-- 顶部Banner -->
    <section class="hero-section">
      <!-- Banner内容 -->
    </section>

    <!-- 快捷入口 -->
    <QuickNav :items="quickNavItems" />

    <!-- 热门促销 -->
    <section class="promotions-section">
      <h2 class="section-title">热门促销</h2>
      <HotPromotions />
    </section>
  </div>
</template>
```

**布局规范**:
- 页面边距: `12px`
- 区块间距: `24px`
- 卡片间距: `12px`

### 11.2 详情页模板

```vue
<template>
  <div class="detail-page">
    <!-- 顶部图片 -->
    <div class="banner-section">
      <!-- 轮播图 -->
    </div>

    <!-- 商品信息 -->
    <div class="info-section">
      <!-- 价格、标题、描述 -->
    </div>

    <!-- 详情内容 -->
    <div class="content-section">
      <!-- 详情图片 -->
    </div>

    <!-- 底部操作栏 -->
    <div class="action-bar">
      <!-- 购买按钮 -->
    </div>
  </div>
</template>
```

### 11.3 列表页模板

```vue
<template>
  <div class="list-page">
    <!-- 搜索/筛选栏 -->
    <div class="filter-bar">
      <!-- 搜索、筛选 -->
    </div>

    <!-- 列表内容 -->
    <div class="list-content">
      <!-- 列表项 -->
    </div>

    <!-- 加载更多 -->
    <div class="load-more">
      <!-- 加载状态 -->
    </div>
  </div>
</template>
```

### 11.4 表单页模板

```vue
<template>
  <div class="form-page">
    <!-- 表单内容 -->
    <van-cell-group inset>
      <van-field v-model="value" label="标签" />
    </van-cell-group>

    <!-- 提交按钮 -->
    <div class="submit-bar">
      <van-button type="primary" block>提交</van-button>
    </div>
  </div>
</template>
```

---

## 12. 响应式设计

### 12.1 断点系统

| 断点名称 | 宽度 | 设备类型 |
|---------|------|---------|
| **Mobile** | `≤ 768px` | 手机、小屏平板 |
| **Tablet** | `769px - 1024px` | 平板 |
| **Desktop** | `≥ 1025px` | 桌面端 |

### 12.2 响应式策略

- **移动优先**: 先设计移动端，再适配桌面端
- **弹性布局**: 使用 `flex` 和 `grid` 实现响应式
- **相对单位**: 使用 `rem`、`em`、`%` 而非固定 `px`

### 12.3 响应式示例

```scss
// 移动端（默认）
.card {
  width: 100%;
  padding: 16px;
}

// 桌面端
@media (min-width: 769px) {
  .card {
    max-width: 768px;
    margin: 0 auto;
  }
}
```

---

## 13. 无障碍设计

### 13.1 语义化HTML

```vue
<!-- ✅ 正确 -->
<button @click="handleClick">提交</button>

<!-- ❌ 错误 -->
<div @click="handleClick">提交</div>
```

### 13.2 ARIA标签

```vue
<button
  aria-label="关闭弹窗"
  @click="closeDialog"
>
  <van-icon name="cross" />
</button>
```

### 13.3 键盘导航

- 所有交互元素支持键盘导航
- 使用 `Tab` 键切换焦点
- 使用 `Enter` 或 `Space` 激活按钮

### 13.4 颜色对比度

- 文本与背景对比度 ≥ 4.5:1
- 大文本（18px+）对比度 ≥ 3:1

---

## 📚 附录

### A. 设计工具

- **Figma**: UI设计工具
- **Adobe XD**: 原型设计工具
- **Sketch**: Mac平台设计工具

### B. 参考资源

- [Vant UI 组件库](https://vant-ui.github.io/vant/)
- [Material Design](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### C. 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0.0 | 2025-01-12 | 初始版本，建立完整UI规范 |

---

## 📝 使用说明

1. **开发前**: 阅读本规范，了解设计原则和组件规范
2. **开发中**: 参考组件规范和页面模板进行开发
3. **代码审查**: 检查代码是否符合UI规范
4. **持续更新**: 根据项目发展更新规范文档

---

**维护者**: 前端团队  
**最后更新**: 2025-01-12

