import { StorageAdapter } from './StorageAdapter';

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'attendtrack_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }
      const raw = window.localStorage.getItem(this.getKey(key));
      if (raw === null || raw === undefined) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[LocalStorageAdapter] Failed to read key "${key}":`, error);
      return defaultValue;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      window.localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(`[LocalStorageAdapter] Failed to write key "${key}":`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      window.localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`[LocalStorageAdapter] Failed to remove key "${key}":`, error);
    }
  }

  async exportAll(): Promise<string> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return JSON.stringify({});
      }
      const dump: Record<string, unknown> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          const cleanKey = k.slice(this.prefix.length);
          const raw = window.localStorage.getItem(k);
          if (raw !== null) {
            try {
              dump[cleanKey] = JSON.parse(raw);
            } catch {
              dump[cleanKey] = raw;
            }
          }
        }
      }
      return JSON.stringify(dump, null, 2);
    } catch (error) {
      console.error('[LocalStorageAdapter] Export failed:', error);
      throw error;
    }
  }

  async importAll(jsonData: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const parsed = JSON.parse(jsonData);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON backup format');
      }

      // If backup is a full structured dump
      for (const [key, val] of Object.entries(parsed)) {
        window.localStorage.setItem(this.getKey(key), JSON.stringify(val));
      }
      return true;
    } catch (error) {
      console.error('[LocalStorageAdapter] Import failed:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch (error) {
      console.error('[LocalStorageAdapter] Clear failed:', error);
    }
  }
}
