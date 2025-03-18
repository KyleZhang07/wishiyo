
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';
import { Edit, Wand2, RefreshCw } from 'lucide-react';

// 导入工具函数
import { expandImage, handleGenericContentRegeneration as handleContentRegeneration } from './utils/imageProcessingUtils';
import { renderContentImage, createImageStateMaps } from './utils/renderUtils';
import { loadImagesFromSupabase as fetchImagesFromSupabase } from './utils/storageUtils';
import { renderAndUploadContentImage } from './utils/canvasUtils';
import { generateAndRenderBlessing } from './utils/blessingUtils';

interface ImageText {
  text: string;
  tone: string;
}

// Interface to track image storage locations
interface ImageStorageMap {
  [key: string]: {
    localStorageKey: string;
    url?: string;  // Supabase Storage URL
  };
}

// Interface for Supabase image objects
interface SupabaseImage {
  name: string;
  url: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  id: string;
}

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [personName, setPersonName] = useState('');
  const [backCoverText, setBackCoverText] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [introImage, setIntroImage] = useState<string>();
  const [contentImage1, setContentImage1] = useState<string>();
  const [contentImage2, setContentImage2] = useState<string>();
  const [contentImage3, setContentImage3] = useState<string>();
  const [contentImage4, setContentImage4] = useState<string>();
  const [contentImage5, setContentImage5] = useState<string>();
  const [contentImage6, setContentImage6] = useState<string>();
  const [contentImage7, setContentImage7] = useState<string>();
  const [contentImage8, setContentImage8] = useState<string>();
  const [contentImage9, setContentImage9] = useState<string>();
  const [contentImage10, setContentImage10] = useState<string>();
  
  // 生成状态
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);
  const [isGeneratingContent1, setIsGeneratingContent1] = useState(false);
  const [isGeneratingContent2, setIsGeneratingContent2] = useState(false);
  const [isGeneratingContent3, setIsGeneratingContent3] = useState(false);
  const [isGeneratingContent4, setIsGeneratingContent4] = useState(false);
  const [isGeneratingContent5, setIsGeneratingContent5] = useState(false);
  const [isGeneratingContent6, setIsGeneratingContent6] = useState(false);
  const [isGeneratingContent7, setIsGeneratingContent7] = useState(false);
  const [isGeneratingContent8, setIsGeneratingContent8] = useState(false);
  const [isGeneratingContent9, setIsGeneratingContent9] = useState(false);
  const [isGeneratingContent10, setIsGeneratingContent10] = useState(false);

  // 样式和内容
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [selectedTone, setSelectedTone] = useState<string>('Heartfelt');
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);
  const [blessing, setBlessing] = useState<string>('');

  // 存储状态
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);
  const [imageStorageMap, setImageStorageMap] = useState<ImageStorageMap>({});

  const { toast } = useToast();
  const navigate = useNavigate();

  // 刷新 Supabase 图片
  const refreshSupabaseImages = async () => {
    try {
      await fetchImagesFromSupabase(
        setIsLoadingImages,
        setSupabaseImages,
        setImageStorageMap,
        setCoverImage,
        setIntroImage,
        setContentImage1,
        setContentImage2,
        setContentImage3,
        setContentImage4,
        setContentImage5,
        setContentImage6,
        setContentImage7,
        setContentImage8,
        setContentImage9,
        setContentImage10,
        toast
      );
    } catch (error) {
      console.error('Error refreshing images:', error);
      toast({
        title: "Error refreshing images",
        description: "Failed to load images from storage",
        variant: "destructive",
      });
    }
  };
  
  // 创建一个无参数的回调函数，用于传递给其他函数
  const refreshImagesCallback = () => {
    refreshSupabaseImages();
  };

  // 内容重新生成函数封装
  const handleGenericContentRegeneration = async (index: number, style?: string) => {
    const stateSetters = {
      1: setContentImage1, 2: setContentImage2, 3: setContentImage3, 4: setContentImage4, 
      5: setContentImage5, 6: setContentImage6, 7: setContentImage7, 8: setContentImage8, 
      9: setContentImage9, 10: setContentImage10
    };
    
    const loadingSetters = {
      1: setIsGeneratingContent1, 2: setIsGeneratingContent2, 3: setIsGeneratingContent3, 
      4: setIsGeneratingContent4, 5: setIsGeneratingContent5, 6: setIsGeneratingContent6,
      7: setIsGeneratingContent7, 8: setIsGeneratingContent8, 9: setIsGeneratingContent9,
      10: setIsGeneratingContent10
    };
    
    // 调用工具函数中的handleGenericContentRegeneration
    await handleContentRegeneration(
      index,
      style,
      stateSetters,
      loadingSetters,
      supabaseImages,
      selectedStyle,
      setSelectedStyle,
      toast,
      refreshImagesCallback  // 使用无参数的回调函数
    );
  };

  const handleRegenerateContent1 = (style?: string) => handleGenericContentRegeneration(1, style);
  const handleRegenerateContent2 = (style?: string) => handleGenericContentRegeneration(2, style);
  const handleRegenerateContent3 = (style?: string) => handleGenericContentRegeneration(3, style);
  const handleRegenerateContent4 = (style?: string) => handleGenericContentRegeneration(4, style);
  const handleRegenerateContent5 = (style?: string) => handleGenericContentRegeneration(5, style);
  const handleRegenerateContent6 = (style?: string) => handleGenericContentRegeneration(6, style);
  const handleRegenerateContent7 = (style?: string) => handleGenericContentRegeneration(7, style);
  const handleRegenerateContent8 = (style?: string) => handleGenericContentRegeneration(8, style);
  const handleRegenerateContent9 = (style?: string) => handleGenericContentRegeneration(9, style);
  const handleRegenerateContent10 = (style?: string) => handleGenericContentRegeneration(10, style);

  // 生成祝福语并将其保存为图片
  const handleGenerateBlessing = async () => {
    setIsGeneratingIntro(true);
    
    try {
      toast({
        title: "生成祝福语",
        description: "正在为您生成个性化祝福语...",
      });
      
      // 获取生成所需的姓名和风格
      const result = await generateAndRenderBlessing(
        personName,
        authorName,
        selectedTone
      );
      
      // 保存祝福语文本
      setBlessing(result.blessing);
      localStorage.setItem('loveStoryBlessing', result.blessing);
      
      // 保存祝福语图片URL
      setIntroImage(result.imageUrl);
      localStorage.setItem('loveStoryIntroImage_url', result.imageUrl);
      
      // 更新imageStorageMap
      setImageStorageMap(prev => ({
        ...prev,
        ['loveStoryIntroImage']: {
          localStorageKey: 'loveStoryIntroImage',
          url: result.imageUrl
        }
      }));
      
      toast({
        title: "祝福语生成成功",
        description: "您的个性化祝福语已准备就绪！",
      });
      
      // 刷新图片列表，确保显示新生成的祝福语图片
      setTimeout(() => {
        refreshImagesCallback();
      }, 1000);
    } catch (error: any) {
      console.error("生成祝福语时出错:", error);
      toast({
        title: "生成祝福语失败",
        description: error.message || "请重试",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  // 辅助函数：获取图片类型
  const getImageType = (imageName: string): string => {
    if (imageName.includes('love-story-cover')) return 'cover';
    if (imageName.includes('love-story-blessing') || imageName.includes('love-story-intro')) return 'intro';
    if (imageName.includes('love-story-content')) return 'content';
    return 'other';
  };
  
  // 辅助函数：获取内容图片的索引
  const getContentIndex = (imageName: string): number => {
    const match = imageName.match(/love-story-content-(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 999; // 默认值，确保未识别的内容排在最后
  };

  useEffect(() => {
    // 加载文本内容和设置
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    const savedPersonName = localStorage.getItem('loveStoryPersonName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedStyle = localStorage.getItem('loveStoryStyle');
    const savedTone = localStorage.getItem('loveStoryTone');
    const savedTexts = localStorage.getItem('loveStoryImageTexts');
    const savedBlessing = localStorage.getItem('loveStoryBlessing');
    
    // 直接从Supabase加载所有图片
    refreshImagesCallback();

    if (savedAuthorName) {
      setAuthorName(savedAuthorName);
    }

    if (savedPersonName) {
      setPersonName(savedPersonName);
    }

    if (savedTone) {
      setSelectedTone(savedTone);
    }

    if (savedStyle) {
      // Map old style names to new API-compatible style names
      const styleMapping: Record<string, string> = {
        'Comic Book': 'Comic book',
        'Line Art': 'Line art',
        'Fantasy Art': 'Fantasy art',
        'Photographic': 'Photographic (Default)',
        'Disney Character': 'Disney Charactor'
      };
      
      // Use the mapping or the original value
      const normalizedStyle = styleMapping[savedStyle] || savedStyle;
      setSelectedStyle(normalizedStyle);
      
      // Update localStorage with the normalized style if it changed
      if (normalizedStyle !== savedStyle) {
        localStorage.setItem('loveStoryStyle', normalizedStyle);
      }
    }

    if (savedTexts) {
      try {
        setImageTexts(JSON.parse(savedTexts));
      } catch (error) {
        console.error('Error parsing saved texts:', error);
      }
    }

    if (savedIdeas && savedIdeaIndex) {
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(savedIdeaIndex)];
      if (selectedIdea) {
        // 保持主标题为"THE MAGIC IN"
        setCoverTitle('THE MAGIC IN');
        setSubtitle(selectedIdea.description || '');
      }
    }

    if (savedMoments) {
      const moments = JSON.parse(savedMoments);
      const formattedMoments = moments
        .map((moment: string) => `"${moment}"`)
        .join('\n\n');
      setBackCoverText(formattedMoments);
    }
    
    // 加载已保存的祝福语
    if (savedBlessing) {
      setBlessing(savedBlessing);
    } else if (savedPersonName && savedAuthorName && savedTone) {
      // 如果没有保存的祝福语但有必要的信息，自动生成一个
      handleGenerateBlessing();
    }
  }, []);

  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
    // 导航到CoverStep页面
    navigate('/create/love/love-story/cover');
  };

  // 处理函数定义
  const refreshImages = async () => {
    toast({
      title: "Refreshing images",
      description: "Loading latest images from Supabase Storage",
    });
    
    await refreshImagesCallback();
  };

  // 创建图像状态映射
  const { imageStateMap, loadingStateMap, handleRegenerateMap } = createImageStateMaps(
    introImage, contentImage1, contentImage2, contentImage3, contentImage4,
    contentImage5, contentImage6, contentImage7, contentImage8, contentImage9, contentImage10,
    isGeneratingIntro, isGeneratingContent1, isGeneratingContent2, isGeneratingContent3, isGeneratingContent4,
    isGeneratingContent5, isGeneratingContent6, isGeneratingContent7, isGeneratingContent8, 
    isGeneratingContent9, isGeneratingContent10,
    handleRegenerateBlessing, handleRegenerateContent1, handleRegenerateContent2, handleRegenerateContent3,
    handleRegenerateContent4, handleRegenerateContent5, handleRegenerateContent6, handleRegenerateContent7,
    handleRegenerateContent8, handleRegenerateContent9, handleRegenerateContent10
  );

  // 处理渲染内容图片的函数
  const handleRenderContentImage = async (index: number) => {
    try {
      // 获取对应的图片和文本
      const image = imageStateMap[index];
      // 图像索引1-10对应文本索引2-11
      const textIndex = index + 1;
      const text = imageTexts && imageTexts.length > textIndex ? imageTexts[textIndex].text : "";
      
      if (!image) {
        toast({
          title: "Error",
          description: `No image found for content ${index}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Rendering content image",
        description: `Processing content ${index} with text...`,
      });
      
      // 设置加载状态
      const setLoadingFn = loadingStateMap[index] !== undefined ? 
        (value: boolean) => {
          const setters = {
            1: setIsGeneratingContent1,
            2: setIsGeneratingContent2,
            3: setIsGeneratingContent3,
            4: setIsGeneratingContent4,
            5: setIsGeneratingContent5,
            6: setIsGeneratingContent6,
            7: setIsGeneratingContent7,
            8: setIsGeneratingContent8,
            9: setIsGeneratingContent9,
            10: setIsGeneratingContent10,
          };
          const setter = setters[index as keyof typeof setters];
          if (setter) setter(value);
        } : 
        () => {};
      
      setLoadingFn(true);
      
      // 渲染并上传图片
      const storageUrl = await renderAndUploadContentImage(
        image,
        text || "A beautiful moment captured in this image.",
        index,
        selectedStyle,
        supabaseImages
      );
      
      // 更新状态 - 直接使用渲染后的图片URL
      const setContentFn = {
        1: setContentImage1,
        2: setContentImage2,
        3: setContentImage3,
        4: setContentImage4,
        5: setContentImage5,
        6: setContentImage6,
        7: setContentImage7,
        8: setContentImage8,
        9: setContentImage9,
        10: setContentImage10,
      }[index];
      
      if (setContentFn) {
        setContentFn(storageUrl);
        
        // 更新localStorage
        localStorage.setItem(`loveStoryContentImage${index}_url`, storageUrl);
        
        // 更新imageStorageMap
        setImageStorageMap(prev => ({
          ...prev,
          [`loveStoryContentImage${index}`]: {
            localStorageKey: `loveStoryContentImage${index}`,
            url: storageUrl
          }
        }));
      }
      
      toast({
        title: "Content image rendered",
        description: `Content ${index} successfully rendered with text`,
      });
    } catch (error: any) {
      console.error(`Error rendering content image ${index}:`, error);
      toast({
        title: "Error rendering image",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      // 重置加载状态
      const setLoadingFn = {
        1: setIsGeneratingContent1,
        2: setIsGeneratingContent2,
        3: setIsGeneratingContent3,
        4: setIsGeneratingContent4,
        5: setIsGeneratingContent5,
        6: setIsGeneratingContent6,
        7: setIsGeneratingContent7,
        8: setIsGeneratingContent8,
        9: setIsGeneratingContent9,
        10: setIsGeneratingContent10,
      }[index];
      
      if (setLoadingFn) setLoadingFn(false);
    }
  };

  // 批量渲染所有内容图片
  const handleRenderAllContentImages = async () => {
    toast({
      title: "Rendering all images",
      description: "This may take a minute...",
    });
    
    // 获取所有有图片和文本的内容索引
    const contentIndices = [];
    for (let i = 1; i <= 10; i++) {
      if (imageStateMap[i] && imageTexts && imageTexts.length > i+1) {
        contentIndices.push(i);
      }
    }
    
    if (contentIndices.length === 0) {
      toast({
        title: "No content to render",
        description: "Please generate images first",
        variant: "destructive",
      });
      return;
    }

    try {
      // 设置所有内容为加载状态
      contentIndices.forEach(index => {
        const setLoadingFn = {
          1: setIsGeneratingContent1,
          2: setIsGeneratingContent2,
          3: setIsGeneratingContent3,
          4: setIsGeneratingContent4,
          5: setIsGeneratingContent5,
          6: setIsGeneratingContent6,
          7: setIsGeneratingContent7,
          8: setIsGeneratingContent8,
          9: setIsGeneratingContent9,
          10: setIsGeneratingContent10,
        }[index];
        
        if (setLoadingFn) setLoadingFn(true);
      });

      // 依次渲染每个内容图片
      for (const index of contentIndices) {
        await handleRenderContentImage(index);
      }
      
      toast({
        title: "All images rendered",
        description: `Successfully rendered ${contentIndices.length} content images with text`,
      });
    } catch (error: any) {
      console.error("Error rendering all images:", error);
      toast({
        title: "Error rendering images",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      // 重置所有加载状态
      contentIndices.forEach(index => {
        const setLoadingFn = {
          1: setIsGeneratingContent1,
          2: setIsGeneratingContent2,
          3: setIsGeneratingContent3,
          4: setIsGeneratingContent4,
          5: setIsGeneratingContent5,
          6: setIsGeneratingContent6,
          7: setIsGeneratingContent7,
          8: setIsGeneratingContent8,
          9: setIsGeneratingContent9,
          10: setIsGeneratingContent10,
        }[index];
        
        if (setLoadingFn) setLoadingFn(false);
      });
    }
  };

  // 重新生成祝福语
  const handleRegenerateBlessing = async () => {
    setIsGeneratingIntro(true);
    
    try {
      toast({
        title: "重新生成祝福语",
        description: "正在为您生成新的祝福语...",
      });
      
      // 生成新的祝福语并保存为图片
      const result = await generateAndRenderBlessing(
        personName,
        authorName,
        selectedTone
      );
      
      // 保存祝福语文本
      setBlessing(result.blessing);
      localStorage.setItem('loveStoryBlessing', result.blessing);
      
      // 保存祝福语图片URL
      setIntroImage(result.imageUrl);
      localStorage.setItem('loveStoryIntroImage_url', result.imageUrl);
      
      // 更新imageStorageMap
      setImageStorageMap(prev => ({
        ...prev,
        ['loveStoryIntroImage']: {
          localStorageKey: 'loveStoryIntroImage',
          url: result.imageUrl
        }
      }));
      
      toast({
        title: "祝福语更新成功",
        description: "您的新祝福语已准备就绪！",
      });
      
      // 刷新图片列表
      setTimeout(() => {
        refreshImagesCallback();
      }, 1000);
    } catch (error: any) {
      console.error("重新生成祝福语时出错:", error);
      toast({
        title: "重新生成祝福语失败",
        description: error.message || "请重试",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  return (
    <WizardStep
      title="Your Love Story Images"
      description="Here are your personalized love story images with accompanying text."
      previousStep="/create/love/love-story/debug-prompts"
      nextStep="/create/love/love-story/format"
      currentStep={7}
      totalSteps={9}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* 添加 Refresh Images 按钮 */}
        <div className="mb-8 flex justify-end gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRenderAllContentImages}
            disabled={isLoadingImages}
            className="bg-[#8e44ad]/10 text-[#8e44ad] hover:bg-[#8e44ad]/20 border-[#8e44ad]/30 mr-2"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Render All Content
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshImages}
            disabled={isLoadingImages}
            className="bg-[#FF7F50]/10 text-[#FF7F50] hover:bg-[#FF7F50]/20 border-[#FF7F50]/30"
          >
            {isLoadingImages ? 'Loading...' : 'Refresh Images'}
          </Button>
        </div>
      
        {/* Cover section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            Cover
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleEditCover}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </h2>
          <div className="max-w-xl mx-auto">
            {coverImage && (
              <CoverPreviewCard
                coverTitle={coverTitle}
                subtitle={subtitle}
                authorName={authorName}
                coverImage={coverImage}
                backCoverText={backCoverText}
                isGeneratingCover={isGeneratingCover}
              />
            )}
            {!coverImage && (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Cover image not available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 介绍部分 - 祝福语 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            Dedication
          </h2>
          <div className="mb-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg overflow-hidden shadow-lg">
              {/* 祝福语图片 */}
              {introImage ? (
                <div className="relative">
                  <img 
                    src={introImage} 
                    alt="Blessing" 
                    className="w-full h-auto"
                  />
                  {isGeneratingIntro && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mb-2"></div>
                        <p className="text-white">Generating...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Blessing not generated yet</p>
                </div>
              )}
              
              {/* 祝福语控制按钮 */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Tone: <span className="font-medium">{selectedTone}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateBlessing}
                    disabled={isGeneratingIntro}
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Blessing
                  </Button>
                </div>
                
                {/* 显示祝福语文本预览 */}
                {blessing && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-xs uppercase font-medium text-gray-500 mb-2">Blessing Preview:</h4>
                    <p className="text-sm text-gray-700 italic">{blessing.substring(0, 100)}...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 内容部分 */}
        <div className="border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Story Content</h2>
          <div className="space-y-12">
            {/* 渲染内容图片 */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(index => {
              const image = imageStateMap[index];
              const isLoading = loadingStateMap[index] || false;
              const regenerateHandler = handleRegenerateMap[index];
              
              // 只显示有图片的内容
              if (!image) return null;
              
              // 图像索引1-10对应文本索引2-11
              const textIndex = index + 1;
              const text = imageTexts && imageTexts.length > textIndex ? imageTexts[textIndex].text : undefined;
              const title = `Moment ${index}`;
              
              return (
                <div key={`content-${index}`} className="mb-12">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium">{title}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRenderContentImage(index)}
                      disabled={isLoading}
                      className="bg-[#8e44ad]/10 text-[#8e44ad] hover:bg-[#8e44ad]/20 border-[#8e44ad]/30"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Render with Text
                    </Button>
                  </div>
                  <ContentImageCard
                    image={image}
                    isGenerating={isLoading}
                    onRegenerate={regenerateHandler}
                    index={index}
                    onEditText={() => {}}
                    text={text}
                    title={title}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
