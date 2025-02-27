import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';

interface ImageText {
  text: string;
  tone: string;
}

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [backCoverText, setBackCoverText] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [contentImage, setContentImage] = useState<string>();
  // contentImage2~11
  const [contentImage2, setContentImage2] = useState<string>();
  const [contentImage3, setContentImage3] = useState<string>();
  const [contentImage4, setContentImage4] = useState<string>();
  const [contentImage5, setContentImage5] = useState<string>();
  const [contentImage6, setContentImage6] = useState<string>();
  const [contentImage7, setContentImage7] = useState<string>();
  const [contentImage8, setContentImage8] = useState<string>();
  const [contentImage9, setContentImage9] = useState<string>();
  const [contentImage10, setContentImage10] = useState<string>();
  const [contentImage11, setContentImage11] = useState<string>();

  const [contentGenerating, setContentGenerating] = useState<{[key: number]: boolean}>({
    1: false,
    2: false
  });
  const [coverGenerating, setCoverGenerating] = useState(false);

  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);

  const { toast } = useToast();

  const [images, setImages] = useState<{
    coverImage?: string[];
    contentImage?: string[];
    contentImage2?: string[];
  }>({});

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

  const handleGenericContentRegeneration = async (
    index: number,
    style?: string
  ) => {
    // Check for prompts existence
    const prompts = localStorage.getItem(`love-story-prompts`);
    if (!prompts) {
      toast({
        title: "No prompts found",
        description: "Please go back to Ideas step to create prompts",
      });
      return;
    }

    // Check for character photos existence
    const characterPhotos = localStorage.getItem(`love-story-character-photos`);
    if (!characterPhotos) {
      toast({
        title: "No character photos found",
        description: "Please go back to Moments step to upload photos",
      });
      return;
    }

    try {
      setContentGenerating({ ...contentGenerating, [index]: true });
      
      // Parse the JSON string to get the array of photos
      const photos = JSON.parse(characterPhotos);
      
      // Call the serverless function with all photos
      const payload = {
        [index === 1 ? "contentPrompt" : "content2Prompt"]:
          JSON.parse(prompts)[index - 1],
        photos,
        style: style || selectedStyle,
      };
      
      console.log(`Regenerating content image ${index} with style: ${style || selectedStyle}`);
      
      const { data, error } = await supabase.functions.invoke(
        "generate-love-cover",
        {
          body: payload,
        }
      );

      if (error) {
        console.error("Error generating image:", error);
        toast({
          title: "Error generating image",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Update the content image in localStorage
      const contentKey = index === 1 ? "contentImage" : "contentImage2";
      const existingData = localStorage.getItem("love-story-images");
      const parsedData = existingData ? JSON.parse(existingData) : {};
      
      localStorage.setItem(
        "love-story-images",
        JSON.stringify({
          ...parsedData,
          [contentKey]: data[contentKey],
        })
      );

      // Refresh state
      const newImages = { ...images };
      newImages[contentKey] = data[contentKey];
      setImages(newImages);
    } catch (err) {
      console.error("Error generating image:", err);
      toast({
        title: "Error generating image",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setContentGenerating({ ...contentGenerating, [index]: false });
    }
  };

  const handleRegenerateContent2 = (style?: string) => handleGenericContentRegeneration(2, style);
  const handleRegenerateContent3 = (style?: string) => handleGenericContentRegeneration(3, style);
  const handleRegenerateContent4 = (style?: string) => handleGenericContentRegeneration(4, style);
  const handleRegenerateContent5 = (style?: string) => handleGenericContentRegeneration(5, style);
  const handleRegenerateContent6 = (style?: string) => handleGenericContentRegeneration(6, style);
  const handleRegenerateContent7 = (style?: string) => handleGenericContentRegeneration(7, style);
  const handleRegenerateContent8 = (style?: string) => handleGenericContentRegeneration(8, style);
  const handleRegenerateContent9 = (style?: string) => handleGenericContentRegeneration(9, style);
  const handleRegenerateContent10 = (style?: string) => handleGenericContentRegeneration(10, style);
  const handleRegenerateContent11 = (style?: string) => handleGenericContentRegeneration(11, style);

  const generateInitialImages = async () => {
    // Check for prompts
    const prompts = localStorage.getItem(`love-story-prompts`);
    if (!prompts) {
      toast({
        title: "No prompts found",
        description: "Please go back to Ideas step to create prompts",
      });
      return;
    }

    // Check for character photos
    const characterPhotos = localStorage.getItem(`love-story-character-photos`);
    if (!characterPhotos) {
      toast({
        title: "No character photos found",
        description: "Please go back to Moments step to upload photos",
      });
      return;
    }

    try {
      setCoverGenerating(true);
      setContentGenerating({ 1: true, 2: true });

      // Parse the prompts from localStorage
      const promptsJson = JSON.parse(prompts);
      
      // Parse the photos from localStorage
      const photos = JSON.parse(characterPhotos);
      
      // Call the serverless function with all photos
      const payload = {
        prompt: promptsJson[0],
        contentPrompt: promptsJson[1],
        content2Prompt: promptsJson[2],
        photos,
        style: selectedStyle,
      };
      
      console.log("Generating initial images with payload:", JSON.stringify(payload));
      
      const { data, error } = await supabase.functions.invoke(
        "generate-love-cover",
        {
          body: payload,
        }
      );

      if (error) {
        console.error("Error generating images:", error);
        toast({
          title: "Error generating images",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Store the images in localStorage
      localStorage.setItem(
        "love-story-images",
        JSON.stringify({
          coverImage: data.output,
          contentImage: data.contentImage,
          contentImage2: data.contentImage2,
        })
      );

      // Update state
      setImages({
        coverImage: data.output,
        contentImage: data.contentImage,
        contentImage2: data.contentImage2,
      });

      toast({
        title: "Images generated successfully",
        description: "Your love story images are ready!",
      });
    } catch (err) {
      console.error("Error generating images:", err);
      toast({
        title: "Error generating images",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCoverGenerating(false);
      setContentGenerating({ 1: false, 2: false });
    }
  };

  useEffect(() => {
    // Check for saved images in the new format
    const savedImages = localStorage.getItem("love-story-images");
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        setImages(parsedImages);
      } catch (error) {
        console.error("Error parsing saved images:", error);
      }
    } else {
      // Legacy support: Check for images in old format
      const savedCoverImage = localStorage.getItem("loveStoryCoverImage");
      const savedContentImage = localStorage.getItem("loveStoryContentImage");
      const savedContentImage2 = localStorage.getItem("loveStoryContentImage2");

      if (savedCoverImage) setCoverImage(savedCoverImage);
      if (savedContentImage) setContentImage(savedContentImage);
      if (savedContentImage2) setContentImage2(savedContentImage2);

      // If we have old format images, migrate them to the new format
      if (savedCoverImage || savedContentImage || savedContentImage2) {
        const migratedImages = {
          ...(savedCoverImage ? { coverImage: [savedCoverImage] } : {}),
          ...(savedContentImage ? { contentImage: [savedContentImage] } : {}),
          ...(savedContentImage2 ? { contentImage2: [savedContentImage2] } : {})
        };
        setImages(migratedImages);
        localStorage.setItem("love-story-images", JSON.stringify(migratedImages));
      }
    }

    // Check if we need to generate initial images
    const savedPrompts = localStorage.getItem("love-story-prompts");
    const characterPhotos = localStorage.getItem("love-story-character-photos");
    
    // Legacy support
    const partnerPhoto = localStorage.getItem("loveStoryPartnerPhoto");
    
    if (!savedImages && savedPrompts && (characterPhotos || partnerPhoto)) {
      // If we have character photos in the new format, use them
      if (characterPhotos) {
        generateInitialImages();
      }
      // Legacy support: If we only have a partner photo, migrate it first
      else if (partnerPhoto) {
        // Migrate partner photo to character photos
        localStorage.setItem("love-story-character-photos", JSON.stringify([partnerPhoto]));
        generateInitialImages();
      }
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
    // Check for prompts
    const prompts = localStorage.getItem(`love-story-prompts`);
    if (!prompts) {
      toast({
        title: "No prompts found",
        description: "Please go back to Ideas step to create prompts",
      });
      return;
    }

    // Check for character photos
    const characterPhotos = localStorage.getItem(`love-story-character-photos`);
    if (!characterPhotos) {
      toast({
        title: "No character photos found",
        description: "Please go back to Moments step to upload photos",
      });
      return;
    }

    try {
      setCoverGenerating(true);
      
      // Parse the JSON string to get the array of photos
      const photos = JSON.parse(characterPhotos);
      
      // Call the serverless function with all photos
      const payload = {
        prompt: JSON.parse(prompts)[0],
        photos,
        style: style || selectedStyle,
      };
      
      console.log(`Regenerating cover with style: ${style || selectedStyle}`);
      
      const { data, error } = await supabase.functions.invoke(
        "generate-love-cover",
        {
          body: payload,
        }
      );

      if (error) {
        console.error("Error generating cover:", error);
        toast({
          title: "Error generating cover",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Update the cover image in localStorage
      const existingData = localStorage.getItem("love-story-images");
      const parsedData = existingData ? JSON.parse(existingData) : {};
      localStorage.setItem(
        "love-story-images",
        JSON.stringify({
          ...parsedData,
          coverImage: data.output,
        })
      );

      // Refresh state
      const newImages = { ...images };
      newImages.coverImage = data.output;
      setImages(newImages);
    } catch (err) {
      console.error("Error generating cover:", err);
      toast({
        title: "Error generating cover",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCoverGenerating(false);
    }
  };

  const handleRegenerateContent1 = async (style?: string) => {
    return handleGenericContentRegeneration(1, style);
  };

  // Render content images with text inside the canvas
  const renderContentImage = (imageIndex: number) => {
    const imageStateMap: Record<number, string | undefined> = {
      1: contentImage,
      2: contentImage2,
      3: contentImage3,
      4: contentImage4,
      5: contentImage5,
      6: contentImage6,
      7: contentImage7,
      8: contentImage8,
      9: contentImage9,
      10: contentImage10,
      11: contentImage11,
    };
    
    const loadingStateMap: Record<number, boolean> = {
      1: contentGenerating[1],
      2: contentGenerating[2],
      3: contentGenerating[3],
      4: contentGenerating[4], 
      5: contentGenerating[5],
      6: contentGenerating[6],
      7: contentGenerating[7],
      8: contentGenerating[8],
      9: contentGenerating[9],
      10: contentGenerating[10],
      11: contentGenerating[11],
    };
    
    const handleRegenerateMap: Record<number, () => void> = {
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
      11: handleRegenerateContent11,
    };
    
    const image = imageStateMap[imageIndex];
    const isLoading = loadingStateMap[imageIndex];
    const handleRegenerate = handleRegenerateMap[imageIndex];
    // Get the text for this image, adjusting for zero-based array index
    const imageText = imageTexts && imageTexts.length > imageIndex - 1 ? imageTexts[imageIndex - 1] : null;
    
    return (
      <div className="mb-10">
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={handleRegenerate}
          index={imageIndex}
          onEditText={() => {}}
          text={imageText?.text}
        />
      </div>
    );
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
        {/* Cover section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Cover</h2>
          <CoverPreviewCard 
            coverImage={coverImage}
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            backCoverText={backCoverText}
            isGeneratingCover={coverGenerating}
            onRegenerateCover={handleRegenerateCover}
            onEditCover={() => {}}
          />
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Story Images with Text</h2>
        <div className="space-y-8">
          {/* Render content images with text inside canvas */}
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
          {renderContentImage(11)}
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
