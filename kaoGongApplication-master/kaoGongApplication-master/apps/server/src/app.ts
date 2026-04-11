/**
 * Fastify Application
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import path from 'path';
import 'dotenv/config';

import { createGLMProvider } from './providers/llm';
import { createClassifierService, createAnalyzerService } from './services';
import { uploadRoute, classifyRoute, analyzeRoute, healthRoute } from './routes';

// 配置
const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? './uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10), // 10MB
  glmApiKey: process.env.GLM_API_KEY ?? '',
  glmBaseUrl: process.env.GLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
  glmModel: process.env.GLM_MODEL ?? 'glm-4v-flash',
};

// 创建 Fastify 实例
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// 启动时间
const startTime = Date.now();

// 基础 URL
const baseUrl = `http://${config.host}:${config.port}`;

async function main() {
  // 注册插件
  await fastify.register(cors, {
    origin: true, // 开发环境允许所有来源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: config.maxFileSize,
    },
  });

  // 静态文件服务 (上传的文件)
  await fastify.register(staticPlugin, {
    root: config.uploadDir,
    prefix: '/uploads/',
  });

  // 创建 LLM Provider
  const llmProvider = createGLMProvider({
    apiKey: config.glmApiKey,
    baseUrl: config.glmBaseUrl,
    model: config.glmModel,
    timeout: 60000,
    maxRetries: 2,
  });

  // 创建服务
  const classifierService = createClassifierService(llmProvider);
  const analyzerService = createAnalyzerService(llmProvider);

  // 注册路由
  await fastify.register(uploadRoute, {
    uploadDir: config.uploadDir,
    maxFileSize: config.maxFileSize,
    baseUrl,
  });

  await fastify.register(classifyRoute, {
    classifierService,
    baseUrl,
  });

  await fastify.register(analyzeRoute, {
    classifierService,
    analyzerService,
    baseUrl,
  });

  await fastify.register(healthRoute, {
    version: '1.0.0',
    startTime,
  });

  // 错误处理
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode ?? 500;

    reply.status(statusCode).send({
      success: false,
      error: error.message ?? 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  });

  // 启动服务器
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`
╔════════════════════════════════════════════╗
║  图推动态解析 API 服务已启动
║  地址: ${baseUrl}
║  环境: ${process.env.NODE_ENV ?? 'development'}
║  模型: ${config.glmModel}
╚════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n正在关闭服务器...');
  await fastify.close();
  process.exit(0);
});

main();
