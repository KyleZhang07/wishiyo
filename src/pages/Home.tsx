import { Link } from 'react-router-dom';
import { ArrowRight, Book, Wand2, Settings, Heart, Users, Baby, User } from 'lucide-react';

const Home = () => {
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 slide-in">
              Create Your Book with AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 slide-in">
              Transform your ideas into beautifully crafted books using artificial intelligence.
            </p>
            <Link
              to="/create/step1"
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Creating <ArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Who are you buying for? Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Who are you buying for?
          </h2>
          <div className="flex justify-center items-center gap-8">
            <Link to="/create/step1" className="group">
              <div className="glass-card p-6 rounded-2xl text-center transition-transform hover:scale-105">
                <Users className="w-12 h-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-semibold">For Friends</h3>
              </div>
            </Link>
            <Link to="/create/step1" className="group">
              <div className="glass-card p-6 rounded-2xl text-center transition-transform hover:scale-105">
                <Heart className="w-12 h-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-semibold">For Love</h3>
              </div>
            </Link>
            <Link to="/create/step1" className="group">
              <div className="glass-card p-6 rounded-2xl text-center transition-transform hover:scale-105">
                <Baby className="w-12 h-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-semibold">For Kids</h3>
              </div>
            </Link>
            <Link to="/create/step1" className="group">
              <div className="glass-card p-6 rounded-2xl text-center transition-transform hover:scale-105">
                <User className="w-12 h-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-semibold">For You</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Why Choose AI Book Crafter?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-6 rounded-2xl">
              <Wand2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered Writing</h3>
              <p className="text-gray-600">
                Let AI help you create engaging content based on your ideas and preferences.
              </p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <Settings className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Customizable Design</h3>
              <p className="text-gray-600">
                Choose from beautiful templates and customize every aspect of your book.
              </p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <Book className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Professional Quality</h3>
              <p className="text-gray-600">
                Get professionally formatted books ready for sharing or publishing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example Books Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Example Books
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((book) => (
              <div key={book} className="glass-card rounded-2xl overflow-hidden transition-transform hover:scale-105">
                <div className="aspect-[3/4] bg-gray-200"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Sample Book {book}</h3>
                  <p className="text-gray-600 mb-4">
                    A beautiful example of what you can create with AI Book Crafter.
                  </p>
                  <button className="text-primary font-medium hover:underline">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
