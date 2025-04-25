import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import ImageAdjustDialog from '@/components/cover-generator/ImageAdjustDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import { useFontContext } from '@/context/FontContext';
import { ImageIcon } from 'lucide-react';

// 定义赞美语接口
interface Praise {
  source: string;
  text: string;
}

// Define combined style presets
const stylePresets = [
  {
    id: 'classic-red',
    name: 'Classic Beige',
    font: 'merriweather',
    template: 'classic',
    layout: 'classic-centered',
    description: 'Warm beige background with navy blue text and circular image'
  },
  {
    id: 'bestseller-style',
    name: 'Bestseller',
    font: 'montserrat',
    template: 'bestseller',
    layout: 'bestseller-modern',
    description: 'Black background with yellow title and blue description area'
  },
  {
    id: 'modern-green',
    name: 'Modern Green',
    font: 'montserrat',
    template: 'vibrant-green',
    layout: 'bold-header',
    description: 'Black background with vibrant green text'
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    font: 'inter',
    template: 'minimal',
    layout: 'centered-title',
    description: 'Gray background with black and white color scheme'
  },
  {
    id: 'pastel-beige',
    name: 'Sweet Pink',
    font: 'times',
    template: 'pastel-beige',
    layout: 'classic-centered',
    description: 'Pink background with purple text'
  }
];

