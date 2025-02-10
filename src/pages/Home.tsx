
import { Link } from 'react-router-dom';
import { ArrowRight, Book, BookOpen, Pencil, Heart, Gift } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Home = () => {
  const carouselItems = [
    {
      title: "Create Stories for Friends",
      description: "Transform your friendship moments into beautifully crafted books.",
      image: "https://images.unsplash.com/photo-1517022812141-23620dba5c23",
      link: "/create/step1?type=friends"
    },
    {
      title: "Express Your Love",
      description: "Turn your love story into a timeless keepsake.",
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
      link: "/create/step1?type=love"
    },
    {
      title: "Inspire Kids",
      description: "Create magical stories that will spark young imaginations.",
      image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1",
      link: "/create/step1?type=kids"
    },
    {
      title: "Your Personal Story",
      description: "Write your own journey in a uniquely crafted book.",
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
      link: "/create/step1?type=you"
    }
  ];

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {carouselItems.map((item, index) => (
                <CarouselItem key={index}>
                  <div className="text-center flex flex-col items-center">
                    <div className="relative w-full max-w-2xl mx-auto mb-8 rounded-2xl overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-[300px] object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white slide-in">
                          {item.title}
                        </h1>
                      </div>
                    </div>
                    <p className="text-xl text-gray-600 mb-8 slide-in max-w-2xl">
                      {item.description}
                    </p>
                    <Link
                      to={item.link}
                      className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Start Creating <ArrowRight className="ml-2" />
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* Who are you buying for? Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Who are you buying for?
          </h2>
          <div className="flex justify-center items-stretch gap-8">
            <Link to="/create/step1" className="group flex-1 max-w-[280px]">
              <div className="glass-card h-full rounded-2xl overflow-hidden transition-transform hover:scale-105">
                <div className="aspect-[4/3] relative">
                  <img 
                    src="https://images.unsplash.com/photo-1517022812141-23620dba5c23" 
                    alt="For Friends" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold">For Friends</h3>
                </div>
              </div>
            </Link>
            
            <Link to="/create/step1" className="group flex-1 max-w-[280px]">
              <div className="glass-card h-full rounded-2xl overflow-hidden transition-transform hover:scale-105">
                <div className="aspect-[4/3] relative">
                  <img 
                    src="https://images.unsplash.com/photo-1582562124811-c09040d0a901" 
                    alt="For Love" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold">For Love</h3>
                </div>
              </div>
            </Link>
            
            <Link to="/create/step1" className="group flex-1 max-w-[280px]">
              <div className="glass-card h-full rounded-2xl overflow-hidden transition-transform hover:scale-105">
                <div className="aspect-[4/3] relative">
                  <img 
                    src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1" 
                    alt="For Kids" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold">For Kids</h3>
                </div>
              </div>
            </Link>
            
            <Link to="/create/step1" className="group flex-1 max-w-[280px]">
              <div className="glass-card h-full rounded-2xl overflow-hidden transition-transform hover:scale-105">
                <div className="aspect-[4/3] relative">
                  <img 
                    src="https://images.unsplash.com/photo-1721322800607-8c38375eef04" 
                    alt="For You" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold">For You</h3>
                </div>
              </div>
            </Link>
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

      {/* Gift Creation Steps Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Meaningful gifts, made in minutes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Find a book they'll love</h3>
              <p className="text-gray-600">
                Browse the bookshop for the perfect story
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-primary clip-hexagon flex items-center justify-center mx-auto mb-4">
                <Pencil className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalize it with care</h3>
              <p className="text-gray-600">
                Add their name and other little details
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Add a message</h3>
              <p className="text-gray-600">
                We'll print your words on the very first page
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-primary clip-gift flex items-center justify-center mx-auto mb-4">
                <Gift className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Give a gift to remember</h3>
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
