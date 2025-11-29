import { ref, computed, onMounted } from 'vue'
import type { AppVersion } from '@/types'
import { configService } from '@/services/configService'

// 主题类型
export type Theme = 'customer' | 'merchant'

// 主题配置
export interface ThemeConfig {
  version: AppVersion
  theme: Theme
  darkMode: boolean
  primaryColor: string
  fontSize: 'small' | 'medium' | 'large'
  /**
   * 主题背景透明度，0-1 之间的小数
   */
  themeBgOpacity?: number
}

// 默认主题配置
const defaultThemeConfig: ThemeConfig = {
  version: 'customer',
  theme: 'customer',
  darkMode: false,
  primaryColor: '#1989fa',
  fontSize: 'medium',
  // 默认使用更“通透”的透明度，让效果更明显
  themeBgOpacity: 0.25
}

// 主题键名
const THEME_STORAGE_KEY = 'mall-vue-theme'
const VERSION_STORAGE_KEY = 'mall-vue-version'

// 主题管理工具类
export class ThemeManager {
  private config = ref<ThemeConfig>(defaultThemeConfig)

  constructor() {
    this.loadTheme()
    this.setupSystemThemeListener()
  }

  // 获取当前配置
  getConfig() {
    return this.config.value
  }

  // 设置主题
  setTheme(theme: Theme) {
    this.config.value.theme = theme
    this.applyTheme(theme)
    this.saveTheme()
  }

  // 设置版本
  setVersion(version: AppVersion) {
    this.config.value.version = version
    this.saveVersion()
    this.updateThemeClass()
  }

  // 设置暗色模式
  setDarkMode(enabled: boolean) {
    this.config.value.darkMode = enabled
    this.applyDarkMode(enabled)
    this.saveTheme()
  }

  // 设置主色调
  setPrimaryColor(color: string) {
    this.config.value.primaryColor = color
    this.applyPrimaryColor(color)
    this.saveTheme()
  }

  // 设置字体大小
  setFontSize(size: 'small' | 'medium' | 'large') {
    this.config.value.fontSize = size
    this.applyFontSize(size)
    this.saveTheme()
  }

  // 应用主题
  private applyTheme(theme: Theme) {
    const root = document.documentElement

    if (theme === 'customer') {
      root.classList.remove('theme-merchant-body')
      root.classList.add('theme-customer-body')
    } else {
      root.classList.remove('theme-customer-body')
      root.classList.add('theme-merchant-body')
    }
  }

  // 应用暗色模式
  private applyDarkMode(enabled: boolean) {
    const root = document.documentElement
    if (enabled) {
      root.classList.add('dark-theme')
    } else {
      root.classList.remove('dark-theme')
    }
  }

  // 应用主色调
  private applyPrimaryColor(color: string) {
    const root = document.documentElement
    const lightColor = this.lightenColor(color, 20)
    const darkColor = this.darkenColor(color, 20)
    
    root.style.setProperty('--primary-color', color)
    root.style.setProperty('--primary-light', lightColor)
    root.style.setProperty('--primary-dark', darkColor)
    root.style.setProperty('--van-primary-color', color)
    
    // 生成基于主题颜色的背景渐变，支持透明度配置
    const rawOpacity = this.config.value.themeBgOpacity ?? defaultThemeConfig.themeBgOpacity ?? 0.5
    // 做一层夹紧，避免配置成 0 或 1 导致“看不到”或“完全不透明”
    const opacity = Math.min(0.6, Math.max(0.1, rawOpacity))
    // 将归一化后的透明度写回配置和 CSS 变量，便于样式层复用
    this.config.value.themeBgOpacity = opacity
    root.style.setProperty('--theme-bg-opacity', String(opacity))

    const bgStart = this.hexToRgba(color, opacity)
    // 结束色稍微再淡一点，增强渐变层次
    const bgEnd = this.hexToRgba(lightColor, opacity * 0.7)
    const bgGradient = `linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%)`
    root.style.setProperty('--theme-bg-gradient', bgGradient)
    
    // 生成主题颜色的半透明背景色（用于标签、徽章等）
    const rgbaColor = this.hexToRgba(color, 0.1)
    root.style.setProperty('--primary-color-alpha-10', rgbaColor)
  }
  
