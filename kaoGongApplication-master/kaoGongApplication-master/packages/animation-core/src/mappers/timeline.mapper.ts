/**
 * Timeline Mapper - 分析结果到动画时间轴的映射
 */

import type {
  AnalyzeResult,
  AnimationPlan,
  AnimationStep,
  
  
  
} from '@kao-gong/shared';
import type { TimelineMappingResult } from '../types';
import { generateAnimationPlan } from '../templates';

/**
 * 将分析结果映射为动画时间轴
 *
 * @param result - 分析结果
 * @param options - 可选配置
 * @returns 时间轴映射结果
 */
export function mapAnalyzeResultToTimeline(
  result: AnalyzeResult,
  options?: {
    gridConfig?: {
      rows: number;
      cols: number;
    };
    customConfig?: Record<string, unknown>;
  }
): TimelineMappingResult {
  try {
    // 如果分析失败，返回空时间轴
    if (!result.success) {
      return {
        plan: createEmptyPlan(result.error ?? '分析失败'),
        success: false,
        error: result.error ?? '分析失败',
        metadata: {
          subType: result.subType ?? 'unknown',
          animationSupported: false,
          stepCount: 0,
          estimatedDuration: 0,
        },
      };
    }

    // 如果已有动画计划，直接使用
    if (result.animationPlan && result.animationPlan.steps.length > 0) {
      return {
        plan: result.animationPlan,
        success: true,
        metadata: {
          subType: result.subType,
          animationSupported: result.animationSupported,
          stepCount: result.animationPlan.steps.length,
          estimatedDuration: result.animationPlan.totalDurationMs ?? 0,
        },
      };
    }

    // 使用模板生成动画计划
    const templateOutput = generateAnimationPlan(result.subType, {
      result,
      gridConfig: options?.gridConfig ?? { rows: 3, cols: 3 },
      customConfig: options?.customConfig,
    });

    return {
      plan: templateOutput.plan,
      success: true,
      metadata: {
        subType: result.subType,
        animationSupported: result.animationSupported,
        stepCount: templateOutput.plan.steps.length,
        estimatedDuration: templateOutput.metadata?.estimatedDuration ?? 0,
      },
    };
  } catch (error) {
    return {
      plan: createEmptyPlan('生成动画时发生错误'),
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      metadata: {
        subType: result.subType ?? 'unknown',
        animationSupported: false,
        stepCount: 0,
        estimatedDuration: 0,
      },
    };
  }
}

/**
 * 创建空动画计划
 */
function createEmptyPlan(errorMessage: string): AnimationPlan {
  return {
    sceneType: 'planar_single',
    steps: [
      {
        id: 'error-step',
        action: 'text_show',
        target: { type: 'whole' },
        durationMs: 3000,
        payload: {
          text: errorMessage,
          color: '#F44336',
        },
        narration: errorMessage,
      },
    ],
    totalDurationMs: 3000,
  };
}

/**
 * 从分析结果提取关键信息用于动画
 */
export function extractAnimationContext(result: AnalyzeResult) {
  const context = {
    majorType: result.majorType,
    subType: result.subType,
    confidence: result.confidence,
    ruleName: result.ruleSummary.name,
    ruleDescription: result.ruleSummary.description,
    ruleDetails: result.ruleSummary.details ?? [],
    keyElements: result.ruleSummary.keyElements ?? [],
    animationSupported: result.animationSupported,
    semiAutoEnabled: result.semiAutoConfig?.enabled ?? false,
  };

  return context;
}

/**
 * 计算动画计划的总时长
 */
export function calculateTotalDuration(plan: AnimationPlan): number {
  return plan.steps.reduce((total, step) => {
    return total + step.durationMs + (step.delayMs ?? 0);
  }, 0);
}

/**
 * 为动画步骤添加延迟
 */
export function addStepDelays(
  plan: AnimationPlan,
  delayMs: number = 200
): AnimationPlan {
  return {
    ...plan,
    steps: plan.steps.map((step, index) => ({
      ...step,
      delayMs: index > 0 ? delayMs : 0,
    })),
    totalDurationMs: plan.totalDurationMs
      ? plan.totalDurationMs + delayMs * (plan.steps.length - 1)
      : undefined,
  };
}

/**
 * 调整动画播放速度
 */
export function adjustPlaybackSpeed(
  plan: AnimationPlan,
  speedMultiplier: number
): AnimationPlan {
  if (speedMultiplier <= 0) {
    return plan;
  }

  return {
    ...plan,
    steps: plan.steps.map((step) => ({
      ...step,
      durationMs: Math.round(step.durationMs / speedMultiplier),
      delayMs: step.delayMs ? Math.round(step.delayMs / speedMultiplier) : undefined,
    })),
    totalDurationMs: plan.totalDurationMs
      ? Math.round(plan.totalDurationMs / speedMultiplier)
      : undefined,
  };
}

/**
 * 获取特定步骤
 */
export function getStepById(plan: AnimationPlan, stepId: string): AnimationStep | undefined {
  return plan.steps.find((step) => step.id === stepId);
}

/**
 * 获取步骤索引
 */
export function getStepIndex(plan: AnimationPlan, stepId: string): number {
  return plan.steps.findIndex((step) => step.id === stepId);
}

/**
 * 按动作类型筛选步骤
 */
export function filterStepsByAction(
  plan: AnimationPlan,
  actionType: AnimationStep['action']
): AnimationStep[] {
  return plan.steps.filter((step) => step.action === actionType);
}
