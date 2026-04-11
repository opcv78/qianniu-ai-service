/**
 * 图推动态解析 App - 共享类型定义
 */

// ============================================
// 枚举类型定义
// ============================================

/** 题目大类 */
export type MajorQuestionType = 'planar' | 'spatial';

/** 平面类题型子类型 - 根据图推总结完善 */
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

/** 立体类题型子类型 */
export type SpatialSubType =
  | 'folding'           // 折叠
  | 'section'           // 截面
  | 'solid_assembly'    // 立体拼图
  | 'view_projection'   // 视图
  | 'mixed_spatial';    // 混合立体类

/** 所有题型子类型联合 */
export type QuestionSubType = PlanarSubType | SpatialSubType;

// ============================================
// 动画相关类型
// ============================================

/** 动画动作类型 - 根据图推总结完善 */
export type AnimationActionType =
  // 基础动作
  | 'highlight'         // 高亮
  | 'move'              // 移动
  | 'rotate'            // 旋转
  | 'flip_horizontal'   // 水平翻转
  | 'flip_vertical'     // 垂直翻转
  | 'fade_in'           // 淡入
  | 'fade_out'          // 淡出
  | 'morph'             // 变形
  // 标注动作
  | 'count_emphasis'    // 数量强调
  | 'arrow_show'        // 箭头显示
  | 'circle_show'       // 圆圈标注
  | 'cross_show'        // 叉号标注
  | 'text_show'         // 文字显示
  | 'line_show'         // 线条显示
  | 'dot_show'          // 点显示
  | 'angle_show'        // 角度显示
  // 叠加动作
  | 'overlay_show'      // 叠加显示
  | 'overlay_merge'     // 叠加合并
  | 'overlay_disappear' // 叠加消失（去同存异）
  | 'overlay_keep'      // 叠加保留（去异存同）
  // 立体动作
  | 'fold'              // 折叠
  | 'unfold'            // 展开
  | 'cut'               // 切割
  | 'assemble'          // 拼装
  | 'disassemble'       // 拆解
  | 'camera_rotate'     // 相机旋转
  | 'project'           // 投影
  // 步骤说明
  | 'step_note';        // 步骤说明

/** 动画场景类型 */
export type SceneType =
  | 'planar_grid'       // 平面九宫格
  | 'planar_sequence'   // 平面序列
  | 'planar_single'     // 平面单图
  | 'spatial_placeholder'; // 立体占位

/** 动画目标位置 */
export interface AnimationTarget {
  /** 目标类型: cell(单元格), element(元素), row(行), column(列), whole(整体) */
  type: 'cell' | 'element' | 'row' | 'column' | 'whole' | 'custom';
  /** 目标索引，如九宫格位置 [row, col] */
  index?: [number, number] | number;
  /** 自定义目标ID */
  id?: string;
}

/** 动画步骤载荷 - 根据动作类型不同有不同结构 */
export interface AnimationPayload {
  /** 移动相关 */
  from?: [number, number];
  to?: [number, number];
  deltaX?: number;
  deltaY?: number;

  /** 旋转相关 */
  angle?: number;
  fromAngle?: number;
  toAngle?: number;

  /** 高亮相关 */
  color?: string;
  opacity?: number;
  borderWidth?: number;

  /** 叠加相关 */
  sources?: Array<[number, number]>;
  resultPosition?: [number, number];

  /** 数量相关 */
  count?: number;

  /** 文字相关 */
  text?: string;

  /** 箭头相关 */
  start?: [number, number];
  end?: [number, number];

