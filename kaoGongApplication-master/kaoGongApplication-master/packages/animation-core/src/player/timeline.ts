/**
 * Timeline Player - 动画播放控制器
 */

import type { AnimationPlan, AnimationStep } from '@kao-gong/shared';
import type {
  TimelineState,
  TimelineEventType,
  TimelineEventHandler,
  TimelineEventData,
  TimelinePlayerConfig,
  TimelinePlayer,
} from '../types';

/**
 * 创建时间轴播放器
 */
export function createTimelinePlayer(
  plan: AnimationPlan,
  config: TimelinePlayerConfig = {}
): TimelinePlayer {
  const {
    autoPlay = false,
    stepDelay = 200,
    loop = false,
    speed = 1,
  } = config;

  // 内部状态
  let state: TimelineState = 'idle';
  let currentStepIndex = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const eventHandlers: Map<TimelineEventType, Set<TimelineEventHandler>> = new Map();

  // 计算调整后的步骤时长
  const getAdjustedDuration = (step: AnimationStep): number => {
    return Math.round((step.durationMs + (step.delayMs ?? stepDelay)) / speed);
  };

  // 触发事件
  const emit = (event: TimelineEventType, data?: TimelineEventData) => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(event, data));
    }
  };

  // 执行当前步骤
  const executeStep = () => {
    if (currentStepIndex >= plan.steps.length) {
      // 播放完成
      state = 'completed';
      emit('complete', {
        currentStepIndex,
        totalSteps: plan.steps.length,
        progress: 1,
      });

      if (loop) {
        // 循环播放
        setTimeout(() => {
          reset();
          play();
        }, 1000);
      }
      return;
    }

    const step = plan.steps[currentStepIndex];
    emit('step_start', {
      currentStepIndex,
      totalSteps: plan.steps.length,
      step,
      progress: currentStepIndex / plan.steps.length,
    });

    // 执行步骤
    const duration = getAdjustedDuration(step);

    timeoutId = setTimeout(() => {
      emit('step_complete', {
        currentStepIndex,
        totalSteps: plan.steps.length,
        step,
        progress: (currentStepIndex + 1) / plan.steps.length,
      });

      currentStepIndex++;
      executeStep();
    }, duration);
  };

  // 播放
  const play = () => {
    if (state === 'playing') return;

    if (state === 'paused') {
      state = 'playing';
      emit('resume', {
        currentStepIndex,
        totalSteps: plan.steps.length,
        progress: currentStepIndex / plan.steps.length,
      });
    } else {
      state = 'playing';
      emit('start', {
        currentStepIndex: 0,
        totalSteps: plan.steps.length,
        progress: 0,
      });
    }

    executeStep();
  };

  // 暂停
  const pause = () => {
    if (state !== 'playing') return;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    state = 'paused';
    emit('pause', {
      currentStepIndex,
      totalSteps: plan.steps.length,
      progress: currentStepIndex / plan.steps.length,
    });
  };

  // 重置
  const reset = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    currentStepIndex = 0;
    state = 'idle';
    emit('reset', {
      currentStepIndex: 0,
      totalSteps: plan.steps.length,
      progress: 0,
    });
  };

  // 跳转到指定步骤
  const goToStep = (index: number) => {
    if (index < 0 || index >= plan.steps.length) return;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    currentStepIndex = index;

    if (state === 'playing') {
      executeStep();
    }
  };

  // 下一步
  const nextStep = () => {
    if (currentStepIndex < plan.steps.length - 1) {
      goToStep(currentStepIndex + 1);
    }
  };

  // 上一步
  const prevStep = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  // 事件监听
  const on = (event: TimelineEventType, handler: TimelineEventHandler) => {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, new Set());
    }
    eventHandlers.get(event)!.add(handler);
  };

  // 移除事件监听
  const off = (event: TimelineEventType, handler: TimelineEventHandler) => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  };

  // 销毁
  const destroy = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    eventHandlers.clear();
    state = 'idle';
    currentStepIndex = 0;
  };

  // 创建播放器对象
  const player: TimelinePlayer = {
    get state() { return state; },
    get currentStepIndex() { return currentStepIndex; },
    get totalSteps() { return plan.steps.length; },
    get progress() { return plan.steps.length > 0 ? currentStepIndex / plan.steps.length : 0; },
    play,
    pause,
    reset,
    goToStep,
    nextStep,
    prevStep,
    on,
    off,
    destroy,
  };

  // 自动播放
  if (autoPlay) {
    setTimeout(play, 0);
  }

  return player;
}

/**
 * 计算动画进度
 */
export function calculateProgress(
  currentStepIndex: number,
  totalSteps: number,
  stepProgress: number = 0
): number {
  if (totalSteps === 0) return 0;
  const stepWeight = 1 / totalSteps;
  return (currentStepIndex * stepWeight) + (stepProgress * stepWeight);
}

/**
 * 格式化时间显示
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${remainingSeconds}s`;
}
