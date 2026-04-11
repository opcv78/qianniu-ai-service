/**
 * Animation Templates - 叠加模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  
  PlanarSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 生成叠加动画模板
 * 适用于: overlay_union, overlay_xor, overlay_intersection 题型
 */
export const overlayTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
  const { result, gridConfig } = input;
  const rows = gridConfig?.rows ?? 3;
  const cols = gridConfig?.cols ?? 3;
  const subType = result.subType as PlanarSubType;

  // 根据叠加类型确定描述
  const overlayDescriptions: Record<string, string> = {
    overlay_union: '叠加求并集：保留两个图形的所有部分',
    overlay_xor: '去同存异：保留两个图形不同的部分',
    overlay_intersection: '叠加求交集：保留两个图形共同的部分',
  };

  const steps: AnimationStep[] = [];
  const overlayDesc = overlayDescriptions[subType] ?? result.ruleSummary.description;

  // 步骤1: 高亮第一个源图形
  steps.push({
    id: 'step-1-highlight-first',
    action: 'highlight',
    target: { type: 'cell', index: [0, 0] },
    durationMs: 800,
    payload: {
      color: '#FF6B6B',
      opacity: 0.6,
      borderWidth: 3,
    },
    narration: '首先观察第一个图形',
  });

  // 步骤2: 高亮第二个源图形
  steps.push({
    id: 'step-2-highlight-second',
    action: 'highlight',
    target: { type: 'cell', index: [0, 1] },
    durationMs: 800,
    payload: {
      color: '#4CAF50',
      opacity: 0.6,
      borderWidth: 3,
    },
    narration: '然后观察第二个图形',
  });

  // 步骤3: 显示叠加操作提示
  steps.push({
    id: 'step-3-overlay-hint',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 1000,
    payload: {
      text: overlayDesc,
      color: '#333333',
    },
    narration: overlayDesc,
  });

  // 步骤4: 显示叠加过程
  steps.push({
    id: 'step-4-overlay-show',
    action: 'overlay_show',
    target: { type: 'cell', index: [0, 2] },
    durationMs: 600,
    payload: {
      sources: [[0, 0], [0, 1]],
      resultPosition: [0, 2],
      opacity: 0.5,
    },
    narration: '将两个图形叠加',
  });

  // 步骤5: 执行叠加合并动画
  steps.push({
    id: 'step-5-overlay-merge',
    action: 'overlay_merge',
    target: { type: 'cell', index: [0, 2] },
    durationMs: 1000,
    payload: {
      sources: [[0, 0], [0, 1]],
      resultPosition: [0, 2],
      easing: 'ease-in-out',
    },
    narration: '执行叠加操作',
  });

  // 步骤6: 高亮最终结果
  steps.push({
    id: 'step-6-highlight-result',
    action: 'highlight',
    target: { type: 'cell', index: [0, 2] },
    durationMs: 800,
    payload: {
      color: '#2196F3',
      opacity: 0.5,
      borderWidth: 3,
    },
    narration: '叠加后的结果',
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
      tags: ['overlay', 'union', 'xor', 'intersection'],
    },
  };
};

/**
 * 判断是否为叠加题型
 */
export function isOverlaySubType(subType: PlanarSubType): boolean {
  return ['overlay_union', 'overlay_xor', 'overlay_intersection'].includes(subType);
}