  /** 通用 */
  duration?: number;
  delay?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/** 动画步骤 */
export interface AnimationStep {
  /** 步骤唯一ID */
  id: string;
  /** 动作类型 */
  action: AnimationActionType;
  /** 目标 */
  target: AnimationTarget;
  /** 持续时间(毫秒) */
  durationMs: number;
  /** 载荷数据 */
  payload: AnimationPayload;
  /** 旁白说明 */
  narration: string;
  /** 延迟(毫秒) */
  delayMs?: number;
  /** 是否等待此步骤完成再执行下一步 */
  waitComplete?: boolean;
}

/** 动画计划 */
export interface AnimationPlan {
  /** 场景类型 */
  sceneType: SceneType;
  /** 动画步骤列表 */
  steps: AnimationStep[];
  /** 最终答案提示 */
  finalAnswerHint?: string;
  /** 总预计时长(毫秒) */
  totalDurationMs?: number;
  /** 网格配置(如果有) */
  gridConfig?: {
    rows: number;
    cols: number;
    cellWidth?: number;
    cellHeight?: number;
  };
}

// ============================================
// 半自动模式配置
// ============================================

/** 半自动模式类型 */
export type SemiAutoMode = 'folding' | 'section' | 'assembly' | 'view';

/** 半自动模式配置 */
export interface SemiAutoConfig {
  /** 是否启用半自动模式 */
  enabled: boolean;
  /** 模式类型 */
  mode: SemiAutoMode;
  /** 需要用户执行的动作列表 */
  requiredUserActions: string[];
  /** 辅助说明文字 */
  helperText: string;
  /** 提示步骤(可选) */
  hintSteps?: Array<{
    step: number;
    description: string;
    highlight?: AnimationTarget;
  }>;
}

// ============================================
// 分析结果类型
// ============================================

/** 规则摘要 */
export interface RuleSummary {
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description: string;
  /** 规则细节 */
  details?: string[];
  /** 关键元素 */
  keyElements?: string[];
}

/** 题目分类结果 */
export interface ClassificationResult {
  /** 大类 */
  majorType: MajorQuestionType;
  /** 子类型候选列表(按置信度排序) */
  subTypeCandidates: QuestionSubType[];
  /** 置信度(0-1) */
  confidence: number;
  /** 简短推理说明 */
  reasoningBrief: string;
}

// ============================================
// 立体图形3D模型类型
// ============================================

/** 立体图形类型 */
export type SpatialModelType =
  // 基本几何体
  | 'cube'              // 立方体
  | 'cuboid'            // 长方体
  | 'cylinder'          // 圆柱
  | 'cone'              // 圆锥
  | 'sphere'            // 球体
  // 棱锥类
  | 'pyramid_triangular' // 三棱锥
  | 'pyramid_square'    // 四棱锥
  | 'pyramid_pentagonal' // 五棱锥
  | 'pyramid_hexagonal' // 六棱锥
  // 棱柱类
  | 'prism_triangular'  // 三棱柱
  | 'prism_square'      // 四棱柱（非立方体的长方体）
  | 'prism_pentagonal'  // 五棱柱
  | 'prism_hexagonal'   // 六棱柱
  | 'prism_octagonal'   // 八棱柱
  // 变体几何体
  | 'torus'             // 圆环/甜甜圈
  | 'hollow_cylinder'   // 空心圆柱
  | 'hollow_cone'       // 空心圆锥
  | 'truncated_cone'    // 圆台/截头圆锥
  | 'truncated_pyramid' // 棱台/截头棱锥
  | 'hemisphere'        // 半球
  | 'spherical_cap'     // 球冠
  | 'spherical_segment' // 球台
  | 'cylinder_segment'  // 圆柱段（斜切圆柱）
  // 组合字形
  | 'cross_shape'       // 十字形
  | 't_shape'           // T字形
  | 'l_shape'           // L字形
  | 'u_shape'           // U字形
  | 'star_shape'        // 星形
  | 'arrow_shape'       // 箭头形
  // 特殊形状
  | 'chamfered'         // 倒角形状
  | 'filleted'          // 圆角形状
  | 'grooved'           // 带槽形状
  | 'slotted'           // 带缝形状
  | 'notched'           // 带缺口形状
  | 'perforated'        // 多孔形状
  // 不规则和自定义
  | 'irregular'         // 不规则形状（用顶点描述）
  | 'custom'            // 自定义形状（用CSG操作描述）
  | 'composite';        // 复合几何体（多个几何体组合）

/** 几何体布尔运算类型 */
export type BooleanOperation = 'union' | 'subtract' | 'intersect';

/** CSG操作步骤 */
export interface CSGOperation {
  /** 操作类型 */
  operation: BooleanOperation;
  /** 操作对象A（主物体ID） */
  objectA: string;
  /** 操作对象B（被操作物体ID） */
  objectB: string;
  /** 结果物体ID */
  resultId: string;
}

/** 顶点定义（用于不规则几何体） */
export interface Vertex3D {
  x: number;
  y: number;
  z: number;
}

/** 面定义（用于不规则几何体） */
export interface Face3D {
  /** 顶点索引数组 */
  vertices: number[];
  /** 面颜色 */
  color?: string;
  /** 面名称 */
  name?: string;
  /** 是否有标记 */
  hasMark?: boolean;
  markDescription?: string;
}

/** 不规则几何体定义 */
export interface IrregularGeometry {
  /** 顶点数组 */
  vertices: Vertex3D[];
  /** 面数组 */
  faces: Face3D[];
  /** 边数组（可选，用于高亮） */
  edges?: Array<{ from: number; to: number }>;
}

/** 单个几何体组件 */
export interface GeometryComponent {
  /** 组件ID */
  id: string;
  /** 组件类型 */
  type: Exclude<SpatialModelType, 'composite'>;
  /** 组件名称 */
  name: string;
  /** 组件尺寸 */
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    radius?: number;
    /** 顶部半径（用于圆台、棱台） */
    topRadius?: number;
    /** 底部半径（用于圆台、棱台） */
    bottomRadius?: number;
    /** 内半径（用于空心形状） */
    innerRadius?: number;
    /** 外半径（用于空心形状） */
    outerRadius?: number;
    /** 圆环半径（用于torus） */
    tubeRadius?: number;
    /** 边数（用于棱柱、棱锥） */
    sides?: number;
  };
  /** 组件位置（相对于父物体中心） */
  position?: { x: number; y: number; z: number };
  /** 组件旋转（欧拉角，弧度） */
  rotation?: { x: number; y: number; z: number };
  /** 组件颜色 */
  color?: string;
  /** 是否为空心/孔洞 */
  isHollow?: boolean;
  /** 组件是否透明 */
  transparent?: boolean;
  /** 透明度 0-1 */
  opacity?: number;
  /** 各面信息 */
  faces?: SpatialFace[];
  /** 特殊特征 */
  features?: Array<{
    type: 'hole' | 'mark' | 'cut' | 'pattern' | 'chamfer' | 'fillet' | 'groove' | 'slot' | 'notch';
    description: string;
    position?: { x: number; y: number; z: number };
    size?: number;
    /** 槽/切口的尺寸 */
    dimensions?: {
      length?: number;
      width?: number;
      depth?: number;
    };
  }>;
  /** 不规则几何体定义（当 type 为 'irregular' 时使用） */
  irregularGeometry?: IrregularGeometry;
}

