import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { getAllImagesFromStorage, ensureBucketExists } from '@/integrations/supabase/storage';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ImagePrompt {
  question: string;
  prompt: string;
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
  dataUrl: string;
  size: number; // in bytes
}

const DebugPromptsStep = () => {
  const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [localStorageImages, setLocalStorageImages] = useState<LocalStorageImage[]>([]);
  const [isLoadingLocalStorage, setIsLoadingLocalStorage] = useState(false);
  const [localStorageUsage, setLocalStorageUsage] = useState<{used: number, total: number}>({used: 0, total: 0});
  
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
    
    // Calculate localStorage usage
    calculateLocalStorageUsage();
  }, []);

  const loadSupabaseImages = async () => {
    setIsLoadingImages(true);
    try {
      // Ensure images bucket exists
      await ensureBucketExists('images');
      // 使用更新后的getAllImagesFromStorage函数，它将自动获取当前客户端的图片
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
        'loveStoryContentImage10',
      ];
      
      const images: LocalStorageImage[] = [];
      
      imageKeys.forEach(key => {
        const dataUrl = localStorage.getItem(key);
        if (dataUrl) {
          // Calculate size in bytes (approximation for base64)
          const size = Math.ceil((dataUrl.length * 3) / 4);
          images.push({
            key,
            dataUrl,
            size
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
  
  const calculateLocalStorageUsage = () => {
    try {
      // Get current usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          used += key.length + value.length;
        }
      }
      
      // Convert to MB
      const usedMB = used / (1024 * 1024);
      
      // Estimate total available (varies by browser)
      // Most browsers have 5-10MB limit
      const totalMB = 5; // Conservative estimate
      
      setLocalStorageUsage({
        used: usedMB,
        total: totalMB
      });
    } catch (error) {
      console.error('Error calculating localStorage usage:', error);
    }
  };

  const refreshSupabaseImages = () => {
    loadSupabaseImages();
  };
  
  const refreshLocalStorageImages = () => {
    loadLocalStorageImages();
    calculateLocalStorageUsage();
    toast({
      title: "Local Storage Refreshed",
      description: "Local storage image data has been refreshed",
    });
  };
  
  const clearLocalStorageImages = () => {
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
        'loveStoryContentImage10',
      ];
      
      imageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      setLocalStorageImages([]);
      calculateLocalStorageUsage();
      
      toast({
        title: "Local Storage Cleared",
        description: "All image data has been removed from local storage",
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      toast({
        title: "Error",
        description: "Failed to clear local storage",
        variant: "destructive",
      });
    }
  };

  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      
      {/* LocalStorage Usage Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-xl">LocalStorage Usage</h3>
          <div className="flex space-x-2">
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
                'Refresh Local'
              )}
            </Button>
            <Button 
              onClick={clearLocalStorageImages} 
              variant="destructive" 
              size="sm"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Images
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-gray-100 rounded-full h-4 mb-2">
            <div 
              className={`h-4 rounded-full ${localStorageUsage.used / localStorageUsage.total > 0.8 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, (localStorageUsage.used / localStorageUsage.total) * 100)}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 flex justify-between">
            <span>Used: {localStorageUsage.used.toFixed(2)} MB</span>
            <span>Total: ~{localStorageUsage.total.toFixed(2)} MB</span>
          </div>
        </div>

        {isLoadingLocalStorage ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : localStorageImages.length > 0 ? (
          <div>
            <p className="text-sm mb-2 text-gray-600">Total images in localStorage: {localStorageImages.length}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {localStorageImages.map((image, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded">
                  <img 
                    src={image.dataUrl} 
                    alt={image.key}
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                  <p className="text-xs text-gray-500 truncate" title={image.key}>
                    {image.key}
                  </p>
                  <p className="text-xs text-orange-500 font-semibold">
                    Size: {formatFileSize(image.size)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 py-8 text-center">No images found in localStorage.</p>
        )}
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
              'Refresh Supabase'
            )}
          </Button>
        </div>

        {isLoadingImages ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : supabaseImages.length > 0 ? (
          <div>
            <p className="text-sm mb-2 text-gray-600">Total images in Supabase: {supabaseImages.length}</p>
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
          </div>
        ) : (
          <p className="text-gray-500 py-8 text-center">No images found in Supabase Storage.</p>
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

        {/* Display the story image prompts without text accompaniments */}
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
            </div>
          ))}
        </div>
      </div>
      
      {/* Raw data dump for debugging */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs mt-8 overflow-x-auto">
        <h3 className="text-white mb-2">Raw Data:</h3>
        <p className="mb-2">ImagePrompts:</p>
        <pre>{JSON.stringify(prompts, null, 2)}</pre>
        <p className="mt-4 mb-2">Supabase Storage URLs:</p>
        <pre>{JSON.stringify(supabaseImages.map(img => img.url), null, 2)}</pre>
        <p className="mt-4 mb-2">LocalStorage Usage:</p>
        <pre>{JSON.stringify(localStorageUsage, null, 2)}</pre>
      </div>
    </div>
  );

  return (
    <WizardStep
      title="[DEV] Love Story Debug View"
      description="This is a development-only view to check the stored data for the love story."
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={5}
      totalSteps={6}
    >
      {debugContent}
    </WizardStep>
  );
};

export default DebugPromptsStep;
