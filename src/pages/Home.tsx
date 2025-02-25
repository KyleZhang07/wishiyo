import { Link } from 'react-router-dom';
import { ArrowRight, Book, BookOpen, Pencil, Heart, Gift } from 'lucide-react';

const Home = () => {
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-4 md:text-5xl">Personalized books for every occasion</h1>
            <p className="text-xl text-gray-600 mb-8">
              Unputdownable stories, made in minutes.
            </p>
            <Link to="/create/step2" className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors">
              Start Creating <ArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Book Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-baseline">
            <h2 className="text-3xl font-display font-bold">
              Choose Your Story Type
            </h2>
            <div className="text-right">
              <span className="text-gray-500">20 books</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/friends" className="block">
              <div className="bg-white border border-gray-200 overflow-hidden h-full">
                <div className="aspect-square relative">
                  <img src="https://images.unsplash.com/photo-1517022812141-23620dba5c23" alt="Books for Fun" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">Books for Fun</h3>
                  <p className="text-gray-600">Create entertaining stories filled with humor and friendship</p>
                  <p className="mt-4 text-gray-800 font-medium">From $44.99 USD</p>
                </div>
              </div>
            </Link>
            
            <Link to="/love" className="block">
              <div className="bg-white border border-gray-200 overflow-hidden h-full">
                <div className="aspect-square relative">
                  <img src="https://images.unsplash.com/photo-1582562124811-c09040d0a901" alt="Books for Love" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">Books for Love</h3>
                  <p className="text-gray-600">Share your love story in a beautifully crafted book</p>
                  <p className="mt-4 text-gray-800 font-medium">From $44.99 USD</p>
                </div>
              </div>
            </Link>
            
            <Link to="/kids" className="block">
              <div className="bg-white border border-gray-200 overflow-hidden h-full">
                <div className="aspect-square relative">
                  <img src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1" alt="Books for Kids" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">Books for Kids</h3>
                  <p className="text-gray-600">Make learning fun through personalized educational stories</p>
                  <p className="mt-4 text-gray-800 font-medium">From $44.99 USD</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Example Books Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold mb-8">
            Example Books
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(book => (
              <div key={book} className="bg-white border border-gray-200 overflow-hidden">
                <div className="aspect-[3/4] bg-gray-200"></div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">Sample Book {book}</h3>
                  <p className="text-gray-600 mb-4">
                    A beautiful example of what you can create with AI Book Crafter.
                  </p>
                  <p className="text-gray-800 font-medium">From $44.99 USD</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gift Creation Steps Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold mb-12">
            Meaningful gifts, made in minutes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Find a book they'll love</h3>
              <p className="text-gray-600">
                Browse the bookshop for the perfect story
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary flex items-center justify-center mx-auto mb-4">
                <Pencil className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Personalize it with care</h3>
              <p className="text-gray-600">
                Add their name and other little details
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Add a message</h3>
              <p className="text-gray-600">
                We'll print your words on the very first page
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary flex items-center justify-center mx-auto mb-4">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Give a gift to remember</h3>
              <p className="text-gray-600">
                Something they'll want to keep forever
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
