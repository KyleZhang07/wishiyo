
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Baby, User, ArrowRight } from 'lucide-react';

const Step1 = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBookType, setSelectedBookType] = useState<string | null>(null);

  const categories = [
    {
      id: 'friends',
      title: 'For Friends',
      icon: Users,
      description: 'Create a special book for your friends',
      bookTypes: [
        {
          title: 'AI Satire & Fun Manual',
          description: 'A humorous take on your friendship',
        },
        {
          title: 'Adventure Partner Archives',
          description: 'Document your shared adventures',
        },
        {
          title: 'Friendship Memory Album',
          description: 'Capture your best moments together',
        }
      ]
    },
    {
      id: 'love',
      title: 'For Love',
      icon: Heart,
      description: 'Create a romantic book for your loved one',
      bookTypes: [
        {
          title: 'AI Romantic Picture Book',
          description: 'A beautiful love story with AI-generated illustrations',
        },
        {
          title: '365 Days Love Calendar',
          description: 'Document your love story day by day',
        },
        {
          title: 'Love Story Quest Book',
          description: 'An interactive journey through your romance',
        }
      ]
    },
    {
      id: 'kids',
      title: 'For Kids',
      icon: Baby,
      description: 'Create a magical book for children',
      bookTypes: [
        {
          title: 'AI Comic/Picture Book',
          description: 'A fun illustrated story for children',
        },
        {
          title: 'Coloring Story Book',
          description: 'Interactive coloring book with a story',
        },
        {
          title: 'Pop-up Adventure Book',
          description: 'An engaging 3D story experience',
        }
      ]
    },
    {
      id: 'you',
      title: 'For You',
      icon: User,
      description: 'Create your personal book',
      bookTypes: [
        {
          title: 'Personal Biography',
          description: 'Tell your life story',
        },
        {
          title: 'AI Inspiration Journal',
          description: 'A motivational journey just for you',
        },
        {
          title: 'Fashion Portfolio Book',
          description: 'Showcase your style and creativity',
        }
      ]
    }
  ];

  const handleContinue = () => {
    navigate('/create/step2');
  };

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-4">
            Choose Your Book Category
          </h1>
          <p className="text-gray-600">
            Select who you're creating this book for, and we'll help bring your ideas to life.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <div key={category.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedBookType(null);
                    }}
                    className={`w-full p-6 rounded-xl transition-all duration-200 text-left flex items-start gap-4 ${
                      isSelected
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white hover:bg-primary/5 border border-gray-200'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${
                      isSelected ? 'bg-white/20' : 'bg-primary/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected ? 'text-white' : 'text-primary'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
                      <p className={`text-sm ${
                        isSelected ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        {category.description}
                      </p>
                    </div>
                  </button>

                  {isSelected && (
                    <div className="mt-4 space-y-3">
                      {category.bookTypes.map((bookType) => (
                        <button
                          key={bookType.title}
                          onClick={() => setSelectedBookType(bookType.title)}
                          className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                            selectedBookType === bookType.title
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          <h4 className={`font-medium mb-1 ${
                            selectedBookType === bookType.title ? 'text-primary' : ''
                          }`}>
                            {bookType.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {bookType.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedBookType && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleContinue}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue to Next Step <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step1;
