
import WizardStep from '@/components/wizard/WizardStep';

const WildFantasyGenerateStep = () => {
  return (
    <WizardStep
      title="Generate Your Wild Fantasy Book"
      description="We're about to turn your wild fantasy into reality!"
      previousStep="/create/friends/wild-fantasy/photos"
      currentStep={5}
      totalSteps={5}
    >
      <div className="space-y-6">
        <p className="text-center text-gray-600">
          Your book is being generated...
        </p>
      </div>
    </WizardStep>
  );
};

export default WildFantasyGenerateStep;
