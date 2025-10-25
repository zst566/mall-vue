<template>
  <div class="order-verification">
    <!-- 核销信息显示 -->
    <div class="verification-info" v-if="verificationResult">
      <van-icon
        :name="verificationResult.success ? 'success' : 'close'"
        :color="verificationResult.success ? '#10B981' : '#EF4444'"
        size="48"
      />

      <h3 :class="{ success: verificationResult.success, error: !verificationResult.success }">
        {{ verificationResult.success ? '核销成功' : '核销失败' }}
      </h3>

      <p class="verification-message">{{ verificationResult.message }}</p>

      <div v-if="verificationResult.success && verificationResult.order" class="order-details">
        <div class="detail-item">
          <span class="label">订单号:</span>
          <span class="value">{{ verificationResult.order.orderNo }}</span>
        </div>
        <div class="detail-item">
          <span class="label">金额:</span>
          <span class="value amount">
            ¥{{ formatAmount(verificationResult.order.totalAmount) }}
          </span>
        </div>
        <div class="detail-item">
          <span class="label">时间:</span>
          <span class="value">{{ formatTime(verificationResult.order.createdAt) }}</span>
        </div>
      </div>

      <van-button type="primary" block @click="scanNewOrder" style="margin-top: 20px">
        扫描下一个订单
      </van-button>
    </div>

    <!-- 扫码状态 -->
    <div class="scanning-state" v-else-if="scanning">
      <div class="scanner-content">
        <div class="scanner-frame">
          <div class="scanner-inner">
            <van-icon name="scan" size="64" color="#3A82F6" />
          </div>
          <div class="scanner-animation"></div>
        </div>

        <p class="scan-text">将二维码放入框内，即可自动扫描</p>
        <p class="scan-hint">请确保二维码清晰可见且光线充足</p>
      </div>

      <van-button type="default" block @click="stopScanning" style="margin-top: 20px">
        停止扫描
      </van-button>
    </div>

    <!-- 等待扫描 -->
    <div class="waiting-state" v-else>
      <div class="waiting-content">
        <van-icon name="qr-code" size="64" color="#3A82F6" />
        <h3>订单核销</h3>
        <p class="waiting-text">点击下方按钮开始扫描二维码</p>

        <div class="manual-input">
          <van-field
            v-model="manualOrderId"
            placeholder="或手动输入订单号"
            maxlength="20"
            :rules="[{ required: false }]"
          />
        </div>
      </div>

      <div class="action-buttons">
        <van-button type="primary" block @click="startScanning" :loading="scanning">
          {{ scanning ? '扫描中...' : '开始扫码' }}
        </van-button>

        <van-button
          v-if="manualOrderId"
          type="warning"
          block
          @click="verifyByOrderId"
          :loading="verifying"
          style="margin-top: 10px"
        >
          手动核销
        </van-button>
      </div>
    </div>

    <!-- 音频反馈 -->
    <audio ref="successAudio" preload="auto">
      <source src="/sounds/success.mp3" type="audio/mpeg" />
    </audio>
    <audio ref="errorAudio" preload="auto">
      <source src="/sounds/error.mp3" type="audio/mpeg" />
    </audio>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, onUnmounted } from 'vue'
  import { showToast, showLoadingToast } from 'vant'
  import { merchantService } from '@/services/merchant'
  import { useAuthStore } from '@/stores/auth'

  // 核销状态
  const scanning = ref(false)
  const verifying = ref(false)
  const manualOrderId = ref('')

  // 核销结果
  const verificationResult = ref<{
    success: boolean
    message: string
    order?: any
  } | null>(null)

  // 音频引用
  const successAudio = ref<HTMLAudioElement | null>(null)
  const errorAudio = ref<HTMLAudioElement | null>(null)

  // 认证store
  const authStore = useAuthStore()

  // 操作员信息
  const operatorInfo = reactive({
    name: authStore.user?.nickname || '操作员',
    id: authStore.user?.id || 'unknown'
  })

  // 开始扫描
  const startScanning = () => {
    scanning.value = true
    verificationResult.value = null

    // 清空手动输入
    manualOrderId.value = ''

    // 开始扫描逻辑
    initScanner()
  }

  // 停止扫描
  const stopScanning = () => {
    scanning.value = false

    // 停止扫描器
    if (scanner) {
      scanner.stop()
      scanner = null
    }

    // 清理定时器
    if (scanTimer) {
      clearInterval(scanTimer as any)
      scanTimer = null
    }
  }

  // 手动核销
  const verifyByOrderId = async () => {
    if (!manualOrderId.value.trim()) {
      showToast('请输入订单号')
      return
    }

    verifying.value = true

    try {
      const result = await merchantService.verifyOrder(manualOrderId.value, {
        operatorName: operatorInfo.name,
        notes: '手动核销'
      })

      // 播放成功音效
      playSuccessSound()

      // 显示核销结果
      verificationResult.value = {
        success: true,
        message: '核销成功',
        order: result
      }

      showToast({
        message: '核销成功',
        type: 'success'
      })

      // 记录核销日志
      logVerification({
        orderId: manualOrderId.value,
        success: true,
        operatorName: operatorInfo.name
      })
    } catch (error: any) {
      // 播放错误音效
      playErrorSound()

      verificationResult.value = {
        success: false,
        message: error.message || '核销失败'
      }

      showToast({
        message: error.message || '核销失败',
        type: 'fail'
      })

      // 记录核销日志
      logVerification({
        orderId: manualOrderId.value,
        success: false,
        operatorName: operatorInfo.name,
        error: error.message
      })
    } finally {
      verifying.value = false
    }
  }

  // 扫描新订单
  const scanNewOrder = () => {
    verificationResult.value = null
    startScanning()
  }

  // 初始化扫描器
  let scanner: any = null
  let scanTimer: NodeJS.Timeout | null = null

  const initScanner = () => {
    try {
      // 这里应该集成实际的扫描库
      // 例如：zxing-js/qr-scanner 或类似的扫描库

      // 模拟扫描过程
      scanTimer = setInterval(() => {
        // 模拟随机找到二维码
        if (Math.random() > 0.8) {
          // 20% 概率找到二维码
          simulateQRCodeScan()
        }
      }, 1000) as any
    } catch (error) {
      console.error('Failed to init scanner:', error)
      showToast('扫描器初始化失败')
    }
  }

  // 模拟二维码扫描
  const simulateQRCodeScan = () => {
    // 停止扫描
    stopScanning()

    // 模拟获取到的二维码内容
    const mockQRCodeContent = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    // 自动核销
    verifyQRCode(mockQRCodeContent)
  }

  // 验证二维码
  const verifyQRCode = async (qrContent: string) => {
    try {
      // 解析二维码内容（假设包含订单ID）
      const orderId = qrContent.replace('ORDER_', '')

      if (!orderId) {
        throw new Error('无效的二维码内容')
      }

      verifying.value = true

      const result = await merchantService.verifyOrder(orderId, {
        operatorName: operatorInfo.name,
        notes: '扫码核销'
      })

      // 播放成功音效
      playSuccessSound()

      // 显示核销结果
      verificationResult.value = {
        success: true,
        message: '核销成功',
        order: result
      }

      showToast({
        message: '核销成功',
        type: 'success'
      })

      // 记录核销日志
      logVerification({
        orderId,
        success: true,
        operatorName: operatorInfo.name,
        method: 'qr_code'
      })
    } catch (error: any) {
      // 播放错误音效
      playErrorSound()

      verificationResult.value = {
        success: false,
        message: error.message || '核销失败'
      }

      showToast({
        message: error.message || '核销失败',
        type: 'fail'
      })

      // 记录核销日志
      const orderId = qrContent.replace('ORDER_', '')
      logVerification({
        orderId,
        success: false,
        operatorName: operatorInfo.name,
        method: 'qr_code',
        error: error.message
      })
    } finally {
      verifying.value = false
    }
  }

  // 播放成功音效
  const playSuccessSound = () => {
    if (successAudio.value) {
      successAudio.value.currentTime = 0
      successAudio.value.play().catch(console.error)
    }
  }

  // 播放错误音效
  const playErrorSound = () => {
    if (errorAudio.value) {
      errorAudio.value.currentTime = 0
      errorAudio.value.play().catch(console.error)
    }
  }

  // 记录核销日志
  const logVerification = (log: {
    orderId: string
    success: boolean
    operatorName: string
    method?: string
    error?: string
  }) => {
    console.log('Verification log:', log)

    // 这里应该调用API记录核销日志
    // 例如：merchantService.logVerification(log)
  }

  // 格式化金额
  const formatAmount = (amount: number): string => {
    return amount.toFixed(2)
  }

  // 格式化时间
  const formatTime = (time: string): string => {
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 生命周期钩子
  onMounted(() => {
    // 初始化音频
    successAudio.value = document.querySelector('audio[src="/sounds/success.mp3"]')
    errorAudio.value = document.querySelector('audio[src="/sounds/error.mp3"]')

    // 如果音频文件不存在，使用简单的音效
    if (!successAudio.value) {
      successAudio.value = {
        play: () => {
          // 使用Web Audio API创建简单音效
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.value = 800
          oscillator.type = 'sine'
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
        }
      } as any
    }

    if (!errorAudio.value) {
      errorAudio.value = {
        play: () => {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.value = 300
          oscillator.type = 'square'
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        }
      } as any
    }
  })

  onUnmounted(() => {
    // 清理资源
    stopScanning()
  })
</script>

<style scoped lang="scss">
  .order-verification {
    padding: 20px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .verification-info {
    background: white;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    margin-bottom: 20px;
  }

  .verification-info.success h3 {
    color: #10b981;
  }

  .verification-info.error h3 {
    color: #ef4444;
  }

  .verification-message {
    color: #666;
    margin: 15px 0;
    line-height: 1.5;
  }

  .order-details {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
    text-align: left;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
  }

  .detail-item:last-child {
    border-bottom: none;
  }

  .detail-item .label {
    font-size: 14px;
    color: #666;
  }

  .detail-item .value {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  .detail-item .amount {
    color: #ef4444;
    font-weight: bold;
  }

  .scanning-state {
    background: white;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .scanner-content {
    margin-bottom: 20px;
  }

  .scanner-frame {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto 20px;
  }

  .scanner-inner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }

  .scanner-animation {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 3px solid #3a82f6;
    border-radius: 8px;
    animation: scan-pulse 2s ease-in-out infinite;
  }

  @keyframes scan-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(58, 130, 246, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(58, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(58, 130, 246, 0);
    }
  }

  .scan-text {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
  }

  .scan-hint {
    font-size: 14px;
    color: #666;
    margin: 0;
  }

  .waiting-state {
    background: white;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .waiting-content {
    margin-bottom: 30px;
  }

  .waiting-content h3 {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin: 20px 0 15px;
  }

  .waiting-text {
    font-size: 16px;
    color: #666;
    margin: 0 0 20px;
  }

  .manual-input {
    margin-bottom: 20px;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  @media (max-width: 480px) {
    .order-verification {
      padding: 15px;
    }

    .verification-info,
    .scanning-state,
    .waiting-state {
      padding: 20px;
    }

    .scanner-frame {
      width: 150px;
      height: 150px;
    }
  }
</style>
