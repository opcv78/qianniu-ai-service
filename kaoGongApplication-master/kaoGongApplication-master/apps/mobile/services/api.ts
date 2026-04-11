/**
 * API Service - 网络请求封装
 */

const API_BASE_URL = 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UploadResult {
  imageId: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  size: number;
}

interface ClassificationResult {
  majorType: 'planar' | 'spatial';
  subTypeCandidates: string[];
  confidence: number;
  reasoningBrief: string;
}

// 立体图形类型
type SpatialModelType =
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

// 单个几何体组件
interface GeometryComponent {
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

// 立体图形3D模型数据
interface SpatialModelData {
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

interface AnalyzeResult {
  success: boolean;
  majorType: 'planar' | 'spatial';
  subType: string;
  confidence: number;
  animationSupported: boolean;
  explanation: string;
  ruleSummary: {
    name: string;
    description: string;
    details?: string[];
    keyElements?: string[];
  };
  animationPlan?: {
    sceneType: string;
    steps: Array<{
      id: string;
      action: string;
      target: any;
      durationMs: number;
      payload: any;
      narration: string;
    }>;
    finalAnswerHint?: string;
  };
  semiAutoConfig?: {
    enabled: boolean;
    mode: string;
    requiredUserActions: string[];
    helperText: string;
  };
  spatialModelData?: SpatialModelData;
  warnings?: string[];
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = 30000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async health(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.request('/api/health');
  }

  /**
   * 上传图片
   */
  async uploadImage(imageUri: string): Promise<ApiResponse<UploadResult>> {
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();

    // 检测是否为 Web 环境
    const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

    if (isWeb) {
      // Web 环境：需要先 fetch 图片然后转为 Blob
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, filename);
      } catch (error) {
        return {
          success: false,
          error: '无法读取图片文件',
        };
      }
    } else {
      // React Native 环境
      // @ts-ignore
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // 注意：不要手动设置 Content-Type，让浏览器自动设置 boundary
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '上传失败' }));
        return { success: false, error: errorData.error || '上传失败' };
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  /**
   * 分类题目
   */
  async classify(imageId: string): Promise<ApiResponse<ClassificationResult>> {
    try {
      const result = await this.request<ClassificationResult>('/api/classify', {
        method: 'POST',
        body: JSON.stringify({ imageId }),
      });
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '分类失败',
      };
    }
  }

  /**
   * 分析题目
   */
  async analyze(imageId: string, hints?: string[]): Promise<ApiResponse<AnalyzeResult>> {
    try {
      const result = await this.request<AnalyzeResult>('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ imageId, hints }),
      }, 90000);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '分析失败',
      };
    }
  }

  /**
   * 完整分析流程
   */
  async fullAnalysis(imageUri: string, hints?: string[]): Promise<{
    success: boolean;
    imageId?: string;
    imageUrl?: string;
    classification?: ClassificationResult;
    analysis?: AnalyzeResult;
    error?: string;
  }> {
    try {
      // 1. 上传图片
      const uploadResult = await this.uploadImage(imageUri);
      if (!uploadResult.success || !uploadResult.data) {
        return { success: false, error: uploadResult.error || '上传失败' };
      }

      const { imageId, url } = uploadResult.data;

      // 2. 分类
      const classifyResult = await this.classify(imageId);
      if (!classifyResult.success || !classifyResult.data) {
        return { success: false, imageId, imageUrl: url, error: classifyResult.error || '分类失败' };
      }

      // 3. 分析
      const analyzeResult = await this.analyze(imageId, hints);
      if (!analyzeResult.success || !analyzeResult.data) {
        return {
          success: false,
          imageId,
          imageUrl: url,
          classification: classifyResult.data,
          error: analyzeResult.error || '分析失败',
        };
      }

      return {
        success: true,
        imageId,
        imageUrl: url,
        classification: classifyResult.data,
        analysis: analyzeResult.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}

export const apiService = new ApiService();
export type { UploadResult, ClassificationResult, AnalyzeResult };
