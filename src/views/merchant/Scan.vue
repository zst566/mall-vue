<template>
  <div class="scan-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <van-nav-bar title="订单核销" left-arrow @click-left="onClickLeft">
        <template #right>
          <van-icon name="setting-o" @click="goToSettings" />
        </template>
      </van-nav-bar>
    </div>

    <!-- 扫描区域 -->
    <div class="scan-container">
      <div class="scan-area">
        <!-- 摄像头预览 -->
        <div class="camera-preview" v-if="isCameraReady">
          <video ref="videoRef" :class="{ 'facing-front': isFrontCamera }" autoplay playsinline />
          <canvas ref="canvasRef" class="scan-canvas" />
        </div>

        <!-- 加载状态 -->
        <div v-if="loading && !isCameraReady" class="loading-container">
          <van-loading type="spinner" size="24px">正在启动摄像头...</van-loading>
        </div>

        <!-- 扫描框 -->
        <div class="scan-frame">
          <div class="scan-border">
            <div class="scan-corner top-left"></div>
            <div class="scan-corner top-right"></div>
            <div class="scan-corner bottom-left"></div>
            <div class="scan-corner bottom-right"></div>
          </div>
          <div class="scan-line" :class="{ scanning: isScanning }"></div>
        </div>

        <!-- 扫描提示 -->
        <div class="scan-tips">
          <p class="scan-text">将二维码放入框内，即可自动扫描</p>
          <p class="scan-hint">请确保二维码清晰可见，光线充足</p>
        </div>
      </div>

      <!-- 扫描按钮 -->
      <div class="scan-actions">
        <van-button
          v-if="!isScanning"
          type="primary"
          size="large"
          round
          @click="startScan"
          :disabled="!isCameraReady"
          class="scan-button"
        >
          开始扫描
        </van-button>
        <van-button v-else type="danger" size="large" round @click="stopScan" class="stop-button">
          停止扫描
        </van-button>

        <!-- ��换摄像头 -->
        <van-button
          v-if="isScanning"
          type="default"
          size="large"
          round
          @click="toggleCamera"
          class="switch-button"
        >
          <van-icon :name="isFrontCamera ? 'camera-o' : 'camera-reverse'" />
          切换摄像头
        </van-button>
      </div>
    </div>

    <!-- 最近扫描记录 -->
    <div class="scan-history">
      <div class="section-header">
        <h3>最近扫描</h3>
        <van-icon name="arrow" @click="goToHistory" />
      </div>
      <div class="history-list">
        <div
          v-for="record in scanHistory"
          :key="record.id"
          class="history-item"
          @click="viewScanDetail(record)"
        >
          <div class="item-icon" :class="record.type">
            <van-icon :name="getRecordIcon(record.type)" />
          </div>
          <div class="item-info">
            <h4 class="item-title">{{ record.title }}</h4>
            <p class="item-desc">{{ record.description }}</p>
            <span class="item-time">{{ formatTime(record.scannedAt) }}</span>
          </div>
          <div class="item-status" :class="record.status">
            {{ getStatusText(record.status) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 扫描结果弹窗 -->
    <van-popup v-model:show="showResultPopup" position="bottom" round :style="{ height: '70%' }">
      <div class="result-popup">
        <div class="popup-header">
          <h3>扫描结果</h3>
          <van-icon name="cross" @click="closeResultPopup" />
        </div>
        <div class="popup-content">
          <div v-if="scanResult" class="result-info">
            <div class="result-type">
              <van-icon :name="getResultIcon(scanResult.type)" />
              <span class="type-text">{{ scanResult.title }}</span>
            </div>
            <div class="result-details">
              <van-cell-group inset>
                <van-cell title="订单号" :value="scanResult.data.orderNo" />
                <van-cell title="商品信息" :value="scanResult.data.productName" />
                <van-cell title="购买数量" :value="scanResult.data.quantity" />
                <van-cell title="支付金额" :value="'¥' + scanResult.data.amount" />
                <van-cell title="购买时间" :value="formatTime(scanResult.data.purchasedAt)" />
              </van-cell-group>
            </div>
            <div class="result-actions">
              <van-button
                v-if="scanResult.data.status === 'pending'"
                type="primary"
                block
                round
                @click="verifyOrder"
                :loading="isVerifying"
              >
                确认核销
              </van-button>
              <van-button v-else type="default" block round @click="closeResultPopup">
                关闭
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 提示弹窗 -->
    <van-popup v-model:show="showToastPopup" position="center" :style="{ width: '80%' }">
      <div class="toast-content">
        <van-icon :name="toastIcon" :class="toastType" size="40px" />
        <p class="toast-message">{{ toastMessage }}</p>
      </div>
    </van-popup>

    <!-- 权限提示 -->
    <van-dialog
      v-model:show="showPermissionDialog"
      title="权限申请"
      message="需要访问摄像头权限，请允许以使用扫描功能"
      show-cancel-button
      confirmButtonText="去设置"
      @confirm="goToSettings"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast } from 'vant'

  const router = useRouter()

  // 摄像头相关
  const videoRef = ref<HTMLVideoElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const isCameraReady = ref(false)
  const isScanning = ref(false)
  const isFrontCamera = ref(false)
  const currentStream = ref<MediaStream | null>(null)
  const scanningInterval = ref<NodeJS.Timeout | null>(null)

  // 扫描相关
  const scanResult = ref<any>(null)
  const scanHistory = ref([
    {
      id: '1',
      type: 'order',
      title: '订单核销',
      description: 'iPhone 15 Pro x1',
      scannedAt: '2024-01-15 14:30:00',
      status: 'success',
      data: {
        orderNo: 'ORD202401150001',
        productName: 'iPhone 15 Pro',
        quantity: 1,
        amount: 8999,
        status: 'pending',
        purchasedAt: '2024-01-15 10:00:00'
      }
    },
    {
      id: '2',
      type: 'product',
      title: '商品信息',
      description: '华为 Mate 60',
      scannedAt: '2024-01-15 13:20:00',
      status: 'info',
      data: {
        productId: '2',
        productName: '华为 Mate 60',
        price: 6999,
        stock: 50
      }
    }
  ])

  // UI状态
  const loading = ref(false)
  const isVerifying = ref(false)
  const showResultPopup = ref(false)
  const showToastPopup = ref(false)
  const showPermissionDialog = ref(false)

  // Toast相关
  const toastIcon = ref('success')
  const toastType = ref('success')
  const toastMessage = ref('')

  // 初始化摄像头
  const initCamera = async () => {
    try {
      loading.value = true

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能')
      }

      // 请求摄像头权限
      const constraints = {
        video: {
          facingMode: isFrontCamera.value ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      currentStream.value = stream

      if (videoRef.value) {
        videoRef.value.srcObject = stream
        videoRef.value.onloadedmetadata = () => {
          isCameraReady.value = true
          loading.value = false
        }
      }
    } catch (error) {
      loading.value = false
      console.error('摄像头初始化失败:', error)

      // 处理权限被拒绝的情况
      if (
        (error as any).name === 'NotAllowedError' ||
        (error as any).name === 'PermissionDeniedError'
      ) {
        showPermissionDialog.value = true
      } else {
        showToast('摄像头初始化失败')
      }
    }
  }

  // 开始扫描
  const startScan = () => {
    if (!isCameraReady.value) return

    isScanning.value = true

    // 开始扫描循环
    if (canvasRef.value && videoRef.value) {
      const canvas = canvasRef.value
      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (context) {
        canvas.width = videoRef.value.videoWidth
        canvas.height = videoRef.value.videoHeight

        // 模拟扫描过程
        scanningInterval.value = setInterval(() => {
          // 这里应该集成实际的二维码扫描库
          // 现在只是模拟扫描结果
          simulateScan()
        }, 1000) as any
      }
    }
  }

  // 停止扫描
  const stopScan = () => {
    isScanning.value = false

    if (scanningInterval.value) {
      clearInterval(scanningInterval.value as any)
      scanningInterval.value = null
    }
  }

  // 模拟扫描结果
  const simulateScan = () => {
    // 随机生成扫描结果
    const types = ['order', 'product', 'promotion']
    const randomType = types[Math.floor(Math.random() * types.length)]

    const mockResult = {
      type: randomType,
      title:
        randomType === 'order' ? '订单核销' : randomType === 'product' ? '商品信息' : '促销活动',
      data: {
        orderNo: `ORD${Date.now()}`,
        productName: randomType === 'order' ? 'iPhone 15 Pro' : '华为 Mate 60',
        quantity: 1,
        amount: randomType === 'order' ? 8999 : 6999,
        status: randomType === 'order' ? 'pending' : 'info',
        purchasedAt: new Date().toISOString()
      }
    }

    handleScanResult(mockResult)
  }

  // 处理扫描结果
  const handleScanResult = (result: any) => {
    scanResult.value = result
    showResultPopup.value = true

    // 添加到历史记录
    const newRecord = {
      id: Date.now().toString(),
      type: result.type,
      title: result.title,
      description: result.data.productName || result.data.title,
      scannedAt: new Date().toISOString(),
      status: 'success',
      data: result.data
    }

    scanHistory.value.unshift(newRecord)
    if (scanHistory.value.length > 5) {
      scanHistory.value = scanHistory.value.slice(0, 5)
    }

    stopScan()
  }

  // 切换摄像头
  const toggleCamera = async () => {
    stopScan()
    isFrontCamera.value = !isFrontCamera.value

    // 释放当前流
    if (currentStream.value) {
      currentStream.value.getTracks().forEach(track => track.stop())
      currentStream.value = null
    }

    // 重新初始化摄像头
    await initCamera()
  }

  // 确认核销
  const verifyOrder = async () => {
    if (!scanResult.value) return

    try {
      isVerifying.value = true
      showToast('核销中...')

      // 模拟核销API调用
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 更新订单状态
      if (scanResult.value.data.status === 'pending') {
        scanResult.value.data.status = 'verified'
        scanResult.value.data.verifiedAt = new Date().toISOString()
      }

      showToast('核销成功')
      isVerifying.value = false
      closeResultPopup()
    } catch (error) {
      showToast('核销失败，请重试')
      isVerifying.value = false
    }
  }

  // 关闭结果弹窗
  const closeResultPopup = () => {
    showResultPopup.value = false
    scanResult.value = null
  }

  // 显示提示弹窗
  const showToastMessage = (message: string, type = 'success') => {
    toastMessage.value = message
    toastType.value = type
    toastIcon.value = type === 'success' ? 'success' : type === 'error' ? 'close' : 'info'
    showToastPopup.value = true

    setTimeout(() => {
      showToastPopup.value = false
    }, 2000)
  }

  // 获取记录图标
  const getRecordIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      order: 'orders-o',
      product: 'shopping-cart-o',
      promotion: 'gift-o',
      payment: 'paid-o'
    }
    return iconMap[type] || 'scan'
  }

  // 获取结果图标
  const getResultIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      order: 'orders-o',
      product: 'shopping-cart-o',
      promotion: 'gift-o'
    }
    return iconMap[type] || 'scan'
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      success: '成功',
      error: '失败',
      info: '信息',
      warning: '警告'
    }
    return statusMap[status] || status
  }

  // 格式化时间
  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 查看扫描详情
  const viewScanDetail = (record: any) => {
    scanResult.value = record
    showResultPopup.value = true
  }

  // 跳转到设置
  const goToSettings = () => {
    router.push('/merchant/settings')
  }

  // 跳转到历史记录
  const goToHistory = () => {
    router.push('/merchant/scan-history')
  }

  // 返回上一页
  const onClickLeft = () => {
    router.back()
  }

  // 组件挂载时初始化
  onMounted(() => {
    initCamera()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    stopScan()

    if (currentStream.value) {
      currentStream.value.getTracks().forEach(track => track.stop())
      currentStream.value = null
    }
  })
