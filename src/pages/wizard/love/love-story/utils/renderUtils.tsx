import React from 'react';
import { ContentImageCard } from '../components/ContentImageCard';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

interface ImageText {
  text: string;
  tone: string;
}

// 渲染内容图片函数
export const renderContentImage = (
  imageIndex: number,
  imageStateMap: Record<number, string | undefined>,
  loadingStateMap: Record<number, boolean>,
  handleRegenerateMap: Record<number, (style?: string) => void>,
  imageTexts: ImageText[] | undefined,
  handleRenderContentImage?: (index: number) => Promise<void>
) => {
  const image = imageStateMap[imageIndex];
  const isLoading = loadingStateMap[imageIndex];
  const handleRegenerate = handleRegenerateMap[imageIndex];
  
  // 修正：图像索引与文本索引对应关系
  // 根据新逻辑，图像索引1-10对应文本索引2-11(moment3-12重命名为moment1-10)
  const textIndex = imageIndex + 1; // +1是因为text[0]是cover，text[1]是intro
  const imageText = imageTexts && imageTexts.length > textIndex ? imageTexts[textIndex] : null;
  
  // 显示标题适配新的命名方式 - 显示为Moment 1-10
  let title = "";  // 不再显示标题
  
  // 检查图片是否是渲染后的图片
  const isRenderedImage = image && (
    image.includes(`content-${imageIndex}-`) || 
    image.includes(`love-story-content-rendered-${imageIndex}-`)
  );
  
  return (
    <div>
      <ContentImageCard 
        image={image} 
        isGenerating={isLoading}
        onRegenerate={handleRegenerate}
        index={imageIndex}
        onEditText={() => {}}
        text={imageText?.text}
        title={title}
      />
      
      {/* 添加渲染按钮 - 无论是否是渲染后的图片都显示 */}
      {handleRenderContentImage && image && imageText?.text && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRenderContentImage(imageIndex)}
            disabled={isLoading}
            className="bg-[#8e44ad]/10 text-[#8e44ad] hover:bg-[#8e44ad]/20 border-[#8e44ad]/30"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Render with Text
          </Button>
        </div>
      )}
    </div>
  );
};

// 创建状态映射
export const createImageStateMaps = (
  introImage: string | undefined,
  contentImage1: string | undefined,
  contentImage2: string | undefined,
  contentImage3: string | undefined,
  contentImage4: string | undefined,
  contentImage5: string | undefined,
  contentImage6: string | undefined,
  contentImage7: string | undefined,
  contentImage8: string | undefined,
  contentImage9: string | undefined,
  contentImage10: string | undefined,
  isGeneratingIntro: boolean,
  isGeneratingContent1: boolean,
  isGeneratingContent2: boolean,
  isGeneratingContent3: boolean,
  isGeneratingContent4: boolean,
  isGeneratingContent5: boolean,
  isGeneratingContent6: boolean,
  isGeneratingContent7: boolean,
  isGeneratingContent8: boolean,
  isGeneratingContent9: boolean,
  isGeneratingContent10: boolean,
  handleRegenerateIntro: (style?: string) => void,
  handleRegenerateContent1: (style?: string) => void,
  handleRegenerateContent2: (style?: string) => void,
  handleRegenerateContent3: (style?: string) => void,
  handleRegenerateContent4: (style?: string) => void,
  handleRegenerateContent5: (style?: string) => void,
  handleRegenerateContent6: (style?: string) => void,
  handleRegenerateContent7: (style?: string) => void,
  handleRegenerateContent8: (style?: string) => void,
  handleRegenerateContent9: (style?: string) => void,
  handleRegenerateContent10: (style?: string) => void
) => {
  const imageStateMap: Record<number, string | undefined> = {
    0: introImage,
    1: contentImage1,
    2: contentImage2,
    3: contentImage3,
    4: contentImage4,
    5: contentImage5,
    6: contentImage6,
    7: contentImage7,
    8: contentImage8,
    9: contentImage9,
    10: contentImage10,
  };
  
  const loadingStateMap: Record<number, boolean> = {
    0: isGeneratingIntro,
    1: isGeneratingContent1,
    2: isGeneratingContent2,
    3: isGeneratingContent3,
    4: isGeneratingContent4, 
    5: isGeneratingContent5,
    6: isGeneratingContent6,
    7: isGeneratingContent7,
    8: isGeneratingContent8,
    9: isGeneratingContent9,
    10: isGeneratingContent10,
  };
  
  const handleRegenerateMap: Record<number, (style?: string) => void> = {
    0: handleRegenerateIntro,
    1: handleRegenerateContent1,
    2: handleRegenerateContent2,
    3: handleRegenerateContent3,
    4: handleRegenerateContent4,
    5: handleRegenerateContent5,
    6: handleRegenerateContent6,
    7: handleRegenerateContent7,
    8: handleRegenerateContent8,
    9: handleRegenerateContent9,
    10: handleRegenerateContent10,
  };
  
  return { imageStateMap, loadingStateMap, handleRegenerateMap };
}; 