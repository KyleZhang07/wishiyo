import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getClientId, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';
// 导入背景图片
import blueTextureBackground from '../../../../assets/Generated Image March 15, 2025 - 3_12PM_LE_upscale_balanced_x4.jpg';
import greenLeafBackground from '../../../../assets/leaves.jpg';
import rainbowBackground from '../../../../assets/rainbow2.jpg';

// 定义封面样式类型
interface CoverStyle {
  id: string;
  name: string;
  background: string;
  titleColor: string;
  subtitleColor: string;
  authorColor: string;
  font: string;
  borderColor?: string;
}

// 预定义的封面样式
const coverStyles: CoverStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    background: '#f6f4ea', // 介于之前两种颜色之间的中间值
    titleColor: '#444444', // 保持深灰色标题
    subtitleColor: '#633d63', // 保持紫色副标题
    authorColor: '#222222', // 保持深灰色作者名
    font: 'playfair',
    borderColor: '#EAC46E'
  },
  {
    id: 'modern',
    name: 'Modern',
    background: '#000000',
    titleColor: '#4caf50',
    subtitleColor: '#ffffff',
    authorColor: '#4caf50',
    font: 'montserrat'
  },
  {
    id: 'playful',
    name: 'Playful',
    background: '#4A89DC',
    titleColor: '#FFEB3B',
    subtitleColor: '#FFFFFF',
    authorColor: '#FFEB3B',
    font: 'comic-sans'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    background: '#FFFFFF',
    titleColor: '#000000',
    subtitleColor: '#333333',
    authorColor: '#000000',
    font: 'didot'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    background: '#F5F5DC',
    titleColor: '#8B4513',
    subtitleColor: '#A0522D',
    authorColor: '#8B4513',
    font: 'playfair',
    borderColor: '#D2B48C'
  }
];

