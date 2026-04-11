/**
 * Animation Templates - 数量变化模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  
  PlanarSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 生成数量变化动画模板
 * 适用于: count_change 题型
 */
export const countChangeTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
  const { result, gridConfig } = input;
  const rows = gridConfig?.rows ?? 3;
  const cols = gridConfig?.cols ?? 3;

  const steps: AnimationStep[] = [];

  // 步骤1: 高亮第一个图形中的元素
  steps.push({
    id: 'step-1-count-first',
    action: 'count_emphasis',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 1000,
    payload: {
      count: 1,
      color: '#FF6B6B',
    },
    narration: '第一幅图有1个元素',
  });

  // 步骤2: 高亮第二个图形中的元素
  steps.push({
    id: 'step-2-count-second',
    action: 'count_emphasis',
    target: { type: 'cell', index: [0, 1] },
    durationMs: 1000,
    payload: {
      count: 2,
      color: '#FF6B6B',
    },
    narration: '第二幅图有2个元素',
  });

  // 步骤3: 高亮第三个图形中的元素
  steps.push({
    id: 'step-3-count-third',
    action: 'count_emphasis',
    target: { type: 'cell', index: [0, 2] },
    durationMs: 1000,
    payload: {
      count: 3,
      color: '#FF6B6B',
    },
    narration: '第三幅图有3个元素',
  });

  // 步骤4: 显示数量变化规律
  steps.push({
    id: 'step-4-show-pattern',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 1500,
    payload: {
      text: '数量递增规律: 1 → 2 → 3 → ?',
      color: '#4CAF50',
    },
    narration: '发现数量递增规律，依次增加1个元素',
  });

  // 步骤5: 显示答案提示
  steps.push({
    id: 'step-5-answer-hint',
    action: 'highlight',
    target: { type: 'cell', index: [1, 0] },
    durationMs: 800,
    payload: {
      color: '#2196F3',
      opacity: 0.5,
      borderWidth: 3,
    },
    narration: '因此答案应包含4个元素',
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
    finalAnswerHint: result.ruleSummary.keyElements?.[0] ?? '4个元素',
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
      tags: ['count', 'number', 'quantity'],
    },
  };
};

/**
 * 判断是否为数量变化题型
 */
export function isCountChangeSubType(subType: PlanarSubType): boolean {
  return subType === 'count_change';
}
