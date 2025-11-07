import { BaseApiService } from './api'
import type { Product, ProductSearchParams, ProductListResponse, Category } from '@/types'

export class ProductService extends BaseApiService {
  constructor() {
    super()
  }

  // 获取商品列表
  async getProducts(params?: ProductSearchParams): Promise<ProductListResponse> {
    try {
      // 后端返回格式: { data: Product[], pagination: { page, limit, total, totalPages } }
      // 需要转换为前端格式: { products: Product[], total, page, pageSize, totalPages }
      const result = await this.get<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/products', { params })
      
      return {
        products: result.data || [],
        total: result.pagination?.total || 0,
        page: result.pagination?.page || 1,
        pageSize: result.pagination?.limit || 10,
        totalPages: result.pagination?.totalPages || 0
      }
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取商品详情
  async getProductDetail(id: string): Promise<Product> {
    try {
      return await this.get<Product>(`/products/${id}`)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 搜索商品
  async searchProducts(params: ProductSearchParams): Promise<ProductListResponse> {
    try {
      // 后端返回格式: { data: Product[], pagination: { page, limit, total, totalPages } }
      // 需要转换为前端格式: { products: Product[], total, page, pageSize, totalPages }
      const result = await this.get<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/products/search', { params })
      
      return {
        products: result.data || [],
        total: result.pagination?.total || 0,
        page: result.pagination?.page || 1,
        pageSize: result.pagination?.limit || 10,
        totalPages: result.pagination?.totalPages || 0
      }
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取商品分类
  async getCategories(): Promise<Category[]> {
    try {
      return await this.get<Category[]>('/products/categories/list')
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取商品规格选项
  async getProductVariants(productId: string): Promise<any[]> {
    try {
      return await this.get<any[]>(`/products/${productId}/variants`)
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取推荐商品
  async getRecommendedProducts(limit: number = 10): Promise<Product[]> {
    try {
      return await this.get<Product[]>(`/products/recommended`, { params: { limit } })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取热门商品
  async getHotProducts(limit: number = 10): Promise<Product[]> {
    try {
      return await this.get<Product[]>(`/products/hot`, { params: { limit } })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取新品商品
  async getNewProducts(limit: number = 10): Promise<Product[]> {
    try {
      return await this.get<Product[]>(`/products/new`, { params: { limit } })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 检查商品库存
  async checkStock(productId: string, variantId?: string): Promise<{ available: boolean; stock: number }> {
    try {
      const params = variantId ? { variantId } : {}
      return await this.get<{ available: boolean; stock: number }>(`/products/${productId}/stock`, { params })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 添加商品到购物车
  async addToCart(productId: string, quantity: number, variantId?: string, notes?: string): Promise<void> {
    try {
      await this.post('/cart/add', {
        productId,
        quantity,
        variantId,
        notes
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 直接购买商品
  async buyNow(productId: string, quantity: number, variantId?: string, notes?: string): Promise<any> {
    try {
      return await this.post('/orders/create-direct', {
        productId,
        quantity,
        variantId,
        notes
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取商品评价
  async getProductReviews(productId: string, page = 1, limit = 10): Promise<any> {
    try {
      return await this.get(`/products/${productId}/reviews`, {
        params: { page, limit }
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 提交商品评价
  async submitReview(productId: string, rating: number, content: string, images?: File[]): Promise<void> {
    try {
      const formData = new FormData()
      formData.append('productId', productId)
      formData.append('rating', rating.toString())
      formData.append('content', content)

      if (images) {
        images.forEach((image, index) => {
          formData.append(`images[${index}]`, image)
        })
      }

      await this.post(`/products/${productId}/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 获取商品标签
  async getProductTags(): Promise<string[]> {
    try {
      return await this.get<string[]>('/products/tags')
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 根据标签筛选商品
  async getProductsByTag(tag: string, page = 1, limit = 20): Promise<ProductListResponse> {
    try {
      // 后端返回格式: { data: Product[], pagination: { page, limit, total, totalPages } }
      // 需要转换为前端格式: { products: Product[], total, page, pageSize, totalPages }
      const result = await this.get<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/products/tag/${tag}`, {
        params: { page, limit }
      })
      
      return {
        products: result.data || [],
        total: result.pagination?.total || 0,
        page: result.pagination?.page || 1,
        pageSize: result.pagination?.limit || 10,
        totalPages: result.pagination?.totalPages || 0
      }
    } catch (error) {
      throw new Error(this.handleApiError(error))
    }
  }

  // 错误处理代理方法
  private handleApiError(error: any): string {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          return data.message || '请求参数错误'
        case 401:
          return '登录已过期，请重新登录'
        case 404:
          return '商品不存在'
        case 422:
          return data.message || '数据验证失败'
        case 500:
          return '服务器内部错误'
        default:
          return data.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      return '网络连接失败，请检查网络设置'
    } else {
      return error.message || '请求失败'
    }
  }
}

// 导出单例实例
export const productService = new ProductService()