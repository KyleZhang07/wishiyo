import { useState, useEffect, useCallback } from 'react';
import { 
  getDataFromStore, 
  storeData, 
  removeData 
} from '@/utils/indexedDB';

// Custom hook for using IndexedDB with React state
export function useIndexedDBStorage<T>(key: string, initialValue?: T) {
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial value from IndexedDB
  useEffect(() => {
    const loadValue = async () => {
      setLoading(true);
      try {
        const storedValue = await getDataFromStore(key);
        if (storedValue !== null) {
          setValue(storedValue);
        }
      } catch (err) {
        console.error('Error loading from IndexedDB:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading from IndexedDB'));
      } finally {
        setLoading(false);
      }
    };
    
    loadValue();
  }, [key]);

  // Update value in IndexedDB
  const updateValue = useCallback(async (newValue: T) => {
    setLoading(true);
    try {
      setValue(newValue);
      await storeData(key, newValue);
    } catch (err) {
      console.error('Error storing in IndexedDB:', err);
      setError(err instanceof Error ? err : new Error('Unknown error storing in IndexedDB'));
    } finally {
      setLoading(false);
    }
  }, [key]);

  // Remove value from IndexedDB
  const removeValue = useCallback(async () => {
    setLoading(true);
    try {
      setValue(undefined);
      await removeData(key);
    } catch (err) {
      console.error('Error removing from IndexedDB:', err);
      setError(err instanceof Error ? err : new Error('Unknown error removing from IndexedDB'));
    } finally {
      setLoading(false);
    }
  }, [key]);

  return {
    value,
    setValue: updateValue,
    removeValue,
    loading,
    error
  };
} 