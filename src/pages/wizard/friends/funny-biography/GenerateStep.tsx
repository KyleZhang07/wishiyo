import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import { useFontLoader, preloadFonts } from '@/hooks/useFontLoader';

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

  // 字体加载状态
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const currentStyle = stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];
  const fontStatus = useFontLoader(currentStyle.font);

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

    if (savedPhotos) {
      handleImageProcessing(savedPhotos);
      setLastUsedImage(savedPhotos);
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
  useEffect(() => {
    if (coverImage && lastUsedImage !== coverImage && !generationComplete) {
      setShouldRegenerate(true);
      setLastUsedImage(coverImage);
    } else if (coverImage && !lastUsedImage) {
      // 如果是第一次加载图片但没有lastUsedImage记录，只更新lastUsedImage，不触发重新生成
      setLastUsedImage(coverImage);
    }
  }, [coverImage, lastUsedImage, generationComplete]);

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

  // 监听字体加载状态
  useEffect(() => {
    if (fontStatus === 'loaded') {
      setFontsLoaded(true);
    } else if (fontStatus === 'error') {
      console.error(`无法加载字体 ${currentStyle.font}，使用后备字体`);
      // 继续使用备用字体
      setFontsLoaded(true);
      toast({
        title: "字体加载提示",
        description: "部分字体无法加载，已使用系统字体替代",
        variant: "default"
      });
    }
  }, [fontStatus, currentStyle.font, toast]);

  // 预加载所有字体
  useEffect(() => {
    preloadFonts().then(() => {
      console.log('所有字体预加载完成');
    });
  }, []);

  const handleImageProcessing = async (imageUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageUrl }
      });

      if (error) throw error;

      if (data.success && data.image) {
        setCoverImage(data.image);
      } else {
        throw new Error('Failed to process image');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        variant: "destructive",
        title: "Error processing image",
        description: "Failed to remove background from the image. Please try again."
      });
      setCoverImage(imageUrl);
    }
    
    // 确保字体已加载后再尝试生成
    if (!fontsLoaded) {
      console.log('等待字体加载完成...');
      toast({
        title: "正在准备资源",
        description: "正在加载字体资源，稍等片刻...",
        variant: "default"
      });
    }
  };

  const handleImageAdjust = (position: { x: number; y: number }, scale: number) => {
    setImagePosition(position);
    setImageScale(scale);
  };

  const handleStyleChange = (styleId: string) => {
    // 更新样式，触发样式变化监听器
    setSelectedStyle(styleId);
  };

  // 生成图像的函数
  const generateImagesFromCanvas = async () => {
    if (!fontsLoaded) {
      console.log('字体尚未加载完成，延迟生成...');
      setTimeout(() => {
        generateImagesFromCanvas();
      }, 500);
      return;
    }

    if (!canvasPdfContainerRef.current || pdfGenerating) return;

    setPdfGenerating(true);

    // Ensure Canvas is rendered
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
    }, 500); // Give time for canvas rendering
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
              {!frontCoverPdf || pdfGenerating ? (
                <div className="flex items-center justify-center h-[540px]">
                  <div className="animate-spin h-12 w-12 border-4 border-[#FF7F50] border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-xl">Generating cover...</span>
                </div>
              ) : (
                <div className="flex items-start space-x-4 justify-center">
                  {/* 前封面 */}
                  <div className="flex flex-col items-center">
                    <img
                      src={frontCoverPdf}
                      style={{ width: `${standardPreviewWidth}px`, height: `${standardPreviewHeight}px` }}
                      className="border shadow-md object-cover bg-gray-50"
                      alt="Front Cover"
                    />
                  </div>

                  {/* 书脊 */}
                  <div className="flex flex-col items-center">
                    <img
                      src={spinePdf || ''}
                      style={{ width: `${standardSpineWidth}px`, height: `${standardPreviewHeight}px` }}
                      className="border shadow-md object-cover bg-gray-50"
                      alt="Spine"
                    />
                  </div>

                  {/* 后封面 */}
                  <div className="flex flex-col items-center">
                    <img
                      src={backCoverPdf || ''}
                      style={{ width: `${standardPreviewWidth}px`, height: `${standardPreviewHeight}px` }}
                      className="border shadow-md object-cover bg-gray-50"
                      alt="Back Cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex flex-wrap justify-center gap-6">
                {[...stylePresets].map((style, index) => {
                  // Get template and layout data based on style configuration
                  const template = style.template;

                  // Define style colors to match the image
                  let styleConfig;
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
                      onClick={() => handleStyleChange(style.id)}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`w-[80px] h-[80px] rounded-full flex items-center justify-center cursor-pointer transition-all ${
                          selectedStyle === style.id
                            ? 'ring-4 ring-[#FF7F50] ring-offset-2'
                            : 'hover:ring-2 hover:ring-[#FF7F50]/50'
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
                disabled={pdfGenerating}
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
