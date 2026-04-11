/**
 * Animation Templates - 元素增减/替换模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  
  PlanarSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 生成元素增减/替换动画模板
 * 适用于: element_replace 题型
 */
export const elementReplaceTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
  const { result, gridConfig } = input;
  const rows = gridConfig?.rows ?? 3;
  const cols = gridConfig?.cols ?? 3;

  const steps: AnimationStep[] = [];

  // 步骤1: 高亮初始元素
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
    narration: '观察第一幅图中的元素',
  });

  // 步骤2: 显示元素被移除
  steps.push({
    id: 'step-2-fadeout-element',
    action: 'fade_out',
    target: { type: 'element', index: 0 },
    durationMs: 600,
    payload: {
      opacity: 0,
    },
    narration: '原元素消失',
  });

  // 步骤3: 显示新元素淡入
  steps.push({
    id: 'step-3-fadein-new-element',
    action: 'fade_in',
    target: { type: 'element', index: 1 },
    durationMs: 600,
    payload: {
      opacity: 1,
    },
    narration: '新元素出现',
  });

  // 步骤4: 高亮变化结果
  steps.push({
    id: 'step-4-highlight-result',
    action: 'highlight',
    target: { type: 'cell', index: [0, 1] },
    durationMs: 800,
    payload: {
      color: '#4CAF50',
      opacity: 0.5,
      borderWidth: 3,
    },
    narration: '元素已被替换',
  });

  // 步骤5: 显示替换规律
  steps.push({
    id: 'step-5-show-pattern',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 1500,
    payload: {
      text: '元素替换规律: A → B → C → ?',
      color: '#2196F3',
    },
    narration: '元素按照特定规律进行替换',
  });

  // 步骤6: 循环提示
  steps.push({
    id: 'step-6-cycle-hint',
    action: 'circle_show',
    target: { type: 'cell', index: [0, 2] },
    durationMs: 800,
    payload: {
      color: '#FF9800',
      borderWidth: 2,
    },
    narration: '注意元素可能循环出现',
  });

  // 步骤7: 规律总结
  steps.push({
    id: 'step-7-summary',
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
      complexity: 'medium',
      tags: ['element', 'replace', 'add', 'remove'],
    },
  };
};

/**
 * 判断是否为元素替换题型
 */
export function isElementReplaceSubType(subType: PlanarSubType): boolean {
  return subType === 'element_replace';
}
