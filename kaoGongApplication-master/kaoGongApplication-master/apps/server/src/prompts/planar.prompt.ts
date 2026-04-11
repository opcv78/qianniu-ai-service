/**
 * 平面类分析 Prompt
 */

import type { PlanarSubType } from '@kao-gong/shared';

/**
 * 获取平面类分析 Prompt
 */
export function buildPlanarPrompt(subType?: PlanarSubType): string {
  const subTypeHint = subType ? `\n\n根据初步分析，这很可能是一道【${getSubTypeName(subType)}】类型的题目。请重点分析这个方向，但如果发现其他规律也可以提出。` : '';

  return `你是一个图形推理题分析专家。请详细分析用户上传的平面类图形推理题，并生成动态解析步骤。${subTypeHint}

## 输出要求

你必须严格按以下 JSON 格式输出，不要输出任何其他内容，不要使用 markdown 代码块：

{
  "subType": "具体的平面类子类型",
  "confidence": 0.95,
  "ruleSummary": {
    "name": "规则名称",
    "description": "规则描述（详细说明发现的规律）",
    "details": ["关键点1", "关键点2"],
    "keyElements": ["关键元素1"]
  },
  "explanation": "详细的解析说明（200-500字）",
  "animationPlan": {
    "sceneType": "planar_grid",
    "steps": [...],
    "finalAnswerHint": "答案提示"
  },
  "warnings": ["可选的警告信息"]
}

## 可选的 subType 值

只能从以下值中选择一个：
- position_move: 位置移动
- rotation: 旋转
- flip: 翻转
- overlay_union: 叠加求并集
- overlay_xor: 去同存异
- overlay_intersection: 叠加求交集
- count_change: 数量变化
- shade_change: 黑白块变化
- element_replace: 元素增减替换
- mixed_planar: 混合平面类

## sceneType 可选值

- planar_grid: 九宫格或类似网格布局
- planar_sequence: 横向或纵向序列
- planar_single: 单图分析

## animationPlan.steps 格式

每个步骤必须包含：

{
  "id": "step-1-highlight",
  "action": "动作类型",
  "target": {
    "type": "cell 或 element 或 row 或 column 或 whole",
    "index": [0, 0]
  },
  "durationMs": 800,
  "payload": {
    // 根据动作类型不同有不同字段
  },
  "narration": "步骤说明文字"
}

## action 可选值及其对应的 payload

### highlight - 高亮显示
{
  "color": "#FF6B6B",
  "opacity": 0.5,
  "borderWidth": 3
}

### move - 移动
{
  "from": [0, 0],
  "to": [0, 1],
  "deltaX": 1,
  "deltaY": 0
}

### rotate - 旋转
{
  "fromAngle": 0,
  "toAngle": 90,
  "easing": "ease-in-out"
}

### flip_horizontal / flip_vertical - 翻转
{
  "easing": "ease-in-out"
}

### fade_in / fade_out - 淡入/淡出
{
  "opacity": 0.8
}

### count_emphasis - 数量强调
{
  "count": 3,
  "color": "#FF6B6B"
}

### overlay_show / overlay_merge - 叠加
{
  "sources": [[0, 0], [0, 1]],
  "resultPosition": [0, 2]
}

### arrow_show - 箭头显示
{
  "start": [0.2, 0.5],
  "end": [0.8, 0.5],
  "color": "#4CAF50"
}

### circle_show - 圆圈标注
{
  "color": "#2196F3",
  "borderWidth": 2
}

### text_show - 文字显示
{
  "text": "显示的文字内容",
  "color": "#333333"
}

### step_note - 步骤说明
{
  "text": "步骤说明文字"
}

## target.index 说明

- 当 target.type 为 cell 时，index 为 [row, col]，范围 0-2
- 当 target.type 为 element 时，index 为元素编号
- 当 target.type 为 row 时，index 为行号，范围 0-2
- 当 target.type 为 column 时，index 为列号，范围 0-2
- 当 target.type 为 whole 时，不需要 index

## 步骤设计原则

1. 每个步骤的 narration 要清晰易懂
2. 步骤数量控制在 5-10 个
3. 步骤要循序渐进，先观察后分析
4. 动画时长合理，单个步骤 400-2000ms
5. 最后一步要总结规律

## 示例输出

{
  "subType": "rotation",
  "confidence": 0.95,
  "ruleSummary": {
    "name": "旋转规律",
    "description": "图形元素顺时针旋转90度",
    "details": ["每个元素相对前一个顺时针旋转90度", "旋转中心为元素中心点"],
    "keyElements": ["旋转角度: 90度", "方向: 顺时针"]
  },
  "explanation": "通过观察题目中的图形变化规律，可以发现每个图形元素都是在前一个元素的基础上顺时针旋转90度得到的。这是一个典型的旋转规律题，解题关键是识别旋转角度和方向。",
  "animationPlan": {
    "sceneType": "planar_grid",
    "steps": [
      {
        "id": "step-1-highlight-initial",
        "action": "highlight",
        "target": { "type": "cell", "index": [0, 0] },
        "durationMs": 800,
        "payload": { "color": "#FF6B6B", "opacity": 0.5 },
        "narration": "首先观察第一个元素"
      },
      {
        "id": "step-2-rotate",
        "action": "rotate",
        "target": { "type": "cell", "index": [0, 0] },
        "durationMs": 1000,
        "payload": { "fromAngle": 0, "toAngle": 90 },
        "narration": "元素顺时针旋转90度"
      },
      {
        "id": "step-3-summary",
        "action": "text_show",
        "target": { "type": "whole" },
        "durationMs": 2000,
        "payload": { "text": "规律：顺时针旋转90度" },
        "narration": "每个元素顺时针旋转90度"
      }
    ],
    "finalAnswerHint": "选择顺时针旋转90度后的图形",
    "gridConfig": { "rows": 3, "cols": 3 }
  }
}`;
}

/**
 * 获取子类型中文名
 */
function getSubTypeName(subType: PlanarSubType): string {
  const names: Record<PlanarSubType, string> = {
    position_move: '位置移动',
    rotation: '旋转',
    flip: '翻转',
    overlay_union: '叠加求并集',
    overlay_xor: '去同存异',
    overlay_intersection: '叠加求交集',
    count_change: '数量变化',
    shade_change: '黑白块变化',
    element_replace: '元素增减替换',
    mixed_planar: '混合平面类',
  };
  return names[subType] ?? subType;
}
