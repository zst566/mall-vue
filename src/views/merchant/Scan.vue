<template>
  <div class="scan-page">
    <!-- 顶部导航 -->
    <van-nav-bar title="订单核销" left-arrow @click-left="onClickLeft" fixed z-index="100">
      <template #right>
        <van-icon name="setting-o" @click="goToSettings" />
      </template>
    </van-nav-bar>

    <!-- 扫描区域 -->
    <div class="scan-container">
      <ScanCameraArea
        ref="cameraAreaRef"
        :is-camera-ready="isCameraReady"
        :is-scanning="isScanning"
        :loading="loading"
        :init-error="initError"
        :is-front-camera="isFrontCamera"
        @retry-init="retryInit"
      />
      
      <ScanActions
        :is-scanning="isScanning"
        :is-front-camera="isFrontCamera"
        @start-scan="handleStartScan"
        @stop-scan="handleStopScan"
        @toggle-camera="handleToggleCamera"
      />
    </div>

    <!-- 手动输入订单号区域 -->
    <ManualOrderInput
      v-model="manualOrderNo"
      :is-querying="isQuerying"
      @query="handleQueryOrder"
    />

    <!-- 最近扫描记录 -->
    <ScanHistory
      :history="scanHistory"
      @view-detail="viewScanDetail"
      @go-to-history="goToHistory"
    />

    <!-- 扫描结果弹窗 -->
    <ScanResultPopup
      v-model="showResultPopup"
      :scan-result="scanResult"
      :is-verifying="isVerifying"
      @verify="handleVerifyOrder"
    />

    <!-- 权限提示 -->
    <CameraPermissionDialog
      v-model="showPermissionDialog"
      @go-to-settings="goToSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import ScanCameraArea from '@/components/merchant/ScanCameraArea.vue'
import ScanActions from '@/components/merchant/ScanActions.vue'
import ManualOrderInput from '@/components/merchant/ManualOrderInput.vue'
import ScanHistory from '@/components/merchant/ScanHistory.vue'
import ScanResultPopup from '@/components/merchant/ScanResultPopup.vue'
import CameraPermissionDialog from '@/components/merchant/CameraPermissionDialog.vue'
import { useCamera } from '@/composables/useCamera'
import { useQRCodeScanner } from '@/composables/useQRCodeScanner'
import { useOrderQuery } from '@/composables/useOrderQuery'
import { useOrderVerification } from '@/composables/useOrderVerification'
import { useScanHistory } from '@/composables/useScanHistory'
import { useMerchantPermission } from '@/composables/useMerchantPermission'
import type { ScanResult } from '@/types/scan'

const router = useRouter()

// 获取子组件的 ref
const cameraAreaRef = ref<InstanceType<typeof ScanCameraArea> | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 摄像头管理（需要 videoRef）
const {
  isCameraReady,
  isFrontCamera,
  loading,
  initError,
  initCamera,
  closeCamera,
  toggleCamera: cameraToggleCamera,
  retryInit
} = useCamera(videoRef)

// 二维码扫描
const {
  isScanning,
  startScan: scannerStartScan,
  stopScan: scannerStopScan
} = useQRCodeScanner(videoRef, canvasRef, closeCamera)

// 订单查询
const {
  isQuerying,
  queryOrderByNo
} = useOrderQuery()

// 订单核销
const {
  isVerifying,
  verifyOrder: verifyOrderApi
} = useOrderVerification()

// 扫描历史
const {
  scanHistory,
  loadRecentVerifications
} = useScanHistory()

// 商户权限
const { checkPermission } = useMerchantPermission()

// UI状态
const manualOrderNo = ref('')
const scanResult = ref<ScanResult | null>(null)
const showResultPopup = ref(false)
const showPermissionDialog = ref(false)

// 初始化时获取子组件的 refs
onMounted(async () => {
  await nextTick()
  // 等待子组件渲染完成后再获取 refs
  await nextTick()
  if (cameraAreaRef.value) {
    videoRef.value = cameraAreaRef.value.videoRef
    canvasRef.value = cameraAreaRef.value.canvasRef
  }
  
  
  console.log('📱 [扫描] 组件已挂载，开始初始化...')
  
  try {
    // 先检查权限
    console.log('🔐 [扫描] 检查商户权限...')
    const hasPermission = await checkPermission()
    
    if (!hasPermission) {
      console.warn('⚠️ [扫描] 权限检查失败，无法使用扫描功能')
      loading.value = false
    } else {
      console.log('✅ [扫描] 权限检查通过，等待用户手动开启摄像头')
      loading.value = false
      // 加载最近核销记录
      await loadRecentVerifications()
    }
  } catch (error) {
    console.error('❌ [扫描] 初始化过程出错:', error)
    loading.value = false
    showToast({ type: 'fail', message: '初始化失败，请刷新页面重试' })
  }
})

