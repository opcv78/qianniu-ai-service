/**
 * 图推动态解析 App - Zod Schema 定义
 * 用于验证 LLM 输出和 API 请求/响应
 */

import { z } from 'zod';

// ============================================
// 枚举 Schema
// ============================================

export const MajorQuestionTypeSchema = z.enum(['planar', 'spatial']);

export const PlanarSubTypeSchema = z.enum([
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
]);

export const SpatialSubTypeSchema = z.enum([
  'folding',
  'section',
  'solid_assembly',
  'view_projection',
  'mixed_spatial',
]);

export const QuestionSubTypeSchema = z.union([PlanarSubTypeSchema, SpatialSubTypeSchema]);

export const AnimationActionTypeSchema = z.enum([
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
]);

export const SceneTypeSchema = z.enum([
  'planar_grid',
  'planar_sequence',
  'planar_single',
  'spatial_placeholder',
]);

// ============================================
// 动画相关 Schema
// ============================================

export const AnimationTargetSchema = z.object({
  type: z.enum(['cell', 'element', 'row', 'column', 'whole', 'custom']),
  index: z.union([
    z.tuple([z.number(), z.number()]),
    z.number(),
  ]).optional(),
  id: z.string().optional(),
});

export const AnimationPayloadSchema = z.object({
  // 移动相关
  from: z.tuple([z.number(), z.number()]).optional(),
  to: z.tuple([z.number(), z.number()]).optional(),
  deltaX: z.number().optional(),
  deltaY: z.number().optional(),

  // 旋转相关
  angle: z.number().optional(),
  fromAngle: z.number().optional(),
  toAngle: z.number().optional(),

  // 高亮相关
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  borderWidth: z.number().optional(),

  // 叠加相关
  sources: z.array(z.tuple([z.number(), z.number()])).optional(),
  resultPosition: z.tuple([z.number(), z.number()]).optional(),

  // 数量相关
  count: z.number().optional(),

  // 文字相关
  text: z.string().optional(),

  // 箭头相关
  start: z.tuple([z.number(), z.number()]).optional(),
  end: z.tuple([z.number(), z.number()]).optional(),

  // 通用
  duration: z.number().optional(),
  delay: z.number().optional(),
  easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).optional(),
});

export const AnimationStepSchema = z.object({
  id: z.string(),
  action: AnimationActionTypeSchema,
  target: AnimationTargetSchema,
  durationMs: z.number().min(0),
  payload: AnimationPayloadSchema,
  narration: z.string(),
  delayMs: z.number().min(0).optional(),
  waitComplete: z.boolean().optional(),
});

export const GridConfigSchema = z.object({
  rows: z.number().int().min(1),
  cols: z.number().int().min(1),
  cellWidth: z.number().optional(),
  cellHeight: z.number().optional(),
});

export const AnimationPlanSchema = z.object({
  sceneType: SceneTypeSchema,
  steps: z.array(AnimationStepSchema),
  finalAnswerHint: z.string().optional(),
  totalDurationMs: z.number().optional(),
  gridConfig: GridConfigSchema.optional(),
});

// ============================================
// 半自动模式 Schema
// ============================================

export const SemiAutoModeSchema = z.enum(['folding', 'section', 'assembly', 'view']);

export const HintStepSchema = z.object({
  step: z.number().int(),
  description: z.string(),
  highlight: AnimationTargetSchema.optional(),
});

export const SemiAutoConfigSchema = z.object({
  enabled: z.boolean(),
  mode: SemiAutoModeSchema,
  requiredUserActions: z.array(z.string()),
  helperText: z.string(),
  hintSteps: z.array(HintStepSchema).optional(),
});

// ============================================
// 规则摘要 Schema
// ============================================

export const RuleSummarySchema = z.object({
  name: z.string(),
  description: z.string(),
  details: z.array(z.string()).optional(),
  keyElements: z.array(z.string()).optional(),
});

// ============================================
// 分类结果 Schema
// ============================================

