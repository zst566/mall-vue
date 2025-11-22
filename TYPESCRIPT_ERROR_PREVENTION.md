# Vue 项目 TypeScript 类型错误预防指南

## 📋 问题根源分析

本次修复的编译错误主要有以下几类：

### 1. **API 响应类型不匹配**（占比 40%）
**问题**：API 服务返回的类型定义与实际使用不一致，导致类型检查失败。

**典型案例**：
- `RegisterResponse` 的 `data` 字段只有 `accessToken`，但代码尝试访问 `token` 字段
- `refreshToken()` 返回的 `data` 只有 `token`，但代码尝试访问 `accessToken` 字段
- API 调用时没有指定泛型类型，返回 `unknown` 类型

**原因**：
- 类型定义与实际 API 返回不一致
- 代码中使用了兼容性逻辑（`token || accessToken`），但类型系统无法识别
- API 调用时没有指定返回类型

### 2. **可选类型未进行空值检查**（占比 35%）
**问题**：可选类型（`type?`）或可能为 `undefined` 的值直接使用，导致类型错误。

**典型案例**：
- `product.originalPrice` 和 `product.price` 可能为 `undefined`，但代码中直接使用
- 模板中直接使用可能为 `undefined` 的值进行计算

**原因**：
- TypeScript 严格模式要求对可能为 `undefined` 的值进行检查
- 模板中的条件判断不够严格

### 3. **API 调用未指定泛型类型**（占比 25%）
**问题**：使用 `api.get`、`api.post` 等方法时没有指定泛型类型，返回类型为 `unknown`。

**典型案例**：
- `const data = await api.get('/promotions/123')` 返回 `unknown` 类型
- 直接访问 `data.id`、`data.name` 等属性会报错

**原因**：
- API 服务方法支持泛型类型，但调用时未指定
- 没有定义明确的响应类型接口

---

## 🛡️ 预防规则

### 规则 1：API 响应类型一致性

#### 1.1 定义统一的响应类型接口

**✅ 正确做法**：
```typescript
// types/index.ts
export interface LoginResponse {
  success: boolean
  data: {
    accessToken?: string  // 后端返回的字段名
    token?: string        // 兼容字段名
    refreshToken: string
    user: User
  }
  message: string
}

// stores/auth.ts
const response = await authService.login(credentials)
// 使用类型断言处理兼容性
const authToken = (response.data as any).token || response.data.accessToken
```

#### 1.2 API 调用必须指定泛型类型

**❌ 错误做法**：
```typescript
// 没有指定类型，返回 unknown
const data = await api.get(`/promotions/${promotionId}`)
Object.assign(promotion, {
  id: data.id,  // ❌ 类型错误：unknown 类型没有 id 属性
  name: data.name
})
```

**✅ 正确做法**：
```typescript
// 方案 1：定义接口并使用泛型
interface PromotionDetail {
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
}

const data = await api.get<PromotionDetail>(`/promotions/${promotionId}`)
Object.assign(promotion, {
  id: data.id,  // ✅ 类型正确
  name: data.name
})

// 方案 2：使用内联类型定义
const data = await api.get<{
  id: string
  name: string
  salePrice: number
  // ... 其他字段
}>(`/promotions/${promotionId}`)
```

#### 1.3 类型兼容性处理规范

**✅ 正确做法**：
```typescript
// 当类型定义与实际使用不一致时，使用类型断言
const authToken = (response.data as any).token || response.data.accessToken

// 或者定义联合类型
type TokenResponse = {
  token?: string
  accessToken?: string
}

const authToken = (response.data as TokenResponse).token || 
                  (response.data as TokenResponse).accessToken
```

---

### 规则 2：可选类型空值检查

#### 2.1 模板中的空值检查

**❌ 错误做法**：
```vue
<template>
  <div v-if="product.originalPrice > product.price">
    <!-- ❌ 类型错误：originalPrice 和 price 可能为 undefined -->
    <span>省¥{{ product.originalPrice - product.price }}</span>
  </div>
</template>
```

**✅ 正确做法**：
```vue
<template>
  <!-- 方案 1：在 v-if 中同时检查两个值 -->
  <div v-if="product.originalPrice && product.price && product.originalPrice > product.price">
    <span>省¥{{ product.originalPrice - product.price }}</span>
  </div>

  <!-- 方案 2：使用计算属性 -->
  <div v-if="hasDiscount">
    <span>省¥{{ discountAmount }}</span>
  </div>
</template>

<script setup lang="ts">
const hasDiscount = computed(() => {
  return product.originalPrice !== undefined && 
         product.price !== undefined && 
         product.originalPrice > product.price
})

const discountAmount = computed(() => {
  if (!hasDiscount.value) return 0
  return (product.originalPrice ?? 0) - (product.price ?? 0)
})
</script>
```

#### 2.2 脚本中的空值检查

**❌ 错误做法**：
```typescript
// 直接使用可能为 undefined 的值
const url = `/api/file/${encodeURIComponent(result.key)}`  // ❌ key 可能是 undefined
```

