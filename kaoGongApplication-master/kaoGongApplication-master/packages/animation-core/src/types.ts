/**
 * Animation Core - 类型定义
 */

import type { AnimationStep, AnimationPlan, AnalyzeResult, AnimationActionType } from '@kao-gong/shared';

// ============================================
// Timeline 类型
// ============================================

/** Timeline 时间轴状态 */
export type TimelineState = 'idle' | 'playing' | 'paused' | 'completed';

/** Timeline 事件 */
export type TimelineEventType =
  | 'start'
  | 'step_start'
  | 'step_complete'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'reset';

/** Timeline 事件处理器 */
export interface TimelineEventHandler {
  (event: TimelineEventType, data?: TimelineEventData): void;
}

/** Timeline 事件数据 */
export interface TimelineEventData {
  currentStepIndex?: number;
  totalSteps?: number;
  step?: AnimationStep;
  progress?: number;
}

/** Timeline 播放器配置 */
export interface TimelinePlayerConfig {
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 步骤间延迟(毫秒) */
  stepDelay?: number;
  /** 是否循环播放 */
  loop?: boolean;
  /** 播放速度倍率 */
  speed?: number;
}

/** Timeline 播放器接口 */
export interface TimelinePlayer {
  /** 当前状态 */
  state: TimelineState;
  /** 当前步骤索引 */
  currentStepIndex: number;
  /** 总步骤数 */
  totalSteps: number;
  /** 进度 (0-1) */
  progress: number;

  /** 播放 */
  play(): void;
  /** 暂停 */
  pause(): void;
  /** 重置 */
  reset(): void;
  /** 跳转到指定步骤 */
  goToStep(index: number): void;
  /** 下一步 */
  nextStep(): void;
  /** 上一步 */
  prevStep(): void;
  /** 设置事件监听 */
  on(event: TimelineEventType, handler: TimelineEventHandler): void;
  /** 移除事件监听 */
  off(event: TimelineEventType, handler: TimelineEventHandler): void;
  /** 销毁 */
  destroy(): void;
}

// ============================================
// 动画模板类型
// ============================================

/** 动画模板输入 */
export interface AnimationTemplateInput {
  /** 分析结果 */
  result: AnalyzeResult;
  /** 网格配置 */
  gridConfig?: {
    rows: number;
    cols: number;
  };
  /** 自定义配置 */
  customConfig?: Record<string, unknown>;
}

/** 动画模板输出 */
export interface AnimationTemplateOutput {
  plan: AnimationPlan;
  metadata?: {
    estimatedDuration: number;
    complexity: 'simple' | 'medium' | 'complex';
    tags: string[];
  };
}

/** 动画模板函数类型 */
export type AnimationTemplate = (input: AnimationTemplateInput) => AnimationTemplateOutput;

// ============================================
// 映射器类型
// ============================================

/** 分析结果到 Timeline 的映射结果 */
export interface TimelineMappingResult {
  /** 动画计划 */
  plan: AnimationPlan;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 元数据 */
  metadata?: {
    subType: string;
    animationSupported: boolean;
    stepCount: number;
    estimatedDuration: number;
  };
}

// ============================================
// SVG 动画元素类型
// ============================================

/** SVG 元素类型 */
export type SVGElementType =
  | 'rect'
  | 'circle'
  | 'path'
  | 'text'
  | 'g'
  | 'line'
  | 'polygon'
  | 'ellipse'
  | 'image';

/** SVG 动画元素 */
export interface SVGAnimationElement {
  id: string;
  type: SVGElementType;
  props: Record<string, string | number>;
  animations: SVGAnimation[];
  children?: SVGAnimationElement[];
}

/** SVG 动画定义 */
export interface SVGAnimation {
  attributeName: string;
  from: string | number;
  to: string | number;
  duration: number;
  delay?: number;
  easing?: string;
  fill?: 'freeze' | 'remove';
}

// ============================================
// 动画动作处理器类型
// ============================================

/** 动画动作处理器 */
export interface AnimationActionHandler {
  /** 处理器名称 */
  name: string;
  /** 支持的动作类型 */
  supportedActions: AnimationActionType[];
  /** 处理函数 */
  handle(
    step: AnimationStep,
    context: AnimationContext
  ): SVGAnimationElement | SVGAnimationElement[];
}

/** 动画上下文 */
export interface AnimationContext {
  /** 网格配置 */
  gridConfig: {
    rows: number;
    cols: number;
    cellWidth: number;
    cellHeight: number;
  };
  /** 容器尺寸 */
  containerSize: {
    width: number;
    height: number;
  };
  /** 当前步骤索引 */
  currentStepIndex: number;
  /** 总步骤数 */
  totalSteps: number;
  /** 前置步骤结果 */
  previousElements: SVGAnimationElement[];
}
