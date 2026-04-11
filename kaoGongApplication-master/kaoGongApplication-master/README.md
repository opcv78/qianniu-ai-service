# 图推动态解析 App

面向考公用户的图形推理学习 App，支持上传图片自动识别题型、分析规律并生成动态解析。

## 功能特点

- 🎯 **智能题型识别**: 自动识别平面类/立体类题型
- 📊 **动态动画解析**: 平面类题型自动生成动态解析动画
- 🔧 **半自动模式**: 立体类题型提供半自动分析引导
- 📱 **跨平台支持**: 同时支持 iOS 和 Android

## 技术栈

### 移动端
- React Native + Expo
- TypeScript
- React Native Paper (UI)
- Expo Router (路由)
- Zustand (状态管理)
- React Native Reanimated + SVG (动画)
- MMKV (本地存储)

### 后端
- Node.js + TypeScript
- Fastify
- GLM-4V-Flash (视觉大模型)
- Zod (数据验证)

### 共享模块
- 类型定义 (`@kao-gong/shared`)
- 动画引擎 (`@kao-gong/animation-core`)

## 项目结构

```
kaoGongApplication/
├── apps/
│   ├── mobile/          # Expo React Native App
│   └── server/          # Node.js 后端
├── packages/
│   ├── shared/          # 共享类型和 schemas
│   └── animation-core/  # 动画引擎
├── docs/                # 文档
│   ├── api.md           # API 文档
│   └── demo-data/       # Demo 数据
├── uploads/             # 上传文件目录
├── package.json         # 根 package.json
├── pnpm-workspace.yaml  # pnpm 工作区配置
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- Expo CLI (`npm install -g expo-cli`)
- iOS 开发: Xcode + CocoaPods
- Android 开发: Android Studio + JDK

### 安装依赖

```bash
# 克隆项目
cd kaoGongApplication

# 安装依赖
pnpm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp apps/server/.env.example apps/server/.env

# 编辑 .env 文件，配置 GLM API Key
# GLM_API_KEY=your_api_key_here
```

### 启动后端服务

```bash
cd apps/server
pnpm dev
```

服务将在 http://localhost:3000 启动。

### 启动移动端

```bash
cd apps/mobile

# iOS
pnpm ios

# Android
pnpm android

# 或使用 Expo
pnpm start
```

### 演示模式

如果没有配置 GLM API Key，可以使用演示模式：

1. 在 App 设置中启用"演示模式"
2. 在首页点击示例题目卡片
3. 使用内置 Demo 数据体验功能

## 支持的题型

### 平面类（完整支持）

| 题型 | 说明 | 动画支持 |
|------|------|----------|
| 位置移动 | 元素位置变化 | ✅ 完整 |
| 旋转 | 元素旋转 | ✅ 完整 |
| 翻转 | 水平/垂直翻转 | ✅ 完整 |
| 叠加 | 去同存异/求并/求交 | ✅ 完整 |
| 数量变化 | 元素数量递增/递减 | ✅ 完整 |
| 黑白块变化 | 黑白块位置/数量变化 | ✅ 完整 |
| 元素增减替换 | 元素添加/删除/替换 | ✅ 完整 |

### 立体类（半自动模式）

| 题型 | 说明 | 支持程度 |
|------|------|----------|
| 折叠 | 平面展开图折叠 | 🔷 半自动 |
| 截面 | 立体图形截面 | 🔷 半自动 |
| 立体拼图 | 小立体组合 | 🔷 半自动 |
| 视图 | 三视图 | 🔷 半自动 |

## API 概述

### 健康检查

```
GET /api/health
```

### 上传图片

```
POST /api/upload
Content-Type: multipart/form-data
Body: image (file)
```

### 分类题目

```
POST /api/classify
Body: { imageId?: string, imageUrl?: string }
Response: { majorType, subTypeCandidates, confidence, reasoningBrief }
```

### 分析题目

```
POST /api/analyze
Body: { imageId?: string, imageUrl?: string, hints?: string[] }
Response: { success, majorType, subType, animationPlan, ... }
```

详细 API 文档请参考 [docs/api.md](./docs/api.md)。

## 配置说明

### 后端环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3000 |
| GLM_API_KEY | GLM API Key | - |
| GLM_BASE_URL | GLM API 地址 | https://open.bigmodel.cn/api/paas/v4 |
| GLM_MODEL | 模型名称 | glm-4v-flash |
| UPLOAD_DIR | 上传目录 | ./uploads |
| MAX_FILE_SIZE | 最大文件大小 | 10485760 (10MB) |

### 移动端设置

在 App 设置页面可以配置：
- API 服务地址
- 是否显示调试信息
- 当前使用的模型
- 是否启用演示模式

## 开发指南

### 构建 shared 包

```bash
cd packages/shared
pnpm build
```

### 构建 animation-core 包

```bash
cd packages/animation-core
pnpm build
```

### 运行测试

```bash
# 所有包
pnpm test

# 单个包
cd packages/shared && pnpm test
```

### 类型检查

```bash
# 根目录
pnpm tsc --noEmit
```

## 项目特色

### 1. 分层架构

- **题型分层处理**: 平面类全自动，立体类半自动
- **LLM 输出严格校验**: 所有输出经过 Zod Schema 验证
- **自动重试机制**: 格式错误时自动重试并提示纠正

### 2. 动画系统

- **SVG + Reanimated**: 高性能动画渲染
- **时间轴播放器**: 支持播放、暂停、步骤跳转
- **模板化设计**: 易于扩展新的动画模板

### 3. Demo 模式

- 内置 5 个 Demo 数据
- 无需 API Key 即可体验
- 方便演示和测试

## 注意事项

1. **GLM API Key**: 需要配置智谱 AI 的 API Key 才能使用真实分析功能
2. **图片格式**: 支持 JPEG、PNG、GIF、WebP
3. **文件大小**: 单个图片最大 10MB
4. **网络要求**: 移动端需要能访问后端服务

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request
