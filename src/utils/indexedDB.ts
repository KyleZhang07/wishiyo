// IndexedDB utilities for storing large data like images

// Database configuration
const DB_NAME = 'wishiyoApp';
const DB_VERSION = 1;
const LOVE_STORY_STORE = 'loveStoryData';

// Open database connection
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB', event);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for love story data if it doesn't exist
      if (!db.objectStoreNames.contains(LOVE_STORY_STORE)) {
        db.createObjectStore(LOVE_STORY_STORE, { keyPath: 'id' });
      }
    };
  });
};

// Get data from store
export const getDataFromStore = async (key: string): Promise<any> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOVE_STORY_STORE], 'readonly');
      const store = transaction.objectStore(LOVE_STORY_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
        db.close();
      };

      request.onerror = (event) => {
        console.error('Error getting data from IndexedDB', event);
        reject('Error getting data from IndexedDB');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get data from IndexedDB', error);
    return null;
  }
};

// Store data in the store
export const storeData = async (key: string, data: any): Promise<boolean> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOVE_STORY_STORE], 'readwrite');
      const store = transaction.objectStore(LOVE_STORY_STORE);
      const request = store.put({ id: key, data: data });

      request.onsuccess = () => {
        console.log(`Data with key ${key} stored successfully`);
        resolve(true);
        db.close();
      };

      request.onerror = (event) => {
        console.error('Error storing data in IndexedDB', event);
        reject('Error storing data in IndexedDB');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to store data in IndexedDB', error);
    return false;
  }
};

// Remove data from store
export const removeData = async (key: string): Promise<boolean> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOVE_STORY_STORE], 'readwrite');
      const store = transaction.objectStore(LOVE_STORY_STORE);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`Data with key ${key} removed successfully`);
        resolve(true);
        db.close();
      };

      request.onerror = (event) => {
        console.error('Error removing data from IndexedDB', event);
        reject('Error removing data from IndexedDB');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to remove data from IndexedDB', error);
    return false;
  }
};

// Get all keys from the store
export const getAllKeys = async (): Promise<string[]> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOVE_STORY_STORE], 'readonly');
      const store = transaction.objectStore(LOVE_STORY_STORE);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
        db.close();
      };

      request.onerror = (event) => {
        console.error('Error getting all keys from IndexedDB', event);
        reject('Error getting all keys from IndexedDB');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get all keys from IndexedDB', error);
    return [];
  }
};

// Clear entire store
export const clearStore = async (): Promise<boolean> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOVE_STORY_STORE], 'readwrite');
      const store = transaction.objectStore(LOVE_STORY_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Store cleared successfully');
        resolve(true);
        db.close();
      };

      request.onerror = (event) => {
        console.error('Error clearing store in IndexedDB', event);
        reject('Error clearing store in IndexedDB');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to clear store in IndexedDB', error);
    return false;
  }
};

// Helper to migrate data from localStorage to IndexedDB
export const migrateFromLocalStorage = async (keys: string[]): Promise<void> => {
  try {
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        await storeData(key, value);
        console.log(`Migrated ${key} from localStorage to IndexedDB`);
      }
    }
  } catch (error) {
    console.error('Error migrating data from localStorage to IndexedDB', error);
  }
}; 