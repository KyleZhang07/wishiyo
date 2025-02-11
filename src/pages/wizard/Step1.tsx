
import { useNavigate, useSearchParams } from 'react-router-dom';

interface BookType {
  id: string;
  title: string;
  description: string;
  buttonText: string;
}

const bookTypes: Record<string, BookType[]> = {
  friends: [
    {
      id: 'friendship',
      title: "Celebrate Your Friendship Journey",
      description: "Transform your photos and memories into an amazing illustrated book celebrating your special bond",
      buttonText: "Create My Friend's Book"
    }
  ],
  love: [
    {
      id: 'romantic',
      title: "My Reasons Why I Adore You",
      description: "Transform their photos into an amazing illustrated book celebrating them",
      buttonText: "Create My Partner's Book"
    }
  ],
  kids: [
    {
      id: 'adventure',
      title: "Your Child's Magical Adventure",
      description: "Transform your child's photos into an enchanting storybook where they become the hero",
      buttonText: "Create My Child's Book"
    }
  ]
};

const Step1 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  // If type is not valid, redirect to home
  if (!type || !bookTypes[type]) {
    navigate('/');
    return null;
  }

  const handleBookTypeSelect = (bookType: string) => {
    navigate('/create/step2', { state: { type, bookType } });
  };

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-6xl mx-auto">
        {bookTypes[type].map((bookType) => (
          <div key={bookType.id} className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90" />
              <div className="relative z-10 px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="text-white space-y-6">
                    <h1 className="text-4xl md:text-5xl font-display font-bold">
                      {bookType.title}
                    </h1>
                    <p className="text-xl text-white/90">
                      {bookType.description}
                    </p>
                    <button
                      onClick={() => handleBookTypeSelect(bookType.id)}
                      className="inline-flex items-center px-8 py-4 text-lg font-medium text-primary bg-white rounded-full hover:bg-gray-50 transition-colors"
                    >
                      {bookType.buttonText}
                    </button>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-white/20">
                      <img
                        src={`/lovable-uploads/placeholder-${type}.jpg`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step1;
