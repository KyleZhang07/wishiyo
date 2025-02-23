
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';

interface ImagePrompt {
  question: string;
  prompt: string;
}

const DebugPromptsStep = () => {
  const [prompts, setPrompts] = useState<ImagePrompt[]>([]);

  useEffect(() => {
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts));
      } catch (error) {
        console.error('Error parsing prompts:', error);
      }
    }
  }, []);

  return (
    <WizardStep
      title="[DEV] Image Prompts Debug View"
      description="This is a development-only view to check the stored image prompts."
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/moments"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-6 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="text-yellow-800 font-bold">⚠️ Development Only</h2>
          <p className="text-yellow-700">This page is for development purposes and will be removed in production.</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-2">Cover Image Prompt:</h3>
            <p className="text-gray-600 mb-4">{prompts[0]?.question}</p>
            <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompts[0]?.prompt}</p>
          </div>

          <div className="grid gap-4">
            <h3 className="font-bold text-gray-800">Story Image Prompts:</h3>
            {prompts.slice(1).map((prompt, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-bold text-gray-800 mb-2">Image {index + 1}:</h4>
                <p className="text-gray-600 mb-4">{prompt.question}</p>
                <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded">{prompt.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default DebugPromptsStep;