export const ClassificationResultSchema = z.object({
  majorType: MajorQuestionTypeSchema,
  subTypeCandidates: z.array(QuestionSubTypeSchema).min(1),
  confidence: z.number().min(0).max(1),
  reasoningBrief: z.string(),
});

// ============================================
// 分析结果 Schema
// ============================================

export const AnalyzeResultSchema = z.object({
  success: z.boolean(),
  majorType: MajorQuestionTypeSchema,
  subType: QuestionSubTypeSchema,
  confidence: z.number().min(0).max(1),
  animationSupported: z.boolean(),
  animationSupportLevel: z.enum(['full', 'partial', 'none']).optional(),
  explanation: z.string(),
  ruleSummary: RuleSummarySchema,
  animationPlan: AnimationPlanSchema,
  semiAutoConfig: SemiAutoConfigSchema.optional(),
  warnings: z.array(z.string()).optional(),
  rawModelOutput: z.unknown().optional(),
  error: z.string().optional(),
});

// ============================================
// API 请求/响应 Schema
// ============================================

export const UploadResultSchema = z.object({
  imageId: z.string(),
  url: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mimeType: z.string(),
  size: z.number().int().positive(),
});

export const ClassifyRequestSchema = z.object({
  imageId: z.string().optional(),
  imageUrl: z.string().optional(),
}).refine(data => data.imageId || data.imageUrl, {
  message: '必须提供 imageId 或 imageUrl',
});

export const ClassifyResponseSchema = z.object({
  success: z.boolean(),
  majorType: MajorQuestionTypeSchema,
  subTypeCandidates: z.array(QuestionSubTypeSchema),
  confidence: z.number().min(0).max(1),
  reasoningBrief: z.string(),
  error: z.string().optional(),
});

export const AnalyzeRequestSchema = z.object({
  imageId: z.string().optional(),
  imageUrl: z.string().optional(),
  hints: z.array(z.string()).optional(),
}).refine(data => data.imageId || data.imageUrl, {
  message: '必须提供 imageId 或 imageUrl',
});

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number().optional(),
});

// ============================================
// LLM 输出 Schema (用于解析和验证 LLM 返回的 JSON)
// ============================================

/** LLM 分类输出 Schema - 用于验证 LLM 返回的分类结果 */
export const LLMClassifyOutputSchema = z.object({
  majorType: MajorQuestionTypeSchema,
  subTypeCandidates: z.array(z.string()).min(1).max(5),
  confidence: z.number().min(0).max(1),
  reasoningBrief: z.string().max(200),
});

/** LLM 平面分析输出 Schema */
export const LLMPlanarAnalyzeOutputSchema = z.object({
  subType: PlanarSubTypeSchema,
  confidence: z.number().min(0).max(1),
  ruleSummary: RuleSummarySchema,
  explanation: z.string(),
  animationPlan: AnimationPlanSchema,
  warnings: z.array(z.string()).optional(),
});

/** LLM 立体分析输出 Schema */
export const LLMSpatialAnalyzeOutputSchema = z.object({
  subType: SpatialSubTypeSchema,
  confidence: z.number().min(0).max(1),
  ruleSummary: RuleSummarySchema,
  explanation: z.string(),
  animationPlan: AnimationPlanSchema,
  semiAutoConfig: SemiAutoConfigSchema,
  warnings: z.array(z.string()).optional(),
});

// ============================================
// 辅助函数
// ============================================

/**
 * 验证并解析 LLM 分类输出
 */
export function parseLLMClassifyOutput(data: unknown) {
  return LLMClassifyOutputSchema.safeParse(data);
}

/**
 * 验证并解析 LLM 平面分析输出
 */
export function parseLLMPlanarAnalyzeOutput(data: unknown) {
  return LLMPlanarAnalyzeOutputSchema.safeParse(data);
}

/**
 * 验证并解析 LLM 立体分析输出
 */
export function parseLLMSpatialAnalyzeOutput(data: unknown) {
  return LLMSpatialAnalyzeOutputSchema.safeParse(data);
}

/**
 * 验证完整的分析结果
 */
export function parseAnalyzeResult(data: unknown) {
  return AnalyzeResultSchema.safeParse(data);
}
