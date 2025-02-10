
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Baby, User } from 'lucide-react';

const Step1 = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bookType, setBookType] = useState<string | null>(null);

  const categories = [
    {
      id: 'friends',
      title: 'For Friends',
      icon: Users,
      description: 'Create a special book for your friends',
      bookTypes: [
        'AI Satire & Fun Manual',
        'Adventure Partner Archives',
        'Friendship Memory Album'
      ]
    },
    {
      id: 'love',
      title: 'For Love',
      icon: Heart,
      description: 'Create a romantic book for your loved one',
      bookTypes: [
        'AI Romantic Picture Book',
        '365 Days Love Calendar',
        'Love Story Quest Book'
      ]
    },
    {
      id: 'kids',
      title: 'For Kids',
      icon: Baby,
      description: 'Create a magical book for children',
      bookTypes: [
        'AI Comic/Picture Book',
        'Coloring Story Book',
        'Pop-up Adventure Book'
      ]
    },
    {
      id: 'you',
      title: 'For You',
      icon: User,
      description: 'Create your personal book',
      bookTypes: [
        'Personal Biography',
        'AI Inspiration Journal',
        'Fashion Portfolio Book'
      ]
    }
  ];

  const renderCategorySelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-6 rounded-xl transition-all duration-200 text-left flex items-start gap-4 ${
              selectedCategory === category.id
                ? 'bg-primary text-white shadow-lg scale-105'
                : 'bg-white hover:bg-primary/5 border border-gray-200'
            }`}
          >
            <div className={`p-3 rounded-lg ${
              selectedCategory === category.id
                ? 'bg-white/20'
                : 'bg-primary/10'
            }`}>
              <Icon className={`w-6 h-6 ${
                selectedCategory === category.id
                  ? 'text-white'
                  : 'text-primary'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
              <p className={`text-sm ${
                selectedCategory === category.id
                  ? 'text-white/80'
                  : 'text-gray-600'
              }`}>
                {category.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderBookTypeSelection = () => {
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to categories
        </button>
        
        <h2 className="text-2xl font-semibold mb-6">Choose Book Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {category.bookTypes.map((type) => (
            <button
              key={type}
              onClick={() => setBookType(type)}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                bookType === type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-primary/50'
              }`}
            >
              <h3 className="font-medium">{type}</h3>
            </button>
          ))}
        </div>

        {bookType && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate('/create/step2')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Continue to Next Step
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-4">
            Let's Start Your Book
          </h1>
          <p className="text-gray-600">
            Choose who you're creating this book for, and we'll help bring your ideas to life.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {!selectedCategory ? renderCategorySelection() : renderBookTypeSelection()}
        </div>
      </div>
    </div>
  );
};

export default Step1;
