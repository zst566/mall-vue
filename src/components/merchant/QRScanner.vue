<template>
  <div class="qr-scanner">
    <!-- 扫描容器 -->
    <div class="scanner-container">
      <!-- 摄像头预览 -->
      <div class="camera-preview" v-if="isCameraReady">
        <video ref="videoRef" :class="{ 'facing-front': isFrontCamera }" autoplay playsinline />
        <canvas ref="canvasRef" class="scan-canvas" />

        <!-- 扫描框 -->
        <div class="scan-frame" v-if="showScanFrame">
          <div class="scan-border">
            <div class="scan-corner top-left"></div>
            <div class="scan-corner top-right"></div>
            <div class="scan-corner bottom-left"></div>
            <div class="scan-corner bottom-right"></div>
          </div>
          <div class="scan-line" :class="{ scanning: isScanning }"></div>
        </div>

        <!-- 扫描状态覆盖层 -->
        <div class="scan-overlay">
          <div class="overlay-top"></div>
          <div class="overlay-bottom"></div>
          <div class="overlay-left"></div>
          <div class="overlay-right"></div>
        </div>

        <!-- 扫描指示器 -->
        <div class="scan-indicator" :class="{ active: isScanning }">
          <div class="indicator-pulse"></div>
          <div class="indicator-text">
            {{ scanningText }}
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading && !isCameraReady" class="loading-container">
        <div class="loading-content">
          <van-loading type="spinner" size="32px" />
          <p class="loading-text">{{ loadingText }}</p>
        </div>
      </div>

      <!-- 权限错误 -->
      <div v-if="permissionError" class="error-container">
        <van-icon name="warning-o" size="40px" class="error-icon" />
        <h3 class="error-title">摄像头权限被拒绝</h3>
        <p class="error-text">请前往设置中允许访问摄像头权限</p>
        <div class="error-actions">
          <van-button type="primary" @click="retryInit">重试</van-button>
          <van-button type="default" @click="goToSettings">去设置</van-button>
        </div>
      </div>
    </div>

    <!-- 扫描控制 -->
    <div class="scan-controls">
      <!-- 手动输入 -->
      <van-button
        v-if="showManualInput"
        type="default"
        size="small"
        @click="showManualInputDialog = true"
        icon="edit"
      >
        手动输入
      </van-button>

      <!-- 切换摄像头 -->
      <van-button
        v-if="isScanning && cameraTypes.length > 1"
        type="default"
        size="small"
        @click="toggleCamera"
        :loading="isSwitchingCamera"
        :icon="isFrontCamera ? 'camera-o' : 'camera-reverse'"
      >
        切换摄像头
      </van-button>

      <!-- 闪光灯控制 -->
      <van-button
        v-if="isScanning && hasTorch"
        type="default"
        size="small"
        @click="toggleTorch"
        :icon="torchOn ? 'lamp' : 'lamp-o'"
        :class="{ 'torch-on': torchOn }"
      >
        {{ torchOn ? '关闭' : '开启' }}闪光灯
      </van-button>
    </div>

    <!-- 手动输入弹窗 -->
    <van-dialog
      v-model:show="showManualInputDialog"
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'确定'"
      :cancel-button-text="'取消'"
      @confirm="handleManualInput"
      @cancel="showManualInputDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="edit" size="48" />
        </div>
        <h3 class="dialog-title">手动输入</h3>
        <div class="dialog-input">
          <van-field
            v-model="manualInput"
            placeholder="请输入订单号或二维码内容"
            type="textarea"
            rows="3"
            clearable
            :rules="[{ required: true, message: '请输入内容' }]"
          />
        </div>
      </div>
    </van-dialog>
      <van-field
        v-model="manualInput"
        placeholder="请输入订单号或二维码内容"
        type="textarea"
        rows="3"
        clearable
        :rules="[{ required: true, message: '请输入内容' }]"
      />
    </van-dialog>

    <!-- 结果弹窗 -->
    <van-popup
      v-model:show="showResultPopup"
      position="bottom"
      round
      :style="{ height: resultPopupHeight }"
    >
      <div class="result-popup">
        <div class="popup-header">
          <h3>扫描结果</h3>
          <van-icon name="cross" @click="closeResultPopup" />
        </div>
        <div class="popup-content">
          <div v-if="scanResult" class="result-content">
            <!-- 结果类型标识 -->
            <div class="result-type">
              <van-icon :name="getResultIcon(scanResult.type)" />
              <span class="type-text">{{ scanResult.title }}</span>
            </div>

            <!-- 结果详情 -->
            <div class="result-details">
              <template v-if="scanResult.type === 'order'">
                <van-cell-group inset>
                  <van-cell title="订单号" :value="scanResult.data.orderNo" />
                  <van-cell title="商品名称" :value="scanResult.data.productName" />
                  <van-cell title="购买数量" :value="scanResult.data.quantity + '件'" />
                  <van-cell title="支付金额" :value="'¥' + scanResult.data.amount" />
                  <van-cell title="购买时间" :value="formatTime(scanResult.data.purchasedAt)" />
                  <van-cell title="订单状态" :value="getOrderStatus(scanResult.data.status)" />
                </van-cell-group>
              </template>

              <template v-else-if="scanResult.type === 'product'">
                <van-cell-group inset>
                  <van-cell title="商品ID" :value="scanResult.data.productId" />
                  <van-cell title="商品名称" :value="scanResult.data.productName" />
                  <van-cell title="商品价格" :value="'¥' + scanResult.data.price" />
                  <van-cell title="库存数量" :value="scanResult.data.stock + '件'" />
                </van-cell-group>
              </template>

              <template v-else-if="scanResult.type === 'promotion'">
                <van-cell-group inset>
                  <van-cell title="活动名称" :value="scanResult.data.title" />
                  <van-cell title="活动描述" :value="scanResult.data.description" />
                  <van-cell title="优惠类型" :value="scanResult.data.type" />
                  <van-cell title="优惠金额" :value="scanResult.data.discount + '元'" />
                </van-cell-group>
              </template>
            </div>

            <!-- 操作按钮 -->
            <div class="result-actions">
              <template v-if="scanResult.type === 'order' && scanResult.data.status === 'pending'">
                <van-button type="primary" block round @click="verifyOrder" :loading="isVerifying">
                  确认核销
                </van-button>
                <van-button type="warning" block round @click="viewOrderDetails">
                  查看详情
                </van-button>
              </template>
              <template v-else>
                <van-button type="primary" block round @click="closeResultPopup">确定</van-button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 提示信息 -->
    <div class="scan-tips">
      <p class="tip-text">{{ tipsText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { showToast } from 'vant'

  interface ScanResult {
    type: 'order' | 'product' | 'promotion'
    title: string
    data: any
  }

  interface Props {
    showScanFrame?: boolean
    autoStart?: boolean
    cameraType?: 'environment' | 'user'
    showManualInput?: boolean
    resultPopupHeight?: string
  }

  interface Emits {
    (e: 'success', result: ScanResult): void
    (e: 'error', error: Error): void
    (e: 'start'): void
    (e: 'stop'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    showScanFrame: true,
    autoStart: false,
    cameraType: 'environment',
    showManualInput: true,
    resultPopupHeight: '70%'
  })

  const emit = defineEmits<Emits>()

  // 摄像头相关
  const videoRef = ref<HTMLVideoElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const isCameraReady = ref(false)
  const isScanning = ref(false)
  const isFrontCamera = ref(props.cameraType === 'user')
  const currentStream = ref<MediaStream | null>(null)
  const scanningInterval = ref<number | null>(null)

  // 设备能力检测
  const hasTorch = ref(false)
  const torchOn = ref(false)
  const isSwitchingCamera = ref(false)

  // UI状态
  const loading = ref(false)
  const loadingText = ref('正在启动摄像头...')
  const permissionError = ref(false)
  const showResultPopup = ref(false)
  const showManualInputDialog = ref(false)
  const manualInput = ref('')
  const isVerifying = ref(false)

  // 扫描结果
  const scanResult = ref<ScanResult | null>(null)

  // 摄像头类型配置
  const cameraTypes = computed(() => {
    return [
      { label: '后置摄像头', value: 'environment', icon: 'camera-o' },
      { label: '前置摄像头', value: 'user', icon: 'camera-reverse' }
    ]
  })

  // 扫描文本
  const scanningText = computed(() => {
    return isScanning.value ? '正在扫描...' : '准备扫描'
  })

  // 提示文本
  const tipsText = computed(() => {
    if (!isCameraReady.value) return '请等待摄像头启动...'
    return '将二维码放入扫描框内，系统将自动识别'
  })

  // 初始化摄像头
  const initCamera = async () => {
    try {
      loading.value = true
      permissionError.value = false

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能')
      }

      // 请求摄像头权限
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isFrontCamera.value ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(torchOn.value && ({ torch: 'on' } as any))
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      currentStream.value = stream

      if (videoRef.value) {
        videoRef.value.srcObject = stream
        videoRef.value.onloadedmetadata = () => {
          isCameraReady.value = true
          loading.value = false

          // 检查是否支持闪光灯
          const track = stream.getVideoTracks()[0]
          hasTorch.value = (track.getCapabilities() as any).torch !== undefined

          // 自动开始扫描
          if (props.autoStart) {
            startScanning()
          }
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
        permissionError.value = true
      } else {
        emit('error', error as Error)
        showToast('摄像头初始化失败')
      }
    }
  }

  // 开始扫描
  const startScanning = () => {
    if (!isCameraReady.value || isScanning.value) return

    isScanning.value = true
    emit('start')

    // 开始扫描循环
    if (canvasRef.value && videoRef.value) {
      const canvas = canvasRef.value
      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (context) {
        canvas.width = videoRef.value.videoWidth
        canvas.height = videoRef.value.videoHeight

        // 模拟扫描过程
        scanningInterval.value = setInterval(() => {
          simulateScan()
        }, 1000)
      }
    }
  }

  // 停止扫描
  const stopScanning = () => {
    isScanning.value = false

    if (scanningInterval.value) {
      clearInterval(scanningInterval.value as any)
      scanningInterval.value = null
    }

    emit('stop')
  }

  // 切换摄像头
  const toggleCamera = async () => {
    if (isSwitchingCamera.value || !isCameraReady.value) return

    isSwitchingCamera.value = true
    stopScanning()

    // 释放当前流
    if (currentStream.value) {
      currentStream.value.getTracks().forEach(track => track.stop())
      currentStream.value = null
    }

    // 切换摄像头类型
    isFrontCamera.value = !isFrontCamera.value

    // 重新初始化
    await initCamera()
    isSwitchingCamera.value = false
  }

  // 切换闪光灯
  const toggleTorch = async () => {
    if (!isCameraReady.value || !hasTorch.value) return

    torchOn.value = !torchOn.value

    try {
      const track = currentStream.value?.getVideoTracks()[0]
      if (track && (track.getCapabilities() as any).torch) {
        await track.applyConstraints({
          torch: torchOn.value ? 'on' : 'off'
        } as any)
      }
    } catch (error) {
      console.error('闪光灯控制失败:', error)
      torchOn.value = false
    }
  }

  // 模拟扫描
  const simulateScan = () => {
    // 随机生成扫描结果
    const types: ('order' | 'product' | 'promotion')[] = ['order', 'product', 'promotion']
    const randomType = types[Math.floor(Math.random() * types.length)]

    const mockResult: ScanResult = {
      type: randomType,
      title:
        randomType === 'order' ? '订单核销' : randomType === 'product' ? '商品信息' : '促销活动',
      data: {
        orderNo: `ORD${Date.now()}`,
        productName: randomType === 'order' ? 'iPhone 15 Pro' : '华为 Mate 60',
        quantity: randomType === 'order' ? 1 : 0,
        amount: randomType === 'order' ? 8999 : 0,
        purchasedAt: new Date().toISOString(),
        status: randomType === 'order' ? 'pending' : undefined,
        productId: randomType === 'product' ? '2' : undefined,
        price: randomType === 'product' ? 6999 : undefined,
        stock: randomType === 'product' ? 50 : undefined,
        title: randomType === 'promotion' ? '新年大促' : undefined,
        description: randomType === 'promotion' ? '全场8折优惠' : undefined,
        discount: randomType === 'promotion' ? 200 : undefined
      }
    }

    handleScanResult(mockResult)
  }

  // 处理扫描结果
  const handleScanResult = (result: ScanResult) => {
    stopScanning()
    scanResult.value = result
    showResultPopup.value = true
    emit('success', result)
  }

  // 手动输入处理
  const handleManualInput = () => {
    if (!manualInput.value.trim()) {
      showToast('请输入内容')
      return
    }

    // 模拟手动输入结果
    const mockResult: ScanResult = {
      type: 'order',
      title: '订单核销',
      data: {
        orderNo: manualInput.value,
        productName: '手动输入订单',
        quantity: 1,
        amount: 999,
        purchasedAt: new Date().toISOString(),
        status: 'pending'
      }
    }

    handleScanResult(mockResult)
    manualInput.value = ''
    showManualInputDialog.value = false
  }

  // 关闭结果弹窗
  const closeResultPopup = () => {
    showResultPopup.value = false
    scanResult.value = null

    // 重新开始扫描
    if (props.autoStart) {
      startScanning()
    }
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

  // 获取订单状态文本
  const getOrderStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待核销',
      verified: '已核销',
      cancelled: '已取消'
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

  // 核销订单
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

  // 查看订单详情
  const viewOrderDetails = () => {
    showToast('正在跳转到订单详情...')
    closeResultPopup()
  }

  // 跳转到设置
  const goToSettings = () => {
    // 这里应该跳转到应用设置页面
    showToast('请手动在系统设置中开启摄像头权限')
  }

  // 重试初始化
  const retryInit = () => {
    permissionError.value = false
    initCamera()
  }

  // 组件挂载时初始化
  onMounted(() => {
    initCamera()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    stopScanning()

    if (currentStream.value) {
      currentStream.value.getTracks().forEach(track => track.stop())
      currentStream.value = null
    }
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;
  @use '@/styles/dialog-mixin.scss' as *;
  .qr-scanner {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .scanner-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
    border-radius: var(--van-radius-md);
    overflow: hidden;
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
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .loading-text {
        color: white;
        font-size: 14px;
      }
    }
  }

  .error-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    padding: 24px;

    .error-icon {
      color: var(--van-danger-color);
      margin-bottom: 16px;
    }

    .error-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--van-text-color);
      margin-bottom: 8px;
    }

    .error-text {
      font-size: 14px;
      color: var(--van-text-color-3);
      text-align: center;
      margin-bottom: 20px;
    }

    .error-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      max-width: 200px;
    }
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

  .scan-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    .overlay-top,
    .overlay-bottom,
    .overlay-left,
    .overlay-right {
      position: absolute;
      background: rgba(0, 0, 0, 0.5);
    }

    .overlay-top {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 50%;
      border-radius: var(--van-radius-md) var(--van-radius-md) 0 0;
    }

    .overlay-bottom {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 50%;
      border-radius: 0 0 var(--van-radius-md) var(--van-radius-md);
    }

    .overlay-left {
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      width: 20%;
      height: 60%;
    }

    .overlay-right {
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      width: 20%;
      height: 60%;
    }
  }

  .scan-indicator {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s;

    &.active {
      opacity: 1;
    }

    .indicator-pulse {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--van-success-color);
      animation: pulse 2s infinite;
    }

    .indicator-text {
      color: white;
      font-size: 12px;
      font-weight: 500;
      background: rgba(0, 0, 0, 0.7);
      padding: 4px 8px;
      border-radius: 4px;
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(7, 193, 96, 0.7);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(7, 193, 96, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(7, 193, 96, 0);
    }
  }

  .scan-controls {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 12px;

    .torch-on {
      color: var(--van-warning-color);
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

      .result-content {
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
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      }
    }
  }

  .scan-tips {
    text-align: center;
    margin-top: 12px;

    .tip-text {
      font-size: 12px;
      color: var(--van-text-color-3);
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .scanner-container {
      background: #1a1a1a;
    }

    .error-container {
      background: rgba(26, 26, 26, 0.95);
    }

    .result-popup .popup-header {
      border-bottom-color: var(--van-gray-6);
    }

    .tip-text {
      color: var(--van-text-color-3);
    }
  }

  // 响应式设计
  @media (max-width: 375px) {
    .scan-controls {
      padding: 8px;
      gap: 6px;

      .van-button {
        font-size: 12px;
        padding: 6px 12px;
      }
    }

    .scan-tips {
      margin-top: 8px;
    }
  }

  @media (max-width: 320px) {
    .scan-controls {
      .van-button {
        font-size: 11px;
        padding: 4px 8px;
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
    @include dialog-icon(#1989fa);
  }

  .dialog-title {
    @include dialog-title;
  }

  .dialog-input {
    margin-top: 16px;
    padding: 0 8px;
  }
</style>
