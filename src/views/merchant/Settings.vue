<template>
  <div class="merchant-settings">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="商户设置"
      left-text="返回"
      left-arrow
      @click-left="handleBack"
      fixed
      z-index="100"
    />

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 基本信息 -->
      <div class="settings-section">
        <h3 class="section-title">基本信息</h3>

        <div class="info-card">
          <div class="info-item">
            <label class="info-label">商户名称</label>
            <div class="info-value">{{ merchantProfile.name || '未设置' }}</div>
          </div>

          <div class="info-item">
            <label class="info-label">联系电话</label>
            <div class="info-value">{{ merchantProfile.phone || '未设置' }}</div>
          </div>

          <div class="info-item">
            <label class="info-label">商户地址</label>
            <div class="info-value">{{ merchantProfile.address || '未设置' }}</div>
          </div>

          <div class="info-item">
            <label class="info-label">营业时间</label>
            <div class="info-value">{{ merchantProfile.businessHours || '未设置' }}</div>
          </div>

          <div class="info-item">
            <label class="info-label">商户介绍</label>
            <div class="info-value">{{ merchantProfile.description || '未设置' }}</div>
          </div>

          <van-button
            type="primary"
            block
            @click="editProfile"
            style="margin-top: 15px;"
          >
            编辑信息
          </van-button>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="settings-section">
        <h3 class="section-title">安全设置</h3>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">修改密码</div>
              <div class="setting-desc">定期更换密码保障账户安全</div>
            </div>
            <van-icon name="arrow" />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">登录验证</div>
              <div class="setting-desc">开启后需要验证码登录</div>
            </div>
            <van-switch
              v-model="securitySettings.loginVerification"
              @change="updateLoginVerification"
            />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">操作确认</div>
              <div class="setting-desc">重要操作需要二次确认</div>
            </div>
            <van-switch
              v-model="securitySettings.operationConfirmation"
              @change="updateOperationConfirmation"
            />
          </div>
        </div>
      </div>

      <!-- 消息通知 -->
      <div class="settings-section">
        <h3 class="section-title">消息通知</h3>

        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">新订单通知</div>
              <div class="setting-desc">有新订单时立即通知</div>
            </div>
            <van-switch
              v-model="notificationSettings.newOrderNotification"
              @change="updateNewOrderNotification"
            />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">支付成功通知</div>
              <div class="setting-desc">订单支付成功时通知</div>
            </div>
            <van-switch
              v-model="notificationSettings.paymentNotification"
              @change="updatePaymentNotification"
            />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">退款通知</div>
              <div class="setting-desc">退款申请时通知</div>
            </div>
            <van-switch
              v-model="notificationSettings.refundNotification"
              @change="updateRefundNotification"
            />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">系统消息</div>
              <div class="setting-desc">接收系统更新和公告</div>
            </div>
            <van-switch
              v-model="notificationSettings.systemNotification"
              @change="updateSystemNotification"
            />
          </div>
        </div>
      </div>

      <!-- 商户权限 -->
      <div class="settings-section">
        <h3 class="section-title">商户权限</h3>

        <div class="permission-grid">
          <div class="permission-item">
            <van-icon name="orders" />
            <span>订单管理</span>
          </div>
          <div class="permission-item">
            <van-icon name="qr-code" />
            <span>二维码核销</span>
          </div>
          <div class="permission-item">
            <van-icon name="chart-line" />
            <span>统计报表</span>
          </div>
          <div class="permission-item">
            <van-icon name="balance" />
            <span>财务结算</span>
          </div>
          <div class="permission-item">
            <van-icon name="setting" />
            <span>商户设置</span>
          </div>
          <div class="permission-item">
            <van-icon name="service" />
            <span>客服支持</span>
          </div>
        </div>
      </div>

      <!-- 关于我们 -->
      <div class="settings-section">
        <h3 class="section-title">关于</h3>

        <div class="info-list">
          <div class="info-item">
            <label class="info-label">版本</label>
            <div class="info-value">v1.0.0</div>
          </div>

          <div class="info-item">
            <label class="info-label">服务协议</label>
            <div class="info-value">点击查看</div>
          </div>

          <div class="info-item">
            <label class="info-label">隐私政策</label>
            <div class="info-value">点击查看</div>
          </div>

          <div class="info-item">
            <label class="info-label">客服电话</label>
            <div class="info-value">400-123-4567</div>
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      <div class="logout-section">
        <van-button
          type="danger"
          block
          @click="handleLogout"
        >
          退出登录
        </van-button>
      </div>
    </div>

    <!-- 编辑商户信息弹窗 -->
    <van-popup
      v-model:show="showEditPopup"
      position="bottom"
      closeable
      round
      :style="{ height: '70%' }"
    >
      <div class="edit-popup">
        <h3>编辑商户信息</h3>

        <van-form @submit="onSubmit">
          <van-field
            v-model="editForm.name"
            name="name"
            label="商户名称"
            placeholder="请输入商户名称"
            :rules="[{ required: true, message: '请输入商户名称' }]"
          />

          <van-field
            v-model="editForm.phone"
            name="phone"
            label="联系电话"
            placeholder="请输入联系电话"
            :rules="[{ required: true, message: '请输入联系电话' }]"
          />

          <van-field
            v-model="editForm.address"
            name="address"
            label="商户地址"
            placeholder="请输入商户地址"
          />

          <van-field
            v-model="editForm.businessHours"
            name="businessHours"
            label="营业时间"
            placeholder="例如: 09:00-22:00"
          />

          <van-field
            v-model="editForm.description"
            name="description"
            label="商户介绍"
            type="textarea"
            rows="3"
            placeholder="请输入商户介绍"
          />

          <div class="edit-actions">
            <van-button
              block
              type="primary"
              native-type="submit"
              :loading="submitting"
            >
              保存
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { showToast, showLoadingToast } from 'vant'
import { merchantService } from '@/services/merchant'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 页面导航
const handleBack = () => {
  router.back()
}

