import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import router from '@/router'
import './styles/index.scss'
import { createPersistencePlugin, appPersistence } from './utils/persistence'

// 创建Vue应用实例
const app = createApp(App)

// 创建Pinia状态管理
const pinia = createPinia()

// 应用持久化插件
pinia.use(createPersistencePlugin())

// 注册路由
app.use(router)
app.use(pinia)

// 初始化应用持久化（必须在pinia注册之后）
appPersistence.initialize()

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

// 挂载应用
app.mount('#app')

// 隐藏加载动画
setTimeout(() => {
  const loadingElement = document.getElementById('app-loading')
  if (loadingElement) {
    loadingElement.style.display = 'none'
  }
}, 1000)