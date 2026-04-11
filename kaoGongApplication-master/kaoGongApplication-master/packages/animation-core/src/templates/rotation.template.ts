/**
 * Animation Templates - 旋转模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  
  PlanarSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 生成旋转动画模板
 * 适用于: rotation 题型
 */
export const rotationTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
  const { result, gridConfig } = input;
  const rows = gridConfig?.rows ?? 3;
  const cols = gridConfig?.cols ?? 3;

  const steps: AnimationStep[] = [];

  // 步骤1: 高亮显示初始元素
  steps.push({
    id: 'step-1-highlight-initial',
    action: 'highlight',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 800,
    payload: {
      color: '#FF6B6B',
      opacity: 0.5,
      borderWidth: 3,
    },
    narration: '观察第一个元素的初始角度',
  });

  // 步骤2: 显示旋转角度标注
  steps.push({
    id: 'step-2-angle-note',
    action: 'text_show',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 1000,
    payload: {
      text: '初始角度: 0°',
      color: '#333333',
    },
    narration: '初始角度为0度',
  });

  // 步骤3: 执行旋转动画 (顺时针90度)
  steps.push({
    id: 'step-3-rotate',
    action: 'rotate',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 1000,
    payload: {
      fromAngle: 0,
      toAngle: 90,
      easing: 'ease-in-out',
    },
    narration: '元素顺时针旋转90度',
  });

  // 步骤4: 高亮旋转后的结果
  steps.push({
    id: 'step-4-highlight-rotated',
    action: 'highlight',
    target: { type: 'cell', index: [0, 1] },
    durationMs: 600,
    payload: {
      color: '#4CAF50',
      opacity: 0.5,
    },
    narration: '旋转后的位置',
  });

  // 步骤5: 显示旋转规律总结
  steps.push({
    id: 'step-5-show-pattern',
    action: 'circle_show',
    target: { type: 'cell', index: [1, 0] },
    durationMs: 800,
    payload: {
      color: '#2196F3',
      borderWidth: 2,
    },
    narration: '第二个元素同样旋转90度',
  });

  // 步骤6: 规律总结
  steps.push({
    id: 'step-6-summary',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 2000,
    payload: {
      text: result.ruleSummary.description,
    },
    narration: result.ruleSummary.description,
  });

  const totalDurationMs = steps.reduce((sum, step) => sum + step.durationMs + (step.delayMs ?? 0), 0);

  const plan: AnimationPlan = {
    sceneType: 'planar_grid',
    steps,
    finalAnswerHint: result.ruleSummary.keyElements?.[0],
    totalDurationMs,
    gridConfig: {
      rows,
      cols,
      cellWidth: 100,
      cellHeight: 100,
    },
  };

  return {
    plan,
    metadata: {
      estimatedDuration: totalDurationMs,
      complexity: 'simple',
      tags: ['rotation', 'transform', 'angle'],
    },
  };
};

/**
 * 判断是否为旋转型题
 */
export function isRotationSubType(subType: PlanarSubType): boolean {
  return subType === 'rotation';
}
