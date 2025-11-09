import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MerchantOrder, RefundRequest } from '@/types'

interface MerchantOrderResponse {
  success: boolean
  data: MerchantOrder
  message?: string
}

interface MerchantOrdersResponse {
  success: boolean
  data: MerchantOrder[]
  message?: string
}

interface RefundResponse {
  success: boolean
  message?: string
}

export const useMerchantOrderStore = defineStore('merchantOrder', () => {
  // 状态
  const orderList = ref<MerchantOrder[]>([])
  const currentOrder = ref<MerchantOrder | null>(null)
  const isLoading = ref(false)
  const error = ref<string>('')

  // 获取商户订单列表
  const getMerchantOrdersList = async (status?: string): Promise<MerchantOrdersResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.get('/merchant/orders', { params: { status } })

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockData: MerchantOrder[] = [
        {
          id: '1',
          orderNo: 'MERCHANT20241018001',
          customerId: 'customer1',
          customerName: '张三',
          customerPhone: '13800138000',
          customerAvatar: '/avatars/customer1.jpg',
          status: 'confirmed',
          paymentMethod: 'wechat',
          paymentStatus: 'paid',
          totalAmount: 8999.00,
          createdAt: '2024-10-18T10:00:00Z',
          updatedAt: '2024-10-18T15:00:00Z',
          paidAt: '2024-10-18T10:30:00Z',
          confirmedAt: '2024-10-18T10:35:00Z',
          receiverName: '张三',
          receiverPhone: '13800138000',
          shippingAddress: {
            province: '广东省',
            city: '广州市',
            district: '天河区',
            detail: '天河路123号'
          },
          items: [
            {
              id: 'item1',
              productId: 'product1',
              productName: 'iPhone 15 Pro',
              productImage: '/images/iphone15.jpg',
              quantity: 1,
              price: 8999.00,
              totalPrice: 8999.00,
              specification: '256GB 深空黑色'
            }
          ],
          notes: '请尽快发货，谢谢'
        },
        {
          id: '2',
          orderNo: 'MERCHANT20241017002',
          customerId: 'customer2',
          customerName: '李四',
          customerPhone: '13900139000',
          customerAvatar: '/avatars/customer2.jpg',
          status: 'pending',
          paymentMethod: 'alipay',
          paymentStatus: 'unpaid',
          totalAmount: 2999.00,
          createdAt: '2024-10-17T14:00:00Z',
          updatedAt: '2024-10-17T14:00:00Z',
          receiverName: '李四',
          receiverPhone: '13900139000',
          shippingAddress: {
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            detail: '科技园456号'
          },
          items: [
            {
              id: 'item2',
              productId: 'product2',
              productName: 'iPad Air',
              productImage: '/images/ipad.jpg',
              quantity: 1,
              price: 2999.00,
              totalPrice: 2999.00,
              specification: '64GB Wi-Fi版'
            }
          ],
          notes: ''
        },
        {
          id: '3',
          orderNo: 'MERCHANT20241016003',
          customerId: 'customer3',
          customerName: '王五',
          customerPhone: '13700137000',
          customerAvatar: '/avatars/customer3.jpg',
          status: 'verified',
          paymentMethod: 'wechat',
          paymentStatus: 'paid',
          totalAmount: 1599.00,
          createdAt: '2024-10-16T09:00:00Z',
          updatedAt: '2024-10-16T16:00:00Z',
          paidAt: '2024-10-16T09:30:00Z',
          confirmedAt: '2024-10-16T10:00:00Z',
          verifiedAt: '2024-10-16T16:00:00Z',
          receiverName: '王五',
          receiverPhone: '13700137000',
          shippingAddress: {
            province: '广东省',
            city: '广州市',
            district: '白云区',
            detail: '白云大道789号'
          },
          items: [
            {
              id: 'item3',
              productId: 'product3',
              productName: 'AirPods Pro',
              productImage: '/images/airpods.jpg',
              quantity: 1,
              price: 1599.00,
              totalPrice: 1599.00,
              specification: '第二代'
            }
          ],
          notes: '请在工作日送达'
        }
      ]

      // 根据状态过滤
      if (status) {
        orderList.value = mockData.filter(order => order.status === status)
      } else {
        orderList.value = mockData
      }

      return {
        success: true,
        data: orderList.value,
        message: '订单列表获取成功'
      }
    } catch (err) {
      console.error('获取商户订单列表失败:', err)
      error.value = '获取商户订单列表失败'
      return {
        success: false,
        data: [],
        message: '获取商户订单列表失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 获取商户订单详情
  const getMerchantOrderDetail = async (id: string): Promise<MerchantOrderResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.get(`/merchant/orders/${id}`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const mockOrder: MerchantOrder = {
        id,
        orderNo: `MERCHANT${id}00${Math.floor(Math.random() * 100)}`,
        customerId: 'customer1',
        customerName: '张三',
        customerPhone: '13800138000',
        customerAvatar: '/avatars/customer1.jpg',
        status: 'confirmed',
        paymentMethod: 'wechat',
        paymentStatus: 'paid',
        totalAmount: 8999.00,
        createdAt: '2024-10-15T10:00:00Z',
        updatedAt: '2024-10-18T15:00:00Z',
        paidAt: '2024-10-15T10:30:00Z',
        confirmedAt: '2024-10-18T10:35:00Z',
        receiverName: '张三',
        receiverPhone: '13800138000',
        shippingAddress: {
          province: '广东省',
          city: '广州市',
          district: '天河区',
          detail: '天河路123号'
        },
        items: [
          {
            id: 'item4',
            productId: 'product1',
            productName: 'iPhone 15 Pro',
            productImage: '/images/iphone15.jpg',
            quantity: 1,
            price: 8999.00,
            totalPrice: 8999.00,
            specification: '256GB 深空黑色'
          }
        ],
        notes: '请尽快发货，谢谢'
      }

      currentOrder.value = mockOrder

      return {
        success: true,
        data: mockOrder,
        message: '订单详情获取成功'
      }
    } catch (err) {
      console.error('获取商户订单详情失败:', err)
      error.value = '获取商户订单详情失败'
      return {
        success: false,
        data: {} as MerchantOrder,
        message: '获取商户订单详情失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 确认订单
  const confirmMerchantOrder = async (id: string): Promise<RefundResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.put(`/merchant/orders/${id}/confirm`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const index = orderList.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orderList.value[index] = {
          ...orderList.value[index],
          status: 'confirmed',
          updatedAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString()
        }

        if (currentOrder.value?.id === id) {
          currentOrder.value = orderList.value[index]
        }
      }

      return {
        success: true,
        message: '订单确认成功'
      }
    } catch (err) {
      console.error('确认订单失败:', err)
      error.value = '确认订单失败'
      return {
        success: false,
        message: '确认订单失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 撤销订单
  const cancelMerchantOrder = async (id: string): Promise<RefundResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.put(`/merchant/orders/${id}/cancel`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const index = orderList.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orderList.value[index] = {
          ...orderList.value[index],
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        }

        if (currentOrder.value?.id === id) {
          currentOrder.value = orderList.value[index]
        }
      }

      return {
        success: true,
        message: '订单撤销成功'
      }
    } catch (err) {
      console.error('撤销订单失败:', err)
      error.value = '撤销订单失败'
      return {
        success: false,
        message: '撤销订单失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 确认发货
  const shipMerchantOrder = async (id: string): Promise<RefundResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.put(`/merchant/orders/${id}/ship`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const index = orderList.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orderList.value[index] = {
          ...orderList.value[index],
          status: 'verified',
          updatedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString()
        }

        if (currentOrder.value?.id === id) {
          currentOrder.value = orderList.value[index]
        }
      }

      return {
        success: true,
        message: '发货确认成功'
      }
    } catch (err) {
      console.error('发货确认失败:', err)
      error.value = '发货确认失败'
      return {
        success: false,
        message: '发货确认失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 申请退款
  const refundMerchantOrder = async (id: string, refundData?: Partial<RefundRequest>): Promise<RefundResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.post(`/merchant/orders/${id}/refund`, refundData)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const index = orderList.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orderList.value[index] = {
          ...orderList.value[index],
          status: 'refunded',
          paymentStatus: 'refunded',
          updatedAt: new Date().toISOString(),
          refundedAt: new Date().toISOString()
        }

        if (currentOrder.value?.id === id) {
          currentOrder.value = orderList.value[index]
        }
      }

      return {
        success: true,
        message: '退款申请成功'
      }
    } catch (err) {
      console.error('退款申请失败:', err)
      error.value = '退款申请失败'
      return {
        success: false,
        message: '退款申请失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 获取退款列表
  const getRefundRequests = async (): Promise<MerchantOrdersResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.get('/merchant/refunds')

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const mockRefundRequests: MerchantOrder[] = orderList.value.filter(order => order.status === 'refunded')

      return {
        success: true,
        data: mockRefundRequests,
        message: '退款列表获取成功'
      }
    } catch (err) {
      console.error('获取退款列表失败:', err)
      error.value = '获取退款列表失败'
      return {
        success: false,
        data: [],
        message: '获取退款列表失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    orderList,
    currentOrder,
    isLoading,
    error,

    // 方法
    getMerchantOrdersList,
    getMerchantOrderDetail,
    confirmMerchantOrder,
    cancelMerchantOrder,
    shipMerchantOrder,
    refundMerchantOrder,
    getRefundRequests
  }
})