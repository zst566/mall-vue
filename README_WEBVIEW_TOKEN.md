# 微信小程序与 Vue WebView Token 传递方案

## 概述

本文档详细说明了如何在微信小程序与 Vue WebView 之间安全地传递 `mall_token`，实现无缝的登录状态同步。

## 项目架构

### 小程序端 (mall-miniprogram)
- **WebView 页面**: `pages/webview/webview.js`
- **通讯桥接**: `utils/bridge.js`
- **认证管理**: `utils/auth.js`

### Vue 端 (mall-vue)
- **WebView Bridge**: `src/utils/webview-bridge.ts`
- **Vue 插件**: `src/plugins/webview-bridge.ts`
- **Composable**: `src/composables/useWebViewBridge.ts`
- **示例页面**: `src/views/WebViewTokenExample.vue`

## Token 传递机制

### 1. 双 Token 架构

```javascript
// 小程序 Storage
wx.setStorageSync('mall_token', access_token)      // 访问令牌 (1-2小时)
wx.setStorageSync('mall_refreshtoken', refresh_token) // 刷新令牌 (7-30天)
```

**为什么需要两个 Token？**
- **安全考虑**: 访问令牌频繁使用，设置较短有效期
- **用户体验**: 刷新令牌长效，避免频繁登录
- **最佳实践**: 符合 OAuth 2.1 标准

### 2. 通讯流程

```
Vue 应用 → 小程序 → 后端API → 返回Token → Vue应用保存
```

## 实现方案

### 方案一：URL 参数传递（推荐）

#### 小程序端实现

```javascript
// pages/webview/webview.js
async buildWebViewURL() {
  const token = await authManager.getAccessToken();
  const userInfo = authManager.getUserInfo();

  // 构建 URL，传递 mall_token
  const url = `https://your-domain.com/?mall_token=${encodeURIComponent(token)}&user_id=${userInfo.id}`;
  return url;
}
```

#### Vue 端接收

```javascript
// router/index.js
router.beforeEach(async (to, from, next) => {
  const mallToken = to.query.mall_token;

  if (mallToken && !localStorage.getItem('token')) {
    // 保存 token
    localStorage.setItem('token', mallToken);

    // 更新 Pinia store
    const authStore = useAuthStore();
    authStore.token = mallToken;

    // 清理 URL 参数
    const query = { ...to.query };
    delete query.mall_token;
    delete query.user_id;

    next({
      path: to.path,
      query,
      replace: true
    });
  } else {
    next();
  }
});
```

### 方案二：postMessage 通讯

#### Vue 端请求 Token

```typescript
// src/composables/useWebViewBridge.ts
const getMallToken = async () => {
  const result = await bridge.sendMessage('getMallToken');

  if (result && result.token) {
    // 保存认证信息
    authStore.token = result.token;
    authStore.user = result.user;

    return result;
  }

  throw new Error('获取 Token 失败');
}
```

#### 小程序端响应

```javascript
// utils/bridge.js
async handleGetMallTokenMessage(data) {
  try {
    const token = await authManager.getAccessToken();
    const userInfo = authManager.getUserInfo();

    // 发送 token 给 Vue
    await this.sendMessage('getMallTokenResult', {
      success: true,
      data: {
        token: token,
        user: userInfo
      }
    });
  } catch (error) {
    await this.sendMessage('getMallTokenResult', {
      success: false,
      errMsg: error.message
    });
  }
}
```

## 使用示例

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <button @click="getToken" :disabled="loading">
      {{ loading ? '获取中...' : '获取 Token' }}
    </button>

    <div v-if="token">
      <p>当前 Token: {{ maskToken(token) }}</p>
      <p>用户: {{ user?.nickname }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWebViewBridge } from '@/composables/useWebViewBridge'
import { useAuthStore } from '@/stores/auth'

const { getMallToken, login, isReady } = useWebViewBridge()
const authStore = useAuthStore()

const loading = ref(false)

const getToken = async () => {
  loading.value = true

  try {
    const result = await getMallToken()
    console.log('Token 获取成功:', result)
  } catch (error) {
    console.error('Token 获取失败:', error)

    // 如果没有 token，尝试登录
    await login()
  } finally {
    loading.value = false
  }
}

const maskToken = (token: string) => {
  return token.substring(0, 10) + '...' + token.substring(token.length - 10)
}
</script>
```

