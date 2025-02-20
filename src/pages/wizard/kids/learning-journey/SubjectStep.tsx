
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const subjects = [
  {
    id: 'science',
    title: 'Science Explorer',
    description: 'Discover the wonders of nature and science'
  },
  {
    id: 'math',
    title: 'Math Adventure',
    description: 'Make numbers fun and exciting'
  },
  {
    id: 'nature',
    title: 'Nature Discovery',
    description: 'Learn about animals and the environment'
  }
];

const LearningJourneySubjectStep = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const navigate = useNavigate();

  return (
    <WizardStep
      title="Choose Learning Subject"
      description="Select what your child will explore"
      previousStep="/create/kids/learning/author"
      nextStep="/create/kids/learning/style"
      currentStep={2}
      totalSteps={4}
    >
      <div className="space-y-4">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            className={`w-full p-4 text-left rounded-lg border transition-all ${
              selectedSubject === subject.id 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => setSelectedSubject(subject.id)}
          >
            <h3 className="font-medium text-lg mb-1">{subject.title}</h3>
            <p className="text-gray-600">{subject.description}</p>
          </button>
        ))}
      </div>
    </WizardStep>
  );
};

export default LearningJourneySubjectStep;
