<template>
  <div class="verifications-page">
    <van-nav-bar title="核销记录" left-arrow @click-left="handleBack" fixed z-index="100" />

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <van-tabs v-model:active="activeTab" @change="handleTabChange">
        <van-tab title="今日" name="today" />
        <van-tab title="本周" name="week" />
        <van-tab title="本月" name="month" />
        <van-tab title="自定义" name="custom" />
      </van-tabs>

      <!-- 自定义日期选择 -->
      <div v-if="activeTab === 'custom'" class="date-picker-section">
        <van-field
          v-model="customDate"
          readonly
          label="选择日期"
          placeholder="点击选择日期"
          @click="showDatePicker = true"
        />
        <van-calendar
          v-model:show="showDatePicker"
          @confirm="onDateConfirm"
          :min-date="minDate"
          :max-date="maxDate"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <van-loading v-if="isLoading" type="spinner" vertical>加载中...</van-loading>

    <!-- 记录列表 -->
    <div v-else class="verifications-list">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-cell-group v-if="verifications.length > 0" inset>
            <van-cell
              v-for="item in verifications"
              :key="item.id"
              :title="item.promotionName"
              :label="formatVerificationInfo(item)"
              is-link
              @click="viewDetail(item)"
            >
              <template #value>
                <div class="verification-value">
                  <div class="amount">¥{{ formatAmount(item.amount) }}</div>
                  <div class="status">
                    <van-tag :type="getStatusTagType(item.status)">
                      {{ getStatusText(item.status) }}
                    </van-tag>
                  </div>
                </div>
              </template>
              <template #right-icon>
                <van-icon name="arrow" />
              </template>
            </van-cell>
          </van-cell-group>

          <van-empty v-else description="暂无核销记录" />
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 详情弹窗 -->
    <van-popup
      v-model:show="showDetail"
      position="bottom"
      :style="{ height: '70%' }"
      round
    >
      <div v-if="selectedVerification" class="detail-popup">
        <div class="popup-header">
          <h3>核销详情</h3>
          <van-icon name="cross" @click="showDetail = false" />
        </div>
        <div class="popup-content">
          <van-cell-group inset>
            <van-cell title="订单号" :value="selectedVerification.orderNo" />
            <van-cell title="促销活动" :value="selectedVerification.promotionName" />
            <van-cell
              v-if="selectedVerification.shopCode"
              title="商铺"
              :value="selectedVerification.shopCode"
            />
            <van-cell title="客户" :value="selectedVerification.customerName" />
            <van-cell title="核销金额" :value="`¥${formatAmount(selectedVerification.amount)}`" />
            <van-cell title="核销时间" :value="formatDateTime(selectedVerification.verifiedAt)" />
            <van-cell title="核销人" :value="selectedVerification.verifiedByName" />
            <van-cell title="核销方式" :value="getVerificationTypeText(selectedVerification.verificationType)" />
            <van-cell title="状态">
              <template #value>
                <van-tag :type="getStatusTagType(selectedVerification.status)">
                  {{ getStatusText(selectedVerification.status) }}
                </van-tag>
              </template>
            </van-cell>
          </van-cell-group>

          <div class="action-section">
            <van-button
              v-if="selectedVerification.canCancel"
              type="danger"
              block
              round
              @click="handleCancel"
              :loading="isCancelling"
            >
              取消核销
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 确认对话框：取消核销 -->
    <van-dialog
      v-model:show="showCancelDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确定取消'"
      :cancel-button-text="'取消'"
      @confirm="confirmCancelVerification"
      @cancel="showCancelDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="warning-o" size="48" />
        </div>
        <h3 class="dialog-title">确认取消</h3>
        <p class="dialog-message">
          确定要取消这条核销记录吗？<br />
          此操作不可恢复。
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast } from 'vant'
  import { merchantOperatorService, type VerificationRecord } from '@/services/merchantOperator'

  const router = useRouter()

  // 状态
  const isLoading = ref(false)
  const loading = ref(false)
  const finished = ref(false)
  const refreshing = ref(false)
  const isCancelling = ref(false)

  // 筛选
  const activeTab = ref('today')
  const customDate = ref('')
  const showDatePicker = ref(false)
  const minDate = new Date(2020, 0, 1)
  const maxDate = new Date()

  // 数据
  const verifications = ref<VerificationRecord[]>([])
  const page = ref(1)
  const pageSize = ref(20)

  // 详情
  const showDetail = ref(false)
  const selectedVerification = ref<VerificationRecord | null>(null)

  // 对话框状态
  const showCancelDialog = ref(false)

  // 获取日期参数
  const getDateParam = computed(() => {
    if (activeTab.value === 'today') return 'today'
    if (activeTab.value === 'week') return 'week'
    if (activeTab.value === 'month') return 'month'
    if (activeTab.value === 'custom') {
      // 如果切换到自定义但还没有选择日期，返回 today 作为默认值
      return customDate.value || 'today'
    }
    return 'today'
  })

  // 加载数据
  const loadVerifications = async (reset = false) => {
    try {
      if (reset) {
        page.value = 1
        verifications.value = []
        finished.value = false
      }

      isLoading.value = !refreshing.value
      loading.value = true

      const dateParam = getDateParam.value
      console.log('📋 [核销记录] 加载数据:', { date: dateParam, page: page.value, pageSize: pageSize.value })

      const result = await merchantOperatorService.getVerifications({
        date: dateParam,
        page: page.value,
        pageSize: pageSize.value
      })

      console.log('📋 [核销记录] 获取结果:', { 
        listLength: result?.list?.length || 0, 
        pagination: result?.pagination,
        firstItem: result?.list?.[0] 
      })

      if (!result || !result.list) {
        console.error('❌ [核销记录] 返回数据格式错误:', result)
        throw new Error('返回数据格式错误')
      }

      if (reset) {
        verifications.value = result.list || []
      } else {
        verifications.value.push(...(result.list || []))
      }

      // 判断是否加载完成
      if (!result.list || result.list.length < pageSize.value) {
        finished.value = true
      } else {
        page.value++
      }
    } catch (error: any) {
      console.error('❌ [核销记录] 加载失败:', error)
      showToast({ type: 'fail', message: error.message || '加载失败' })
      finished.value = true
      // 清空数据，避免显示错误数据
      if (reset) {
        verifications.value = []
      }
    } finally {
      isLoading.value = false
      loading.value = false
      refreshing.value = false
    }
  }

  // 下拉刷新
  const onRefresh = () => {
    loadVerifications(true)
  }

  // 上拉加载
  const onLoad = () => {
    loadVerifications()
  }

  // Tab切换
  const handleTabChange = () => {
    loadVerifications(true)
  }

  // 日期选择
  const onDateConfirm = (date: Date) => {
    customDate.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    showDatePicker.value = false
    loadVerifications(true)
  }

  // 查看详情
  const viewDetail = (item: VerificationRecord) => {
    selectedVerification.value = item
    showDetail.value = true
  }

  // 取消核销
  const handleCancel = () => {
    if (!selectedVerification.value) return
    showCancelDialog.value = true
  }

  const confirmCancelVerification = async () => {
    if (!selectedVerification.value) return

    try {
      showCancelDialog.value = false
      isCancelling.value = true
      await merchantOperatorService.cancelVerification(selectedVerification.value.id)
      
      showToast({ type: 'success', message: '取消成功' })
      showDetail.value = false
      
      // 重新加载数据
      loadVerifications(true)
    } catch (error: any) {
      console.error('取消核销失败:', error)
      showToast(error.message || '取消失败')
    } finally {
      isCancelling.value = false
    }
  }

  // 格式化核销信息
  const formatVerificationInfo = (item: VerificationRecord) => {
    const parts = []
    if (item.shopCode) parts.push(item.shopCode)
    parts.push(formatDateTime(item.verifiedAt))
    return parts.join(' · ')
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return amount.toFixed(2)
  }

  // 格式化日期时间
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      verified: '已核销',
      cancelled: '已取消',
      refunded: '已退款'
    }
    return statusMap[status] || status
  }

  // 获取状态标签类型
  const getStatusTagType = (status: string): 'success' | 'danger' | 'warning' | 'default' => {
    const typeMap: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
      verified: 'success',
      cancelled: 'danger',
      refunded: 'warning'
    }
    return typeMap[status] || 'default'
  }

  // 获取核销方式文本
  const getVerificationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      QR_CODE: '扫码核销',
      MANUAL: '手动核销'
    }
    return typeMap[type] || type
  }

  // 返回
  const handleBack = () => {
    router.back()
  }

  // 初始化
  onMounted(() => {
    loadVerifications(true)
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;
  @use '@/styles/dialog-mixin.scss' as *;
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .verifications-page {
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

  .date-picker-section {
    padding: 12px 16px;
    background: #f7f8fa;
  }

  .verifications-list {
    padding: 0 12px;
  }

  .verification-value {
    text-align: right;

    .amount {
      font-size: 16px;
      font-weight: 600;
      color: var(--theme-text-on-glass, $text-color-primary);
      margin-bottom: 4px;
    }

    .status {
      display: flex;
      justify-content: flex-end;
    }
  }

  .detail-popup {
    height: 100%;
    display: flex;
    flex-direction: column;

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #ebedf0;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .van-icon {
        font-size: 20px;
        color: var(--theme-text-tertiary, $text-color-tertiary);
        cursor: pointer;
      }
    }

    .popup-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;

      .action-section {
        margin-top: 24px;
        padding: 0 16px;
      }
    }
  }

  // 统一对话框样式
  .standard-confirm-dialog {
    @include standard-dialog;
  }

  .dialog-content {
    @include dialog-content;
  }

  .dialog-icon {
    @include dialog-icon(#ff6b6b);
  }

  .dialog-title {
    @include dialog-title;
  }

  .dialog-message {
    @include dialog-message;
  }
</style>

