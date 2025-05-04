import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, ChevronUp, Truck, ShieldCheck, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function Home() {
  const navigate = useNavigate();

  // State to track which FAQ items are open (all closed by default)
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);

  // Toggle FAQ open/close
  const toggleFaq = (index: number) => {
    setOpenFaqs(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Wishiyo | Truly Personalized Story Books & Custom Picture Books</title>
        <meta name="description" content="The only book where every page is truly about them, in just 3 minutes. Personalized story books and picture books that make perfect gifts." />
        <link rel="canonical" href="https://www.wishiyo.com/" />

        {/* WebPage structured data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Wishiyo | Truly Personalized Story Books & Custom Picture Books",
              "description": "The only book where every page is truly about them, in just 3 minutes. Personalized story books and picture books that make perfect gifts. Featuring titles like Beatboxing Business Blues, Coffee, Corgis, and Quirks, Auntie Jasmine's Wonderful Maya, and more.",
              "url": "https://www.wishiyo.com/",
              "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", "p"]
              },
              "mainEntity": {
                "@type": "ItemList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Story Book",
                    "url": "https://www.wishiyo.com/friends"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Picture Book",
                    "url": "https://www.wishiyo.com/love"
                  }
                ]
              }
            }
          `}
        </script>
      </Helmet>
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:py-28 overflow-hidden bg-gradient-to-b from-white via-white to-[#FFE1CE]" style={{ backgroundSize: '100% 200%', backgroundPosition: '0 70%' }}>
        {/* Gradient fade at bottom for smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-[7vh] bg-gradient-to-t from-white to-transparent z-10"></div>

        <div className="container px-4 md:px-6 mx-auto relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Left side - Picture Book */}
            <div className="hidden md:flex justify-center relative h-[500px]">
              {/* Single picture book */}
              <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <img src="/images/hero/illustrated-book1.png" alt="Colorful illustrated picture book with vibrant cover design" className="w-auto h-auto object-contain" style={{ transform: 'scale(1.6)' }} />
              </div>
            </div>

            {/* Center - Text and Buttons */}
            <div className="flex flex-col items-center text-center space-y-8">
              <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter">
                Every Page, Just for Them
              </h1>
              <p className="text-2xl text-gray-500 max-w-[500px]">
                The only book where every page is truly about them, in just 3 minutes.
              </p>
              <div className="flex flex-col items-center gap-8 w-full max-w-[320px]">
                <button
                  onClick={() => navigate('/friends')}
                  className="w-full bg-[#FF6B35] text-white py-3 px-5 rounded-md text-center font-medium text-base hover:bg-[#FF6B35]/90 transition-all duration-300 shadow-sm hover:shadow-md mt-8"
                >
                  Create Story Book
                </button>
                <button
                  onClick={() => navigate('/love')}
                  className="w-full bg-white text-[#FF6B35] border-2 border-[#FF6B35] py-3 px-5 rounded-md text-center font-medium text-base hover:bg-[#FF6B35] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Create Picture Book
                </button>
              </div>
            </div>

            {/* Right side - Story Book */}
            <div className="hidden md:flex justify-center relative h-[500px]">
              {/* Single story book */}
              <div className="absolute" style={{ right: '50%', top: '50%', transform: 'translate(50%, -50%)' }}>
                <picture>
                  <source srcSet="/images/hero/personalized-book1.webp" type="image/webp" />
                  <img 
                    src="/images/hero/personalized-book1.webp" 
                    alt="Personalized story book with custom characters" 
                    className="w-auto h-auto object-contain" 
                    style={{ transform: 'scale(1.6)' }} 
                  />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Icons */}
      <section className="pt-4 pb-4 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center justify-items-center">
            {/* Free Shipping Icon */}
            <div className="flex flex-col items-center">
              <div className="w-[36px] h-[36px] -mt-1 mb-2 text-[#FF6B35]">
                {/* 主题色卡车图标 */}
                <Truck strokeWidth={2.2} className="w-full h-full" />
              </div>
            </div>

            {/* Created in 3 Minutes Icon */}
            <div className="flex flex-col items-center">
              <div className="w-[36px] h-[36px] -mt-1 mb-2 text-[#FF6B35]">
                {/* 主题色时钟图标 */}
                <Clock strokeWidth={2.2} className="w-full h-full" />
              </div>
            </div>

            {/* Quality Guarantee Icon */}
            <div className="flex flex-col items-center">
              <div className="w-[36px] h-[36px] -mt-1 mb-2 text-[#FF6B35]">
                {/* 主题色盾牌对勾图标 */}
                <ShieldCheck strokeWidth={2.2} className="w-full h-full" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center mt-2">
            <div className="text-[13px] font-medium text-gray-700">Free Shipping</div>
            <div className="text-[13px] font-medium text-gray-700">Created in 3 Minutes</div>
            <div className="text-[13px] font-medium text-gray-700">Quality Guarantee</div>
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
                <span className="text-[#FF6B35] group-hover:text-[#FF6B35]/80 inline-flex items-center">
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
                <p className="text-gray-700 mb-4">Draw an imaginary book for them</p>
                <span className="text-[#FF6B35] group-hover:text-[#FF6B35]/80 inline-flex items-center">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mb-4">
                <span className="font-bold text-[#FF6B35]">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Enter your idea</h3>
              <p className="text-gray-600">Tell us about your book concept, characters, and story direction.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mb-4">
                <span className="font-bold text-[#FF6B35]">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Customize your book</h3>
              <p className="text-gray-600">Choose your style, pick illustrations, and personalize every detail.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mb-4">
                <span className="font-bold text-[#FF6B35]">3</span>
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
              <p className="text-gray-700">Her story—beats, business, and a whole lot of laughs.</p>
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
              <p className="text-gray-700">All the little things that make him special.</p>
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
              <p className="text-gray-700">Celebrating her love of poetry and teaching.</p>
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
              <p className="text-gray-700">Cheers to his craft beers and adventures gone sideways!</p>
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
              <p className="text-gray-700">A special story starring Maya and the auntie who adores her.</p>
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
              <p className="text-gray-700">Discovering everyday magic through Mateo's eyes.</p>
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
              <p className="text-gray-700">Charlie's own adventure, told one page at a time.</p>
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
              <p className="text-gray-700">Because Matt deserves his very own love story.</p>
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

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50" aria-labelledby="faq-heading">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 id="faq-heading" className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">
            Frequently Asked Questions
          </h2>

          {/* Schema.org FAQPage structured data */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Why should I choose Wishiyo?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Wishiyo makes it easy to create personalized books in minutes. Simply choose between a Story Book or Picture Book, upload photos, add details about your recipient, and our AI will generate a unique, high-quality book that's printed and shipped directly to you or your recipient."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why are Wishiyo books splendid gifts?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Wishiyo books make perfect gifts for friends, family members, partners, and colleagues. Each book features a completely personalized story or illustrations that belong exclusively to the recipient. They're ideal for birthdays, anniversaries, graduations, retirements, or any special occasion when you want to give something truly meaningful that captures your shared memories or transforms them into the star of their own story."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How long does it take to get the book?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "After placing your order, your book will be printed within 3-5 business days. Standard shipping takes 5-7 business days within the US. Express shipping options are available at checkout for faster delivery."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are the sizes of the books?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our Picture Books measure 8.5\\" x 8.5\\" (21.6cm x 21.6cm) with 24-32 pages of vibrant color illustrations. Story Books are 6\\" x 9\\" (15.2cm x 22.9cm) and typically contain 220-240 pages of personalized content. Both book types are printed on premium paper and professionally bound for durability."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is your return policy?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Since each book is custom-made, we don't accept returns. However, if there's a printing error or damage during shipping, we'll gladly replace your book at no additional cost. Just contact us within 14 days of receiving your order."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I use the book for commercial purposes?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Wishiyo books are created for fun and as gifts only. They are designed for personal enjoyment and to be shared with friends and family. Our books are not intended for commercial use, resale, or distribution beyond personal gifting."
                  }
                }
              ]
            }
          `}} />

          <div className="w-full" role="region" aria-label="Frequently Asked Questions about Wishiyo personalized books">
            {/* FAQ Item 1 */}
            <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
              <button
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
                onClick={() => toggleFaq(0)}
                aria-expanded={openFaqs.includes(0)}
                aria-controls="faq-answer-1"
              >
                <h3 className="text-2xl font-serif font-bold text-[#333333]" itemProp="name">Why should I choose Wishiyo?</h3>
                <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(0) ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {openFaqs.includes(0) && (
                <div id="faq-answer-1" className="pb-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="text-lg text-gray-700" itemProp="text">
                    Wishiyo makes it easy to create personalized books in minutes. Simply choose between a Story Book or Picture Book,
                    upload photos, add details about your recipient, and our AI will generate a unique, high-quality book that's printed
                    and shipped directly to you or your recipient.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 2 */}
            <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
              <button
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
                onClick={() => toggleFaq(1)}
                aria-expanded={openFaqs.includes(1)}
                aria-controls="faq-answer-2"
              >
                <h3 className="text-2xl font-serif font-bold text-[#333333]" itemProp="name">Why are Wishiyo books splendid gifts?</h3>
                <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(1) ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {openFaqs.includes(1) && (
                <div id="faq-answer-2" className="pb-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="text-lg text-gray-700" itemProp="text">
                    Wishiyo books make perfect gifts for friends, family members, partners, and colleagues. Each book features a completely
                    personalized story or illustrations that belong exclusively to the recipient. They're ideal for birthdays, anniversaries,
                    graduations, retirements, or any special occasion when you want to give something truly meaningful that captures your
                    shared memories or transforms them into the star of their own story.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 3 */}
            <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
              <button
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
                onClick={() => toggleFaq(2)}
                aria-expanded={openFaqs.includes(2)}
                aria-controls="faq-answer-3"
              >
                <h3 className="text-2xl font-serif font-bold text-[#333333]" itemProp="name">How long does it take to get the book?</h3>
                <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(2) ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {openFaqs.includes(2) && (
                <div id="faq-answer-3" className="pb-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="text-lg text-gray-700" itemProp="text">
                    After placing your order, your book will be printed within 3-5 business days. Standard shipping takes 5-7 business days
                    within the US. Express shipping options are available at checkout for faster delivery.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 4 */}
            <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
              <button
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
                onClick={() => toggleFaq(3)}
                aria-expanded={openFaqs.includes(3)}
                aria-controls="faq-answer-4"
              >
                <h3 className="text-2xl font-serif font-bold text-[#333333]" itemProp="name">What are the sizes of the books?</h3>
                <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(3) ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {openFaqs.includes(3) && (
                <div id="faq-answer-4" className="pb-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="text-lg text-gray-700" itemProp="text">
                    Our Picture Books measure 8.5" x 8.5" (21.6cm x 21.6cm) with 24-32 pages of vibrant color illustrations.
                    Story Books are 6" x 9" (15.2cm x 22.9cm) and typically contain 220-240 pages of personalized content.
                    Both book types are printed on premium paper and professionally bound for durability.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 5 */}
            <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
              <button
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
                onClick={() => toggleFaq(4)}
                aria-expanded={openFaqs.includes(4)}
                aria-controls="faq-answer-5"
              >
                <h3 className="text-2xl font-serif font-bold text-[#333333]" itemProp="name">What is your return policy?</h3>
                <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(4) ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {openFaqs.includes(4) && (
                <div id="faq-answer-5" className="pb-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="text-lg text-gray-700" itemProp="text">
                    Since each book is custom-made, we don't accept returns. However, if there's a printing error or damage during shipping,
                    we'll gladly replace your book at no additional cost. Just contact us within 14 days of receiving your order.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 6 */}
            <div className="border-b border-gray-200" itemScope itemType="https://schema.org/Question">
              <button
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
                onClick={() => toggleFaq(5)}
                aria-expanded={openFaqs.includes(5)}
                aria-controls="faq-answer-6"
              >
                <h3 className="text-2xl font-serif font-bold text-[#333333]" itemProp="name">Can I use the book for commercial purposes?</h3>
                <ChevronDown className={`h-6 w-6 text-[#FF6B35] transition-transform duration-200 ${openFaqs.includes(5) ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {openFaqs.includes(5) && (
                <div id="faq-answer-6" className="pb-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="text-lg text-gray-700" itemProp="text">
                    No. Wishiyo books are created for fun and as gifts only. They are designed for personal enjoyment and to be shared
                    with friends and family. Our books are not intended for commercial use, resale, or distribution beyond personal gifting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
