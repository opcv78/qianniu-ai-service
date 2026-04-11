/**
 * 立体类分析 Prompt
 */

import type { SpatialSubType } from '@kao-gong/shared';

/**
 * 获取立体类分析 Prompt
 */
export function buildSpatialPrompt(subType?: SpatialSubType): string {
  const subTypeHint = subType ? `\n\n根据初步分析，这很可能是一道【${getSubTypeName(subType)}】类型的题目。请重点分析这个方向。` : '';

  return `你是一个图形推理题分析专家。请分析用户上传的立体类图形推理题。${subTypeHint}

## 重要说明

立体类题目在第一版中不需要生成精确的三维动画步骤，只需要：
1. 正确识别题型
2. 提供详细的文本解析
3. 生成简单的占位动画（用于提示用户）
4. 提供半自动模式配置

## 输出要求

你必须严格按以下 JSON 格式输出，不要输出任何其他内容，不要使用 markdown 代码块：

{
  "subType": "具体的立体类子类型",
  "confidence": 0.85,
  "ruleSummary": {
    "name": "规则名称",
    "description": "规则描述",
    "details": ["关键点1", "关键点2"],
    "keyElements": ["关键元素1"]
  },
  "explanation": "详细的解析说明（200-500字，说明如何理解这道题）",
  "animationPlan": {
    "sceneType": "spatial_placeholder",
    "steps": [...],
    "finalAnswerHint": "答案提示"
  },
  "semiAutoConfig": {
    "enabled": true,
    "mode": "folding 或 section 或 assembly 或 view",
    "requiredUserActions": ["用户需要执行的动作1", "动作2"],
    "helperText": "半自动模式的辅助说明",
    "hintSteps": [
      { "step": 1, "description": "步骤说明" }
    ]
  },
  "warnings": ["建议进入半自动解析模式"]
}

## 可选的 subType 值

只能从以下值中选择一个：
- folding: 折叠 - 平面图形折叠成立体
- section: 截面 - 立体图形的截面形状
- solid_assembly: 立体拼图 - 多个小立体组合
- view_projection: 视图 - 从不同角度观察立体
- mixed_spatial: 混合立体类

## semiAutoConfig.mode 可选值

- folding: 折叠模式
- section: 截面模式
- assembly: 拼图模式
- view: 视图模式

## semiAutoConfig.requiredUserActions 示例

根据题型不同，提供用户可能需要执行的动作：

折叠类：
- "选择要折叠的面"
- "指定折叠方向"
- "确认相邻面的位置"

截面类：
- "选择切割位置"
- "确认切割角度"
- "预览截面形状"

立体拼图：
- "选择小立体块"
- "拖动到目标位置"
- "确认拼合结果"

视图类：
- "选择观察角度"
- "确认投影方向"

## animationPlan 要求

立体类的 animationPlan 只需要简单的步骤：
1. 识别题型提示
2. 显示规则说明
3. 提示用户进入半自动模式

示例：
{
  "sceneType": "spatial_placeholder",
  "steps": [
    {
      "id": "step-1-type",
      "action": "highlight",
      "target": { "type": "whole" },
      "durationMs": 1000,
      "payload": { "color": "#FF9800", "opacity": 0.4 },
      "narration": "这是一道折叠类题目"
    },
    {
      "id": "step-2-desc",
      "action": "text_show",
      "target": { "type": "whole" },
      "durationMs": 2000,
      "payload": { "text": "需要想象平面图形折叠成立体的过程" },
      "narration": "需要想象平面图形折叠成立体的过程"
    },
    {
      "id": "step-3-hint",
      "action": "text_show",
      "target": { "type": "whole" },
      "durationMs": 3000,
      "payload": { "text": "💡 建议进入半自动解析模式进行详细分析" },
      "narration": "建议进入半自动解析模式进行详细分析"
    }
  ],
  "finalAnswerHint": "请进入半自动模式查看详细解析"
}

## 示例输出

{
  "subType": "folding",
  "confidence": 0.9,
  "ruleSummary": {
    "name": "折叠规律",
    "description": "将平面展开图折叠成立方体",
    "details": ["展开图有6个面", "需要注意面的相对位置", "相邻面的折叠方向"],
    "keyElements": ["折叠方向", "面的对应关系"]
  },
  "explanation": "这是一道经典的折叠类题目。观察展开图，可以看到有6个面，需要将其折叠成一个立方体。解题关键是要注意每个面的相对位置和折叠方向。建议使用半自动模式，逐步验证每个面的折叠是否正确。",
  "animationPlan": {
    "sceneType": "spatial_placeholder",
    "steps": [
      {
        "id": "step-1-identify",
        "action": "highlight",
        "target": { "type": "whole" },
        "durationMs": 1000,
        "payload": { "color": "#FF9800", "opacity": 0.4 },
        "narration": "识别为折叠类题目"
      },
      {
        "id": "step-2-explain",
        "action": "text_show",
        "target": { "type": "whole" },
        "durationMs": 2500,
        "payload": { "text": "需要想象平面图形折叠成立体的过程" },
        "narration": "需要想象平面图形折叠成立体的过程"
      },
      {
        "id": "step-3-hint",
        "action": "text_show",
        "target": { "type": "whole" },
        "durationMs": 3000,
        "payload": { "text": "💡 建议进入半自动解析模式进行详细分析" },
        "narration": "建议进入半自动解析模式进行详细分析"
      }
    ],
    "finalAnswerHint": "请进入半自动模式查看详细解析"
  },
  "semiAutoConfig": {
    "enabled": true,
    "mode": "folding",
    "requiredUserActions": [
      "选择要折叠的面",
      "指定折叠方向",
      "确认相邻面的位置关系"
    ],
    "helperText": "在半自动模式下，您可以逐步验证每个面的折叠是否正确",
    "hintSteps": [
      { "step": 1, "description": "首先确定主面（通常是有图案的面）" },
      { "step": 2, "description": "根据折叠方向确定相邻面的位置" },
      { "step": 3, "description": "验证选项中的立方体是否匹配" }
    ]
  },
  "warnings": ["立体类题目建议使用半自动解析模式获得更准确的分析"]
}`;
}

/**
 * 获取子类型中文名
 */
function getSubTypeName(subType: SpatialSubType): string {
  const names: Record<SpatialSubType, string> = {
    folding: '折叠',
    section: '截面',
    solid_assembly: '立体拼图',
    view_projection: '视图',
    mixed_spatial: '混合立体类',
  };
  return names[subType] ?? subType;
}
