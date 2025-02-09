
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Step4 = () => {
  const navigate = useNavigate();

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-4">
            Generating Your Book
          </h1>
          <p className="text-gray-600">
            Please wait while we craft your story...
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">AI is writing your story</p>
            <p className="text-gray-600">This may take a few minutes...</p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                onClick={() => navigate('/create/step3')}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => navigate('/user-center')}
                className="px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                View My Books
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4;
