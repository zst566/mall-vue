/**
 * 摄像头管理 Composable
 */
import { ref, type Ref } from 'vue'
import { nextTick } from 'vue'
import { showToast } from 'vant'

export interface UseCameraReturn {
  isCameraReady: Ref<boolean>
  isFrontCamera: Ref<boolean>
  loading: Ref<boolean>
  initError: Ref<string | null>
  currentStream: Ref<MediaStream | null>
  initCamera: () => Promise<void>
  closeCamera: () => void
  toggleCamera: () => Promise<void>
  retryInit: () => Promise<void>
  checkAvailableDevices: () => Promise<boolean>
}

export function useCamera(videoRef: Ref<HTMLVideoElement | null>): UseCameraReturn {
  const isCameraReady = ref(false)
  const isFrontCamera = ref(false)
  const loading = ref(false)
  const initError = ref<string | null>(null)
  const currentStream = ref<MediaStream | null>(null)

  /**
   * 检查可用设备
   */
  const checkAvailableDevices = async (): Promise<boolean> => {
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

  /**
   * 初始化摄像头
   */
  const initCamera = async (): Promise<void> => {
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
      
      throw error
    }
  }

  /**
   * 重试初始化
   */
  const retryInit = async (): Promise<void> => {
    console.log('🔄 [扫描] 用户点击重试，重新初始化摄像头')
    initError.value = null
    loading.value = true
    await initCamera()
  }

  /**
   * 关闭摄像头
   */
  const closeCamera = (): void => {
    console.log('📷 [扫描] 关闭摄像头...')
    
    // 停止所有视频轨道
    if (currentStream.value) {
      currentStream.value.getTracks().forEach(track => {
        track.stop()
        console.log('✅ [扫描] 视频轨道已停止:', track.kind)
      })
      currentStream.value = null
    }
    
    // 清空视频元素的源
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    
    // 更新状态
    isCameraReady.value = false
    console.log('✅ [扫描] 摄像头已关闭')
  }

  /**
   * 切换摄像头
   */
  const toggleCamera = async (): Promise<void> => {
    isFrontCamera.value = !isFrontCamera.value

    // 释放当前流
    if (currentStream.value) {
      currentStream.value.getTracks().forEach(track => track.stop())
      currentStream.value = null
    }

    // 重新初始化摄像头
    await initCamera()
  }

  return {
    isCameraReady,
    isFrontCamera,
    loading,
    initError,
    currentStream,
    initCamera,
    closeCamera,
    toggleCamera,
    retryInit,
    checkAvailableDevices
  }
}