// 商户信息
const merchantProfile = ref({
  name: '',
  phone: '',
  address: '',
  businessHours: '',
  description: ''
})

// 编辑相关
const showEditPopup = ref(false)
const submitting = ref(false)
const editForm = reactive({
  name: '',
  phone: '',
  address: '',
  businessHours: '',
  description: ''
})

// 安全设置
const securitySettings = reactive({
  loginVerification: false,
  operationConfirmation: false
})

// 通知设置
const notificationSettings = reactive({
  newOrderNotification: true,
  paymentNotification: true,
  refundNotification: true,
  systemNotification: true
})

// 加载商户信息
const loadMerchantProfile = async () => {
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
    duration: 1000
  })

  try {
    const response = await merchantService.getMerchantProfile()
    merchantProfile.value = response

    // 同步到编辑表单
    Object.assign(editForm, response)

    // 加载设置
    await loadSettings()
  } catch (error) {
    showToast('加载商户信息失败')
    console.error('Failed to load merchant profile:', error)
  }
}

// 加载设置
const loadSettings = async () => {
  // 这里应该从API加载设置
  // 目前使用默认值
}

// 编辑商户信息
const editProfile = () => {
  Object.assign(editForm, merchantProfile.value)
  showEditPopup.value = true
}

// 提交编辑表单
const onSubmit = async () => {
  submitting.value = true

  try {
    await merchantService.updateMerchantProfile(editForm)

    // 更新本地信息
    Object.assign(merchantProfile.value, editForm)

    showToast({
      message: '保存成功',
      type: 'success'
    })

    showEditPopup.value = false
  } catch (error) {
    showToast('保存失败')
    console.error('Failed to update merchant profile:', error)
  } finally {
    submitting.value = false
  }
}

// 安全设置更新方法
const updateLoginVerification = (value: boolean) => {
  console.log('Login verification:', value)
  // 这里应该调用API更新设置
  showToast({
    message: value ? '已开启登录验证' : '已关闭登录验证',
    type: 'success'
  })
}

const updateOperationConfirmation = (value: boolean) => {
  console.log('Operation confirmation:', value)
  showToast({
    message: value ? '已开启操作确认' : '已关闭操作确认',
    type: 'success'
  })
}

// 通知设置更新方法
const updateNewOrderNotification = (value: boolean) => {
  console.log('New order notification:', value)
  showToast({
    message: value ? '已开启新订单通知' : '已关闭新订单通知',
    type: 'success'
  })
}

const updatePaymentNotification = (value: boolean) => {
  console.log('Payment notification:', value)
  showToast({
    message: value ? '已开启支付成功通知' : '已关闭支付成功通知',
    type: 'success'
  })
}

const updateRefundNotification = (value: boolean) => {
  console.log('Refund notification:', value)
  showToast({
    message: value ? '已开启退款通知' : '已关闭退款通知',
    type: 'success'
  })
}

const updateSystemNotification = (value: boolean) => {
  console.log('System notification:', value)
  showToast({
    message: value ? '已开启系统消息' : '已关闭系统消息',
    type: 'success'
  })
}

// 退出登录
const handleLogout = () => {
  showLoadingToast({
    message: '退出中...',
    forbidClick: true,
    duration: 1000
  })

  // 清除认证信息
  const authStore = useAuthStore()
  authStore.clearAuth()

  // 跳转到登录页
  router.push('/login')
}

// 生命周期钩子
onMounted(() => {
  loadMerchantProfile()
})
</script>

<style scoped lang="scss">
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

.merchant-settings {
  padding-top: 120px;
  background: $glass-bg-gradient;
  background-attachment: fixed;
  background-size: cover;
  min-height: 100vh;
}

.settings-content {
  padding: 0 15px 20px;
}

.settings-section {
  @include glassmorphism-card(base);
  margin: 0 15px 15px;
  overflow: hidden;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  padding: 15px;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.info-card {
  padding: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  min-width: 80px;
  font-size: 14px;
  color: #666;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.settings-list {
  padding: 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 12px;
  color: #666;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
}

.permission-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  text-align: center;
}

.permission-item van-icon {
  font-size: 24px;
  color: #667eea;
}

.permission-item span {
  font-size: 12px;
  color: #333;
}

.info-list {
  padding: 20px;
}

.info-list .info-item {
  justify-content: space-between;
}

.info-list .info-value {
  text-align: right;
  color: #3A82F6;
  cursor: pointer;
}

.logout-section {
  margin-top: 30px;
  padding: 0 15px;
}

.edit-popup {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.edit-popup h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.edit-actions {
  margin-top: 20px;
}

@media (max-width: 375px) {
  .merchant-settings {
    padding-top: 140px;
  }

  .settings-content {
    padding: 0 10px 20px;
  }

  .permission-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    padding: 15px;
  }

  .info-card {
    padding: 10px;
  }
}
</style>