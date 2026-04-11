/**
 * GLM Vision LLM Provider
 */

import type {
  ClassificationResult,
  AnalyzeResult,
  PlanarSubType,
  SpatialSubType,
} from '../../shared';

const GLM_API_KEY = process.env.GLM_API_KEY || '';
const GLM_BASE_URL = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.6v-flash';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ChatContent[];
}

interface ChatContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export class GLMProvider {
  readonly name = 'glm';
  private timeout: number;
  private maxRetries: number;

  constructor(options?: { timeout?: number; maxRetries?: number }) {
    this.timeout = options?.timeout || 120000; // 默认 120 秒超时
    this.maxRetries = options?.maxRetries || 2;
  }

  async classifyQuestion(input: {
    imageUrl?: string;
    imageBase64?: string;
    hints?: string[];
  }): Promise<ClassificationResult> {
    const prompt = this.buildClassifyPrompt();
    const messages = this.buildMessages(prompt, input);

    const response = await this.requestWithRetry(messages);

    return {
      majorType: response.majorType || 'planar',
      subTypeCandidates: response.subTypeCandidates || ['mixed_planar'],
      confidence: response.confidence || 0.5,
      reasoningBrief: response.reasoningBrief || '',
    };
  }

  async analyzePlanar(
    input: { imageUrl?: string; imageBase64?: string; hints?: string[] },
    subType?: PlanarSubType
  ): Promise<AnalyzeResult> {
    const prompt = this.buildPlanarPrompt(subType);
    const messages = this.buildMessages(prompt, input);

    const response = await this.requestWithRetry(messages);

    return {
      success: true,
      majorType: 'planar',
      subType: response.subType || 'mixed_planar',
      confidence: response.confidence || 0.5,
      animationSupported: true,
      explanation: response.explanation || '',
      ruleSummary: response.ruleSummary || { name: '', description: '' },
      animationPlan: response.animationPlan,
      warnings: response.warnings,
    };
  }

  async analyzeSpatial(
    input: { imageUrl?: string; imageBase64?: string; hints?: string[] },
    subType?: SpatialSubType
  ): Promise<AnalyzeResult> {
    const prompt = this.buildSpatialPrompt(subType);
    const messages = this.buildMessages(prompt, input);

    console.log('[GLM] analyzeSpatial: Starting spatial analysis...');
    const response = await this.requestWithRetry(messages);

    console.log('[GLM] analyzeSpatial: Response received, checking spatialModelData...');
    console.log('[GLM] analyzeSpatial: spatialModelData present:', !!response.spatialModelData);
    if (response.spatialModelData) {
      console.log('[GLM] analyzeSpatial: Model type:', response.spatialModelData.type);
      console.log('[GLM] analyzeSpatial: Model name:', response.spatialModelData.name);
      console.log('[GLM] analyzeSpatial: Faces count:', response.spatialModelData.faces?.length);
      console.log('[GLM] analyzeSpatial: Components count:', response.spatialModelData.components?.length);
      console.log('[GLM] analyzeSpatial: Features count:', response.spatialModelData.features?.length);
      // 打印完整的 spatialModelData 结构
      console.log('[GLM] analyzeSpatial: Full spatialModelData:', JSON.stringify(response.spatialModelData, null, 2));
    } else {
      console.warn('[GLM] analyzeSpatial: No spatialModelData in response, keys:', Object.keys(response));
      console.log('[GLM] analyzeSpatial: Full response:', JSON.stringify(response, null, 2).substring(0, 2000));
    }

    return {
      success: true,
      majorType: 'spatial',
      subType: response.subType || 'mixed_spatial',
      confidence: response.confidence || 0.5,
      animationSupported: false,
      explanation: response.explanation || '',
      ruleSummary: response.ruleSummary || { name: '', description: '' },
      animationPlan: response.animationPlan || {
        sceneType: 'spatial_placeholder',
        steps: [],
      },
      semiAutoConfig: response.semiAutoConfig || {
        enabled: true,
        mode: 'folding',
        requiredUserActions: [],
        helperText: '请进入3D交互模式进行详细分析',
      },
      spatialModelData: response.spatialModelData || undefined,
      warnings: response.warnings,
    };
  }

