import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Address } from '@/types'

interface AddressResponse {
  success: boolean
  data: Address[]
  message?: string
}

interface SingleAddressResponse {
  success: boolean
  data: Address
  message?: string
}

export const useAddressStore = defineStore('address', () => {
  // 状态
  const addressList = ref<Address[]>([])
  const isLoading = ref(false)
  const error = ref<string>('')

  // 获取地址列表
  const getAddressList = async (): Promise<AddressResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里���该调用实际的API
      // const response = await api.get('/addresses')

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockData: Address[] = [
        {
          id: '1',
          name: '张三',
          phone: '13800138000',
          province: '广东省',
          city: '广州市',
          district: '天河区',
          detail: '天河路123号',
          isDefault: true,
          createdAt: '2024-10-15T10:00:00Z',
          updatedAt: '2024-10-15T10:00:00Z'
        },
        {
          id: '2',
          name: '李四',
          phone: '13900139000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detail: '科技园456号',
          isDefault: false,
          createdAt: '2024-10-16T11:00:00Z',
          updatedAt: '2024-10-16T11:00:00Z'
        }
      ]

      addressList.value = mockData

      return {
        success: true,
        data: mockData,
        message: '地址列表获取成功'
      }
    } catch (err) {
      console.error('获取地址列表失败:', err)
      errorMessage.value = '获取地址列表失败'
      return {
        success: false,
        data: [],
        message: '获取地址列表失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 添加地址
  const addAddress = async (addressData: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<SingleAddressResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.post('/addresses', addressData)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newAddress: Address = {
        id: Date.now().toString(),
        ...addressData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      addressList.value.push(newAddress)

      return {
        success: true,
        data: newAddress,
        message: '地址添加成功'
      }
    } catch (err) {
      console.error('添加地址失败:', err)
      errorMessage.value = '添加地址失败'
      return {
        success: false,
        data: {} as Address,
        message: '添加地址失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 更新地址
  const updateAddress = async (id: string, addressData: Partial<Address>): Promise<SingleAddressResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.put(`/addresses/${id}`, addressData)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))

      const index = addressList.value.findIndex(addr => addr.id === id)
      if (index !== -1) {
        addressList.value[index] = {
          ...addressList.value[index],
          ...addressData,
          updatedAt: new Date().toISOString()
        }

        return {
          success: true,
          data: addressList.value[index],
          message: '地址更新成功'
        }
      } else {
        throw new Error('地址不存在')
      }
    } catch (err) {
      console.error('更新地址失败:', err)
      errorMessage.value = '更新地址失败'
      return {
        success: false,
        data: {} as Address,
        message: '更新地址失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 删除地址
  const deleteAddress = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.delete(`/addresses/${id}`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const index = addressList.value.findIndex(addr => addr.id === id)
      if (index !== -1) {
        addressList.value.splice(index, 1)

        return {
          success: true,
          message: '地址删除成功'
        }
      } else {
        throw new Error('地址不存在')
      }
    } catch (err) {
      console.error('删除地址失败:', err)
      errorMessage.value = '删除地址失败'
      return {
        success: false,
        message: '删除地址失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 设置默认地址
  const setDefaultAddress = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.put(`/addresses/${id}/default`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      addressList.value.forEach(addr => {
        addr.isDefault = addr.id === id
      })

      return {
        success: true,
        message: '默认地址设置成功'
      }
    } catch (err) {
      console.error('设置默认地址失败:', err)
      errorMessage.value = '设置默认地址失败'
      return {
        success: false,
        message: '设置默认地址失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个地址
  const getAddress = async (id: string): Promise<SingleAddressResponse> => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用实际的API
      // const response = await api.get(`/addresses/${id}`)

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      const address = addressList.value.find(addr => addr.id === id)
      if (address) {
        return {
          success: true,
          data: address,
          message: '地址获取成功'
        }
      } else {
        throw new Error('地址不存在')
      }
    } catch (err) {
      console.error('获取地址失败:', err)
      errorMessage.value = '获取地址失败'
      return {
        success: false,
        data: {} as Address,
        message: '获取地址失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    addressList,
    isLoading,
    error,

    // 方法
    getAddressList,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAddress
  }
})