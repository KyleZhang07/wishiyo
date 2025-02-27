import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';

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

  useEffect(() => {
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
  }, []);

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
        
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-xl">Story Elements:</h3>
          
          {/* Display the cover image data */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-2">Cover Image:</h3>
            <p className="text-gray-600 mb-4">{prompts[0]?.question}</p>
            <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompts[0]?.prompt}</p>
          </div>

          {/* Display the story image prompts with their text accompaniments */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Story Images:</h3>
            {prompts.slice(1).map((prompt, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-bold text-gray-800 mb-2">Image {index + 1}:</h4>
                
                <div className="mb-4">
                  <p className="text-gray-600 font-semibold mb-1">Question:</p>
                  <p className="text-gray-800">{prompt.question}</p>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-600 font-semibold mb-1">Image Prompt:</p>
                  <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompt.prompt}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 font-semibold mb-1">Text Accompaniment ({texts[index]?.tone || selectedTone}):</p>
                  {texts[index] ? (
                    <p className="text-gray-800 italic bg-blue-50 p-3 rounded">{texts[index].text}</p>
                  ) : (
                    <p className="text-red-500">No text accompaniment found</p>
                  )}
                </div>
              </div>
            ))}
          </div>
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
