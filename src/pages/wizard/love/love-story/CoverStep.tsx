import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getClientId, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';
import { useRenderContext } from '@/context/RenderContext';
import { useFontContext } from '@/context/FontContext';
import { useImageLoader } from '@/components/cover-generator/hooks/useImageLoader';
// 导入背景图片
import blueTextureBackground from '../../../../assets/Generated Image March 15, 2025 - 3_12PM_LE_upscale_balanced_x4.jpg';
import greenLeafBackground from '../../../../assets/leaves.jpg';
import rainbowBackground from '../../../../assets/rainbow2.jpg';
import heartCoverBackground from '../../../../assets/heart_cover_8.5in_highres.png';
import heartBackBackground from '../../../../assets/heartback.png';
import drawSnowNightBackground from '../../../../components/cover-generator/SnowNightBackground';
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
  backgroundImage?: string;
}

// 预定义的封面样式
const coverStyles: CoverStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    background: '#f5f5f0',
    titleColor: '#C75B7D',
    subtitleColor: '#C75B7D',
    authorColor: '#C75B7D',
    font: 'patrick-hand',
    backgroundImage: heartCoverBackground
  },
  {
    id: 'vintage',
    name: 'Vintage',
    background: 'linear-gradient(135deg, #f8e9d6 0%, #e8c39e 100%)',
    titleColor: '#8b4513',
    subtitleColor: '#8b4513',
    authorColor: '#333333',
    font: 'freckle-face',
    backgroundImage: ''
  },
  {
    id: 'modern',
    name: 'Modern',
    background: '#000000',
    titleColor: '#ffffff', // 将标题颜色改为白色
    subtitleColor: '#ffffff',
    authorColor: '#ffffff', // 将作者名颜色也改为白色
    font: 'amatic-sc',
    backgroundImage: blueTextureBackground
  },
  {
    id: 'playful',
    name: 'Playful',
    background: '#4A89DC',
    titleColor: '#2A4C08', // 将标题颜色改为折中的深绿色
    subtitleColor: '#FFFFFF',
    authorColor: '#2A4C08', // 将作者名颜色改为折中的深绿色
    font: 'caveat',
    backgroundImage: greenLeafBackground
  },
  {
    id: 'elegant',
    name: 'Elegant',
    background: '#FFFFFF',
    titleColor: '#FDF0F3', // 将标题颜色改为更接近白色的淡粉红色
    subtitleColor: '#FDF0F3', // 将副标题颜色改为更接近白色的淡粉红色
    authorColor: '#FDF0F3', // 将作者名颜色改为更接近白色的淡粉红色
    font: 'luckiest-guy',
    backgroundImage: rainbowBackground
  }
];

