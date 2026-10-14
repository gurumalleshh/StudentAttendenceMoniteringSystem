export interface StorageAdapter {
  getItem<T>(key: string, defaultValue: T): Promise<T>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  exportAll(): Promise<string>;
  importAll(jsonData: string): Promise<boolean>;
  clear(): Promise<void>;
}
