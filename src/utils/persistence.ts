import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import type { Ref } from 'vue'

// 持久化配置接口
interface PersistenceConfig {
  key: string
  storage?: 'localStorage' | 'sessionStorage'
  debounce?: number
  version?: string
  migrate?: (oldState: any) => any
}

// 持久化管理器
export class PersistenceManager {
  private static instance: PersistenceManager | null = null
  private persistenceConfigs: Map<string, PersistenceConfig> = new Map()
  private debouncedUpdates: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager()
    }
    return PersistenceManager.instance
  }

  // 获取store实例（延迟获取）
  private getAuthStore() {
    return useAuthStore()
  }

  private getAppStore() {
    return useAppStore()
  }

  // 注册持久化配置
  registerConfig(config: PersistenceConfig): void {
    this.persistenceConfigs.set(config.key, config)
    this.loadPersistedState(config)
  }

  // 保存状态
  saveState(key: string, state: any): void {
    const config = this.persistenceConfigs.get(key)
    if (!config) return

    const storage = this.getStorage(config.storage || 'localStorage')
    const data = {
      state,
      timestamp: Date.now(),
      version: config.version || '1.0.0'
    }

    try {
      storage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save state for ${key}:`, error)
      this.handleStorageError(key, config)
    }
  }

  // 加载状态
  loadPersistedState(config: PersistenceConfig): any {
    const storage = this.getStorage(config.storage || 'localStorage')
    try {
      const saved = storage.getItem(config.key)
      if (!saved) return null

      const data = JSON.parse(saved)

      // 版本迁移
      if (config.migrate && data.version !== config.version) {
        const migratedState = config.migrate(data.state)
        this.saveState(config.key, migratedState)
        return migratedState
      }

      return data.state
    } catch (error) {
      console.error(`Failed to load state for ${config.key}:`, error)
      return null
    }
  }

  // 清除状态
  clearState(key: string): void {
    const config = this.persistenceConfigs.get(key)
    if (!config) return

    const storage = this.getStorage(config.storage || 'localStorage')
    storage.removeItem(key)
  }

  // 监听状态变化
  watchState<T>(key: string, ref: Ref<T>, callback?: (newValue: T, oldValue: T) => void): void {
    const config = this.persistenceConfigs.get(key)
    if (!config) return

    // 防抖更新
    const debouncedUpdate = (newValue: T) => {
      const debounceTime = config.debounce || 500

      if (this.debouncedUpdates.has(key)) {
        clearTimeout(this.debouncedUpdates.get(key)!)
      }

      const timeout = setTimeout(() => {
        this.saveState(key, newValue)
        this.debouncedUpdates.delete(key)
      }, debounceTime)

      this.debouncedUpdates.set(key, timeout)
    }

    watch(ref, (newValue, oldValue) => {
      if (newValue !== oldValue) {
        debouncedUpdate(newValue)
        callback?.(newValue, oldValue)
      }
    }, { deep: true })
  }

  // 手动同步状态
  syncState(key: string, state: any): void {
    this.saveState(key, state)
  }

  // 获取存储实例
  private getStorage(type: 'localStorage' | 'sessionStorage') {
    return type === 'localStorage' ? localStorage : sessionStorage
  }

  // 处理存储错误
  private handleStorageError(key: string, config: PersistenceConfig): void {
    const storage = this.getStorage(config.storage || 'localStorage')

    // 清除可能损坏的数据
    try {
      storage.removeItem(key)
    } catch (error) {
      console.error(`Failed to clear corrupted data for ${key}:`, error)
    }

    // 尝试使用备用存储
    if (config.storage === 'localStorage') {
      const backupConfig = { ...config, storage: 'sessionStorage' }
      this.persistenceConfigs.set(key, backupConfig)
    }
  }

  // 清理所有防抖定时器
  cleanup(): void {
    this.debouncedUpdates.forEach(timeout => clearTimeout(timeout))
    this.debouncedUpdates.clear()
  }
}

// Pinia持久化插件
export function createPersistencePlugin() {
  const persistenceManager = PersistenceManager.getInstance()

  return (context: any) => {
    const { store } = context
    const storeKey = store.$id

    // 注册持久化配置
    persistenceManager.registerConfig({
      key: storeKey,
      storage: 'localStorage',
      debounce: 500,
      version: '1.0.0'
    })

    // 恢复状态
    const initialState = persistenceManager.loadPersistedState({
      key: storeKey,
      storage: 'localStorage'
    })

    if (initialState) {
      store.$patch(initialState)
    }

    // 监听状态变化
    store.$subscribe(
      (mutation, state) => {
        persistenceManager.saveState(storeKey, state)
      },
      { detached: true }
    )

    // 添加持久化方法到store
    store.$persist = () => {
      persistenceManager.saveState(storeKey, store.$state)
    }

    store.$persistSync = () => {
      persistenceManager.syncState(storeKey, store.$state)
    }

    store.$clearPersisted = () => {
      persistenceManager.clearState(storeKey)
    }

    // 组件卸载时清理
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        persistenceManager.cleanup()
      })
    }
  }
}

// 组合式函数：使用持久化
export function usePersistence(key: string, config?: Partial<PersistenceConfig>) {
  const persistenceManager = PersistenceManager.getInstance()

  // 注册配置
  persistenceManager.registerConfig({
    key,
    ...config
  })

  // 创建响应式引用
  const state = ref(persistenceManager.loadPersistedState({
    key,
    ...config
  }) || {})

  // 监听状态变化
  watch(state, (newValue) => {
    persistenceManager.saveState(key, newValue)
  }, { deep: true })

  return {
    state,
    setState: (newValue: any) => {
      state.value = newValue
    },
    getState: () => state.value,
    clearState: () => {
      persistenceManager.clearState(key)
      state.value = {}
    }
  }
}

// 应用级状态持久化
export class AppStatePersistence {
  private persistenceManager = PersistenceManager.getInstance()

  // 获取store实例（延迟获取）
  private getAuthStore() {
    return useAuthStore()
  }

  private getAppStore() {
    return useAppStore()
  }

  // 初始化应用持久化
  initialize(): void {
    // 认证状态持久化
    this.setupAuthPersistence()

    // 应用状态持久化
    this.setupAppPersistence()

    // 监听应用生命周期
    this.setupLifecycleHooks()
  }

  // 设置认证状态持久化
  private setupAuthPersistence(): void {
    this.persistenceManager.registerConfig({
      key: 'auth',
      storage: 'localStorage',
      debounce: 1000,
      version: '1.0.0',
      migrate: (oldState: any) => {
        // 版本迁移逻辑
        if (oldState.token && oldState.token !== this.getAuthStore().token) {
          return {
            ...oldState,
            token: oldState.token,
            refreshToken: oldState.refreshToken || '',
            user: oldState.user || null
          }
        }
        return oldState
      }
    })

    // 监听认证状态变化
    this.persistenceManager.watchState('auth', this.getAuthStore().$state)

    // 加载保存的认证状态
    const savedAuthState = this.persistenceManager.loadPersistedState({
      key: 'auth',
      storage: 'localStorage'
    })

    if (savedAuthState && savedAuthState.token) {
      this.getAuthStore().$patch(savedAuthState)
    }
  }

  // 设置应用状态持久化
  private setupAppPersistence(): void {
    this.persistenceManager.registerConfig({
      key: 'app',
      storage: 'localStorage',
      debounce: 500,
      version: '1.0.0'
    })

    // 监听应用状态变化
    this.persistenceManager.watchState('app', this.getAppStore().$state)

    // 加载保存的应用状态
    const savedAppState = this.persistenceManager.loadPersistedState({
      key: 'app',
      storage: 'localStorage'
    })

    if (savedAppState) {
      this.getAppStore().$patch(savedAppState)
    }
  }

  // 设置生命周期钩子
  private setupLifecycleHooks(): void {
    if (typeof window === 'undefined') return

    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
      // 页面变为可见时，同步状态
      this.persistenceManager.syncState('auth', this.getAuthStore().$state)
      this.persistenceManager.syncState('app', this.getAppStore().$state)
      }
    })

    // 网络状态变化
    window.addEventListener('online', () => {
      this.persistenceManager.syncState('auth', this.getAuthStore().$state)
      this.persistenceManager.syncState('app', this.getAppStore().$state)
    })

    // 页面卸载前同步状态
    window.addEventListener('beforeunload', () => {
      this.persistenceManager.syncState('auth', this.getAuthStore().$state)
      this.persistenceManager.syncState('app', this.getAppStore().$state)
    })

    // 页面隐藏时同步状态
    window.addEventListener('pagehide', () => {
      this.persistenceManager.syncState('auth', this.getAuthStore().$state)
      this.persistenceManager.syncState('app', this.getAppStore().$state)
    })
  }

  // 清除所有持久化状态
  clearAll(): void {
    this.persistenceManager.clearState('auth')
    this.persistenceManager.clearState('app')
    this.getAuthStore().clearAuth()
    this.getAppStore().$reset()
  }

  // 手动同步状态
  sync(): void {
    this.persistenceManager.syncState('auth', this.getAuthStore().$state)
    this.persistenceManager.syncState('app', this.getAppStore().$state)
  }
}

// 创建全局持久化实例（延迟创建）
let _appPersistence: AppStatePersistence | null = null

export const appPersistence = {
  initialize() {
    if (!_appPersistence) {
      _appPersistence = new AppStatePersistence()
    }
    return _appPersistence
  },
  
  get instance() {
    if (!_appPersistence) {
      throw new Error('AppStatePersistence not initialized. Call initialize() first.')
    }
    return _appPersistence
  }
}

// 导出常用持久化配置
export const persistenceConfigs = {
  auth: {
    key: 'auth',
    storage: 'localStorage' as const,
    debounce: 1000,
    version: '1.0.0'
  },
  app: {
    key: 'app',
    storage: 'localStorage' as const,
    debounce: 500,
    version: '1.0.0'
  },
  preferences: {
    key: 'user_preferences',
    storage: 'localStorage' as const,
    debounce: 300,
    version: '1.0.0'
  },
  cache: {
    key: 'app_cache',
    storage: 'localStorage' as const,
    debounce: 1000,
    version: '1.0.0'
  }
}

// 调试工具
export const persistenceDebug = {
  // 查看所有持久化状态
  getAllStates(): Record<string, any> {
    const persistenceManager = PersistenceManager.getInstance()
    const states: Record<string, any> = {}

    persistenceManager.persistenceConfigs.forEach((config, key) => {
      const data = persistenceManager.loadPersistedState(config)
      if (data) {
        states[key] = {
          state: data,
          config,
          timestamp: Date.now()
        }
      }
    })

    return states
  },

  // 清除所有持久化数据
  clearAll(): void {
    const persistenceManager = PersistenceManager.getInstance()
    persistenceManager.persistenceConfigs.forEach((config, key) => {
      persistenceManager.clearState(key)
    })
  },

  // 监控持久化性能
  monitorPerformance(): void {
    console.time('Persistence Save')
    const persistenceManager = PersistenceManager.getInstance()
    persistenceManager.syncState('auth', useAuthStore().$state)
    persistenceManager.syncState('app', useAppStore().$state)
    console.timeEnd('Persistence Save')
  }
}