### API 请求拦截器

```typescript
// src/services/api.ts
import { useAuthStore } from '@/stores/auth'
import { useWebViewBridge } from '@/composables/useWebViewBridge'

apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()

  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }

  return config
})

apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期，尝试从小程序刷新
      try {
        const { getMallToken } = useWebViewBridge()
        const result = await getMallToken()

        // 更新 token 并重试请求
        const authStore = useAuthStore()
        authStore.token = result.token

        return apiClient.request(error.config)
      } catch (refreshError) {
        // 刷新失败，跳转登录
        router.push('/login')
      }
    }

    return Promise.reject(error)
  }
)
```

## 安全考虑

### 1. Token 存储安全

```typescript
// 推荐存储策略
const tokenStorage = {
  // 小程序端：使用微信安全存储
  setToken: (token: string) => wx.setStorageSync('mall_token', token),

  // Vue 端：使用 localStorage（仅在 HTTPS 环境）
  setToken: (token: string) => {
    if (location.protocol === 'https:') {
      localStorage.setItem('token', token)
    }
  }
}
```

### 2. URL 参数安全

```javascript
// 及时清理 URL 参数
const cleanupTokenFromURL = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete('mall_token')
  url.searchParams.delete('user_id')

  // 使用 replaceState 避免产生历史记录
  window.history.replaceState({}, '', url.toString())
}
```

### 3. 消息验证

```typescript
// 小程序端验证消息来源
const validateMessageOrigin = (message: any) => {
  // 验证消息格式
  if (!message.type || !message.data) {
    return false
  }

  // 验证时间戳（防止重放攻击）
  if (message.timestamp && Date.now() - message.timestamp > 30000) {
    return false
  }

  return true
}
```

## 调试技巧

### 1. 开启调试模式

```typescript
// 开发环境开启调试
const { isReady, isInMiniProgram } = useWebViewBridge({
  debug: process.env.NODE_ENV === 'development'
})
```

### 2. 消息日志

```typescript
// 小程序端
console.log('========== 收到来自 Vue 的请求 ==========')
console.log('📨 消息类型:', message.type)
console.log('📦 消息数据:', JSON.stringify(message.data, null, 2))
console.log('==========================================')

// Vue 端
console.log('📤 发送消息到小程序:', message)
```

### 3. 网络请求调试

```javascript
// 在小程序开发者工具中查看网络请求
// Network 标签页可以看到所有 API 调用
```

## 常见问题

### Q: 为什么 Token 有时候获取失败？

**A**: 可能的原因：
1. 小程序未登录或登录态过期
2. WebView Bridge 未正确初始化
3. 网络连接问题
4. 域名未配置在小程序业务域名白名单中

**解决方案**：
```typescript
// 检查登录状态并自动重试
const ensureToken = async () => {
  try {
    return await getMallToken()
  } catch (error) {
    console.log('Token 获取失败，尝试登录...')
    await login()
    return await getMallToken()
  }
}
```

### Q: postMessage 通讯不工作？

**A**: 检查以下几点：
1. 确保在微信小程序环境中运行
2. 检查 `bindmessage` 事件是否正确绑定
3. 确认消息格式符合规范
4. 查看小程序开发者工具控制台错误信息

### Q: Token 传递后 API 调用仍然失败？

**A**: 检查：
1. Token 是否正确保存到 localStorage
2. API 请求头是否包含正确的 Authorization
3. Token 是否已经过期
4. 后端 API 是否正确验证 Token

## 最佳实践

1. **错误处理**: 始终包含完善的错误处理和重试机制
2. **用户体验**: 提供加载状态和友好的错误提示
3. **安全第一**: 使用 HTTPS，及时清理敏感信息
4. **性能优化**: 避免频繁的 Token 请求，合理使用缓存
5. **调试友好**: 开发环境提供详细的调试日志

## 完整示例

参考 `src/views/WebViewTokenExample.vue` 获取完整的实现示例，包含：
- Token 获取和显示
- 登录状态管理
- 消息通讯测试
- 调试信息展示
- 错误处理演示