/**
 * Demo 数据 - 演示模式使用
 */

import type { AnalyzeResult } from '@kao-gong/shared';

/**
 * 位置移动 Demo
 */
export const DEMO_POSITION_MOVE: AnalyzeResult = {
  success: true,
  majorType: 'planar',
  subType: 'position_move',
  confidence: 0.95,
  animationSupported: true,
  animationSupportLevel: 'full',
  explanation: '通过观察题目中的图形变化规律，可以发现每个图形元素都是在前一个元素的基础上向右移动一格。这是一个典型的位置移动规律题，解题关键是识别移动方向和步长。',
  ruleSummary: {
    name: '位置移动规律',
    description: '图形元素在九宫格中按照固定方向和步长移动',
    details: [
      '观察第一行，元素从左向右移动一格',
      '移动步长固定为1格',
      '移动方向为从左到右',
    ],
    keyElements: ['移动方向: 向右', '移动步长: 1格'],
  },
  animationPlan: {
    sceneType: 'planar_grid',
    steps: [
      {
        id: 'step-1-highlight',
        action: 'highlight',
        target: { type: 'cell', index: [0, 0] },
        durationMs: 800,
        payload: { color: '#FF6B6B', opacity: 0.5 },
        narration: '首先观察第一行第一个元素的位置',
      },
      {
        id: 'step-2-arrow',
        action: 'arrow_show',
        target: { type: 'cell', index: [0, 0] },
        durationMs: 600,
        payload: { start: [0.2, 0.5], end: [0.8, 0.5], color: '#4CAF50' },
        narration: '元素向右移动一格',
      },
      {
        id: 'step-3-move',
        action: 'move',
        target: { type: 'cell', index: [0, 0] },
        durationMs: 800,
        payload: { from: [0, 0], to: [0, 1], deltaX: 1, deltaY: 0 },
        narration: '移动到第二列',
      },
      {
        id: 'step-4-highlight-result',
        action: 'highlight',
        target: { type: 'cell', index: [0, 1] },
        durationMs: 600,
        payload: { color: '#4CAF50', opacity: 0.3 },
        narration: '完成移动',
      },
      {
        id: 'step-5-summary',
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 2000,
        payload: { text: '规律：每步向右移动一格' },
        narration: '规律：每步向右移动一格',
      },
    ],
    finalAnswerHint: '选择向右移动一格后的图形',
    totalDurationMs: 4800,
    gridConfig: { rows: 3, cols: 3 },
  },
};

/**
 * 旋转 Demo
 */
export const DEMO_ROTATION: AnalyzeResult = {
  success: true,
  majorType: 'planar',
  subType: 'rotation',
  confidence: 0.92,
  animationSupported: true,
  animationSupportLevel: 'full',
  explanation: '通过观察题目中的图形变化规律，可以发现每个图形元素都是在前一个元素的基础上顺时针旋转90度得到的。这是一个典型的旋转规律题。',
  ruleSummary: {
    name: '旋转规律',
    description: '图形元素顺时针旋转90度',
    details: [
      '每个元素相对前一个顺时针旋转90度',
      '旋转中心为元素中心点',
      '旋转方向为顺时针',
    ],
    keyElements: ['旋转角度: 90度', '方向: 顺时针'],
  },
  animationPlan: {
    sceneType: 'planar_grid',
    steps: [
      {
        id: 'step-1-highlight',
        action: 'highlight',
        target: { type: 'cell', index: [0, 0] },
        durationMs: 800,
        payload: { color: '#FF6B6B', opacity: 0.5 },
        narration: '观察第一个元素的初始角度',
      },
      {
        id: 'step-2-rotate',
        action: 'rotate',
        target: { type: 'cell', index: [0, 0] },
        durationMs: 1000,
        payload: { fromAngle: 0, toAngle: 90, easing: 'ease-in-out' },
        narration: '元素顺时针旋转90度',
      },
      {
        id: 'step-3-highlight',
        action: 'highlight',
        target: { type: 'cell', index: [0, 1] },
        durationMs: 600,
        payload: { color: '#4CAF50', opacity: 0.3 },
        narration: '旋转后的位置',
      },
      {
        id: 'step-4-summary',
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 2000,
        payload: { text: '规律：顺时针旋转90度' },
        narration: '规律：顺时针旋转90度',
      },
    ],
    finalAnswerHint: '选择顺时针旋转90度后的图形',
    totalDurationMs: 4400,
    gridConfig: { rows: 3, cols: 3 },
  },
};

/**
 * 叠加 Demo
 */
export const DEMO_OVERLAY: AnalyzeResult = {
  success: true,
  majorType: 'planar',
  subType: 'overlay_xor',
  confidence: 0.88,
  animationSupported: true,
  animationSupportLevel: 'full',
  explanation: '通过观察题目中的图形变化规律，可以发现这道题采用的是去同存异（异或）规律。两个图形叠加时，相同的部分消失，不同的部分保留。',
  ruleSummary: {
    name: '去同存异规律',
    description: '两个图形叠加，相同部分消失，不同部分保留',
    details: [
      '第一幅图和第二幅图叠加',
      '相同的线条消失',
      '不同的线条保留',
    ],
    keyElements: ['叠加方式: 去同存异', '运算类型: 异或'],
  },
  animationPlan: {
    sceneType: 'planar_grid',
    steps: [
      {
        id: 'step-1-highlight-first',
        action: 'highlight',
        target: { type: 'cell', index: [0, 0] },
        durationMs: 800,
        payload: { color: '#FF6B6B', opacity: 0.6 },
        narration: '首先观察第一个图形',
      },
      {
        id: 'step-2-highlight-second',
        action: 'highlight',
        target: { type: 'cell', index: [0, 1] },
        durationMs: 800,
        payload: { color: '#4CAF50', opacity: 0.6 },
        narration: '然后观察第二个图形',
      },
      {
        id: 'step-3-overlay',
        action: 'overlay_show',
        target: { type: 'cell', index: [0, 2] },
        durationMs: 600,
        payload: { sources: [[0, 0], [0, 1]], resultPosition: [0, 2], opacity: 0.5 },
        narration: '将两个图形叠加',
      },
      {
        id: 'step-4-merge',
        action: 'overlay_merge',
        target: { type: 'cell', index: [0, 2] },
        durationMs: 1000,
        payload: { sources: [[0, 0], [0, 1]], resultPosition: [0, 2] },
        narration: '执行去同存异操作',
      },
      {
        id: 'step-5-summary',
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 2000,
        payload: { text: '规律：去同存异' },
        narration: '规律：去同存异',
      },
    ],
    finalAnswerHint: '选择去同存异后的图形',
    totalDurationMs: 5200,
    gridConfig: { rows: 3, cols: 3 },
  },
};

