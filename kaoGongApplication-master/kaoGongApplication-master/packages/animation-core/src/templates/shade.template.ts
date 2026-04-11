/**
 * Animation Templates - 黑白块/阴影变化模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  
  PlanarSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 生成黑白块/阴影变化动画模板
 * 适用于: shade_change 题型
 */
export const shadeChangeTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
  const { result, gridConfig } = input;
  const rows = gridConfig?.rows ?? 3;
  const cols = gridConfig?.cols ?? 3;

  const steps: AnimationStep[] = [];

  // 步骤1: 高亮第一行的黑白块变化
  steps.push({
    id: 'step-1-highlight-first-row',
    action: 'highlight',
    target: { type: 'row', index: 0 },
    durationMs: 800,
    payload: {
      color: '#FF6B6B',
      opacity: 0.3,
    },
    narration: '观察第一行黑白块的变化规律',
  });

  // 步骤2: 标注黑色块的位置
  steps.push({
    id: 'step-2-mark-black-cells',
    action: 'circle_show',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 600,
    payload: {
      color: '#333333',
      borderWidth: 2,
    },
    narration: '注意黑色块的位置变化',
  });

  // 步骤3: 显示移动方向
  steps.push({
    id: 'step-3-show-direction',
    action: 'arrow_show',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 600,
    payload: {
      start: [0.3, 0.5],
      end: [0.7, 0.5],
      color: '#4CAF50',
    },
    narration: '黑色块向右移动一格',
  });

  // 步骤4: 淡入显示移动后的位置
  steps.push({
    id: 'step-4-fadein-new-position',
    action: 'fade_in',
    target: { type: 'cell', index: [0, 1] },
    durationMs: 500,
    payload: {
      opacity: 0.8,
    },
    narration: '移动后的位置',
  });

  // 步骤5: 对比第二行
  steps.push({
    id: 'step-5-compare-second-row',
    action: 'highlight',
    target: { type: 'row', index: 1 },
    durationMs: 800,
    payload: {
      color: '#4CAF50',
      opacity: 0.3,
    },
    narration: '第二行遵循相同规律',
  });

  // 步骤6: 显示变换规则
  steps.push({
    id: 'step-6-show-rule',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 1500,
    payload: {
      text: '规律: 黑色块每次移动一格',
      color: '#2196F3',
    },
    narration: '黑白块每次移动一格',
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
      tags: ['shade', 'black-white', 'pattern'],
    },
  };
};

/**
 * 判断是否为黑白块变化题型
 */
export function isShadeChangeSubType(subType: PlanarSubType): boolean {
  return subType === 'shade_change';
}
