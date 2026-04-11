 /**
   * Analyze Route - 题目分析路由
   */

  import type { FastifyInstance } from 'fastify';
  import type { AnalyzeRequest, AnalyzeResponse } from '../shared';
  import { AnalyzeRequestSchema, AnalyzeResultSchema } from '../shared';
  import type { AnalyzerService, ClassifierService } from '../services';
  import { validateAnalyzeInput } from '../services/analyzer.service';
  import fs from 'fs';
  import path from 'path';

  interface AnalyzeRouteConfig {
    classifierService: ClassifierService;
    analyzerService: AnalyzerService;
    baseUrl: string;
    uploadDir?: string;
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
              error: `Invalid request: ${validation.error?.message || 'Unknown error'}`,
            });
          }

          const { imageId, imageUrl, hints } = validation.data;

          // 构建输入 - 使用 Base64 而不是 URL
          let input: { imageUrl?: string; imageBase64?: string; hints?: string[] } = { hints };

          if (imageUrl) {
            // 如果提供了外部 URL，直接使用
            console.log(`[Analyze] Using external URL: ${imageUrl.substring(0, 100)}...`);
            input.imageUrl = imageUrl;
          } else if (imageId && config.uploadDir) {
            // 如果提供了 imageId，读取本地文件并转为 Base64
            console.log(`[Analyze] Looking for image with ID: ${imageId}`);
            console.log(`[Analyze] Upload directory: ${config.uploadDir}`);

            const files = fs.readdirSync(config.uploadDir);
            console.log(`[Analyze] Files in directory: ${files.length}`);

            const targetFile = files.find(f => f.startsWith(imageId));

            if (targetFile) {
              const filePath = path.join(config.uploadDir, targetFile);
              console.log(`[Analyze] Found file: ${filePath}`);

              const fileBuffer = fs.readFileSync(filePath);
              const base64 = fileBuffer.toString('base64');
              console.log(`[Analyze] Base64 length: ${base64.length}`);

              input.imageBase64 = base64;
            } else {
              console.error(`[Analyze] Image not found for ID: ${imageId}`);
              return reply.status(400).send({
                success: false,
                majorType: 'planar',
                subType: 'mixed_planar',
                confidence: 0,
                animationSupported: false,
                explanation: '',
                ruleSummary: { name: '', description: '' },
                animationPlan: { sceneType: 'planar_single', steps: [] },
                error: 'Image not found',
              });
            }
          } else {
            console.error(`[Analyze] No imageId or imageUrl provided. imageId: ${imageId}, uploadDir: ${config.uploadDir}`);
          }

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