// 组件卸载时清理
onUnmounted(() => {
  closeCamera()
})

// 开始扫描（手动开启摄像头）
const handleStartScan = async () => {
  // 如果摄像头未就绪，先初始化摄像头
  if (!isCameraReady.value) {
    try {
      // 先检查权限
      const hasPermission = await checkPermission()
      if (!hasPermission) {
        return
      }
      
      // 初始化摄像头
      await initCamera()
      
      // 等待摄像头就绪
      if (!isCameraReady.value) {
        showToast({ type: 'fail', message: '摄像头启动失败，请重试' })
        return
      }
    } catch (error: any) {
      console.error('❌ [扫描] 初始化摄像头失败:', error)
      showToast({ type: 'fail', message: error.message || '摄像头启动失败' })
      return
    }
  }

  // 如果权限被拒绝，显示权限对话框
  if (initError.value?.includes('权限被拒绝')) {
    showPermissionDialog.value = true
    return
  }

  // 开始扫描，传入回调处理扫描结果
  scannerStartScan(handleQRCodeScanned)
}

// 停止扫描
const handleStopScan = () => {
  scannerStopScan()
}

// 切换摄像头
const handleToggleCamera = async () => {
  scannerStopScan()
  await cameraToggleCamera()
  // 如果摄像头已就绪，重新开始扫描
  if (isCameraReady.value) {
    scannerStartScan(handleQRCodeScanned)
  }
}

// 处理二维码扫描结果
const handleQRCodeScanned = async (orderNo: string) => {
  // 将订单号自动填入输入框
  manualOrderNo.value = orderNo
  
  // 自动查询订单
  await handleQueryOrder()
}

// 手动查询订单
const handleQueryOrder = async () => {
  if (!manualOrderNo.value || !manualOrderNo.value.trim()) {
    showToast({ type: 'fail', message: '请输入订单号' })
    return
  }

  try {
    const result = await queryOrderByNo(manualOrderNo.value.trim())
    if (result) {
      handleScanResult(result)
    }
  } catch (error: any) {
    const errorMessage = error.message || '查询订单失败，请检查订单号是否正确'
    showToast({ 
      type: 'fail', 
      message: errorMessage,
      duration: 5000
    })
  }
}

// 处理扫描结果
const handleScanResult = (result: ScanResult) => {
  scanResult.value = result
  showResultPopup.value = true

  // 添加到历史记录
  const newRecord = {
    id: Date.now().toString(),
    type: result.type,
    title: result.title,
    description: result.data.productName || '商品',
    scannedAt: new Date().toISOString(),
    status: 'success' as const,
    data: result.data
  }

  scanHistory.value.unshift(newRecord)
  if (scanHistory.value.length > 5) {
    scanHistory.value = scanHistory.value.slice(0, 5)
  }

  scannerStopScan()
}

// 确认核销
const handleVerifyOrder = async () => {
  if (!scanResult.value) return

  // 先检查权限
  const hasPermission = await checkPermission()
  if (!hasPermission) {
    return
  }

  try {
    const orderId = scanResult.value.data.orderId || scanResult.value.data.id
    const orderNo = scanResult.value.data.orderNo

    await verifyOrderApi(orderId || '', orderNo, {
      operatorName: '操作员',
      notes: manualOrderNo.value ? '手动核销' : '扫码核销'
    })

    // 更新扫描结果
    scanResult.value.data.status = 'verified'
    scanResult.value.data.verifiedAt = new Date().toISOString()

    // 清空输入框
    manualOrderNo.value = ''

    // 重新加载最近核销记录
    await loadRecentVerifications()

    // 延迟关闭弹窗，让用户看到成功提示
    setTimeout(() => {
      closeResultPopup()
    }, 1500)
  } catch (error) {
    // 错误已在 composable 中处理
  }
}

// 关闭结果弹窗
const closeResultPopup = () => {
  showResultPopup.value = false
  scanResult.value = null
}

// 查看扫描详情
const viewScanDetail = (record: any) => {
  scanResult.value = {
    type: record.type,
    title: record.title,
    data: record.data
  }
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

</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.scan-page {
  min-height: 100vh;
  background: var(--theme-bg-gradient, $glass-bg-gradient);
  background-attachment: fixed;
  background-size: cover;
  padding-top: 46px;
  padding-bottom: 20px;
}

.scan-container {
  margin: 16px;
  border-radius: var(--van-radius-lg);
  overflow: hidden;
  @include glassmorphism-card(base);
}

@media (max-width: 375px) {
  .scan-container {
    margin: 12px;
  }
}

@media (max-width: 320px) {
  .scan-container {
    margin: 8px;
  }
}

@media (prefers-color-scheme: dark) {
  .scan-page {
    background-color: var(--van-background-3);
  }

  .scan-container {
    background: var(--van-background-3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}
</style>