  // 将十六进制颜色转换为 rgba 格式
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // 应用字体大小
  private applyFontSize(size: 'small' | 'medium' | 'large') {
    const root = document.documentElement
    const fontSizeMap = {
      small: '12px',
      medium: '14px',
      large: '16px'
    }
    root.style.setProperty('--font-size-base', fontSizeMap[size])
  }

  // 更新主题类
  private updateThemeClass() {
    const version = this.config.value.version
    this.setTheme(version === 'customer' ? 'customer' : 'merchant')
  }

  // 从服务器加载主题颜色
  async loadThemeFromServer(): Promise<void> {
    try {
      console.log('🔄 从服务器加载主题颜色配置...')
      const serverColor = await configService.getThemeColor()
      const serverOpacity = await configService.getThemeOpacity()
      
      if (serverColor) {
        console.log('✅ 从服务器获取到主题颜色:', serverColor)
        // 使用服务器配置的颜色
        this.config.value.primaryColor = serverColor
        // 使用服务器配置的背景透明度（如果有）
        if (typeof serverOpacity === 'number' && serverOpacity >= 0 && serverOpacity <= 1) {
          this.config.value.themeBgOpacity = serverOpacity
        }
        this.applyPrimaryColor(serverColor)
        // 更新 localStorage 以保持同步
        this.saveTheme()
      } else {
        console.log('ℹ️ 服务器未配置主题颜色，使用本地配置或默认值')
        // 服务器没有配置，使用本地配置或默认值
        const saved = localStorage.getItem(THEME_STORAGE_KEY)
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ThemeConfig
            if (parsed.primaryColor) {
              this.config.value.primaryColor = parsed.primaryColor
              if (typeof parsed.themeBgOpacity === 'number') {
                this.config.value.themeBgOpacity = parsed.themeBgOpacity
              }
              this.applyPrimaryColor(parsed.primaryColor)
            } else {
              // 使用默认颜色
              this.applyPrimaryColor(defaultThemeConfig.primaryColor)
            }
          } catch (error) {
            console.error('解析本地主题配置失败:', error)
            this.applyPrimaryColor(defaultThemeConfig.primaryColor)
          }
        } else {
          // 使用默认颜色
          this.applyPrimaryColor(defaultThemeConfig.primaryColor)
        }
      }
    } catch (error) {
      console.error('❌ 从服务器加载主题颜色失败:', error)
      // 加载失败，使用本地配置或默认值，不阻塞应用启动
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ThemeConfig
          if (parsed.primaryColor) {
            this.config.value.primaryColor = parsed.primaryColor
            if (typeof parsed.themeBgOpacity === 'number') {
              this.config.value.themeBgOpacity = parsed.themeBgOpacity
            }
            this.applyPrimaryColor(parsed.primaryColor)
          } else {
            this.applyPrimaryColor(defaultThemeConfig.primaryColor)
          }
        } catch (e) {
          this.applyPrimaryColor(defaultThemeConfig.primaryColor)
        }
      } else {
        this.applyPrimaryColor(defaultThemeConfig.primaryColor)
      }
    }
  }

  // 加载主题
  private loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      const savedVersion = localStorage.getItem(VERSION_STORAGE_KEY)

      if (saved) {
        const parsed = JSON.parse(saved) as ThemeConfig
        this.config.value = { ...defaultThemeConfig, ...parsed }
      }

      if (savedVersion) {
        this.config.value.version = savedVersion as AppVersion
      }

      // 应用加载的设置（主题颜色会在 loadThemeFromServer 中处理）
      this.applyTheme(this.config.value.theme)
      this.applyDarkMode(this.config.value.darkMode)
      // 先使用本地配置的颜色，如果服务器有配置会在 loadThemeFromServer 中覆盖
      this.applyPrimaryColor(this.config.value.primaryColor)
      this.applyFontSize(this.config.value.fontSize)
      this.updateThemeClass()
    } catch (error) {
      console.error('加载主题配置失败:', error)
    }
  }

  // 保存主题
  private saveTheme() {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(this.config.value))
    } catch (error) {
      console.error('保存主题配置失败:', error)
    }
  }

  // 保存版本
  private saveVersion() {
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, this.config.value.version)
    } catch (error) {
      console.error('保存版本配置失败:', error)
    }
  }

  // 设置系统主题监听
  private setupSystemThemeListener() {
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        if (!this.config.value.darkMode) {
          this.applyDarkMode(e.matches)
        }
      }

      darkModeMediaQuery.addEventListener('change', handleSystemThemeChange)
    }
  }

  // 颜色处理工具
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  private darkenColor(color: string, percent: number): string {
    return this.lightenColor(color, -percent)
  }

  // 切换主题
  toggleTheme() {
    const newTheme = this.config.value.theme === 'customer' ? 'merchant' : 'customer'
    this.setTheme(newTheme)
  }

  // 切换暗色模式
  toggleDarkMode() {
    this.setDarkMode(!this.config.value.darkMode)
  }

  // 获取当前主题类
  getThemeClass(): string {
    const classes = []
    if (this.config.value.theme === 'customer') {
      classes.push('theme-customer-body')
    } else {
      classes.push('theme-merchant-body')
    }

    if (this.config.value.darkMode) {
      classes.push('dark-theme')
    }

    return classes.join(' ')
  }

  // 检查是否需要降级处理
  checkFallbackSupport(): boolean {
    return !!(document.documentElement && localStorage)
  }

  // 获取CSS变量值
  getCSSVariable(name: string): string {
    const root = document.documentElement
    return getComputedStyle(root).getPropertyValue(name).trim()
  }

  // 设置CSS变量
  setCSSVariable(name: string, value: string): void {
    const root = document.documentElement
    root.style.setProperty(name, value)
  }
}

