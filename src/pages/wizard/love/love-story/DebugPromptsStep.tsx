import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { useToast } from '@/hooks/use-toast';
import { getDataFromStore, getAllKeys } from '@/utils/indexedDB';

// 定义爱情故事图像键
const LOVE_STORY_IMAGE_KEYS = [
  'loveStoryCoverImage',
  'loveStoryIntroImage',
  'loveStoryCharacterPhoto',
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

// General Keys that might contain image data
const GENERAL_IMAGE_KEYS = [
  'profilePhoto',
  'characterPhoto',
  'backgroundImage',
  'avatarImage',
  // Add any other potential image keys here
];

interface ImagePrompt {
  question: string;
  prompt: string;
}

interface ImageText {
  text: string;
  tone: string;
}

interface StoredImage {
  key: string;
  data: string;
  source: 'localStorage' | 'IndexedDB';
  size: string;
}

const DebugPromptsStep = () => {
  const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
  const [texts, setTexts] = useState<ImageText[]>([]);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<StoredImage[]>([]);
  const { toast } = useToast();

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Function to check if a string is likely an image (base64 or URL)
  const isLikelyImage = (str: string): boolean => {
    return (
      (typeof str === 'string' && 
       (str.startsWith('data:image') || 
        str.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) !== null))
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load prompts
        const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
        if (savedPrompts) {
          try {
            setPrompts(JSON.parse(savedPrompts));
          } catch (error) {
            console.error('Error parsing prompts:', error);
          }
        }
        
        // Load text accompaniments
        const savedTexts = localStorage.getItem('loveStoryImageTexts');
        if (savedTexts) {
          try {
            setTexts(JSON.parse(savedTexts));
          } catch (error) {
            console.error('Error parsing texts:', error);
          }
        }
        
        // Load selected tone and style
        const savedTone = localStorage.getItem('loveStoryTone');
        if (savedTone) {
          setSelectedTone(savedTone);
        }
        
        const savedStyle = localStorage.getItem('loveStoryStyle');
        if (savedStyle) {
          setSelectedStyle(savedStyle);
        }

        // Load character photo from IndexedDB with localStorage fallback
        try {
          const characterPhotoFromIDB = await getDataFromStore('loveStoryCharacterPhoto');
          if (characterPhotoFromIDB) {
            setCharacterPhoto(characterPhotoFromIDB);
          } else {
            const characterPhotoFromLS = localStorage.getItem('loveStoryCharacterPhoto');
            if (characterPhotoFromLS) {
              setCharacterPhoto(characterPhotoFromLS);
            }
          }
        } catch (error) {
          console.error('Error loading character photo from IndexedDB:', error);
          // Fallback to localStorage
          const characterPhotoFromLS = localStorage.getItem('loveStoryCharacterPhoto');
          if (characterPhotoFromLS) {
            setCharacterPhoto(characterPhotoFromLS);
          }
        }

        // Load all images from IndexedDB and localStorage
        const allFoundImages: StoredImage[] = [];
        
        // ===== 1. Check localStorage for images =====
        const searchLocalStorage = () => {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              try {
                const value = localStorage.getItem(key);
                if (value && isLikelyImage(value)) {
                  allFoundImages.push({
                    key,
                    data: value,
                    source: 'localStorage',
                    size: formatFileSize(value.length)
                  });
                }
              } catch (error) {
                console.error(`Error reading localStorage item ${key}:`, error);
              }
            }
          }
        };
        
        searchLocalStorage();
        
        // ===== 2. Check IndexedDB for images =====
        try {
          // Get all keys from IndexedDB
          const idbKeys = await getAllKeys();
          
          // Check each key in IndexedDB
          for (const key of idbKeys) {
            try {
              const data = await getDataFromStore(key);
              if (data && typeof data === 'string' && isLikelyImage(data)) {
                allFoundImages.push({
                  key,
                  data,
                  source: 'IndexedDB',
                  size: formatFileSize(data.length)
                });
              }
            } catch (error) {
              console.error(`Error loading ${key} from IndexedDB:`, error);
            }
          }
        } catch (error) {
          console.error('Error accessing IndexedDB:', error);
        }
        
        setAllImages(allFoundImages);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "There was a problem loading your story data."
        });
      }
    };

    loadData();
  }, [toast]);

  return (
    <WizardStep
      title="[DEV] Debug Photos and Storage"
      description="Development view to display photos from localStorage and IndexedDB"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/moments"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-8 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="text-yellow-800 font-bold">⚠️ Development Only</h2>
          <p className="text-yellow-700">This page is for development purposes and will be removed in production.</p>
        </div>
        
        {/* All Images Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📸 All Photos Found ({allImages.length})</h2>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700">Displaying all images found in both localStorage and IndexedDB.</p>
          </div>

          {allImages.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No images found in storage</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allImages.map((image, index) => (
                <div key={index} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    <img 
                      src={image.data} 
                      alt={`Image ${index+1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fall back to a placeholder if image fails to load
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlLW9mZiI+PHBhdGggZD0iTTEzLjQyIDIuMDAxQTEwLjkgMTAuOSAwIDEgMSAxMi41IDIxLjQ5MmE4LjM2IDguMzYgMCAwIDEtLjkxOS0xNi42MzRjNS43NS40NDUgMTAuNy01Ljk1MiA1LjE0OS0xMS4zNzdjLTEuMzktMS4zNTItMy4yMDctMi4wNDQtNS4xNDktMi4wMjN2LjA3NyIvPjwvc3ZnPg==';
                      }}
                    />
                    <div className={`absolute top-0 right-0 m-2 px-2 py-1 text-xs font-semibold rounded ${
                      image.source === 'IndexedDB' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {image.source}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 truncate" title={image.key}>{image.key}</h3>
                    <p className="text-sm text-gray-600">Size: {image.size}</p>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Show data URI (first 100 chars)
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded overflow-hidden">
                          <div className="font-mono text-gray-700 break-all">
                            {image.data.substring(0, 100)}...
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Selected tone and style */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-800 mb-2">Selected Settings:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 font-semibold">Text Tone:</p>
              <p className="text-gray-800">{selectedTone || 'Not selected'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Image Style:</p>
              <p className="text-gray-800">{selectedStyle || 'Not selected'}</p>
            </div>
          </div>
        </div>

        {/* Display character photo if available */}
        {characterPhoto && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-2">Character Photo:</h3>
            <div className="w-32 h-32 mx-auto">
              <img src={characterPhoto} alt="Character" className="object-cover rounded-lg" />
            </div>
            <p className="text-center text-gray-600 text-sm mt-2">Stored in {characterPhoto.length > 100000 ? 'IndexedDB' : 'localStorage'}</p>
          </div>
        )}
        
        {/* Storage info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Storage Information:</h3>
          <p className="text-blue-700">
            This application uses both localStorage and IndexedDB for data storage.
            Larger files (like images) are stored in IndexedDB, while smaller data
            is kept in localStorage.
          </p>
        </div>
        
        {/* Storage Statistics */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="font-bold text-indigo-800 mb-2">Storage Statistics:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <h4 className="font-semibold text-indigo-700">localStorage Images</h4>
              <p className="text-indigo-600">
                {allImages.filter(img => img.source === 'localStorage').length} images found
              </p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <h4 className="font-semibold text-purple-700">IndexedDB Images</h4> 
              <p className="text-purple-600">
                {allImages.filter(img => img.source === 'IndexedDB').length} images found
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default DebugPromptsStep;
