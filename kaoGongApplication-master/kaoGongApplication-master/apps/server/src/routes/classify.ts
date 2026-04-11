/**
 * Classify Route - 题型分类路由
 */

import type { FastifyInstance } from 'fastify';
import type { ClassifyRequest, ClassifyResponse } from '@kao-gong/shared';
import { ClassifyRequestSchema, ClassificationResultSchema } from '@kao-gong/shared';
import type { ClassifierService } from '../services/classifier.service';
import { validateClassifyInput } from '../services/classifier.service';

interface ClassifyRouteConfig {
  classifierService: ClassifierService;
  baseUrl: string;
}

export async function classifyRoute(
  fastify: FastifyInstance,
  config: ClassifyRouteConfig
) {
  fastify.post<{ Body: ClassifyRequest; Reply: ClassifyResponse }>(
    '/api/classify',
    async (request, reply) => {
      try {
        const body = request.body;

        // 验证请求
        const validation = ClassifyRequestSchema.safeParse(body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            majorType: 'planar',
            subTypeCandidates: ['mixed_planar'],
            confidence: 0,
            reasoningBrief: '',
            error: `Invalid request: ${validation.error.message}`,
          });
        }

        const { imageId, imageUrl } = validation.data;

        // 构建输入
        const input = {
          imageUrl: imageUrl || (imageId ? `${config.baseUrl}/uploads/${imageId}.png` : undefined),
        };

        // 验证输入
        const inputValidation = validateClassifyInput(input);
        if (!inputValidation.valid) {
          return reply.status(400).send({
            success: false,
            majorType: 'planar',
            subTypeCandidates: ['mixed_planar'],
            confidence: 0,
            reasoningBrief: '',
            error: inputValidation.error,
          });
        }

        // 调用分类服务
        const result = await config.classifierService.classify(input);

        // 验证输出
        const outputValidation = ClassificationResultSchema.safeParse(result);
        if (!outputValidation.success) {
          console.error('Classification result validation failed:', outputValidation.error);
          // 仍然返回结果，但记录警告
        }

        return reply.send({
          success: true,
          ...result,
        });
      } catch (error) {
        console.error('Classify error:', error);
        return reply.status(500).send({
          success: false,
          majorType: 'planar',
          subTypeCandidates: ['mixed_planar'],
          confidence: 0,
          reasoningBrief: '',
          error: error instanceof Error ? error.message : 'Classification failed',
        });
      }
    }
  );
}