// 创建单例实例
const themeManager = new ThemeManager()

// Vue 3 Composition API 使用的组合式函数
export function useTheme() {
  const config = computed(() => themeManager.getConfig())
  const themeClass = computed(() => themeManager.getThemeClass())

  const setTheme = (theme: Theme) => themeManager.setTheme(theme)
  const setVersion = (version: AppVersion) => themeManager.setVersion(version)
  const setDarkMode = (enabled: boolean) => themeManager.setDarkMode(enabled)
  const setPrimaryColor = (color: string) => themeManager.setPrimaryColor(color)
  const setFontSize = (size: 'small' | 'medium' | 'large') => themeManager.setFontSize(size)
  const toggleTheme = () => themeManager.toggleTheme()
  const toggleDarkMode = () => themeManager.toggleDarkMode()
  const getCSSVariable = (name: string) => themeManager.getCSSVariable(name)
  const setCSSVariable = (name: string, value: string) => themeManager.setCSSVariable(name, value)

  return {
    config,
    themeClass,
    setTheme,
    setVersion,
    setDarkMode,
    setPrimaryColor,
    setFontSize,
    toggleTheme,
    toggleDarkMode,
    getCSSVariable,
    setCSSVariable
  }
}

// 获取主题管理器实例
export function getThemeManager(): ThemeManager {
  return themeManager
}

// 主题预设
export const themePresets = {
  customer: {
    primary: '#1989fa',
    background: '#f7f8fa',
    text: '#323233',
    border: '#ebedf0'
  },
  merchant: {
    primary: '#1989fa',
    background: '#edf2f7',
    text: '#323233',
    border: '#e2e8f0'
  },
  dark: {
    primary: '#1989fa',
    background: '#1a1a1a',
    text: '#f7f8fa',
    border: '#333333'
  }
}

// 验证主题配置
export function validateThemeConfig(config: any): config is ThemeConfig {
  return (
    config &&
    typeof config === 'object' &&
    ['customer', 'merchant'].includes(config.version) &&
    ['customer', 'merchant'].includes(config.theme) &&
    typeof config.darkMode === 'boolean' &&
    typeof config.primaryColor === 'string' &&
    ['small', 'medium', 'large'].includes(config.fontSize)
  )
}