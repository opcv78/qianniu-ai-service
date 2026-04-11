/**
 * Animation Templates - 位置移动模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  PlanarSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 生成位置移动动画模板
 * 适用于: position_move 题型
 */
export const positionMoveTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
  const { result, gridConfig } = input;
  const rows = gridConfig?.rows ?? 3;
  const cols = gridConfig?.cols ?? 3;

  const steps: AnimationStep[] = [];

  // 步骤1: 高亮显示初始位置
  steps.push({
    id: 'step-1-highlight-initial',
    action: 'highlight',
    target: { type: 'cell', index: [1, 0] },
    durationMs: 800,
    payload: {
      color: '#FF6B6B',
      opacity: 0.5,
      borderWidth: 3,
    },
    narration: '首先观察第一行第一个元素的位置',
  });

  // 步骤2: 显示移动路径箭头
  steps.push({
    id: 'step-2-show-path',
    action: 'arrow_show',
    target: { type: 'cell', index: [1, 0] },
    durationMs: 600,
    payload: {
      start: [1, 0],
      end: [1, 1],
      color: '#4CAF50',
    },
    narration: '元素向右移动一格',
  });

  // 步骤3: 执行移动动画
  steps.push({
    id: 'step-3-move',
    action: 'move',
    target: { type: 'cell', index: [1, 0] },
    durationMs: 800,
    payload: {
      from: [1, 0],
      to: [1, 1],
      deltaX: 1,
      deltaY: 0,
    },
    narration: '移动到第二列',
  });

  // 步骤4: 高亮显示移动后的位置
  steps.push({
    id: 'step-4-highlight-result',
    action: 'highlight',
    target: { type: 'cell', index: [1, 1] },
    durationMs: 600,
    payload: {
      color: '#2196F3',
      opacity: 0.3,
    },
    narration: '完成移动',
  });

  // 步骤5: 总结规则
  steps.push({
    id: 'step-5-summary',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 2000,
    payload: {
      text: result.ruleSummary.description,
    },
    narration: result.ruleSummary.description,
  });

  // 计算总时长
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
      tags: ['position', 'move', 'grid'],
    },
  };
};

/**
 * 判断是否为位置移动题型
 */
export function isPositionMoveSubType(subType: PlanarSubType): boolean {
  return subType === 'position_move';
}
