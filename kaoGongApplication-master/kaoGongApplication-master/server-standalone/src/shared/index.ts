/**
 * 共享类型定义
 */

// 题型枚举
export type MajorQuestionType = 'planar' | 'spatial';

// 平面类题型子类型 - 完整版
export type PlanarSubType =
  // 位置类
  | 'position_move'      // 位置移动/平移
  | 'rotation'           // 旋转
  | 'flip'               // 翻转
  // 叠加类
  | 'overlay_union'      // 叠加-并集/直接叠加
  | 'overlay_xor'        // 叠加-异或/去同存异
  | 'overlay_intersection' // 叠加-交集/去异存同
  | 'overlay_black_white' // 黑白叠加
  | 'overlay_outline'    // 轮廓叠加
  // 数量类
  | 'count_change'       // 数量变化
  | 'count_point'        // 点的数量
  | 'count_line'         // 线的数量
  | 'count_angle'        // 角的数量
  | 'count_region'       // 封闭区间数
  | 'count_part'         // 部分数
  | 'count_element'      // 元素数量
  // 属性类
  | 'shade_change'       // 黑白块/阴影块变化
  | 'symmetry'           // 对称性
  | 'element_replace'    // 元素增减/替换
  | 'element_traverse'   // 元素遍历
  // 其他
  | 'stroke_count'       // 笔画数
  | 'one_stroke'         // 一笔画
  | 'mixed_planar';      // 混合平面类

export type SpatialSubType =
  | 'folding'           // 折叠
  | 'section'           // 截面
  | 'solid_assembly'    // 立体拼图
  | 'view_projection'   // 视图
  | 'mixed_spatial';    // 混合立体类

export type QuestionSubType = PlanarSubType | SpatialSubType;

// Vision 输入
export interface VisionInput {
  imageUrl?: string;
  imageBase64?: string;
  localPath?: string;
  mimeType?: string;
  hints?: string[];
}

// 分类结果
export interface ClassificationResult {
  majorType: MajorQuestionType;
  subTypeCandidates: QuestionSubType[];
  confidence: number;
  reasoningBrief: string;
}

// 立体图形3D模型数据
export type SpatialModelType =
  | 'cube'              // 立方体
  | 'cuboid'            // 长方体
  | 'cylinder'          // 圆柱
  | 'cone'              // 圆锥
  | 'sphere'            // 球体
  | 'pyramid_triangular' // 三棱锥
  | 'pyramid_square'    // 四棱锥
  | 'prism_triangular'  // 三棱柱
  | 'prism_hexagonal'   // 六棱柱
  | 'composite';        // 复合几何体

/** 单个几何体组件 */
export interface GeometryComponent {
  id: string;
  type: Exclude<SpatialModelType, 'composite'>;
  name: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    radius?: number;
  };
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  color?: string;
  isHollow?: boolean;
  transparent?: boolean;
  opacity?: number;
  faces?: Array<{
    id: string;
    name: string;
    shape: 'square' | 'rectangle' | 'triangle' | 'circle' | 'polygon';
    color?: string;
    hasMark?: boolean;
    markType?: string;
    markDescription?: string;
    markPosition?: { x: number; y: number };
  }>;
  features?: Array<{
    type: 'hole' | 'mark' | 'cut' | 'pattern';
    description: string;
    position?: { x: number; y: number; z: number };
    size?: number;
  }>;
}

export interface SpatialModelData {
  type: SpatialModelType;
  name: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    radius?: number;
  };
  faces?: Array<{
    id: string;
    name: string;
    shape: 'square' | 'rectangle' | 'triangle' | 'circle' | 'polygon';
    color?: string;
    hasMark?: boolean;
    markType?: string;
    markDescription?: string;
    markPosition?: { x: number; y: number };
  }>;
  features?: Array<{
    type: 'hole' | 'cut' | 'pattern' | 'marker' | 'embedded_shape';
    description: string;
    position?: { x: number; y: number; z: number };
    size?: number;
    shape?: string;
    embeddedType?: Exclude<SpatialModelType, 'composite'>;
    embeddedDimensions?: {
      length?: number;
      width?: number;
      height?: number;
      radius?: number;
    };
  }>;
  components?: GeometryComponent[];
  cuttingInfo?: {
    cuttingPlanes: Array<{
      id: string;
      angle: number;
      direction: 'horizontal' | 'vertical' | 'diagonal';
      position: number;
      description?: string;
    }>;
    sections: Array<{
      id: string;
      shape: string;
      description: string;
      cuttingPlaneId?: string;
      vertices?: Array<{ x: number; y: number }>;
    }>;
  };
  foldingInfo?: {
    isCompleteUnfold: boolean;
    missingFaces?: string[];
    targetFaces?: string[];
    foldingSteps?: string[];
    baseFace?: string;
    adjacentRelations?: Array<{ faceId: string; adjacentTo: string[] }>;
  };
  viewInfo?: {
    frontView?: string;
    sideView?: string;
    topView?: string;
    targetView?: 'front' | 'side' | 'top';
    viewDetails?: {
      visibleFaces?: string[];
      hiddenFaces?: string[];
      markPositions?: Record<string, string>;
    };
  };
}

