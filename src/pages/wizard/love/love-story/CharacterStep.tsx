import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LoveStoryCharacterStep = () => {
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [age, setAge] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedFirstName = localStorage.getItem('loveStoryPersonName');
    const savedGender = localStorage.getItem('loveStoryPersonGender');
    const savedAge = localStorage.getItem('loveStoryPersonAge');
    
    if (savedFirstName) setFirstName(savedFirstName);
    if (savedGender) setGender(savedGender as 'male' | 'female');
    if (savedAge) setAge(savedAge);
  }, []);

  const handleContinue = () => {
    if (!firstName.trim()) {
      toast({
        variant: "destructive",
        title: "姓名必填",
        description: "请输入他们的名字以继续"
      });
      return;
    }

    if (!gender) {
      toast({
        variant: "destructive",
        title: "性别必填",
        description: "请选择他们的性别以继续"
      });
      return;
    }

    if (!age) {
      toast({
        variant: "destructive",
        title: "年龄必填",
        description: "请选择他们的年龄以继续"
      });
      return;
    }

    localStorage.setItem('loveStoryPersonName', firstName.trim());
    localStorage.setItem('loveStoryPersonGender', gender);
    localStorage.setItem('loveStoryPersonAge', age);
    
    navigate('/create/love/love-story/author');
  };

  // 年龄选项范围
  const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18);

  return (
    <WizardStep 
      title="角色信息" 
      description="请告诉我们关于故事主角的信息" 
      previousStep="/love" 
      currentStep={1} 
      totalSteps={5} 
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">谁是故事主角？</label>
          <Input placeholder="输入他们的名字" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">他们的性别</label>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              type="button" 
              variant={gender === 'male' ? 'default' : 'outline'} 
              className="w-full py-6 text-lg" 
              onClick={() => setGender('male')}
            >
              男性
            </Button>
            <Button 
              type="button" 
              variant={gender === 'female' ? 'default' : 'outline'} 
              className="w-full py-6 text-lg" 
              onClick={() => setGender('female')}
            >
              女性
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">他们的年龄</label>
          <Select value={age} onValueChange={setAge}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择年龄" />
            </SelectTrigger>
            <SelectContent>
              {ageOptions.map(age => (
                <SelectItem key={age} value={age.toString()}>
                  {age} 岁
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryCharacterStep; 