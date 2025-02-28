import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { getAllImagesFromStorage, ensureBucketExists } from '@/integrations/supabase/storage';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ImagePrompt {
  question: string;
  prompt: string;
}

interface ImageText {
  text: string;
  tone: string;
}

interface SupabaseImage {
  name: string;
  url: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  id: string;
}

interface LocalStorageImage {
  key: string;
  data: string;
  isBase64: boolean;
  size: string;
}

const DebugPromptsStep = () => {
  const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
  const [texts, setTexts] = useState<ImageText[]>([]);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);
  const [localStorageImages, setLocalStorageImages] = useState<LocalStorageImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isLoadingLocalStorage, setIsLoadingLocalStorage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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

    // Load images from Supabase Storage
    loadSupabaseImages();
    
    // Load images from localStorage
    loadLocalStorageImages();
  }, []);

  const loadSupabaseImages = async () => {
    setIsLoadingImages(true);
    try {
      // Ensure images bucket exists
      await ensureBucketExists('images');
      const images = await getAllImagesFromStorage('images');
      setSupabaseImages(images);
    } catch (error) {
      console.error('Error loading images from Supabase:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const loadLocalStorageImages = () => {
    setIsLoadingLocalStorage(true);
    
    try {
      const imageKeys = [
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
      
      const images: LocalStorageImage[] = [];
      
      imageKeys.forEach(key => {
        const imageData = localStorage.getItem(key);
        if (imageData) {
          // Calculate size in KB
          const sizeInKB = (imageData.length * 2 / 1024).toFixed(2);
          
          images.push({
            key,
            data: imageData,
            isBase64: imageData.startsWith('data:image'),
            size: `${sizeInKB} KB`
          });
        }
      });
      
      setLocalStorageImages(images);
    } catch (error) {
      console.error('Error loading images from localStorage:', error);
    } finally {
      setIsLoadingLocalStorage(false);
    }
  };

  const refreshSupabaseImages = () => {
    loadSupabaseImages();
  };
  
  const refreshLocalStorageImages = () => {
    loadLocalStorageImages();
  };
  
  const clearLocalStorageImage = (key: string) => {
    try {
      localStorage.removeItem(key);
      loadLocalStorageImages();
      toast({
        title: "Image removed",
        description: `Successfully removed ${key} from localStorage`,
      });
    } catch (error) {
      console.error('Error removing image from localStorage:', error);
      toast({
        title: "Error",
        description: "Failed to remove image from localStorage",
        variant: "destructive",
      });
    }
  };
  
  const clearAllLocalStorageImages = () => {
    try {
      const imageKeys = [
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
      
      imageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      loadLocalStorageImages();
      toast({
        title: "Images cleared",
        description: "Successfully removed all images from localStorage",
      });
    } catch (error) {
      console.error('Error clearing localStorage images:', error);
      toast({
        title: "Error",
        description: "Failed to clear localStorage images",
        variant: "destructive",
      });
    }
  };

  const debugContent = (
    <div className="space-y-8 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="text-yellow-800 font-bold">⚠️ Development Only</h2>
        <p className="text-yellow-700">This page is for development purposes and will be removed in production.</p>
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
      
      {/* Supabase Images Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-xl">Supabase Storage Images</h3>
          <Button 
            onClick={refreshSupabaseImages} 
            variant="outline" 
            size="sm"
            disabled={isLoadingImages}
          >
            {isLoadingImages ? (
              <React.Fragment>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </React.Fragment>
            ) : (
              <React.Fragment>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Images
              </React.Fragment>
            )}
          </Button>
        </div>

        {isLoadingImages ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : supabaseImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {supabaseImages.map((image) => (
              <div key={image.id} className="bg-gray-50 p-2 rounded">
                <img 
                  src={image.url} 
                  alt={image.name}
                  className="w-full h-48 object-cover rounded mb-2"
                />
                <p className="text-xs text-gray-500 truncate" title={image.name}>
                  {image.name}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(image.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 py-8 text-center">No images found in Supabase Storage.</p>
        )}
      </div>
      
      {/* LocalStorage Images Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-xl">LocalStorage Images</h3>
          <div className="flex gap-2">
            <Button 
              onClick={refreshLocalStorageImages} 
              variant="outline" 
              size="sm"
              disabled={isLoadingLocalStorage}
            >
              {isLoadingLocalStorage ? (
                <React.Fragment>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </React.Fragment>
              )}
            </Button>
            <Button 
              onClick={clearAllLocalStorageImages} 
              variant="destructive" 
              size="sm"
              disabled={isLoadingLocalStorage || localStorageImages.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        {isLoadingLocalStorage ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : localStorageImages.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-4 text-sm">
              <p className="text-yellow-800">Total Size: {
                localStorageImages.reduce((total, img) => total + parseFloat(img.size), 0).toFixed(2)
              } KB</p>
              <p className="text-yellow-700 text-xs mt-1">LocalStorage limit is typically around 5MB (5,120 KB) per domain</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {localStorageImages.map((image) => (
                <div key={image.key} className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-700">{image.key}</p>
                      <p className="text-xs text-gray-500">Size: {image.size}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearLocalStorageImage(image.key)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {image.isBase64 && (
                    <div className="mt-2">
                      <img 
                        src={image.data} 
                        alt={image.key}
                        className="max-h-20 rounded border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 py-8 text-center">No images found in localStorage.</p>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 text-xl">Story Elements:</h3>
        
        {/* Display the cover image data */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-800 mb-2">Cover Image:</h3>
          <p className="text-gray-600 mb-4">{prompts[0]?.question}</p>
          <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompts[0]?.prompt}</p>
        </div>

        {/* Display the story image prompts with their text accompaniments */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800">Story Images:</h3>
          {prompts.slice(1).map((prompt, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold text-gray-800 mb-2">Image {index + 1}:</h4>
              
              <div className="mb-4">
                <p className="text-gray-600 font-semibold mb-1">Question:</p>
                <p className="text-gray-800">{prompt.question}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 font-semibold mb-1">Image Prompt:</p>
                <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompt.prompt}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-600 font-semibold mb-1">Text Accompaniment ({texts[index]?.tone || selectedTone}):</p>
                {texts[index] ? (
                  <p className="text-gray-800 italic bg-blue-50 p-3 rounded">{texts[index].text}</p>
                ) : (
                  <p className="text-red-500">No text accompaniment found</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Raw data dump for debugging */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs mt-8 overflow-x-auto">
        <h3 className="text-white mb-2">Raw Data:</h3>
        <p className="mb-2">ImagePrompts:</p>
        <pre>{JSON.stringify(prompts, null, 2)}</pre>
        <p className="mt-4 mb-2">ImageTexts:</p>
        <pre>{JSON.stringify(texts, null, 2)}</pre>
        <p className="mt-4 mb-2">Supabase Storage URLs:</p>
        <pre>{JSON.stringify(supabaseImages.map(img => img.url), null, 2)}</pre>
      </div>
    </div>
  );

  return (
    <WizardStep
      title="[DEV] Love Story Debug View"
      description="This is a development-only view to check the stored data for the love story."
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/moments"
      currentStep={3}
      totalSteps={4}
    >
      {debugContent}
    </WizardStep>
  );
};

export default DebugPromptsStep;
