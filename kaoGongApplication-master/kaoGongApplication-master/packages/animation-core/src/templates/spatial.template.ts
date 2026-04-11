/**
 * Animation Templates - 立体类占位模板
 */

import type {
  AnimationPlan,
  AnimationStep,
  
  SpatialSubType,
} from '@kao-gong/shared';
import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';

/**
 * 立体类题型描述映射
 */
const SPATIAL_DESCRIPTIONS: Record<SpatialSubType, string> = {
  folding: '折叠类题目需要想象平面图形折叠成立体的过程',
  section: '截面类题目需要分析立体图形被切开的截面形状',
  solid_assembly: '立体拼图需要将多个小立体组合成完整形状',
  view_projection: '视图类题目需要从不同角度观察立体图形',
  mixed_spatial: '混合立体类题目涉及多种空间变换',
};

/**
 * 生成立体类占位动画模板
 * 适用于: folding, section, solid_assembly, view_projection, mixed_spatial 题型
 *
 * 注意: 立体类题型第一版只做占位动画，提示用户进入半自动模式
 */
export const spatialPlaceholderTemplate: AnimationTemplate = (input: AnimationTemplateInput): AnimationTemplateOutput => {
  const { result, gridConfig } = input;
  const rows = gridConfig?.rows ?? 3;
  const cols = gridConfig?.cols ?? 3;
  const subType = result.subType as SpatialSubType;

  const steps: AnimationStep[] = [];
  const description = SPATIAL_DESCRIPTIONS[subType] ?? result.ruleSummary.description;

  // 步骤1: 显示题型识别结果
  steps.push({
    id: 'step-1-type-identified',
    action: 'highlight',
    target: { type: 'whole' },
    durationMs: 1000,
    payload: {
      color: '#FF9800',
      opacity: 0.4,
    },
    narration: `识别为${description}`,
  });

  // 步骤2: 显示题型说明
  steps.push({
    id: 'step-2-type-description',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 2000,
    payload: {
      text: description,
      color: '#333333',
    },
    narration: description,
  });

  // 步骤3: 显示规律分析
  steps.push({
    id: 'step-3-rule-analysis',
    action: 'step_note',
    target: { type: 'whole' },
    durationMs: 2500,
    payload: {
      text: result.ruleSummary.description,
    },
    narration: result.ruleSummary.description,
  });

  // 步骤4: 显示详细信息(如果有)
  const details = result.ruleSummary.details ?? [];
  if (details.length > 0) {
    details.forEach((detail, index) => {
      steps.push({
        id: `step-4-${index + 1}-detail`,
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 2000,
        payload: {
          text: detail,
          color: '#4CAF50',
        },
        narration: detail,
      });
    });
  }

  // 步骤5: 提示进入半自动模式
  steps.push({
    id: 'step-5-semi-auto-hint',
    action: 'text_show',
    target: { type: 'whole' },
    durationMs: 3000,
    payload: {
      text: '💡 该题型建议进入半自动解析模式进行更详细的分析',
      color: '#2196F3',
    },
    narration: '该题型建议进入半自动解析模式进行更详细的分析',
  });

  const totalDurationMs = steps.reduce((sum, step) => sum + step.durationMs + (step.delayMs ?? 0), 0);

  const plan: AnimationPlan = {
    sceneType: 'spatial_placeholder',
    steps,
    finalAnswerHint: result.semiAutoConfig?.helperText ?? '请进入半自动模式查看详细解析',
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
      tags: ['spatial', subType, 'placeholder'],
    },
  };
};

/**
 * 判断是否为立体类题型
 */
export function isSpatialSubType(subType: string): boolean {
  return ['folding', 'section', 'solid_assembly', 'view_projection', 'mixed_spatial'].includes(subType);
}