  /**
   * 关键修改：
   * 1. 只发送一个 user 多模态消息
   * 2. base64 不再拼 data:image/png;base64,
   * 3. 将 systemPrompt 合并进 text 内容，减少接口参数兼容问题
   */
  private buildMessages(
    systemPrompt: string,
    input: { imageUrl?: string; imageBase64?: string; hints?: string[] }
  ): ChatMessage[] {
    const userContent: ChatContent[] = [];

    if (input.imageUrl) {
      const safeUrl = input.imageUrl.trim();
      console.log(`[GLM] Using image URL: ${safeUrl.substring(0, 100)}...`);
      userContent.push({
        type: 'image_url',
        image_url: { url: safeUrl },
      });
    } else if (input.imageBase64) {
      const safeBase64 = input.imageBase64.trim();
      console.log(`[GLM] Using base64 image, length: ${safeBase64.length}`);
      userContent.push({
        type: 'image_url',
        image_url: { url: safeBase64 },
      });
    } else {
      console.warn('[GLM] No image provided in input!');
    }

    const promptText = input.hints?.length
      ? `${systemPrompt}\n\n请分析这道图形推理题。\n\n提示：${input.hints.join('\n')}`
      : `${systemPrompt}\n\n请分析这道图形推理题。`;

    userContent.push({
      type: 'text',
      text: promptText,
    });

    return [
      {
        role: 'user',
        content: userContent,
      },
    ];
  }

