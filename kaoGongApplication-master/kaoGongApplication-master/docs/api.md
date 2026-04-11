# 图推动态解析 API 文档

## 概述

本文档描述图推动态解析 App 后端 API 接口规范。

**基础 URL**: `http://localhost:3000`

## 接口列表

### 1. 健康检查

**GET** `/api/health`

检查服务是否正常运行。

#### 响应示例

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

---

### 2. 上传图片

**POST** `/api/upload`

上传图形推理题图片。

#### 请求

- Content-Type: `multipart/form-data`
- Body: `image` (file) - 图片文件

#### 响应

```json
{
  "success": true,
  "data": {
    "imageId": "uuid-string",
    "url": "http://localhost:3000/uploads/uuid-string.png",
    "width": 800,
    "height": 600,
    "mimeType": "image/png",
    "size": 102400
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": "Invalid file type",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 3. 分类题目

**POST** `/api/classify`

识别图片中的题型类别。

#### 请求

```json
{
  "imageId": "uuid-string",
  "imageUrl": "http://example.com/image.png"
}
```

注：`imageId` 和 `imageUrl` 二选一。

#### 响应

```json
{
  "success": true,
  "majorType": "planar",
  "subTypeCandidates": ["rotation", "flip", "position_move"],
  "confidence": 0.92,
  "reasoningBrief": "观察图形元素的角度变化，顺时针旋转90度规律明显"
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| majorType | string | 大类：`planar` 或 `spatial` |
| subTypeCandidates | string[] | 子类型候选列表，按置信度排序 |
| confidence | number | 置信度，0-1 之间 |
| reasoningBrief | string | 简短的推理说明 |

---

### 4. 分析题目

**POST** `/api/analyze`

完整分析题目，生成动态解析。

#### 请求

```json
{
  "imageId": "uuid-string",
  "imageUrl": "http://example.com/image.png",
  "hints": ["注意旋转方向"]
}
```

注：`imageId` 和 `imageUrl` 二选一，`hints` 可选。

#### 响应

```json
{
  "success": true,
  "majorType": "planar",
  "subType": "rotation",
  "confidence": 0.95,
  "animationSupported": true,
  "animationSupportLevel": "full",
  "explanation": "详细的解析说明...",
  "ruleSummary": {
    "name": "旋转规律",
    "description": "图形元素顺时针旋转90度",
    "details": ["每个元素相对前一个顺时针旋转90度"],
    "keyElements": ["旋转角度: 90度", "方向: 顺时针"]
  },
  "animationPlan": {
    "sceneType": "planar_grid",
    "steps": [...],
    "finalAnswerHint": "选择顺时针旋转90度后的图形",
    "totalDurationMs": 5000,
    "gridConfig": {
      "rows": 3,
      "cols": 3
    }
  },
  "semiAutoConfig": {
    "enabled": false,
    "mode": "folding",
    "requiredUserActions": [],
    "helperText": ""
  },
  "warnings": []
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 是否成功分析 |
| majorType | string | 大类 |
| subType | string | 确定的子类型 |
| confidence | number | 置信度 |
| animationSupported | boolean | 是否支持动画 |
| animationSupportLevel | string | 动画支持级别：`full`/`partial`/`none` |
| explanation | string | 详细解析说明 |
| ruleSummary | object | 规则摘要 |
| animationPlan | object | 动画计划 |
| semiAutoConfig | object | 半自动模式配置（立体类必填） |
| warnings | string[] | 警告信息 |

---

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

## 题型枚举

### 平面类 (planar)

| 子类型 | 说明 |
|--------|------|
| position_move | 位置移动 |
| rotation | 旋转 |
| flip | 翻转 |
| overlay_union | 叠加求并集 |
| overlay_xor | 去同存异 |
| overlay_intersection | 叠加求交集 |
| count_change | 数量变化 |
| shade_change | 黑白块变化 |
| element_replace | 元素增减替换 |
| mixed_planar | 混合平面类 |

### 立体类 (spatial)

| 子类型 | 说明 |
|--------|------|
| folding | 折叠 |
| section | 截面 |
| solid_assembly | 立体拼图 |
| view_projection | 视图 |
| mixed_spatial | 混合立体类 |

## 动画动作类型

| 动作 | 说明 | payload 字段 |
|------|------|--------------|
| highlight | 高亮显示 | color, opacity, borderWidth |
| move | 移动 | from, to, deltaX, deltaY |
| rotate | 旋转 | fromAngle, toAngle, easing |
| flip_horizontal | 水平翻转 | easing |
| flip_vertical | 垂直翻转 | easing |
| fade_in | 淡入 | opacity |
| fade_out | 淡出 | opacity |
| count_emphasis | 数量强调 | count, color |
| overlay_show | 叠加显示 | sources, resultPosition |
| overlay_merge | 叠加合并 | sources, resultPosition |
| arrow_show | 箭头显示 | start, end, color |
| circle_show | 圆圈标注 | color, borderWidth |
| text_show | 文字显示 | text, color |
| step_note | 步骤说明 | text |

---

## 开发说明

### 环境变量

```bash
PORT=3000
GLM_API_KEY=your_api_key
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
GLM_MODEL=glm-4v-flash
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
NODE_ENV=development
```

### 启动服务

```bash
cd apps/server
pnpm install
pnpm dev
```

### 测试 API

```bash
# 健康检查
curl http://localhost:3000/api/health

# 上传图片
curl -X POST http://localhost:3000/api/upload \
  -F "image=@test.png"

# 分类
curl -X POST http://localhost:3000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"imageId": "your-image-id"}'

# 分析
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageId": "your-image-id"}'
```