</script>

<style lang="scss" scoped>
  .scan-page {
    min-height: 100vh;
    background-color: var(--van-background);
    padding-bottom: 20px;
  }

  .scan-container {
    margin: 16px;
    border-radius: var(--van-radius-lg);
    overflow: hidden;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .scan-area {
    position: relative;
    aspect-ratio: 16/9;
    background: #000;
  }

  .camera-preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;

      &.facing-front {
        transform: scaleX(-1);
      }
    }

    .scan-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
    }
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: #000;
  }

  .scan-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 60%;
    max-width: 300px;
    max-height: 300px;

    .scan-border {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: var(--van-radius-md);

      .scan-corner {
        position: absolute;
        width: 20px;
        height: 20px;
        border: 3px solid var(--van-primary-color);

        &.top-left {
          top: -3px;
          left: -3px;
          border-right: none;
          border-bottom: none;
        }

        &.top-right {
          top: -3px;
          right: -3px;
          border-left: none;
          border-bottom: none;
        }

        &.bottom-left {
          bottom: -3px;
          left: -3px;
          border-right: none;
          border-top: none;
        }

        &.bottom-right {
          bottom: -3px;
          right: -3px;
          border-left: none;
          border-top: none;
        }
      }
    }

    .scan-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--van-primary-color), transparent);
      animation: scanLine 2s linear infinite;

      &.scanning {
        animation-play-state: running;
      }

      &:not(.scanning) {
        animation-play-state: paused;
      }
    }
  }

  @keyframes scanLine {
    0% {
      top: 0;
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      top: 100%;
      opacity: 0;
    }
  }

  .scan-tips {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: white;

    .scan-text {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .scan-hint {
      font-size: 12px;
      opacity: 0.8;
    }
  }

  .scan-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 16px;

    .scan-button,
    .stop-button,
    .switch-button {
      flex: 1;
      max-width: 200px;
    }
  }

  .scan-history {
    margin: 16px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      margin-bottom: 12px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--van-text-color);
        margin: 0;
      }

      .van-icon {
        font-size: 16px;
        color: var(--van-text-color-3);
        cursor: pointer;
      }
    }

    .history-list {
      .history-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: white;
        border-radius: var(--van-radius-md);
        margin-bottom: 12px;
        cursor: pointer;
        transition: all var(--van-transition-duration);

        &:active {
          transform: scale(0.98);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .item-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.order {
            background: var(--van-primary-color-light);
            color: var(--van-primary-color);
          }

          &.product {
            background: var(--van-warning-color-light);
            color: var(--van-warning-color);
          }

          &.promotion {
            background: var(--van-success-color-light);
            color: var(--van-success-color);
          }
        }

        .item-info {
          flex: 1;

          .item-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--van-text-color);
            margin-bottom: 4px;
          }

          .item-desc {
            font-size: 12px;
            color: var(--van-text-color-3);
            margin-bottom: 4px;
          }

          .item-time {
            font-size: 11px;
            color: var(--van-text-color-3);
          }
        }

        .item-status {
          font-size: 12px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: var(--van-radius-sm);

          &.success {
            color: var(--van-success-color);
            background: var(--van-success-color-light);
          }

          &.error {
            color: var(--van-danger-color);
            background: var(--van-danger-color-light);
          }

          &.info {
            color: var(--van-primary-color);
            background: var(--van-primary-color-light);
          }
        }
      }
    }
  }

  .result-popup {
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--van-border-color);

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .van-icon {
        cursor: pointer;
        font-size: 20px;
      }
    }

    .popup-content {
      padding: 16px;

      .result-info {
        .result-type {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;

          .van-icon {
            color: var(--van-primary-color);
            font-size: 20px;
          }

          .type-text {
            font-size: 16px;
            font-weight: 600;
            color: var(--van-text-color);
          }
        }

        .result-details {
          margin-bottom: 20px;
        }

        .result-actions {
          margin-top: 20px;
        }
      }
    }
  }

  .toast-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;

    .van-icon {
      margin-bottom: 12px;
    }

    .toast-message {
      font-size: 16px;
      color: var(--van-text-color);
      text-align: center;
    }

    .success {
      color: var(--van-success-color);
    }

    .error {
      color: var(--van-danger-color);
    }

    .info {
      color: var(--van-primary-color);
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .scan-page {
      background-color: var(--van-background-3);
    }

    .scan-container {
      background: var(--van-background-3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .scan-history .history-list .history-item {
      background: var(--van-background-4);
    }

    .result-popup .popup-header {
      border-bottom-color: var(--van-gray-6);
    }

    .toast-content .toast-message {
      color: var(--van-text-color);
    }
  }

  // 响应式设计
  @media (max-width: 375px) {
    .scan-container {
      margin: 12px;
    }

    .scan-actions {
      padding: 12px;
      gap: 8px;

      .van-button {
        max-width: 120px;
        font-size: 14px;
      }
    }

    .scan-history {
      margin: 12px;

      .history-list .history-item {
        padding: 12px;
        gap: 8px;

        .item-icon {
          width: 32px;
          height: 32px;
        }

        .item-info .item-title {
          font-size: 13px;
        }
      }
    }
  }

  @media (max-width: 320px) {
    .scan-container {
      margin: 8px;
    }

    .scan-tips {
      bottom: 12px;

      .scan-text {
        font-size: 14px;
      }

      .scan-hint {
        font-size: 11px;
      }
    }
  }
</style>
