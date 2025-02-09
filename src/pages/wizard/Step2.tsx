
import { useNavigate } from 'react-router-dom';
import { Image } from 'lucide-react';

const Step2 = () => {
  const navigate = useNavigate();

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-4">
            Choose Illustration Style
          </h1>
          <p className="text-gray-600">
            Select how you want your book to be illustrated.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Minimal Line Art', 'Watercolor', 'Digital Art', 'None'].map((style) => (
                <div
                  key={style}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                >
                  <Image className="w-8 h-8 text-gray-400 mb-2" />
                  <h3 className="font-medium">{style}</h3>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Illustration Frequency
              </label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option>Minimal (1-2 per chapter)</option>
                <option>Moderate (3-5 per chapter)</option>
                <option>Abundant (6+ per chapter)</option>
              </select>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => navigate('/create/step1')}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => navigate('/create/step3')}
                className="px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue to Cover & Chapters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
