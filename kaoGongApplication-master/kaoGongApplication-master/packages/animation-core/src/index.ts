/**
 * @kao-gong/animation-core
 * 图推动态解析 App - 动画核心模块
 */

// Types
export * from './types';

// Mappers
export * from './mappers';

// Templates
export * from './templates';

// Player
export * from './player';

// Re-export from shared for convenience
export type {
  AnimationPlan,
  AnimationStep,
  AnimationPayload,
  AnimationTarget,
  AnalyzeResult,
  QuestionSubType,
  PlanarSubType,
  SpatialSubType,
  SceneType,
  AnimationActionType,
} from '@kao-gong/shared';