const FunnyBiographyGenerateStep = () => {
  const navigate = useNavigate();
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedStyle, setSelectedStyle] = useState('classic-red');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(100);
  const [praises, setPraises] = useState<Praise[]>([]);
  const { toast } = useToast();

  // 字体加载状态，改为全局 context
  const { fontsLoaded, fontStatus } = useFontContext();
  const currentStyle = stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];

  // PDF状态
  const [frontCoverPdf, setFrontCoverPdf] = useState<string | null>(null);
  const [backCoverPdf, setBackCoverPdf] = useState<string | null>(null);
  const [spinePdf, setSpinePdf] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Canvas引用，用于生成PDF
  const canvasPdfContainerRef = useRef<HTMLDivElement>(null);

  // 生成状态追踪
  const [generationStarted, setGenerationStarted] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [shouldRegenerate, setShouldRegenerate] = useState(false);
  const [lastUsedImage, setLastUsedImage] = useState<string | null>(null);
  const [lastUsedStyle, setLastUsedStyle] = useState<string | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  // 新增状态：跟踪背景去除过程
  const [isBackgroundRemoving, setIsBackgroundRemoving] = useState(false);

  // 使用模版字符串定义尺寸
  const standardPreviewWidth = 360; // 从320增加到360
  const standardPreviewHeight = 540; // 从480增加到540
  const standardSpineWidth = 43; // 从38增加到43，保持书脊宽度的比例一致

  // Get the current style preset
  const getCurrentStyle = () => {
    return stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];
  };

  useEffect(() => {
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
    const savedStyle = localStorage.getItem('funnyBiographySelectedStyle');
    const savedGenerationComplete = localStorage.getItem('funnyBiographyGenerationComplete');

    // 尝试加载已保存的PDF
    const savedFrontCoverPdf = localStorage.getItem('funnyBiographyFrontCoverImage');
    const savedBackCoverPdf = localStorage.getItem('funnyBiographyBackCoverImage');
    const savedSpinePdf = localStorage.getItem('funnyBiographySpineImage');

    if (savedFrontCoverPdf) {
      setFrontCoverPdf(savedFrontCoverPdf);
      setGenerationComplete(true);
    }
    if (savedBackCoverPdf) setBackCoverPdf(savedBackCoverPdf);
    if (savedSpinePdf) setSpinePdf(savedSpinePdf);

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedStyle) {
      setSelectedStyle(savedStyle);
      setLastUsedStyle(savedStyle);
    }

    if (savedIdeas && savedIdeaIndex) {
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(savedIdeaIndex)];
      if (selectedIdea) {
        setCoverTitle(selectedIdea.title || '');
        setSubtitle(selectedIdea.description || '');
        // Always use the authorName from localStorage, ignore any author field from the idea
        if (savedAuthor) {
          setAuthorName(savedAuthor);
        }

        // 获取赞美语
        if (selectedIdea.praises && Array.isArray(selectedIdea.praises)) {
          setPraises(selectedIdea.praises);
        }
      }
    }

    // 优先使用已处理的图片，避免重复进行背景去除
    // 使用sessionStorage而非localStorage来存储大型图片数据
    const sessionProcessedPhoto = sessionStorage.getItem('funnyBiographyProcessedPhoto');
    if (sessionProcessedPhoto) {
      console.log('使用已处理的图片，跳过背景去除');
      setCoverImage(sessionProcessedPhoto);
      setLastUsedImage(sessionProcessedPhoto);
    } else if (savedPhotos) {
      // 设置背景去除状态为true，显示加载中状态
      setIsBackgroundRemoving(true);
      setPdfGenerating(true);

      // 不立即设置原始图片，避免显示未处理的图片
      // 只保存原始图片的引用，用于处理
      setLastUsedImage(savedPhotos);

      // 异步处理图片
      handleImageProcessing(savedPhotos);
    }

    if (savedGenerationComplete === 'true') {
      setGenerationComplete(true);
    }
  }, []);

  // 监听样式变化，只有当样式变化时才触发重新生成
  useEffect(() => {
    if (lastUsedStyle && selectedStyle !== lastUsedStyle) {
      setShouldRegenerate(true);
      setLastUsedStyle(selectedStyle);
      localStorage.setItem('funnyBiographySelectedStyle', selectedStyle);
    }
  }, [selectedStyle, lastUsedStyle]);

  // 检测用户是否在 IdeaStep 中选择了不同的想法
  useEffect(() => {
    const checkIdeaChanged = () => {
      // 检查所有可能的键名
      const ideaChangedTimestamp =
        localStorage.getItem('funnyBiographyIdeaChanged') ||
        localStorage.getItem('funny-biographyIdeaChanged') ||
        localStorage.getItem('friendsIdeaChanged') ||
        localStorage.getItem('funnyBiography');

      if (ideaChangedTimestamp) {
        // 清除所有可能的标记，以免重复触发
        localStorage.removeItem('funnyBiographyIdeaChanged');
        localStorage.removeItem('funny-biographyIdeaChanged');
        localStorage.removeItem('friendsIdeaChanged');
        localStorage.removeItem('funnyBiography');

        console.log('GenerateStep: 检测到想法变更标记，准备重新生成封面');

        // 设置一个新标记，告诉 PreviewStep 需要重新生成章节
        localStorage.setItem('funnyBiographyNeedsChapterRegeneration', Date.now().toString());

        // 清除已有的PDF
        setFrontCoverPdf(null);
        setBackCoverPdf(null);
        setSpinePdf(null);

        // 重置生成状态
        setGenerationStarted(true);
        setGenerationComplete(false);
        localStorage.removeItem('funnyBiographyGenerationComplete');

        // 重新加载选择的想法数据
        const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
        const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
        // 检查是否有已处理的图片，避免重复进行背景去除
        // 使用sessionStorage而非localStorage来存储大型图片数据
        const sessionProcessedPhoto = sessionStorage.getItem('funnyBiographyProcessedPhoto');

        if (savedIdeas && savedIdeaIndex) {
          const ideas = JSON.parse(savedIdeas);
          const selectedIdea = ideas[parseInt(savedIdeaIndex)];
          if (selectedIdea) {
            setCoverTitle(selectedIdea.title || '');
            setSubtitle(selectedIdea.description || '');

            // 获取赞美语
            if (selectedIdea.praises && Array.isArray(selectedIdea.praises)) {
              setPraises(selectedIdea.praises);
            }
          }
        }

        // 如果有已处理的图片，直接使用，不需要重新进行背景去除
        if (sessionProcessedPhoto && coverImage !== sessionProcessedPhoto) {
          console.log('检测到想法变更，使用已处理的图片，跳过背景去除');
          setCoverImage(sessionProcessedPhoto);
          setLastUsedImage(sessionProcessedPhoto);
        }

        // 延迟生成新的图像，确保数据已更新
        setTimeout(() => {
          generateImagesFromCanvas();
        }, 500);

        console.log('检测到想法变更，重新生成封面');
      }
    };

    // 组件挂载时检查一次
    checkIdeaChanged();

    // 设置一个定时器，定期检查是否有想法变更的标记
    // 这是为了处理用户可能从其他页面直接导航到这个页面的情况
    const intervalId = setInterval(checkIdeaChanged, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // 监听图片变化，只有当图片变化时才触发重新生成
  // 注意：现在我们在handleImageProcessing中直接处理背景去除完成后的封面生成
  // 这个useEffect主要用于处理其他情况下的图片变化
  useEffect(() => {
    // 更新lastUsedImage以跟踪图片变化
    if (coverImage && lastUsedImage !== coverImage) {
      setLastUsedImage(coverImage);

      // 只有当不是通过handleImageProcessing函数设置的图片变化才触发重新生成
      // 判断条件：不在生成中且已经生成完成
      if (!pdfGenerating && generationComplete) {
        console.log('检测到图片变化，准备重新生成封面...');
        setShouldRegenerate(true);
      }
    }
  }, [coverImage, lastUsedImage, pdfGenerating, generationComplete]);

  // 只在需要重新生成时执行生成操作
  useEffect(() => {
    if (shouldRegenerate && coverImage && authorName && coverTitle) {
      // 清除已有的PDF
      setFrontCoverPdf(null);
      setBackCoverPdf(null);
      setSpinePdf(null);

      // 重置生成状态
      setGenerationStarted(true);
      setGenerationComplete(false);
      localStorage.removeItem('funnyBiographyGenerationComplete');

      // 生成新的图像
      setTimeout(() => {
        generateImagesFromCanvas();
        setShouldRegenerate(false);
      }, 1000);
    }
  }, [shouldRegenerate, coverImage, authorName, coverTitle]);

  // 保存生成完成的状态到localStorage
  useEffect(() => {
    if (generationComplete) {
      localStorage.setItem('funnyBiographyGenerationComplete', 'true');
    }
  }, [generationComplete]);

  // 监听图片位置和缩放变化，触发重新生成
  useEffect(() => {
    // 只有当图片已经加载并且生成完成后，才在调整位置或缩放时触发重新生成
    if (coverImage && generationComplete) {
      console.log('图片位置或缩放变化，准备重新生成封面...');
      // 设置一个短暂的延迟，避免频繁重新生成
      const timer = setTimeout(() => {
        generateImagesFromCanvas();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [imagePosition, imageScale]);

  // 新的时序处理函数，确保背景去除完成后再生成封面
  const handleImageProcessing = async (imageUrl: string) => {
    // 开始处理时设置生成状态，显示加载中
    setPdfGenerating(true);
    setGenerationComplete(false);
    setIsBackgroundRemoving(true); // 设置背景去除状态为true
    setFrontCoverPdf(null);
    setBackCoverPdf(null);
    setSpinePdf(null);

    try {
      console.log('开始去除背景...');

      // 第一步：去除背景
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageUrl }
      });

      if (error) throw error;

      if (data.success && data.image) {
        // 第二步：保存处理后的图片到sessionStorage
        try {
          sessionStorage.setItem('funnyBiographyProcessedPhoto', data.image);
          console.log('Background removed successfully and saved to sessionStorage');

          // 第三步：更新状态并设置处理后的图片
          console.log('背景去除完成，设置图片并生成封面...');

          // 设置背景去除状态为false
          setIsBackgroundRemoving(false);

          // 直接使用已处理的图片生成封面，不需要等待React状态更新
          // 在generateImagesFromCanvas函数中会优先使用sessionStorage中的图片
          setCoverImage(data.image);

          // 确保选择第二种样式（bestseller-style）
          // 这样可以确保背景去除后立即生成封面
          setSelectedStyle('bestseller-style');
          localStorage.setItem('funnyBiographySelectedStyle', 'bestseller-style');

          // 直接生成封面，不依赖于状态更新和useEffect
          // 这样可以确保封面立即生成，不会卡在加载状态
          setTimeout(() => {
            generateImagesFromCanvas();
          }, 300);

        } catch (storageError) {
          console.error('Error saving to sessionStorage:', storageError);
          // 即使存储失败，仍然继续生成封面
          // 先设置图片，然后生成封面
          console.log('存储失败，但仍然生成封面...');

          // 设置背景去除状态为false
          setIsBackgroundRemoving(false);

          setCoverImage(data.image);

          // 确保选择第二种样式（bestseller-style）
          setSelectedStyle('bestseller-style');
          localStorage.setItem('funnyBiographySelectedStyle', 'bestseller-style');

          // 直接生成封面，不依赖于状态更新和useEffect
          // 这样可以确保封面立即生成，不会卡在加载状态
          setTimeout(() => {
            generateImagesFromCanvas();
          }, 300);
        }
      } else {
        throw new Error('Failed to process image');
      }
    } catch (error) {
      console.error('Error removing background:', error);

      // 设置背景去除状态为false，即使失败也结束背景去除过程
      setIsBackgroundRemoving(false);

      // 如果当前没有设置图片，才使用原始图片
      console.log('背景去除失败，使用原始图片生成封面...');
      if (!coverImage) {
        setCoverImage(imageUrl);
      }

      // 即使背景去除失败，仍然尝试生成封面
      // 确保选择第二种样式（bestseller-style）
      setSelectedStyle('bestseller-style');
      localStorage.setItem('funnyBiographySelectedStyle', 'bestseller-style');

      // 直接生成封面，不依赖于状态更新和useEffect
      // 这样可以确保封面立即生成，不会卡在加载状态
      setTimeout(() => {
        generateImagesFromCanvas();
      }, 300);

      // 显示错误提示
      toast({
        variant: "destructive",
        title: "背景去除失败",
        description: "无法去除图片背景，将使用原始图片。您可以尝试上传其他照片。",
      });
    }

    // 确保字体已加载后再尝试生成
    if (!fontsLoaded) {
      console.log('等待字体加载完成...');
    }
  };

  const handleImageAdjust = (position: { x: number; y: number }, scale: number) => {
    console.log('图片调整保存，新位置:', position, '新缩放比例:', scale);

    // 移除toast提示
    // console.log('正在应用图片调整...');

    // 清除已有的PDF
    setFrontCoverPdf(null);
    setBackCoverPdf(null);
    setSpinePdf(null);

    // 更新状态
    setImagePosition(position);
    setImageScale(scale);

    // 强制重新生成，无论是否已经生成完成
    if (coverImage) {
      // 添加延迟，确保状态已更新
      setTimeout(() => {
        console.log('开始重新生成封面，使用新的位置和缩放值:', { position, scale });
        generateImagesFromCanvas();
      }, 100);
    }
  };

  const handleStyleChange = (styleId: string) => {
    // 更新样式，触发样式变化监听器
    setSelectedStyle(styleId);
  };

  // 生成图像的函数 - 确保使用sessionStorage中的图片
  const generateImagesFromCanvas = async () => {
    if (!fontsLoaded) {
      console.log('字体尚未加载完成，延迟生成...');
      setTimeout(() => {
        generateImagesFromCanvas();
      }, 500);
      return;
    }

    // 检查是否有sessionStorage中的处理后图片，如果有则优先使用
    const sessionProcessedPhoto = sessionStorage.getItem('funnyBiographyProcessedPhoto');
    if (sessionProcessedPhoto && coverImage !== sessionProcessedPhoto) {
      console.log('使用sessionStorage中的处理后图片生成封面');
      setCoverImage(sessionProcessedPhoto);
    }

    // 打印当前的图片位置和缩放值，用于调试
    console.log('生成图像时的图片位置:', imagePosition);
    console.log('生成图像时的缩放比例:', imageScale);

    if (!canvasPdfContainerRef.current || pdfGenerating) return;

    setPdfGenerating(true);

    // 确保 Canvas 已经渲染
    console.log('等待Canvas渲染...');
    setTimeout(() => {
      try {
        if (!canvasPdfContainerRef.current) {
          console.error('Canvas container not found');
          setPdfGenerating(false);
          return;
        }

        // Get all Canvas elements
        const canvases = canvasPdfContainerRef.current.querySelectorAll('canvas');
        if (canvases.length < 3) {
          console.error('Not enough canvas elements found');
          setPdfGenerating(false);
          return;
        }

        // Front cover - 直接保存为图像
        const frontCoverCanvas = canvases[0];
        const frontImgData = frontCoverCanvas.toDataURL('image/jpeg', 0.9);
        setFrontCoverPdf(frontImgData);
        localStorage.setItem('funnyBiographyFrontCoverImage', frontImgData);

        // Spine - 直接保存为图像
        const spineCanvas = canvases[1];
        const spineImgData = spineCanvas.toDataURL('image/jpeg', 0.9);
        setSpinePdf(spineImgData);
        localStorage.setItem('funnyBiographySpineImage', spineImgData);

        // Back cover - 直接保存为图像
        const backCoverCanvas = canvases[2];
        const backImgData = backCoverCanvas.toDataURL('image/jpeg', 0.9);
        setBackCoverPdf(backImgData);
        localStorage.setItem('funnyBiographyBackCoverImage', backImgData);

        // 设置生成完成状态
        setPdfGenerating(false);
        setGenerationComplete(true);

        console.log('All cover images generated successfully');
      } catch (error) {
        console.error('Error generating cover images:', error);
        setPdfGenerating(false);
      }
    }, 600); // 给Canvas渲染提供足够时间
  };

  const handleGenerateBook = () => {
    // If PDFs haven't been generated yet, try generating once
    if (!frontCoverPdf || !backCoverPdf || !spinePdf) {
      generateImagesFromCanvas();
    }

    // Save current style selection to localStorage
    localStorage.setItem('funnyBiographySelectedStyle', selectedStyle);

    // Navigate to the preview page
    navigate('/create/friends/funny-biography/preview');
  };

  return (
    <WizardStep
      title="Create Your Cover"
      description="We've created a cover design based on your ideas"
      previousStep="/create/friends/funny-biography/photos"
      currentStep={5}
      totalSteps={7}
    >
      {fontStatus === 'loading' && (
        <div className="text-center p-4 mb-4 bg-amber-50 text-amber-800 rounded-md">
          Loading fonts, please wait...
        </div>
      )}

      <div className={`transition-opacity duration-300 ${fontStatus === 'loading' ? 'opacity-50' : 'opacity-100'}`}>
        {/* 包含require-fonts类以便在字体加载前隐藏 */}
        <div className="require-fonts">
          <div className="space-y-8">
            {/* Canvas container for generating PDF, not directly displayed */}
            <div className="mx-auto flex justify-center" ref={canvasPdfContainerRef} style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}>
              <CanvasCoverPreview
                coverTitle={coverTitle}
                subtitle={subtitle}
                authorName={authorName}
                coverImage={coverImage}
                selectedFont={currentStyle.font}
                selectedTemplate={currentStyle.template}
                selectedLayout={currentStyle.layout}
                category="friends"
                imagePosition={imagePosition}
                imageScale={imageScale}
                onImageAdjust={handleImageAdjust}
                scaleFactor={0.8} // 从0.7增加到0.8，使生成的PDF尺寸更大
                praises={praises}
                previewMode={false}
              />
            </div>

            {/* PDF预览区域 - 简化版本 */}
            <div className="mx-auto flex flex-col items-center my-8">
              {!frontCoverPdf || pdfGenerating || isBackgroundRemoving ? (
                <div className="flex items-center justify-center h-[540px]">
                  <div className="animate-spin h-12 w-12 border-4 border-[#FF7F50] border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-xl">
                    Generating cover...
                  </span>
                </div>
              ) : (
                <div className="flex items-start space-x-4 justify-center">
                  {/* 前封面 */}
                  <div className="flex flex-col items-center">
                    <div style={{ width: `${standardPreviewWidth}px`, height: `${standardPreviewHeight}px`, aspectRatio: '2/3' }} className="border shadow-md bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={frontCoverPdf}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        alt="Front Cover"
                      />
                    </div>
                  </div>

                  {/* 书脊 */}
                  <div className="flex flex-col items-center">
                    <div style={{ width: `${standardSpineWidth}px`, height: `${standardPreviewHeight}px` }} className="border shadow-md bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={spinePdf || ''}
                        style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                        alt="Spine"
                      />
                    </div>
                  </div>

                  {/* 后封面 */}
                  <div className="flex flex-col items-center">
                    <div style={{ width: `${standardPreviewWidth}px`, height: `${standardPreviewHeight}px`, aspectRatio: '2/3' }} className="border shadow-md bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={backCoverPdf || ''}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        alt="Back Cover"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 添加图片调整按钮 - 在背景去除过程中显示但禁用 */}
            {coverImage && (
              <div className="flex justify-center mb-6">
                <Button
                  variant="outline"
                  className={`flex items-center gap-2 rounded-full px-6 py-2 bg-white shadow-sm transition-shadow ${
                    isBackgroundRemoving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                  onClick={() => !isBackgroundRemoving && setIsAdjustDialogOpen(true)}
                  disabled={isBackgroundRemoving}
                >
                  <ImageIcon className="w-5 h-5" />
                  Adjust image
                </Button>
              </div>
            )}

            {/* 图片调整对话框 */}
            {coverImage && (
              <ImageAdjustDialog
                open={isAdjustDialogOpen}
                onOpenChange={setIsAdjustDialogOpen}
                onSave={handleImageAdjust}
                initialPosition={imagePosition}
                initialScale={imageScale}
                coverImage={coverImage}
              />
            )}

            <div className="space-y-4 mt-4">
              <div className="flex flex-wrap justify-center gap-6">
                {[...stylePresets].map((style) => {
                  // Define style colors to match the image
                  let styleConfig: { bg: string; text: string; border: string };
                  if (style.id === 'classic-red') {
                    styleConfig = { bg: '#C41E3A', text: '#FFFFFF', border: 'none' }; // Red with white text (first circle)
                  } else if (style.id === 'bestseller-style') {
                    styleConfig = { bg: '#4361EE', text: '#F7DC6F', border: 'none' }; // Blue with yellow text
                  } else if (style.id === 'modern-green') {
                    styleConfig = { bg: '#E6DEC9', text: '#D4AF37', border: 'none' }; // 折中的奶油色底金字
                  } else if (style.id === 'minimal-gray') {
                    styleConfig = { bg: '#D9D9D9', text: '#FFFFFF', border: 'none' }; // 浅灰色背景，白色文字
                  } else if (style.id === 'pastel-beige') {
                    styleConfig = { bg: '#FFC0CB', text: '#8A2BE2', border: 'none' }; // 粉色背景，紫色文字
                  }

                  return (
                    <div
                      key={style.id}
                      onClick={() => !isBackgroundRemoving && handleStyleChange(style.id)}
                      className={`flex flex-col items-center ${isBackgroundRemoving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div
                        className={`w-[80px] h-[80px] rounded-full flex items-center justify-center transition-all ${
                          selectedStyle === style.id
                            ? 'ring-4 ring-[#FF7F50] ring-offset-2'
                            : isBackgroundRemoving
                              ? ''
                              : 'hover:ring-2 hover:ring-[#FF7F50]/50 cursor-pointer'
                        }`}
                        style={{
                          backgroundColor: styleConfig.bg,
                          border: styleConfig.border
                        }}
                      >
                        <span
                          className="text-3xl font-bold"
                          style={{
                            color: styleConfig.text,
                            fontFamily: style.font === 'playfair' ? 'serif'
                                     : style.font === 'merriweather' ? 'serif'
                                     : style.font === 'montserrat' ? 'sans-serif'
                                     : style.font === 'roboto' ? 'sans-serif'
                                     : 'sans-serif',
                            fontWeight: style.font === 'montserrat' || style.font === 'roboto' ? '700' : '800',
                          }}
                        >
                          Aa
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <Button
                className="w-full py-6 text-lg bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white"
                onClick={handleGenerateBook}
                disabled={pdfGenerating || isBackgroundRemoving}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;