/** 立体图形面信息 */
export interface SpatialFace {
  /** 面ID */
  id: string;
  /** 面名称 */
  name: string;
  /** 面形状: square, rectangle, triangle, circle, polygon */
  shape: 'square' | 'rectangle' | 'triangle' | 'circle' | 'polygon';
  /** 面颜色 (用于区分不同面) */
  color?: string;
  /** 是否有标记/图案 */
  hasMark?: boolean;
  /** 标记描述 */
  markDescription?: string;
  /** 标记位置 (相对坐标 0-1) */
  markPosition?: { x: number; y: number };
}

/** 切割平面信息 */
export interface CuttingPlane {
  /** 切割角度 (度) */
  angle: number;
  /** 切割方向: horizontal, vertical, diagonal */
  direction: 'horizontal' | 'vertical' | 'diagonal';
  /** 切割位置 (0-1, 相对于物体中心) */
  position: number;
  /** 切割描述 */
  description?: string;
}

/** 截面信息 */
export interface SectionInfo {
  /** 截面形状: circle, ellipse, triangle, rectangle, polygon */
  shape: 'circle' | 'ellipse' | 'triangle' | 'rectangle' | 'polygon' | 'irregular';
  /** 截面顶点坐标 (如果是多边形) */
  vertices?: Array<{ x: number; y: number }>;
  /** 截面描述 */
  description: string;
  /** 对应的切割平面 */
  cuttingPlane?: CuttingPlane;
}

