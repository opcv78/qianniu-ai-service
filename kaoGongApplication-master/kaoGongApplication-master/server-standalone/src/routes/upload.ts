/**
 * Upload Route - 文件上传路由
 */

import type { FastifyInstance } from 'fastify';
import type { UploadResult } from '../shared';
import { handleUpload } from '../services/upload.service';

interface UploadRouteConfig {
  uploadDir: string;
  maxFileSize: number;
  baseUrl: string;
}

export async function uploadRoute(
  fastify: FastifyInstance,
  config: UploadRouteConfig
) {
  fastify.post('/api/upload', async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file uploaded',
          timestamp: new Date().toISOString(),
        });
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          success: false,
          error: `Invalid file type: ${data.mimetype}. Allowed: ${allowedTypes.join(', ')}`,
          timestamp: new Date().toISOString(),
        });
      }

      // 读取文件数据
      const buffer = await data.toBuffer();

      // 处理上传
      const result = await handleUpload(
        {
          filename: data.filename,
          mimetype: data.mimetype,
          data: buffer,
        },
        config
      );

      return reply.send({
        success: true,
        data: result as UploadResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Upload error:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
