/**
 * Analyze Route - 题目分析路由
 */

import type { FastifyInstance } from 'fastify';
import type { AnalyzeRequest, AnalyzeResponse } from '@kao-gong/shared';
import { AnalyzeRequestSchema, AnalyzeResultSchema } from '@kao-gong/shared';
import type { AnalyzerService, ClassifierService } from '../services';
import { validateAnalyzeInput } from '../services/analyzer.service';

interface AnalyzeRouteConfig {
  classifierService: ClassifierService;
  analyzerService: AnalyzerService;
  baseUrl: string;
}

export async function analyzeRoute(
  fastify: FastifyInstance,
  config: AnalyzeRouteConfig
) {
  fastify.post<{ Body: AnalyzeRequest; Reply: AnalyzeResponse }>(
    '/api/analyze',
    async (request, reply) => {
      try {
        const body = request.body;

        // 验证请求
        const validation = AnalyzeRequestSchema.safeParse(body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            majorType: 'planar',
            subType: 'mixed_planar',
            confidence: 0,
            animationSupported: false,
            explanation: '',
            ruleSummary: { name: '', description: '' },
            animationPlan: { sceneType: 'planar_single', steps: [] },
            error: `Invalid request: ${validation.error.message}`,
          });
        }

        const { imageId, imageUrl, hints } = validation.data;

        // 构建输入
        const input = {
          imageUrl: imageUrl || (imageId ? `${config.baseUrl}/uploads/${imageId}.png` : undefined),
          hints,
        };

        // 验证输入
        const inputValidation = validateAnalyzeInput(input);
        if (!inputValidation.valid) {
          return reply.status(400).send({
            success: false,
            majorType: 'planar',
            subType: 'mixed_planar',
            confidence: 0,
            animationSupported: false,
            explanation: '',
            ruleSummary: { name: '', description: '' },
            animationPlan: { sceneType: 'planar_single', steps: [] },
            error: inputValidation.error,
          });
        }

        // 先进行分类
        const classification = await config.classifierService.classify(input);

        // 根据分类结果进行分析
        const result = await config.analyzerService.analyze(input, classification);

        // 添加提示信息到结果
        if (hints && hints.length > 0) {
          result.ruleSummary.details = [
            ...(result.ruleSummary.details ?? []),
            `用户提示: ${hints.join(', ')}`,
          ];
        }

        // 验证输出
        const outputValidation = AnalyzeResultSchema.safeParse(result);
        if (!outputValidation.success) {
          console.error('Analyze result validation failed:', outputValidation.error);
          // 仍然返回结果，但记录警告
        }

        return reply.send(result);
      } catch (error) {
        console.error('Analyze error:', error);
        return reply.status(500).send({
          success: false,
          majorType: 'planar',
          subType: 'mixed_planar',
          confidence: 0,
          animationSupported: false,
          explanation: '',
          ruleSummary: { name: '', description: '' },
          animationPlan: { sceneType: 'planar_single', steps: [] },
          error: error instanceof Error ? error.message : 'Analysis failed',
        });
      }
    }
  );
}
