/**
 * Upload Service - 文件上传处理
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export interface UploadResult {
  imageId: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
  size: number;
}

export interface UploadConfig {
  uploadDir: string;
  maxFileSize: number;
  baseUrl: string;
}

/**
 * 确保上传目录存在
 */
export function ensureUploadDir(uploadDir: string): void {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

/**
 * 获取图片尺寸
 * 注意: 这是一个简化版本，实际应该使用图片处理库
 */
async function getImageDimensions(
  _filePath: string
): Promise<{ width: number; height: number }> {
  // TODO: 使用 sharp 或 jimp 获取实际图片尺寸
  // 目前返回默认值
  return { width: 300, height: 300 };
}

/**
 * 获取图片 MIME 类型
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  };
  return mimeTypes[ext] ?? 'application/octet-stream';
}

/**
 * 处理文件上传
 */
export async function handleUpload(
  file: {
    filename: string;
    mimetype: string;
    data: Buffer;
  },
  config: UploadConfig
): Promise<UploadResult> {
  const { uploadDir, maxFileSize, baseUrl } = config;

  // 检查文件大小
  if (file.data.length > maxFileSize) {
    throw new Error(`File size exceeds maximum allowed: ${maxFileSize} bytes`);
  }

  // 确保上传目录存在
  ensureUploadDir(uploadDir);

  // 生成唯一文件名
  const imageId = uuidv4();
  const ext = path.extname(file.filename) || '.png';
  const newFilename = `${imageId}${ext}`;
  const filePath = path.join(uploadDir, newFilename);

  // 保存文件
  await fs.promises.writeFile(filePath, file.data);

  // 获取图片信息
  const dimensions = await getImageDimensions(filePath);
  const mimeType = file.mimetype || getMimeType(file.filename);

  return {
    imageId,
    url: `${baseUrl}/uploads/${newFilename}`,
    width: dimensions.width,
    height: dimensions.height,
    mimeType,
    size: file.data.length,
  };
}

/**
 * 获取上传的文件
 */
export function getUploadedFile(
  imageId: string,
  uploadDir: string
): { exists: boolean; path: string } {
  // 查找匹配的文件
  const files = fs.readdirSync(uploadDir);
  const targetFile = files.find(f => f.startsWith(imageId));

  if (!targetFile) {
    return { exists: false, path: '' };
  }

  return { exists: true, path: path.join(uploadDir, targetFile) };
}

/**
 * 删除上传的文件
 */
export function deleteUploadedFile(imageId: string, uploadDir: string): boolean {
  const { exists, path: filePath } = getUploadedFile(imageId, uploadDir);

  if (!exists) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

/**
 * 列出所有上传的文件
 */
export function listUploadedFiles(uploadDir: string): Array<{
  imageId: string;
  filename: string;
  size: number;
  createdAt: Date;
}> {
  if (!fs.existsSync(uploadDir)) {
    return [];
  }

  const files = fs.readdirSync(uploadDir);

  return files
    .filter(f => !f.startsWith('.'))
    .map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      const imageId = path.basename(filename, path.extname(filename));

      return {
        imageId,
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
