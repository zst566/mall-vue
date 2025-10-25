import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderItem, OrderCreateRequest, PaginatedResponse } from '@/types'
import type { Product } from '@/types'

export const useOrderStore = defineStore('orders', () => {
  // 状态
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const orderItems = ref<OrderItem[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string>('')

  // 计算属性
  const totalOrders = computed(() => orders.value.length)
  const pendingOrders = computed(() => orders.value.filter(order => order.status === 'pending'))
  const paidOrders = computed(() => orders.value.filter(order => order.status === 'paid'))
  const shippedOrders = computed(() => orders.value.filter(order => order.status === 'shipped'))
  const deliveredOrders = computed(() => orders.value.filter(order => order.status === 'delivered'))
  const cancelledOrders = computed(() => orders.value.filter(order => order.status === 'cancelled'))
  const refundedOrders = computed(() => orders.value.filter(order => order.status === 'refunded'))

  // 获取订单列表
  const getOrders = async (params?: {
    page?: number
    pageSize?: number
    status?: string
    dateRange?: [string, string]
  }) => {
    loading.value = true
    try {
      // 这里应该调用实际的API
      const response = await fetch('/api/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data: PaginatedResponse<Order> = await response.json()
      orders.value = data.list

      return { success: true, data }
    } catch (error) {
      console.error('获取订单失败:', error)
      return { success: false, message: '获取订单失败' }
    } finally {
      loading.value = false
    }
  }

  // 获取订单详情
  const getOrderDetail = async (orderId: string) => {
    loading.value = true
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()
      currentOrder.value = data.data
      orderItems.value = data.data.items || []

      return { success: true, data }
    } catch (error) {
      console.error('获取订单详情失败:', error)
      return { success: false, message: '获取订单详情失败' }
    } finally {
      loading.value = false
    }
  }

  // 创建直接购买订单
  const createDirectOrder = async (orderData: {
    productId: string
    quantity: number
    shippingAddress: any
    contactName: string
    contactPhone: string
  }) => {
    loading.value = true
    try {
      const request: OrderCreateRequest = {
        productId: orderData.productId,
        quantity: orderData.quantity,
        items: [{
          id: 'temp-item',
          productId: orderData.productId,
          productName: '商品名称',
          productImage: '/images/default.jpg',
          quantity: orderData.quantity,
          price: 0,
          totalPrice: 0,
          specification: '默认规格'
        }],
        shippingAddress: orderData.shippingAddress,
        contactName: orderData.contactName,
        contactPhone: orderData.contactPhone
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(request)
      })

      const data = await response.json()

      if (data.code === 200) {
        currentOrder.value = data.data
        orders.value.unshift(data.data)
        return { success: true, order: data.data }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('创建订单失败:', error)
      return { success: false, message: '创建订单失败' }
    } finally {
      loading.value = false
    }
  }

  // 支付订单
  const payOrder = async (orderId: string, paymentMethod: 'wechat' | 'alipay' | 'cash') => {
    loading.value = true
    try {
      const response = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ paymentMethod })
      })

      const data = await response.json()

      if (data.code === 200) {
        const orderIndex = orders.value.findIndex(order => order.id === orderId)
        if (orderIndex !== -1) {
          orders.value[orderIndex] = data.data
        }
        return { success: true, order: data.data }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('支付订单失败:', error)
      return { success: false, message: '支付订单失败' }
    } finally {
      loading.value = false
    }
  }

  // 取消订单
  const cancelOrder = async (orderId: string, reason: string) => {
    loading.value = true
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()

      if (data.code === 200) {
        const orderIndex = orders.value.findIndex(order => order.id === orderId)
        if (orderIndex !== -1) {
          orders.value[orderIndex] = data.data
        }
        return { success: true, order: data.data }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('取消订单失败:', error)
      return { success: false, message: '取消订单失败' }
    } finally {
      loading.value = false
    }
  }

  // 申请退款
  const refundOrder = async (orderId: string, reason: string, amount?: number) => {
    loading.value = true
    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason, amount })
      })

      const data = await response.json()

      if (data.code === 200) {
        const orderIndex = orders.value.findIndex(order => order.id === orderId)
        if (orderIndex !== -1) {
          orders.value[orderIndex] = data.data
        }
        return { success: true, order: data.data }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('申请退款失败:', error)
      return { success: false, message: '申请退款失败' }
    } finally {
      loading.value = false
    }
  }

  // 获取商户订单列表
  const getMerchantOrders = async (params?: {
    page?: number
    pageSize?: number
    status?: string
    dateRange?: [string, string]
    verifiedAt?: string
  }) => {
    loading.value = true
    try {
      const response = await fetch('/api/merchant/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data: PaginatedResponse<Order> = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('获取商户订单失败:', error)
      return { success: false, message: '获取商户订单失败' }
    } finally {
      loading.value = false
    }
  }

  // 核销订单
  const verifyOrder = async (orderId: string, verificationCode: string) => {
    loading.value = true
    try {
      const response = await fetch('/api/merchant/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ orderId, verificationCode })
      })

      const data = await response.json()

      if (data.code === 200) {
        const orderIndex = orders.value.findIndex(order => order.id === orderId)
        if (orderIndex !== -1) {
          orders.value[orderIndex] = data.data
        }
        return { success: true, order: data.data }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('核销订单失败:', error)
      return { success: false, message: '核销订单失败' }
    } finally {
      loading.value = false
    }
  }

  // 撤销核销
  const revokeOrder = async (orderId: string) => {
    loading.value = true
    try {
      const response = await fetch(`/api/merchant/orders/${orderId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (data.code === 200) {
        const orderIndex = orders.value.findIndex(order => order.id === orderId)
        if (orderIndex !== -1) {
          orders.value[orderIndex] = data.data
        }
        return { success: true, order: data.data }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('撤销核销失败:', error)
      return { success: false, message: '撤销核销失败' }
    } finally {
      loading.value = false
    }
  }

  // 清空订单列表
  const clearOrders = () => {
    orders.value = []
    currentOrder.value = null
    orderItems.value = []
  }

  // 清除错误
  const clearError = () => {
    error.value = ''
  }

  return {
    // 状态
    orders,
    currentOrder,
    orderItems,
    loading,
    error,

    // 计算属性
    totalOrders,
    pendingOrders,
    paidOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    refundedOrders,

    // 方法
    getOrders,
    getOrderDetail,
    createDirectOrder,
    payOrder,
    cancelOrder,
    refundOrder,
    getMerchantOrders,
    verifyOrder,
    revokeOrder,
    clearOrders,
    clearError
  }
})