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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
    font: 'playfair'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    background: '#F5F5DC',
    titleColor: '#8B4513',
    subtitleColor: '#A0522D',
    authorColor: '#8B4513',
    font: 'playfair'
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
    titleColor: '#744231',
    subtitleColor: '#744231',
    authorColor: '#744231',
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
  }
];

const LoveStoryCoverStep = () => {
  // 基本状态
  const [authorName, setAuthorName] = useState<string>('Timi Bliss');
  const [recipientName, setRecipientName] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('classic');
  const [textTone, setTextTone] = useState<string>('romantic');
  
  // 标题状态，合并为一个结构
  const [titleData, setTitleData] = useState({
    mainTitle: '',
    subTitle: '',
    thirdLine: '',
    fullTitle: 'THE MAGIC IN'
  });
  
  // 封面图片状态
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [supabaseImages, setSupabaseImages] = useState<any[]>([]);
  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState<boolean>(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 从localStorage获取基本信息
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    const savedStyle = localStorage.getItem('loveStoryCoverStyle');
    const savedTone = localStorage.getItem('loveStoryTone');
    const savedRecipientName = localStorage.getItem('loveStoryPersonName');
    const savedImageIndex = localStorage.getItem('loveStorySelectedCoverIndex');
    
    // 从Supabase获取已保存的封面图片
    loadCoverImagesFromSupabase();
    
    // 设置基本信息
    if (savedAuthorName) setAuthorName(savedAuthorName);
    if (savedTone) setTextTone(savedTone);
    if (savedStyle) setSelectedStyle(savedStyle);
    if (savedRecipientName) setRecipientName(savedRecipientName);
    if (savedImageIndex) setCurrentImageIndex(parseInt(savedImageIndex));
    
    // 获取故事idea
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    
    if (savedIdeas && savedIdeaIndex) {
      try {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          // 默认标题
          setTitleData(prev => ({ 
            ...prev, 
            fullTitle: 'THE MAGIC IN',
            mainTitle: 'THE MAGIC IN',
            subTitle: savedRecipientName || ''
          }));
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
    setIsEditTitleDialogOpen(true);
  };

  // 修改处理标题选择的函数
  const handleTitleSelect = (title: string) => {
    // 解析标题，分为三部分
    let mainPart = '';
    let subPart = '';
    let thirdPart = '';
    
    // 根据具体标题模板进行精确拆分
    if (title === `${recipientName}'s amazing adventure`) {
      mainPart = `${recipientName}'s`;
      subPart = 'amazing adventure';
      thirdPart = '';
    } else if (title === `${authorName}'s wonderful ${recipientName}`) {
      mainPart = `${authorName}'s`;
      subPart = 'wonderful';
      thirdPart = recipientName;
    } else if (title === `THE MAGIC IN ${recipientName}`) {
      mainPart = 'THE MAGIC IN';
      subPart = recipientName;
      thirdPart = '';
    } else if (title === `${recipientName} I love you`) {
      mainPart = recipientName;
      subPart = 'I love you';
      thirdPart = '';
    } else if (title === `The little book of ${recipientName}`) {
      mainPart = 'The little book of';
      subPart = recipientName;
      thirdPart = '';
    } else {
      // 默认处理
      const parts = title.split(' ');
      if (parts.length > 3) {
        mainPart = parts.slice(0, Math.ceil(parts.length / 3)).join(' ');
        subPart = parts.slice(Math.ceil(parts.length / 3), Math.ceil(parts.length * 2 / 3)).join(' ');
        thirdPart = parts.slice(Math.ceil(parts.length * 2 / 3)).join(' ');
      } else if (parts.length > 2) {
        mainPart = parts[0];
        subPart = parts[1];
        thirdPart = parts[2];
      } else if (parts.length > 1) {
        mainPart = parts[0];
        subPart = parts[1];
        thirdPart = '';
      } else {
        mainPart = title;
        subPart = '';
        thirdPart = '';
      }
    }
    
    console.log('标题已分割为:', { mainPart, subPart, thirdPart });
    
    // 更新标题状态
    setTitleData({
      mainTitle: mainPart,
      subTitle: subPart,
      thirdLine: thirdPart, 
      fullTitle: title
    });
    
    // 仍然保存完整标题到localStorage（其他地方可能需要用到）
    localStorage.setItem('loveStoryCoverTitle', title);
    
    setIsEditTitleDialogOpen(false);
    
    toast({
      title: "Title updated",
      description: "Your book title has been updated"
    });
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
  
  // 在renderCoverToCanvas函数中调整尺寸
  const renderCoverToCanvas = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个临时的Canvas - 尺寸调整为8.625" x 8.75"的比例
        // 考虑到600dpi，尺寸约为5175 x 5250像素，但为了性能，我们缩小比例
        const canvas = document.createElement('canvas');
        canvas.width = 2588; // 8.625英寸 * 300dpi（更合理的分辨率）
        canvas.height = 2625; // 8.75英寸 * 300dpi
        
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
            
            // 计算居中位置 - 图片上移到与LoveStoryCoverPreview一致的位置
            const x = (canvas.width - drawWidth) / 2;
            const y = canvas.height * 0.35;  // 图片位置上移
            
            // 绘制人物图像
            ctx.drawImage(personImgLoaded, x, y, drawWidth, drawHeight);
            
            // 绘制标题文本
            ctx.textAlign = 'center';
            
            // 使用状态中的标题数据
            const { mainTitle, subTitle, thirdLine, fullTitle } = titleData;
            
            // 主标题
            ctx.fillStyle = currentStyle.titleColor;
            const titleFontSize = canvas.width * 0.06;
            
            // 如果有主副标题，则绘制多行
            if (mainTitle) {
              // Playful, Modern, Elegant样式使用统一布局
              if (currentStyle.id === 'playful' || currentStyle.id === 'modern' || currentStyle.id === 'elegant') {
                // 放大字体并绘制主标题
                const mainTitleFontSize = titleFontSize * 1.2; // 增大主标题字体
                
                // 根据样式选择不同的字体
                if (currentStyle.id === 'playful') {
                  ctx.font = `bold ${mainTitleFontSize}px cursive`;
                } else if (currentStyle.id === 'modern') {
                  ctx.fillStyle = '#FFFFFF'; // Modern样式使用白色字体
                  ctx.font = `bold ${mainTitleFontSize}px 'Palatino', serif`;
                } else if (currentStyle.id === 'elegant') {
                  ctx.fillStyle = '#FFFFFF'; // Elegant样式使用白色字体
                  ctx.font = `bold ${mainTitleFontSize}px 'Comic Sans MS', cursive`;
                }
                
                // 只处理特定的三行标题模式：${authorName}'s wonderful ${recipientName}
                if (thirdLine && mainTitle.includes("'s") && subTitle === 'wonderful') {
                  // 三行标题位置，增加间距，整体下移0.015
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * (0.16 + 0.015));
                  
                  const subTitleFontSize = titleFontSize * 1.1;
                  if (currentStyle.id === 'playful') {
                    ctx.font = `bold ${subTitleFontSize}px cursive`;
                  } else if (currentStyle.id === 'modern') {
                    ctx.font = `bold ${subTitleFontSize}px 'Palatino', serif`;
                  } else if (currentStyle.id === 'elegant') {
                    ctx.font = `bold ${subTitleFontSize}px 'Comic Sans MS', cursive`;
                  }
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * (0.26 + 0.015));
                  ctx.fillText(thirdLine, canvas.width / 2, canvas.height * (0.36 + 0.015));
                } else if (thirdLine) {
                  // 其他三行标题情况，增加间距，整体下移0.015
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * (0.16 + 0.015));
                  
                  const subTitleFontSize = titleFontSize * 1.1;
                  if (currentStyle.id === 'playful') {
                    ctx.font = `bold ${subTitleFontSize}px cursive`;
                  } else if (currentStyle.id === 'modern') {
                    ctx.font = `bold ${subTitleFontSize}px 'Palatino', serif`;
                  } else if (currentStyle.id === 'elegant') {
                    ctx.font = `bold ${subTitleFontSize}px 'Comic Sans MS', cursive`;
                  }
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * (0.26 + 0.015));
                  ctx.fillText(thirdLine, canvas.width / 2, canvas.height * (0.36 + 0.015));
                } else {
                  // 两行标题的情况位置，整体下移0.01
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * (0.215 + 0.01));
                  
                  // 绘制副标题，增加间距
                  const subTitleFontSize = titleFontSize * 1.1;
                  if (currentStyle.id === 'playful') {
                    ctx.font = `bold ${subTitleFontSize}px cursive`;
                  } else if (currentStyle.id === 'modern') {
                    ctx.font = `bold ${subTitleFontSize}px 'Palatino', serif`;
                  } else if (currentStyle.id === 'elegant') {
                    ctx.font = `bold ${subTitleFontSize}px 'Comic Sans MS', cursive`;
                  }
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * (0.315 + 0.01)); 
                }
              } 
              // Classic和Vintage样式也使用相同布局
              else if (currentStyle.id === 'classic' || currentStyle.id === 'vintage') {
                const mainTitleFontSize = titleFontSize * 1.2; // 增大主标题字体
                ctx.font = `bold ${mainTitleFontSize}px ${getFontFamily(currentStyle.font)}`;
                
                // 只处理特定的三行标题模式：${authorName}'s wonderful ${recipientName}
                if (thirdLine && mainTitle.includes("'s") && subTitle === 'wonderful') {
                  // 使用与其他样式相同的位置
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * (0.16 + 0.015));
                  
                  const subTitleFontSize = titleFontSize * 1.1;
                  ctx.font = `bold ${subTitleFontSize}px ${getFontFamily(currentStyle.font)}`;
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * (0.26 + 0.015));
                  ctx.fillText(thirdLine, canvas.width / 2, canvas.height * (0.36 + 0.015));
                } else if (thirdLine) {
                  // 其他三行标题情况
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * (0.16 + 0.015));
                  
                  const subTitleFontSize = titleFontSize * 1.1;
                  ctx.font = `bold ${subTitleFontSize}px ${getFontFamily(currentStyle.font)}`;
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * (0.26 + 0.015));
                  ctx.fillText(thirdLine, canvas.width / 2, canvas.height * (0.36 + 0.015));
                } else {
                  // 两行标题的情况
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * (0.215 + 0.01));
                  
                  const subTitleFontSize = titleFontSize * 1.1;
                  ctx.font = `bold ${subTitleFontSize}px ${getFontFamily(currentStyle.font)}`;
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * (0.315 + 0.01));
                }
              } else {
                // 其他样式使用标准字体族但仍保持多行布局
                ctx.font = `bold ${titleFontSize}px ${getFontFamily(currentStyle.font)}`;
                ctx.fillText(mainTitle, canvas.width / 2, canvas.height * (0.09 + 0.015));
                
                ctx.font = `bold ${titleFontSize * 0.9}px ${getFontFamily(currentStyle.font)}`;
                
                if (thirdLine) {
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * (0.19 + 0.015));
                  ctx.fillText(thirdLine, canvas.width / 2, canvas.height * (0.29 + 0.015));
                } else {
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * (0.21 + 0.01));
                }
              }
            } else {
              // 如果没有分开的标题，则使用完整标题
              if (currentStyle.id === 'modern') {
                // 使用白色字体和更手写风格的字体
                ctx.fillStyle = '#FFFFFF';
                const modernTitleFontSize = titleFontSize * 1.3;
                ctx.font = `bold ${modernTitleFontSize}px 'Palatino', serif`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * (0.125 + 0.01));
              } else if (currentStyle.id === 'elegant') {
                // 使用白色字体和手写风格的字体
                ctx.fillStyle = '#FFFFFF';
                const elegantTitleFontSize = titleFontSize * 1.3;
                ctx.font = `bold ${elegantTitleFontSize}px 'Comic Sans MS', cursive`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * (0.125 + 0.01));
              } else {
                // 其他样式使用默认字体
                ctx.font = `bold ${titleFontSize}px ${getFontFamily(currentStyle.font)}`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * (0.125 + 0.01));
              }
            }
            
            // 作者名
            if (currentStyle.id === 'modern') {
              // Modern样式
              ctx.fillStyle = '#FFFFFF';
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px 'Palatino', serif`;
              ctx.fillText(`Written by ${authorName}`, canvas.width * 0.85, canvas.height * 0.95);
            } else if (currentStyle.id === 'elegant') {
              // Elegant样式
              ctx.fillStyle = '#FFFFFF';
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px 'Comic Sans MS', cursive`;
              ctx.fillText(`Written by ${authorName}`, canvas.width * 0.85, canvas.height * 0.95);
            } else if (currentStyle.id === 'classic' || currentStyle.id === 'vintage') {
              // Classic和Vintage样式
              ctx.fillStyle = currentStyle.authorColor;
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px ${getFontFamily(currentStyle.font)}`;
              ctx.fillText(`Written by ${authorName}`, canvas.width * 0.85, canvas.height * 0.95);
            } else if (currentStyle.id === 'playful') {
              // Playful样式
              ctx.fillStyle = currentStyle.authorColor;
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px ${getFontFamily(currentStyle.font)}`;
              ctx.fillText(`Written by ${authorName}`, canvas.width * 0.85, canvas.height * 0.95);
            } else {
              // 其他样式
              ctx.fillStyle = currentStyle.authorColor;
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px ${getFontFamily(currentStyle.font)}`;
              ctx.fillText(`Written by ${authorName}`, canvas.width * 0.75, canvas.height * 0.9);
            }
            
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
  
  // 修改renderBackCoverToCanvas函数
  const renderBackCoverToCanvas = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个临时的Canvas - 尺寸调整为8.625" x 8.75"的比例
        const canvas = document.createElement('canvas');
        canvas.width = 2588; // 8.625英寸 * 300dpi
        canvas.height = 2625; // 8.75英寸 * 300dpi
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // 获取当前样式
        const style = coverStyles.find(s => s.id === selectedStyle) || coverStyles[0];
        
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
        
        // 开始加载背景
        const loadBackground = async () => {
          try {
            // 根据样式选择背景图片
            let backgroundImgPromise: Promise<HTMLImageElement> | null = null;
            
            if (style.id === 'modern') {
              backgroundImgPromise = loadBackgroundImage(blueTextureBackground);
            } else if (style.id === 'playful') {
              backgroundImgPromise = loadBackgroundImage(greenLeafBackground);
            } else if (style.id === 'elegant') {
              backgroundImgPromise = loadBackgroundImage(rainbowBackground);
            }
            
            // 等待背景图片加载完成
            const backgroundImgLoaded = await (backgroundImgPromise ? backgroundImgPromise : Promise.resolve(null));
            
            // 绘制背景
            if (backgroundImgLoaded) {
              // 使用加载的背景图片
              ctx.drawImage(backgroundImgLoaded, 0, 0, canvas.width, canvas.height);
              
              // 对于某些背景，添加叠加层以增强效果
              if (style.id === 'modern') {
                // 添加深蓝色半透明叠加层，使图片更暗
                ctx.fillStyle = 'rgba(10, 26, 63, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'playful') {
                // 添加蓝色半透明叠加层
                ctx.fillStyle = 'rgba(74, 137, 220, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            } else {
              // 使用样式的纯色背景
              if (style.id === 'classic' || style.id === 'vintage') {
                ctx.fillStyle = style.background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'modern') {
                // 如果无法加载modern背景图片，使用深蓝色
                ctx.fillStyle = '#0a1a3f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'playful') {
                // 如果无法加载playful背景图片，使用蓝色
                ctx.fillStyle = '#4A89DC';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else {
                // 默认白色背景
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            }
            
            // 转换为图像
            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            resolve(imageData);
          } catch (error) {
            reject(error);
          }
        };
        
        // 开始加载背景
        loadBackground();
      } catch (error) {
        reject(error);
      }
    });
  };

  // 修改renderSpineToCanvas函数
  const renderSpineToCanvas = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个临时的Canvas - 宽度为0.25英寸，高度与封面一致
        const canvas = document.createElement('canvas');
        canvas.width = 75; // 0.25英寸 * 300dpi = 75px
        canvas.height = 2625; // 8.75英寸 * 300dpi = 2625px，与封面高度一致
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // 获取当前样式
        const style = coverStyles.find(s => s.id === selectedStyle) || coverStyles[0];
        
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
        
        // 开始加载背景
        const loadBackground = async () => {
          try {
            // 根据样式选择背景图片
            let backgroundImgPromise: Promise<HTMLImageElement> | null = null;
            
            if (style.id === 'modern') {
              backgroundImgPromise = loadBackgroundImage(blueTextureBackground);
            } else if (style.id === 'playful') {
              backgroundImgPromise = loadBackgroundImage(greenLeafBackground);
            } else if (style.id === 'elegant') {
              backgroundImgPromise = loadBackgroundImage(rainbowBackground);
            }
            
            // 等待背景图片加载完成
            const backgroundImgLoaded = await (backgroundImgPromise ? backgroundImgPromise : Promise.resolve(null));
            
            // 绘制背景
            if (backgroundImgLoaded) {
              // 使用加载的背景图片 - 对于书脊，我们需要截取中间部分
              const sourceX = backgroundImgLoaded.width / 2 - (canvas.width / 2);
              ctx.drawImage(backgroundImgLoaded, 
                sourceX, 0, canvas.width, backgroundImgLoaded.height,  // 源
                0, 0, canvas.width, canvas.height);  // 目标
              
              // 对于某些背景，添加叠加层以增强效果
              if (style.id === 'modern') {
                // 添加深蓝色半透明叠加层，使图片更暗
                ctx.fillStyle = 'rgba(10, 26, 63, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'playful') {
                // 添加蓝色半透明叠加层
                ctx.fillStyle = 'rgba(74, 137, 220, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            } else {
              // 使用样式的纯色背景
              if (style.id === 'classic' || style.id === 'vintage') {
                ctx.fillStyle = style.background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'modern') {
                // 如果无法加载modern背景图片，使用深蓝色
                ctx.fillStyle = '#0a1a3f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'playful') {
                // 如果无法加载playful背景图片，使用蓝色
                ctx.fillStyle = '#4A89DC';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else {
                // 默认白色背景
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            }
            
            // 添加书脊文字 - 竖直显示书名
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2); // 旋转90度
            
            // 设置文本样式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = style.titleColor;
            ctx.font = `bold 24px ${style.font || 'serif'}`;
            
            // 绘制竖直文字
            const spineText = titleData.mainTitle || titleData.fullTitle;
            ctx.fillText(spineText, 0, 0);
            
            // 还原canvas状态
            ctx.restore();
            
            // 转换为图像
            const imageData = canvas.toDataURL('image/jpeg', 0.9);
            resolve(imageData);
          } catch (error) {
            reject(error);
          }
        };
        
        // 开始加载背景
        loadBackground();
      } catch (error) {
        reject(error);
      }
    });
  };

  // 修改handleContinue函数，添加渲染和上传背景图片的功能
  const handleContinue = async () => {
    try {
      toast({
        title: "Processing cover",
        description: "Rendering and uploading your cover images..."
      });
      
      // 保存当前选中的封面图片到 localStorage
      if (coverImages.length > 0 && currentImageIndex >= 0 && currentImageIndex < coverImages.length) {
        const selectedCoverImage = coverImages[currentImageIndex];
        localStorage.setItem('loveStorySelectedCoverImage', selectedCoverImage);
        
        // 渲染封面到Canvas并获取图像数据
        const canvasImageData = await renderCoverToCanvas();
        
        // 同时渲染纯背景的封底
        const backCoverImageData = await renderBackCoverToCanvas();
        
        // 渲染书脊
        const spineImageData = await renderSpineToCanvas();
        
        // 生成时间戳，确保文件名唯一
        const timestamp = Date.now();
        const newFilename = `love-cover-${timestamp}`;
        const backCoverFilename = `love-back-cover-${timestamp}`;
        const spineFilename = `love-spine-${timestamp}`;
        
        // 上传封面到Supabase
        const storageUrl = await uploadImageToStorage(
          canvasImageData,
          'images',
          newFilename
        );
        
        // 上传封底到Supabase
        const backCoverStorageUrl = await uploadImageToStorage(
          backCoverImageData,
          'images',
          backCoverFilename
        );
        
        // 上传书脊到Supabase
        const spineStorageUrl = await uploadImageToStorage(
          spineImageData,
          'images',
          spineFilename
        );
        
        // 保存URL到localStorage
        localStorage.setItem('loveStorySelectedCoverImage_url', storageUrl);
        localStorage.setItem('loveStoryCoverImageCanvas', canvasImageData);
        localStorage.setItem('loveStoryBackCoverImage_url', backCoverStorageUrl);
        localStorage.setItem('loveStorySpineImage_url', spineStorageUrl);
        
        // 清除Supabase中的旧封面图片
        try {
          // 获取最新的图片列表
          const allImages = await getAllImagesFromStorage('images');
          
          // 过滤出所有需要删除的旧图片
          const coverImagesToDelete = allImages.filter(img => 
            (img.name.includes('love-cover') || 
             img.name.includes('love-story-cover-canvas') || 
             img.name.includes('love-back-cover') ||
             img.name.includes('love-spine')) && 
            !img.name.includes(newFilename) && 
            !img.name.includes(backCoverFilename) &&
            !img.name.includes(spineFilename)
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
      }
      
      // 保存标题数据到localStorage - 移到if语句外，确保始终执行
      localStorage.setItem('loveStoryCoverTitle', titleData.mainTitle || titleData.fullTitle);
      localStorage.setItem('loveStoryCoverSubtitle', titleData.subTitle || '');
      localStorage.setItem('loveStoryCoverThirdLine', titleData.thirdLine || '');
      
      // 生成并上传版权信息页面
      try {
        // 获取最新的图片列表
        const allImages = await getAllImagesFromStorage('images');
        
        // 导入并调用renderAndUploadEndingImage函数
        const { renderAndUploadEndingImage } = await import('./utils/canvasUtils');
        const endingPageUrl = await renderAndUploadEndingImage(allImages);
        
        // 保存URL到localStorage
        localStorage.setItem('loveStoryEndingPage_url', endingPageUrl);
        
        console.log('Successfully generated and uploaded ending page');
      } catch (endingError) {
        console.error('Error generating ending page:', endingError);
        // 继续处理，即使生成失败
      }
      
      toast({
        title: "Cover processed successfully",
        description: "Your cover has been saved. Proceeding to the next step..."
      });
      
      // 导航到下一步 - 移到if语句外，确保始终执行
      navigate('/create/love/love-story/generate');
    } catch (error) {
      console.error('Error processing cover:', error);
      toast({
        title: "Error",
        description: "Failed to process cover. Please try again.",
        variant: "destructive"
      });
    }
  };

  // 获取当前选中的样式
  const currentStyle = coverStyles.find(style => style.id === selectedStyle) || coverStyles[0];

  // 当前显示的封面图片
  const currentCoverImage = coverImages.length > 0 ? coverImages[currentImageIndex] : undefined;

  return (
    <WizardStep 
      title="Design Your Love Story Cover"
      description=""
      previousStep="/create/love/love-story/ideas" 
      currentStep={6} 
      totalSteps={8} 
      onNextClick={handleContinue}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* 封面预览 */}
        <div className="relative mb-5">
          
          {/* 封面图片生成中的加载状态 */}
          {isGeneratingCover && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 rounded-lg">
              <div className="bg-white p-5 rounded-md shadow-lg text-center">
                <RefreshCw className="animate-spin mx-auto mb-3 h-8 w-8 text-[#FF7F50]" />
                <p className="text-gray-800">Generating cover...</p>
              </div>
            </div>
          )}
          
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
          
          {/* 封面预览组件 - 直接传递titleData而非使用localStorage */}
          <LoveStoryCoverPreview
            titleData={titleData}
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
        </div>
          
        {/* 操作按钮和指示器 - 移动到预览区域下方 */}
        <div className="mb-8">
          {/* 点状指示器 */}
          {coverImages.length > 1 && (
            <div className="flex justify-center gap-2 mb-4">
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
          <div className="flex justify-center gap-2">
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
        
        {/* 封面样式选择 */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Choose a Cover Style</h2>
          <div className="flex justify-center space-x-8">
            {coverStyles.map(style => (
              <div 
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`relative w-24 h-24 rounded-full cursor-pointer flex items-center justify-center ${
                  selectedStyle === style.id ? 'ring-2 ring-offset-2 ring-[#FF7F50]' : ''
                }`}
                style={{
                  backgroundColor: style.background,
                  border: 'none'
                }}
              >
                <span className="text-center text-xs">{style.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 添加标题选择对话框 */}
        <Dialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose a Book Title</DialogTitle>
              <DialogDescription>
                Select a title for your love story book
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-3">
                <div 
                  onClick={() => handleTitleSelect(`${recipientName}'s amazing adventure`)}
                  className="flex items-center p-3 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{recipientName}'s amazing adventure</h4>
                    <p className="text-sm text-gray-500 mt-1">{recipientName}'s 在第一行, amazing adventure 在第二行</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleTitleSelect(`${authorName}'s wonderful ${recipientName}`)}
                  className="flex items-center p-3 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{authorName}'s wonderful {recipientName}</h4>
                    <p className="text-sm text-gray-500 mt-1">{authorName}'s 在第一行, wonderful 在第二行, {recipientName} 在第三行</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleTitleSelect(`THE MAGIC IN ${recipientName}`)}
                  className="flex items-center p-3 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">THE MAGIC IN {recipientName}</h4>
                    <p className="text-sm text-gray-500 mt-1">THE MAGIC IN 在第一行, {recipientName} 在第二行</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleTitleSelect(`${recipientName} I love you`)}
                  className="flex items-center p-3 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{recipientName} I love you</h4>
                    <p className="text-sm text-gray-500 mt-1">{recipientName} 在第一行, I love you 在第二行</p>
                  </div>
                </div>
                
                <div 
                  onClick={() => handleTitleSelect(`The little book of ${recipientName}`)}
                  className="flex items-center p-3 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">The little book of {recipientName}</h4>
                    <p className="text-sm text-gray-500 mt-1">The little book of 在第一行, {recipientName} 在第二行</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsEditTitleDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </WizardStep>
  );
};

export default LoveStoryCoverStep;