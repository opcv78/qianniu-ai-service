/**
 * 图推动态解析 App - 共享常量
 */

import type {
  PlanarSubType,
  SpatialSubType,
  QuestionSubType,
  MajorQuestionType,
  AnimationActionType,
  SceneType,
} from '../types';

// ============================================
// 题型常量
// ============================================

/** 所有平面类题型 */
export const PLANAR_SUBTYPES: PlanarSubType[] = [
  'position_move',
  'rotation',
  'flip',
  'overlay_union',
  'overlay_xor',
  'overlay_intersection',
  'count_change',
  'shade_change',
  'element_replace',
  'mixed_planar',
];

/** 所有立体类题型 */
export const SPATIAL_SUBTYPES: SpatialSubType[] = [
  'folding',
  'section',
  'solid_assembly',
  'view_projection',
  'mixed_spatial',
];

/** 所有动画动作类型 */
export const ANIMATION_ACTIONS: AnimationActionType[] = [
  'highlight',
  'move',
  'rotate',
  'flip_horizontal',
  'flip_vertical',
  'fade_in',
  'fade_out',
  'morph',
  'count_emphasis',
  'overlay_show',
  'overlay_merge',
  'step_note',
  'arrow_show',
  'circle_show',
  'cross_show',
  'text_show',
];

/** 所有场景类型 */
export const SCENE_TYPES: SceneType[] = [
  'planar_grid',
  'planar_sequence',
  'planar_single',
  'spatial_placeholder',
];

// ============================================
// 动画默认配置
// ============================================

/** 默认动画时长(毫秒) */
export const DEFAULT_ANIMATION_DURATION = {
  highlight: 800,
  move: 600,
  rotate: 800,
  flip: 600,
  fade_in: 400,
  fade_out: 400,
  morph: 1000,
  count_emphasis: 1000,
  overlay_show: 600,
  overlay_merge: 800,
  step_note: 2000,
  arrow_show: 500,
  circle_show: 500,
  text_show: 300,
};

/** 默认动画颜色 */
export const DEFAULT_ANIMATION_COLORS = {
  highlight: '#FF6B6B',
  highlightBorder: '#FF0000',
  arrow: '#4CAF50',
  text: '#333333',
  circle: '#2196F3',
  cross: '#F44336',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

/** 默认网格配置 */
export const DEFAULT_GRID_CONFIG = {
  rows: 3,
  cols: 3,
  cellWidth: 100,
  cellHeight: 100,
};

// ============================================
// API 配置
// ============================================

/** 默认 API 超时时间(毫秒) */
export const API_TIMEOUT = 30000;

/** LLM 重试次数 */
export const LLM_MAX_RETRIES = 2;

/** LLM 请求超时时间(毫秒) */
export const LLM_TIMEOUT = 60000;

// ============================================
// 判断函数
// ============================================

/** 判断是否为平面类题型 */
export function isPlanarType(subType: QuestionSubType): boolean {
  return PLANAR_SUBTYPES.includes(subType as PlanarSubType);
}

/** 判断是否为立体类题型 */
export function isSpatialType(subType: QuestionSubType): boolean {
  return SPATIAL_SUBTYPES.includes(subType as SpatialSubType);
}

/** 根据子类型判断大类 */
export function getMajorType(subType: QuestionSubType): MajorQuestionType {
  return isPlanarType(subType) ? 'planar' : 'spatial';
}

/** 判断题型是否支持完整动画 */
export function isAnimationSupported(subType: QuestionSubType): boolean {
  // 平面类题型支持完整动画，立体类不支持
  return isPlanarType(subType) && subType !== 'mixed_planar';
}

// ============================================
// 错误消息
// ============================================

export const ERROR_MESSAGES = {
  INVALID_IMAGE: '无效的图片格式',
  UPLOAD_FAILED: '图片上传失败',
  CLASSIFY_FAILED: '题型识别失败',
  ANALYZE_FAILED: '题目分析失败',
  LLM_ERROR: 'AI 服务暂时不可用',
  LLM_INVALID_OUTPUT: 'AI 返回数据格式错误',
  NETWORK_ERROR: '网络连接失败',
  TIMEOUT: '请求超时',
  UNKNOWN: '未知错误',
};