const LoveStoryCoverStep = () => {
  // 基本状态
  const [authorName, setAuthorName] = useState<string>('Timi Bliss');
  const [recipientName, setRecipientName] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('classic');
  const [textTone, setTextTone] = useState<string>('romantic');

  // 标题状态，合并为一个结构，默认使用第一个选项
  const defaultTitle = "Mat's amazing adventure";
  const [titleData, setTitleData] = useState({
    mainTitle: "Mat's",
    subTitle: "amazing adventure",
    thirdLine: '',
    fullTitle: defaultTitle
  });

  // 背景图片和字体加载状态
  const [backgroundsLoaded, setBackgroundsLoaded] = useState<boolean>(false);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);
  const [resourcesLoaded, setResourcesLoaded] = useState<boolean>(false);
  // 添加初始加载状态，确保在第一次渲染时就显示加载界面
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // 预加载所有背景图片
  const blueTexture = useImageLoader(blueTextureBackground);
  const greenLeaf = useImageLoader(greenLeafBackground);
  const rainbow = useImageLoader(rainbowBackground);
  const heartCover = useImageLoader(heartCoverBackground);
  const heartBack = useImageLoader(heartBackBackground);

  // 将默认标题保存到localStorage
  useEffect(() => {
    if (!localStorage.getItem('loveStoryCoverTitle')) {
      localStorage.setItem('loveStoryCoverTitle', defaultTitle);
    }
  }, []);

  // 封面图片状态
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [supabaseImages, setSupabaseImages] = useState<any[]>([]);
  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState<boolean>(false);

  // 渲染上下文
  const {
    isRenderingCover,
    setIsRenderingCover,
    coverRenderComplete,
    setCoverRenderComplete,
    setCoverImageUrl,
    setBackCoverImageUrl,
    setSpineImageUrl
  } = useRenderContext();

  const { toast } = useToast();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 检查MomentsStep图片是否有变化
  const checkPartnerPhotoChanged = () => {
    // 获取当前的合作伙伴照片
    const currentPartnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');

    // 获取上次使用的合作伙伴照片的哈希值
    const lastUsedPhotoHash = localStorage.getItem('loveStoryLastUsedPhotoHash');

    // 如果当前照片存在
    if (currentPartnerPhoto) {
      // 创建一个简单的哈希值（使用字符串的前100个字符）
      const simpleHash = currentPartnerPhoto.substring(0, 100);

      // 如果哈希值不同或者没有上次使用的哈希值，说明照片已更改
      if (!lastUsedPhotoHash || lastUsedPhotoHash !== simpleHash) {
        console.log('检测到合作伙伴照片变更，需要重新生成封面');
        // 保存新的哈希值
        localStorage.setItem('loveStoryLastUsedPhotoHash', simpleHash);
        return true;
      }
    }

    return false;
  };

  // 使用FontContext中的字体加载状态
  const { fontsLoaded: fontContextLoaded, fontStatus } = useFontContext();

  // 检查背景图片是否已加载完成
  useEffect(() => {
    const checkBackgroundsLoaded = async () => {
      try {
        // 等待所有背景图片加载完成
        await Promise.all([
          blueTexture?.loaded,
          greenLeaf?.loaded,
          rainbow?.loaded,
          heartCover?.loaded,
          heartBack?.loaded
        ].filter(Boolean));

        console.log('All background images loaded successfully');
        setBackgroundsLoaded(true);
      } catch (error) {
        console.error('Error loading background images:', error);
        // 即使有错误也设置为已加载，以便应用可以继续
        setBackgroundsLoaded(true);
      }
    };

    checkBackgroundsLoaded();
  }, [blueTexture, greenLeaf, rainbow, heartCover, heartBack]);

  // 添加字体加载状态检查和手动重试机制
  useEffect(() => {
    console.log('CoverStep - Font status:', fontStatus, 'Fonts loaded from context:', fontContextLoaded);

    // 如果字体已加载完成或加载状态为error（表示已尝试加载但失败），设置字体加载状态为true
    if (fontStatus === 'loaded' || (fontStatus === 'error' && fontContextLoaded)) {
      console.log('Fonts are considered loaded (either successfully or with fallbacks)');
      setFontsLoaded(true);
    } else if (fontStatus === 'error' && selectedStyle) {
      // 如果字体加载失败，尝试手动加载当前样式的字体
      console.log('Attempting to manually load font for style:', selectedStyle);

      // 根据样式选择字体
      let fontToLoad = '';
      switch (selectedStyle) {
        case 'classic':
          fontToLoad = "'Patrick Hand', cursive";
          break;
        case 'vintage':
          fontToLoad = "'Freckle Face', cursive";
          break;
        case 'modern':
          fontToLoad = "'Amatic SC', cursive";
          break;
        case 'playful':
          fontToLoad = "'Caveat', cursive";
          break;
        case 'elegant':
          fontToLoad = "'Luckiest Guy', cursive";
          break;
      }

      if (fontToLoad && typeof document !== 'undefined' && 'fonts' in document) {
        // 尝试加载字体
        const fontSizes = [12, 24, 36, 48, 64, 72, 96, 120, 144];
        const fontWeights = ['normal', 'bold', 'italic'];

        Promise.all(
          fontSizes.flatMap(size =>
            fontWeights.map(weight =>
              document.fonts.load(`${weight} ${size}px ${fontToLoad}`)
            )
          )
        ).then(() => {
          console.log(`Manually loaded font ${fontToLoad} for style ${selectedStyle}`);
          setFontsLoaded(true);
        }).catch(err => {
          console.error(`Failed to manually load font ${fontToLoad}:`, err);
          // 即使字体加载失败，也设置为已加载，以便应用可以继续使用后备字体
          setFontsLoaded(true);
        });
      } else {
        // 如果无法加载字体，也设置为已加载，以便应用可以继续
        setFontsLoaded(true);
      }
    } else if (fontStatus === 'loading') {
      // 字体正在加载中，等待加载完成
      console.log('Fonts are still loading...');
      setFontsLoaded(false);
    }
  }, [fontStatus, fontContextLoaded, selectedStyle]);

  // 综合判断所有资源是否加载完成
  useEffect(() => {
    if (backgroundsLoaded && fontsLoaded) {
      console.log('All resources (backgrounds and fonts) loaded successfully');

      // 使用短延迟确保平滑过渡，避免闪烁
      const timer = setTimeout(() => {
        setResourcesLoaded(true);
        // 资源加载完成后，取消初始加载状态
        setInitialLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResourcesLoaded(false);
    }
  }, [backgroundsLoaded, fontsLoaded]);

  useEffect(() => {
    // 从localStorage获取基本信息
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    const savedStyle = localStorage.getItem('loveStoryCoverStyle');
    const savedTone = localStorage.getItem('loveStoryTone');
    const savedRecipientName = localStorage.getItem('loveStoryPersonName');
    const savedImageIndex = localStorage.getItem('loveStorySelectedCoverIndex');
    const savedCoverTitle = localStorage.getItem('loveStoryCoverTitle');

    // 设置基本信息
    if (savedAuthorName) setAuthorName(savedAuthorName);
    if (savedTone) setTextTone(savedTone);
    if (savedStyle) setSelectedStyle(savedStyle);
    if (savedRecipientName) setRecipientName(savedRecipientName);
    if (savedImageIndex) setCurrentImageIndex(parseInt(savedImageIndex));

    // 检查合作伙伴照片是否有变化，如果有则自动重新生成封面
    const photoChanged = checkPartnerPhotoChanged();
    
    if (photoChanged) {
      // 设置生成状态为true
      setIsGeneratingCover(true);
      // 延迟执行，确保其他状态已加载
      setTimeout(() => {
        handleRegenerateCover(true);
      }, 1000);
    } else {
      // 如果不需要重新生成，则加载已有的封面图片
      // 从Supabase获取已保存的封面图片
      loadCoverImagesFromSupabase();
    }

    // 处理标题选择
    if (savedCoverTitle) {
      // 如果用户之前已经选择了标题，使用该标题
      // 直接解析标题并设置状态，而不是调用handleTitleSelect
      // 这样可以避免在页面刷新时触发标题更新
      const parsedTitle = parseTitleString(savedCoverTitle);
      setTitleData(parsedTitle);
    } else if (savedRecipientName) {
      // 如果没有保存的标题但有收件人姓名，使用第一个标题选项
      const firstTitleOption = `${savedRecipientName}'s amazing adventure`;
      // 调用 parseTitleString 处理默认标题
      const parsedDefaultTitle = parseTitleString(firstTitleOption);
      // 直接更新状态，避免触发 handleTitleSelect 中的 toast 和关闭对话框
      setTitleData(parsedDefaultTitle);
      // 同时保存默认标题到 localStorage，以便后续使用
      localStorage.setItem('loveStoryCoverTitle', firstTitleOption);
    } else {
      // 如果既没有标题也没有收件人名称，使用默认标题
      const defaultTitle = 'THE MAGIC IN My Love';
      const parsedDefaultTitle = parseTitleString(defaultTitle);
      setTitleData(parsedDefaultTitle);
      localStorage.setItem('loveStoryCoverTitle', defaultTitle);
    }
  }, []);

  // 监听 recipientName 变化，更新标题
  useEffect(() => {
    // 只有当 recipientName 有值且不是初始渲染时才执行
    if (recipientName && titleData.mainTitle) {
      // 获取当前保存的标题
      const savedCoverTitle = localStorage.getItem('loveStoryCoverTitle');
      
      if (!savedCoverTitle) return;
      
      // 检查标题中是否包含人名，并更新人名但保持标题格式
      let newTitle = savedCoverTitle;
      
      // 处理不同的标题格式，更新人名但保持格式
      if (savedCoverTitle.includes("'s amazing adventure")) {
        // 格式: "xxx's amazing adventure"
        const oldName = savedCoverTitle.split("'s amazing adventure")[0];
        newTitle = savedCoverTitle.replace(oldName + "'s", recipientName + "'s");
      } else if (savedCoverTitle.includes("'s wonderful")) {
        // 格式: "xxx's wonderful yyy"
        const parts = savedCoverTitle.split("'s wonderful");
        if (parts.length > 1) {
          // 替换第二部分（收件人名称）
          newTitle = parts[0] + "'s wonderful " + recipientName;
        }
      } else if (savedCoverTitle.startsWith("THE MAGIC IN")) {
        // 格式: "THE MAGIC IN xxx"
        newTitle = "THE MAGIC IN " + recipientName;
      } else if (savedCoverTitle.includes(", I love you")) {
        // 格式: "xxx, I love you!"
        const oldName = savedCoverTitle.split(", I love you")[0];
        newTitle = recipientName + ", I love you!";
      } else if (savedCoverTitle.startsWith("The little book of")) {
        // 格式: "The little book of xxx"
        newTitle = "The little book of " + recipientName;
      }
      
      // 只有当标题实际发生变化时才更新
      if (newTitle !== savedCoverTitle) {
        console.log(`更新标题: "${savedCoverTitle}" -> "${newTitle}"`);
        
        // 解析新标题
        const parsedNewTitle = parseTitleString(newTitle);
        
        // 更新标题数据
        setTitleData(parsedNewTitle);
        
        // 更新 localStorage
        localStorage.setItem('loveStoryCoverTitle', newTitle);
      }
    }
  }, [recipientName]); // 只在 recipientName 变化时执行

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
        
        // 更新封面图片数组
        setCoverImages(imageUrls);
        
        // 如果没有选中的图片索引，默认选择第一张
        if (currentImageIndex >= imageUrls.length || currentImageIndex < 0) {
          setCurrentImageIndex(0);
        }
        
        // 确保加载完成后重置生成状态
        setIsGeneratingCover(false);
        
        console.log('Successfully loaded cover images from Supabase:', imageUrls.length);
      } else {
        console.log('No cover images found in Supabase');
        // 即使没有找到图片，也重置生成状态
        setIsGeneratingCover(false);
      }
    } catch (error) {
      console.error('Error loading cover images from Supabase:', error);
      // 出错时也要重置生成状态
      setIsGeneratingCover(false);
    }
  };

  // 删除所有旧的封面图片
  const deleteOldCoverImages = async () => {
    try {
      const images = await getAllImagesFromStorage('images');
      const coverImages = images.filter(img => img.name.includes('love-story-cover'));
      
      // 如果没有封面图片，不需要删除
      if (coverImages.length === 0) {
        console.log('No cover images to delete');
        return;
      }
      
      // 创建删除操作的Promise数组
      const deletePromises = coverImages.map(img => {
        const pathParts = img.name.split('/');
        const filename = pathParts[pathParts.length - 1];
        console.log(`Deleting cover image: ${filename}`);
        return deleteImageFromStorage(filename, 'images');
      });
      
      // 并行执行所有删除操作
      await Promise.all(deletePromises);
      console.log(`Deleted all ${coverImages.length} cover images`);
    } catch (error) {
      console.error('Error managing cover images:', error);
    }
  };

  // 处理样式选择
  const handleStyleSelect = (styleId: string) => {
    // 检查对应样式的背景图片是否已加载
    let styleBackgroundLoaded = true;

    // 根据样式ID检查对应的背景图片
    if (styleId === 'modern' && !blueTexture?.element) {
      styleBackgroundLoaded = false;
    } else if (styleId === 'playful' && !greenLeaf?.element) {
      styleBackgroundLoaded = false;
    } else if (styleId === 'elegant' && !rainbow?.element) {
      styleBackgroundLoaded = false;
    } else if (styleId === 'classic' && !heartCover?.element) {
      styleBackgroundLoaded = false;
    }

    // 检查字体是否已加载
    const styleFontLoaded = fontsLoaded;

    // 如果资源尚未加载，显示提示
    if (!styleBackgroundLoaded || !styleFontLoaded) {
      console.log(`Resources for style ${styleId} are still loading - Background: ${styleBackgroundLoaded}, Font: ${styleFontLoaded}`);

      let message = "";
      if (!styleBackgroundLoaded && !styleFontLoaded) {
        message = "Background images and fonts are loading, please wait...";
      } else if (!styleBackgroundLoaded) {
        message = "Background images are loading, please wait...";
      } else if (!styleFontLoaded) {
        message = "Fonts are loading, please wait...";
      }

      toast({
        title: "Resources Loading",
        description: message,
        variant: "default"
      });
    }

    // 无论如何都设置样式，因为我们已经添加了资源加载检查
    setSelectedStyle(styleId);
    localStorage.setItem('loveStoryCoverStyle', styleId);

    // 如果切换样式，可能需要加载新的字体，重新检查字体加载状态
    if (fontStatus === 'loaded' && styleId !== selectedStyle) {
      // 根据样式选择字体
      let fontToLoad = '';
      switch (styleId) {
        case 'classic':
          fontToLoad = "'Patrick Hand', cursive";
          break;
        case 'vintage':
          fontToLoad = "'Freckle Face', cursive";
          break;
        case 'modern':
          fontToLoad = "'Amatic SC', cursive";
          break;
        case 'playful':
          fontToLoad = "'Caveat', cursive";
          break;
        case 'elegant':
          fontToLoad = "'Luckiest Guy', cursive";
          break;
      }

      if (fontToLoad && typeof document !== 'undefined' && 'fonts' in document) {
        // 尝试预加载新样式的字体
        console.log(`Preloading font for new style: ${fontToLoad}`);
        document.fonts.load(`bold 48px ${fontToLoad}`);
      }
    }
  };

  // 编辑标题功能
  const handleEditTitle = () => {
    setIsEditTitleDialogOpen(true);
  };

  // 辅助函数：解析标题字符串为三部分
  const parseTitleString = (title: string): { mainTitle: string; subTitle: string; thirdLine: string; fullTitle: string } => {
    let mainPart = '';
    let subPart = '';
    let thirdPart = '';

    // 检查标题模式而不是精确匹配
    if (title.endsWith('amazing adventure') && title.includes("'s")) {
      const nameWithApostrophe = title.split('amazing adventure')[0].trim();
      mainPart = nameWithApostrophe;
      subPart = 'amazing adventure';
      thirdPart = '';
    } else if (title.includes("'s wonderful") && title.split("'s wonderful").length > 1) {
      const parts = title.split("'s wonderful");
      mainPart = parts[0] + "'s";
      subPart = 'wonderful';
      thirdPart = parts[1].trim();
    } else if (title.startsWith('THE MAGIC IN') && title.length > 12) {
      mainPart = 'THE MAGIC IN';
      subPart = title.substring(12).trim();
      thirdPart = '';
    } else if ((title.includes('I love you') || title.includes('I love you!')) && !title.startsWith('I love you')) {
      // 处理两种可能的格式："May I love you" 或 "May, I love you!"
      let name: string;
      if (title.includes('I love you!')) {
        name = title.split('I love you!')[0].trim();
        // 如果名字已经包含逗号，不再添加
        mainPart = name.endsWith(',') ? name : name + ',';
      } else {
        name = title.split('I love you')[0].trim();
        // 如果名字已经包含逗号，不再添加
        mainPart = name.endsWith(',') ? name : name + ',';
      }
      subPart = 'I love you!';
      thirdPart = '';
    } else if (title.startsWith('The little book of') && title.length > 18) {
      mainPart = 'The little book of';
      subPart = title.substring(18).trim();
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

    return {
      mainTitle: mainPart,
      subTitle: subPart,
      thirdLine: thirdPart,
      fullTitle: title
    };
  };

  // 修改处理标题选择的函数
  const handleTitleSelect = (title: string) => {
    // 调用辅助函数解析标题
    const parsedTitle = parseTitleString(title);

    // 更新标题状态
    setTitleData(parsedTitle);

    // 仍然保存完整标题到localStorage（其他地方可能需要用到）
    localStorage.setItem('loveStoryCoverTitle', title);

    setIsEditTitleDialogOpen(false);
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
  const handleRegenerateCover = async (clearOldImages: boolean = false) => {
    if (isGeneratingCover) return;

    setIsGeneratingCover(true);
    // 注意：不需要额外的加载状态，因为LoveStoryCoverPreview组件内部已经有加载状态

    try {
      // 只有在需要清除旧图片时才执行删除操作
      if (clearOldImages) {
        // 先删除所有旧的封面图片
        await deleteOldCoverImages();
      }

      // 获取用户上传的图片
      const uploadedImage = localStorage.getItem('loveStoryPartnerPhoto');
      const savedTone = localStorage.getItem('loveStoryTone') || textTone;
      const personAge = localStorage.getItem('loveStoryPersonAge') || '0';
      const personGender = localStorage.getItem('loveStoryPersonGender') || 'unknown'; // 获取性别信息
      const ageNumber = parseInt(personAge);

      // 根据年龄和性别选择不同的 prompt
      let textPrompt = '';
      if (ageNumber <= 12) {
        // 儿童风格 prompt
        textPrompt = `the person as an adorable ${personGender === 'male' ? 'boy' : 'girl'} around ${ageNumber} years old, cartoon character, oversized head and smaller body proportions, clear and focused eyes looking gently forward with friendly expression, natural highlights and reflections in the eyes, joyful and innocent facial expression, simplified clothing, warm palette`;
      } else if (ageNumber <= 18) {
        // 青少年风格 prompt
        textPrompt = `the person as a ${personGender === 'male' ? 'teenage boy' : 'teenage girl'} around ${ageNumber} years old, soft rounded facial features, bright cheerful smile with visible joy in eyes, warm and enthusiastic facial expression, smooth and detailed shading with subtle gradients, modern casual and minimalistic clothing, warm palette, soft dreamy lighting`;
      } else {
        // 成人风格 prompt
        textPrompt = `the person as a ${personGender === 'male' ? 'man' : 'woman'} around ${ageNumber} years old, soft rounded facial features, beaming smile with genuine happiness, expressive joyful eyes, uplifting and positive facial expression, smooth and detailed shading with subtle gradients, modern casual and minimalistic clothing, warm palette, soft dreamy lighting`;
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
        // 显示错误提示，要求用户上传图片
        toast({
          title: "Image Required",
          description: "Please upload a photo to generate covers",
          variant: "destructive"
        });
        setIsGeneratingCover(false);
        return;
      }

      // 重新加载Supabase上的图片以获取最新上传的图片
      setTimeout(() => {
        loadCoverImagesFromSupabase();
      }, 1000);
    } catch (error) {
      console.error('Error generating cover:', error);
      setIsGeneratingCover(false);
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
            } else if (currentStyle.id === 'classic') {
              backgroundImgPromise = loadBackgroundImage(heartCoverBackground);
            }
            // 注意：vintage样式不使用背景图片，保持使用纯色背景

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

                // 使用drawSnowNightBackground函数来绘制雪花，只绘制雪花而不绘制背景
                drawSnowNightBackground({
                  ctx,
                  width: canvas.width,
                  height: canvas.height,
                  baseColor: 'transparent', // 使用透明背景，因为我们已经有背景图片
                  snowOpacity: 0.9 // 高不透明度使雪花更明显
                });
              } else if (currentStyle.id === 'playful') {
                // 添加蓝色半透明叠加层
                ctx.fillStyle = 'rgba(74, 137, 220, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            } else {
              // 使用样式的纯色背景
              if (currentStyle.id === 'vintage') {
                // 为 vintage 样式创建对角线渐变背景（左上角到右下角）
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#e7c9a9');   // 左上角较深棕色
                gradient.addColorStop(0.4, '#f8e9d6');  // 浅色过渡区域，扩大范围到0.4
                gradient.addColorStop(0.6, '#f8e9d6');  // 浅色过渡区域，缩小范围到0.6
                gradient.addColorStop(1, '#e7c9a9');   // 右下角较深棕色

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 添加轻微的纹理效果
                for (let i = 0; i < 20; i++) {
                  const x = Math.random() * canvas.width;
                  const y = Math.random() * canvas.height;
                  const radius = 80 + Math.random() * 150;

                  const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                  spotGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                  spotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                  ctx.fillStyle = spotGradient;
                  ctx.beginPath();
                  ctx.arc(x, y, radius, 0, Math.PI * 2);
                  ctx.fill();
                }

                // 强化左上角和右下角的深色效果
                const cornerRadius = canvas.width * 0.7; // 增加半径使渐变更接近中心

                // 左上角深色渐变 - 增强深度
                const topLeftGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cornerRadius);
                topLeftGradient.addColorStop(0, 'rgba(193, 156, 125, 0.6)');  // 更深的颜色，更高不透明度
                topLeftGradient.addColorStop(0.6, 'rgba(203, 176, 145, 0.15)'); // 延伸过渡区域
                topLeftGradient.addColorStop(1, 'rgba(203, 176, 145, 0)');
                ctx.fillStyle = topLeftGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 右下角深色渐变 - 减轻深度
                const bottomRightGradient = ctx.createRadialGradient(canvas.width, canvas.height, 0, canvas.width, canvas.height, cornerRadius);
                bottomRightGradient.addColorStop(0, 'rgba(203, 176, 145, 0.25)');  // 降低不透明度使其较浅
                bottomRightGradient.addColorStop(0.6, 'rgba(203, 176, 145, 0.1)'); // 延伸过渡区域
                bottomRightGradient.addColorStop(1, 'rgba(203, 176, 145, 0)');
                ctx.fillStyle = bottomRightGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (currentStyle.id === 'classic') {
                if (backgroundImgLoaded) {
                  // 使用已加载的心形背景图片
                  ctx.drawImage(backgroundImgLoaded, 0, 0, canvas.width, canvas.height);

                  // 添加米色半透明叠加层，使图片更柔和
                  ctx.fillStyle = 'rgba(245, 235, 220, 0.3)';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else {
                  // 如果无法加载背景图片，使用纯色背景
                  ctx.fillStyle = currentStyle.background;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
              } else if (currentStyle.id === 'modern') {
                // 如果无法加载modern背景图片，使用drawSnowNightBackground函数绘制完整背景
                drawSnowNightBackground({
                  ctx,
                  width: canvas.width,
                  height: canvas.height,
                  snowOpacity: 0.9 // 高不透明度使雪花更明显
                });
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
            const y = canvas.height * 0.4;  // 修改为0.4，与LoveStoryCoverPreview一致

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
              // 根据样式选择不同的字体
              if (currentStyle.id === 'playful') {
                ctx.fillStyle = '#2A4C08'; // Playful样式使用深绿色字体
                const playfulTitleFontSize = titleFontSize * 2.2; // 将字体放大2.2倍
                ctx.font = `bold ${playfulTitleFontSize}px 'Caveat', cursive`;
              } else if (currentStyle.id === 'modern') {
                ctx.fillStyle = '#FFFFFF'; // Modern样式使用白色字体
                const modernTitleFontSize = titleFontSize * 2.0; // 将字体放大2.0倍，与副标题保持一致
                ctx.font = `bold ${modernTitleFontSize}px 'Amatic SC', cursive`;
              } else if (currentStyle.id === 'elegant') {
                ctx.fillStyle = '#FDF0F3'; // Elegant样式使用淡粉色字体
                const elegantTitleFontSize = titleFontSize * 1.6; // 将字体放大1.6倍
                ctx.font = `bold ${elegantTitleFontSize}px 'Luckiest Guy', cursive`;
              } else if (currentStyle.id === 'classic') {
                ctx.fillStyle = '#C75B7D'; // 使用深粉红色/玫瑰色
                const classicTitleFontSize = titleFontSize * 2.0; // 将字体放大2倍，与Modern一致
                ctx.font = `bold ${classicTitleFontSize}px 'Patrick Hand', cursive`;
              } else if (currentStyle.id === 'vintage') {
                const vintageTitleFontSize = titleFontSize * 1.8; // 将字体放大1.8倍
                ctx.font = `bold ${vintageTitleFontSize}px 'Freckle Face', cursive`;
              }

              // 只处理特定的三行标题模式：${authorName}'s wonderful ${recipientName}
              if (thirdLine && mainTitle.includes("'s") && subTitle === 'wonderful') {
                // 三行标题位置，上移以避免与图片重合
                if (currentStyle.id === 'modern') {
                  // Modern样式特殊处理位置
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * 0.20); // 上移0.02

                  const subTitleFontSize = titleFontSize * 2.0; // Modern样式副标题放大2倍
                  ctx.font = `bold ${subTitleFontSize}px 'Amatic SC', cursive`;
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * 0.30); // 上移0.02
                  ctx.fillText(thirdLine, canvas.width / 2, canvas.height * 0.40); // 上移0.02
                } else {
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * 0.20); // 上移0.02

                  let subTitleFontSize: number;
                  if (currentStyle.id === 'playful') {
                    subTitleFontSize = titleFontSize * 2.2; // Playful样式副标题放大2.2倍
                    ctx.font = `bold ${subTitleFontSize}px 'Caveat', cursive`;
                  } else if (currentStyle.id === 'elegant') {
                    subTitleFontSize = titleFontSize * 1.6; // 将Elegant样式副标题字体大小从1.8改为1.6
                    ctx.font = `bold ${subTitleFontSize}px 'Luckiest Guy', cursive`;
                  } else if (currentStyle.id === 'classic') {
                    subTitleFontSize = titleFontSize * 2.0; // Classic样式副标题也放大2倍
                    ctx.font = `bold ${subTitleFontSize}px 'Patrick Hand', cursive`;
                  } else if (currentStyle.id === 'vintage') {
                    subTitleFontSize = titleFontSize * 1.8;
                    ctx.font = `bold ${subTitleFontSize}px 'Freckle Face', cursive`;
                  }
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * 0.30); // 上移0.02
                  ctx.fillText(thirdLine, canvas.width / 2, canvas.height * 0.40); // 上移0.02
                }
              } else if (thirdLine) {
                // 其他三行标题情况，保持原位置不变
                ctx.fillText(mainTitle, canvas.width / 2, canvas.height * 0.25); // 上移0.02

                let subTitleFontSize: number;
                if (currentStyle.id === 'playful') {
                  subTitleFontSize = titleFontSize * 2.2; // Playful样式副标题放大2.2倍
                  ctx.font = `bold ${subTitleFontSize}px 'Caveat', cursive`;
                } else if (currentStyle.id === 'elegant') {
                  subTitleFontSize = titleFontSize * 1.6; // 将Elegant样式副标题字体大小从1.8改为1.6
                  ctx.font = `bold ${subTitleFontSize}px 'Luckiest Guy', cursive`;
                } else if (currentStyle.id === 'classic') {
                  subTitleFontSize = titleFontSize * 2.0; // Classic样式副标题也放大2倍
                  ctx.font = `bold ${subTitleFontSize}px 'Patrick Hand', cursive`;
                } else if (currentStyle.id === 'vintage') {
                  subTitleFontSize = titleFontSize * 1.8;
                  ctx.font = `bold ${subTitleFontSize}px 'Freckle Face', cursive`;
                }
                ctx.fillText(subTitle, canvas.width / 2, canvas.height * 0.35); // 上移0.02
                ctx.fillText(thirdLine, canvas.width / 2, canvas.height * 0.45); // 上移0.02
              } else if (mainTitle && subTitle) {
                // 两行标题的情况，增加行间距，第一行适度上移，第二行位置不变
                if (currentStyle.id === 'modern') {
                  // Modern样式特殊处理位置
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * 0.25); // 下移0.02 // 第一行适度上移

                  const subTitleFontSize = titleFontSize * 2.0; // Modern样式副标题放大2倍
                  ctx.font = `bold ${subTitleFontSize}px 'Amatic SC', cursive`;
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * 0.37); // 下移0.02 // 第二行位置不变
                } else {
                  ctx.fillText(mainTitle, canvas.width / 2, canvas.height * 0.25); // 下移0.02 // 第一行适度上移

                  // 绘制副标题，增加间距
                  let subTitleFontSize: number;
                  if (currentStyle.id === 'playful') {
                    subTitleFontSize = titleFontSize * 2.2; // Playful样式副标题放大2.2倍
                    ctx.font = `bold ${subTitleFontSize}px 'Caveat', cursive`;
                  } else if (currentStyle.id === 'elegant') {
                    subTitleFontSize = titleFontSize * 1.6; // 将Elegant样式副标题字体大小从1.8改为1.6
                    ctx.font = `bold ${subTitleFontSize}px 'Luckiest Guy', cursive`;
                  } else if (currentStyle.id === 'classic') {
                    subTitleFontSize = titleFontSize * 2.0; // Classic样式副标题也放大2倍
                    ctx.font = `bold ${subTitleFontSize}px 'Patrick Hand', cursive`;
                  } else if (currentStyle.id === 'vintage') {
                    subTitleFontSize = titleFontSize * 1.8;
                    ctx.font = `bold ${subTitleFontSize}px 'Freckle Face', cursive`;
                  }
                  ctx.fillText(subTitle, canvas.width / 2, canvas.height * 0.37); // 下移0.02 // 第二行位置不变
                }
              } else {
                // 如果没有分开的标题，则使用完整标题
                if (currentStyle.id === 'modern') {
                  // 使用白色字体和更手写风格的字体
                  ctx.fillStyle = '#FFFFFF';
                  const modernTitleFontSize = titleFontSize * 2.0; // 将字体放大2.0倍，与副标题保持一致
                  ctx.font = `bold ${modernTitleFontSize}px 'Amatic SC', cursive`;
                  ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02 // 将标题位置调整为与 LoveStoryCoverPreview 一致
                } else if (currentStyle.id === 'elegant') {
                  // 使用淡粉色字体和手写风格的字体
                  ctx.fillStyle = '#FDF0F3';
                  const elegantTitleFontSize = titleFontSize * 1.6; // 将字体放大1.6倍
                  ctx.font = `bold ${elegantTitleFontSize}px 'Luckiest Guy', cursive`;
                  ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
                } else if (currentStyle.id === 'playful') {
                  ctx.fillStyle = '#2A4C08';
                  const playfulTitleFontSize = titleFontSize * 2.2; // 将字体放大2.2倍
                  ctx.font = `bold ${playfulTitleFontSize}px 'Caveat', cursive`;
                  ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
                } else if (currentStyle.id === 'classic') {
                  ctx.fillStyle = '#FFF5F5'; // 使用柔和的白色
                  const classicTitleFontSize = titleFontSize * 2.0; // 将字体放大2倍，与Modern一致
                  ctx.font = `bold ${classicTitleFontSize}px 'Patrick Hand', cursive`;
                  ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
                } else if (currentStyle.id === 'vintage') {
                  const vintageTitleFontSize = titleFontSize * 1.8; // 将字体放大1.8倍
                  ctx.font = `bold ${vintageTitleFontSize}px 'Freckle Face', cursive`;
                  ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
                } else {
                  // 其他样式使用默认字体
                  ctx.font = `bold ${titleFontSize}px ${getFontFamily(currentStyle.font)}`;
                  ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
                }
              }
            } else {
              // 如果没有主标题，则使用完整标题
              if (currentStyle.id === 'modern') {
                // 使用白色字体和更手写风格的字体
                ctx.fillStyle = '#FFFFFF';
                const modernTitleFontSize = titleFontSize * 2.0; // 将字体放大2.0倍，与副标题保持一致
                ctx.font = `bold ${modernTitleFontSize}px 'Amatic SC', cursive`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02 // 将标题位置调整为与 LoveStoryCoverPreview 一致
              } else if (currentStyle.id === 'elegant') {
                // 使用淡粉色字体和手写风格的字体
                ctx.fillStyle = '#FDF0F3';
                const elegantTitleFontSize = titleFontSize * 1.6; // 将字体放大1.6倍
                ctx.font = `bold ${elegantTitleFontSize}px 'Luckiest Guy', cursive`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
              } else if (currentStyle.id === 'playful') {
                ctx.fillStyle = '#2A4C08';
                const playfulTitleFontSize = titleFontSize * 2.2; // 将字体放大2.2倍
                ctx.font = `bold ${playfulTitleFontSize}px 'Caveat', cursive`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
              } else if (currentStyle.id === 'classic') {
                ctx.fillStyle = '#C75B7D'; // 使用深粉红色/玫瑰色
                const classicTitleFontSize = titleFontSize * 2.0; // 将字体放大2倍，与Modern一致
                ctx.font = `bold ${classicTitleFontSize}px 'Patrick Hand', cursive`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
              } else if (currentStyle.id === 'vintage') {
                const vintageTitleFontSize = titleFontSize * 1.8; // 将字体放大1.8倍
                ctx.font = `bold ${vintageTitleFontSize}px 'Freckle Face', cursive`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
              } else {
                // 其他样式使用默认字体
                ctx.font = `bold ${titleFontSize}px ${getFontFamily(currentStyle.font)}`;
                ctx.fillText(fullTitle, canvas.width / 2, canvas.height * 0.27); // 下移0.02
              }
            }

            // 作者名 - 定义固定区域并居中显示
            // 定义作者签名区域（右下角）
            const authorAreaWidth = canvas.width * 0.3; // 区域宽度为封面宽度30%
            const authorAreaX = canvas.width * 0.71; // 区域左边界位置，右移0.01
            const authorAreaY = canvas.height * 0.95; // 区域底部位置

            // 保存当前文本对齐方式
            const originalTextAlign = ctx.textAlign;

            // 设置文本居中对齐
            ctx.textAlign = 'center';

            // 根据不同样式设置字体和颜色
            if (currentStyle.id === 'modern') {
              // Modern样式
              ctx.fillStyle = '#FFFFFF';
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px 'Amatic SC', cursive`;
              ctx.fillText(`By ${authorName}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
            } else if (currentStyle.id === 'elegant') {
              // Elegant样式
              ctx.fillStyle = '#FDF0F3';
              const authorFontSize = canvas.width * 0.025; // 缩小作者字体
              ctx.font = `italic ${authorFontSize}px 'Luckiest Guy', cursive`;
              ctx.fillText(`By ${authorName}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
            } else if (currentStyle.id === 'classic') {
              // Classic样式
              ctx.fillStyle = '#C75B7D'; // 使用深粉红色/玫瑰色
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px 'Patrick Hand', cursive`;
              ctx.fillText(`By ${authorName}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
            } else if (currentStyle.id === 'vintage') {
              // Vintage样式
              ctx.fillStyle = currentStyle.titleColor; // 使用标题颜色
              const authorFontSize = canvas.width * 0.030; // 缩小作者字体
              ctx.font = `italic ${authorFontSize}px 'Freckle Face', cursive`;
              ctx.fillText(`By ${authorName}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
            } else if (currentStyle.id === 'playful') {
              // Playful样式
              ctx.fillStyle = '#2A4C08';
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px 'Caveat', cursive`;
              ctx.fillText(`By ${authorName}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
            } else {
              // 其他样式
              ctx.fillStyle = currentStyle.authorColor;
              const authorFontSize = canvas.width * 0.035;
              ctx.font = `italic ${authorFontSize}px ${getFontFamily(currentStyle.font)}`;
              ctx.fillText(`By ${authorName}`, authorAreaX + authorAreaWidth/2, canvas.height * 0.9); // 其他样式位置稍高
            }

            // 恢复原来的文本对齐方式
            ctx.textAlign = originalTextAlign;

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
            } else if (style.id === 'classic') {
              // 对于封底，使用heartback.png
              backgroundImgPromise = loadBackgroundImage(heartBackBackground);
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

                // 使用drawSnowNightBackground函数来绘制雪花，只绘制雪花而不绘制背景
                drawSnowNightBackground({
                  ctx,
                  width: canvas.width,
                  height: canvas.height,
                  baseColor: 'transparent', // 使用透明背景，因为我们已经有背景图片
                  snowOpacity: 0.9 // 高不透明度使雪花更明显
                });
              } else if (style.id === 'playful') {
                // 添加蓝色半透明叠加层
                ctx.fillStyle = 'rgba(74, 137, 220, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            } else {
              // 使用样式的纯色背景
              if (style.id === 'vintage') {
                // 为 vintage 样式创建对角线渐变背景（左上角到右下角）
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#e7c9a9');   // 左上角较深棕色
                gradient.addColorStop(0.4, '#f8e9d6');  // 浅色过渡区域，扩大范围到0.4
                gradient.addColorStop(0.6, '#f8e9d6');  // 浅色过渡区域，缩小范围到0.6
                gradient.addColorStop(1, '#e7c9a9');   // 右下角较深棕色

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 添加轻微的纹理效果
                for (let i = 0; i < 20; i++) {
                  const x = Math.random() * canvas.width;
                  const y = Math.random() * canvas.height;
                  const radius = 80 + Math.random() * 150;

                  const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                  spotGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                  spotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                  ctx.fillStyle = spotGradient;
                  ctx.beginPath();
                  ctx.arc(x, y, radius, 0, Math.PI * 2);
                  ctx.fill();
                }

                // 强化左上角和右下角的深色效果
                const cornerRadius = canvas.width * 0.7; // 增加半径使渐变更接近中心

                // 左上角深色渐变 - 增强深度
                const topLeftGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cornerRadius);
                topLeftGradient.addColorStop(0, 'rgba(193, 156, 125, 0.6)');  // 更深的颜色，更高不透明度
                topLeftGradient.addColorStop(0.6, 'rgba(203, 176, 145, 0.15)'); // 延伸过渡区域
                topLeftGradient.addColorStop(1, 'rgba(203, 176, 145, 0)');
                ctx.fillStyle = topLeftGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 右下角深色渐变 - 减轻深度
                const bottomRightGradient = ctx.createRadialGradient(canvas.width, canvas.height, 0, canvas.width, canvas.height, cornerRadius);
                bottomRightGradient.addColorStop(0, 'rgba(203, 176, 145, 0.25)');  // 降低不透明度使其较浅
                bottomRightGradient.addColorStop(0.6, 'rgba(203, 176, 145, 0.1)'); // 延伸过渡区域
                bottomRightGradient.addColorStop(1, 'rgba(203, 176, 145, 0)');
                ctx.fillStyle = bottomRightGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'classic' && backgroundImgLoaded) {
                // 使用已加载的心形背景图片
                ctx.drawImage(backgroundImgLoaded, 0, 0, canvas.width, canvas.height);

                // 添加米色半透明叠加层，使图片更柔和
                ctx.fillStyle = 'rgba(245, 235, 220, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'classic') {
                // 如果无法加载背景图片，使用纯色背景
                ctx.fillStyle = style.background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'modern') {
                // 如果无法加载modern背景图片，使用drawSnowNightBackground函数绘制完整背景
                drawSnowNightBackground({
                  ctx,
                  width: canvas.width,
                  height: canvas.height,
                  snowOpacity: 0.9 // 高不透明度使雪花更明显
                });
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

            // 加载并绘制 spine-logo.png 图标
            try {
              const logoImg = new Image();
              logoImg.crossOrigin = 'anonymous';
              logoImg.onload = () => {
                // 计算图标位置 - 居中并向上移动
                const logoWidth = 200; // 图标宽度，放大到200
                // 根据logo的原始宽高比计算正确的高度，避免图像被压扁
                const logoAspectRatio = logoImg.width / logoImg.height;
                const logoHeight = logoWidth / logoAspectRatio; // 保持原始宽高比
                const logoX = (canvas.width - logoWidth) / 2;
                const logoY = canvas.height * 0.80; // 位置在封底的 80% 处，比原来的 75% 低 5%

                // 绘制图标
                ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

                // 转换为图像
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                resolve(imageData);
              };
              logoImg.onerror = () => {
                console.error('Failed to load spine-logo.png');
                // 如果图标加载失败，仍然返回没有图标的图像
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                resolve(imageData);
              };
              logoImg.src = '/assets/logos/spine-logo.png';
            } catch (logoError) {
              console.error('Error adding logo to back cover:', logoError);
              // 如果出错，返回没有图标的图像
              const imageData = canvas.toDataURL('image/jpeg', 0.9);
              resolve(imageData);
            }
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
  // 注意：对于Classic样式，我们使用封底图片(heartBackBackground)而不是封面图片来生成书脊
  // 这是因为Classic样式的爱情故事书籍需要特殊处理，使书脊与封底保持一致的视觉效果
  const renderSpineToCanvas = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个临时的Canvas - 宽度为0.25英寸，高度与封面一致
        const canvas = document.createElement('canvas');
        canvas.width = 75; // 0.25英寸 * 300dpi = 75px
        canvas.height = 2625; // 8.75英寸 * 300dpi，与封面高度一致

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
            } else if (style.id === 'classic') {
              // 对于Classic样式的spine，使用heartBackBackground而不是heartCoverBackground
              backgroundImgPromise = loadBackgroundImage(heartBackBackground);
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

                // 使用drawSnowNightBackground函数来绘制雪花，只绘制雪花而不绘制背景
                // 对于书脉，我们需要调整雪花的大小和数量
                drawSnowNightBackground({
                  ctx,
                  width: canvas.width,
                  height: canvas.height,
                  baseColor: 'transparent', // 使用透明背景，因为我们已经有背景图片
                  snowOpacity: 0.9 // 高不透明度使雪花更明显
                });
              } else if (style.id === 'playful') {
                // 添加蓝色半透明叠加层
                ctx.fillStyle = 'rgba(74, 137, 220, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            } else {
              // 使用样式的纯色背景
              if (style.id === 'vintage') {
                // 为 vintage 样式创建对角线渐变背景（左上角到右下角）
                // 对于书脉，我们使用简化版的渐变
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#e7c9a9');   // 顶部较深棕色
                gradient.addColorStop(0.4, '#f8e9d6');  // 浅色过渡区域
                gradient.addColorStop(0.6, '#f8e9d6');  // 浅色过渡区域
                gradient.addColorStop(1, '#e7c9a9');   // 底部较深棕色

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 添加轻微的纹理效果 - 对于书脉使用更少的纹理
                for (let i = 0; i < 10; i++) {
                  const x = Math.random() * canvas.width;
                  const y = Math.random() * canvas.height;
                  const radius = 30 + Math.random() * 50; // 书脉上的纹理更小

                  const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                  spotGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                  spotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                  ctx.fillStyle = spotGradient;
                  ctx.beginPath();
                  ctx.arc(x, y, radius, 0, Math.PI * 2);
                  ctx.fill();
                }
              } else if (style.id === 'classic' && backgroundImgLoaded) {
                // 使用已加载的背景图片（对于Classic样式，这是heartBackBackground）
                // 对于书脉，我们需要截取中间部分
                const sourceX = backgroundImgLoaded.width / 2 - (canvas.width / 2);
                ctx.drawImage(backgroundImgLoaded,
                  sourceX, 0, canvas.width, backgroundImgLoaded.height,  // 源
                  0, 0, canvas.width, canvas.height);  // 目标

                // 添加米色半透明叠加层，使图片更柔和
                ctx.fillStyle = 'rgba(245, 235, 220, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'classic') {
                // 如果无法加载背景图片，使用纯色背景
                ctx.fillStyle = style.background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else if (style.id === 'modern') {
                // 如果无法加载modern背景图片，使用drawSnowNightBackground函数绘制完整背景
                drawSnowNightBackground({
                  ctx,
                  width: canvas.width,
                  height: canvas.height,
                  snowOpacity: 0.9 // 高不透明度使雪花更明显
                });
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

            // 书脊不显示书名文字

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

  // 添加后台渲染函数
  const renderCoverInBackground = async () => {
    try {
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
        localStorage.setItem('loveStoryBackCoverImage_url', backCoverStorageUrl);
        localStorage.setItem('loveStorySpineImage_url', spineStorageUrl);

        // 更新渲染上下文
        setCoverImageUrl(storageUrl);
        setBackCoverImageUrl(backCoverStorageUrl);
        setSpineImageUrl(spineStorageUrl);

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

      // 同步渲染祝福页面
      try {
        // 确保获取最新的数据
        const currentAuthorName = localStorage.getItem('loveStoryAuthorName') || authorName;
        const currentRecipientName = localStorage.getItem('loveStoryPersonName') || recipientName;
        const currentTextTone = localStorage.getItem('loveStoryTone') || 'Heartfelt';

        // 设置预设的祝福语文本 - 不允许用户编辑
        let predefinedBlessingText = '';
        if (currentTextTone === 'Heartfelt') {
          predefinedBlessingText = `Dear ${currentRecipientName},\n\nIn the quiet moments of reflection, I find my heart filled with gratitude for the beautiful journey we've shared. Each memory we've created together is a treasure I hold dear.\n\nWith all my love,\n${currentAuthorName}`;
        } else if (currentTextTone === 'Playful') {
          predefinedBlessingText = `Hey ${currentRecipientName}!\n\nGuess what? You're absolutely amazing! Every adventure with you turns into an epic story, and I can't wait to see what fun we'll have next! Here's to more laughter and silly moments!\n\nCheers,\n${currentAuthorName}`;
        } else if (currentTextTone === 'Inspirational') {
          predefinedBlessingText = `To ${currentRecipientName},\n\nMay your path be filled with light, your heart with courage, and your spirit with joy. Remember that you have the strength to overcome any challenge life presents.\n\nBelieving in you always,\n${currentAuthorName}`;
        } else {
          predefinedBlessingText = `Dear ${currentRecipientName},\n\nSending you warm wishes and fond memories. May this book remind you of all the special moments we've shared.\n\nWith affection,\n${currentAuthorName}`;
        }

        // 更新祝福语文本状态（不使用用户输入的文本）
        localStorage.setItem('loveStoryBlessingText', predefinedBlessingText);

        // 导入并调用renderAndUploadBlessingImage函数
        const { renderAndUploadBlessingImage } = await import('./utils/canvasUtils');

        // 获取最新的图片列表
        const allImages = await getAllImagesFromStorage('images');

        // 渲染并上传祝福语图片
        const blessingStorageUrl = await renderAndUploadBlessingImage(
          predefinedBlessingText,
          currentAuthorName,
          currentRecipientName,
          currentTextTone,
          allImages
        );

        // 保存URL到localStorage
        localStorage.setItem('loveStoryBlessingImage_url', blessingStorageUrl);

        console.log('Successfully generated and uploaded blessing page');
      } catch (blessingError) {
        console.error('Error generating blessing page:', blessingError);
        // 继续处理，即使生成失败
      }

      // 设置渲染完成状态
      setCoverRenderComplete(true);
      setIsRenderingCover(false);

      console.log('Background rendering completed successfully');
    } catch (error) {
      console.error('Error in background rendering:', error);
      setIsRenderingCover(false);
    }
  };

  // 修改handleContinue函数，只有在封面有变化时才重新渲染
  const handleContinue = () => {
    try {
      // 保存标题数据和封面样式到localStorage
      localStorage.setItem('loveStoryCoverTitle', titleData.fullTitle);
      localStorage.setItem('loveStoryCoverSubtitle', titleData.subTitle || '');
      localStorage.setItem('loveStoryCoverThirdLine', titleData.thirdLine || '');
      localStorage.setItem('loveStoryCoverStyle', selectedStyle); // 保存封面样式
      localStorage.setItem('loveStorySelectedCoverIndex', currentImageIndex.toString()); // 保存当前选中的图片索引

      // 检查封面是否有变化
      const lastTitle = localStorage.getItem('lastRenderedCoverTitle');
      const lastSubtitle = localStorage.getItem('lastRenderedCoverSubtitle');
      const lastStyle = localStorage.getItem('lastRenderedCoverStyle');
      const lastAuthor = localStorage.getItem('lastRenderedAuthorName');
      const lastRecipient = localStorage.getItem('lastRenderedRecipientName');
      const lastImageIndex = localStorage.getItem('lastRenderedCoverImageIndex');

      // 检查是否需要重新渲染
      const needsRerender =
        !lastTitle || // 第一次渲染
        lastTitle !== titleData.fullTitle ||
        lastSubtitle !== (titleData.subTitle || '') ||
        lastStyle !== selectedStyle ||
        lastAuthor !== authorName ||
        lastRecipient !== recipientName ||
        lastImageIndex !== currentImageIndex.toString();

      console.log('Cover change detection:', {
        needsRerender,
        currentTitle: titleData.fullTitle,
        lastTitle,
        currentStyle: selectedStyle,
        lastStyle,
        currentImageIndex,
        lastImageIndex
      });

      // 保存当前封面信息作为最后渲染的状态
      localStorage.setItem('lastRenderedCoverTitle', titleData.fullTitle);
      localStorage.setItem('lastRenderedCoverSubtitle', titleData.subTitle || '');
      localStorage.setItem('lastRenderedCoverStyle', selectedStyle);
      localStorage.setItem('lastRenderedAuthorName', authorName);
      localStorage.setItem('lastRenderedRecipientName', recipientName);
      localStorage.setItem('lastRenderedCoverImageIndex', currentImageIndex.toString());

      // 设置渲染状态
      setIsRenderingCover(true);

      if (needsRerender) {
        // 如果需要重新渲染，设置为未完成状态并启动渲染
        console.log('Cover has changed, starting background rendering...');
        setCoverRenderComplete(false);
        renderCoverInBackground();
      } else {
        // 如果不需要重新渲染，直接设置为完成状态
        console.log('Cover has not changed, skipping rendering...');
        setCoverRenderComplete(true);
        setIsRenderingCover(false);
      }

      // 立即导航到下一步
      navigate('/create/love/love-story/generate');
    } catch (error) {
      console.error('Error starting background rendering:', error);
      setIsRenderingCover(false);
    }
  };

  // 获取当前选中的样式
  const currentStyle = coverStyles.find(style => style.id === selectedStyle) || coverStyles[0];

  // 当前显示的封面图片
  const currentCoverImage = coverImages.length > 0 ? coverImages[currentImageIndex] : undefined;

  console.log('Rendering LoveStoryCoverStep with titleData:', titleData);

  return (
    <WizardStep
      title="Design your book cover"
      description="Choose a cover style and edit title by clicking 'Edit title' below."
      previousStep="/create/love/love-story/ideas"
      currentStep={6}
      totalSteps={8}
      onNextClick={handleContinue}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* 封面预览 */}
        <div className="relative mb-5">

          {/* 封面图片生成中的加载状态 - 使用更简洁的样式 */}
          {isGeneratingCover && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20 rounded-lg">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-t-2 border-[#FF7F50] animate-spin"></div>
              </div>
              <h3 className="text-xl font-medium text-[#FF7F50]">
                Generating cover
              </h3>
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
          <div className="relative">
            {/* 加载状态层 - 使用绝对定位和透明度过渡 */}
            {(!resourcesLoaded || initialLoading) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-lg p-8 transition-opacity duration-300 ease-in-out">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#FF7F50] animate-spin"></div>
                </div>
                <h3 className="text-xl font-medium text-[#FF7F50]">
                  Generating cover
                </h3>
              </div>
            )}

            {/* 始终渲染预览组件，但在加载时隐藏 */}
            <div className={`transition-opacity duration-300 ease-in-out ${(!resourcesLoaded || initialLoading) ? 'opacity-0' : 'opacity-100'}`}>
              <LoveStoryCoverPreview
                titleData={titleData}
                authorName={authorName}
                recipientName={recipientName}
                coverImage={currentCoverImage}
                selectedFont={currentStyle.font}
                style={currentStyle}
              />
            </div>
          </div>

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
          <div className="flex justify-center gap-12">
            <Button
              variant="secondary"
              onClick={handleEditTitle}
              disabled={isGeneratingCover}
              className="w-28"
            >
              Edit title
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleRegenerateCover(false)}
              disabled={isGeneratingCover}
              className="w-28"
            >
              {isGeneratingCover ? 'Generating cover' : 'Regenerate'}
            </Button>
          </div>
        </div>

        {/* 封面样式选择 */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Choose a Cover</h2>
          <div className="flex justify-center space-x-8">
            {coverStyles.map(style => (
              <div
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`relative w-24 h-24 rounded-full cursor-pointer overflow-hidden ${
                  selectedStyle === style.id ? 'ring-2 ring-offset-2 ring-[#FF7F50]' : ''
                }`}
              >
                {style.backgroundImage ? (
                  <>
                    <div
                      className="absolute inset-0 bg-center bg-cover"
                      style={{ backgroundImage: `url(${style.backgroundImage})` }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: style.id === 'modern' ? 'rgba(10, 26, 63, 0.3)' :
                               style.id === 'playful' ? 'rgba(74, 137, 220, 0.2)' :
                               style.id === 'elegant' ? 'rgba(255, 255, 255, 0.2)' :
                               style.id === 'classic' ? 'rgba(245, 235, 220, 0.3)' : 'rgba(0, 0, 0, 0)' }}
                    />
                  </>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: style.background }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 添加标题选择对话框 */}
        <Dialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Choose a Title</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-5">
              <div className="grid grid-cols-1 gap-4">
                <div
                  onClick={() => handleTitleSelect(`${recipientName}'s amazing adventure`)}
                  className="flex items-center p-4 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-lg">{recipientName}'s amazing adventure</h4>
                  </div>
                </div>

                <div
                  onClick={() => handleTitleSelect(`${authorName}'s wonderful ${recipientName}`)}
                  className="flex items-center p-4 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-lg">{authorName}'s wonderful {recipientName}</h4>
                  </div>
                </div>

                <div
                  onClick={() => handleTitleSelect(`THE MAGIC IN ${recipientName}`)}
                  className="flex items-center p-4 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-lg">THE MAGIC IN {recipientName}</h4>
                  </div>
                </div>

                <div
                  onClick={() => handleTitleSelect(`${recipientName}, I love you!`)}
                  className="flex items-center p-4 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-lg">{recipientName}, I love you!</h4>
                  </div>
                </div>

                <div
                  onClick={() => handleTitleSelect(`The little book of ${recipientName}`)}
                  className="flex items-center p-4 rounded-md cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-lg">The little book of {recipientName}</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" className="text-base px-6 py-2 bg-[#FF7F50] text-white hover:bg-[#FF6B35] hover:text-white border-[#FF7F50] hover:border-[#FF6B35]" onClick={() => setIsEditTitleDialogOpen(false)}>
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