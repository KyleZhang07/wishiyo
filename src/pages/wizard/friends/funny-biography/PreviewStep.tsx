import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

// 定义赞美语接口
interface Praise {
  source: string;
  text: string;
}

interface Chapter {
  title: string;
  description: string;
  startPage: number;
}

const PreviewStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [frontCoverImage, setFrontCoverImage] = useState<string | undefined>();
  const [selectedStyle, setSelectedStyle] = useState('modern-green');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(100);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [praises, setPraises] = useState<Praise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [regenerationTriggered, setRegenerationTriggered] = useState(false); // 防止重复触发的状态
  const [chapterGenerationAttempted, setChapterGenerationAttempted] = useState(false);

  const generateChapters = async () => {
    // 如果已经尝试过生成，不再重复生成
    if (chapterGenerationAttempted) {
      console.log('已经尝试过生成章节，不再重复生成');
      return;
    }

    // 先检查数据是否完整
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedAnswers = localStorage.getItem('funnyBiographyAnswers');

    if (!savedAuthor || !savedIdeas || !savedIdeaIndex || !savedAnswers || !coverTitle) {
      console.log('Attempted to generate chapters with missing data.');
      // 不再显示错误提示，因为用户可能刚进入页面，数据还在加载中

      // 如果数据不完整，不标记为已尝试，这样后续可以再次尝试
      return;
    }

    // 数据完整，标记为已尝试生成
    setChapterGenerationAttempted(true);

    setIsLoading(true);
    try {
      const answers = JSON.parse(savedAnswers);
      const selectedIdea = JSON.parse(savedIdeas)[parseInt(savedIdeaIndex)];

      console.log('生成章节请求参数:', {
        authorName: savedAuthor,
        bookTitle: coverTitle,
        selectedIdea: selectedIdea ? { title: selectedIdea.title } : 'undefined',
        answers: answers ? '有效' : 'undefined'
      });

      const { data, error } = await supabase.functions.invoke('generate-chapters', {
        body: {
          authorName: savedAuthor,
          bookTitle: coverTitle,
          selectedIdea,
          answers
        }
      });

      if (error) throw error;

      console.log('生成章节响应:', data ? '有数据' : '无数据', data?.chapters ? `章节数量: ${data.chapters.length}` : '无章节');

      if (data && data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
        setChapters(data.chapters);
        localStorage.setItem('funnyBiographyChapters', JSON.stringify(data.chapters));
        // 用户可以直接看到目录更新，不需要显示成功通知
      } else {
        throw new Error('No chapters data received from the function.');
      }
    } catch (error: any) {
      console.error('Error generating chapters:', error);
      let errorDescription = "There was a problem generating your book chapters. Please try again.";
      if (error.context && error.context.details) {
        errorDescription = error.context.details;
      } else if (error instanceof Error) {
        errorDescription = error.message;
      }
      toast({
        title: "Error generating chapters",
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("PreviewStep: Initial data loading effect running.");
    let loadedAuthorName = '';
    let loadedCoverTitle = '';
    let dataLoadComplete = false;

    try {
      const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
      const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
      const savedStyle = localStorage.getItem('funnyBiographySelectedStyle');
      const savedChapters = localStorage.getItem('funnyBiographyChapters');
      const savedImagePosition = localStorage.getItem('funnyBiographyCoverImagePosition');
      const savedImageScale = localStorage.getItem('funnyBiographyCoverImageScale');
      const savedFrontCover = localStorage.getItem('funnyBiographyFrontCoverImage');

      const ideaChangedTimestamp =
        localStorage.getItem('funnyBiographyIdeaChanged') ||
        localStorage.getItem('funny-biographyIdeaChanged') ||
        localStorage.getItem('friendsIdeaChanged') ||
        localStorage.getItem('funnyBiography');

      if (ideaChangedTimestamp) {
        localStorage.removeItem('funnyBiographyIdeaChanged');
        localStorage.removeItem('funny-biographyIdeaChanged');
        localStorage.removeItem('friendsIdeaChanged');
        localStorage.removeItem('funnyBiography');

        localStorage.removeItem('funnyBiographyChapters');
        console.log("PreviewStep: 检测到想法变更，将重新生成章节");
      }

      if (savedAuthor) {
        setAuthorName(savedAuthor);
        loadedAuthorName = savedAuthor;
      }

      if (savedIdeas && savedIdeaIndex) {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          setCoverTitle(selectedIdea.title || '');
          setSubtitle(selectedIdea.description || '');
          loadedCoverTitle = selectedIdea.title || '';

          if (selectedIdea.praises && Array.isArray(selectedIdea.praises)) {
            setPraises(selectedIdea.praises);
          }
        }
      }

      if (savedPhotos) {
        setCoverImage(savedPhotos);
      }

      if (savedFrontCover) {
        setFrontCoverImage(savedFrontCover);
      }

      if (savedStyle) {
        setSelectedStyle(savedStyle);
      }

      if (savedChapters) {
        try {
           const parsedChapters = JSON.parse(savedChapters);
           if (Array.isArray(parsedChapters)) {
               setChapters(parsedChapters);
               console.log("PreviewStep: Loaded existing chapters from localStorage.");
           } else {
               console.warn("PreviewStep: Invalid chapter data found in localStorage, will regenerate.");
               localStorage.removeItem('funnyBiographyChapters');
           }
        } catch(e) {
            console.error("PreviewStep: Failed to parse chapters from localStorage, will regenerate.", e);
            localStorage.removeItem('funnyBiographyChapters');
        }
      }

      if (savedImagePosition) {
        setImagePosition(JSON.parse(savedImagePosition));
      }
      if (savedImageScale) {
        setImageScale(parseFloat(savedImageScale));
      }

      if (loadedAuthorName && loadedCoverTitle) {
         dataLoadComplete = true;
         console.log("PreviewStep: Essential data loaded.");
      } else {
         console.warn("PreviewStep: Essential data (author or title) missing after load.");
         toast({
            title: "Missing Information",
            description: "Could not load essential book details (author/title). Please check previous steps.",
            variant: "destructive",
            duration: 5000
         });
      }

    } catch (error) {
        console.error("PreviewStep: Error during initial data load:", error);
        toast({
            title: "Error Loading Data",
            description: "Failed to load saved progress. Please try navigating back and forth.",
            variant: "destructive"
        });
    } finally {
        if (dataLoadComplete) {
           setIsInitialDataLoaded(true);
        }
    }

  }, []);

  useEffect(() => {
    console.log("PreviewStep: Chapter generation effect running. isInitialDataLoaded:", isInitialDataLoaded, "Chapters loaded:", chapters.length > 0, "Title ready:", !!coverTitle, "Author ready:", !!authorName);

    // 如果章节已经生成过或正在生成中，跳过
    if (chapterGenerationAttempted || isLoading) {
      console.log("PreviewStep: Skipping chapter generation - already attempted or in progress.");
      return;
    }

    if (!isInitialDataLoaded) {
      console.log("PreviewStep: Skipping chapter generation - initial data not loaded yet.");
      return;
    }

    if (chapters && chapters.length > 0) {
      console.log("PreviewStep: Skipping chapter generation - chapters already exist.");
      return;
    }

    if (!coverTitle || !authorName) {
       console.warn("PreviewStep: Skipping chapter generation - title or author name state is empty.");
       return;
    }

    console.log("PreviewStep: Conditions met. Setting delay for chapter generation...");

    // 添加延迟，确保数据完全加载
    setTimeout(() => {
      // 再次检查数据是否已准备好
      const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
      const savedAnswers = localStorage.getItem('funnyBiographyAnswers');

      console.log('初次加载延迟后检查数据:', {
        savedAuthor: !!savedAuthor,
        savedIdeas: !!savedIdeas,
        savedIdeaIndex: !!savedIdeaIndex,
        savedAnswers: !!savedAnswers,
        coverTitle: coverTitle
      });

      // 先尝试加载封面标题，确保它可用
      if (savedIdeas && savedIdeaIndex) {
        try {
          const ideas = JSON.parse(savedIdeas);
          const selectedIdea = ideas[parseInt(savedIdeaIndex)];
          if (selectedIdea && selectedIdea.title && (!coverTitle || coverTitle !== selectedIdea.title)) {
            console.log('初次加载设置封面标题:', selectedIdea.title);
            setCoverTitle(selectedIdea.title);

            // 设置标题后再等待一段时间再生成
            setTimeout(() => {
              if (savedAuthor && savedIdeas && savedIdeaIndex && savedAnswers && selectedIdea.title) {
                console.log('初次加载：所有数据已准备好，开始生成章节');
                generateChapters();
              } else {
                console.log('初次加载：延迟后数据仍不完整，等待用户操作');
              }
            }, 500);
            return;
          }
        } catch (e) {
          console.error('初次加载：解析已保存想法失败:', e);
        }
      }

      // 如果不需要设置标题或设置失败，直接检查是否可以生成
      if (savedAuthor && savedIdeas && savedIdeaIndex && savedAnswers && coverTitle) {
        console.log('初次加载：所有数据已准备好，开始生成章节');
        generateChapters();
      } else {
        console.log('初次加载：延迟后数据仍不完整，等待用户操作');
      }
    }, 1500); // 给予1.5秒的延迟，确保数据加载完成
  }, [isInitialDataLoaded, chapters, coverTitle, authorName, generateChapters, chapterGenerationAttempted, isLoading]);

  useEffect(() => {
    const ideaChangedKeys = [
      'funnyBiographyIdeaChanged',
      'funny-biographyIdeaChanged',
      'friendsIdeaChanged', // 如果需要，添加其他可能的键
      'funnyBiographyNeedsChapterRegeneration', // 新增：检测 GenerateStep 设置的标记
    ];
    let ideaChangedTimestamp: string | null = null;
    let changedKey: string | null = null;

    for (const key of ideaChangedKeys) {
      ideaChangedTimestamp = localStorage.getItem(key);
      if (ideaChangedTimestamp) {
        changedKey = key;
        break;
      }
    }

    // 如果检测到 idea 变化或需要重新生成的标记，且尚未触发自动重新生成
    if (ideaChangedTimestamp && !regenerationTriggered) {
      console.log(`检测到想法变更或重新生成标记(${changedKey})，准备数据...`);
      localStorage.removeItem(changedKey!); // 移除找到的特定键
      localStorage.removeItem('funnyBiographyChapters'); // 清除之前保存的章节
      setChapters([]); // 清除显示的数据

      // 重置章节生成状态，允许重新生成
      setChapterGenerationAttempted(false);

      // 标记重新生成已由 idea 变化触发，但不立即生成
      setRegenerationTriggered(true);

      // 使用较长的延迟，给数据加载足够的时间
      console.log('设置延迟，等待数据准备完成...');
      setTimeout(() => {
        // 在延迟后再次检查数据是否已准备好
        const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
        const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
        const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
        const savedAnswers = localStorage.getItem('funnyBiographyAnswers');

        console.log('延迟后检查数据:', {
          savedAuthor: !!savedAuthor,
          savedIdeas: !!savedIdeas,
          savedIdeaIndex: !!savedIdeaIndex,
          savedAnswers: !!savedAnswers,
          coverTitle: coverTitle
        });

        // 先尝试加载封面标题，确保它可用
        if (savedIdeas && savedIdeaIndex) {
          try {
            const ideas = JSON.parse(savedIdeas);
            const selectedIdea = ideas[parseInt(savedIdeaIndex)];
            if (selectedIdea && selectedIdea.title && (!coverTitle || coverTitle !== selectedIdea.title)) {
              console.log('设置封面标题:', selectedIdea.title);
              setCoverTitle(selectedIdea.title);

              // 设置标题后再等待一段时间再生成
              setTimeout(() => {
                if (savedAuthor && savedIdeas && savedIdeaIndex && savedAnswers) {
                  console.log('所有数据已准备好，开始生成章节');
                  generateChapters();
                } else {
                  console.log('延迟后数据仍不完整，但不显示错误提示，等待用户操作');
                }
              }, 500);
              return;
            }
          } catch (e) {
            console.error('Error parsing saved ideas:', e);
          }
        }

        // 如果不需要设置标题或设置失败，直接检查是否可以生成
        if (savedAuthor && savedIdeas && savedIdeaIndex && savedAnswers && coverTitle) {
          console.log('所有数据已准备好，开始生成章节');
          generateChapters();
        } else {
          console.log('延迟后数据仍不完整，但不显示错误提示，等待用户操作');
        }
      }, 1500); // 给予1.5秒的延迟，确保数据加载完成
    }
  }, [regenerationTriggered, coverTitle, toast, generateChapters]);

  useEffect(() => {
    // 仅在组件首次加载且未触发重新生成时执行
    if (!isInitialDataLoaded && !regenerationTriggered) {
      console.log('PreviewStep: 加载初始数据...');

      // 加载已保存的章节数据
      const savedChapters = localStorage.getItem('funnyBiographyChapters');
      if (savedChapters) {
        try {
          const parsedChapters = JSON.parse(savedChapters);
          setChapters(parsedChapters);
          console.log('成功加载已保存的章节数据');
        } catch (e) {
          console.error('解析已保存章节失败:', e);
        }
      }

      // 加载封面标题
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
      if (savedIdeas && savedIdeaIndex) {
        try {
          const ideas = JSON.parse(savedIdeas);
          const selectedIdea = ideas[parseInt(savedIdeaIndex)];
          if (selectedIdea && selectedIdea.title) {
            setCoverTitle(selectedIdea.title);
            console.log('成功加载封面标题:', selectedIdea.title);
          }
        } catch (e) {
          console.error('解析已保存想法失败:', e);
        }
      }

      setIsInitialDataLoaded(true);
    }
  }, [isInitialDataLoaded, regenerationTriggered]);

  const handleContinue = () => {
    navigate('/create/friends/funny-biography/format');
  };

  // 检查是否可以继续：章节必须已生成且不在加载中
  const canContinue = !isLoading && chapters.length > 0;

  const getCurrentStyle = () => {
    const stylePresets = [
      {
        id: 'modern-green',
        name: 'Modern Green',
        font: 'playfair',
        template: 'vibrant-green',
        layout: 'classic-centered'
      },
      {
        id: 'classic-elegant',
        name: 'Classic Elegant',
        font: 'merriweather',
        template: 'classic',
        layout: 'left-align'
      },
      {
        id: 'bold-vibrant',
        name: 'Bold Vibrant',
        font: 'montserrat',
        template: 'vibrant',
        layout: 'bold-header'
      },
      {
        id: 'minimal-clean',
        name: 'Minimal Clean',
        font: 'roboto',
        template: 'minimal',
        layout: 'minimal-frame'
      }
    ];
    return stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];
  };

  const currentStyle = getCurrentStyle();

  return (
    <WizardStep
      title="Your Book Preview"
      description=""
      previousStep="/create/friends/funny-biography/generate"
      currentStep={6}
      totalSteps={7}
      onNextClick={handleContinue}
      nextDisabled={!canContinue}
    >
      <div className="w-full">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Book Cover */}
          <div className="flex flex-col items-center mb-4">
            <div className="book-container">
              <div className="book">
                {frontCoverImage ? (
                  <img
                    src={frontCoverImage}
                    alt="Book Cover"
                  />
                ) : (
                  <div className="canvas-container">
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
                      previewMode={true}
                      scaleFactor={0.4}
                      praises={praises}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="flex flex-col items-center">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">{coverTitle}</h1>
              <div className="flex items-center justify-center mt-2">
                <span>by <span className="font-medium">{authorName}</span></span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">220 pages</span>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="w-[95%] mx-auto mt-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Table of Contents</h2>
              {/* 删除手动重新生成按钮，因为现在已经实现自动生成 */}
            </div>

            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full"></div>
                <p className="mt-3 text-gray-600">Generating your chapter outlines...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {chapters.map((chapter, index) => (
                  <div key={index} className="pb-3">
                    <div className="flex justify-between items-baseline">
                      <div className="w-full">
                        <h3 className="text-lg font-bold mb-1.5">Chapter {index + 1}: {chapter.title.replace(/^Chapter \d+:?\s*/i, '')}</h3>
                        <p className="text-gray-600 pr-4 text-base">{chapter.description}</p>
                      </div>
                      <span className="text-gray-500 font-normal ml-3 whitespace-nowrap">{chapter.startPage}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default PreviewStep;