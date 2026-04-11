/**
 * Analysis Store - 分析状态
 */

import { create } from 'zustand';
import type { AnalyzeResult, ClassificationResult } from '@kao-gong/shared';

interface AnalysisState {
  // 状态
  isLoading: boolean;
  isClassifying: boolean;
  isAnalyzing: boolean;
  result: AnalyzeResult | null;
  classification: ClassificationResult | null;
  error: string | null;
  currentImageUri: string | null;
  currentImageId: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setClassifying: (classifying: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setResult: (result: AnalyzeResult | null) => void;
  setClassification: (classification: ClassificationResult | null) => void;
  setError: (error: string | null) => void;
  setCurrentImage: (uri: string | null, id?: string | null) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  // 初始状态
  isLoading: false,
  isClassifying: false,
  isAnalyzing: false,
  result: null,
  classification: null,
  error: null,
  currentImageUri: null,
  currentImageId: null,

  // Actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setClassifying: (classifying: boolean) => set({ isClassifying: classifying }),
  setAnalyzing: (analyzing: boolean) => set({ isAnalyzing: analyzing }),
  setResult: (result: AnalyzeResult | null) => set({ result }),
  setClassification: (classification: ClassificationResult | null) => set({ classification }),
  setError: (error: string | null) => set({ error }),
  setCurrentImage: (uri: string | null, id?: string | null) =>
    set({ currentImageUri: uri, currentImageId: id }),
  reset: () =>
    set({
      isLoading: false,
      isClassifying: false,
      isAnalyzing: false,
      result: null,
      classification: null,
      error: null,
      currentImageUri: null,
      currentImageId: null,
    }),
}));
