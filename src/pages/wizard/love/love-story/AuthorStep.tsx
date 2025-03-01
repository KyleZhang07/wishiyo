import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LoveStoryAuthorStep = () => {
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    if (savedAuthorName) setAuthorName(savedAuthorName);
  }, []);

  const handleContinue = () => {
    if (!authorName.trim()) {
      toast({
        variant: "destructive",
        title: "作者姓名必填",
        description: "请输入您的名字以继续"
      });
      return;
    }

    localStorage.setItem('loveStoryAuthorName', authorName.trim());
    navigate('/create/love/love-story/questions');
  };

  return (
    <WizardStep 
      title="作者信息" 
      description="请告诉我们关于您的信息" 
      previousStep="/create/love/love-story/character" 
      currentStep={2} 
      totalSteps={5} 
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">作者姓名</label>
          <Input placeholder="输入您的名字" value={authorName} onChange={e => setAuthorName(e.target.value)} />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryAuthorStep;