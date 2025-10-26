/**
 * 全局类型声明
 */

declare global {
  interface Window {
    wx?: {
      miniProgram?: {
        postMessage?: (data: any) => void
        getEnv?: (callback: (res: { miniprogram: boolean }) => void) => void
      }
    }
  }
}

export {}