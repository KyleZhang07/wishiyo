import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { useToast } from '@/hooks/use-toast';
import { getDataFromStore } from '@/utils/indexedDB';

// 定义爱情故事图像键
const LOVE_STORY_IMAGE_KEYS = [
  'loveStoryCoverImage',
  'loveStoryIntroImage',
  'loveStoryCharacterPhoto',
  'loveStoryContentImage1',
  'loveStoryContentImage2',
  'loveStoryContentImage3',
  'loveStoryContentImage4',
  'loveStoryContentImage5',
  'loveStoryContentImage6',
  'loveStoryContentImage7',
  'loveStoryContentImage8',
  'loveStoryContentImage9',
  'loveStoryContentImage10'
];

interface ImagePrompt {
  question: string;
  prompt: string;
}

interface ImageText {
  text: string;
  tone: string;
}

const DebugPromptsStep = () => {
  const [prompts, setPrompts] = useState<ImagePrompt[]>([]);
  const [texts, setTexts] = useState<ImageText[]>([]);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load prompts
        const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
        if (savedPrompts) {
          try {
            setPrompts(JSON.parse(savedPrompts));
          } catch (error) {
            console.error('Error parsing prompts:', error);
          }
        }
        
        // Load text accompaniments
        const savedTexts = localStorage.getItem('loveStoryImageTexts');
        if (savedTexts) {
          try {
            setTexts(JSON.parse(savedTexts));
          } catch (error) {
            console.error('Error parsing texts:', error);
          }
        }
        
        // Load selected tone and style
        const savedTone = localStorage.getItem('loveStoryTone');
        if (savedTone) {
          setSelectedTone(savedTone);
        }
        
        const savedStyle = localStorage.getItem('loveStoryStyle');
        if (savedStyle) {
          setSelectedStyle(savedStyle);
        }

        // Load character photo from IndexedDB with localStorage fallback
        try {
          const characterPhotoFromIDB = await getDataFromStore('loveStoryCharacterPhoto');
          if (characterPhotoFromIDB) {
            setCharacterPhoto(characterPhotoFromIDB);
          } else {
            const characterPhotoFromLS = localStorage.getItem('loveStoryCharacterPhoto');
            if (characterPhotoFromLS) {
              setCharacterPhoto(characterPhotoFromLS);
            }
          }
        } catch (error) {
          console.error('Error loading character photo from IndexedDB:', error);
          // Fallback to localStorage
          const characterPhotoFromLS = localStorage.getItem('loveStoryCharacterPhoto');
          if (characterPhotoFromLS) {
            setCharacterPhoto(characterPhotoFromLS);
          }
        }

        // Try to load images from IndexedDB
        for (const key of LOVE_STORY_IMAGE_KEYS) {
          try {
            const imageFromIDB = await getDataFromStore(key);
            if (imageFromIDB) {
              console.log(`Loaded ${key} from IndexedDB`);
            }
          } catch (error) {
            console.error(`Error loading ${key} from IndexedDB:`, error);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "There was a problem loading your story data."
        });
      }
    };

    loadData();
  }, [toast]);

  return (
    <WizardStep
      title="[DEV] Love Story Debug View"
      description="This is a development-only view to check the stored data for the love story."
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/moments"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-8 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="text-yellow-800 font-bold">⚠️ Development Only</h2>
          <p className="text-yellow-700">This page is for development purposes and will be removed in production.</p>
        </div>
        
        {/* Selected tone and style */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-800 mb-2">Selected Settings:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 font-semibold">Text Tone:</p>
              <p className="text-gray-800">{selectedTone || 'Not selected'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Image Style:</p>
              <p className="text-gray-800">{selectedStyle || 'Not selected'}</p>
            </div>
          </div>
        </div>

        {/* Display character photo if available */}
        {characterPhoto && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-2">Character Photo:</h3>
            <div className="w-32 h-32 mx-auto">
              <img src={characterPhoto} alt="Character" className="object-cover rounded-lg" />
            </div>
            <p className="text-center text-gray-600 text-sm mt-2">Stored in {characterPhoto.length > 100000 ? 'IndexedDB' : 'localStorage'}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-xl">Story Elements:</h3>
          
          {/* Display the cover image data */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-2">Cover Image:</h3>
            <p className="text-gray-600 mb-4">{prompts[0]?.question}</p>
            <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompts[0]?.prompt}</p>
          </div>

          {/* Display the introduction image data */}
          {prompts.length > 1 && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold text-gray-800 mb-2">Introduction Image:</h3>
              <div className="mb-4">
                <p className="text-gray-600 font-semibold mb-1">Question:</p>
                <p className="text-gray-800">{prompts[1]?.question}</p>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 font-semibold mb-1">Image Prompt:</p>
                <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompts[1]?.prompt}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-600 font-semibold mb-1">Text Accompaniment ({texts[0]?.tone || selectedTone}):</p>
                {texts[0] ? (
                  <p className="text-gray-800 italic bg-blue-50 p-3 rounded">{texts[0].text}</p>
                ) : (
                  <p className="text-red-500">No text accompaniment found</p>
                )}
              </div>
            </div>
          )}

          {/* Display the content/moment images data */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Moment Images:</h3>
            {prompts.slice(2).map((prompt, index) => {
              // index here starts from 0, but we're showing moments 1-10
              const momentNumber = index + 1;
              // Text index is offset by 1 since index 0 is for Introduction
              const textIndex = index + 1;
              
              return (
                <div key={index} className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-bold text-gray-800 mb-2">Moment {momentNumber}:</h4>
                  
                  <div className="mb-4">
                    <p className="text-gray-600 font-semibold mb-1">Question:</p>
                    <p className="text-gray-800">{prompt.question}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-600 font-semibold mb-1">Image Prompt:</p>
                    <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompt.prompt}</p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 font-semibold mb-1">Text Accompaniment ({texts[textIndex]?.tone || selectedTone}):</p>
                    {texts[textIndex] ? (
                      <p className="text-gray-800 italic bg-blue-50 p-3 rounded">{texts[textIndex].text}</p>
                    ) : (
                      <p className="text-red-500">No text accompaniment found</p>
                    )}
                  </div>
                  
                  <div className="mt-2 text-gray-500 text-sm">
                    <p>Stored as: loveStoryContentImage{momentNumber}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Storage info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Storage Information:</h3>
          <p className="text-blue-700">
            This application uses both localStorage and IndexedDB for data storage.
            Larger files (like images) are stored in IndexedDB, while smaller data
            is kept in localStorage.
          </p>
        </div>
        
        {/* Image Key Mapping Reference */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-800 mb-2">Image Key Mapping Reference:</h3>
          <p className="text-green-700 mb-2">Index 0: Cover Image (loveStoryCoverImage)</p>
          <p className="text-green-700 mb-2">Index 1: Introduction Image (loveStoryIntroImage)</p>
          <p className="text-green-700 mb-2">Index 2-11: Content Images 1-10 (loveStoryContentImage1-10)</p>
        </div>
        
        {/* Raw data dump for debugging */}
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs mt-8 overflow-x-auto">
          <h3 className="text-white mb-2">Raw Data:</h3>
          <p className="mb-2">ImagePrompts:</p>
          <pre>{JSON.stringify(prompts, null, 2)}</pre>
          <p className="mt-4 mb-2">ImageTexts:</p>
          <pre>{JSON.stringify(texts, null, 2)}</pre>
        </div>
      </div>
    </WizardStep>
  );
};

export default DebugPromptsStep;
