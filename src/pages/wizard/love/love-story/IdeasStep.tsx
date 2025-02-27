
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2 } from 'lucide-react';

const TEXT_TONE_OPTIONS = [
  { id: 'humorous', name: 'Humorous', description: 'Light-hearted and funny' },
  { id: 'poetic', name: 'Poetic', description: 'Expressive and rhythmic' },
  { id: 'dramatic', name: 'Dramatic', description: 'Intense and emotional' },
  { id: 'heartfelt', name: 'Heartfelt', description: 'Sincere and moving' },
  { id: 'encouraging', name: 'Encouraging', description: 'Uplifting and motivational' },
];

const IMAGE_STYLE_OPTIONS = [
  { id: 'comic', name: 'Comic Book', description: 'Bold lines and vibrant colors' },
  { id: 'line-art', name: 'Line Art', description: 'Simple, elegant outlines' },
  { id: 'fantasy', name: 'Fantasy Art', description: 'Magical and dreamlike' },
  { id: 'photographic', name: 'Photographic', description: 'Realistic and detailed' },
  { id: 'cinematic', name: 'Cinematic', description: 'Dramatic, movie-like style' },
];

const LoveStoryIdeasStep = () => {
  const [selectedTextTone, setSelectedTextTone] = useState<string | null>(null);
  const [selectedImageStyle, setSelectedImageStyle] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved preferences from localStorage if they exist
    const savedTextTone = localStorage.getItem('loveStoryTextTone');
    const savedImageStyle = localStorage.getItem('loveStoryImageStyle');
    
    if (savedTextTone) {
      setSelectedTextTone(savedTextTone);
    }
    
    if (savedImageStyle) {
      setSelectedImageStyle(savedImageStyle);
    }
  }, []);

  const handleTextToneSelect = (toneId: string) => {
    setSelectedTextTone(toneId);
    localStorage.setItem('loveStoryTextTone', toneId);
    
    toast({
      title: "Text tone selected",
      description: `Your love story will use a ${toneId} tone.`
    });
    
    // Generate and save text prompts based on selected tone
    generateTextPrompts(toneId, selectedImageStyle || 'photographic');
  };

  const handleImageStyleSelect = (styleId: string) => {
    setSelectedImageStyle(styleId);
    localStorage.setItem('loveStoryImageStyle', styleId);
    
    toast({
      title: "Image style selected",
      description: `Your love story will use ${styleId} style images.`
    });
    
    // Generate and save image prompts based on selected style
    generateTextPrompts(selectedTextTone || 'heartfelt', styleId);
  };

  const generateTextPrompts = async (textTone: string, imageStyle: string) => {
    try {
      // Get necessary data from localStorage
      const personName = localStorage.getItem('loveStoryPersonName') || '';
      const personGender = localStorage.getItem('loveStoryPersonGender') || '';
      const authorName = localStorage.getItem('loveStoryAuthorName') || '';
      const loveStoryAnswers = localStorage.getItem('loveStoryAnswers') || '[]';
      const answers = JSON.parse(loveStoryAnswers);
      
      // Get existing image prompts
      const savedImagePrompts = localStorage.getItem('loveStoryImagePrompts') || '[]';
      const imagePrompts = JSON.parse(savedImagePrompts);
      
      // Combine style and tone for enhanced prompts
      const styleModifiers = {
        'comic': 'comic book style, bold outlines, vibrant colors',
        'line-art': 'minimalist line art, clean outlines, simple elegant design',
        'fantasy': 'fantasy art style, magical, dreamlike, ethereal quality',
        'photographic': 'photorealistic, detailed, high-resolution photograph',
        'cinematic': 'cinematic shot, dramatic lighting, movie-like composition'
      };
      
      const toneModifiers = {
        'humorous': 'with a light-hearted and comedic tone',
        'poetic': 'with lyrical and expressive language',
        'dramatic': 'with intense emotion and powerful imagery',
        'heartfelt': 'with sincere and deeply moving sentiments',
        'encouraging': 'with motivational and uplifting messages'
      };
      
      // Save the tone and style choices for prompting
      const styleModifier = styleModifiers[imageStyle as keyof typeof styleModifiers] || styleModifiers.photographic;
      const toneModifier = toneModifiers[textTone as keyof typeof toneModifiers] || toneModifiers.heartfelt;
      
      // Save to localStorage for later use in the image generation
      localStorage.setItem('loveStoryStyleModifier', styleModifier);
      localStorage.setItem('loveStoryToneModifier', toneModifier);
      
      // Generate text snippets that will accompany each image based on the selected tone
      // This would typically be done with AI in a real implementation
      // For now, we'll just save the tone and style preferences
      localStorage.setItem('loveStoryTextToneData', JSON.stringify({
        tone: textTone,
        style: imageStyle,
        personName,
        personGender,
        authorName
      }));
      
      console.log("Saved text tone and image style preferences for later generation");
    } catch (error) {
      console.error('Error generating text prompts:', error);
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your style choices. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <WizardStep
      title="Customize Your Love Story Style"
      description="Choose the tone of the text and style of images for your love story"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/moments"
      currentStep={3}
      totalSteps={5}
    >
      <div className="space-y-8">
        {/* Text Tone Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Select a Text Tone</h2>
          <p className="text-gray-600 mb-6">
            Choose how you want the text in your love story to sound.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEXT_TONE_OPTIONS.map((tone) => (
              <Card 
                key={tone.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTextTone === tone.id ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => handleTextToneSelect(tone.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{tone.name}</CardTitle>
                    {selectedTextTone === tone.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardDescription>{tone.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Image Style Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Select an Image Style</h2>
          <p className="text-gray-600 mb-6">
            Choose the visual style for the images in your love story.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {IMAGE_STYLE_OPTIONS.map((style) => (
              <Card 
                key={style.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedImageStyle === style.id ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => handleImageStyleSelect(style.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{style.name}</CardTitle>
                    {selectedImageStyle === style.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardDescription>{style.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
        
        {(!selectedTextTone || !selectedImageStyle) && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <p className="text-amber-800">
              Please select both a text tone and image style to continue.
            </p>
          </div>
        )}
      </div>
    </WizardStep>
  );
};

export default LoveStoryIdeasStep;
