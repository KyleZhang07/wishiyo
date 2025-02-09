
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

const Step3 = () => {
  const navigate = useNavigate();

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-4">
            Design Your Book Cover
          </h1>
          <p className="text-gray-600">
            Choose a cover style and set up your chapters.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book Title
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter your book title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Cover Style
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['Minimalist', 'Artistic', 'Photo-based', 'Typography'].map((style) => (
                  <div
                    key={style}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded flex items-center justify-center mb-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-center text-sm font-medium">{style}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => navigate('/create/step2')}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => navigate('/create/step4')}
                className="px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue to Generation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3;
