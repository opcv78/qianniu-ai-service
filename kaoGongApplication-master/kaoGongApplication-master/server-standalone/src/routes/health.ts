/**
 * Health Route - 健康检查路由
 */

import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '../shared';

interface HealthRouteConfig {
  version: string;
  startTime: number;
}

export async function healthRoute(
  fastify: FastifyInstance,
  config: HealthRouteConfig
) {
  fastify.get<{ Reply: HealthResponse }>('/api/health', async (request, reply) => {
    const uptime = Math.floor((Date.now() - config.startTime) / 1000);

    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: config.version,
      uptime,
    });
  });

  // 根路径
  fastify.get('/', async (request, reply) => {
    return reply.send({
      name: '图推动态解析 API',
      version: config.version,
      status: 'running',
      endpoints: [
        'GET /api/health - 健康检查',
        'POST /api/upload - 上传图片',
        'POST /api/classify - 分类题目',
        'POST /api/analyze - 分析题目',
      ],
    });
  });
}
