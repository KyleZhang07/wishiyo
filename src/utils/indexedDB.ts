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
          console.log(`No data found for key ${key} in IndexedDB`);
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

// Store data in the store with transaction completion guarantee
export const storeData = async (key: string, data: any): Promise<boolean> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOVE_STORY_STORE], 'readwrite');
      const store = transaction.objectStore(LOVE_STORY_STORE);
      
      // Add the data with a timestamp to avoid cache issues
      const timestamp = new Date().getTime();
      const request = store.put({ 
        id: key, 
        data: data,
        timestamp: timestamp
      });

      // Handle individual request success
      request.onsuccess = () => {
        console.log(`Data with key ${key} queued for storage successfully`);
      };

      // Handle individual request error
      request.onerror = (event) => {
        console.error(`Error storing data with key ${key} in IndexedDB`, event);
        transaction.abort();
      };

      // Handle transaction completion - ensures data is actually written
      transaction.oncomplete = () => {
        console.log(`Transaction completed, data with key ${key} stored successfully`);
        resolve(true);
        db.close();
      };

      // Handle transaction abort or error
      transaction.onabort = (event) => {
        console.error('Transaction aborted', event);
        reject('Transaction aborted');
        db.close();
      };

      transaction.onerror = (event) => {
        console.error('Error in transaction', event);
        reject('Error in transaction');
        db.close();
      };
    });
  } catch (error) {
    console.error('Failed to store data in IndexedDB', error);
    return false;
  }
};

// Remove data from store with transaction completion guarantee
export const removeData = async (key: string): Promise<boolean> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([LOVE_STORY_STORE], 'readwrite');
      const store = transaction.objectStore(LOVE_STORY_STORE);
      const request = store.delete(key);

      // Handle individual request success
      request.onsuccess = () => {
        console.log(`Data with key ${key} queued for removal`);
      };

      // Handle individual request error
      request.onerror = (event) => {
        console.error(`Error removing data with key ${key} from IndexedDB`, event);
        transaction.abort();
      };

      // Handle transaction completion - ensures data is actually removed
      transaction.oncomplete = () => {
        console.log(`Transaction completed, data with key ${key} removed successfully`);
        resolve(true);
        db.close();
      };

      // Handle transaction abort or error
      transaction.onabort = (event) => {
        console.error('Transaction aborted', event);
        reject('Transaction aborted');
        db.close();
      };

      transaction.onerror = (event) => {
        console.error('Error in transaction', event);
        reject('Error in transaction');
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

      // Handle transaction completion
      transaction.oncomplete = () => {
        console.log('Store cleared successfully');
        resolve(true);
        db.close();
      };

      // Handle transaction errors
      transaction.onerror = (event) => {
        console.error('Error clearing store in IndexedDB', event);
        reject('Error clearing store in IndexedDB');
        db.close();
      };

      transaction.onabort = (event) => {
        console.error('Transaction aborted while clearing store', event);
        reject('Transaction aborted while clearing store');
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
    console.log(`Starting migration of ${keys.length} keys from localStorage to IndexedDB`);
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        // Store with timestamp to keep track of when it was migrated
        await storeData(key, {
          data: value,
          migratedAt: new Date().toISOString()
        });
        console.log(`Migrated ${key} from localStorage to IndexedDB`);
      }
    }
    console.log(`Migration completed for ${keys.length} keys`);
  } catch (error) {
    console.error('Error migrating data from localStorage to IndexedDB', error);
  }
};
