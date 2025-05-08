import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const LoveLanding = () => {
  return <div className="page-transition">
      <Helmet>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "Picture Book",
              "image": "https://www.wishiyo.com/images/showcase/illustrated-books/illustrated-book1.jpeg",
              "description": "Get a picture book where every page features their face - created instantly Any dream, anywhere—they're the star. Features books like Auntie Jasmine's Wonderful Maya, The Magic in Mateo, Charlie's Amazing Adventure, and Matt, I Love You!",
              "brand": {
                "@type": "Brand",
                "name": "Wishiyo"
              },
              "offers": {
                "@type": "Offer",
                "url": "https://www.wishiyo.com/love",
                "priceCurrency": "USD",
                "price": "59",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "42"
              }
            }
          `}
        </script>
      </Helmet>
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF7F50] to-[#FF7F50]/80" />
          <div className="relative z-10 px-[60px] my-[50px] bg-[#F6FAFF] py-[75px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="md:order-2 text-white space-y-6 max-w-[480px]">
                  <h1 className="text-4xl font-serif font-bold px-0 mx-0 md:text-4xl text-slate-800">Get a picture book where every page features their face - created instantly</h1>
                  <p className="text-xl text-slate-800">Any dream, anywhere—they're the star.</p>
                  <Link to="/create/love/love-story/character" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#FF7F50] rounded-sm hover:bg-[#FF7F50]/80 transition-colors">
                    Start Creating
                  </Link>
                </div>
                <div className="md:order-1 hidden md:block">
                  <div className="w-[420px] h-96 mx-auto rounded-sm overflow-hidden shadow-lg transform -translate-x-4 translate-y-2">
                    <img src="/images/showcase/dream-life/dream-life.webp" alt="Colorful illustrated picture book with fairy tale characters" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 md:px-6 mx-auto pt-12 pb-24">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">Picture Book Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Book 1 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/showcase/illustrated-books/illustrated-book1.jpeg"
                  alt="Auntie Jasmine's Wonderful Maya - A colorful illustrated children's book"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Auntie Jasmine's Wonderful Maya</h3>
              <p className="text-gray-700">"I love my book with all the pretty pictures! Thank you Auntie!"
                <span className="block text-right pr-8">- Maya</span>
              </p>
            </div>

            {/* Book 2 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/showcase/illustrated-books/illustrated-book2.jpeg"
                  alt="The Magic in Mateo - A colorful illustrated children's picture book"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">The Magic in Mateo</h3>
              <p className="text-gray-700">"This book is so cool! I can see magic everywhere now!"
                <span className="block text-right pr-8">- Mateo</span>
              </p>
            </div>

            {/* Book 3 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/showcase/illustrated-books/illustrated-book3.jpeg"
                  alt="Charlie's Amazing Adventure - A colorful illustrated children's picture book"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Charlie's Amazing Adventure</h3>
              <p className="text-gray-700">"Wow! I'm the hero in my very own adventure story!"
                <span className="block text-right pr-8">- Charlie</span>
              </p>
            </div>

            {/* Book 4 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/showcase/illustrated-books/illustrated-book4.jpeg"
                  alt="Matt, I love you! - A heartfelt illustrated children's picture book"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Matt, I love you!</h3>
              <p className="text-gray-700">"This is the best gift ever. I'll read it every night."
                <span className="block text-right pr-8">- Matt</span>
              </p>
            </div>
          </div>
        </div>

        {/* Showcase Section with Zigzag Edge */}
        <section className="relative overflow-hidden mt-24 mb-16" style={{height: "500px"}}>
          {/* 使用flex布局确保锯齿与图片相对位置固定 */}
          <div className="flex h-full">
            {/* 右侧图片区域 */}
            <div className="relative w-full md:w-[65%] bg-white z-0 order-2 md:order-1">
              <img 
                src="/images/showcase/dream-life/picture-surface.webp" 
                alt="Family enjoying a personalized picture book together" 
                className="h-full w-full object-cover shadow-lg" 
              />
            </div>

            {/* 左侧内容区域 - 文字和背景 */}
            <div className="relative w-full md:w-[35%] bg-[#F6FAFF] z-10 order-1 md:order-2">
              {/* 锯齿形连接 - 放在文字区域的左边缘，颜色为文字区域背景色 */}
              <div className="absolute left-0 top-0 bottom-0 w-[60px] z-20 transform -translate-x-1/2">
                <svg viewBox="0 0 30 200" preserveAspectRatio="none" className="h-full w-full">
                  <path d="M0,0 L15,16.7 L0,33.4 L15,50.1 L0,66.8 L15,83.5 L0,100.2 L15,116.9 L0,133.6 L15,150.3 L0,167 L15,183.7 L0,200 L30,200 L15,183.7 L30,167 L15,150.3 L30,133.6 L15,116.9 L30,100.2 L15,83.5 L30,66.8 L15,50.1 L30,33.4 L15,16.7 L30,0 L0,0 Z" fill="#F6FAFF" />
                </svg>
              </div>
              
              <div className="flex flex-col justify-center h-full space-y-6 px-4 md:px-6 lg:px-12 xl:px-16 relative z-20">
                <div className="max-w-[360px] mx-auto">
                  <h2 className="text-4xl font-serif font-bold tracking-tighter">
                    Make them the star
                  </h2>
                  <p className="text-lg text-gray-700 mt-6">
                    Create a magical world where they're in every picture!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>;
};

export default LoveLanding;