/** 立体图形3D结构数据 */
export interface SpatialModelData {
  /** 图形类型 */
  type: SpatialModelType;
  /** 图形名称 */
  name: string;
  /** 尺寸参数 */
  dimensions: {
    /** 长/直径 */
    length?: number;
    /** 宽 */
    width?: number;
    /** 高 */
    height?: number;
    /** 半径 (圆柱/圆锥/球) */
    radius?: number;
    /** 顶部半径（用于圆台、棱台） */
    topRadius?: number;
    /** 底部半径（用于圆台、棱台） */
    bottomRadius?: number;
    /** 内半径（用于空心形状） */
    innerRadius?: number;
    /** 外半径（用于空心形状） */
    outerRadius?: number;
    /** 圆环半径（用于torus） */
    tubeRadius?: number;
    /** 边数（用于棱柱、棱锥） */
    sides?: number;
  };
  /** 各面信息 */
  faces?: SpatialFace[];
  /** 特殊特征 */
  features?: Array<{
    type: 'hole' | 'mark' | 'cut' | 'pattern' | 'embedded_shape' | 'chamfer' | 'fillet' | 'groove' | 'slot' | 'notch' | 'perforation';
    description: string;
    position?: { x: number; y: number; z: number };
    size?: number;
    /** 嵌入形状的类型（如圆锥、圆柱等） */
    embeddedType?: Exclude<SpatialModelType, 'composite'>;
    /** 嵌入形状的尺寸 */
    embeddedDimensions?: {
      length?: number;
      width?: number;
      height?: number;
      radius?: number;
    };
    /** 孔的数量（用于多孔形状） */
    count?: number;
    /** 孔的排列方式 */
    pattern?: 'grid' | 'circular' | 'linear' | 'random';
  }>;
  /** 复合几何体的组件列表 (当 type 为 'composite' 时使用) */
  components?: GeometryComponent[];
  /** CSG 操作序列 (用于 custom 类型) */
  csgOperations?: CSGOperation[];
  /** 不规则几何体定义 (当 type 为 'irregular' 时使用) */
  irregularGeometry?: IrregularGeometry;
  /** 切割信息 (截面类题目) */
  cuttingInfo?: {
    /** 切割平面列表 */
    cuttingPlanes: CuttingPlane[];
    /** 截面信息 */
    sections: SectionInfo[];
  };
  /** 折叠信息 (折叠类题目) */
  foldingInfo?: {
    /** 展开图是否完整 */
    isCompleteUnfold: boolean;
    /** 缺失的面 */
    missingFaces?: string[];
    /** 需要识别的面 */
    targetFaces?: string[];
    /** 折叠步骤提示 */
    foldingSteps?: string[];
    /** 展开图面数据 */
    unfoldFaces?: Array<{
      id: string;
      name: string;
      shape: 'square' | 'rectangle' | 'triangle' | 'polygon';
      position: { x: number; y: number };
      rotation: number;
      adjacentTo: string[];
      hasPattern?: boolean;
      patternDescription?: string;
    }>;
  };
  /** 视图信息 (视图类题目) */
  viewInfo?: {
    /** 主视图描述 */
    frontView?: string;
    /** 侧视图描述 */
    sideView?: string;
    /** 俯视图描述 */
    topView?: string;
    /** 需要识别的视图 */
    targetView?: 'front' | 'side' | 'top';
    /** 视图详细数据 */
    viewDetails?: {
      visibleFaces?: string[];
      hiddenFaces?: string[];
      markPositions?: Record<string, string>;
      /** 视图轮廓点 */
      outline?: Array<{ x: number; y: number }>;
    };
  };
  /** 拼装信息 (立体拼图类题目) */
  assemblyInfo?: {
    /** 组件数量 */
    componentCount: number;
    /** 目标形状描述 */
    targetShape?: string;
    /** 拼装步骤 */
    assemblySteps?: Array<{
      step: number;
      componentId: string;
      action: 'place' | 'rotate' | 'combine';
      description: string;
    }>;
  };
}

/** 分析结果 */
export interface AnalyzeResult {
  /** 是否成功 */
  success: boolean;
  /** 大类 */
  majorType: MajorQuestionType;
  /** 确定的子类型 */
  subType: QuestionSubType;
  /** 置信度(0-1) */
  confidence: number;
  /** 是否支持动画 */
  animationSupported: boolean;
  /** 动画支持程度: full(完全支持), partial(部分支持), none(不支持) */
  animationSupportLevel?: 'full' | 'partial' | 'none';
  /** 解释说明 */
  explanation: string;
  /** 规则摘要 */
  ruleSummary: RuleSummary;
  /** 动画计划(平面类完整，立体类为占位) */
  animationPlan: AnimationPlan;
  /** 半自动配置(立体类必填) */
  semiAutoConfig?: SemiAutoConfig;
  /** 立体图形3D模型数据 (立体类题目) */
  spatialModelData?: SpatialModelData;
  /** 警告信息 */
  warnings?: string[];
  /** 原始模型输出(仅开发环境) */
  rawModelOutput?: unknown;
  /** 错误信息(如果失败) */
  error?: string;
}

// ============================================
// 上传相关类型
// ============================================

/** 上传结果 */
export interface UploadResult {
  /** 图片ID */
  imageId: string;
  /** 访问URL */
  url: string;
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
  /** MIME类型 */
  mimeType: string;
  /** 文件大小(字节) */
  size: number;
}

// ============================================
// API请求/响应类型
// ============================================

/** 上传请求 */
export interface UploadRequest {
  // FormData with image file
}

/** 分类请求 */
export interface ClassifyRequest {
  imageId?: string;
  imageUrl?: string;
}

