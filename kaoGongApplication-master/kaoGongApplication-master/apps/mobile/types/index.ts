/**
 * 移动端类型定义
 */

import type { AnalyzeResult, HistoryItem, AppSettings } from '@kao-gong/shared';

// ============================================
// 导航类型
// ============================================

export type RootStackParamList = {
  Home: undefined;
  Upload: {
    imageUri?: string;
    imageBase64?: string;
  };
  Analysis: {
    imageId: string;
    imageUrl: string;
    result?: AnalyzeResult;
    isDemo?: boolean;
  };
  SemiAuto: {
    imageId: string;
    imageUrl: string;
    result: AnalyzeResult;
  };
  History: undefined;
  Settings: undefined;
  Demo: undefined;
};

// ============================================
// 状态类型
// ============================================

export interface AnalysisState {
  isLoading: boolean;
  result: AnalyzeResult | null;
  error: string | null;
  currentImageUri: string | null;
  currentImageId: string | null;
}

export interface HistoryState {
  items: HistoryItem[];
  isLoading: boolean;
}

export interface SettingsState extends AppSettings {
  setApiBaseUrl: (url: string) => void;
  setShowDebugInfo: (show: boolean) => void;
  setCurrentModel: (model: string) => void;
  setEnableDemoMode: (enable: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  reset: () => void;
}

// ============================================
// API 响应类型
// ============================================

export interface ApiError {
  success: false;
  error: string;
  timestamp: string;
}

export interface UploadResponse {
  success: true;
  data: {
    imageId: string;
    url: string;
    width: number;
    height: number;
    mimeType: string;
    size: number;
  };
  timestamp: string;
}

// ============================================
// 组件 Props 类型
// ============================================

export interface ImageUploaderProps {
  onImageSelected: (uri: string, base64?: string) => void;
  isLoading?: boolean;
}

export interface QuestionTypeBadgeProps {
  majorType: 'planar' | 'spatial';
  subType: string;
  confidence: number;
}

export interface RuleSummaryCardProps {
  name: string;
  description: string;
  details?: string[];
  keyElements?: string[];
}

export interface AnimationPlayerProps {
  animationPlan: import('@kao-gong/shared').AnimationPlan;
  imageUri?: string;
  autoPlay?: boolean;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
}

export interface StepNarrationPanelProps {
  narration: string;
  stepIndex: number;
  totalSteps: number;
  onNext?: () => void;
  onPrev?: () => void;
}

export interface SemiAutoNoticeProps {
  semiAutoConfig: import('@kao-gong/shared').SemiAutoConfig;
  onEnterSemiAuto?: () => void;
}

// ============================================
// Demo 数据类型
// ============================================

export interface DemoData {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  result: AnalyzeResult;
}
