
  /**
   * Classify Route - 题型分类路由
   */

  import type { FastifyInstance } from 'fastify';
  import type { ClassifyRequest, ClassifyResponse } from '../shared';
  import { ClassifyRequestSchema, ClassificationResultSchema } from '../shared';
  import type { ClassifierService } from '../services/classifier.service';
  import { validateClassifyInput } from '../services/classifier.service';
  import fs from 'fs';
  import path from 'path';

  interface ClassifyRouteConfig {
    classifierService: ClassifierService;
    baseUrl: string;
    uploadDir?: string;
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
              error: `Invalid request: ${validation.error?.message || 'Unknown error'}`,
            });
          }

          const { imageId, imageUrl } = validation.data;

          // 构建输入 - 使用 Base64 而不是 URL
          let input: { imageUrl?: string; imageBase64?: string } = {};

          if (imageUrl) {
            // 如果提供了外部 URL，直接使用
            console.log(`[Classify] Using external URL: ${imageUrl.substring(0, 100)}...`);
            input.imageUrl = imageUrl;
          } else if (imageId && config.uploadDir) {
            // 如果提供了 imageId，读取本地文件并转为 Base64
            console.log(`[Classify] Looking for image with ID: ${imageId}`);
            console.log(`[Classify] Upload directory: ${config.uploadDir}`);

            const files = fs.readdirSync(config.uploadDir);
            console.log(`[Classify] Files in directory: ${files.length}`);

            const targetFile = files.find(f => f.startsWith(imageId));

            if (targetFile) {
              const filePath = path.join(config.uploadDir, targetFile);
              console.log(`[Classify] Found file: ${filePath}`);

              const fileBuffer = fs.readFileSync(filePath);
              const base64 = fileBuffer.toString('base64');
              console.log(`[Classify] Base64 length: ${base64.length}`);

              input.imageBase64 = base64;
            } else {
              console.error(`[Classify] Image not found for ID: ${imageId}`);
              return reply.status(400).send({
                success: false,
                majorType: 'planar',
                subTypeCandidates: ['mixed_planar'],
                confidence: 0,
                reasoningBrief: '',
                error: 'Image not found',
              });
            }
          } else {
            console.error(`[Classify] No imageId or imageUrl provided. imageId: ${imageId}, uploadDir: ${config.uploadDir}`);
          }

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
