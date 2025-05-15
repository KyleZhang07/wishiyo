import { useState, useEffect, useMemo } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LoveStoryCharacterStep = () => {
  // 直接在状态初始化时从 localStorage 加载数据，避免闪烁
  const [firstName, setFirstName] = useState<string>(() => {
    return localStorage.getItem('loveStoryPersonName') || '';
  });
  const [gender, setGender] = useState<'male' | 'female' | ''>(() => {
    const savedGender = localStorage.getItem('loveStoryPersonGender');
    return (savedGender as 'male' | 'female') || '';
  });
  const [age, setAge] = useState<string>(() => {
    return localStorage.getItem('loveStoryPersonAge') || '';
  });
  const [authorName, setAuthorName] = useState<string>(() => {
    return localStorage.getItem('loveStoryAuthorName') || '';
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Monitor authorName and firstName to update persisted storage and downstream cards
  const genericNameParts = useMemo(
    () => [''],
    [] // no templated questions here, but can adjust as needed
  );

  useEffect(() => {
    // Update localStorage keys when authorName or firstName change
    localStorage.setItem('loveStoryPersonName', firstName.trim());
    localStorage.setItem('loveStoryAuthorName', authorName.trim());
  }, [firstName, authorName]);

  const handleContinue = () => {
    localStorage.setItem('loveStoryPersonName', firstName.trim());
    localStorage.setItem('loveStoryPersonGender', gender);
    localStorage.setItem('loveStoryPersonAge', age);
    localStorage.setItem('loveStoryAuthorName', authorName.trim());

    navigate('/create/love/love-story/questions');
  };

  // 验证所有输入是否有效
  const isFormValid = () => {
    if (!firstName.trim() || !gender || !age.trim() || !authorName.trim()) {
      return false;
    }

    // 验证年龄是否有效
    const ageNumber = parseInt(age);
    if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      return false;
    }

    return true;
  };

  return (
    <WizardStep
      title="Character Information"
      description="Tell us about you and the main character of the story"
      previousStep="/"
      currentStep={1}
      totalSteps={6}
      onNextClick={handleContinue}
      nextDisabled={!isFormValid()}
    >
      <div className="space-y-8">
        <div>
          <label className="block text-sm font-medium mb-2">Their name</label>
          <Input placeholder="" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Their gender</label>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={gender === 'male' ? 'default' : 'outline'}
              className={`w-[90%] mx-auto py-6 text-lg ${gender === 'male' ? 'bg-[#FF7F50] hover:bg-[#FF7F50]/80' : ''}`}
              onClick={() => setGender('male')}
            >
              Male
            </Button>
            <Button
              type="button"
              variant={gender === 'female' ? 'default' : 'outline'}
              className={`w-[90%] mx-auto py-6 text-lg ${gender === 'female' ? 'bg-[#FF7F50] hover:bg-[#FF7F50]/80' : ''}`}
              onClick={() => setGender('female')}
            >
              Female
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Their age</label>
          <Input
            type="number"
            placeholder=""
            value={age}
            onChange={e => setAge(e.target.value)}
            min="1"
            max="120"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Author name</label>
          <Input placeholder="" value={authorName} onChange={e => setAuthorName(e.target.value)} />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryCharacterStep;