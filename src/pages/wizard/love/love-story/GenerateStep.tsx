
import { useState, useEffect, useCallback } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';
import { 
  getDataFromStore, 
  storeData, 
  removeData, 
  migrateFromLocalStorage 
} from '@/utils/indexedDB';

interface ImageText {
  text: string;
  tone: string;
}

// Define image-related localStorage keys for migration
const IMAGE_STORAGE_KEYS = [
  'loveStoryCoverImage',
  'loveStoryIntroImage',
  'loveStoryContentImage1',
  'loveStoryContentImage2',
  'loveStoryContentImage3',
  'loveStoryContentImage4',
  'loveStoryContentImage5',
  'loveStoryContentImage6',
  'loveStoryContentImage7',
  'loveStoryContentImage8',
  'loveStoryContentImage9',
  'loveStoryContentImage10',
  'loveStoryInputImage2',
  'loveStoryInputImage3',
  'loveStoryInputImage4'
];

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

  // Additional input images (from MomentsStep)
  const [inputImage2, setInputImage2] = useState<string>();
  const [inputImage3, setInputImage3] = useState<string>();
  const [inputImage4, setInputImage4] = useState<string>();

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
  const [migratedToIndexedDB, setMigratedToIndexedDB] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);

  const { toast } = useToast();

  // Function to migrate existing image data from localStorage to IndexedDB
  const migrateImagesToIndexedDB = async () => {
    try {
      await migrateFromLocalStorage(IMAGE_STORAGE_KEYS);
      setMigratedToIndexedDB(true);
      console.log('Successfully migrated image data to IndexedDB');
    } catch (error) {
      console.error('Failed to migrate images to IndexedDB:', error);
    }
  };

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

  // Improved storage function that ensures images are stored in IndexedDB
  const saveImageToStorage = useCallback(async (key: string, imageData: string): Promise<void> => {
    try {
      console.log(`Saving image with key ${key} to IndexedDB...`);
      // Store image to IndexedDB with timestamp to prevent caching issues
      const imageWithTimestamp = {
        data: imageData,
        timestamp: new Date().getTime()
      };
      
      // Store as an object with timestamp to help with versioning
      await storeData(key, imageWithTimestamp);
      console.log(`Successfully saved image with key ${key} to IndexedDB`);
    } catch (error) {
      console.error(`Error saving image with key ${key} to IndexedDB:`, error);
      // Fallback to localStorage if IndexedDB fails
      try {
        localStorage.setItem(key, imageData);
        console.log(`Fallback: Saved image with key ${key} to localStorage`);
      } catch (lsError) {
        console.error(`Error saving image to localStorage as fallback:`, lsError);
        toast({
          title: "Storage Error",
          description: "Unable to save generated image. Your changes may not persist after page refresh.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  // Helper function to load image from storage
  const loadImageFromStorage = useCallback(async (key: string): Promise<string | undefined> => {
    try {
      console.log(`Loading image with key ${key} from IndexedDB...`);
      // Try to get from IndexedDB first
      const storedData = await getDataFromStore(key);
      
      if (storedData) {
        // Handle either direct string or object with timestamp
        if (typeof storedData === 'object' && storedData.data) {
          console.log(`Found image with key ${key} (timestamped) in IndexedDB`);
          return storedData.data;
        } else {
          console.log(`Found image with key ${key} (direct) in IndexedDB`);
          return storedData as string;
        }
      }

      // Fallback to localStorage
      const lsData = localStorage.getItem(key);
      if (lsData) {
        console.log(`Found image with key ${key} in localStorage`);
        // Migrate from localStorage to IndexedDB for future use
        await saveImageToStorage(key, lsData);
        return lsData;
      }
      
      console.log(`No image found with key ${key} in storage`);
      return undefined;
    } catch (error) {
      console.error(`Error loading image with key ${key} from storage:`, error);
      // Final fallback to localStorage
      return localStorage.getItem(key) || undefined;
    }
  }, [saveImageToStorage]);

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
    
    // First remove the old image from storage (both IndexedDB and localStorage as fallback)
    try {
      await removeData(lsKey);
      localStorage.removeItem(lsKey); // Fallback cleanup
    } catch (error) {
      console.error(`Error removing old image with key ${lsKey}:`, error);
      // Continue anyway since we're replacing it
    }

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
    if (!savedPrompts || !characterPhoto) {
      toast({
        title: "Missing info",
        description: "No prompts or character photo found",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      const promptIndex = index + 1;
      if (!prompts[promptIndex]) {
        throw new Error(`No prompt found for content index ${promptIndex}`);
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      
      // Update the stored style if a new one is provided
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
        // Also store style in IndexedDB for consistency
        await storeData('loveStoryStyle', style);
      }

      // Prepare the request body with additional images if available
      const requestBody: any = { 
        prompt: prompts[promptIndex].prompt,
        photo: characterPhoto,
        style: imageStyle
      };
      
      // Add additional input images if available
      if (inputImage2) requestBody.input_image2 = inputImage2;
      if (inputImage3) requestBody.input_image3 = inputImage3;
      if (inputImage4) requestBody.input_image4 = inputImage4;

      // Include style in the request
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: requestBody
      });
      if (error) throw error;

      // Backend might return different output formats
      const imageUrl = data?.[`contentImage${promptIndex}`]?.[0] || data?.output?.[0];
      if (!imageUrl) {
        throw new Error("No image generated from generate-love-cover");
      }

      // Expand the image
      const expandedBase64 = await expandImage(imageUrl);

      // Set in state for immediate display
      setContentFn(expandedBase64);
      
      // Store in IndexedDB and localStorage as fallback
      await saveImageToStorage(lsKey, expandedBase64);

      toast({
        title: "Image regenerated & expanded",
        description: `Content ${index} successfully updated with ${imageStyle} style`,
      });
    } catch (err: any) {
      console.error("Error in handleGenericContentRegeneration:", err);
      toast({
        title: "Error regenerating image",
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

  const generateInitialImages = async (prompts: string, characterPhoto: string) => {
    setIsGeneratingCover(true);
    setIsGeneratingIntro(true);
    toast({
      title: "Generating images",
      description: "This may take a minute...",
    });

    try {
      // Prepare the request body with additional images if available
      const requestBody: any = { 
        prompt: prompts, 
        contentPrompt: prompts,
        content2Prompt: prompts,
        photo: characterPhoto,
        style: selectedStyle
      };
      
      // Add additional input images if available
      if (inputImage2) requestBody.input_image2 = inputImage2;
      if (inputImage3) requestBody.input_image3 = inputImage3;
      if (inputImage4) requestBody.input_image4 = inputImage4;

      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: requestBody
      });

      if (error) throw error;

      if (data?.output?.[0]) {
        setCoverImage(data.output[0]);
        await saveImageToStorage('loveStoryCoverImage', data.output[0]);
      }

      if (data?.contentImage?.[0]) {
        setIntroImage(data.contentImage[0]);
        await saveImageToStorage('loveStoryIntroImage', data.contentImage[0]);
      }

      if (data?.contentImage2?.[0]) {
        setContentImage1(data.contentImage2[0]);
        await saveImageToStorage('loveStoryContentImage1', data.contentImage2[0]);
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

  // Load all data when component mounts
  useEffect(() => {
    // First, attempt to migrate existing image data from localStorage to IndexedDB
    if (!migratedToIndexedDB) {
      migrateImagesToIndexedDB();
    }

    const loadData = async () => {
      console.log("Loading love story data from storage...");
      
      const savedAuthor = localStorage.getItem('loveStoryAuthorName');
      const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
      const savedMoments = localStorage.getItem('loveStoryMoments');
      const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
      const savedStyle = localStorage.getItem('loveStoryStyle') || await getDataFromStore('loveStoryStyle');
      const savedTexts = localStorage.getItem('loveStoryImageTexts');
      
      // Load images from IndexedDB using the improved helper function
      const savedCoverImage = await loadImageFromStorage('loveStoryCoverImage');
      const savedIntroImage = await loadImageFromStorage('loveStoryIntroImage');
      const savedContentImage1 = await loadImageFromStorage('loveStoryContentImage1');
      const savedContentImage2 = await loadImageFromStorage('loveStoryContentImage2');
      const savedContentImage3 = await loadImageFromStorage('loveStoryContentImage3');
      const savedContentImage4 = await loadImageFromStorage('loveStoryContentImage4');
      const savedContentImage5 = await loadImageFromStorage('loveStoryContentImage5');
      const savedContentImage6 = await loadImageFromStorage('loveStoryContentImage6');
      const savedContentImage7 = await loadImageFromStorage('loveStoryContentImage7');
      const savedContentImage8 = await loadImageFromStorage('loveStoryContentImage8');
      const savedContentImage9 = await loadImageFromStorage('loveStoryContentImage9');
      const savedContentImage10 = await loadImageFromStorage('loveStoryContentImage10');
      
      // Load the additional input images
      const savedInputImage2 = await loadImageFromStorage('loveStoryInputImage2');
      const savedInputImage3 = await loadImageFromStorage('loveStoryInputImage3');
      const savedInputImage4 = await loadImageFromStorage('loveStoryInputImage4');
      
      const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
      
      // Ensure we have a recipient name stored
      const savedQuestions = localStorage.getItem('loveStoryQuestions');
      if (savedQuestions) {
        try {
          const questions = JSON.parse(savedQuestions);
          const nameQuestion = questions.find((q: any) => 
            q.question.toLowerCase().includes('name') && 
            !q.question.toLowerCase().includes('your name')
          );
          
          if (nameQuestion && nameQuestion.answer) {
            localStorage.setItem('loveStoryRecipientName', nameQuestion.answer);
            // Also store in IndexedDB for consistency
            await storeData('loveStoryRecipientName', nameQuestion.answer);
          }
        } catch (error) {
          console.error('Error parsing questions:', error);
        }
      }

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
        const normalizedStyle = styleMapping[savedStyle as string] || savedStyle;
        setSelectedStyle(normalizedStyle);
        
        // Update localStorage and IndexedDB with the normalized style if it changed
        if (normalizedStyle !== savedStyle) {
          localStorage.setItem('loveStoryStyle', normalizedStyle);
          await storeData('loveStoryStyle', normalizedStyle);
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
        try {
          const ideas = JSON.parse(savedIdeas);
          const selectedIdea = ideas[parseInt(savedIdeaIndex)];
          if (selectedIdea) {
            setCoverTitle(selectedIdea.title || '');
            setSubtitle(selectedIdea.description || '');
          }
        } catch (error) {
          console.error('Error parsing saved ideas:', error);
        }
      }

      if (savedMoments) {
        try {
          const moments = JSON.parse(savedMoments);
          const formattedMoments = moments
            .map((moment: string) => `"${moment}"`)
            .join('\n\n');
          setBackCoverText(formattedMoments);
        } catch (error) {
          console.error('Error parsing saved moments:', error);
        }
      }

      // Set main content images
      if (savedCoverImage) {
        setCoverImage(savedCoverImage);
      }
      if (savedIntroImage) {
        setIntroImage(savedIntroImage);
      }
      if (savedContentImage1) {
        setContentImage1(savedContentImage1);
      }
      if (savedContentImage2) {
        setContentImage2(savedContentImage2);
      }
      if (savedContentImage3) {
        setContentImage3(savedContentImage3);
      }
      if (savedContentImage4) {
        setContentImage4(savedContentImage4);
      }
      if (savedContentImage5) {
        setContentImage5(savedContentImage5);
      }
      if (savedContentImage6) {
        setContentImage6(savedContentImage6);
      }
      if (savedContentImage7) {
        setContentImage7(savedContentImage7);
      }
      if (savedContentImage8) {
        setContentImage8(savedContentImage8);
      }
      if (savedContentImage9) {
        setContentImage9(savedContentImage9);
      }
      if (savedContentImage10) {
        setContentImage10(savedContentImage10);
      }

      // Set additional input images
      if (savedInputImage2) {
        setInputImage2(savedInputImage2);
      }
      if (savedInputImage3) {
        setInputImage3(savedInputImage3);
      }
      if (savedInputImage4) {
        setInputImage4(savedInputImage4);
      }

      // Generate initial images if needed
      if ((!savedCoverImage || !savedIntroImage || !savedContentImage1) && savedPrompts && characterPhoto) {
        generateInitialImages(savedPrompts, characterPhoto);
      }

      setDataInitialized(true);
    };
    
    loadData();
  }, [migratedToIndexedDB, loadImageFromStorage, saveImageToStorage]);

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
    // Remove from both IndexedDB and localStorage
    try {
      await removeData('loveStoryCoverImage');
      localStorage.removeItem('loveStoryCoverImage'); // Fallback cleanup
    } catch (error) {
      console.error("Error removing cover image from storage:", error);
      // Continue anyway since we're replacing it
    }
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
    if (savedPrompts && characterPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        setIsGeneratingCover(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        
        // Update the stored style if a new one is provided
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
          // Also store in IndexedDB for consistency
          await storeData('loveStoryStyle', style);
        }
        
        try {
          // Prepare the request body with additional images if available
          const requestBody: any = { 
            // coverImage对应prompts中的索引0
            prompt: prompts[0].prompt,
            photo: characterPhoto,
            style: imageStyle
          };
          
          // Add additional input images if available
          if (inputImage2) requestBody.input_image2 = inputImage2;
          if (inputImage3) requestBody.input_image3 = inputImage3;
          if (inputImage4) requestBody.input_image4 = inputImage4;

          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          if (error) throw error;
          
          // Backend might return result in output or coverImage field
          const imageUrl = data?.output?.[0] || data?.coverImage?.[0];
          if (!imageUrl) {
            throw new Error("No image generated from generate-love-cover");
          }
          
          // Expand the image
          const expandedBase64 = await expandImage(imageUrl);
          
          // Set in state for immediate display
          setCoverImage(expandedBase64);
          
          // Store persistently with timestamp
          await saveImageToStorage('loveStoryCoverImage', expandedBase64);
          
          toast({
            title: "Cover regenerated",
            description: `Cover updated with ${imageStyle} style`,
          });
        } catch (error) {
          console.error('Error regenerating cover:', error);
          toast({
            title: "Error regenerating cover",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingCover(false);
        }
      }
    }
  };

  const handleRegenerateIntro = async (style?: string) => {
    // Remove from both IndexedDB and localStorage
    try {
      await removeData('loveStoryIntroImage');
      localStorage.removeItem('loveStoryIntroImage'); // Fallback cleanup
    } catch (error) {
      console.error("Error removing intro image from storage:", error);
      // Continue anyway since we're replacing it
    }
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
    if (savedPrompts && characterPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingIntro(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        
        // Update the stored style if a new one is provided
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
          // Also store in IndexedDB for consistency
          await storeData('loveStoryStyle', style);
        }
        
        try {
          // Prepare the request body with additional images if available
          const requestBody: any = { 
            // introImage对应prompts中的索引1
            prompt: prompts[1].prompt, 
            photo: characterPhoto,
            style: imageStyle
          };
          
          // Add additional input images if available
          if (inputImage2) requestBody.input_image2 = inputImage2;
          if (inputImage3) requestBody.input_image3 = inputImage3;
          if (inputImage4) requestBody.input_image4 = inputImage4;

          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          if (error) throw error;
          
          // Backend might return data in different fields
          const imageUrl = data?.contentImage?.[0] || data?.output?.[0];
          if (!imageUrl) {
            throw new Error("No image generated from generate-love-cover");
          }
          
          // Expand the image
          const expandedBase64 = await expandImage(imageUrl);
          
          // Set in state for immediate display
          setIntroImage(expandedBase64);
          
          // Store persistently with timestamp
          await saveImageToStorage('loveStoryIntroImage', expandedBase64);
          
          toast({
            title: "Image regenerated",
            description: `Introduction image updated with ${imageStyle} style`,
          });
        } catch (error) {
          console.error('Error regenerating intro image:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
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
    
    // Display title adaptation for different naming conventions
    let title = imageIndex === 0 ? "Introduction" : `Moment ${imageIndex}`;
    
    return (
      <div className="mb-10">
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={handleRegenerate}
          index={imageIndex}
          onEditText={handleEditText}
          text={imageText?.text}
          title={title}
        />
      </div>
    );
  };

  // Add a debugging section to help track state
  const debugStorage = async () => {
    try {
      console.log("==== STORAGE DEBUG INFO ====");
      console.log("IndexedDB Initialized:", migratedToIndexedDB);
      console.log("Data Initialized:", dataInitialized);
      
      // Log what's in IndexedDB
      console.log("Current Cover Image in state:", coverImage?.substring(0, 50) + "...");
      
      const storedCover = await getDataFromStore('loveStoryCoverImage');
      console.log("Cover Image in IndexedDB:", 
        typeof storedCover === 'object' ? 
          (storedCover?.data?.substring(0, 50) + "...") : 
          (storedCover?.substring(0, 50) + "..."));
      
      // Log what's in localStorage
      const lsCover = localStorage.getItem('loveStoryCoverImage');
      console.log("Cover Image in localStorage:", lsCover?.substring(0, 50) + "...");
    } catch (error) {
      console.error("Error in debugStorage:", error);
    }
  };

  // Call debug on initial load when in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && dataInitialized) {
      debugStorage();
    }
  }, [dataInitialized]);

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
            onEditCover={handleEditCover}
          />
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Story Images with Text</h2>
        <div className="space-y-8">
          {/* 渲染介绍图片和内容图片 */}
          {renderContentImage(0)} {/* 介绍图片 */}
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
    </WizardStep>
  );
};

export default GenerateStep;
