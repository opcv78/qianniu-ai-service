/**
 * Classifier Service - 题型分类服务
 */

import type { VisionInput, ClassificationResult } from '../shared';
import type { GLMProvider } from '../providers/llm';

export interface ClassifierService {
  classify(input: VisionInput): Promise<ClassificationResult>;
}

/**
 * 创建分类服务
 */
export function createClassifierService(llmProvider: GLMProvider): ClassifierService {
  return {
    async classify(input: VisionInput): Promise<ClassificationResult> {
      try {
        const result = await llmProvider.classifyQuestion(input);
        return result;
      } catch (error) {
        console.error('Classification error:', error);

        // 返回默认分类结果
        return {
          majorType: 'planar',
          subTypeCandidates: ['mixed_planar'],
          confidence: 0.3,
          reasoningBrief: '分类服务暂时不可用，默认分类为混合平面类',
        };
      }
    },
  };
}

/**
 * 验证输入是否有效
 */
export function validateClassifyInput(input: VisionInput): { valid: boolean; error?: string } {
  if (!input.imageUrl && !input.imageBase64 && !input.localPath) {
    return { valid: false, error: '必须提供 imageUrl、imageBase64 或 localPath' };
  }

  return { valid: true };
}
