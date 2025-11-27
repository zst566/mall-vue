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
      <div class="scan-area">
        <!-- 摄像头预览 -->
        <div class="camera-preview">
          <video 
            ref="videoRef" 
            :class="{ 'facing-front': isFrontCamera }" 
            autoplay 
            playsinline 
            v-show="isCameraReady"
            style="width: 100%; height: 100%; object-fit: cover;"
          />
          <canvas ref="canvasRef" class="scan-canvas" />
        </div>

        <!-- 加载状态 -->
        <div v-if="loading && !isCameraReady" class="loading-container">
          <van-loading type="spinner" size="24px">正在启动摄像头...</van-loading>
          <p style="margin-top: 16px; color: rgba(255,255,255,0.8); font-size: 12px;">
            如果长时间无响应，请检查摄像头权限
          </p>
        </div>

        <!-- 初始化失败状态 -->
        <div v-if="!loading && !isCameraReady && initError" class="error-container">
          <van-icon name="warning-o" size="48px" color="#ff6b6b" />
          <p class="error-message">{{ initError }}</p>
          <van-button type="primary" size="small" @click="retryInit" style="margin-top: 16px;">
            重试
          </van-button>
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

    <!-- 手动输入订单号区域 -->
    <div class="manual-input-container">
      <div class="input-section">
        <van-field
          v-model="manualOrderNo"
          placeholder="请输入订单号或扫描二维码"
          clearable
          :disabled="isQuerying"
          class="order-input"
        >
          <template #left-icon>
            <van-icon name="orders-o" />
          </template>
        </van-field>
        <div class="input-actions">
          <van-button
            type="primary"
            size="large"
            round
            @click="queryOrderByNo"
            :loading="isQuerying"
            :disabled="!manualOrderNo || !manualOrderNo.trim()"
            class="query-button"
          >
            查询订单
          </van-button>
        </div>
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
                v-if="scanResult.data.status === 'pending' || scanResult.data.status === 'paid' || scanResult.data.status === 'PAID'"
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
      title=""
      :show-cancel-button="true"
      :confirm-button-text="'去设置'"
      :cancel-button-text="'取消'"
      @confirm="goToSettings"
      @cancel="showPermissionDialog = false"
      :close-on-click-overlay="false"
      class="standard-confirm-dialog"
      :width="320"
    >
      <div class="dialog-content">
        <div class="dialog-icon">
          <van-icon name="warning-o" size="48" />
        </div>
        <h3 class="dialog-title">权限申请</h3>
        <p class="dialog-message">
          需要访问摄像头权限，<br />
          请允许以使用扫描功能
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'
  import jsQR from 'jsqr'
  import { merchantService } from '@/services/merchant'
  import { merchantOperatorService } from '@/services/merchantOperator'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const authStore = useAuthStore()

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
  const scanHistory = ref<any[]>([]) // 改为空数组，从 API 加载真实数据

  // UI状态
  const loading = ref(false)
  const isVerifying = ref(false)
  const isQuerying = ref(false)
  const showResultPopup = ref(false)
  const showToastPopup = ref(false)
  const showPermissionDialog = ref(false)
  const initError = ref<string | null>(null)
  
  // 手动输入订单号
  const manualOrderNo = ref('')

  // Toast相关
  const toastIcon = ref('success')
  const toastType = ref('success')
  const toastMessage = ref('')

  // 检查可用设备
  const checkAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      console.log('📷 [扫描] 可用摄像头设备:', videoDevices.length, videoDevices)
      return videoDevices.length > 0
    } catch (error) {
      console.error('❌ [扫描] 枚举设备失败:', error)
      return false
    }
  }

  // 初始化摄像头
  const initCamera = async () => {
    try {
      loading.value = true
      initError.value = null
      console.log('📷 [扫描] 开始初始化摄像头...')

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ [扫描] 浏览器不支持摄像头功能')
        throw new Error('浏览器不支持摄像头功能，请使用支持摄像头的浏览器（如 Chrome、Safari）')
      }

      // 检查是否有可用设备
      const hasDevices = await checkAvailableDevices()
      if (!hasDevices) {
        console.warn('⚠️ [扫描] 未检测到摄像头设备')
        throw new Error('未检测到摄像头设备。请确保：\n1. 设备有摄像头\n2. 摄像头未被其他应用占用\n3. 在真实设备上测试（模拟器可能没有摄像头）')
      }

      // 请求摄像头权限
      const constraints = {
        video: {
          facingMode: isFrontCamera.value ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      console.log('📷 [扫描] 请求摄像头权限，约束条件:', constraints)

      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('摄像头初始化超时，请检查摄像头权限'))
        }, 10000) // 10秒超时
      })

      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        timeoutPromise
      ]) as MediaStream

      console.log('✅ [扫描] 摄像头权限获取成功')
      currentStream.value = stream

      // 等待 DOM 更新，确保 video 元素已经渲染
      await nextTick()
      
      // 再次检查 video 元素是否存在
      if (!videoRef.value) {
        console.error('❌ [扫描] 视频元素引用不存在，等待 DOM 更新...')
        // 再等待一次，给 Vue 更多时间渲染
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!videoRef.value) {
          console.error('❌ [扫描] 视频元素引用仍然不存在')
          throw new Error('视频元素未找到，请刷新页面重试')
        }
      }

      const videoElement = videoRef.value
      console.log('📹 [扫描] 视频元素已找到，设置视频流...')
      
      try {
        videoElement.srcObject = stream
        
        // 添加错误处理
        videoElement.onerror = (error) => {
          console.error('❌ [扫描] 视频元素错误:', error)
          loading.value = false
          isCameraReady.value = false
          showToast({ type: 'fail', message: '摄像头启动失败，请重试' })
        }

        videoElement.onloadedmetadata = () => {
          console.log('✅ [扫描] 视频元数据加载完成')
          console.log('📹 [扫描] 视频尺寸:', videoElement.videoWidth, 'x', videoElement.videoHeight)
          isCameraReady.value = true
          loading.value = false
          showToast({ type: 'success', message: '摄像头已就绪' })
        }

        // 添加播放错误处理
        videoElement.onplay = () => {
          console.log('✅ [扫描] 视频开始播放')
        }

        // 确保视频播放
        try {
          await videoElement.play()
          console.log('✅ [扫描] 视频播放成功')
        } catch (playError: any) {
          console.warn('⚠️ [扫描] 视频自动播放失败，可能需要用户交互:', playError)
          // 自动播放失败不是致命错误，继续执行
        }
      } catch (videoError: any) {
        console.error('❌ [扫描] 设置视频流失败:', videoError)
        throw new Error(`设置视频流失败: ${videoError?.message || '未知错误'}`)
      }
    } catch (error: any) {
      loading.value = false
      isCameraReady.value = false
      console.error('❌ [扫描] 摄像头初始化失败:', error)
      console.error('❌ [扫描] 错误详情:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })

      // 处理不同类型的错误
      if (
        error?.name === 'NotAllowedError' ||
        error?.name === 'PermissionDeniedError'
      ) {
        console.warn('⚠️ [扫描] 摄像头权限被拒绝')
        initError.value = '摄像头权限被拒绝，请在浏览器设置中允许摄像头权限'
        showPermissionDialog.value = true
      } else if (error?.name === 'NotFoundError' || error?.message?.includes('device not found')) {
        console.warn('⚠️ [扫描] 未找到摄像头设备')
        initError.value = '未找到摄像头设备。\n\n可能原因：\n• 设备没有摄像头\n• 摄像头被其他应用占用\n• 在模拟器中运行（模拟器没有摄像头）\n\n建议：\n• 在真实设备上测试\n• 关闭其他使用摄像头的应用\n• 检查设备摄像头是否正常'
        showToast({ type: 'fail', message: '未找到摄像头设备，请检查设备或使用真实设备测试' })
      } else if (error?.message?.includes('超时')) {
        console.warn('⚠️ [扫描] 摄像头初始化超时')
        initError.value = '摄像头初始化超时，请检查权限设置或重试'
        showToast({ type: 'fail', message: '摄像头初始化超时，请检查权限设置' })
      } else {
        const errorMsg = error?.message || '摄像头初始化失败，请重试'
        console.error('❌ [扫描] 其他错误:', errorMsg)
        initError.value = errorMsg
        showToast({ type: 'fail', message: errorMsg })
      }
    }
  }

  // 重试初始化
  const retryInit = async () => {
    console.log('🔄 [扫描] 用户点击重试，重新初始化摄像头')
    initError.value = null
    loading.value = true
    await initCamera()
  }

  // 开始扫描（手动开启摄像头）
  const startScan = async () => {
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

    isScanning.value = true

    // 开始扫描循环
    if (canvasRef.value && videoRef.value) {
      const canvas = canvasRef.value
      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (context && videoRef.value) {
        const video = videoRef.value
        
        // 设置 canvas 尺寸
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // 真实二维码扫描
        const scanFrame = () => {
          if (!isScanning.value || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
            return
          }

          try {
            // 将视频帧绘制到 canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            // 获取图像数据
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            
            // 使用 jsQR 识别二维码
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            })

            if (qrCode) {
              console.log('✅ [扫描] 识别到二维码:', qrCode.data)
              
              // 停止扫描
              stopScan()
              
              // 处理扫描结果（只提取订单号）
              processQRCode(qrCode.data)
            }
          } catch (error) {
            console.error('❌ [扫描] 二维码识别失败:', error)
          }
        }

        // 每 100ms 扫描一次（10fps）
        scanningInterval.value = setInterval(scanFrame, 100) as any
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

  // 处理二维码内容（只提取订单号，填入输入框）
  const processQRCode = (qrData: string) => {
    try {
      console.log('📋 [扫描] 处理二维码内容:', qrData)
      
      // 解析二维码内容（优先处理订单号格式，保留JSON格式兼容性）
      let orderNo: string | null = null

      // 优先处理：如果是订单号格式（以 ORD 开头），直接作为订单号
      if (qrData.startsWith('ORD')) {
        orderNo = qrData
      } 
      // 兼容处理：尝试解析为 JSON（旧格式）
      else {
        try {
          const parsed = JSON.parse(qrData)
          orderNo = parsed.orderNo || parsed.order_no || null
        } catch {
          // 如果不是 JSON，尝试作为订单号
          orderNo = qrData
        }
      }

      if (!orderNo) {
        showToast({ 
          type: 'fail', 
          message: '无法从二维码中解析订单号' 
        })
        return
      }

      // 将订单号自动填入输入框
      manualOrderNo.value = orderNo
      
      // 显示成功提示
      showToast({ 
        type: 'success', 
        message: '订单号已识别，请点击查询订单' 
      })
      
      console.log('✅ [扫描] 订单号已填入输入框:', orderNo)
    } catch (error: any) {
      console.error('❌ [扫描] 处理二维码失败:', error)
      showToast({ 
        type: 'fail', 
        message: error.message || '二维码识别失败，请重试' 
      })
    }
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

  // 检查权限
  const checkPermission = async () => {
    try {
      const status = await merchantOperatorService.getMyStatus()
      if (!status.hasBinding || !status.merchantUser) {
        showToast('您尚未绑定商户，请先申请')
        router.push('/customer/merchant-binding')
        return false
      }
      if (status.merchantUser.approvalStatus !== 'APPROVED' || !status.merchantUser.isActive) {
        showToast('您的商户权限已被取消或未审核通过')
        router.push('/customer/merchant-binding')
        return false
      }
      return true
    } catch (error) {
      console.error('检查权限失败:', error)
      showToast('权限验证失败')
      return false
    }
  }

  // 手动查询订单（根据订单号）
  const queryOrderByNo = async () => {
    if (!manualOrderNo.value || !manualOrderNo.value.trim()) {
      showToast({ type: 'fail', message: '请输入订单号' })
      return
    }

    const orderNo = manualOrderNo.value.trim()

    try {
      isQuerying.value = true
      showLoadingToast({ message: '正在查询订单信息...', forbidClick: true, duration: 0 })

      // 先通过订单号查询订单ID
      const ordersResponse = await merchantService.getMerchantOrders({ 
        search: orderNo,
        limit: 1 
      })
      
      if (!ordersResponse.orders || ordersResponse.orders.length === 0) {
        throw new Error('未找到对应的订单')
      }

      const orderId = ordersResponse.orders[0].id

      // 获取订单详情
      const orderDetail = await merchantService.getMerchantOrderDetail(orderId)
      
      console.log('✅ [查询] 订单详情获取成功:', orderDetail)
      
      // 处理金额字段：确保转换为数字类型
      // Prisma Decimal 类型可能是对象，需要转换为字符串再转换为数字
      const parseAmount = (value: any): number => {
        if (value == null) return 0
        if (typeof value === 'number') return value
        if (typeof value === 'string') return parseFloat(value) || 0
        // Prisma Decimal 类型有 toString() 方法
        if (typeof value === 'object' && value.toString) {
          return parseFloat(value.toString()) || 0
        }
        return 0
      }
      
      const totalAmount = parseAmount(orderDetail.totalAmount)
      const finalAmount = parseAmount(orderDetail.finalAmount)
      
      // 使用实付金额（finalAmount），如果为0则使用总金额（totalAmount）
      const orderAmount = finalAmount > 0 ? finalAmount : (totalAmount > 0 ? totalAmount : 0)
      
      console.log('💰 [查询] 订单金额:', { 
        totalAmountRaw: orderDetail.totalAmount, 
        totalAmountRawType: typeof orderDetail.totalAmount,
        finalAmountRaw: orderDetail.finalAmount,
        finalAmountRawType: typeof orderDetail.finalAmount,
        totalAmount, 
        finalAmount, 
        orderAmount,
        orderDetailKeys: Object.keys(orderDetail)
      })
      
      // 转换订单状态：后端返回大写（PAID），前端使用小写（paid）
      const statusMap: Record<string, string> = {
        'PENDING': 'pending',
        'PAID': 'paid',
        'VERIFIED': 'verified',
        'CANCELLED': 'cancelled',
        'REFUNDED': 'refunded',
        'REFUND_REQUESTED': 'refund_requested'
      }
      const normalizedStatus = statusMap[orderDetail.status as string] || orderDetail.status || 'pending'
      
      // 构建扫描结果
      const result = {
        type: 'order' as const,
        title: '订单核销',
        data: {
          id: orderDetail.id,
          orderId: orderDetail.id,
          orderNo: orderDetail.orderNo || orderNo,
          productName: orderDetail.items?.[0]?.productName || '商品',
          quantity: orderDetail.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 1,
          amount: orderAmount, // 使用处理后的金额
          status: normalizedStatus, // 使用转换后的状态
          purchasedAt: orderDetail.createdAt || new Date().toISOString()
        }
      }

      // 关闭 loading toast
      closeToast()
      // 关闭 loading toast
      closeToast()
      handleScanResult(result)
      isQuerying.value = false
    } catch (error: any) {
      console.error('❌ [查询] 查询订单失败:', error)
      // 先关闭 loading toast，再显示错误提示
      closeToast()
      // 直接使用错误消息（已经通过 handleApiError 处理，会优先使用 API 返回的错误信息）
      const errorMessage = error.message || '查询订单失败，请检查订单号是否正确'
      showToast({ 
        type: 'fail', 
        message: errorMessage,
        duration: 5000 // 显示5秒（延长2秒）
      })
    } finally {
      // 确保无论成功还是失败，都清理加载状态
      isQuerying.value = false
    }
  }

  // 确认核销
  const verifyOrder = async () => {
    if (!scanResult.value) return

    // 先检查权限
    const hasPermission = await checkPermission()
    if (!hasPermission) {
      return
    }

    try {
      isVerifying.value = true
      showLoadingToast({ message: '核销中...', forbidClick: true, duration: 0 })

      // 从扫描结果中提取订单ID或订单号
      let orderId = scanResult.value.data.orderId || scanResult.value.data.id
      const orderNo = scanResult.value.data.orderNo

      // 如果只有订单号，先查询订单ID
      if (!orderId && orderNo) {
        const ordersResponse = await merchantService.getMerchantOrders({ 
          search: orderNo,
          limit: 1 
        })
        
        if (ordersResponse.orders && ordersResponse.orders.length > 0) {
          orderId = ordersResponse.orders[0].id
        } else {
          throw new Error('未找到对应的订单')
        }
      }

      if (!orderId) {
        throw new Error('无法获取订单ID')
      }

      // 调用真实API进行核销（后端已支持订单号，这里使用订单ID）
      const result = await merchantService.verifyOrder(orderId, {
        operatorName: authStore.user?.nickname || '操作员',
        notes: manualOrderNo.value ? '手动核销' : '扫码核销'
      })

      // 更新扫描结果
      scanResult.value.data.status = 'verified'
      scanResult.value.data.verifiedAt = new Date().toISOString()
      scanResult.value.data.verificationResult = result

      // 清空输入框
      manualOrderNo.value = ''

      // 重新加载最近核销记录
      await loadRecentVerifications()

      // 关闭 loading toast，再显示成功提示
      closeToast()
      showToast({ type: 'success', message: '核销成功' })
      
      // 延迟关闭弹窗，让用户看到成功提示
      setTimeout(() => {
        closeResultPopup()
      }, 1500)
    } catch (error: any) {
      console.error('核销失败:', error)
      // 先关闭 loading toast，再显示错误提示
      closeToast()
      showToast({ type: 'fail', message: error.message || '核销失败，请重试' })
    } finally {
      // 确保无论成功还是失败，都清理加载状态
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

  // 加载最近核销记录
  const loadRecentVerifications = async () => {
    try {
      const result = await merchantOperatorService.getVerifications({
        date: 'today',
        page: 1,
        pageSize: 5
      })
      
      // 将核销记录转换为扫描历史格式
      scanHistory.value = result.list.map((record: any) => ({
        id: record.id,
        type: 'order',
        title: '订单核销',
        description: record.promotionName || '商品',
        scannedAt: record.verifiedAt,
        status: 'success',
        data: {
          orderId: record.orderId,
          orderNo: record.orderNo,
          productName: record.promotionName || '商品',
          quantity: 1,
          amount: record.amount,
          status: 'verified',
          purchasedAt: record.verifiedAt
        }
      }))
    } catch (error: any) {
      console.error('加载核销记录失败:', error)
      // 静默失败，不影响主功能
    }
  }

  // 返回上一页
  const onClickLeft = () => {
    router.back()
  }

  // 组件挂载时初始化（只检查权限，不自动开启摄像头）
  onMounted(async () => {
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
    stopScan()

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
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: #000;
    color: white;
  }

  .error-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: #000;
    padding: 20px;
    text-align: center;

    .error-message {
      color: var(--theme-text-on-glass, $text-color-primary);
      font-size: 14px;
      margin-top: 16px;
      line-height: 1.6;
      white-space: pre-line;
      max-width: 80%;
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

  .manual-input-container {
    margin: 16px;
    @include glassmorphism-card(base);
    padding: 16px;
    border-radius: var(--van-radius-lg);

    .input-section {
      .order-input {
        margin-bottom: 12px;
        background: var(--van-background-2);
        border-radius: var(--van-radius-md);
      }

      .input-actions {
        .query-button {
          width: 100%;
        }
      }
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
        @include glassmorphism-card(light);
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
