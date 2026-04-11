import { create } from 'zustand';

interface HistoryItem {
  id: string;
  imageId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  majorType: 'planar' | 'spatial';
  subType: string;
  confidence: number;
  explanation: string;
  createdAt: string;
  analyzedAt: string;
}

interface AppState {
  // 分析状态
  isAnalyzing: boolean;
  selectedImage: string | null;
  analysisResult: any | null;
  analysisError: string | null;

  // 历史记录
  history: HistoryItem[];

  // 设置
  settings: {
    apiBaseUrl: string;
    showDebugInfo: boolean;
    demoMode: boolean;
  };

  // Actions
  setSelectedImage: (uri: string | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisResult: (result: any | null) => void;
  setAnalysisError: (error: string | null) => void;

  addToHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

// 简单的持久化存储
const storage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage?.setItem(key, value);
    } catch {
      // ignore
    }
  },
};

// 加载保存的历史记录
const savedHistory = storage.getItem('kao-gong-history');
const initialHistory: HistoryItem[] = savedHistory ? JSON.parse(savedHistory) : [];

// 加载保存的设置
const savedSettings = storage.getItem('kao-gong-settings');
const initialSettings = savedSettings
  ? JSON.parse(savedSettings)
  : {
      apiBaseUrl: 'http://localhost:3000',
      showDebugInfo: false,
      demoMode: true,
    };

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  isAnalyzing: false,
  selectedImage: null,
  analysisResult: null,
  analysisError: null,
  history: initialHistory,
  settings: initialSettings,

  // Actions
  setSelectedImage: (uri) => set({ selectedImage: uri }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setAnalysisError: (error) => set({ analysisError: error }),

  addToHistory: (item) => {
    const { history } = get();
    const newHistory = [item, ...history.filter(h => h.id !== item.id)].slice(0, 50);
    set({ history: newHistory });
    storage.setItem('kao-gong-history', JSON.stringify(newHistory));
  },

  removeFromHistory: (id) => {
    const { history } = get();
    const newHistory = history.filter(h => h.id !== id);
    set({ history: newHistory });
    storage.setItem('kao-gong-history', JSON.stringify(newHistory));
  },

  clearHistory: () => {
    set({ history: [] });
    storage.setItem('kao-gong-history', '[]');
  },

  updateSettings: (newSettings) => {
    const { settings } = get();
    const updated = { ...settings, ...newSettings };
    set({ settings: updated });
    storage.setItem('kao-gong-settings', JSON.stringify(updated));
  },
}));
