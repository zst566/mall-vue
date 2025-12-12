/**
 * 底部栏滚动控制 Composable
 */
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { hexToRgba, invertColor } from '@/utils/promotionHelpers'

export interface UseBottomBarScrollReturn {
  isBottomBarVisible: Ref<boolean>
  bottomBarStyle: Ref<Record<string, string>>
  setBottomBarTheme: () => void
  handleScroll: (event?: Event) => void
}

/**
 * 处理底部栏滚动显示/隐藏和主题色设置
 */
export function useBottomBarScroll(): UseBottomBarScrollReturn {
  // 底部导航显示/隐藏状态
  const isBottomBarVisible = ref(true)
  const lastScrollTop = ref(0)
  const scrollTimer = ref<number | null>(null)
  
  // 底部栏动态样式
  const bottomBarStyle = ref<Record<string, string>>({})
  
  // 设置底部栏主题色渐变背景
  const setBottomBarTheme = () => {
    const root = document.documentElement
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim() || '#1989fa'
    
    // 使用主题色15%，整体不透明度95%
    // 计算最终颜色：主题色15%不透明度 × 整体95%不透明度 = 0.15 * 0.95 = 0.1425
    const finalAlpha = 0.15 * 0.95
    const themeColorWithOpacity = hexToRgba(primaryColor, finalAlpha)
    
    // 计算主题色反色，用于图标和文字
    const invertedColor = invertColor(primaryColor)
    
    const borderColor = hexToRgba(primaryColor, 0.25)      // 边框：主题色 25% 不透明度
    const shadowColor1 = hexToRgba(primaryColor, 0.15)    // 阴影1：主题色 15% 不透明度
    const shadowColor2 = hexToRgba(primaryColor, 0.1)     // 阴影2：主题色 10% 不透明度
    
    bottomBarStyle.value = {
      background: themeColorWithOpacity,  // 使用主题色15% × 整体95%不透明度
      '--inverted-theme-color': invertedColor,  // CSS 变量：反色
      borderTopColor: borderColor,
      boxShadow: `0 -4px 24px 0 ${shadowColor1}, 0 -2px 8px 0 ${shadowColor2}`
    }
  }

  // 处理滚动事件
  const handleScroll = (event?: Event) => {
    // 获取滚动位置（优先使用.app-main容器，如果没有则使用window）
    const appMain = document.querySelector('.app-main') as HTMLElement
    const currentScrollTop = appMain 
      ? appMain.scrollTop
      : (window.pageYOffset || document.documentElement.scrollTop)
    
    // 向下滚动时隐藏底部导航（需要滚动超过50px才隐藏）
    if (currentScrollTop > lastScrollTop.value && currentScrollTop > 50) {
      isBottomBarVisible.value = false
    } else if (currentScrollTop < lastScrollTop.value) {
      // 向上滚动时立即显示底部导航
      isBottomBarVisible.value = true
    }
    
    lastScrollTop.value = currentScrollTop
    
    // 清除之前的定时器
    if (scrollTimer.value !== null) {
      clearTimeout(scrollTimer.value)
    }
    
    // 停止滚动1秒后显示底部导航
    scrollTimer.value = window.setTimeout(() => {
      isBottomBarVisible.value = true
      scrollTimer.value = null
    }, 1000)
  }

  // 初始化滚动监听
  const initScrollListener = () => {
    // 等待DOM渲染完成后添加滚动监听
    setTimeout(() => {
      // 优先监听.app-main容器（这是实际的滚动容器）
      const appMain = document.querySelector('.app-main') as HTMLElement
      if (appMain) {
        appMain.addEventListener('scroll', handleScroll, { passive: true })
      } else {
        // 如果没有.app-main，则监听window
        window.addEventListener('scroll', handleScroll, { passive: true })
      }
    }, 100)
  }

  // 清理滚动监听
  const cleanupScrollListener = () => {
    const appMain = document.querySelector('.app-main') as HTMLElement
    if (appMain) {
      appMain.removeEventListener('scroll', handleScroll)
    } else {
      window.removeEventListener('scroll', handleScroll)
    }
    
    // 清除定时器
    if (scrollTimer.value !== null) {
      clearTimeout(scrollTimer.value)
    }
  }

  // 生命周期钩子
  onMounted(() => {
    setBottomBarTheme()
    initScrollListener()
  })

  onUnmounted(() => {
    cleanupScrollListener()
  })

  return {
    isBottomBarVisible,
    bottomBarStyle,
    setBottomBarTheme,
    handleScroll,
  }
}







