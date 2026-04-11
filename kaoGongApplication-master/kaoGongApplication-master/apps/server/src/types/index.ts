/**
 * Server 类型定义
 */

import type {
  MajorQuestionType,
  QuestionSubType,
  ClassificationResult,
  AnalyzeResult,
  VisionInput,
} from '@kao-gong/shared';

// ============================================
// LLM Provider 类型
// ============================================

/** LLM 配置 */
export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout?: number;
  maxRetries?: number;
}

/** LLM 请求选项 */
export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/** LLM 响应 */
export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Vision LLM Provider 接口 */
export interface VisionLLMProvider {
  /** 分类问题 */
  classifyQuestion(input: VisionInput): Promise<ClassificationResult>;

  /** 分析平面类问题 */
  analyzePlanar(input: VisionInput, subType?: QuestionSubType): Promise<AnalyzeResult>;

  /** 分析立体类问题 */
  analyzeSpatial(input: VisionInput, subType?: QuestionSubType): Promise<AnalyzeResult>;

  /** 提供者名称 */
  readonly name: string;
}

// ============================================
// 服务器配置类型
// ============================================

export interface ServerConfig {
  port: number;
  host: string;
  uploadDir: string;
  maxFileSize: number;
  corsOrigins: string[];
}

// ============================================
// 文件上传类型
// ============================================

export interface UploadedFile {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  width?: number;
  height?: number;
}

// ============================================
// API 响应类型
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
