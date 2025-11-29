<template>
  <div class="statistics-page">
    <van-nav-bar title="统计报表" left-arrow @click-left="handleBack" fixed z-index="100" />

    <!-- 时间筛选 -->
    <div class="filter-bar">
      <van-tabs v-model:active="activeTab" @change="handleTabChange">
        <van-tab title="今日" name="today" />
        <van-tab title="本月" name="month" />
        <van-tab title="促销活动" name="promotion" />
      </van-tabs>
    </div>

    <!-- 加载状态 -->
    <van-loading v-if="isLoading" type="spinner" vertical>加载中...</van-loading>

    <!-- 今日统计 -->
    <div v-else-if="activeTab === 'today'" class="statistics-content">
      <van-pull-refresh v-model="refreshing" @refresh="loadTodayStatistics">
        <!-- 统计卡片 -->
        <div class="stats-cards">
          <van-cell-group inset>
            <van-cell title="核销笔数" :value="todayStats.verificationCount || 0" />
            <van-cell title="核销金额" :value="`¥${formatAmount(todayStats.verificationAmount || 0)}`" />
            <van-cell title="退款笔数" :value="todayStats.refundCount || 0" />
            <van-cell title="退款金额" :value="`¥${formatAmount(todayStats.refundAmount || 0)}`" />
            <van-cell title="客单价" :value="`¥${formatAmount(todayStats.averagePrice || 0)}`" />
          </van-cell-group>
        </div>

        <!-- 时段统计 -->
        <div class="hourly-stats">
          <h3>时段统计</h3>
          <div ref="hourlyChartRef" class="hourly-chart">
            <div
              v-for="(item, index) in todayStats.hourlyStats || []"
              :key="index"
              class="hourly-item"
            >
              <div class="hour-label">{{ item.hour }}</div>
              <div class="hour-bar-container">
                <div
                  class="hour-bar"
                  :style="{ height: `${(item.count / maxHourCount) * 100}%` }"
                ></div>
              </div>
              <div class="hour-count">{{ item.count }}</div>
            </div>
          </div>
        </div>

        <!-- 热销商品TOP5 -->
        <div class="top-products">
          <h3>热销商品TOP5</h3>
          <van-cell-group inset>
            <van-cell
              v-for="(product, index) in todayStats.topProducts || []"
              :key="product.promotionId"
              :title="`${index + 1}. ${product.promotionName}`"
              :label="`核销${product.count}笔，金额¥${formatAmount(product.amount)}`"
            >
              <template #value>
                <van-tag type="primary">{{ product.percentage.toFixed(1) }}%</van-tag>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 本月统计 -->
    <div v-else-if="activeTab === 'month'" class="statistics-content">
      <van-pull-refresh v-model="refreshing" @refresh="loadMonthStatistics">
        <!-- 统计卡片 -->
        <div class="stats-cards">
          <van-cell-group inset>
            <van-cell title="核销笔数" :value="monthStats.verificationCount || 0" />
            <van-cell title="核销金额" :value="`¥${formatAmount(monthStats.verificationAmount || 0)}`" />
            <van-cell title="退款笔数" :value="monthStats.refundCount || 0" />
            <van-cell title="退款金额" :value="`¥${formatAmount(monthStats.refundAmount || 0)}`" />
            <van-cell title="客单价" :value="`¥${formatAmount(monthStats.averagePrice || 0)}`" />
          </van-cell-group>
        </div>

        <!-- 每日趋势 -->
        <div class="daily-trends">
          <h3>每日趋势</h3>
          <div class="trends-chart">
            <div
              v-for="(item, index) in monthStats.dailyTrends || []"
              :key="index"
              class="trend-item"
            >
              <div class="trend-date">{{ formatDate(item.date) }}</div>
              <div class="trend-bar-container">
                <div
                  class="trend-bar"
                  :style="{ 
                    height: item.amount > 0 
                      ? `${Math.max((item.amount / maxTrendAmount) * 100, 5)}%` 
                      : '5%' 
                  }"
                ></div>
              </div>
              <div class="trend-info">
                <div class="trend-count">{{ item.count }}笔</div>
                <div class="trend-amount">¥{{ formatAmount(item.amount) }}</div>
              </div>
            </div>
          </div>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 促销活动统计 -->
    <div v-else-if="activeTab === 'promotion'" class="statistics-content">
      <van-pull-refresh v-model="refreshing" @refresh="loadPromotionStatistics">
        <!-- 筛选开关 -->
        <div class="promotion-filter">
          <van-cell-group inset>
            <van-cell>
              <template #title>
                <span>查看所有促销活动（包含已失效）</span>
              </template>
              <template #right-icon>
                <van-switch v-model="showAllPromotions" @change="handleFilterChange" />
              </template>
            </van-cell>
          </van-cell-group>
        </div>
        
        <!-- 促销活动列表 -->
        <div class="promotion-stats">
          <van-cell-group inset v-if="promotionStats.length > 0">
            <van-cell
              v-for="item in promotionStats"
              :key="item.promotionId"
              :title="item.promotionName"
              :label="`核销${item.verificationCount}笔，退款${item.refundCount}笔`"
              :class="{ 'inactive-promotion': !item.isActive }"
            >
              <template #value>
                <div class="promotion-value">
                  <div class="amount">¥{{ formatAmount(item.verificationAmount) }}</div>
                  <div class="avg-price">客单价: ¥{{ formatAmount(item.averagePrice) }}</div>
                  <van-tag v-if="!item.isActive" type="warning" style="margin-top: 4px; font-size: 10px;">已失效</van-tag>
                </div>
              </template>
            </van-cell>
          </van-cell-group>
          <van-empty v-else description="暂无促销活动统计数据" />
        </div>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast } from 'vant'
  import {
    merchantOperatorService,
    type TodayStatistics,
    type MonthStatistics,
    type PromotionStatistics
  } from '@/services/merchantOperator'

  const router = useRouter()

  // 状态
  const isLoading = ref(false)
  const refreshing = ref(false)
  const activeTab = ref('today')
  const hourlyChartRef = ref<HTMLElement | null>(null)
  const showAllPromotions = ref(false)  // 是否显示所有促销活动（包含已失效的）

  // 数据
  const todayStats = ref<TodayStatistics>({
    verificationCount: 0,
    verificationAmount: 0,
    refundCount: 0,
    refundAmount: 0,
    averagePrice: 0,
    hourlyStats: [],
    topProducts: []
  })

  const monthStats = ref<MonthStatistics>({
    verificationCount: 0,
    verificationAmount: 0,
    refundCount: 0,
    refundAmount: 0,
    averagePrice: 0,
    dailyTrends: []
  })

  const promotionStats = ref<PromotionStatistics[]>([])

  // 计算最大值（用于图表）
  const maxHourCount = computed(() => {
    if (!todayStats.value.hourlyStats || todayStats.value.hourlyStats.length === 0) return 1
    return Math.max(...todayStats.value.hourlyStats.map(item => item.count), 1)
  })

  const maxTrendAmount = computed(() => {
    if (!monthStats.value.dailyTrends || monthStats.value.dailyTrends.length === 0) return 1
    const maxAmount = Math.max(...monthStats.value.dailyTrends.map(item => item.amount), 0)
    // 如果最大金额为0，返回1以确保柱状图有最小高度（用于显示有数据但金额为0的情况）
    return maxAmount > 0 ? maxAmount : 1
  })

  // 加载今日统计
  const loadTodayStatistics = async () => {
    try {
      isLoading.value = !refreshing.value
      console.log('📊 [统计] 加载今日统计...')
      const result = await merchantOperatorService.getTodayStatistics()
      console.log('📊 [统计] 今日统计结果:', result)
      
      if (!result) {
        throw new Error('返回数据为空')
      }
      
      todayStats.value = result
      
      // 数据加载完成后，自动滚动到当前时段
      await nextTick() // 等待 DOM 更新
      scrollToCurrentHour()
    } catch (error: any) {
      console.error('❌ [统计] 加载今日统计失败:', error)
      showToast({ type: 'fail', message: error.message || '加载失败' })
      // 重置为默认值
      todayStats.value = {
        verificationCount: 0,
        verificationAmount: 0,
        refundCount: 0,
        refundAmount: 0,
        averagePrice: 0,
        hourlyStats: [],
        topProducts: []
      }
    } finally {
      isLoading.value = false
      refreshing.value = false
    }
  }

  // 加载本月统计
  const loadMonthStatistics = async () => {
    try {
      isLoading.value = !refreshing.value
      console.log('📊 [统计] 加载本月统计...')
      const result = await merchantOperatorService.getMonthStatistics()
      console.log('📊 [统计] 本月统计结果:', result)
      
      if (!result) {
        throw new Error('返回数据为空')
      }
      
      monthStats.value = result
    } catch (error: any) {
      console.error('❌ [统计] 加载本月统计失败:', error)
      showToast({ type: 'fail', message: error.message || '加载失败' })
      // 重置为默认值
      monthStats.value = {
        verificationCount: 0,
        verificationAmount: 0,
        refundCount: 0,
        refundAmount: 0,
        averagePrice: 0,
        dailyTrends: []
      }
    } finally {
      isLoading.value = false
      refreshing.value = false
    }
  }

  // 加载促销活动统计
  const loadPromotionStatistics = async () => {
    try {
      isLoading.value = !refreshing.value
      console.log('📊 [统计] 加载促销活动统计...', { includeInactive: showAllPromotions.value })
      const result = await merchantOperatorService.getStatisticsByPromotion({
        date: 'today',
        includeInactive: showAllPromotions.value
      })
      console.log('📊 [统计] 促销活动统计结果:', result)
      console.log('📊 [统计] 结果类型:', typeof result, '是否为数组:', Array.isArray(result))
      console.log('📊 [统计] 结果长度:', Array.isArray(result) ? result.length : '不是数组')
      
      // 即使结果为空数组，也正常处理（显示空状态提示）
      promotionStats.value = Array.isArray(result) ? result : []
      
      console.log('📊 [统计] promotionStats.value:', promotionStats.value)
      console.log('📊 [统计] promotionStats.value.length:', promotionStats.value.length)
      
      if (promotionStats.value.length === 0) {
        console.log('⚠️ [统计] 促销活动统计数据为空')
      } else {
        console.log('✅ [统计] 促销活动统计数据:', JSON.stringify(promotionStats.value, null, 2))
      }
    } catch (error: any) {
      console.error('❌ [统计] 加载促销活动统计失败:', error)
      showToast({ type: 'fail', message: error.message || '加载失败' })
      // 重置为空数组
      promotionStats.value = []
    } finally {
      isLoading.value = false
      refreshing.value = false
    }
  }

  // Tab切换
  const handleTabChange = () => {
    if (activeTab.value === 'today') {
      loadTodayStatistics()
    } else if (activeTab.value === 'month') {
      loadMonthStatistics()
    } else if (activeTab.value === 'promotion') {
      loadPromotionStatistics()
    }
  }

  // 筛选开关变化处理
  const handleFilterChange = () => {
    loadPromotionStatistics()
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return amount.toFixed(2)
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}/${date.getDate()}`
    } catch {
      return dateStr
    }
  }

  // 滚动到当前时段
  const scrollToCurrentHour = () => {
    if (!hourlyChartRef.value) return
    
    const currentHour = new Date().getHours()
    const hourlyItems = hourlyChartRef.value.querySelectorAll('.hourly-item')
    
    if (hourlyItems[currentHour]) {
      // 滚动到当前时段，居中显示
      const item = hourlyItems[currentHour] as HTMLElement
      const container = hourlyChartRef.value
      const scrollLeft = item.offsetLeft - (container.clientWidth / 2) + (item.clientWidth / 2)
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      })
    }
  }

  // 返回
  const handleBack = () => {
    router.back()
  }

  // 初始化
  onMounted(() => {
    loadTodayStatistics()
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .statistics-page {
    min-height: 100vh;
    background: var(--theme-bg-gradient, $glass-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
    padding-top: 46px;
    padding-bottom: 20px;
  }

  .filter-bar {
    background: white;
    margin-bottom: 12px;
    position: sticky;
    top: 46px;
    z-index: 10;
  }

  .statistics-content {
    padding: 0 12px;
  }

  .stats-cards {
    margin-bottom: 16px;
  }

  .hourly-stats,
  .daily-trends,
  .top-products,
  .promotion-stats {
    margin-bottom: 16px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
      padding: 0 4px;
      color: var(--theme-text-on-glass, $text-color-primary);
    }
  }

  .hourly-chart {
    @include glassmorphism-card(base);
    padding: 16px;
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    gap: 8px;
    min-height: 200px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch; // iOS 平滑滚动

    .hourly-item {
      flex: 0 0 auto; // 不压缩，不扩展，自动宽度
      min-width: 50px; // 最小宽度，确保24个时段可以横向滚动
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .hour-label {
        font-size: 11px;
        color: var(--theme-text-secondary, $text-color-secondary);
      }

      .hour-bar-container {
        width: 100%;
        height: 120px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .hour-bar {
        width: 80%;
        background: linear-gradient(to top, #1989fa, #4dabf7);
        border-radius: 4px 4px 0 0;
        min-height: 4px;
        transition: height 0.3s ease;
      }

      .hour-count {
        font-size: 12px;
        font-weight: 600;
        color: var(--theme-text-on-glass, $text-color-primary);
      }
    }
  }

  .trends-chart {
    @include glassmorphism-card(base);
    padding: 16px;
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    gap: 8px;
    min-height: 200px;
    overflow-x: auto;

    .trend-item {
      flex: 1;
      min-width: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .trend-date {
        font-size: 11px;
        color: var(--theme-text-secondary, $text-color-secondary);
        writing-mode: vertical-lr;
        text-orientation: upright;
      }

      .trend-bar-container {
        width: 100%;
        height: 120px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .trend-bar {
        width: 80%;
        background: linear-gradient(to top, #10b981, #34d399);
        border-radius: 4px 4px 0 0;
        min-height: 4px;
        transition: height 0.3s ease;
      }

      .trend-info {
        text-align: center;
        font-size: 11px;

        .trend-count {
          color: var(--theme-text-secondary, $text-color-secondary);
          margin-bottom: 2px;
        }

        .trend-amount {
          font-weight: 600;
          color: var(--theme-text-on-glass, $text-color-primary);
        }
      }
    }
  }

  .promotion-filter {
    margin-bottom: 12px;
  }

  .promotion-value {
    text-align: right;

    .amount {
      font-size: 16px;
      font-weight: 600;
      color: var(--theme-text-on-glass, $text-color-primary);
      margin-bottom: 4px;
    }

    .avg-price {
      font-size: 12px;
      color: #646566;
    }
  }

  .inactive-promotion {
    opacity: 0.6;

    :deep(.van-cell__title) {
      color: var(--theme-text-secondary, $text-color-secondary);
    }

    :deep(.van-cell__label) {
      color: var(--theme-text-secondary, $text-color-secondary);
    }
  }
</style>

