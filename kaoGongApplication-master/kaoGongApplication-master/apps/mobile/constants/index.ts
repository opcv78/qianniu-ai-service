/**
 * Constants - 统一导出
 */

// API 配置
export const API_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  endpoints: {
    health: '/api/health',
    upload: '/api/upload',
    classify: '/api/classify',
    analyze: '/api/analyze',
  },
};

export * from './demo';