/** 分类响应 */
export interface ClassifyResponse extends ClassificationResult {
  success: boolean;
  error?: string;
}

/** 分析请求 */
export interface AnalyzeRequest {
  imageId?: string;
  imageUrl?: string;
  hints?: string[];
}

/** 分析响应 */
export interface AnalyzeResponse extends AnalyzeResult {}

/** 健康检查响应 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  uptime?: number;
}

// ============================================
// 历史记录类型
// ============================================

/** 历史记录项 */
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

// ============================================
// LLM Provider 类型
// ============================================

/** Vision LLM 输入 */
export interface VisionInput {
  imageUrl?: string;
  imageBase64?: string;
  localPath?: string;
  mimeType?: string;
  hints?: string[];
}

/** LLM Provider 接口 */
export interface VisionLLMProvider {
  classifyQuestion(input: VisionInput): Promise<ClassificationResult>;
  analyzePlanar(input: VisionInput, subType?: PlanarSubType): Promise<AnalyzeResult>;
  analyzeSpatial(input: VisionInput, subType?: SpatialSubType): Promise<AnalyzeResult>;
}

// ============================================
// App设置类型
// ============================================

/** 应用设置 */
export interface AppSettings {
  apiBaseUrl: string;
  showDebugInfo: boolean;
  currentModel: string;
  enableDemoMode: boolean;
  theme: 'light' | 'dark' | 'system';
}

// ============================================
// 题型常量映射
// ============================================

/** 平面类题型中文名称映射 */
export const PLANAR_SUBTYPE_NAMES: Record<PlanarSubType, string> = {
  // 位置类
  position_move: '位置移动',
  rotation: '旋转',
  flip: '翻转',
  // 叠加类
  overlay_union: '叠加-并集',
  overlay_xor: '叠加-去同存异',
  overlay_intersection: '叠加-去异存同',
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
  element_replace: '元素增减替换',
  element_traverse: '元素遍历',
  // 其他
  stroke_count: '笔画数',
  one_stroke: '一笔画',
  mixed_planar: '混合平面类',
};

/** 立体类题型中文名称映射 */
export const SPATIAL_SUBTYPE_NAMES: Record<SpatialSubType, string> = {
  folding: '折叠',
  section: '截面',
  solid_assembly: '立体拼图',
  view_projection: '视图',
  mixed_spatial: '混合立体类',
};

/** 获取题型中文名称 */
export function getSubTypeName(subType: QuestionSubType): string {
  return PLANAR_SUBTYPE_NAMES[subType as PlanarSubType]
    || SPATIAL_SUBTYPE_NAMES[subType as SpatialSubType]
    || subType;
}

/** 大类中文名称映射 */
export const MAJOR_TYPE_NAMES: Record<MajorQuestionType, string> = {
  planar: '平面类',
  spatial: '立体类',
};

/** 题型详细说明 */
export const SUBTYPE_DESCRIPTIONS: Record<QuestionSubType, string> = {
  // 位置类
  position_move: '图形元素沿固定方向移动，步长固定或递增',
  rotation: '图形元素绕某点转动，角度固定（如每次90°）',
  flip: '图形元素上下或左右翻转',
  // 叠加类
  overlay_union: '两图直接叠加，保留所有元素',
  overlay_xor: '去掉相同部分，保留不同部分',
  overlay_intersection: '去掉不同部分，保留相同部分',
  overlay_black_white: '黑白格子叠加逻辑',
  overlay_outline: '只保留叠加后的轮廓',
  // 数量类
  count_change: '元素数量规律变化',
  count_point: '统计交点、端点、顶点数量',
  count_line: '统计直线、曲线、笔画数量',
  count_angle: '统计锐角、直角、钝角数量',
  count_region: '统计封闭区间数量',
  count_part: '统计图形独立部分数量',
  count_element: '统计元素种类和数量',
  // 属性类
  shade_change: '黑白块位置或数量变化',
  symmetry: '轴对称或中心对称判断',
  element_replace: '元素按规律增减或替换',
  element_traverse: '元素在某位置依次出现',
  // 其他
  stroke_count: '笔画数规律',
  one_stroke: '一笔画问题',
  mixed_planar: '混合平面类规律',
  // 立体类
  folding: '折纸盒问题，展开图与立体图对应',
  section: '立体图形截面形状判断',
  solid_assembly: '立体拼图，多个小立体拼合成整体',
  view_projection: '三视图问题，正视图、侧视图、俯视图',
  mixed_spatial: '混合立体类问题',
};
