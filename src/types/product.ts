// 商品相关类型定义

import { Product, ProductQueryParams, PaginationParams } from './index'

// 商品规��项
export interface ProductSpecificationItem {
  key: string
  value: string
  price: number
  stock: number
  sku: string
}

// 商品规格
export interface ProductSpecification {
  name: string
  items: ProductSpecificationItem[]
}

// 商品属性
export interface ProductAttribute {
  id: string
  name: string
  value: string
  displayValue?: string
}

// 商品分类
export interface ProductCategory {
  id: string
  name: string
  slug: string
  parentId?: string
  children?: ProductCategory[]
  icon?: string
  description?: string
  sort: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 商品标签
export interface ProductTag {
  id: string
  name: string
  color: string
  description?: string
  count: number
  createdAt: string
  updatedAt: string
}

// 商品促销
export interface ProductPromotion {
  id: string
  name: string
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'bundle'
  value: number
  startDate: string
  endDate: string
  applicableProducts: string[]
  applicableCategories?: string[]
  conditions?: {
    minAmount?: number
    minQuantity?: number
  }
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 商品价格历史
export interface ProductPriceHistory {
  id: string
  productId: string
  price: number
  originalPrice: number
  changedAt: string
  reason: string
  changedBy: string
}

// 商品价格历史响应
export interface ProductPriceHistoryResponse extends ApiResponse<Array<ProductPriceHistory>> {}

// 商品库存记录
export interface ProductStockRecord {
  id: string
  productId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  remaining: number
  reason: string
  referenceId?: string
  operator: string
  createdAt: string
}

// 商品库存记录响应
export interface ProductStockRecordResponse extends ApiResponse<Array<ProductStockRecord>> {}

// 商品评价
export interface ProductReview {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  productId: string
  rating: number
  title: string
  content: string
  images?: string[]
  anonymous: boolean
  verified: boolean
  helpful: number
  totalHelpful: number
  createdAt: string
  updatedAt: string
  order?: {
    id: string
    orderNo: string
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
  }
}

// 商品评价查询参数
export interface ProductReviewQueryParams extends PaginationParams {
  rating?: number
  verified?: boolean
  anonymous?: boolean
  dateRange?: [string, string]
  sortBy?: 'rating' | 'helpful' | 'createdAt' | 'orderDate'
  sortOrder?: 'asc' | 'desc'
}

// 商品评价响应
export interface ProductReviewResponse extends ApiResponse<Array<ProductReview>> {}

// 商品评价统计
export interface ProductReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  averageHelpful: number
  recentReviews: Array<ProductReview>
}

// 商品评价统计响应
export interface ProductReviewStatsResponse extends ApiResponse<ProductReviewStats>> {}

// 商品推荐
export interface ProductRecommendation {
  id: string
  type: 'bought_together' | 'viewed_together' | 'similar' | 'featured' | 'trending'
  products: Array<{
    product: Product
    score: number
    reason: string
  }>
  createdAt: string
  updatedAt: string
}

// 商品推荐响应
export interface ProductRecommendationResponse extends ApiResponse<Array<ProductRecommendation>> {}

// 商品搜索建议
export interface ProductSearchSuggestion {
  keyword: string
  products: Array<{
    id: string
    name: string
    image: string
    price: number
    matchScore: number
  }>
  categories: Array<{
    id: string
    name: string
    productCount: number
  }>
  popularSearches: Array<{
    keyword: string
    count: number
  }>
}

// 商品搜索建议响应
export interface ProductSearchSuggestionResponse extends ApiResponse<ProductSearchSuggestion>> {}

// 商品批量操作
export interface ProductBatchOperation {
  productIds: string[]
  operation: 'activate' | 'deactivate' | 'delete' | 'update_price' | 'update_stock' | 'update_category' | 'add_promotion' | 'remove_promotion'
  data?: {
    price?: number
    stock?: number
    categoryId?: string
    promotionId?: string
  }
  reason?: string
}

// 商品批量操作响应
export interface ProductBatchOperationResponse extends ApiResponse<{
  successCount: number
  failureCount: number
  results: Array<{
    productId: string
    success: boolean
    message: string
  }>
}> {}

// 商品导入导出
export interface ProductImportRequest {
  file: File
  updateStrategy: 'new' | 'update' | 'merge' | 'replace'
  mapping: Record<string, keyof Product>
  images?: File[]
}

export interface ProductImportResponse extends ApiResponse<{
  totalRecords: number
  successCount: number
  failureCount: number
  duplicateCount: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
}> {}

// 商品导出请求
export interface ProductExportRequest {
  filters?: {
    category?: string
    brand?: string
    tags?: string[]
    status?: Product['status']
    priceRange?: [number, number]
    stockRange?: [number, number]
    dateRange?: [string, string]
  }
  format: 'csv' | 'excel' | 'json'
  columns?: (keyof Product)[]
}

// 商品导出响应
export interface ProductExportResponse extends ApiResponse<{
  url: string
  filename: string
  expiresAt: string
}> {}

// 商品对比
export interface ProductComparison {
  products: Product[]
  specifications: Array<{
    name: string
    values: string[]
  }>
  attributes: Array<{
    name: string
    values: string[]
  }>
  prices: Array<{
    productId: string
    price: number
    originalPrice: number
    promotion?: string
  }>
  ratings: Array<{
    productId: string
    rating: number
    reviews: number
  }>
}

// 商品对比响应
export interface ProductComparisonResponse extends ApiResponse<ProductComparison>> {}

// 商品关联
export interface ProductRelation {
  type: 'similar' | 'complementary' | 'bundle' | 'accessory' | 'related'
  sourceProductId: string
  targetProductId: string
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 商品关系响应
export interface ProductRelationResponse extends ApiResponse<Array<ProductRelation>> {}

// 商品变体
export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string
  price: number
  originalPrice?: number
  stock: number
  images: string[]
  specifications: Record<string, string>
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  barcode?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 商品变体响应
export interface ProductVariantResponse extends ApiResponse<Array<ProductVariant>> {}

// 商品批量创建
export interface ProductBatchCreateRequest {
  products: Array<{
    name: string
    description: string
    categoryId: string
    brand?: string
    price: number
    originalPrice?: number
    stock: number
    images: File[]
    tags?: string[]
    specifications?: ProductSpecification[]
  }>
}

// 商品批量创建响应
export interface ProductBatchCreateResponse extends ApiResponse<{
  successCount: number
  failureCount: number
  results: Array<{
    index: number
    success: boolean
    message: string
    productId?: string
  }>
}> {}

// 商品库存同步
export interface ProductStockSyncRequest {
  productId: string
  stock: number
  warehouseId?: string
  reason: string
  operator: string
}

// 商品库存同步响应
export interface ProductStockSyncResponse extends ApiResponse<{
  beforeStock: number
  afterStock: number
  difference: number
  transactionId: string
}> {}

// 商品价格调整
export interface ProductPriceAdjustmentRequest {
  productId: string
  newPrice: number
  reason: string
  operator: string
  isSale: boolean
  saleEndDate?: string
}

// 商品价格调整响应
export interface ProductPriceAdjustmentResponse extends ApiResponse<{
  beforePrice: number
  afterPrice: number
  originalPrice?: number
  difference: number
  transactionId: string
}> {}

// 商品批量价格调整
export interface ProductBatchPriceAdjustmentRequest {
  adjustments: Array<{
    productId: string
    newPrice: number
    reason: string
    operator: string
  }>
  strategy: 'individual' | 'percentage' | 'fixed'
  effectiveDate: string
}

// 商品批量价格调整响应
export interface ProductBatchPriceAdjustmentResponse extends ApiResponse<{
  successCount: number
  failureCount: number
  results: Array<{
    productId: string
    success: boolean
    message: string
    beforePrice?: number
    afterPrice?: number
  }>
}> {}

// 商品批量库存调整
export interface ProductBatchStockAdjustmentRequest {
  adjustments: Array<{
    productId: string
    stock: number
    reason: string
    operator: string
  }>
  reason: string
  effectiveDate: string
}

// 商品批量库存调整响应
export interface ProductBatchStockAdjustmentResponse extends ApiResponse<{
  successCount: number
  failureCount: number
  results: Array<{
    productId: string
    success: boolean
    message: string
    beforeStock?: number
    afterStock?: number
  }>
}> {}

// 商品图片
export interface ProductImage {
  id: string
  productId: string
  url: string
  thumbnail: string
  alt: string
  position: number
  isPrimary: boolean
  fileSize: number
  mimeType: string
  uploadedAt: string
}

// 商品图片响应
export interface ProductImageResponse extends ApiResponse<Array<ProductImage>> {}

// 商品图片上传
export interface ProductImageUploadRequest {
  productId: string
  files: File[]
  isPrimary?: boolean
}

// 商品图片上传响应
export interface ProductImageUploadResponse extends ApiResponse<{
  uploaded: Array<{
    image: ProductImage
    url: string
  }>
  failed: Array<{
    file: string
    reason: string
  }>
}> {}

// 商品图片删除
export interface ProductImageDeleteRequest {
  imageId: string
  productId: string
}

// 商品图片删除响应
export interface ProductImageDeleteResponse extends ApiResponse<null>> {}

// 商品图片设置主图
export interface ProductImageSetPrimaryRequest {
  imageId: string
  productId: string
}

// 商品图片设置主图响应
export interface ProductImageSetPrimaryResponse extends ApiResponse<null>> {}

// 商品模板
export interface ProductTemplate {
  id: string
  name: string
  category: string
  basePrice: number
  baseStock: number
  attributes: Record<string, any>
  specifications: ProductSpecification[]
  imageTemplates?: string[]
  descriptionTemplate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 商品模板响应
export interface ProductTemplateResponse extends ApiResponse<Array<ProductTemplate>> {}

// 商品生成请求
export interface ProductGenerateRequest {
  templateId: string
  name: string
  category: string
  attributes: Record<string, any>
  specifications?: ProductSpecification[]
  images?: File[]
}

// 商品生成响应
export interface ProductGenerateResponse extends ApiResponse<Product>> {}

// 商品SEO设置
export interface ProductSEO {
  title: string
  description: string
  keywords: string[]
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
}

// 商品SEO设置响应
export interface ProductSEOResponse extends ApiResponse<ProductSEO>> {}

// 商品统计数据
export interface ProductStats {
  views: number
  clicks: number
  addToCarts: number
  purchases: number
  revenue: number
  conversionRate: number
  averageRating: number
  reviewCount: number
  stockTurnover: number
  trendingScore: number
  competitorCount: number
  marketShare: number
}

// 商品统计数据响应
export interface ProductStatsResponse extends ApiResponse<ProductStats>> {}

// 商品历史数据
export interface ProductHistory {
  id: string
  productId: string
  type: 'view' | 'click' | 'cart' | 'purchase' | 'review' | 'price_change' | 'stock_change'
  data: any
  timestamp: string
  userId?: string
  sessionId: string
}

// 商品历史数据响应
export interface ProductHistoryResponse extends ApiResponse<Array<ProductHistory>> {}

// 商品预测数据
export interface ProductForecast {
  id: string
  productId: string
  demandPrediction: number
  salesPrediction: number
  revenuePrediction: number
  stockRequirement: number
  seasonalityFactors: Record<string, number>
  trendFactors: Record<string, number>
  marketFactors: Record<string, number>
  confidence: number
  forecastDate: string
}

// 商品预测数据响应
export interface ProductForecastResponse extends ApiResponse<ProductForecast>> {}

// 商品趋势分析
export interface ProductTrend {
  productId: string
  trends: Array<{
    date: string
    views: number
    clicks: number
    sales: number
    revenue: number
    rating: number
    reviewCount: number
  }>
  period: 'week' | 'month' | 'quarter' | 'year'
  trend: 'increasing' | 'decreasing' | 'stable'
  growthRate: number
  insights: Array<{
    type: 'performance' | 'price' | 'seasonal' | 'competitive' | 'promotional'
    message: string
    impact: 'positive' | 'negative' | 'neutral'
    confidence: number
  }>
}

// 商品趋势分析响应
export interface ProductTrendResponse extends ApiResponse<ProductTrend>> {}

// 商品推荐策略
export interface ProductRecommendationStrategy {
  id: string
  name: string
  type: 'collaborative' | 'content' | 'hybrid' | 'rules'
  parameters: Record<string, any>
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

// 商品推荐策略响应
export interface ProductRecommendationStrategyResponse extends ApiResponse<Array<ProductRecommendationStrategy>> {}

// 商品推荐设置
export interface ProductRecommendationSettings {
  strategy: string
  maxRecommendations: number
  refreshInterval: number
  enablePersonalization: boolean
  filters: {
    category: boolean
    priceRange: boolean
    availability: boolean
    rating: boolean
  }
  weighting: {
    popularity: number
    similarity: number
    recency: number
    personalization: number
  }
}

// 商品推荐设置响应
export interface ProductRecommendationSettingsResponse extends ApiResponse<ProductRecommendationSettings>> {}

// 商品实时状态
export interface ProductRealtimeStatus {
  productId: string
  currentStock: number
  reservedStock: number
  availableStock: number
  currentPrice: number
  originalPrice: number
  isOnSale: boolean
  rating: number
  reviewCount: number
  viewsToday: number
  clicksToday: number
  conversionsToday: number
  status: 'active' | 'inactive' | 'deleted' | 'out_of_stock'
  lastUpdated: string
}

// 商品实时状态响应
export interface ProductRealtimeStatusResponse extends ApiResponse<Array<ProductRealtimeStatus>> {}

// 商品监控规则
export interface ProductMonitorRule {
  id: string
  name: string
  condition: {
    metric: 'stock' | 'price' | 'rating' | 'sales' | 'views'
    operator: '<' | '>' | '<=' | '>=' | '==' | '!='
    threshold: number
  }
  action: {
    type: 'alert' | 'email' | 'sms' | 'webhook'
    recipients: string[]
    message: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 商品监控规则响应
export interface ProductMonitorRuleResponse extends ApiResponse<Array<ProductMonitorRule>> {}