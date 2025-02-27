import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoveStoryMomentsStep = () => {
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const partnerFileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // 加载主图片
    const savedPartnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPartnerPhoto) {
      setPartnerPhoto(savedPartnerPhoto);
    }
    
    // 加载额外图片
    for (let i = 2; i <= 4; i++) {
      const savedPhoto = localStorage.getItem(`loveStoryPartnerPhoto${i}`);
      if (savedPhoto) {
        setAdditionalPhotos(prev => {
          const newPhotos = [...prev];
          newPhotos[i-2] = savedPhoto;
          return newPhotos;
        });
      }
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "无效的文件类型",
        description: "请上传图片文件（PNG, JPG等）"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPartnerPhoto(dataUrl);
      localStorage.setItem('loveStoryPartnerPhoto', dataUrl);
      toast({
        title: "照片上传成功",
        description: "您的主照片已保存"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "无效的文件类型",
        description: "请上传图片文件（PNG, JPG等）"
      });
      return;
    }

    if (additionalPhotos.length >= 3) {
      toast({
        variant: "destructive",
        title: "已达到最大数量",
        description: "最多只能上传3张额外照片"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newIndex = additionalPhotos.length + 1;
      
      setAdditionalPhotos(prev => [...prev, dataUrl]);
      localStorage.setItem(`loveStoryPartnerPhoto${newIndex+1}`, dataUrl);
      
      toast({
        title: "额外照片上传成功",
        description: `额外照片 #${newIndex} 已保存`
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    partnerFileInputRef.current?.click();
  };

  const handleAdditionalUploadClick = () => {
    additionalFileInputRef.current?.click();
  };

  const handleRemoveAdditionalPhoto = (index: number) => {
    setAdditionalPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
    
    // 重新排列localStorage中的照片
    for (let i = 0; i < 3; i++) {
      if (i < additionalPhotos.length - 1) {
        // 将后面的照片向前移动
        if (i >= index) {
          localStorage.setItem(`loveStoryPartnerPhoto${i+2}`, additionalPhotos[i+1]);
        }
      } else {
        // 删除多余的照片
        localStorage.removeItem(`loveStoryPartnerPhoto${i+2}`);
      }
    }
    
    toast({
      title: "照片已移除",
      description: "额外照片已成功移除"
    });
  };

  return (
    <WizardStep
      title="上传照片"
      description="上传主照片和额外照片（最多4张）"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-8">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">主照片（封面）</h3>
          <input 
            type="file"
            ref={partnerFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <div className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
            {!partnerPhoto ? (
              <Button
                variant="ghost"
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                onClick={handleUploadClick}
              >
                <ImagePlus className="h-12 w-12 text-gray-400" />
                <span className="text-gray-500">点击上传主照片（必选）</span>
              </Button>
            ) : (
              <button
                className="w-full h-full p-0 hover:opacity-90 transition-opacity relative group"
                onClick={handleUploadClick}
              >
                <img src={partnerPhoto} alt="Partner" className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <span className="text-white font-medium">点击更换照片</span>
                </div>
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500 text-center">此照片将用于故事封面和所有内容图片</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">额外照片（可选，最多3张）</h3>
          <p className="mb-4 text-sm text-gray-500 text-center">这些照片将用于丰富故事内容，可使图片更多样化</p>
          
          <input 
            type="file"
            ref={additionalFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAdditionalFileSelect}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 额外照片槽位 */}
            {[0, 1, 2].map((index) => (
              <div key={index} className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center relative">
                {additionalPhotos[index] ? (
                  <div className="w-full h-full relative group">
                    <img src={additionalPhotos[index]} alt={`Additional ${index+1}`} className="w-full h-full object-cover rounded-lg" />
                    <button 
                      className="absolute top-2 right-2 bg-red-500 rounded-full p-1 text-white opacity-70 hover:opacity-100"
                      onClick={() => handleRemoveAdditionalPhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  additionalPhotos.length === index ? (
                    <Button
                      variant="ghost"
                      className="w-full h-full flex flex-col items-center justify-center gap-2"
                      onClick={handleAdditionalUploadClick}
                      disabled={additionalPhotos.length >= 3}
                    >
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                      <span className="text-gray-500 text-sm">添加额外照片 #{index+1}</span>
                    </Button>
                  ) : (
                    <div className="text-gray-300 text-sm flex flex-col items-center justify-center">
                      <span>等待上传前一张照片</span>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
