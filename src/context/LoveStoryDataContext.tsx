import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getDataFromStore, 
  storeData, 
  removeData, 
  migrateFromLocalStorage 
} from '@/utils/indexedDB';

// Define the types for our love story data
interface LoveStoryData {
  // Text data
  authorName?: string;
  coverTitle?: string;
  subtitle?: string;
  backCoverText?: string;
  
  // Basic data
  generatedIdeas?: any[];
  selectedIdeaIndex?: number;
  imagePrompts?: any[];
  moments?: string[];
  questions?: any[];
  partnerPhoto?: string;
  recipientName?: string;
  style?: string;
  imageTexts?: { text: string; tone: string }[];
  
  // Image data (URLs or base64 strings)
  coverImage?: string;
  introImage?: string;
  contentImage1?: string;
  contentImage2?: string;
  contentImage3?: string;
  contentImage4?: string;
  contentImage5?: string;
  contentImage6?: string;
  contentImage7?: string;
  contentImage8?: string;
  contentImage9?: string;
  contentImage10?: string;
}

// Define localStorage keys that will be migrated
const LOCAL_STORAGE_TEXT_KEYS = [
  'loveStoryAuthorName',
  'loveStoryGeneratedIdeas',
  'loveStorySelectedIdea',
  'loveStoryMoments',
  'loveStoryImagePrompts',
  'loveStoryQuestions',
  'loveStoryCharacterPhoto',
  'loveStoryRecipientName',
  'loveStoryStyle',
  'loveStoryImageTexts'
];

const LOCAL_STORAGE_IMAGE_KEYS = [
  'loveStoryCoverImage',
  'loveStoryIntroImage',
  'loveStoryContentImage1',
  'loveStoryContentImage2',
  'loveStoryContentImage3',
  'loveStoryContentImage4',
  'loveStoryContentImage5',
  'loveStoryContentImage6',
  'loveStoryContentImage7',
  'loveStoryContentImage8',
  'loveStoryContentImage9',
  'loveStoryContentImage10'
];

// Context interface
interface LoveStoryContextType {
  data: LoveStoryData;
  loading: boolean;
  saveData: (key: string, value: any) => Promise<void>;
  getData: (key: string) => any;
  removeData: (key: string) => Promise<void>;
  clearAllData: () => Promise<void>;
}

// Create context
const LoveStoryContext = createContext<LoveStoryContextType | undefined>(undefined);

