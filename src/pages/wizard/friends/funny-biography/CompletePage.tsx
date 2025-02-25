import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const CompletePage = () => {
  const navigate = useNavigate();
  
  const handleBackToHome = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full p-12 rounded-2xl shadow-lg flex flex-col items-center text-center">
        <div className="bg-green-100 p-6 rounded-full mb-8">
          <Check className="h-16 w-16 text-green-600" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">Your Book Is Ready!</h1>
        
        <p className="text-xl text-gray-600 mb-10">
          Congratulations! Your funny biography has been successfully created. 
          You can now download it or share it with your friend.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button className="w-full py-6 bg-green-600 hover:bg-green-700">
            Download PDF
          </Button>
          <Button
            variant="outline"
            className="w-full py-6" 
            onClick={handleBackToHome}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompletePage; 