const LoveStoryCoverStep = () => {
  const [coverTitle, setCoverTitle] = useState<string>('THE MAGIC IN');
  const [subtitle, setSubtitle] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('Timi Bliss');
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [supabaseImages, setSupabaseImages] = useState<any[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('classic');
  const [textTone, setTextTone] = useState<string>('romantic');
  const { toast } = useToast();
  const navigate = useNavigate();

  // 添加Canvas引用
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 从localStorage获取标题、作者信息、样式和文本风格
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    const savedStyle = localStorage.getItem('loveStoryCoverStyle');
    const savedTone = localStorage.getItem('loveStoryTone');
    
    // 从Supabase获取已保存的封面图片
    loadCoverImagesFromSupabase();
    
    if (savedAuthorName) {
      setAuthorName(savedAuthorName);
    }
    
    if (savedTone) {
      setTextTone(savedTone);
    }
    
    if (savedStyle) {
      setSelectedStyle(savedStyle);
    }
    
    // 获取用户之前选择的图片索引
    const savedImageIndex = localStorage.getItem('loveStorySelectedCoverIndex');
    if (savedImageIndex) {
      setCurrentImageIndex(parseInt(savedImageIndex));
    }
    
    if (savedIdeas && savedIdeaIndex) {
      try {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          // 保持主标题为"THE MAGIC IN"
          setCoverTitle('THE MAGIC IN');
          // 副标题设置为描述(现在不显示)
          setSubtitle(selectedIdea.description || '');
        }
      } catch (error) {
        console.error('Error parsing saved ideas:', error);
      }
    }
  }, []);

  // 从Supabase加载封面图片
  const loadCoverImagesFromSupabase = async () => {
    try {
      const images = await getAllImagesFromStorage('images');
      const coverImages = images.filter(img => img.name.includes('love-story-cover'));
      
      // 保存 Supabase 图片信息
      setSupabaseImages(coverImages);
      
      if (coverImages.length > 0) {
        // 按创建时间排序，最新的在前面
        const sortedImages = coverImages.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // 获取图片URL数组
        const imageUrls = sortedImages.map(img => img.url);
        
        // 更新状态
        setCoverImages(imageUrls);
        
        // 获取用户之前选择的图片索引
        const savedImageIndex = localStorage.getItem('loveStorySelectedCoverIndex');
        if (savedImageIndex && parseInt(savedImageIndex) < imageUrls.length) {
          setCurrentImageIndex(parseInt(savedImageIndex));
        } else {
          // 默认选择第一张图片
          setCurrentImageIndex(0);
        }
      }
    } catch (error) {
      console.error('Error loading cover images from Supabase:', error);
    }
  };

  // 删除所有旧的封面图片
  const deleteOldCoverImages = async () => {
    try {
      const images = await getAllImagesFromStorage('images');
      const coverImages = images.filter(img => img.name.includes('love-story-cover'));
      
      // 创建删除操作的Promise数组
      const deletePromises = coverImages.map(img => {
        const pathParts = img.name.split('/');
        const filename = pathParts[pathParts.length - 1];
        return deleteImageFromStorage(filename, 'images');
      });
      
      // 并行执行所有删除操作
      await Promise.all(deletePromises);
      console.log('All old cover images deleted successfully');
    } catch (error) {
      console.error('Error deleting old cover images:', error);
    }
  };

  // 处理样式选择
  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    localStorage.setItem('loveStoryCoverStyle', styleId);
  };

  // 编辑封面功能
  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
    // 这里未来可以实现打开编辑器的功能
  };

  // 切换到上一张图片
  const handlePrevImage = () => {
    if (coverImages.length <= 1) return;
    
    const newIndex = currentImageIndex === 0 ? coverImages.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    
    // 保存当前选中的图片索引
    localStorage.setItem('loveStorySelectedCoverIndex', newIndex.toString());
  };

  // 切换到下一张图片
  const handleNextImage = () => {
    if (coverImages.length <= 1) return;
    
    const newIndex = (currentImageIndex + 1) % coverImages.length;
    setCurrentImageIndex(newIndex);
    
    // 保存当前选中的图片索引
    localStorage.setItem('loveStorySelectedCoverIndex', newIndex.toString());
  };

  // 直接跳转到指定索引的图片
  const handleDotClick = (index: number) => {
    if (index >= 0 && index < coverImages.length) {
      setCurrentImageIndex(index);
      
      // 保存当前选中的图片索引
      localStorage.setItem('loveStorySelectedCoverIndex', index.toString());
    }
  };

  // 重新生成封面功能
  const handleRegenerateCover = async () => {
    setIsGeneratingCover(true);
    toast({
      title: "Regenerating cover",
      description: "Creating new covers for your love story..."
    });
    
    try {
      // 先删除所有旧的封面图片
      await deleteOldCoverImages();
      
      // 获取用户上传的图片
      const uploadedImage = localStorage.getItem('loveStoryPartnerPhoto');
      const savedTone = localStorage.getItem('loveStoryTone') || textTone;
      const personAge = localStorage.getItem('loveStoryPersonAge') || '0';
      const ageNumber = parseInt(personAge);
      
      // 根据年龄选择不同的 prompt
      let textPrompt = '';
      if (ageNumber <= 12) {
        // 儿童风格 prompt
        textPrompt = `the person as a cute cartoon character with big expressive eyes, simplified facial features, colorful background, cheerful expression, wearing bright colored clothes, ${savedTone} mood, centered composition`;
      } else {
        // 更成熟的风格 prompt
        textPrompt = `the person as a stylized character with semi-realistic features, detailed facial expression, dynamic lighting, modern outfit, ${savedTone} atmosphere, artistic composition, vibrant color palette`;
      }
      
      if (uploadedImage) {
        // 使用上传的图片处理
        // 第一步：调用generate-love-cover API增强图片
        const { data: enhancedData, error: enhancedError } = await supabase.functions.invoke('generate-love-cover', {
          body: { 
            photo: uploadedImage,
            style: "Disney Charactor", // 固定使用 Disney Charactor 样式
            type: 'cover',
            prompt: textPrompt // 将 textPrompt 改为 prompt
          }
        });
        
        if (enhancedError) throw enhancedError;
        
        // 检查并处理响应数据
        let enhancedImages: string[] = [];
        if (enhancedData?.output && enhancedData.output.length > 0) {
          enhancedImages = enhancedData.output;
        } else if (enhancedData?.coverImage && enhancedData.coverImage.length > 0) {
          enhancedImages = enhancedData.coverImage;
        } else {
          throw new Error("No enhanced image data in response");
        }
        
        // 处理并上传所有生成的图片
        const timestamp = Date.now();
        const processedImages: string[] = [];
        
        for (let i = 0; i < enhancedImages.length; i++) {
          try {
            // 第二步：调用remove-background API去除背景
            const { data: bgRemoveData, error: bgRemoveError } = await supabase.functions.invoke('remove-background', {
              body: { imageUrl: enhancedImages[i] }
            });
            
            if (bgRemoveError) throw bgRemoveError;
            
            if (!bgRemoveData?.success || !bgRemoveData?.image) {
              throw new Error(`Failed to remove background for image ${i}`);
            }
            
            const processedImage = bgRemoveData.image;
            
            // 第三步：上传到Supabase存储
            const storageUrl = await uploadImageToStorage(
              processedImage,
              'images',
              `love-story-cover-${i}-${timestamp}`
            );
            
            processedImages.push(processedImage);
          } catch (error) {
            console.error(`Error processing image ${i}:`, error);
          }
        }
        
        // 更新状态，显示处理后的图片
        if (processedImages.length > 0) {
          setCoverImages(processedImages);
          setCurrentImageIndex(0);
        }
      } else {
        // 没有上传图片，使用简单的背景颜色
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 使用当前选定样式的背景色
          const currentStyle = coverStyles.find(style => style.id === selectedStyle) || coverStyles[0];
          ctx.fillStyle = currentStyle.background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          try {
            const dataUrl = canvas.toDataURL('image/png');
            setCoverImages([dataUrl]);
            setCurrentImageIndex(0);
            
            // 上传到Supabase，但不存储到localStorage
            const timestamp = Date.now();
            await uploadImageToStorage(
              dataUrl,
              'images',
              `love-story-cover-${timestamp}`
            );
          } catch (error) {
            console.error('Error creating cover image:', error);
            throw error;
          }
        }
      }
      
      // 重新加载Supabase上的图片以获取最新上传的图片
      setTimeout(() => {
        loadCoverImagesFromSupabase();
      }, 1000);
      
      toast({
        title: "Covers regenerated",
        description: "Your new covers are ready! Use the arrows to browse them."
      });
    } catch (error) {
      console.error('Error generating cover:', error);
      toast({
        title: "Error",
        description: "Failed to generate new covers.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };
  
  // 添加一个函数，用于将LoveStoryCoverPreview渲染到Canvas
  const renderCoverToCanvas = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个临时的Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1200;  // 设置较大的尺寸以获得高质量图像
        canvas.height = 1800;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // 加载当前封面图片
        if (!currentCoverImage) {
          reject(new Error('No cover image available'));
          return;
        }

        // 加载背景图片
        const loadBackgroundImage = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load background image: ${src}`));
            img.src = src;
          });
        };
        
        // 加载人物图片和背景图片
        const loadAllImages = async () => {
          try {
            // 加载人物图片
            const personImg = new Image();
            personImg.crossOrigin = 'anonymous';
            
            const personImgPromise = new Promise<HTMLImageElement>((resolve, reject) => {
              personImg.onload = () => resolve(personImg);
              personImg.onerror = () => reject(new Error('Failed to load cover image'));
              personImg.src = currentCoverImage!;
            });
            
            // 根据样式选择背景图片
            let backgroundImgPromise: Promise<HTMLImageElement> | null = null;
            
            if (currentStyle.id === 'modern') {
              backgroundImgPromise = loadBackgroundImage(blueTextureBackground);
            } else if (currentStyle.id === 'playful') {
              backgroundImgPromise = loadBackgroundImage(greenLeafBackground);
            } else if (currentStyle.id === 'elegant') {
              backgroundImgPromise = loadBackgroundImage(rainbowBackground);
            }
            // 注意：classic和vintage样式不使用背景图片，保持使用纯色背景
            
            // 等待所有图片加载完成
            const [personImgLoaded, backgroundImgLoaded] = await Promise.all([
              personImgPromise,
              backgroundImgPromise ? backgroundImgPromise : Promise.resolve(null)
            ]);
            
            // 绘制背景
            if (backgroundImgLoaded) {
              // 使用加载的背景图片
              ctx.drawImage(backgroundImgLoaded, 0, 0, canvas.width, canvas.height);
              
              // 对于某些背景，添加叠加层以增强效果
              if (currentStyle.id === 'modern') {
                // 添加深蓝色半透明叠加层，使图片更暗
                ctx.fillStyle = 'rgba(10, 26, 63, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 添加雪花效果
                const snowflakeCount = 100;
                ctx.fillStyle = '#FFFFFF';
                
                for (let i = 0; i < snowflakeCount; i++) {
                  const x = Math.random() * canvas.width;
                  const y = Math.random() * canvas.height;
                  const size = Math.random() * 5 + 1;
                  
                  ctx.beginPath();
                  ctx.arc(x, y, size, 0, Math.PI * 2);
                  ctx.fill();
                }
              } else if (currentStyle.id === 'playful') {
                // 添加蓝色半透明叠加层
                ctx.fillStyle = 'rgba(74, 137, 220, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            } else {
              // 使用样式的纯色背景
              if (currentStyle.id === 'classic' || currentStyle.id === 'vintage') {
                ctx.fillStyle = currentStyle.background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 如果有边框颜色，绘制边框
                if (currentStyle.borderColor) {
                  ctx.strokeStyle = currentStyle.borderColor;
                  ctx.lineWidth = 20;
                  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
                }
              } else if (currentStyle.id === 'modern') {
                // 如果无法加载modern背景图片，使用深蓝色
                ctx.fillStyle = '#0a1a3f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (currentStyle.id === 'playful') {
                // 如果无法加载playful背景图片，使用蓝色
                ctx.fillStyle = '#4A89DC';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else {
                // 默认白色背景
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            }
            
            // 计算图像尺寸，保持比例
            const imgRatio = personImgLoaded.width / personImgLoaded.height;
            let drawWidth = canvas.width * 0.7;  // 图片占70%的宽度
            let drawHeight = drawWidth / imgRatio;
            
            // 如果高度太大，按高度计算
            if (drawHeight > canvas.height * 0.6) {
              drawHeight = canvas.height * 0.6;
              drawWidth = drawHeight * imgRatio;
            }
            
            // 计算居中位置
            const x = (canvas.width - drawWidth) / 2;
            const y = canvas.height * 0.4;  // 图片位置偏上
            
            // 绘制人物图像
            ctx.drawImage(personImgLoaded, x, y, drawWidth, drawHeight);
            
            // 绘制标题文本
            ctx.textAlign = 'center';
            
            // 主标题
            ctx.fillStyle = currentStyle.titleColor;
            const titleFontSize = canvas.width * 0.06;
            ctx.font = `bold ${titleFontSize}px ${getFontFamily(currentStyle.font)}`;
            ctx.fillText(coverTitle, canvas.width / 2, canvas.height * 0.15);
            
            // 副标题
            ctx.fillStyle = currentStyle.subtitleColor;
            const subtitleFontSize = canvas.width * 0.09;
            ctx.font = `bold ${subtitleFontSize}px ${getFontFamily(currentStyle.font)}`;
            ctx.fillText(subtitle || recipientName, canvas.width / 2, canvas.height * 0.26);
            
            // 作者名
            ctx.fillStyle = currentStyle.authorColor;
            const authorFontSize = canvas.width * 0.035;
            ctx.font = `italic ${authorFontSize}px ${getFontFamily(currentStyle.font)}`;
            ctx.fillText(`Written by ${authorName}`, canvas.width * 0.75, canvas.height * 0.9);
            
            // 转换为图像
            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            resolve(imageData);
          } catch (error) {
            reject(error);
          }
        };
        
        // 开始加载图片
        loadAllImages();
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // 辅助函数：根据字体名称获取字体族
  const getFontFamily = (font: string): string => {
    switch (font) {
      case 'montserrat':
        return 'sans-serif';
      case 'comic-sans':
        return 'cursive';
      case 'didot':
      case 'playfair':
      default:
        return 'serif';
    }
  };
  
  // 修改handleContinue以添加Canvas渲染和上传功能
  const handleContinue = async () => {
    try {
      toast({
        title: "Processing cover",
        description: "Rendering and uploading your cover image..."
      });
      
      // 保存当前选中的封面图片到 localStorage
      if (coverImages.length > 0 && currentImageIndex >= 0 && currentImageIndex < coverImages.length) {
        const selectedCoverImage = coverImages[currentImageIndex];
        localStorage.setItem('loveStorySelectedCoverImage', selectedCoverImage);
        
        // 渲染封面到Canvas并获取图像数据
        const canvasImageData = await renderCoverToCanvas();
        
        // 生成时间戳，确保文件名唯一
        const timestamp = Date.now();
        const newFilename = `love-cover-${timestamp}`;
        
        // 先上传新图片，确保有新图片后再删除旧图片
        const storageUrl = await uploadImageToStorage(
          canvasImageData,
          'images',
          newFilename
        );
        
        // 保存URL到localStorage
        localStorage.setItem('loveStorySelectedCoverImage_url', storageUrl);
        localStorage.setItem('loveStoryCoverImageCanvas', canvasImageData);
        
        // 清除Supabase中的旧封面图片，但保留刚刚上传的图片
        try {
          // 获取最新的图片列表
          const allImages = await getAllImagesFromStorage('images');
          
          // 过滤出所有love-cover开头的图片，但排除刚刚上传的图片
          const coverImagesToDelete = allImages.filter(img => 
            (img.name.includes('love-cover') || img.name.includes('love-story-cover-canvas')) && 
            !img.name.includes(newFilename)
          );
          
          if (coverImagesToDelete.length > 0) {
            console.log(`Found ${coverImagesToDelete.length} old cover images to delete`);
            
            // 并行删除所有旧图片
            const deletePromises = coverImagesToDelete.map(img => {
              // 从完整路径中提取文件名
              const pathParts = img.name.split('/');
              const filename = pathParts[pathParts.length - 1];
              console.log(`Deleting old cover image: ${filename}`);
              return deleteImageFromStorage(filename, 'images');
            });
            
            // 等待所有删除操作完成
            await Promise.all(deletePromises);
            console.log('Successfully deleted all old cover images from Supabase');
          } else {
            console.log('No old cover images to delete');
          }
        } catch (deleteError) {
          console.error('Error deleting old cover images:', deleteError);
          // 继续处理，即使删除失败
        }
        
        // 如果有 Supabase 存储的原始 URL，也保存它
        const images = supabaseImages.filter(img => img.name.includes('love-story-cover'));
        if (images.length > 0) {
          // 找到当前显示的图片在 Supabase 中的 URL
          const sortedImages = images.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          // 如果有多张图片，保存当前选中的那张
          if (sortedImages.length > currentImageIndex) {
            localStorage.setItem('loveStoryOriginalCoverImage_url', sortedImages[currentImageIndex].url);
          }
        }
        
        // 保存当前选中的图片索引
        localStorage.setItem('loveStorySelectedCoverIndex', currentImageIndex.toString());
      }
      
      toast({
        title: "Cover saved",
        description: "Moving to the next step..."
      });
      
      // 导航到下一步
      navigate('/create/love/love-story/debug-prompts');
    } catch (error) {
      console.error('Error in handleContinue:', error);
      toast({
        title: "Error processing cover",
        description: "There was a problem rendering or uploading your cover.",
        variant: "destructive"
      });
    }
  };

  // 获取收件人名称 - 这将作为主要角色名称显示
  const recipientName = localStorage.getItem('loveStoryPersonName') || 'SIERRA';

  // 获取当前选中的样式
  const currentStyle = coverStyles.find(style => style.id === selectedStyle) || coverStyles[0];

  // 当前显示的封面图片
  const currentCoverImage = coverImages.length > 0 ? coverImages[currentImageIndex] : undefined;

  return (
    <WizardStep 
      title="Design Your Book Cover" 
      description=""
      previousStep="/create/love/love-story/ideas" 
      currentStep={5} 
      totalSteps={7} 
      onNextClick={handleContinue}
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative max-w-xl mx-auto">
          {/* 左箭头 */}
          {coverImages.length > 1 && (
            <button 
              onClick={handlePrevImage}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -ml-10 bg-white/80 rounded-full p-2 shadow-md z-10 hover:bg-white transition-colors"
              disabled={isGeneratingCover}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          
          {/* 封面预览 */}
          <LoveStoryCoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            recipientName={recipientName}
            coverImage={currentCoverImage}
            selectedFont={currentStyle.font}
            style={currentStyle}
          />
          
          {/* 右箭头 */}
          {coverImages.length > 1 && (
            <button 
              onClick={handleNextImage}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 -mr-10 bg-white/80 rounded-full p-2 shadow-md z-10 hover:bg-white transition-colors"
              disabled={isGeneratingCover}
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}
          
          {/* 点状指示器 */}
          {coverImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {coverImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentImageIndex 
                      ? 'bg-[#FF7F50]' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  } transition-colors`}
                  aria-label={`View cover option ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <Button
              variant="secondary"
              onClick={handleEditCover}
              disabled={isGeneratingCover}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit cover
            </Button>
            <Button
              variant="secondary"
              onClick={handleRegenerateCover}
              disabled={isGeneratingCover}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingCover ? 'animate-spin' : ''}`} />
              {isGeneratingCover ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
        </div>
        
        {/* 样式选择器 */}
        <div className="mt-10">
          <div className="flex justify-center gap-4 flex-wrap">
            {coverStyles.map((style) => (
              <div 
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`relative w-24 h-24 rounded-full cursor-pointer flex items-center justify-center ${
                  selectedStyle === style.id ? 'ring-2 ring-offset-2 ring-[#FF7F50]' : ''
                }`}
                style={{
                  backgroundColor: style.background,
                  border: style.borderColor ? `3px solid ${style.borderColor}` : 'none'
                }}
              >
                <span 
                  className="text-4xl font-bold"
                  style={{ 
                    fontFamily: style.font === 'playfair' ? 'serif' 
                      : style.font === 'montserrat' ? 'sans-serif' 
                      : style.font === 'comic-sans' ? 'cursive' 
                      : style.font === 'didot' ? 'serif' 
                      : 'serif',
                    color: style.subtitleColor
                  }}
                >
                  Aa
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryCoverStep;