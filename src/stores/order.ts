import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order, OrderItem, Address, PaymentMethod } from '@/types'

interface OrderResponse {
  success: boolean
  data: Order
  message?: string
}

interface OrdersResponse {
  success: boolean
  data: Order[]
  message?: string
}

export const useOrderStore = defineStore('order', () => {
  // 状态
  const orderList = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)
  const error = ref<string>('')

  // 获取订单列表
  const getOrdersList = async (status?: string): Promise<OrdersResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.get('/orders', { params: { status } })

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockData: Order[] = [
        {
          id: '1',
          orderNo: 'ORD20241018001',
          userId: 'user1',
          status: 'pending',
          totalAmount: 8999.00,
          paymentMethod: 'wechat',
          paymentStatus: 'unpaid',
          shippingAddress: {
            id: 'addr1',
            name: '张三',
            phone: '13800138000',
            province: '广东省',
            city: '广州市',
            district: '天河区',
            detail: '天河路123号',
            isDefault: true,
            createdAt: '2024-10-01T00:00:00Z',
            updatedAt: '2024-10-01T00:00:00Z'
          },
          contactName: '张三',
          contactPhone: '13800138000',
          isVerified: false,
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
          createdAt: '2024-10-18T10:00:00Z',
          updatedAt: '2024-10-18T10:00:00Z'
        },
        {
          id: '2',
          orderNo: 'ORD20241017002',
          userId: 'user1',
          status: 'paid',
          totalAmount: 2999.00,
          paymentMethod: 'alipay',
          paymentStatus: 'paid',
          shippingAddress: {
            id: 'addr2',
            name: '张三',
            phone: '13800138000',
            province: '广东省',
            city: '广州市',
            district: '天河区',
            detail: '天河路123号',
            isDefault: true,
            createdAt: '2024-10-01T00:00:00Z',
            updatedAt: '2024-10-01T00:00:00Z'
          },
          contactName: '张三',
          contactPhone: '13800138000',
          isVerified: false,
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
          createdAt: '2024-10-17T14:00:00Z',
          updatedAt: '2024-10-17T14:00:00Z',
          paidAt: '2024-10-17T14:30:00Z'
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
      console.error('获取订单列表失败:', err)
      error.value = '获取订单列表失败'
      return {
        success: false,
        data: [],
        message: '获取订单列表失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 获取订单详情
  const getOrderDetail = async (id: string): Promise<OrderResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.get(`/orders/${id}`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const mockOrder: Order = {
        id,
        orderNo: `ORD${id}00${Math.floor(Math.random() * 100)}`,
        userId: 'user1',
        status: 'delivered',
        totalAmount: 8999.00,
        paymentMethod: 'wechat',
        paymentStatus: 'paid',
        shippingAddress: {
          id: 'addr3',
          name: '张三',
          phone: '13800138000',
          province: '广东省',
          city: '广州市',
          district: '天河区',
          detail: '天河路123号',
          isDefault: true,
          createdAt: '2024-10-01T00:00:00Z',
          updatedAt: '2024-10-01T00:00:00Z'
        },
        contactName: '张三',
        contactPhone: '13800138000',
        isVerified: true,
        items: [
          {
            id: 'item3',
            productId: 'product1',
            productName: 'iPhone 15 Pro',
            productImage: '/images/iphone15.jpg',
            quantity: 1,
            price: 8999.00,
            totalPrice: 8999.00,
            specification: '256GB 深空黑色'
          }
        ],
        createdAt: '2024-10-15T10:00:00Z',
        updatedAt: '2024-10-17T16:45:00Z',
        paidAt: '2024-10-15T14:35:00Z',
        shippedAt: '2024-10-16T09:20:00Z',
        deliveredAt: '2024-10-17T16:45:00Z'
      }

      currentOrder.value = mockOrder

      return {
        success: true,
        data: mockOrder,
        message: '订单详情获取成功'
      }
    } catch (err) {
      console.error('获取订单详情失败:', err)
      error.value = '获取订单详情失败'
      return {
        success: false,
        data: {} as Order,
        message: '获取订单详情失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 创建订单
  const createOrder = async (orderData: Partial<Order>): Promise<OrderResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.post('/orders', orderData)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newOrder: Order = {
        id: Date.now().toString(),
        orderNo: `ORD${Date.now()}`,
        userId: orderData.userId || 'user1',
        status: 'pending',
        totalAmount: orderData.totalAmount || 0,
        paymentMethod: orderData.paymentMethod || 'wechat',
        paymentStatus: 'unpaid',
        shippingAddress: orderData.shippingAddress || {
          id: 'temp-addr',
          name: '',
          phone: '',
          province: '',
          city: '',
          district: '',
          detail: '',
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        contactName: orderData.contactName || '',
        contactPhone: orderData.contactPhone || '',
        isVerified: false,
        items: orderData.items || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      orderList.value.unshift(newOrder)
      currentOrder.value = newOrder

      return {
        success: true,
        data: newOrder,
        message: '订单创建成功'
      }
    } catch (err) {
      console.error('创建订单失败:', err)
      error.value = '创建订单失败'
      return {
        success: false,
        data: {} as Order,
        message: '创建订单失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 取消订单
  const cancelOrder = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.put(`/orders/${id}/cancel`)

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

        return {
          success: true,
          message: '订单取消成功'
        }
      } else {
        throw new Error('订单不存在')
      }
    } catch (err) {
      console.error('取消订单失败:', err)
      error.value = '取消订单失败'
      return {
        success: false,
        message: '取消订单失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 支付订单
  const payOrder = async (id: string, paymentMethod: PaymentMethod): Promise<{ success: boolean; message: string }> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.post(`/orders/${id}/pay`, { paymentMethod })

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const index = orderList.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orderList.value[index] = {
          ...orderList.value[index],
          status: 'paid',
          paymentStatus: 'paid',
          paymentMethod,
          updatedAt: new Date().toISOString(),
          paidAt: new Date().toISOString()
        }

        if (currentOrder.value?.id === id) {
          currentOrder.value = orderList.value[index]
        }

        return {
          success: true,
          message: '订单支付成功'
        }
      } else {
        throw new Error('订单不存在')
      }
    } catch (err) {
      console.error('支付订单失败:', err)
      error.value = '支付订单失败'
      return {
        success: false,
        message: '支付订单失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 确认收货
  const confirmReceive = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.put(`/orders/${id}/receive`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const index = orderList.value.findIndex(order => order.id === id)
      if (index !== -1) {
        orderList.value[index] = {
          ...orderList.value[index],
          status: 'delivered',
          updatedAt: new Date().toISOString(),
          deliveredAt: new Date().toISOString()
        }

        if (currentOrder.value?.id === id) {
          currentOrder.value = orderList.value[index]
        }

        return {
          success: true,
          message: '确认收货成功'
        }
      } else {
        throw new Error('订单不存在')
      }
    } catch (err) {
      console.error('确认收货失败:', err)
      error.value = '确认收货失败'
      return {
        success: false,
        message: '确认收货失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 申请退款
  const refundOrder = async (id: string, reason: string): Promise<{ success: boolean; message: string }> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.post(`/orders/${id}/refund`, { reason })

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

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

        return {
          success: true,
          message: '退款申请成功'
        }
      } else {
        throw new Error('订单不存在')
      }
    } catch (err) {
      console.error('申请退款失败:', err)
      error.value = '申请退款失败'
      return {
        success: false,
        message: '申请退款失败'
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
    getOrdersList,
    getOrderDetail,
    createOrder,
    cancelOrder,
    payOrder,
    confirmReceive,
    refundOrder
  }
})