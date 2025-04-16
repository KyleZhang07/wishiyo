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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Left side - Illustrated Books */}
            <div className="hidden md:flex justify-center relative h-[400px]">
              {/* Stack of 3 illustrated books - horizontally stacked with overlapping effect and increasing size */}
              <div className="absolute" style={{ left: '0%', top: '60px', zIndex: 1, transform: 'perspective(800px) rotateY(5deg)', boxShadow: '2px 5px 15px rgba(0,0,0,0.3)' }}>
                <img src="/images/hero/illustrated-book1.png" alt="Illustrated Book" className="w-[180px] h-[260px] object-cover rounded-md" />
              </div>
              <div className="absolute" style={{ left: '70px', top: '50px', zIndex: 2, transform: 'perspective(800px) rotateY(5deg)', boxShadow: '2px 5px 15px rgba(0,0,0,0.3)' }}>
                <img src="/images/hero/illustrated-book2.png" alt="Illustrated Book" className="w-[200px] h-[280px] object-cover rounded-md" />
              </div>
              <div className="absolute" style={{ left: '150px', top: '40px', zIndex: 3, transform: 'perspective(800px) rotateY(5deg)', boxShadow: '2px 5px 15px rgba(0,0,0,0.3)' }}>
                <img src="/images/hero/illustrated-book3.png" alt="Illustrated Book" className="w-[220px] h-[300px] object-cover rounded-md" />
              </div>
            </div>

            {/* Center - Text and Buttons */}
            <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                Create your own custom personalized book
              </h1>
              <p className="text-lg text-gray-500 max-w-[450px]">
                Craft unique stories featuring your loved ones. Create beautiful personalized or illustrated books just for you.
              </p>
              <div className="flex flex-col items-center gap-6 mt-10 w-full max-w-[320px]">
                <Link to="/friends" className="w-full">
                  <div className="bg-[#FF6B35] text-white py-3 px-5 rounded-md text-center font-medium text-base hover:bg-[#FF6B35]/90 transition-colors shadow-sm">
                    Create Personalized Book
                  </div>
                </Link>
                <Link to="/love" className="w-full">
                  <div className="bg-[#FF6B35] text-white py-3 px-5 rounded-md text-center font-medium text-base hover:bg-[#FF6B35]/90 transition-colors shadow-sm">
                    Create Illustrated Book
                  </div>
                </Link>
              </div>
            </div>

            {/* Right side - Personalized Books */}
            <div className="hidden md:flex justify-center relative h-[400px]">
              {/* Stack of 3 personalized books - horizontally stacked with overlapping effect and increasing size */}
              <div className="absolute" style={{ right: '0%', top: '60px', zIndex: 1, transform: 'perspective(800px) rotateY(-5deg)', boxShadow: '-2px 5px 15px rgba(0,0,0,0.3)' }}>
                <img src="/images/hero/personalized-book1.png" alt="Personalized Book" className="w-[180px] h-[260px] object-cover rounded-md" />
              </div>
              <div className="absolute" style={{ right: '70px', top: '50px', zIndex: 2, transform: 'perspective(800px) rotateY(-5deg)', boxShadow: '-2px 5px 15px rgba(0,0,0,0.3)' }}>
                <img src="/images/hero/personalized-book2.png" alt="Personalized Book" className="w-[200px] h-[280px] object-cover rounded-md" />
              </div>
              <div className="absolute" style={{ right: '150px', top: '40px', zIndex: 3, transform: 'perspective(800px) rotateY(-5deg)', boxShadow: '-2px 5px 15px rgba(0,0,0,0.3)' }}>
                <img src="/images/hero/personalized-book3.png" alt="Personalized Book" className="w-[220px] h-[300px] object-cover rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who are you buying for? Section */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            Who are you buying for?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Personalized Book */}
            <div className="p-8">
              <div className="mb-6 h-[360px] flex items-center justify-center">
                {/* Placeholder for image - you can replace this with an actual image */}
                <div className="bg-gray-200 w-full h-full rounded-lg"></div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Personalized Book</h3>
              <p className="text-gray-700 mb-4">Create a unique story featuring your loved ones as the main characters</p>
              <Link to="/friends" className="text-primary hover:text-primary/80 inline-flex items-center">
                Explore <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* For Illustrated Book */}
            <div className="p-8">
              <div className="mb-6 h-[360px] flex items-center justify-center">
                {/* Placeholder for image - you can replace this with an actual image */}
                <div className="bg-gray-200 w-full h-full rounded-lg"></div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Illustrated Book</h3>
              <p className="text-gray-700 mb-4">Beautiful illustrated stories with your loved ones' photos integrated into the artwork</p>
              <Link to="/love" className="text-primary hover:text-primary/80 inline-flex items-center">
                Explore <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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

      {/* Book Showcase Section - Personalized Bestseller */}
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

      {/* Illustrated Book Showcase Section */}
      <section className="py-24 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            Illustrated Book showcase
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Book 1 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Our Love Story</h3>
              <p className="text-gray-700">A beautiful illustrated journey of your love</p>
            </div>

            {/* Book 2 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Magical Adventure</h3>
              <p className="text-gray-700">Turn your child into the hero of a magical tale</p>
            </div>

            {/* Book 3 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Friendship Chronicles</h3>
              <p className="text-gray-700">Celebrate special friendships with a custom story</p>
            </div>

            {/* Book 4 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Family Adventures</h3>
              <p className="text-gray-700">Turn your family photos into an illustrated storybook</p>
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
