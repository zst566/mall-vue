/**
 * 日志工具函数
 * 统一管理调试日志输出，根据环境变量控制是否输出
 */

const isDevelopment = import.meta.env.DEV
const isDebugMode = import.meta.env.VITE_DEBUG === 'true' || isDevelopment

/**
 * 调试日志（仅在开发环境或调试模式下输出）
 */
export const debugLog = (...args: any[]) => {
  if (isDebugMode) {
    console.log(...args)
  }
}

/**
 * 警告日志（仅在开发环境或调试模式下输出）
 */
export const debugWarn = (...args: any[]) => {
  if (isDebugMode) {
    console.warn(...args)
  }
}

/**
 * 错误日志（始终输出）
 */
export const errorLog = (...args: any[]) => {
  console.error(...args)
}

/**
 * 信息日志（仅在开发环境或调试模式下输出）
 */
export const infoLog = (...args: any[]) => {
  if (isDebugMode) {
    console.info(...args)
  }
}

/**
 * 分组日志（仅在开发环境或调试模式下输出）
 */
export const debugGroup = (label: string, callback?: () => void) => {
  if (isDebugMode) {
    console.group(label)
    if (callback) {
      callback()
      console.groupEnd()
    }
  }
}

/**
 * 分组结束（仅在开发环境或调试模式下输出）
 */
export const debugGroupEnd = () => {
  if (isDebugMode) {
    console.groupEnd()
  }
}















