/**
 * Settings Store - 应用设置状态
 */

import { create } from 'zustand';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';
import type { AppSettings } from '@kao-gong/shared';

interface SettingsState extends AppSettings {
  setApiBaseUrl: (url: string) => void;
  setShowDebugInfo: (show: boolean) => void;
  setCurrentModel: (model: string) => void;
  setEnableDemoMode: (enable: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  reset: () => void;
  load: () => void;
  save: () => void;
}

// 简单的 MMKV 存储模拟（实际使用时需要初始化 MMKV）
let storage: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
} | null = null;

// 尝试初始化存储
try {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV();
} catch {
  // 如果 MMKV 不可用，使用内存存储
  const memoryStorage: Record<string, string> = {};
  storage = {
    getString: (key: string) => memoryStorage[key],
    set: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // 默认值
  ...DEFAULT_SETTINGS,

  // Actions
  setApiBaseUrl: (url: string) => {
    set({ apiBaseUrl: url });
    get().save();
  },

  setShowDebugInfo: (show: boolean) => {
    set({ showDebugInfo: show });
    get().save();
  },

  setCurrentModel: (model: string) => {
    set({ currentModel: model });
    get().save();
  },

  setEnableDemoMode: (enable: boolean) => {
    set({ enableDemoMode: enable });
    get().save();
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
    get().save();
  },

  reset: () => {
    set(DEFAULT_SETTINGS);
    get().save();
  },

  load: () => {
    try {
      const savedSettings = storage?.getString(STORAGE_KEYS.settings);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        set({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  save: () => {
    try {
      const state = get();
      const toSave: AppSettings = {
        apiBaseUrl: state.apiBaseUrl,
        showDebugInfo: state.showDebugInfo,
        currentModel: state.currentModel,
        enableDemoMode: state.enableDemoMode,
        theme: state.theme,
      };
      storage?.set(STORAGE_KEYS.settings, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
}));

// 初始化时加载设置
useSettingsStore.getState().load();
