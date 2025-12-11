/**
 * 二维码扫描 Composable
 */
import { ref, type Ref } from 'vue'
import { nextTick } from 'vue'
import { showToast } from 'vant'
import jsQR from 'jsqr'
import { parseQRCodeData } from '@/utils/scanHelpers'

export interface UseQRCodeScannerReturn {
  isScanning: Ref<boolean>
  scanningInterval: Ref<NodeJS.Timeout | null>
  startScan: (onQRCodeScanned?: (orderNo: string) => void) => void
  stopScan: () => void
  processQRCode: (qrData: string, onOrderNoParsed: (orderNo: string) => void) => Promise<void>
}

export function useQRCodeScanner(
  videoRef: Ref<HTMLVideoElement | null>,
  canvasRef: Ref<HTMLCanvasElement | null>,
  closeCamera: () => void
): UseQRCodeScannerReturn {
  const isScanning = ref(false)
  const scanningInterval = ref<NodeJS.Timeout | null>(null)

  /**
   * 开始扫描
   */
  const startScan = (onQRCodeScanned?: (orderNo: string) => void): void => {
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
              
              // 立即关闭摄像头，减少资源消耗
              closeCamera()
              
              // 处理扫描结果（只提取订单号）
              if (onQRCodeScanned) {
                processQRCode(qrCode.data, onQRCodeScanned)
              } else {
                processQRCode(qrCode.data, () => {})
              }
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

  /**
   * 停止扫描
   */
  const stopScan = (): void => {
    isScanning.value = false

    if (scanningInterval.value) {
      clearInterval(scanningInterval.value as any)
      scanningInterval.value = null
    }
  }

  /**
   * 处理二维码内容（只提取订单号）
   */
  const processQRCode = async (
    qrData: string,
    onOrderNoParsed: (orderNo: string) => void
  ): Promise<void> => {
    try {
      console.log('📋 [扫描] 处理二维码内容:', qrData)
      
      // 解析二维码内容
      const orderNo = parseQRCodeData(qrData)

      if (!orderNo) {
        showToast({ 
          type: 'fail', 
          message: '无法从二维码中解析订单号' 
        })
        return
      }

      // 显示成功提示
      showToast({ 
        type: 'success', 
        message: '订单号已识别，正在查询订单...' 
      })
      
      console.log('✅ [扫描] 订单号已识别:', orderNo)
      
      // 等待 DOM 更新后调用回调
      await nextTick()
      
      // 稍微延迟一下，让用户看到成功提示
      setTimeout(() => {
        onOrderNoParsed(orderNo)
      }, 300)
    } catch (error: any) {
      console.error('❌ [扫描] 处理二维码失败:', error)
      showToast({ 
        type: 'fail', 
        message: error.message || '二维码识别失败，请重试' 
      })
    }
  }

  return {
    isScanning,
    scanningInterval,
    startScan,
    stopScan,
    processQRCode
  }
}




