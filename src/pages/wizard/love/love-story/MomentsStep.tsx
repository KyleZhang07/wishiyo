import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storeData, getDataFromStore } from '@/utils/indexedDB';

// 定义照片存储键名
const PHOTO_KEYS = {
  MAIN: 'loveStoryCharacterPhoto',
  SECOND: 'loveStoryCharacterPhoto2',
  THIRD: 'loveStoryCharacterPhoto3',
  FOURTH: 'loveStoryCharacterPhoto4'
};

// 映射到API schema
const API_PHOTO_KEYS = {
  [PHOTO_KEYS.MAIN]: 'input_image',
  [PHOTO_KEYS.SECOND]: 'input_image2',
  [PHOTO_KEYS.THIRD]: 'input_image3',
  [PHOTO_KEYS.FOURTH]: 'input_image4'
};

const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const LoveStoryMomentsStep = () => {
  // 使用对象存储多张照片
  const [characterPhotos, setCharacterPhotos] = useState<Record<string, string | null>>({
    [PHOTO_KEYS.MAIN]: null,
    [PHOTO_KEYS.SECOND]: null,
    [PHOTO_KEYS.THIRD]: null,
    [PHOTO_KEYS.FOURTH]: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRefs = {
    [PHOTO_KEYS.MAIN]: useRef<HTMLInputElement>(null),
    [PHOTO_KEYS.SECOND]: useRef<HTMLInputElement>(null),
    [PHOTO_KEYS.THIRD]: useRef<HTMLInputElement>(null),
    [PHOTO_KEYS.FOURTH]: useRef<HTMLInputElement>(null)
  };
  
  const { toast } = useToast();

  useEffect(() => {
    const loadCharacterPhotos = async () => {
      try {
        // 加载所有照片
        for (const key of Object.values(PHOTO_KEYS)) {
          // 先尝试从IndexedDB获取照片
          const photoFromIDB = await getDataFromStore(key);
          if (photoFromIDB) {
            setCharacterPhotos(prev => ({
              ...prev,
              [key]: photoFromIDB
            }));
            continue;
          }
          
          // 如果IndexedDB中没有，则回退到localStorage
          const savedPhoto = localStorage.getItem(key);
          if (savedPhoto) {
            setCharacterPhotos(prev => ({
              ...prev,
              [key]: savedPhoto
            }));
            // 将照片从localStorage迁移到IndexedDB
            await storeData(key, savedPhoto);
            console.log(`Migrated ${key} from localStorage to IndexedDB`);
          }
        }
        
        // 向后兼容：检查旧的主照片键名
        if (!characterPhotos[PHOTO_KEYS.MAIN]) {
          const oldPartnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
          if (oldPartnerPhoto) {
            setCharacterPhotos(prev => ({
              ...prev,
              [PHOTO_KEYS.MAIN]: oldPartnerPhoto
            }));
            // 迁移旧的照片数据
            await storeData(PHOTO_KEYS.MAIN, oldPartnerPhoto);
            localStorage.setItem(PHOTO_KEYS.MAIN, oldPartnerPhoto);
            console.log('Migrated from old partner photo key to new character photo key');
          }
        }
      } catch (error) {
        console.error('Error loading character photos:', error);
      }
    };
    
    loadCharacterPhotos();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, photoKey: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)"
      });
      return;
    }
    
    // 检查文件大小（10MB上限）
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 10MB"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        
        // 更新状态
        setCharacterPhotos(prev => ({
          ...prev,
          [photoKey]: dataUrl
        }));
        
        // 存储到IndexedDB和localStorage
        await storeData(photoKey, dataUrl);
        localStorage.setItem(photoKey, dataUrl);
        
        toast({
          title: "Photo uploaded successfully",
          description: `Your photo has been saved as ${photoKey === PHOTO_KEYS.MAIN ? 'primary' : 'additional'} character photo`
        });
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "There was an error reading the file"
        });
        setIsLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error processing the file"
      });
      setIsLoading(false);
    }
  };

  const handleUploadClick = (photoKey: string) => {
    fileInputRefs[photoKey]?.current?.click();
  };

  const handleRemovePhoto = async (photoKey: string) => {
    // 从状态中移除
    setCharacterPhotos(prev => ({
      ...prev,
      [photoKey]: null
    }));
    
    // 从存储中移除
    try {
      localStorage.removeItem(photoKey);
      // 尝试从IndexedDB中移除
      await storeData(photoKey, null);
      
      toast({
        title: "Photo removed",
        description: "The photo has been removed"
      });
    } catch (error) {
      console.error(`Error removing photo ${photoKey}:`, error);
    }
  };

  // 获取已上传的照片数量
  const uploadedPhotoCount = Object.values(characterPhotos).filter(Boolean).length;
  
  // 检查是否可以上传更多照片
  const canAddMorePhotos = uploadedPhotoCount < MAX_PHOTOS;
  
  // 找到第一个空槽位用于添加照片
  const getNextEmptySlot = () => {
    for (const key of Object.values(PHOTO_KEYS)) {
      if (!characterPhotos[key]) {
        return key;
      }
    }
    // 如果没有空槽位，返回第一个键
    return PHOTO_KEYS.MAIN;
  };

  return (
    <WizardStep
      title="Upload your character photos"
      description="Upload up to 4 photos for your story"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Character Photos</h3>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Upload up to 4 photos. The first photo will be used as the main character image.
          </p>

          {/* 隐藏的文件输入 */}
          {Object.values(PHOTO_KEYS).map((key) => (
            <input 
              key={key}
              type="file"
              ref={fileInputRefs[key]}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, key)}
            />
          ))}

          {/* 照片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 主要角色照片 */}
            <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center relative">
              {!characterPhotos[PHOTO_KEYS.MAIN] ? (
                <Button
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center justify-center gap-4"
                  onClick={() => handleUploadClick(PHOTO_KEYS.MAIN)}
                  disabled={isLoading}
                >
                  <ImagePlus className="h-12 w-12 text-gray-400" />
                  <div className="text-center">
                    <span className="text-gray-500 block">
                      {isLoading ? "Processing..." : "Main Character Photo"}
                    </span>
                    <span className="text-xs text-gray-400 mt-1 block">(Required)</span>
                  </div>
                </Button>
              ) : (
                <div className="w-full h-full relative">
                  <img 
                    src={characterPhotos[PHOTO_KEYS.MAIN]!} 
                    alt="Main Character" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-8 h-8 rounded-full"
                      onClick={() => handleRemovePhoto(PHOTO_KEYS.MAIN)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                    onClick={() => handleUploadClick(PHOTO_KEYS.MAIN)}
                  >
                    <span className="text-white font-medium">
                      Replace
                    </span>
                  </Button>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Main Photo
                  </div>
                </div>
              )}
            </div>

            {/* 额外照片槽位 */}
            {[PHOTO_KEYS.SECOND, PHOTO_KEYS.THIRD, PHOTO_KEYS.FOURTH].map((key, index) => (
              <div key={key} className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center relative">
                {!characterPhotos[key] ? (
                  <Button
                    variant="ghost"
                    className="w-full h-full flex flex-col items-center justify-center gap-4"
                    onClick={() => handleUploadClick(key)}
                    disabled={isLoading || (!characterPhotos[PHOTO_KEYS.MAIN] && key !== PHOTO_KEYS.MAIN)}
                  >
                    <Plus className="h-12 w-12 text-gray-400" />
                    <div className="text-center">
                      <span className="text-gray-500 block">
                        {isLoading ? "Processing..." : `Additional Photo ${index + 1}`}
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block">(Optional)</span>
                    </div>
                  </Button>
                ) : (
                  <div className="w-full h-full relative">
                    <img 
                      src={characterPhotos[key]!} 
                      alt={`Additional Character ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="w-8 h-8 rounded-full"
                        onClick={() => handleRemovePhoto(key)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                      onClick={() => handleUploadClick(key)}
                    >
                      <span className="text-white font-medium">
                        Replace
                      </span>
                    </Button>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Photo {index + 1}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            These photos will be used to generate personalized story images.
          </p>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
