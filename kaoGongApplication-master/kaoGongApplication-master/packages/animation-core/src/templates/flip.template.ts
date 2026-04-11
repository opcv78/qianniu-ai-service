/**
 * Animation Templates - 翻转模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  
  PlanarSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 生成翻转动画模板
 * 适用于: flip 题型
 */
export const flipTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
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
    narration: '观察第一个元素的初始状态',
  });

  // 步骤2: 显示翻转方向提示
  steps.push({
    id: 'step-2-flip-hint',
    action: 'arrow_show',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 600,
    payload: {
      start: [0.2, 0.5],
      end: [0.8, 0.5],
      color: '#4CAF50',
    },
    narration: '元素将水平翻转',
  });

  // 步骤3: 执行水平翻转动画
  steps.push({
    id: 'step-3-flip-horizontal',
    action: 'flip_horizontal',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 800,
    payload: {
      easing: 'ease-in-out',
    },
    narration: '执行水平翻转',
  });

  // 步骤4: 高亮翻转结果
  steps.push({
    id: 'step-4-highlight-flipped',
    action: 'highlight',
    target: { type: 'cell', index: [0, 1] },
    durationMs: 600,
    payload: {
      color: '#4CAF50',
      opacity: 0.3,
    },
    narration: '翻转后的元素',
  });

  // 步骤5: 演示垂直翻转（如果有）
  steps.push({
    id: 'step-5-flip-vertical',
    action: 'flip_vertical',
    target: { type: 'cell', index: [1, 0] },
    durationMs: 800,
    payload: {
      easing: 'ease-in-out',
    },
    narration: '另一行可能进行垂直翻转',
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
      tags: ['flip', 'mirror', 'transform'],
    },
  };
};

/**
 * 判断是否为翻转题型
 */
export function isFlipSubType(subType: PlanarSubType): boolean {
  return subType === 'flip';
}
