import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Left side - Picture Book */}
            <div className="hidden md:flex justify-center relative h-[500px]">
              {/* Single picture book with shadow effect */}
              <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%) perspective(800px) rotateY(5deg)', boxShadow: '2px 5px 15px rgba(0,0,0,0.3)' }}>
                <img src="/images/hero/illustrated-book1.png" alt="Colorful illustrated picture book with vibrant cover design" className="w-auto h-auto object-contain rounded-md" style={{ transform: 'scale(1.6)' }} />
              </div>
            </div>

            {/* Center - Text and Buttons */}
            <div className="flex flex-col items-center text-center space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">
                A book made just for them
              </h1>
              <p className="text-xl text-gray-500 max-w-[500px]">
                Turn memories and photos into a keepsake they'll treasure forever.
              </p>
              <div className="flex flex-col items-center gap-8 w-full max-w-[320px]">
                <button
                  onClick={() => navigate('/friends')}
                  className="w-full bg-[#FF6B35] text-white py-3 px-5 rounded-md text-center font-medium text-base hover:bg-[#FF6B35]/90 transition-colors shadow-sm mt-8"
                >
                  Create Story Book
                </button>
                <button
                  onClick={() => navigate('/love')}
                  className="w-full bg-white text-[#FF6B35] border-2 border-[#FF6B35] py-3 px-5 rounded-md text-center font-medium text-base hover:bg-[#FF6B35] hover:text-white transition-colors shadow-sm"
                >
                  Create Picture Book
                </button>
              </div>
            </div>

            {/* Right side - Story Book */}
            <div className="hidden md:flex justify-center relative h-[500px]">
              {/* Single story book with shadow effect */}
              <div className="absolute" style={{ right: '50%', top: '50%', transform: 'translate(50%, -50%) perspective(800px) rotateY(-5deg)', boxShadow: '-2px 5px 15px rgba(0,0,0,0.3)' }}>
                <img src="/images/hero/personalized-book1.png" alt="Personalized story book with custom character and storyline" className="w-auto h-auto object-contain rounded-md" style={{ transform: 'scale(1.6)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pick your book style Section */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-6">
            Pick your book style
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Story Book */}
            <button
              onClick={() => navigate('/friends')}
              className="group text-left"
            >
              <div className="p-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-square w-[66%] mx-auto relative overflow-hidden">
                  {/* Story Book showcase image */}
                  <img
                    src="/images/showcase/personalized-book.jpeg"
                    alt="Woman holding a personalized story book with custom title and character"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold mb-2">Story Book</h3>
                <p className="text-gray-700 mb-4">Write a story just for them</p>
                <span className="text-primary group-hover:text-primary/80 inline-flex items-center">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </div>
            </button>

            {/* For Picture Book */}
            <button
              onClick={() => navigate('/love')}
              className="group text-left"
            >
              <div className="p-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-square w-[66%] mx-auto relative overflow-hidden">
                  {/* Picture Book showcase image */}
                  <img
                    src="/images/showcase/illustrated-book.png"
                    alt="Child holding a colorful illustrated picture book with vibrant artwork"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold mb-2">Picture Book</h3>
                <p className="text-gray-700 mb-4">Colorful illustrations with minimal text</p>
                <span className="text-primary group-hover:text-primary/80 inline-flex items-center">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Enter your idea</h3>
              <p className="text-gray-600">Tell us about your book concept, characters, and story direction.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Customize your book</h3>
              <p className="text-gray-600">Choose your style, pick illustrations, and personalize every detail.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Get your book</h3>
              <p className="text-gray-600">We'll print and ship your finished book directly to your doorstep.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Book Showcase Section - Story Book */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            Story Book showcase
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Book 1 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden">
                <img
                  src="/images/showcase/personalized-books/personalized-book1.png"
                  alt="Beatboxing Business Blues - A personalized story book memoir cover"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Beatboxing Business Blues</h3>
              <p className="text-gray-700">A hilarious tale of entrepreneurial rhythm</p>
            </div>

            {/* Book 2 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden">
                <img
                  src="/images/showcase/personalized-books/personalized-book2.png"
                  alt="Coffee, Corgis, and Quirks - A personalized story book with humorous personal story"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Coffee, Corgis, and Quirks</h3>
              <p className="text-gray-700">Adventures with furry friends and caffeine</p>
            </div>

            {/* Book 3 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden">
                <img
                  src="/images/showcase/personalized-books/personalized-book3.png"
                  alt="Shakespeare and Syllables - A personalized memoir with literary themes"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Shakespeare and Syllables</h3>
              <p className="text-gray-700">Literary wordplay and poetic adventures</p>
            </div>

            {/* Book 4 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden">
                <img
                  src="/images/showcase/personalized-books/personalized-book4.png"
                  alt="Homebrew High Jinks - A personalized story book about brewing adventures"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Homebrew High Jinks</h3>
              <p className="text-gray-700">Craft beer mishaps and hoppy escapades</p>
            </div>
          </div>
        </div>
      </section>

      {/* Picture Book Showcase Section */}
      <section className="py-24 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            Picture Book showcase
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Book 1 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden">
                <img
                  src="/images/showcase/illustrated-books/illustrated-book1.jpeg"
                  alt="Auntie Jasmine's Wonderful Maya - A colorful illustrated children's book"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Auntie Jasmine's Wonderful Maya</h3>
              <p className="text-gray-700">A magical day with a special aunt</p>
            </div>

            {/* Book 2 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden">
                <img
                  src="/images/showcase/illustrated-books/illustrated-book2.jpeg"
                  alt="The Magic in Mateo - A colorful illustrated children's picture book"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">The Magic in Mateo</h3>
              <p className="text-gray-700">Discover the wonder in everyday moments</p>
            </div>

            {/* Book 3 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden">
                <img
                  src="/images/showcase/illustrated-books/illustrated-book3.jpeg"
                  alt="Charlie's Amazing Adventure - A colorful illustrated children's picture book"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Charlie's Amazing Adventure</h3>
              <p className="text-gray-700">Join Charlie on a journey of discovery</p>
            </div>

            {/* Book 4 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden">
                <img
                  src="/images/showcase/illustrated-books/illustrated-book4.jpeg"
                  alt="Matt, I love you! - A heartfelt illustrated children's picture book"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Matt, I love you!</h3>
              <p className="text-gray-700">A heartfelt expression of love and appreciation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            What our customers say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="italic mb-4">"The book we created was absolutely perfect. My daughter loves seeing herself in the story, and the illustrations are beautiful."</p>
              <p className="font-semibold">— Sarah M.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="italic mb-4">"I made a book for my father's birthday about our fishing trips. He got emotional when he saw it. Worth every penny."</p>
              <p className="font-semibold">— Michael J.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="italic mb-4">"The process was so easy and the result exceeded my expectations. This is now our favorite bedtime story book!"</p>
              <p className="font-semibold">— Emma L.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold tracking-tighter mb-4">Ready to create your story?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-[600px] mx-auto">
            Start crafting your personalized book today and create memories that will last a lifetime.
          </p>
          <Button
            size="lg"
            className="rounded-full px-8"
            onClick={() => navigate('/app')}
          >
            Create Your Book Now
          </Button>
        </div>
      </section>
    </div>
  );
}