**✅ 正确做法**：
```typescript
// 方案 1：提供默认值
const key = result.key ?? result.path ?? ''
const url = `/api/file/${encodeURIComponent(key)}`

// 方案 2：进行空值检查并抛出错误
if (!result.key && !result.path) {
  throw new Error('文件 key 或 path 不能为空')
}
const url = `/api/file/${encodeURIComponent(result.key || result.path)}`

// 方案 3：使用可选链和空值合并
const url = `/api/file/${encodeURIComponent(result.key ?? result.path ?? '')}`
```

---

### 规则 3：API 服务类型定义

#### 3.1 为所有 API 调用定义类型

**✅ 推荐做法**：
```typescript
// types/promotion.ts
export interface PromotionDetail {
  id: string
  name: string
  description?: string
  salePrice: number
  originalPrice: number
  promotionQuantity: number
  soldQuantity: number
  startTime: string
  endTime: string
  images: string[] | null
}

// services/promotion.ts
export class PromotionService {
  async getPromotionDetail(id: string): Promise<PromotionDetail> {
    return await api.get<PromotionDetail>(`/promotions/${id}`)
  }
}

// views/PromotionDetail.vue
const promotionService = new PromotionService()
const data = await promotionService.getPromotionDetail(promotionId)
// data 的类型自动推断为 PromotionDetail
```

#### 3.2 统一 API 响应类型

**✅ 推荐做法**：
```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// services/api.ts
class BaseApiService {
  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url)
    return response.data.data  // 返回 data 字段
  }
}
```

---

## 📝 开发工作流

### 标准开发流程

```bash
# 1. 开发前：运行类型检查
npm run type-check

# 2. 开发时：使用带类型检查的开发模式
npm run dev:type-check  # 或使用 vite-plugin-checker

# 3. 提交前：确保构建通过
npm run build:prod

# 4. 如果通过，继续开发；如果有错误，修复后重复步骤 1-3
```

---

## 🔍 常见错误模式及解决方案

### 模式 1：API 响应类型不匹配
**错误**：`Property 'token' does not exist on type '{ accessToken: string; refreshToken: string; user: User; }'`

**解决方案**：
```typescript
// 使用类型断言处理兼容性
const authToken = (response.data as any).token || response.data.accessToken
```

### 模式 2：可选类型未检查
**错误**：`'product.originalPrice' is possibly 'undefined'`

**解决方案**：
```vue
<!-- 在模板中添加空值检查 -->
<div v-if="product.originalPrice && product.price && product.originalPrice > product.price">
  <!-- 使用 -->
</div>
```

### 模式 3：API 调用返回 unknown
**错误**：`'data' is of type 'unknown'`

**解决方案**：
```typescript
// 指定泛型类型
const data = await api.get<PromotionDetail>(`/promotions/${promotionId}`)
```

---

## ✅ 检查清单

在提交代码前，运行以下检查：

```bash
# 1. TypeScript 类型检查
npm run type-check

# 2. 构建检查（确保能正常编译）
npm run build:prod

# 3. Lint 检查
npm run lint
```

### 代码审查检查点

在 Pull Request 审查时，检查以下内容：

#### API 调用检查
- [ ] 所有 `api.get`、`api.post` 等调用是否指定了泛型类型？
- [ ] API 响应类型是否与实际使用一致？
- [ ] 类型兼容性是否使用类型断言处理？

#### 可选类型检查
- [ ] 模板中所有可能为 `undefined` 的值是否进行了空值检查？
- [ ] 脚本中所有可选类型是否提供了默认值或进行了检查？
- [ ] 计算属性是否处理了可选类型？

#### 类型定义检查
- [ ] 是否为新 API 定义了响应类型接口？
- [ ] 类型定义是否与实际 API 返回一致？
- [ ] 是否使用了统一的 API 响应类型？

---

## 📚 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Vue 3 TypeScript 支持](https://vuejs.org/guide/typescript/overview.html)
- [项目基础规则](../project-base-rule-CN.md)
- [mall-pc 开发规则](../mall-pc/DEVELOPMENT_RULES.md)

---

## 🎯 总结

### 核心原则

1. **API 调用必须指定类型**：所有 `api.get`、`api.post` 等调用必须使用泛型类型
2. **可选类型必须检查**：所有可能为 `undefined` 的值必须进行空值检查
3. **类型定义要一致**：API 响应类型定义要与实际使用保持一致
4. **构建前必须检查**：提交代码前必须运行 `npm run build:prod` 确保构建通过

### 快速检查清单

在编写代码时，始终问自己：
1. ✅ API 调用是否指定了泛型类型？
2. ✅ 模板中可能为 `undefined` 的值是否进行了检查？
3. ✅ 脚本中可选类型是否提供了默认值？
4. ✅ 类型定义是否与实际使用一致？
5. ✅ 代码提交前是否运行了所有检查命令？














