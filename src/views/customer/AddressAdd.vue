<template>
  <div class="address-add-page">
    <AppHeader :title="pageTitle" :showBack="true" />

    <div class="address-form-content">
      <van-form @submit="handleSubmit">
        <!-- 收货人姓名 -->
        <van-field
          v-model="formData.name"
          name="name"
          label="收货人"
          placeholder="请输入收货人姓名"
          :rules="[{ required: true, message: '请输入收货人姓名' }]"
          maxlength="20"
        />

        <!-- 手机号码 -->
        <van-field
          v-model="formData.phone"
          name="phone"
          label="手机号码"
          placeholder="请输入手机号码"
          :rules="[
            { required: true, message: '请输入手机号码' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
          ]"
          maxlength="11"
        />

        <!-- 省份选择 -->
        <van-field
          v-model="formData.province"
          is-link
          readonly
          name="province"
          label="省份"
          placeholder="请选择省份"
          @click="showProvincePicker = true"
          :rules="[{ required: true, message: '请选择省份' }]"
        />

        <!-- 城市选择 -->
        <van-field
          v-model="formData.city"
          is-link
          readonly
          name="city"
          label="城市"
          placeholder="请选择城市"
          @click="showCityPicker = true"
          :rules="[{ required: true, message: '请选择城市' }]"
        />

        <!-- 区县选择 -->
        <van-field
          v-model="formData.district"
          is-link
          readonly
          name="district"
          label="区县"
          placeholder="请选择区县"
          @click="showDistrictPicker = true"
          :rules="[{ required: true, message: '请选择区县' }]"
        />

        <!-- 详细地址 -->
        <van-field
          v-model="formData.detail"
          name="detail"
          label="详细地址"
          placeholder="请输入详细地址（街道、小区、楼号等）"
          :rules="[{ required: true, message: '请输入详细地址' }]"
          type="textarea"
          rows="3"
          maxlength="100"
        />

        <!-- 默认地址 -->
        <van-cell center title="设为默认地址">
          <template #right-icon>
            <van-switch
              v-model="formData.isDefault"
              size="24"
            />
          </template>
        </van-cell>

        <!-- 提交按钮 -->
        <div class="submit-button">
          <van-button
            type="primary"
            native-type="submit"
            block
            round
            :loading="isSubmitting"
          >
            {{ isSubmitting ? '保存中...' : '保存地址' }}
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import AppHeader from '@/components/common/AppHeader.vue'
import { useAddressStore } from '@/stores/address'

// 省市区数据
const provinces = [
  { code: '440000', name: '广东省', children: [
    { code: '440100', name: '广州市', children: [
      { code: '440103', name: '荔湾区' },
      { code: '440104', name: '越秀区' },
      { code: '440105', name: '海珠区' },
      { code: '440106', name: '天河区' },
      { code: '440111', name: '白云区' },
      { code: '440112', name: '黄埔区' },
      { code: '440113', name: '番禺区' },
      { code: '440114', name: '花都区' },
      { code: '440115', name: '南沙区' },
      { code: '440117', name: '从化区' },
      { code: '440118', name: '增城区' }
    ]},
    { code: '440200', name: '深圳市', children: [
      { code: '440203', name: '罗湖区' },
      { code: '440204', name: '福田区' },
      { code: '440205', name: '南山区' },
      { code: '440206', name: '宝安区' },
      { code: '440207', name: '龙岗区' },
      { code: '440208', name: '盐田区' },
      { code: '440209', name: '龙华区' },
      { code: '440211', name: '坪山区' },
      { code: '440213', name: '光明区' }
    ]}
  ]}
]

const router = useRouter()
const addressStore = useAddressStore()

const pageTitle = ref('添加地址')
const isSubmitting = ref(false)
const showProvincePicker = ref(false)
const showCityPicker = ref(false)
const showDistrictPicker = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

// 省市区选项
const provinceOptions = provinces.map(p => ({ text: p.name, value: p.name }))
const cityOptions = ref<any[]>([])
const districtOptions = ref<any[]>([])

// 选择省份
const onProvinceConfirm = (value: string) => {
  formData.province = value
  formData.city = ''
  formData.district = ''

  // 找到选中的省份
  const selectedProvince = provinces.find(p => p.name === value)
  if (selectedProvince) {
    cityOptions.value = selectedProvince.children.map(c => ({ text: c.name, value: c.name }))
  }

  showProvincePicker.value = false
}

// 选择城市
const onCityConfirm = (value: string) => {
  formData.city = value
  formData.district = ''

  // 找到选中的城市
  const selectedProvince = provinces.find(p => p.name === formData.province)
  if (selectedProvince) {
    const selectedCity = selectedProvince.children.find(c => c.name === value)
    if (selectedCity) {
      districtOptions.value = selectedCity.children.map(d => ({ text: d.name, value: d.name }))
    }
  }

  showCityPicker.value = false
}

// 选择区县
const onDistrictConfirm = (value: string) => {
  formData.district = value
  showDistrictPicker.value = false
}

// 提交表单
const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    const addressData = {
      name: formData.name,
      phone: formData.phone,
      province: formData.province,
      city: formData.city,
      district: formData.district,
      detail: formData.detail,
      isDefault: formData.isDefault
    }

    const response = await addressStore.addAddress(addressData)

    if (response.success) {
      showToast('地址添加成功')
      router.go(-1) // 返回上一页
    } else {
      showToast(response.message || '添加地址失败')
    }
  } catch (error) {
    console.error('添加地址失败:', error)
    showToast('添加地址失败')
  } finally {
    isSubmitting.value = false
  }
}

// 生命周期
onMounted(() => {
  console.log('添加地址页面已加载')
})
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

.address-add-page {
  min-height: 100vh;
  background: $glass-bg-gradient;
  background-attachment: fixed;
  background-size: cover;
  display: flex;
  flex-direction: column;
}

.address-form-content {
  flex: 1;
  padding: 16px;
  padding-bottom: 100px;
}

.submit-button {
  margin-top: 32px;
  padding: 0 16px;

  .van-button {
    margin: 0;
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .address-add-page {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    background-attachment: fixed;
    background-size: cover;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .address-form-content {
    padding: 12px;
    padding-bottom: 80px;
  }

  .submit-button {
    margin-top: 24px;
  }
}
</style>