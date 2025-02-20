
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Character {
  name: string;
  description: string;
  type: 'hero' | 'friend' | 'helper';
}

const StoryBookCharactersStep = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Partial<Character> | null>(null);

  const handleAddCharacter = () => {
    if (currentCharacter?.name && currentCharacter.description && currentCharacter.type) {
      setCharacters([...characters, currentCharacter as Character]);
      setCurrentCharacter(null);
    }
  };

  return (
    <WizardStep
      title="Create Your Characters"
      description="Add characters to your story"
      previousStep="/create/kids/story-book/theme"
      nextStep="/create/kids/story-book/generate"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-6">
        {characters.map((character, index) => (
          <div key={index} className="bg-white rounded-lg border p-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 rounded-full bg-white border shadow-sm hover:bg-gray-50 h-8 w-8 p-0"
              onClick={() => setCharacters(characters.filter((_, i) => i !== index))}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{character.name}</h3>
                <span className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {character.type}
                </span>
              </div>
              <p className="text-gray-600">{character.description}</p>
            </div>
          </div>
        ))}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-4">Add New Character</h3>
          <div className="space-y-4">
            <Input
              placeholder="Character Name"
              onChange={e => setCurrentCharacter(prev => ({ ...prev, name: e.target.value }))}
            />
            
            <Textarea
              placeholder="Describe the character..."
              onChange={e => setCurrentCharacter(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <select
              className="w-full p-2 rounded-md border"
              onChange={e => setCurrentCharacter(prev => ({ ...prev, type: e.target.value as Character['type'] }))}
            >
              <option value="">Select Character Type</option>
              <option value="hero">Hero</option>
              <option value="friend">Friend</option>
              <option value="helper">Helper</option>
            </select>
            
            <Button 
              className="w-full"
              onClick={handleAddCharacter}
              disabled={!currentCharacter?.name || !currentCharacter.description || !currentCharacter.type}
            >
              Add Character
            </Button>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default StoryBookCharactersStep;
