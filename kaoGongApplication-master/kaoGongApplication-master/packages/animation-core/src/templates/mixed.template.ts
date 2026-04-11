/**
 * Animation Templates - 混合平面类模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  
  PlanarSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 生成混合平面类动画模板
 * 适用于: mixed_planar 题型
 */
export const mixedPlanarTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
  const { result, gridConfig } = input;
  const rows = gridConfig?.rows ?? 3;
  const cols = gridConfig?.cols ?? 3;

  const steps: AnimationStep[] = [];

  // 混合类题型比较复杂，提供一个通用的分析流程

  // 步骤1: 整体高亮
  steps.push({
    id: 'step-1-overview',
    action: 'highlight',
    target: { type: 'whole' },
    durationMs: 800,
    payload: {
      color: '#FF6B6B',
      opacity: 0.3,
    },
    narration: '这是一道混合规律题，需要综合分析多种变化',
  });

  // 步骤2: 观察第一行
  steps.push({
    id: 'step-2-analyze-row-1',
    action: 'highlight',
    target: { type: 'row', index: 0 },
    durationMs: 1000,
    payload: {
      color: '#4CAF50',
      opacity: 0.4,
    },
    narration: '首先观察第一行的变化规律',
  });

  // 步骤3: 标注关键特征
  steps.push({
    id: 'step-3-mark-features',
    action: 'circle_show',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 800,
    payload: {
      color: '#2196F3',
      borderWidth: 2,
    },
    narration: '注意元素的位置、角度、数量变化',
  });

  // 步骤4: 分析多种规律
  steps.push({
    id: 'step-4-analyze-patterns',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 1500,
    payload: {
      text: '可能同时存在多种规律叠加',
      color: '#FF9800',
    },
    narration: '混合题型通常同时存在多种规律',
  });

  // 步骤5: 逐个验证规律
  const details = result.ruleSummary.details ?? [];
  if (details.length > 0) {
    details.forEach((detail, index) => {
      steps.push({
        id: `step-5-${index + 1}-detail`,
        action: 'step_note',
        target: { type: 'whole' },
        durationMs: 1500,
        payload: {
          text: detail,
        },
        narration: detail,
      });
    });
  }

  // 步骤6: 综合判断
  steps.push({
    id: 'step-6-conclusion',
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
      complexity: 'complex',
      tags: ['mixed', 'combined', 'multiple-rules'],
    },
  };
};

/**
 * 判断是否为混合平面类题型
 */
export function isMixedPlanarSubType(subType: PlanarSubType): boolean {
  return subType === 'mixed_planar';
}