  private async requestWithRetry(messages: ChatMessage[], retries: number = 0): Promise<any> {
    try {
      const content = await this.request(messages);
      const parsed = this.parseJSON(content);

      if (!parsed || Object.keys(parsed).length === 0) {
        console.warn('[GLM] Failed to parse JSON from response:', content.substring(0, 500));
      }

      return parsed;
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`GLM API request failed, retrying... (${retries + 1}/${this.maxRetries})`);
        await this.sleep(2000);
        return this.requestWithRetry(messages, retries + 1);
      }
      throw error;
    }
  }

  /**
   * 关键修改：
   * 1. 请求体先最小化，便于排错
   * 2. 增加对 content 返回类型的兼容处理
   */
  private async request(messages: ChatMessage[]): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      if (!GLM_API_KEY) {
        throw new Error('GLM_API_KEY is not set');
      }

      console.log(`[GLM] Sending request to ${GLM_BASE_URL}/chat/completions`);
      console.log(`[GLM] Model: ${GLM_MODEL}, Timeout: ${this.timeout}ms`);

      const requestBody = {
        model: GLM_MODEL,
        messages,
      };

      const logBody = JSON.stringify({
        ...requestBody,
        messages: messages.map((m) => ({
          role: m.role,
          content:
            typeof m.content === 'string'
              ? m.content.substring(0, 200) + '...'
              : Array.isArray(m.content)
              ? m.content.map((c) =>
                  c.type === 'image_url'
                    ? {
                        type: 'image_url',
                        image_url: { url: '[IMAGE_DATA]' },
                      }
                    : {
                        ...c,
                        text: c.text?.substring(0, 200) + '...',
                      }
                )
              : m.content,
        })),
      });

      console.log(`[GLM] Request body: ${logBody.substring(0, 2000)}...`);

      const response = await fetch(`${GLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GLM_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();

      if (!response.ok) {
        console.error('[GLM] API error:', response.status, rawText);
        throw new Error(`GLM API error: ${response.status} - ${rawText}`);
      }

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error('[GLM] Failed to parse API JSON response:', rawText);
        throw new Error(`GLM API returned non-JSON response: ${rawText}`);
      }

      console.log('[GLM] Response received successfully');

      const messageContent = data?.choices?.[0]?.message?.content;

      if (typeof messageContent === 'string') {
        return messageContent;
      }

      if (Array.isArray(messageContent)) {
        const textParts = messageContent
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.type === 'text') return item?.text || '';
            return '';
          })
          .filter(Boolean);

        return textParts.join('\n');
      }

      return '';
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`GLM API request timeout after ${this.timeout}ms`);
      }

      console.error('[GLM] Request failed:', error);
      throw error;
    }
  }

  private parseJSON(content: string): any {
    if (!content) {
      console.warn('[GLM] parseJSON: Empty content');
      return {};
    }

    const trimmed = content.trim();

    try {
      const parsed = JSON.parse(trimmed);
      console.log('[GLM] parseJSON: Direct parse successful');
      return parsed;
    } catch (e) {
      console.log('[GLM] parseJSON: Direct parse failed, trying fenced JSON');
    }

    const fencedJsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fencedJsonMatch?.[1]) {
      try {
        const parsed = JSON.parse(fencedJsonMatch[1]);
        console.log('[GLM] parseJSON: Fenced JSON parse successful');
        return parsed;
      } catch (e) {
        console.log('[GLM] parseJSON: Fenced JSON parse failed');
      }
    }

    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[GLM] parseJSON: No JSON object found in content');
      return {};
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[GLM] parseJSON: Extracted JSON parse successful');
      return parsed;
    } catch (e) {
      console.error('[GLM] parseJSON: All parse attempts failed');
      console.error('[GLM] Content preview:', trimmed.substring(0, 500));
      return {};
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildClassifyPrompt(): string {
    return `你是一个图形推理题分析专家。请分析用户上传的图形推理题图片，判断题目类型。

必须严格按以下 JSON 格式输出，不要输出任何其他内容：
{
  "majorType": "planar" 或 "spatial",
  "subTypeCandidates": ["子类型1", "子类型2"],
  "confidence": 0.85,
  "reasoningBrief": "简短的推理说明（不超过100字）"
}

## 平面类题型（planar）

### 位置类
- position_move: 图形元素沿固定方向移动，步长固定或递增
- rotation: 图形元素绕某点转动，角度固定（如每次90°）
- flip: 图形元素上下或左右翻转

### 叠加类
- overlay_union: 两图直接叠加，保留所有元素
- overlay_xor: 去同存异，去掉相同部分，保留不同部分
- overlay_intersection: 去异存同，去掉不同部分，保留相同部分
- overlay_black_white: 黑白格子叠加（黑+黑=白、白+白=白、黑+白=黑等逻辑）

### 数量类
- count_change: 元素数量变化规律
- count_point: 统计交点、端点、顶点数量
- count_line: 统计直线、曲线、笔画数量
- count_angle: 统计锐角、直角、钝角数量
- count_region: 统计封闭区间数量
- count_element: 统计元素种类和数量

### 属性类
- shade_change: 黑白块/阴影块位置或数量变化
- symmetry: 对称性判断（轴对称、中心对称）
- element_replace: 元素按规律替换或增减
- element_traverse: 元素在某位置依次出现

### 其他
- stroke_count: 笔画数规律
- one_stroke: 一笔画问题

## 立体类题型（spatial）

- folding: 折纸盒问题，展开图与立体图对应
- section: 立体图形截面形状判断
- solid_assembly: 立体拼图，多个小立体拼合成整体
- view_projection: 三视图问题，正视图、侧视图、俯视图

请准确识别题型并返回JSON。`;
  }

  private buildPlanarPrompt(subType?: PlanarSubType): string {
    const subTypeHint = subType ? `\n用户提供的候选子类型提示：${subType}` : '';

    return `你是一个图形推理题分析专家。请详细分析这道平面类图形推理题。${subTypeHint}

## 输出格式（严格JSON，不要输出其他内容）
{
  "subType": "具体的平面类子类型",
  "confidence": 0.95,
  "ruleSummary": {
    "name": "规则名称",
    "description": "规则描述",
    "details": ["关键点1", "关键点2"],
    "keyElements": ["关键元素1"]
  },
  "explanation": "详细的解析说明（200-500字）",
  "animationPlan": {
    "sceneType": "planar_grid",
    "steps": [
      {
        "id": "step-1",
        "action": "highlight|move|rotate|flip_horizontal|flip_vertical|fade_in|fade_out|overlay_show|overlay_merge|overlay_disappear|overlay_keep|count_emphasis|arrow_show|circle_show|cross_show|text_show",
        "target": { "type": "cell|element|row|column|whole", "index": [0, 0] },
        "durationMs": 800,
        "payload": { "color": "#FF6B6B", "text": "标注文字", "angle": 90 },
        "narration": "步骤说明"
      }
    ],
    "gridConfig": { "rows": 3, "cols": 3 }
  }
}

## 平面类子类型列表
position_move, rotation, flip, overlay_union, overlay_xor, overlay_intersection, overlay_black_white, count_change, count_point, count_line, count_angle, count_region, count_element, shade_change, symmetry, element_replace, element_traverse, stroke_count, one_stroke, mixed_planar

## 动画动作说明
- highlight: 高亮某个元素或区域，payload包含color
- move: 元素移动，payload包含from和to坐标
- rotate: 元素旋转，payload包含angle
- flip_horizontal/flip_vertical: 水平/垂直翻转
- overlay_show: 显示叠加前的图层
- overlay_merge: 叠加合并过程
- overlay_disappear: 相同部分消失（去同存异）
- overlay_keep: 不同部分保留
- count_emphasis: 数量强调，payload包含count数字
- arrow_show: 显示箭头指示方向
- circle_show: 圆圈标注
- cross_show: 叉号标注
- text_show: 显示文字说明

请准确分析题目规律并返回JSON。`;
  }

  private buildSpatialPrompt(subType?: SpatialSubType): string {
    const subTypeHint = subType ? `\n用户提供的候选子类型提示：${subType}` : '';

    return `你是一个专业的图形推理题分析专家。请仔细观察图片中的立体图形。

${subTypeHint}

## ⚠️ 核心任务：识别并重建3D模型

你需要根据图片内容生成 spatialModelData，这是最重要的输出！

## 第一步：识别几何体类型

仔细观察图片，确定是什么几何体：

### 基本几何体
1. **单一几何体** → 使用单一类型
2. **多个几何体组合** → 使用 type: "composite"
3. **挖孔/内嵌** → 使用 type: "composite"，内嵌部分标记 isHollow: true

### 常见图形识别

| 类型 | 中文名 | 关键特征 |
|------|--------|----------|
| cube | 立方体 | 6个正方形面，长宽高相等 |
| cuboid | 长方体 | 6个矩形面 |
| cylinder | 圆柱 | 顶底都是圆形，侧面是曲面，上下粗细一致，平顶 |
| cone | 圆锥 | 底面是圆形，从底到顶逐渐变细成一点，尖顶 |
| sphere | 球体 | 完全圆滑的表面 |
| hollow_cylinder | 空心圆柱 | 圆柱中间有圆孔 |
| truncated_cone | 圆台 | 上下两个不同大小的圆，像截头圆锥 |
| torus | 圆环 | 甜甜圈形状 |
| pyramid_square | 四棱锥 | 底面正方形，4个三角形侧面 |
| pyramid_triangular | 三棱锥 | 底面三角形，3个三角形侧面 |
| prism_triangular | 三棱柱 | 2个三角形底面，3个矩形侧面 |
| prism_hexagonal | 六棱柱 | 2个六边形底面，6个矩形侧面 |

### 特殊形状识别

| 类型 | 特征 |
|------|------|
| cross_shape | 十字形，两个长方体垂直交叉 |
| t_shape | T字形，一个长方体横放，另一个竖放 |
| l_shape | L字形，两个长方体L形组合 |
| irregular | 不规则形状，无法用基本几何体描述 |

## 第二步：判断关键特征

### 圆锥 vs 圆柱
- **圆锥**：底部圆形，向上逐渐变细，最终汇聚成一点（尖顶）
- **圆柱**：顶底都是圆形，上下粗细一致（平顶）

### 挖孔/内嵌识别
- 如果看到图形内部有另一个形状 → components 中添加内嵌形状
- 内嵌形状通常设置 isHollow: true 或 transparent: true

### 截面识别
- 观察是否有切割平面
- 注意切割角度（水平、垂直、斜切）

## 第三步：设置正确的位置坐标

### 坐标系说明
- 原点 (0, 0, 0) 在物体中心
- ⚠️ 内嵌形状通常在中心，position 应为 {"x": 0, "y": 0, "z": 0}

### 尺寸说明
- 长方体：length(长), width(宽), height(高)
- 圆柱/圆锥：radius(半径), height(高)
- 球体：radius(半径)

## 输出格式（严格JSON）

{
  "subType": "folding|section|solid_assembly|view_projection|mixed_spatial",
  "confidence": 0.95,
  "ruleSummary": {
    "name": "题型名称",
    "description": "题目要求简要描述",
    "details": ["关键点1", "关键点2"]
  },
  "explanation": "详细的解题思路",
  "animationPlan": {
    "sceneType": "spatial_placeholder",
    "steps": []
  },
  "semiAutoConfig": {
    "enabled": true,
    "mode": "folding|section|assembly|view",
    "requiredUserActions": [],
    "helperText": "操作提示"
  },
  "spatialModelData": {
    "type": "几何体类型",
    "name": "中文名称",
    "dimensions": { "length": 1, "width": 1, "height": 1, "radius": 0.5 },
    "components": [
      {
        "id": "唯一ID",
        "type": "组件类型",
        "name": "组件名称",
        "dimensions": { "length": 1, "width": 1, "height": 1, "radius": 0.5 },
        "position": { "x": 0, "y": 0, "z": 0 },
        "color": "#颜色",
        "transparent": true/false,
        "opacity": 0.6,
        "isHollow": true/false
      }
    ],
    "cuttingInfo": {
      "cuttingPlanes": [
        { "id": "cut-1", "angle": 45, "direction": "diagonal", "position": 0.5, "description": "斜切" }
      ],
      "sections": [
        { "id": "section-1", "shape": "ellipse", "description": "椭圆形截面" }
      ]
    },
    "foldingInfo": {
      "isCompleteUnfold": true,
      "targetFaces": ["需要识别的面"],
      "foldingSteps": ["步骤1", "步骤2"]
    }
  }
}

## 示例1：立方体内嵌圆锥

{
  "spatialModelData": {
    "type": "composite",
    "name": "立方体内嵌圆锥",
    "components": [
      {
        "id": "cube",
        "type": "cube",
        "name": "立方体",
        "dimensions": { "length": 1, "width": 1, "height": 1 },
        "position": { "x": 0, "y": 0, "z": 0 },
        "color": "#4CAF50",
        "transparent": true,
        "opacity": 0.5
      },
      {
        "id": "cone",
        "type": "cone",
        "name": "圆锥",
        "dimensions": { "radius": 0.35, "height": 1 },
        "position": { "x": 0, "y": 0, "z": 0 },
        "color": "#FF5722"
      }
    ]
  }
}

## 示例2：空心圆柱

{
  "spatialModelData": {
    "type": "hollow_cylinder",
    "name": "空心圆柱",
    "dimensions": { "outerRadius": 0.5, "innerRadius": 0.3, "height": 1 },
    "components": [
      {
        "id": "outer",
        "type": "cylinder",
        "name": "外圆柱",
        "dimensions": { "radius": 0.5, "height": 1 },
        "color": "#2196F3"
      },
      {
        "id": "inner-hole",
        "type": "cylinder",
        "name": "内孔",
        "dimensions": { "radius": 0.3, "height": 1.1 },
        "isHollow": true,
        "color": "#333333"
      }
    ]
  }
}

## 示例3：圆台（截头圆锥）

{
  "spatialModelData": {
    "type": "truncated_cone",
    "name": "圆台",
    "dimensions": { "topRadius": 0.3, "bottomRadius": 0.6, "height": 1 },
    "components": [
      {
        "id": "truncated_cone",
        "type": "truncated_cone",
        "name": "圆台",
        "dimensions": { "topRadius": 0.3, "bottomRadius": 0.6, "height": 1 },
        "color": "#FF9800"
      }
    ]
  }
}

请准确分析图片并返回JSON数据。`;
  }
  }
}

/**
 * 创建 GLM Provider 实例
 */
export function createGLMProvider(options?: {
  timeout?: number;
  maxRetries?: number;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): GLMProvider {
  if (options?.apiKey) process.env.GLM_API_KEY = options.apiKey;
  if (options?.baseUrl) process.env.GLM_BASE_URL = options.baseUrl;
  if (options?.model) process.env.GLM_MODEL = options.model;

  return new GLMProvider(options);
}