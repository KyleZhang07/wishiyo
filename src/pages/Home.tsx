import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Create your own custom AI-generated book
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-[700px]">
              Craft unique stories with the power of AI. Upload photos, add details, and we'll generate
              a personalized book just for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
              <Button asChild className="text-base rounded-full size-fit px-6">
                <Link to="/app">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" asChild className="text-base rounded-full size-fit px-6">
                <Link to="/examples">See Examples</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Book Showcase Section */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            Personalize a bestseller
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Book 1 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">First Mother's Day for Mommy and Me</h3>
              <p className="text-gray-700">Capture that first precious Mother's Day</p>
            </div>

            {/* Book 2 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">I Love Grandma This Much</h3>
              <p className="text-gray-700">A heartwarming story for a special grandma</p>
            </div>

            {/* Book 3 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">When You Were Born</h3>
              <p className="text-gray-700">A story to celebrate a new baby</p>
            </div>

            {/* Book 4 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">I Spy You!</h3>
              <p className="text-gray-700">A personalized search-and-find book for little ones</p>
            </div>
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
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/app">Create Your Book Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