// Provider component
export const LoveStoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<LoveStoryData>({});
  const [loading, setLoading] = useState(true);
  const [migratedToIndexedDB, setMigratedToIndexedDB] = useState(false);

  // Function to migrate all data from localStorage to IndexedDB
  const migrateToIndexedDB = async () => {
    try {
      await migrateFromLocalStorage([...LOCAL_STORAGE_TEXT_KEYS, ...LOCAL_STORAGE_IMAGE_KEYS]);
      setMigratedToIndexedDB(true);
      console.log('Successfully migrated all love story data to IndexedDB');
    } catch (error) {
      console.error('Failed to migrate data to IndexedDB:', error);
    }
  };

  // Load all data from IndexedDB and localStorage
  useEffect(() => {
    // First, attempt to migrate data if not already done
    if (!migratedToIndexedDB) {
      migrateToIndexedDB();
      return;
    }

    const loadAllData = async () => {
      setLoading(true);
      const newData: LoveStoryData = {};

      try {
        // Load text data
        if (localStorage.getItem('loveStoryAuthorName')) {
          newData.authorName = localStorage.getItem('loveStoryAuthorName') || undefined;
        }
        
        // Try to parse JSON data from localStorage
        for (const key of ['loveStoryGeneratedIdeas', 'loveStoryImagePrompts', 'loveStoryMoments', 'loveStoryImageTexts', 'loveStoryQuestions']) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsedItem = JSON.parse(item);
              switch (key) {
                case 'loveStoryGeneratedIdeas':
                  newData.generatedIdeas = parsedItem;
                  break;
                case 'loveStoryImagePrompts':
                  newData.imagePrompts = parsedItem;
                  break;
                case 'loveStoryMoments':
                  newData.moments = parsedItem;
                  break;
                case 'loveStoryImageTexts':
                  newData.imageTexts = parsedItem;
                  break;
                case 'loveStoryQuestions':
                  newData.questions = parsedItem;
                  break;
              }
            }
          } catch (error) {
            console.error(`Error parsing ${key} from localStorage:`, error);
          }
        }

        // Load simple text data
        newData.selectedIdeaIndex = localStorage.getItem('loveStorySelectedIdea') ? 
          parseInt(localStorage.getItem('loveStorySelectedIdea')!) : undefined;
        newData.partnerPhoto = localStorage.getItem('loveStoryCharacterPhoto') || undefined;
        newData.recipientName = localStorage.getItem('loveStoryRecipientName') || undefined;
        newData.style = localStorage.getItem('loveStoryStyle') || undefined;

        // Load image data from IndexedDB
        for (const key of LOCAL_STORAGE_IMAGE_KEYS) {
          try {
            const value = await getDataFromStore(key);
            if (value) {
              switch (key) {
                case 'loveStoryCoverImage':
                  newData.coverImage = value;
                  break;
                case 'loveStoryIntroImage':
                  newData.introImage = value;
                  break;
                case 'loveStoryContentImage1':
                  newData.contentImage1 = value;
                  break;
                case 'loveStoryContentImage2':
                  newData.contentImage2 = value;
                  break;
                case 'loveStoryContentImage3':
                  newData.contentImage3 = value;
                  break;
                case 'loveStoryContentImage4':
                  newData.contentImage4 = value;
                  break;
                case 'loveStoryContentImage5':
                  newData.contentImage5 = value;
                  break;
                case 'loveStoryContentImage6':
                  newData.contentImage6 = value;
                  break;
                case 'loveStoryContentImage7':
                  newData.contentImage7 = value;
                  break;
                case 'loveStoryContentImage8':
                  newData.contentImage8 = value;
                  break;
                case 'loveStoryContentImage9':
                  newData.contentImage9 = value;
                  break;
                case 'loveStoryContentImage10':
                  newData.contentImage10 = value;
                  break;
              }
            }
          } catch (error) {
            console.error(`Error loading ${key} from IndexedDB:`, error);
          }
        }

        // Populate cover title and subtitle if available
        if (newData.generatedIdeas && newData.selectedIdeaIndex !== undefined) {
          const selectedIdea = newData.generatedIdeas[newData.selectedIdeaIndex];
          if (selectedIdea) {
            newData.coverTitle = selectedIdea.title || '';
            newData.subtitle = selectedIdea.description || '';
          }
        }

        // Format back cover text if moments are available
        if (newData.moments && newData.moments.length > 0) {
          newData.backCoverText = newData.moments
            .map((moment: string) => `"${moment}"`)
            .join('\n\n');
        }

        setData(newData);
      } catch (error) {
        console.error('Error loading love story data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [migratedToIndexedDB]);

  // Save data to both IndexedDB and localStorage depending on the key
  const saveData = async (key: string, value: any) => {
    try {
      // Update local state
      setData(prevData => ({
        ...prevData,
        [key]: value
      }));

      // Determine if this is image data
      if (LOCAL_STORAGE_IMAGE_KEYS.includes(key)) {
        // Store image data in IndexedDB
        await storeData(key, value);
      } else {
        // Store text data in localStorage
        if (typeof value === 'object') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, String(value));
        }
      }
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  // Get data from context
  const getData = (key: string) => {
    return data[key as keyof LoveStoryData];
  };

  // Remove a specific piece of data
  const removeSpecificData = async (key: string) => {
    try {
      // Update local state
      const newData = { ...data };
      delete newData[key as keyof LoveStoryData];
      setData(newData);

      // Remove from storage
      if (LOCAL_STORAGE_IMAGE_KEYS.includes(key)) {
        await removeData(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  };

  // Clear all data
  const clearAllData = async () => {
    try {
      setLoading(true);
      
      // Clear all localStorage keys
      for (const key of [...LOCAL_STORAGE_TEXT_KEYS]) {
        localStorage.removeItem(key);
      }
      
      // Clear all IndexedDB keys
      for (const key of [...LOCAL_STORAGE_IMAGE_KEYS]) {
        await removeData(key);
      }
      
      // Reset state
      setData({});
    } catch (error) {
      console.error('Error clearing all data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoveStoryContext.Provider value={{
      data,
      loading,
      saveData,
      getData,
      removeData: removeSpecificData,
      clearAllData
    }}>
      {children}
    </LoveStoryContext.Provider>
  );
};

// Hook to use the love story context
export const useLoveStoryData = () => {
  const context = useContext(LoveStoryContext);
  if (context === undefined) {
    throw new Error('useLoveStoryData must be used within a LoveStoryProvider');
  }
  return context;
}; 