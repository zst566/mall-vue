# 滨江宏岸商场 - 移动端应用

基于 Vue 3 + TypeScript + Vite 构建的现代化移动端购物平台，支持客户版和商户版双模式。

## 🌟 项目特性

- **双版本支持**: 客户版购物 + 商户版管理
- **直接购买**: 简化的购买流程，无需购物车
- **微信集成**: 完善的 web-view 参数传递和 token 管理
- **响应式设计**: 适配各种移动设备屏幕尺寸
- **类型安全**: 完整的 TypeScript 类型定义
- **性能优化**: 代码分割、懒加载和缓存策略
- **容器化部署**: Docker 支持快速部署

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- 建议使用 pnpm 或 yarn

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 pnpm
pnpm install

# 使用 yarn
yarn install
```

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 或
pnpm dev
# 或
yarn dev
```

开发服务器将在 http://localhost:3000 启动。

**生产环境访问地址**: `https://wepark-a.gdtvdv.com`

> 📌 **重要**: 所有环境配置请参考根目录的 [环境配置说明](../ENVIRONMENT_CONFIG.md)

### 构建生产版本

```bash
# 构建项目
npm run build

# 构建并检查类型
npm run type-check
```

### 代码检查和格式化

```bash
# 运行 ESLint
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 检查格式
npm run format
```

## 📱 双版本功能

### 客户版功能

- 商品浏览和搜索
- 商品详情展示
- 直接购买
- 用户中心
- 订单管理
- 地址管理

### 商户版功能

- 二维码扫码核销
- 订单核销管理
- 订单撤销
- 退款操作
- 订单状态管理

## 🔧 技术栈

### 前端框架

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 现代化的构建工具

### 状态管理

- **Pinia** - Vue 3 推荐的状态管理库

### UI 组件

- **Vant UI** - 移动端 UI 组件库
- **Auto Import** - 自动导入 Vue 3 API

### 路由和导航

- **Vue Router 4** - 官方路由管理器

### HTTP 客户端

- **Axios** - HTTP 请求库

### 开发工具

- **ESLint** - JavaScript 代码检查工具
- **Prettier** - 代码格式化工具
- **Vue TSC** - TypeScript 类型检查

## 📁 项目结构

```
mall-vue/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── common/         # 通用组件
│   │   ├── customer/       # 客户版组件
│   │   └── merchant/      # 商户版组件
│   ├── views/              # ���面组件
│   │   ├── customer/       # 客户版页面
│   │   └── merchant/       # 商户版页面
│   ├── composables/        # 组合式函数
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia 状态管理
│   ├── services/           # API 服务
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型定义
│   ├── assets/             # 静态资源
│   └── styles/             # 样式文件
├── public/                 # 公共资源
├── docs/                  # 文档和设计截图
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
├── .eslintrc.cjs          # ESLint 配置
├── .prettierrc            # Prettier 配置
└── README.md              # 项目说明
```

## 🎨 设计系统

项目遵循统一的设计规范，支持：

- 主题颜色自定义
- 响应式断点设计
- 移动端触摸优化
- 暗色模式支持

## 🚀 部署

### Docker 部署

```bash
# 构建镜像
docker build -t mall-vue .

# 启动容器
docker run -p 8080:80 -d mall-vue
```

### 传统部署

```bash
# 构建生产版本
npm run build

# 拷贝 dist 目录到服务器
scp -r dist/* user@server:/path/to/web/root
```

## 🔗 API 集成

项目集成以下 API 服务：

- 认证和用户管理
- 商品管理和搜索
- 订单处理
- 支付集成
- 商户功能

## 📱 微信小程序集成

项目支持微信小程序 web-view 调用：

- 自动接收微信用户信息
- JWT Token 管理和刷新
- 版本自动切换
- 环境自适应

## 🧪 测试

```bash
# 运行单元测试
npm test

# 运行端到端测试
npm run test:e2e
```

## 📊 性能监控

项目内置性能监控：

- 首屏加载时间
- API 请求性能
- 用户交互响应
- 内存使用情况

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 📄 许可证

MIT License

## 🆘 支持

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件到项目维护者

---

**注意**: 本项目仅用于学习和开发目的，如需用于商业用途，请确保已获得相关授权。
