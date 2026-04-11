/**
 * History Store - 历史记录状态
 */

import { create } from 'zustand';
import type { HistoryItem } from '@kao-gong/shared';
import { STORAGE_KEYS, MAX_HISTORY_ITEMS } from '../constants';

interface HistoryState {
  items: HistoryItem[];
  isLoading: boolean;

  // Actions
  addItem: (item: HistoryItem) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  load: () => void;
  save: () => void;
}

// 简单的存储模拟
let storage: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
} | null = null;

try {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV();
} catch {
  const memoryStorage: Record<string, string> = {};
  storage = {
    getString: (key: string) => memoryStorage[key],
    set: (key: string, value: string) => {
      memoryStorage[key] = value;
    },
  };
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  isLoading: false,

  addItem: (item: HistoryItem) => {
    const { items } = get();
    // 添加到开头，限制最大数量
    const newItems = [item, ...items.filter(i => i.id !== item.id)].slice(0, MAX_HISTORY_ITEMS);
    set({ items: newItems });
    get().save();
  },

  removeItem: (id: string) => {
    const { items } = get();
    const newItems = items.filter(i => i.id !== id);
    set({ items: newItems });
    get().save();
  },

  clearAll: () => {
    set({ items: [] });
    get().save();
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  load: () => {
    try {
      const savedHistory = storage?.getString(STORAGE_KEYS.history);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        set({ items: parsed });
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  },

  save: () => {
    try {
      const { items } = get();
      storage?.set(STORAGE_KEYS.history, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  },
}));

// 初始化时加载历史记录
useHistoryStore.getState().load();
