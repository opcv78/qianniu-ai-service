/**
 * API Service - 网络请求封装
 */

import { API_CONFIG } from '../constants';
import type { UploadResponse, ApiError } from '../types';
import type {
  ClassifyRequest,
  ClassifyResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  HealthResponse,
} from '@kao-gong/shared';

type ApiResponse<T> = T | ApiError;

class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async fetchWithTimeout<T>(
    url: string,
    options: RequestInit,
    timeout: number = this.timeout
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
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
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async health(): Promise<HealthResponse> {
    return this.fetchWithTimeout<HealthResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.health}`,
      { method: 'GET' }
    );
  }

  /**
   * 上传图片
   */
  async uploadImage(imageUri: string): Promise<UploadResponse> {
    const formData = new FormData();

    // 从 URI 中提取文件名和类型
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // @ts-ignore - FormData 在 React Native 中的特殊处理
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    });

    return this.fetchWithTimeout<UploadResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.upload}`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
      60000 // 上传超时 60 秒
    );
  }

  /**
   * 上传 Base64 图片
   */
  async uploadImageBase64(base64: string, mimeType: string = 'image/png'): Promise<UploadResponse> {
    // 将 base64 转换为 Blob
    const response = await fetch(`data:${mimeType};base64,${base64}`);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('image', blob, `image.${mimeType.split('/')[1] || 'png'}`);

    return this.fetchWithTimeout<UploadResponse>(
      `${this.baseUrl}${API_CONFIG.endpoints.upload}`,
      {
        method: 'POST',
        body: formData,
      },
      60000
    );
  }

  /**
   * 分类题目
   */
  async classify(request: ClassifyRequest): Promise<ApiResponse<ClassifyResponse>> {
    return this.fetchWithTimeout<ApiResponse<ClassifyResponse>>(
      `${this.baseUrl}${API_CONFIG.endpoints.classify}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      60000 // LLM 可能需要更长时间
    );
  }

  /**
   * 分析题目
   */
  async analyze(request: AnalyzeRequest): Promise<ApiResponse<AnalyzeResponse>> {
    return this.fetchWithTimeout<ApiResponse<AnalyzeResponse>>(
      `${this.baseUrl}${API_CONFIG.endpoints.analyze}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      90000 // 分析可能需要更长时间
    );
  }

  /**
   * 完整分析流程（上传 -> 分类 -> 分析）
   */
  async fullAnalysis(imageUri: string, hints?: string[]): Promise<{
    success: boolean;
    imageId?: string;
    imageUrl?: string;
    classification?: ClassifyResponse;
    analysis?: AnalyzeResponse;
    error?: string;
  }> {
    try {
      // 1. 上传图片
      const uploadResult = await this.uploadImage(imageUri);
      if (!uploadResult.success) {
        return {
          success: false,
          error: (uploadResult as ApiError).error || '上传失败',
        };
      }

      const { imageId, url } = uploadResult.data;

      // 2. 分类
      const classifyResult = await this.classify({ imageId });
      if (!('success' in classifyResult) || !classifyResult.success) {
        return {
          success: false,
          imageId,
          imageUrl: url,
          error: ('error' in classifyResult ? classifyResult.error : '分类失败') || '分类失败',
        };
      }

      // 3. 分析
      const analyzeResult = await this.analyze({ imageId, hints });
      if (!('success' in analyzeResult) || !analyzeResult.success) {
        return {
          success: false,
          imageId,
          imageUrl: url,
          classification: classifyResult,
          error: ('error' in analyzeResult ? analyzeResult.error : '分析失败') || '分析失败',
        };
      }

      return {
        success: true,
        imageId,
        imageUrl: url,
        classification: classifyResult,
        analysis: analyzeResult,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
}

// 导出单例
export const apiService = new ApiService();

// 导出类以便测试
export { ApiService };
