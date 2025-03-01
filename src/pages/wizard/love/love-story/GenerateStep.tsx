import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getAllImagesFromStorage } from '@/integrations/supabase/storage';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';

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

  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);

  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);

  const { toast } = useToast();

  // Add state for tracking Supabase image URLs
  const [imageStorageMap, setImageStorageMap] = useState<ImageStorageMap>({});

  const expandImage = async (imageUrl: string): Promise<string> => {
    try {
      console.log('Starting image expansion for:', imageUrl);
      const { data, error } = await supabase.functions.invoke('expand-image', {
        body: { 
          imageUrl,
          textPrompt: "The expanded area should be: very clean with no objects and shapes; suitable for text placement(clean background); soft gradient background matching the original image tone; seamless transition"
        }
      });
      
      if (error) throw error;
      if (!data?.imageData) {
        throw new Error("No imageData returned from expand-image");
      }
      
      return data.imageData;
    } catch (err) {
      console.error("Error expanding image:", err);
      throw err;
    }
  };

  const handleGenericContentRegeneration = async (index: number, style?: string) => {
    if (index < 1) return;

    const stateSetters = {
      1: setContentImage1,
      2: setContentImage2,
      3: setContentImage3,
      4: setContentImage4,
      5: setContentImage5,
      6: setContentImage6,
      7: setContentImage7,
      8: setContentImage8,
      9: setContentImage9,
      10: setContentImage10
    };

    const loadingSetters = {
      1: setIsGeneratingContent1,
      2: setIsGeneratingContent2,
      3: setIsGeneratingContent3,
      4: setIsGeneratingContent4, 
      5: setIsGeneratingContent5,
      6: setIsGeneratingContent6,
      7: setIsGeneratingContent7,
      8: setIsGeneratingContent8,
      9: setIsGeneratingContent9,
      10: setIsGeneratingContent10
    };

    const setContentFn = stateSetters[index as keyof typeof stateSetters];
    const setIsGenerating = loadingSetters[index as keyof typeof loadingSetters];
    if (!setContentFn || !setIsGenerating) return;

    const lsKey = `loveStoryContentImage${index}`;
    
    // Clear existing localStorage entry
    localStorage.removeItem(lsKey);

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    const savedTone = localStorage.getItem('loveStoryTone');
    if (!savedPrompts || !partnerPhoto) {
      toast({
        title: "Missing info",
        description: "No prompts or partner photo found",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      // 修复索引问题 - 确保正确访问提示数组
      const promptIndex = index <= prompts.length ? index : prompts.length - 1;
      if (!prompts[promptIndex]) {
        throw new Error(`No prompt found for content index ${promptIndex}`);
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      
      // Update the stored style if a new one is provided
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
      }

      // 使用更明确的请求格式
      const requestBody = {
        prompt: prompts[promptIndex].prompt,
        photo: partnerPhoto,
        style: imageStyle,
        contentIndex: index,  // 明确指定内容索引
        type: 'content'       // 明确内容类型
      };

      console.log(`Content ${index} generation request:`, JSON.stringify(requestBody));

      // 启动并行任务: 同时生成图片和文本
      const [imageResult, textResult] = await Promise.all([
        // 1. 图片生成任务
        (async () => {
          // Include style in the request
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          
          if (error) throw error;

          console.log(`Content ${index} generation response:`, data);

          // 后端可能返回 { output: [...]} 或 { contentImageX: [...] }
          const imageUrl = data?.[`contentImage${index}`]?.[0] || data?.output?.[0];
          if (!imageUrl) {
            throw new Error("No image generated from generate-love-cover");
          }

          // 2) 调用expand-image进行扩展
          const expandedBase64 = await expandImage(imageUrl);

          // 使用时间戳确保文件名唯一
          const timestamp = Date.now();

          // 3) Upload to Supabase Storage instead of localStorage - 修复文件名问题
          // 使用明确的数字标识符和时间戳
          const storageUrl = await uploadImageToStorage(
            expandedBase64, 
            'images', 
            `love-story-content-${index}-${timestamp}`
          );

          // 4) Update state and storage map
          setContentFn(expandedBase64);
          setImageStorageMap(prev => ({
            ...prev,
            [lsKey]: {
              localStorageKey: lsKey,
              url: storageUrl
            }
          }));

          // 5) Store only the URL reference in localStorage
          localStorage.setItem(`${lsKey}_url`, storageUrl);

          return expandedBase64;
        })(),

        // 2. 文本生成任务 - 仅为当前索引生成新文本
        (async () => {
          if (!savedTone) return null;

          // 只为当前的index生成文本
          const singlePrompt = [prompts[promptIndex]];
          const personName = localStorage.getItem('loveStoryPersonName') || '';
          
          console.log(`Generating text for content ${index} with tone: ${savedTone}`);
          
          const { data, error } = await supabase.functions.invoke('generate-image-texts', {
            body: { 
              prompts: singlePrompt,
              tone: savedTone,
              personName
            }
          });
          
          if (error) throw error;
          
          if (!data || !data.texts || !data.texts[0]) {
            console.warn("No text generated, using default");
            return {
              text: "A special moment captured in time.",
              tone: savedTone
            };
          }

          // 返回生成的文本
          return data.texts[0];
        })()
      ]);

      // 更新图片文本
      if (textResult) {
        // 创建现有文本的副本
        const updatedTexts = [...(imageTexts || [])];
        
        // 确保数组有足够的位置
        while (updatedTexts.length <= index) {
          updatedTexts.push({
            text: "A special moment captured in time.",
            tone: savedTone || "Heartfelt"
          });
        }
        
        // 将新生成的文本放在对应的位置
        updatedTexts[index] = textResult;
        
        // 更新状态和存储
        setImageTexts(updatedTexts);
        localStorage.setItem('loveStoryImageTexts', JSON.stringify(updatedTexts));
        
        console.log(`Updated text for content ${index}: ${textResult.text}`);
      }

      // 6) 延迟刷新图片列表，确保上传完成
      setTimeout(() => {
        loadImagesFromSupabase();
      }, 1000);

      toast({
        title: "Image and text regenerated",
        description: `Content ${index} successfully updated with ${imageStyle} style`,
      });
    } catch (err: any) {
      console.error("Error in handleGenericContentRegeneration:", err);
      toast({
        title: "Error regenerating content",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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

  const generateInitialImages = async (prompts: string, partnerPhoto: string) => {
    setIsGeneratingCover(true);
    setIsGeneratingIntro(true);
    toast({
      title: "Generating images",
      description: "This may take a minute...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts, 
          contentPrompt: prompts,
          content2Prompt: prompts,
          photo: partnerPhoto,
          style: selectedStyle
        }
      });

      if (error) throw error;

      if (data?.output?.[0]) {
        const coverImageData = data.output[0];
        setCoverImage(coverImageData);
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          coverImageData, 
          'images', 
          'love-story-cover'
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryCoverImage']: {
            localStorageKey: 'loveStoryCoverImage',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
        localStorage.setItem('loveStoryCoverImage_url', storageUrl);
      }

      if (data?.contentImage?.[0]) {
        const introImageData = data.contentImage[0];
        setIntroImage(introImageData);
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          introImageData, 
          'images', 
          'love-story-intro'
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryIntroImage']: {
            localStorageKey: 'loveStoryIntroImage',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
        localStorage.setItem('loveStoryIntroImage_url', storageUrl);
      }

      if (data?.contentImage2?.[0]) {
        const contentImage1Data = data.contentImage2[0];
        setContentImage1(contentImage1Data);
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          contentImage1Data, 
          'images', 
          'love-story-content-1'
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryContentImage1']: {
            localStorageKey: 'loveStoryContentImage1',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
        localStorage.setItem('loveStoryContentImage1_url', storageUrl);
      }

      toast({
        title: "Images generated",
        description: "Your images are ready!",
      });
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: "Error generating images",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
      setIsGeneratingIntro(false);
    }
  };

  // 新增加：从Supabase加载所有图片
  const loadImagesFromSupabase = async () => {
    setIsLoadingImages(true);
    try {
      // 获取所有Supabase中的图片
      const images = await getAllImagesFromStorage('images');
      setSupabaseImages(images);
      
      // 创建一个新的Map用于存储图片引用
      const newImageMap: ImageStorageMap = {};
      
      // 遍历所有图片，更新映射 - 修复命名识别问题
      images.forEach(img => {
        // 从完整路径中提取文件名
        const pathParts = img.name.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        // 使用正则表达式精确匹配文件名，防止10匹配到1的内容
        if (/^love-story-cover/.test(fileName)) {
          setCoverImage(img.url);
          newImageMap['loveStoryCoverImage'] = {
            localStorageKey: 'loveStoryCoverImage',
            url: img.url
          };
        } else if (/^love-story-intro/.test(fileName)) {
          setIntroImage(img.url);
          newImageMap['loveStoryIntroImage'] = {
            localStorageKey: 'loveStoryIntroImage',
            url: img.url
          };
        } else if (/^love-story-content-1$|^love-story-content-1-/.test(fileName)) {
          // 确保只匹配content-1，而不匹配content-10等
          setContentImage1(img.url);
          newImageMap['loveStoryContentImage1'] = {
            localStorageKey: 'loveStoryContentImage1',
            url: img.url
          };
        } else if (/^love-story-content-2$|^love-story-content-2-/.test(fileName)) {
          setContentImage2(img.url);
          newImageMap['loveStoryContentImage2'] = {
            localStorageKey: 'loveStoryContentImage2',
            url: img.url
          };
        } else if (/^love-story-content-3$|^love-story-content-3-/.test(fileName)) {
          setContentImage3(img.url);
          newImageMap['loveStoryContentImage3'] = {
            localStorageKey: 'loveStoryContentImage3',
            url: img.url
          };
        } else if (/^love-story-content-4$|^love-story-content-4-/.test(fileName)) {
          setContentImage4(img.url);
          newImageMap['loveStoryContentImage4'] = {
            localStorageKey: 'loveStoryContentImage4',
            url: img.url
          };
        } else if (/^love-story-content-5$|^love-story-content-5-/.test(fileName)) {
          setContentImage5(img.url);
          newImageMap['loveStoryContentImage5'] = {
            localStorageKey: 'loveStoryContentImage5',
            url: img.url
          };
        } else if (/^love-story-content-6$|^love-story-content-6-/.test(fileName)) {
          setContentImage6(img.url);
          newImageMap['loveStoryContentImage6'] = {
            localStorageKey: 'loveStoryContentImage6',
            url: img.url
          };
        } else if (/^love-story-content-7$|^love-story-content-7-/.test(fileName)) {
          setContentImage7(img.url);
          newImageMap['loveStoryContentImage7'] = {
            localStorageKey: 'loveStoryContentImage7',
            url: img.url
          };
        } else if (/^love-story-content-8$|^love-story-content-8-/.test(fileName)) {
          setContentImage8(img.url);
          newImageMap['loveStoryContentImage8'] = {
            localStorageKey: 'loveStoryContentImage8',
            url: img.url
          };
        } else if (/^love-story-content-9$|^love-story-content-9-/.test(fileName)) {
          setContentImage9(img.url);
          newImageMap['loveStoryContentImage9'] = {
            localStorageKey: 'loveStoryContentImage9',
            url: img.url
          };
        } else if (/^love-story-content-10$|^love-story-content-10-/.test(fileName)) {
          setContentImage10(img.url);
          newImageMap['loveStoryContentImage10'] = {
            localStorageKey: 'loveStoryContentImage10',
            url: img.url
          };
        }
      });
      
      // 更新存储映射
      setImageStorageMap(newImageMap);
    } catch (error) {
      console.error('Error loading images from Supabase:', error);
      toast({
        title: "Error loading images",
        description: "Failed to load images from Supabase storage",
        variant: "destructive",
      });
    } finally {
      setIsLoadingImages(false);
    }
  };

  useEffect(() => {
    // 加载文本内容和设置
    const savedAuthor = localStorage.getItem('loveStoryAuthorName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedStyle = localStorage.getItem('loveStoryStyle');
    const savedTexts = localStorage.getItem('loveStoryImageTexts');
    
    // 直接从Supabase加载所有图片，不再使用localStorage
    loadImagesFromSupabase();

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedStyle) {
      // Map old style names to new API-compatible style names
      const styleMapping: Record<string, string> = {
        'Comic Book': 'Comic book',
        'Line Art': 'Line art',
        'Fantasy Art': 'Fantasy art',
        'Photographic': 'Photographic (Default)',
        'Cinematic': 'Cinematic'
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
        setCoverTitle(selectedIdea.title || '');
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
  }, []);

  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
  };

  const handleEditText = () => {
    toast({
      title: "Edit Text",
      description: "Opening text editor..."
    });
  };

  const handleRegenerateCover = async (style?: string) => {
    localStorage.removeItem('loveStoryCoverImage');
    localStorage.removeItem('loveStoryCoverImage_url');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    const savedTone = localStorage.getItem('loveStoryTone');
    
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        setIsGeneratingCover(true);
        
        try {
          // Use the provided style or fall back to the stored/default style
          const imageStyle = style || selectedStyle;
          
          // Update the stored style if a new one is provided
          if (style) {
            setSelectedStyle(style);
            localStorage.setItem('loveStoryStyle', style);
          }

          // 启动并行任务: 同时生成封面图片和文本
          const [coverImageResult, coverTextResult] = await Promise.all([
            // 1. 图片生成任务
            (async () => {
              // 使用更明确的请求格式
              const requestBody = {
                prompt: prompts[0].prompt,
                photo: partnerPhoto,
                style: imageStyle,
                type: 'cover'  // 明确指定是封面
              };

              console.log('Cover generation request:', JSON.stringify(requestBody));

              const { data, error } = await supabase.functions.invoke('generate-love-cover', {
                body: requestBody
              });
              
              if (error) throw error;

              console.log('Cover generation response:', data);
              
              const coverImageData = data?.output?.[0] || data?.coverImage?.[0];
              if (!coverImageData) {
                throw new Error("No cover image generated");
              }

              // Apply image expansion to the cover
              const expandedCover = await expandImage(coverImageData);
              
              // Upload expanded cover to Supabase
              const timestamp = Date.now();
              const storageUrl = await uploadImageToStorage(
                expandedCover, 
                'images', 
                `love-story-cover-${timestamp}`
              );
              
              // Update state and storage map
              setCoverImage(expandedCover);
              setImageStorageMap(prev => ({
                ...prev,
                ['loveStoryCoverImage']: {
                  localStorageKey: 'loveStoryCoverImage',
                  url: storageUrl
                }
              }));
              
              // Store only the URL reference in localStorage
              localStorage.setItem('loveStoryCoverImage_url', storageUrl);

              return expandedCover;
            })(),

            // 2. 封面文本生成任务 (如果需要的话)
            (async () => {
              // 封面可能不需要额外的文本生成，但如果需要可以在这里实现
              return null;
            })()
          ]);

          // 6) 延迟刷新图片列表，确保上传完成
          setTimeout(() => {
            loadImagesFromSupabase();
          }, 1000);

          toast({
            title: "Cover regenerated",
            description: `Cover successfully updated with ${imageStyle} style`,
          });
        } catch (err: any) {
          console.error("Error regenerating cover:", err);
          toast({
            title: "Error regenerating cover",
            description: err.message || "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingCover(false);
        }
      }
    }
  };

  const handleRegenerateIntro = async (style?: string) => {
    localStorage.removeItem('loveStoryIntroImage');
    localStorage.removeItem('loveStoryIntroImage_url');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    const savedTone = localStorage.getItem('loveStoryTone');
    
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingIntro(true);
        
        try {
          // Use the provided style or fall back to the stored/default style
          const imageStyle = style || selectedStyle;
          
          // Update the stored style if a new one is provided
          if (style) {
            setSelectedStyle(style);
            localStorage.setItem('loveStoryStyle', style);
          }

          // 启动并行任务: 同时生成介绍图片和文本
          const [introImageResult, introTextResult] = await Promise.all([
            // 1. 图片生成任务
            (async () => {
              // 使用更明确的请求格式
              const requestBody = {
                prompt: prompts[0].prompt,
                contentPrompt: prompts[0].prompt,
                photo: partnerPhoto,
                style: imageStyle,
                type: 'intro'  // 明确指定是介绍
              };

              console.log('Intro generation request:', JSON.stringify(requestBody));

              const { data, error } = await supabase.functions.invoke('generate-love-cover', {
                body: requestBody
              });
              
              if (error) throw error;

              console.log('Intro generation response:', data);
              
              const introImageData = data?.contentImage?.[0] || data?.output?.[0];
              if (!introImageData) {
                throw new Error("No intro image generated");
              }

              // Apply image expansion to the intro
              const expandedIntro = await expandImage(introImageData);
              
              // Upload expanded intro to Supabase
              const timestamp = Date.now();
              const storageUrl = await uploadImageToStorage(
                expandedIntro, 
                'images', 
                `love-story-intro-${timestamp}`
              );
              
              // Update state and storage map
              setIntroImage(expandedIntro);
              setImageStorageMap(prev => ({
                ...prev,
                ['loveStoryIntroImage']: {
                  localStorageKey: 'loveStoryIntroImage',
                  url: storageUrl
                }
              }));
              
              // Store only the URL reference in localStorage
              localStorage.setItem('loveStoryIntroImage_url', storageUrl);

              return expandedIntro;
            })(),

            // 2. 介绍文本生成任务
            (async () => {
              if (!savedTone) return null;

              // 为介绍图片生成文本
              const introPrompt = [prompts[0]];
              const personName = localStorage.getItem('loveStoryPersonName') || '';
              
              console.log(`Generating text for intro with tone: ${savedTone}`);
              
              const { data, error } = await supabase.functions.invoke('generate-image-texts', {
                body: { 
                  prompts: introPrompt,
                  tone: savedTone,
                  personName
                }
              });
              
              if (error) throw error;
              
              if (!data || !data.texts || !data.texts[0]) {
                console.warn("No intro text generated, using default");
                return {
                  text: "The beginning of a beautiful love story.",
                  tone: savedTone
                };
              }

              // 返回生成的文本
              return data.texts[0];
            })()
          ]);

          // 更新介绍文本
          if (introTextResult) {
            // 创建现有文本的副本
            const updatedTexts = [...(imageTexts || [])];
            
            // 确保数组有足够的位置
            while (updatedTexts.length < 1) {
              updatedTexts.push({
                text: "The beginning of a beautiful love story.",
                tone: savedTone || "Heartfelt"
              });
            }
            
            // 将新生成的介绍文本放在数组的第一个位置
            updatedTexts[0] = introTextResult;
            
            // 更新状态和存储
            setImageTexts(updatedTexts);
            localStorage.setItem('loveStoryImageTexts', JSON.stringify(updatedTexts));
            
            console.log(`Updated intro text: ${introTextResult.text}`);
          }

          // 延迟刷新图片列表，确保上传完成
          setTimeout(() => {
            loadImagesFromSupabase();
          }, 1000);

          toast({
            title: "Introduction regenerated",
            description: `Introduction successfully updated with ${imageStyle} style`,
          });
        } catch (err: any) {
          console.error("Error regenerating intro:", err);
          toast({
            title: "Error regenerating introduction",
            description: err.message || "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingIntro(false);
        }
      }
    }
  };

  // Render content images with text inside the canvas
  const renderContentImage = (imageIndex: number) => {
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
    
    const image = imageStateMap[imageIndex];
    const isLoading = loadingStateMap[imageIndex];
    const handleRegenerate = handleRegenerateMap[imageIndex];
    // Get the text for this image, adjusting for zero-based array index
    const imageText = imageTexts && imageTexts.length > imageIndex ? imageTexts[imageIndex] : null;
    
    // 显示标题适配新的命名方式
    let title = imageIndex === 0 ? "Introduction" : `Moment ${imageIndex}`;
    
    return (
      <div className="mb-10">
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={handleRegenerate}
          index={imageIndex}
          onEditText={() => {}}
          text={imageText?.text}
          title={title}
        />
      </div>
    );
  };

  // 添加刷新图片的函数
  const refreshImages = () => {
    loadImagesFromSupabase();
    toast({
      title: "Refreshing images",
      description: "Loading latest images from Supabase Storage",
    });
  };

  return (
    <WizardStep
      title="Your Love Story Images"
      description="Here are your personalized love story images with accompanying text."
      previousStep="/create/love/love-story/moments"
      nextStep="/create/love/love-story/preview"
      currentStep={4}
      totalSteps={4}
    >
      <div className="max-w-5xl mx-auto">
        {/* 添加刷新按钮 */}
        <div className="mb-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshImages}
            disabled={isLoadingImages}
          >
            {isLoadingImages ? 'Loading...' : 'Refresh Images'}
          </Button>
        </div>
      
        {/* Cover section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Cover</h2>
          <CoverPreviewCard 
            coverImage={coverImage}
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            backCoverText={backCoverText}
            isGeneratingCover={isGeneratingCover}
            onRegenerateCover={handleRegenerateCover}
            onEditCover={() => {}}
          />
        </div>
        
        {/* 介绍部分 - 将Intro与其他Content分开 */}
        <div className="mb-12 border-t-2 border-gray-200 pt-8">
          <h2 className="text-2xl font-bold mb-6">Introduction</h2>
          <div className="mb-10">
            <ContentImageCard 
              image={introImage} 
              isGenerating={isGeneratingIntro}
              onRegenerate={handleRegenerateIntro}
              index={0}
              onEditText={() => {}}
              text={imageTexts && imageTexts.length > 0 ? imageTexts[0]?.text : undefined}
              title="Introduction"
            />
          </div>
        </div>
        
        {/* 内容部分 */}
        <div className="border-t-2 border-gray-200 pt-8">
          <h2 className="text-2xl font-bold mb-6">Story Moments</h2>
          <div className="space-y-8">
            {/* 只渲染内容图片，跳过介绍图片 */}
            {renderContentImage(1)}
            {renderContentImage(2)}
            {renderContentImage(3)}
            {renderContentImage(4)}
            {renderContentImage(5)}
            {renderContentImage(6)}
            {renderContentImage(7)}
            {renderContentImage(8)}
            {renderContentImage(9)}
            {renderContentImage(10)}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
