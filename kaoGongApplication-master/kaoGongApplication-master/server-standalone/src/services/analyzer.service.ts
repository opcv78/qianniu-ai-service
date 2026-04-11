/**
 * Analyzer Service - 题目分析服务
 */

import type {
  VisionInput,
  AnalyzeResult,
  ClassificationResult,
  QuestionSubType,
  PlanarSubType,
  SpatialSubType,
} from '../shared';
import { isPlanarType, isSpatialType } from '../shared';
import type { GLMProvider } from '../providers/llm';

export interface AnalyzerService {
  analyze(input: VisionInput, classification: ClassificationResult): Promise<AnalyzeResult>;
  analyzePlanar(input: VisionInput, subType?: PlanarSubType): Promise<AnalyzeResult>;
  analyzeSpatial(input: VisionInput, subType?: SpatialSubType): Promise<AnalyzeResult>;
}

/**
 * 创建分析服务
 */
export function createAnalyzerService(llmProvider: GLMProvider): AnalyzerService {
  return {
    async analyze(
      input: VisionInput,
      classification: ClassificationResult
    ): Promise<AnalyzeResult> {
      try {
        const { majorType, subTypeCandidates } = classification;

        // 根据大类选择分析方法
        if (majorType === 'planar') {
          const subType = (subTypeCandidates[0] as PlanarSubType) ?? 'mixed_planar';
          return await this.analyzePlanar(input, subType);
        } else {
          const subType = (subTypeCandidates[0] as SpatialSubType) ?? 'mixed_spatial';
          return await this.analyzeSpatial(input, subType);
        }
      } catch (error) {
        console.error('Analysis error:', error);

        return {
          success: false,
          majorType: classification.majorType,
          subType: classification.subTypeCandidates[0] ?? 'mixed_planar',
          confidence: 0,
          animationSupported: false,
          explanation: '分析服务暂时不可用',
          ruleSummary: {
            name: '分析失败',
            description: '无法分析题目，请稍后重试',
          },
          animationPlan: {
            sceneType: 'planar_single',
            steps: [],
          },
          error: error instanceof Error ? error.message : '未知错误',
        };
      }
    },

    async analyzePlanar(input: VisionInput, subType?: PlanarSubType): Promise<AnalyzeResult> {
      try {
        const result = await llmProvider.analyzePlanar(input, subType);
        return result;
      } catch (error) {
        console.error('Planar analysis error:', error);

        return {
          success: false,
          majorType: 'planar',
          subType: subType ?? 'mixed_planar',
          confidence: 0,
          animationSupported: false,
          explanation: '平面类题目分析失败',
          ruleSummary: {
            name: '分析失败',
            description: '无法分析题目，请稍后重试',
          },
          animationPlan: {
            sceneType: 'planar_single',
            steps: [],
          },
          error: error instanceof Error ? error.message : '未知错误',
        };
      }
    },

    async analyzeSpatial(input: VisionInput, subType?: SpatialSubType): Promise<AnalyzeResult> {
      try {
        const result = await llmProvider.analyzeSpatial(input, subType);
        return result;
      } catch (error) {
        console.error('Spatial analysis error:', error);

        return {
          success: false,
          majorType: 'spatial',
          subType: subType ?? 'mixed_spatial',
          confidence: 0,
          animationSupported: false,
          explanation: '立体类题目分析失败',
          ruleSummary: {
            name: '分析失败',
            description: '无法分析题目，请稍后重试',
          },
          animationPlan: {
            sceneType: 'spatial_placeholder',
            steps: [],
          },
          semiAutoConfig: {
            enabled: true,
            mode: 'folding',
            requiredUserActions: [],
            helperText: '分析失败，建议进入半自动模式手动分析',
          },
          error: error instanceof Error ? error.message : '未知错误',
        };
      }
    },
  };
}

/**
 * 验证分析输入
 */
export function validateAnalyzeInput(input: VisionInput): { valid: boolean; error?: string } {
  if (!input.imageUrl && !input.imageBase64 && !input.localPath) {
    return { valid: false, error: '必须提供 imageUrl、imageBase64 或 localPath' };
  }

  return { valid: true };
}

/**
 * 判断是否支持动画
 */
export function checkAnimationSupport(subType: QuestionSubType): boolean {
  return isPlanarType(subType) && subType !== 'mixed_planar';
}

/**
 * 获取动画支持级别
 */
export function getAnimationSupportLevel(
  subType: QuestionSubType
): 'full' | 'partial' | 'none' {
  if (isSpatialType(subType)) {
    return 'none';
  }

  if (subType === 'mixed_planar') {
    return 'partial';
  }

  return 'full';
}
