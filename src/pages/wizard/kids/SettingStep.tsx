
import WizardStep from '@/components/wizard/WizardStep';

const KidsSettingStep = () => {
  return (
    <WizardStep
      title="Choose the Story Setting"
      description="Where will your character's adventure take place?"
      previousStep="/create/kids/character"
      nextStep="/create/kids/story"
      currentStep={2}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Magical Forest</h3>
          <p className="text-sm text-gray-600">A enchanted woodland full of magical creatures</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Space Adventure</h3>
          <p className="text-sm text-gray-600">Journey through the stars and distant planets</p>
        </div>
      </div>
    </WizardStep>
  );
};

export default KidsSettingStep;
