import { BaseApiService } from './api'

export class ConfigService extends BaseApiService {
  constructor() {
    super()
  }

  /**
   * 获取主题颜色配置
   * @returns 主题颜色值（十六进制格式，如 #1989fa），如果后端没有配置则返回 null
   */
  async getThemeColor(): Promise<string | null> {
    try {
      const data = await this.get<{
        key: string
        value: string
      }>('/configs/vue-theme-primary-color')

      if (data?.value) {
        return data.value
      }
      return null
    } catch (error) {
      console.error('获取主题颜色配置失败:', error)
      // 不抛出异常，返回 null，让调用方处理
      return null
    }
  }

  /**
   * 设置主题颜色配置（可选，用于未来扩展）
   * @param color 主题颜色值（十六进制格式）
   */
  async setThemeColor(color: string): Promise<void> {
    try {
      await this.post('/configs', {
        key: 'vue-theme-primary-color',
        value: color,
        category: 'theme',
        description: 'Vue端主题颜色配置'
      })
    } catch (error) {
      console.error('设置主题颜色配置失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export const configService = new ConfigService()