// 分析结果
export interface AnalyzeResult {
  success: boolean;
  majorType: MajorQuestionType;
  subType: QuestionSubType;
  confidence: number;
  animationSupported: boolean;
  animationSupportLevel?: 'full' | 'partial' | 'none';
  explanation: string;
  ruleSummary: RuleSummary;
  animationPlan?: AnimationPlan;
  semiAutoConfig?: SemiAutoConfig;
  spatialModelData?: SpatialModelData;
  warnings?: string[];
  rawModelOutput?: unknown;
  error?: string;
}

export interface RuleSummary {
  name: string;
  description: string;
  details?: string[];
  keyElements?: string[];
}

export interface AnimationPlan {
  sceneType: 'planar_grid' | 'planar_sequence' | 'planar_single' | 'spatial_placeholder';
  steps: AnimationStep[];
  finalAnswerHint?: string;
  totalDurationMs?: number;
  gridConfig?: { rows: number; cols: number };
}

export interface AnimationStep {
  id: string;
  action: string;
  target: { type: string; index?: [number, number] | number; id?: string };
  durationMs: number;
  payload: Record<string, any>;
  narration: string;
}

export interface SemiAutoConfig {
  enabled: boolean;
  mode: 'folding' | 'section' | 'assembly' | 'view';
  requiredUserActions: string[];
  helperText: string;
  hintSteps?: Array<{ step: number; description: string }>;
}

// API 类型
export interface UploadResult {
  imageId: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  size: number;
}

export interface ClassifyRequest {
  imageId?: string;
  imageUrl?: string;
}

export interface ClassifyResponse extends ClassificationResult {
  success: boolean;
  error?: string;
}

export interface AnalyzeRequest {
  imageId?: string;
  imageUrl?: string;
  hints?: string[];
}

export interface AnalyzeResponse extends AnalyzeResult {}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  uptime?: number;
}

// 历史记录
export interface HistoryItem {
  id: string;
  imageId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  majorType: MajorQuestionType;
  subType: QuestionSubType;
  confidence: number;
  explanation: string;
  createdAt: string;
  analyzedAt: string;
}

// 题型名称映射
export const PLANAR_SUBTYPE_NAMES: Record<PlanarSubType, string> = {
  // 位置类
  position_move: '位置移动',
  rotation: '旋转',
  flip: '翻转',
  // 叠加类
  overlay_union: '叠加-并集',
  overlay_xor: '叠加-异或',
  overlay_intersection: '叠加-交集',
  overlay_black_white: '黑白叠加',
  overlay_outline: '轮廓叠加',
  // 数量类
  count_change: '数量变化',
  count_point: '点的数量',
  count_line: '线的数量',
  count_angle: '角的数量',
  count_region: '封闭区间数',
  count_part: '部分数',
  count_element: '元素数量',
  // 属性类
  shade_change: '黑白块变化',
  symmetry: '对称性',
  element_replace: '元素替换',
  element_traverse: '元素遍历',
  // 其他
  stroke_count: '笔画数',
  one_stroke: '一笔画',
  mixed_planar: '混合平面类',
};

export const SPATIAL_SUBTYPE_NAMES: Record<SpatialSubType, string> = {
  folding: '折叠',
  section: '截面',
  solid_assembly: '立体拼图',
  view_projection: '视图',
  mixed_spatial: '混合立体类',
};

export function getSubTypeName(subType: QuestionSubType): string {
  return PLANAR_SUBTYPE_NAMES[subType as PlanarSubType]
    || SPATIAL_SUBTYPE_NAMES[subType as SpatialSubType]
    || subType;
}

export function isPlanarType(subType: QuestionSubType): boolean {
  return Object.keys(PLANAR_SUBTYPE_NAMES).includes(subType);
}

export function isSpatialType(subType: QuestionSubType): boolean {
  return Object.keys(SPATIAL_SUBTYPE_NAMES).includes(subType);
}

// Zod Schemas (简化版，不依赖 zod)
export const ClassifyRequestSchema = {
  safeParse: (data: any) => {
    if (!data.imageId && !data.imageUrl) {
      return { success: false, error: { message: '必须提供 imageId 或 imageUrl' } };
    }
    return { success: true, data };
  }
};

export const AnalyzeRequestSchema = {
  safeParse: (data: any) => {
    if (!data.imageId && !data.imageUrl) {
      return { success: false, error: { message: '必须提供 imageId 或 imageUrl' } };
    }
    return { success: true, data };
  }
};

export const ClassificationResultSchema = {
  safeParse: (data: any) => ({ success: true, data })
};

export const AnalyzeResultSchema = {
  safeParse: (data: any) => ({ success: true, data })
};
