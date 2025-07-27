// Frontend Offline-First Service for Restaurant Task Management
export interface OfflineTask {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'task' | 'user' | 'media';
  data: any;
  timestamp: number;
  synced: boolean;
  retries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingOperations: number;
  syncInProgress: boolean;
}

class OfflineService {
  private dbName = 'RestaurantTaskDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private syncQueue: OfflineTask[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.initDB();
    this.setupEventListeners();
    this.loadSyncQueue();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('category', 'category', { unique: false });
          taskStore.createIndex('day', 'day', { unique: false });
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }

        // Media files store
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('taskId', 'taskId', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('synced', 'synced', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  // Task Management
  async saveTasks(tasks: any[]): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');

    for (const task of tasks) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(task);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getTasks(filters?: { status?: string; category?: string; day?: string }): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();

      request.onsuccess = () => {
        let tasks = request.result;

        // Apply filters
        if (filters) {
          if (filters.status) {
            tasks = tasks.filter(task => task.status === filters.status);
          }
          if (filters.category) {
            tasks = tasks.filter(task => task.category === filters.category);
          }
          if (filters.day) {
            tasks = tasks.filter(task => task.day === filters.day);
          }
        }

        resolve(tasks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveTask(task: any): Promise<void> {
    // Save to local storage
    await this.saveTasks([task]);

    // Add to sync queue
    const operation: OfflineTask = {
      id: crypto.randomUUID(),
      action: task.id ? 'UPDATE' : 'CREATE',
      entity: 'task',
      data: task,
      timestamp: Date.now(),
      synced: false,
      retries: 0
    };

    await this.addToSyncQueue(operation);

    // Try immediate sync if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!this.db) return;

    // Remove from local storage
    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(taskId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    const operation: OfflineTask = {
      id: crypto.randomUUID(),
      action: 'DELETE',
      entity: 'task',
      data: { id: taskId },
      timestamp: Date.now(),
      synced: false,
      retries: 0
    };

    await this.addToSyncQueue(operation);

    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Media Management
  async saveMedia(file: File, taskId: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const mediaId = crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();

    const mediaData = {
      id: mediaId,
      taskId,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      data: arrayBuffer,
      uploadedAt: Date.now()
    };

    // Save to local storage
    const transaction = this.db.transaction(['media'], 'readwrite');
    const store = transaction.objectStore('media');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(mediaData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    const operation: OfflineTask = {
      id: crypto.randomUUID(),
      action: 'CREATE',
      entity: 'media',
      data: mediaData,
      timestamp: Date.now(),
      synced: false,
      retries: 0
    };

    await this.addToSyncQueue(operation);

    if (this.isOnline) {
      this.processSyncQueue();
    }

    return mediaId;
  }

  async getMedia(mediaId: string): Promise<any> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const request = store.get(mediaId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue Management
  private async addToSyncQueue(operation: OfflineTask): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    await new Promise<void>((resolve, reject) => {
      const request = store.put(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    this.syncQueue.push(operation);
    this.notifyListeners();
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(false)); // Get unsynced items

      request.onsuccess = () => {
        this.syncQueue = request.result;
        this.notifyListeners();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    const maxRetries = 3;
    // Import the config to get the correct API URL
    const { default: config } = await import('../config/environment');
    const backendUrl = config.API_BASE_URL;

    for (const operation of this.syncQueue.filter(op => !op.synced)) {
      try {
        let response: Response;

        switch (operation.entity) {
          case 'task':
            if (operation.action === 'CREATE') {
              response = await fetch(`${backendUrl}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(operation.data)
              });
            } else if (operation.action === 'UPDATE') {
              response = await fetch(`${backendUrl}/tasks/${operation.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(operation.data)
              });
            } else { // DELETE
              response = await fetch(`${backendUrl}/tasks/${operation.data.id}`, {
                method: 'DELETE'
              });
            }
            break;

          case 'media':
            const formData = new FormData();
            const blob = new Blob([operation.data.data], { type: operation.data.mimeType });
            formData.append('file', blob, operation.data.filename);
            formData.append('taskId', operation.data.taskId);

            const uploadUrl = operation.data.mimeType.startsWith('image/') 
              ? `${backendUrl}/upload/image` 
              : `${backendUrl}/upload/video`;

            response = await fetch(uploadUrl, {
              method: 'POST',
              body: formData
            });
            break;

          default:
            continue;
        }

        if (response.ok) {
          operation.synced = true;
          await this.updateSyncOperation(operation);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        console.error('Sync operation failed:', error);
        operation.retries++;

        if (operation.retries >= maxRetries) {
          console.error('Max retries reached for operation:', operation);
          // Could move to failed operations store
        }

        await this.updateSyncOperation(operation);
      }
    }

    this.syncInProgress = false;
    this.notifyListeners();
  }

  private async updateSyncOperation(operation: OfflineTask): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    await new Promise<void>((resolve, reject) => {
      const request = store.put(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Status and Listeners
  getSyncStatus(): SyncStatus {
    const pendingOperations = this.syncQueue.filter(op => !op.synced).length;
    const lastSync = this.syncQueue
      .filter(op => op.synced)
      .map(op => op.timestamp)
      .sort((a, b) => b - a)[0] || 0;

    return {
      isOnline: this.isOnline,
      lastSync,
      pendingOperations,
      syncInProgress: this.syncInProgress
    };
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const status = this.getSyncStatus();
    this.listeners.forEach(listener => listener(status));
  }

  // Force sync
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }

  // Clear all offline data (for logout/reset)
  async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    const stores = ['tasks', 'users', 'media', 'syncQueue', 'settings'];
    const transaction = this.db.transaction(stores, 'readwrite');

    for (const storeName of stores) {
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    this.syncQueue = [];
    this.notifyListeners();
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

// Hook for React components
import { useState, useEffect } from 'react';

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineService.getSyncStatus());

  useEffect(() => {
    const unsubscribe = offlineService.onStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  return {
    syncStatus,
    saveTask: offlineService.saveTask.bind(offlineService),
    getTasks: offlineService.getTasks.bind(offlineService),
    deleteTask: offlineService.deleteTask.bind(offlineService),
    saveMedia: offlineService.saveMedia.bind(offlineService),
    getMedia: offlineService.getMedia.bind(offlineService),
    forceSync: offlineService.forcSync.bind(offlineService),
    clearData: offlineService.clearOfflineData.bind(offlineService)
  };
}
