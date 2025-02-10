
import { useNavigate } from 'react-router-dom';

const Step1 = () => {
  const navigate = useNavigate();

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-4">
            Let's Start Your Book
          </h1>
          <p className="text-gray-600">
            Begin by sharing your ideas and we'll help bring them to life.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter keywords separated by commas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Story Background
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Describe your story's setting, characters, or main ideas..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => navigate('/create/step2')}
                className="px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue to Illustrations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1;
