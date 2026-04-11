/**
 * Animation Templates - 统一导出
 */

export { positionMoveTemplate, isPositionMoveSubType } from './position.template';
export { rotationTemplate, isRotationSubType } from './rotation.template';
export { flipTemplate, isFlipSubType } from './flip.template';
export { overlayTemplate, isOverlaySubType } from './overlay.template';
export { countChangeTemplate, isCountChangeSubType } from './count.template';
export { shadeChangeTemplate, isShadeChangeSubType } from './shade.template';
export { elementReplaceTemplate, isElementReplaceSubType } from './element.template';
export { mixedPlanarTemplate, isMixedPlanarSubType } from './mixed.template';
export { spatialPlaceholderTemplate, isSpatialSubType } from './spatial.template';

import type { AnimationTemplate, AnimationTemplateInput, AnimationTemplateOutput } from '../types';
import type { PlanarSubType, SpatialSubType, QuestionSubType } from '@kao-gong/shared';

// 导入所有模板
import { positionMoveTemplate } from './position.template';
import { rotationTemplate } from './rotation.template';
import { flipTemplate } from './flip.template';
import { overlayTemplate } from './overlay.template';
import { countChangeTemplate } from './count.template';
import { shadeChangeTemplate } from './shade.template';
import { elementReplaceTemplate } from './element.template';
import { mixedPlanarTemplate } from './mixed.template';
import { spatialPlaceholderTemplate } from './spatial.template';

/**
 * 平面类模板映射
 * 注：部分题型复用已有模板
 */
export const PLANAR_TEMPLATES: Record<PlanarSubType, AnimationTemplate> = {
  // 位置类
  position_move: positionMoveTemplate,
  rotation: rotationTemplate,
  flip: flipTemplate,
  // 叠加类 - 复用 overlayTemplate
  overlay_union: overlayTemplate,
  overlay_xor: overlayTemplate,
  overlay_intersection: overlayTemplate,
  overlay_black_white: overlayTemplate,  // 复用
  overlay_outline: overlayTemplate,       // 复用
  // 数量类 - 复用 countChangeTemplate
  count_change: countChangeTemplate,
  count_point: countChangeTemplate,
  count_line: countChangeTemplate,
  count_angle: countChangeTemplate,
  count_region: countChangeTemplate,
  count_part: countChangeTemplate,
  count_element: countChangeTemplate,
  // 属性类
  shade_change: shadeChangeTemplate,
  symmetry: shadeChangeTemplate,          // 复用
  element_replace: elementReplaceTemplate,
  element_traverse: elementReplaceTemplate, // 复用
  // 其他 - 复用
  stroke_count: countChangeTemplate,
  one_stroke: countChangeTemplate,
  mixed_planar: mixedPlanarTemplate,
};

/**
 * 立体类模板映射
 */
export const SPATIAL_TEMPLATES: Record<SpatialSubType, AnimationTemplate> = {
  folding: spatialPlaceholderTemplate,
  section: spatialPlaceholderTemplate,
  solid_assembly: spatialPlaceholderTemplate,
  view_projection: spatialPlaceholderTemplate,
  mixed_spatial: spatialPlaceholderTemplate,
};

/**
 * 获取对应题型的动画模板
 */
export function getTemplateForSubType(subType: QuestionSubType): AnimationTemplate {
  // 平面类
  if (subType in PLANAR_TEMPLATES) {
    return PLANAR_TEMPLATES[subType as PlanarSubType];
  }

  // 立体类
  if (subType in SPATIAL_TEMPLATES) {
    return SPATIAL_TEMPLATES[subType as SpatialSubType];
  }

  // 默认返回混合平面类模板
  return mixedPlanarTemplate;
}

/**
 * 生成动画计划
 */
export function generateAnimationPlan(
  subType: QuestionSubType,
  input: AnimationTemplateInput
): AnimationTemplateOutput {
  const template = getTemplateForSubType(subType);
  return template(input);
}
