
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getAllImageMappings } from '@/utils/supabaseStorage';

// 爱情故事图像键
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

// 可能包含图像数据的通用键
const GENERAL_IMAGE_KEYS = [
  'profilePhoto',
  'characterPhoto',
  'backgroundImage',
  'avatarImage',
  // 在此处添加其他可能的图像键
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
  source: 'localStorage' | 'Supabase';
  size: string;
  url?: string;
}

const DebugPromptsStep = () => {
  const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
  const [texts, setTexts] = useState<ImageText[]>([]);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<StoredImage[]>([]);
  const { toast } = useToast();

  // 辅助函数来格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 检查字符串是否可能是图像（base64 或 URL）
  const isLikelyImage = (str: string): boolean => {
    return (
      (typeof str === 'string' && 
       (str.startsWith('data:image') || 
        str.startsWith('http') || 
        str.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) !== null))
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载提示词
        const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
        if (savedPrompts) {
          try {
            setPrompts(JSON.parse(savedPrompts));
          } catch (error) {
            console.error('Error parsing prompts:', error);
          }
        }
        
        // 加载文本伴随内容
        const savedTexts = localStorage.getItem('loveStoryImageTexts');
        if (savedTexts) {
          try {
            setTexts(JSON.parse(savedTexts));
          } catch (error) {
            console.error('Error parsing texts:', error);
          }
        }
        
        // 加载选定的语调和样式
        const savedTone = localStorage.getItem('loveStoryTone');
        if (savedTone) {
          setSelectedTone(savedTone);
        }
        
        const savedStyle = localStorage.getItem('loveStoryStyle');
        if (savedStyle) {
          setSelectedStyle(savedStyle);
        }

        // 加载人物照片
        try {
          const characterPhotoUrl = await supabase.storage
            .from('story-images')
            .getPublicUrl('loveStoryCharacterPhoto').data.publicUrl;
            
          if (characterPhotoUrl) {
            setCharacterPhoto(characterPhotoUrl);
          } else {
            const characterPhotoFromLS = localStorage.getItem('loveStoryCharacterPhoto');
            if (characterPhotoFromLS) {
              setCharacterPhoto(characterPhotoFromLS);
            }
          }
        } catch (error) {
          console.error('Error loading character photo from Supabase:', error);
          // 回退到 localStorage
          const characterPhotoFromLS = localStorage.getItem('loveStoryCharacterPhoto');
          if (characterPhotoFromLS) {
            setCharacterPhoto(characterPhotoFromLS);
          }
        }

        // 加载所有图像映射
        const allImageMappings = await getAllImageMappings();
        const supabaseImages: StoredImage[] = allImageMappings.map(mapping => ({
          key: mapping.key,
          data: mapping.url,
          url: mapping.url,
          source: 'Supabase',
          size: 'Unknown' // Supabase 不提供文件大小信息
        }));
        
        // 检查 localStorage 中的图像
        const localStorageImages: StoredImage[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            try {
              const value = localStorage.getItem(key);
              if (value && isLikelyImage(value)) {
                localStorageImages.push({
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
        
        // 合并两个数组
        setAllImages([...supabaseImages, ...localStorageImages]);
        
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
      description="Development view to display photos from Supabase Storage and localStorage"
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
            <p className="text-blue-700">Displaying all images found in both Supabase Storage and localStorage.</p>
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
                      src={image.url || image.data} 
                      alt={`Image ${index+1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // 如果图像加载失败，回退到占位符
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlLW9mZiI+PHBhdGggZD0iTTEzLjQyIDIuMDAxQTEwLjkgMTAuOSAwIDEgMSAxMi41IDIxLjQ5MmE4LjM2IDguMzYgMCAwIDEtLjkxOS0xNi42MzRjNS43NS40NDUgMTAuNy01Ljk1MiA1LjE0OS0xMS4zNzdjLTEuMzktMS4zNTItMy4yMDctMi4wNDQtNS4xNDktMi4wMjN2LjA3NyIvPjwvc3ZnPg==';
                      }}
                    />
                    <div className={`absolute top-0 right-0 m-2 px-2 py-1 text-xs font-semibold rounded ${
                      image.source === 'Supabase' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
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
                          Show data URI/URL (first 100 chars)
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded overflow-hidden">
                          <div className="font-mono text-gray-700 break-all">
                            {(image.url || image.data).substring(0, 100)}...
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
            <p className="text-center text-gray-600 text-sm mt-2">
              Stored in {characterPhoto.startsWith('http') ? 'Supabase Storage' : 'localStorage'}
            </p>
          </div>
        )}
        
        {/* Storage info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Storage Information:</h3>
          <p className="text-blue-700">
            This application now uses Supabase Storage for persistent data storage.
            Images are uploaded to Supabase and retrieved via public URLs.
            Some legacy data may still exist in localStorage.
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
              <h4 className="font-semibold text-purple-700">Supabase Storage Images</h4> 
              <p className="text-purple-600">
                {allImages.filter(img => img.source === 'Supabase').length} images found
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default DebugPromptsStep;
