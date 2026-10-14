import { StorageAdapter } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';

export * from './StorageAdapter';
export * from './LocalStorageAdapter';

// Global singleton instance - can be swapped at runtime or bootstrap
let currentAdapter: StorageAdapter = new LocalStorageAdapter('attendtrack_v1_');

export const getStorageAdapter = (): StorageAdapter => currentAdapter;

export const setStorageAdapter = (adapter: StorageAdapter): void => {
  currentAdapter = adapter;
};
