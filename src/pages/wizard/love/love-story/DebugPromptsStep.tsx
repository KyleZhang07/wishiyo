import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { getAllImagesFromStorage, ensureBucketExists } from '@/integrations/supabase/storage';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ImagePrompt {
  question: string;
  prompt: string;
}

interface ImageText {
  text: string;
  tone: string;
  contentIndex?: number;
  timestamp?: number;
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

interface SupabaseText {
  name: string;
  url: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  id: string;
  content?: ImageText; // 解析后的文本内容
}

const DebugPromptsStep = () => {
  const [imagePrompts, setImagePrompts] = useState<ImagePrompt[]>([]);
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [localStorageImages, setLocalStorageImages] = useState<LocalStorageImage[]>([]);
  const [isLoadingLocalStorage, setIsLoadingLocalStorage] = useState(false);
  const [localStorageUsage, setLocalStorageUsage] = useState<{used: number, total: number}>({used: 0, total: 0});
  const [supabaseTexts, setSupabaseTexts] = useState<SupabaseText[]>([]);
  const [isLoadingTexts, setIsLoadingTexts] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // Load prompts
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    if (savedPrompts) {
      try {
        setImagePrompts(JSON.parse(savedPrompts));
      } catch (error) {
        console.error('Error parsing image prompts:', error);
      }
    }
    
    // Load text accompaniments
    const savedTexts = localStorage.getItem('loveStoryImageTexts');
    if (savedTexts) {
      try {
        setImageTexts(JSON.parse(savedTexts));
      } catch (error) {
        console.error('Error parsing image texts:', error);
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
    
    // Load texts from Supabase Storage
    loadSupabaseTexts();
    
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
      let totalUsed = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalUsed += value.length * 2; // Approximate size in bytes (2 bytes per character)
          }
        }
      }

      // Convert to MB
      const usedInMB = totalUsed / (1024 * 1024);
      // Approximate total localStorage size (5MB is common)
      const totalInMB = 5;

      setLocalStorageUsage({
        used: usedInMB,
        total: totalInMB
      });
    } catch (error) {
      console.error('Error calculating localStorage usage:', error);
    }
  };

  const loadSupabaseTexts = async () => {
    setIsLoadingTexts(true);
    try {
      // Ensure images bucket exists
      await ensureBucketExists('images');
      
      // Get all JSON files (text content)
      const { data, error } = await supabase.storage
        .from('images')
        .list();
      
      if (error) {
        throw error;
      }
      
      // Filter out all text files (ending with .json)
      const textFiles = data?.filter(file => file.name.endsWith('.json')) || [];
      
      // Get public URL for each text file and fetch content
      const textsWithContent = await Promise.all(textFiles.map(async (file) => {
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(file.name);
          
        // Get text content
        let content: ImageText | undefined;
        try {
          const response = await fetch(publicUrlData.publicUrl);
          const jsonData = await response.json();
          content = jsonData as ImageText;
        } catch (error) {
          console.error(`Error fetching text content for ${file.name}:`, error);
        }
        
        return {
          name: file.name,
          url: publicUrlData?.publicUrl || '',
          metadata: file.metadata,
          created_at: file.created_at,
          updated_at: file.updated_at,
          id: file.id,
          content
        };
      }));
      
      setSupabaseTexts(textsWithContent);
    } catch (error) {
      console.error('Error loading texts from Supabase:', error);
    } finally {
      setIsLoadingTexts(false);
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

  const refreshTexts = () => {
    loadSupabaseTexts();
    toast({
      title: "Refreshing texts",
      description: "Loading latest texts from Supabase Storage",
    });
  };

  const debugContent = (
    <div className="space-y-8 pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Selected Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Selected Tone:</strong> {selectedTone}
            </div>
            <div>
              <strong>Selected Style:</strong> {selectedStyle}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Local Storage Usage</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshLocalStorageImages}
              disabled={isLoadingLocalStorage}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLocalStorage ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearLocalStorageImages}
              disabled={isLoadingLocalStorage}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>Used: {formatBytes(localStorageUsage.used)} of {formatBytes(localStorageUsage.total)}</span>
                <span>{Math.round((localStorageUsage.used / localStorageUsage.total) * 100)}%</span>
              </div>
              <Progress value={(localStorageUsage.used / localStorageUsage.total) * 100} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {localStorageImages.map((image, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="font-medium">{image.key}</div>
                  <div className="text-sm text-gray-500">Size: {formatBytes(image.size)}</div>
                  <div className="h-32 overflow-hidden mt-2">
                    <img 
                      src={image.dataUrl} 
                      alt={`Preview of ${image.key}`}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Supabase Storage Images</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshSupabaseImages}
            disabled={isLoadingImages}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingImages ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingImages ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin h-8 w-8" />
            </div>
          ) : supabaseImages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No images found in Supabase storage
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supabaseImages.map((image, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="font-medium truncate" title={image.name}>
                    {image.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Created: {new Date(image.created_at).toLocaleString()}
                  </div>
                  <div className="h-32 overflow-hidden mt-2">
                    <img 
                      src={image.url} 
                      alt={`Preview of ${image.name}`}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Supabase Storage Texts</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshTexts}
            disabled={isLoadingTexts}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTexts ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingTexts ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin h-8 w-8" />
            </div>
          ) : supabaseTexts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No text files found in Supabase storage
            </div>
          ) : (
            <div className="space-y-4">
              {supabaseTexts.map((textFile, index) => (
                <div key={index} className="border rounded-md p-4">
                  <h3 className="font-medium truncate" title={textFile.name}>
                    {textFile.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Created: {new Date(textFile.created_at).toLocaleString()}
                  </p>
                  {textFile.content ? (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p><strong>Text:</strong> {textFile.content.text}</p>
                      <p><strong>Tone:</strong> {textFile.content.tone}</p>
                      {textFile.content.contentIndex !== undefined && (
                        <p><strong>Index:</strong> {textFile.content.contentIndex}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">
                      Content not available or could not be parsed
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Image Texts (LocalStorage)</CardTitle>
        </CardHeader>
        <CardContent>
          {imageTexts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No image texts found in LocalStorage
            </div>
          ) : (
            <div className="space-y-4">
              {imageTexts.map((text, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="font-medium">Text {index + 1}</div>
                  <div className="bg-gray-50 p-3 rounded-md mt-2">
                    <p><strong>Text:</strong> {text.text}</p>
                    <p><strong>Tone:</strong> {text.tone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Image Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px] text-xs">
            {JSON.stringify(imagePrompts, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <WizardStep
      title="Debug Information"
      description="Technical details for debugging purposes."
      previousStep="/create/love/love-story/generate"
      nextStep="/create/love/love-story/preview"
      currentStep={5}
      totalSteps={5}
    >
      {debugContent}
    </WizardStep>
  );
};

export default DebugPromptsStep;
