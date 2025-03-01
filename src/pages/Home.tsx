import { Link } from 'react-router-dom';
import { ArrowRight, Book, BookOpen, Pencil, Heart, Gift, Sparkles } from 'lucide-react';

const Home = () => {
  return <div className="page-transition">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-primary/10 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=2574')] bg-cover opacity-10"></div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mb-6 inline-block">
              <span className="px-3 py-1 rounded-sm bg-primary/20 text-primary text-sm font-medium">AI-Powered Personalized Books</span>
            </div>
            <h1 className="text-4xl font-display font-bold mb-6 slide-in md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Turn memories into magical stories
            </h1>
            <p className="text-xl text-gray-600 mb-8 slide-in max-w-xl mx-auto">
              Personalized Books for Every Special Bond — Create a unique gift that will be cherished forever
            </p>
            <div className="flex flex-col justify-center items-center gap-5 mt-10">
              <Link to="/friends" className="w-72 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-primary rounded-sm hover:bg-primary/90 transition-all hover:shadow-lg shadow-primary/20 group">
                Create Books for Fun <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/love" className="w-72 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-primary/80 backdrop-blur-sm rounded-sm hover:bg-primary/70 transition-all hover:shadow-lg shadow-primary/20 group whitespace-nowrap">
                Create Books for Fantasy <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Book Categories Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-12">
            <span className="h-px bg-gray-200 w-12 mr-4"></span>
            <h2 className="text-3xl font-display font-bold text-center">
              Choose Your Story Type
            </h2>
            <span className="h-px bg-gray-200 w-12 ml-4"></span>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-10 max-w-4xl mx-auto">
            <Link to="/friends" className="group flex-1 max-w-[340px] block hover:scale-105 transition-all duration-300">
              <div className="glass-card h-full rounded-sm shadow-lg hover:shadow-xl overflow-hidden border border-gray-100">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1517022812141-23620dba5c23" alt="Books for Fun" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                <div className="p-8">
                  <div className="w-10 h-10 mb-4 rounded-sm bg-primary/10 flex items-center justify-center">
                    <Book className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-display font-semibold mb-4 group-hover:text-primary transition-colors">Books for Fun</h3>
                  <p className="text-gray-600 mb-4">Create entertaining stories filled with humor and friendship</p>
                  <div className="flex items-center text-primary font-medium">
                    <span>Explore</span>
                    <ArrowRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
            
            <Link to="/love" className="group flex-1 max-w-[340px] block hover:scale-105 transition-all duration-300">
              <div className="glass-card h-full rounded-sm shadow-lg hover:shadow-xl overflow-hidden border border-gray-100">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1582562124811-c09040d0a901" alt="Books for Love" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                <div className="p-8">
                  <div className="w-10 h-10 mb-4 rounded-sm bg-primary/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-display font-semibold mb-4 group-hover:text-primary transition-colors">Books for Fantasy</h3>
                  <p className="text-gray-600 mb-4">Share your love story in a beautifully crafted book</p>
                  <div className="flex items-center text-primary font-medium">
                    <span>Explore</span>
                    <ArrowRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Example Books Section */}
      <section className="py-24 bg-gray-50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-center mb-12">
            <span className="h-px bg-gray-200 w-12 mr-4"></span>
            <h2 className="text-3xl font-display font-bold text-center">
              Example Books
            </h2>
            <span className="h-px bg-gray-200 w-12 ml-4"></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map(book => (
              <div key={book} className="glass-card rounded-sm shadow-lg hover:shadow-xl overflow-hidden transition-all hover:scale-105 border border-gray-100 duration-300">
                <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/5 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-primary/40" />
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-display font-semibold mb-2">Sample Book {book}</h3>
                  <p className="text-gray-600 mb-4">
                    A beautiful example of what you can create with AI Book Crafter.
                  </p>
                  <button className="text-primary font-medium hover:underline inline-flex items-center">
                    Learn More <ArrowRight className="ml-1 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gift Creation Steps Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-16">
            <span className="h-px bg-gray-200 w-12 mr-4"></span>
            <h2 className="text-3xl font-display font-bold text-center">
              Meaningful gifts, made in minutes
            </h2>
            <span className="h-px bg-gray-200 w-12 ml-4"></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-sm flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Find a book they'll love</h3>
              <p className="text-gray-600">
                Browse the bookshop for the perfect story
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 clip-hexagon flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-300">
                <Pencil className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Personalize it with care</h3>
              <p className="text-gray-600">
                Add their name and other little details
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-sm flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Add a message</h3>
              <p className="text-gray-600">
                We'll print your words on the very first page
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 clip-gift flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-300">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">Give a gift to remember</h3>
              <p className="text-gray-600">
                Something they'll want to keep forever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold mb-6">Ready to create your unique story?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto">
              Start your journey today and create a personalized book that will be cherished for years to come.
            </p>
            <Link to="/create/step2" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-primary rounded-sm hover:bg-primary/90 transition-all hover:shadow-lg shadow-primary/20 group">
              Get Started <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>;
};

export default Home;