/**
 * 折叠 Demo (立体类)
 */
export const DEMO_FOLDING: AnalyzeResult = {
  success: true,
  majorType: 'spatial',
  subType: 'folding',
  confidence: 0.85,
  animationSupported: false,
  animationSupportLevel: 'none',
  explanation: '这是一道经典的折叠类题目。观察展开图，可以看到有6个面，需要将其折叠成一个立方体。解题关键是要注意每个面的相对位置和折叠方向。',
  ruleSummary: {
    name: '折叠规律',
    description: '将平面展开图折叠成立方体',
    details: [
      '展开图有6个面',
      '需要注意面的相对位置',
      '相邻面的折叠方向很重要',
    ],
    keyElements: ['折叠方向', '面的对应关系'],
  },
  animationPlan: {
    sceneType: 'spatial_placeholder',
    steps: [
      {
        id: 'step-1-identify',
        action: 'highlight',
        target: { type: 'whole' },
        durationMs: 1000,
        payload: { color: '#FF9800', opacity: 0.4 },
        narration: '识别为折叠类题目',
      },
      {
        id: 'step-2-explain',
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 2500,
        payload: { text: '需要想象平面图形折叠成立体的过程' },
        narration: '需要想象平面图形折叠成立体的过程',
      },
      {
        id: 'step-3-hint',
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 3000,
        payload: { text: '💡 建议进入半自动解析模式进行详细分析' },
        narration: '建议进入半自动解析模式进行详细分析',
      },
    ],
    finalAnswerHint: '请进入半自动模式查看详细解析',
    totalDurationMs: 6500,
  },
  semiAutoConfig: {
    enabled: true,
    mode: 'folding',
    requiredUserActions: [
      '选择要折叠的面',
      '指定折叠方向',
      '确认相邻面的位置关系',
    ],
    helperText: '在半自动模式下，您可以逐步验证每个面的折叠是否正确',
    hintSteps: [
      { step: 1, description: '首先确定主面（通常是有图案的面）' },
      { step: 2, description: '根据折叠方向确定相邻面的位置' },
      { step: 3, description: '验证选项中的立方体是否匹配' },
    ],
  },
  warnings: ['立体类题目建议使用半自动解析模式获得更准确的分析'],
};

/**
 * 视图 Demo (立体类)
 */
export const DEMO_VIEW: AnalyzeResult = {
  success: true,
  majorType: 'spatial',
  subType: 'view_projection',
  confidence: 0.82,
  animationSupported: false,
  animationSupportLevel: 'none',
  explanation: '这是一道视图类题目，需要从不同角度观察立体图形，判断正视图、侧视图或俯视图的形状。解题关键是建立三维空间想象能力。',
  ruleSummary: {
    name: '视图规律',
    description: '从不同角度观察立体图形',
    details: [
      '需要识别观察角度',
      '理解投影关系',
      '建立空间想象',
    ],
    keyElements: ['观察角度', '投影方向'],
  },
  animationPlan: {
    sceneType: 'spatial_placeholder',
    steps: [
      {
        id: 'step-1-identify',
        action: 'highlight',
        target: { type: 'whole' },
        durationMs: 1000,
        payload: { color: '#FF9800', opacity: 0.4 },
        narration: '识别为视图类题目',
      },
      {
        id: 'step-2-explain',
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 2500,
        payload: { text: '需要从不同角度观察立体图形' },
        narration: '需要从不同角度观察立体图形',
      },
      {
        id: 'step-3-hint',
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 3000,
        payload: { text: '💡 建议进入半自动解析模式进行详细分析' },
        narration: '建议进入半自动解析模式进行详细分析',
      },
    ],
    finalAnswerHint: '请进入半自动模式查看详细解析',
    totalDurationMs: 6500,
  },
  semiAutoConfig: {
    enabled: true,
    mode: 'view',
    requiredUserActions: [
      '选择观察角度',
      '确认投影方向',
    ],
    helperText: '在半自动模式下，您可以选择不同角度查看立体图形的投影',
    hintSteps: [
      { step: 1, description: '识别立体图形的基本结构' },
      { step: 2, description: '确定观察角度（正/侧/俯）' },
      { step: 3, description: '想象从该角度看到的投影形状' },
    ],
  },
  warnings: ['立体类题目建议使用半自动解析模式获得更准确的分析'],
};

// 导出所有 Demo 数据
export const DEMO_RESULTS = {
  position_move: DEMO_POSITION_MOVE,
  rotation: DEMO_ROTATION,
  overlay: DEMO_OVERLAY,
  folding: DEMO_FOLDING,
  view: DEMO_VIEW,
};

export type DemoId = keyof typeof DEMO_RESULTS;
