# 图推动态解析 App - 快速启动指南

## 安装步骤

### 1. 安装依赖

在项目根目录运行：

```bash
cd E:\SoftWare\docker\claudeCodeProject\kaoGongApplication

# 安装所有依赖
pnpm install
```

### 2. 构建共享包

```bash
# 构建 shared 包
cd packages/shared
pnpm build

# 构建 animation-core 包
cd ../animation-core
pnpm build
```

### 3. 启动后端服务

```bash
cd apps/server

# 复制环境变量模板
copy .env.example .env

# 编辑 .env 文件，填入你的 GLM API Key
# GLM_API_KEY=your_api_key_here

# 启动服务
pnpm dev
```

后端服务将在 http://localhost:3000 启动。

### 4. 启动移动端

打开新的终端窗口：

```bash
cd apps/mobile

# 清理缓存（如果遇到问题）
pnpm start --clear

# 或者正常启动
pnpm start
```

## 常见问题

### 问题 1: Unable to resolve "expo-router"

解决方案：确保在项目根目录运行了 `pnpm install`

### 问题 2: Metro bundler 错误

解决方案：清理缓存后重新启动

```bash
cd apps/mobile
rm -rf .expo node_modules/.cache
pnpm start --clear
```

### 问题 3: 缺少 workspace 依赖

解决方案：先构建共享包

```bash
cd packages/shared
pnpm build

cd ../animation-core
pnpm build
```

### 问题 4: iOS/Android 模拟器问题

解决方案：
- iOS: 确保安装了 Xcode 和 CocoaPods
- Android: 确保安装了 Android Studio 和配置了 ANDROID_HOME

## 演示模式

如果暂时没有 GLM API Key，可以使用演示模式：

1. 启动 App 后，点击首页的"示例题目"卡片
2. 内置的 Demo 数据会自动加载，无需 API 即可体验功能

## 目录结构

```
kaoGongApplication/
├── apps/
│   ├── mobile/          # React Native Expo App
│   └── server/          # Fastify 后端
├── packages/
│   ├── shared/          # 共享类型
│   └── animation-core/  # 动画引擎
└── docs/                # 文档
```

## 技术支持

如遇问题，请检查：
1. Node.js 版本 >= 18
2. pnpm 版本 >= 8
3. 所有依赖已正确安装
4. 共享包已构建
