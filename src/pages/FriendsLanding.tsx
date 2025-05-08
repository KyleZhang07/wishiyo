import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const FriendsLanding = () => {
  return (
    <div className="page-transition">
      <Helmet>
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "Funny Biography Book",
              "image": "https://www.wishiyo.com/images/showcase/personalized-books/personalized-book1.png",
              "description": "Create a funny biography that's literally about them - really unforgettable. We'll do the writing, you get the laughs. Features books like Beatboxing Business Blues, Coffee, Corgis, and Quirks, Shakespeare and Syllables, and Homebrew High Jinks.",
              "brand": {
                "@type": "Brand",
                "name": "Wishiyo"
              },
              "offers": {
                "@type": "Offer",
                "url": "https://www.wishiyo.com/friends",
                "priceCurrency": "USD",
                "price": "49",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "37"
              }
            }
          `}
        </script>
      </Helmet>
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF7F50] to-[#FF7F50]/80" />
          <div className="relative z-10 px-[60px] my-[50px] bg-[#FFFAF5] py-[75px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="md:order-2 text-white space-y-6 max-w-[480px]">
                  <h1 className="text-4xl font-serif font-bold px-0 mx-0 md:text-4xl text-slate-800">Create a funny biography that's literally about them - really unforgettable</h1>
                  <p className="text-xl text-slate-800">We'll do the writing, you get the laughs.</p>
                  <Link to="/create/friends/funny-biography/author" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#FF7F50] rounded-sm hover:bg-[#FF7F50]/80 transition-colors">
                    Start Creating
                  </Link>
                </div>
                <div className="md:order-1 hidden md:block">
                  <div className="w-[420px] h-96 mx-auto rounded-sm overflow-hidden shadow-lg transform -translate-x-4">
                    <img src="/images/showcase/dream-life/dream-life1.webp" alt="Personalized Story Book with funny moments" className="w-full h-full object-cover object-center scale-110" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 md:px-6 mx-auto pt-12 pb-24">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">Story Book Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Book 1 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/showcase/personalized-books/personalized-book1.png"
                  alt="Beatboxing Business Blues - A personalized story book memoir cover"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Beatboxing Business Blues</h3>
              <p className="text-gray-700">"This book captured my personality perfectly! Best gift ever!"
                <span className="block text-right pr-8">- Zuri</span>
              </p>
            </div>

            {/* Book 2 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/showcase/personalized-books/personalized-book2.png"
                  alt="Coffee, Corgis, and Quirks - A personalized story book with humorous personal story"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Coffee, Corgis, and Quirks</h3>
              <p className="text-gray-700">"I laughed and cried reading this. So thoughtful and unique!"
                <span className="block text-right pr-8">- Adrian</span>
              </p>
            </div>

            {/* Book 3 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/showcase/personalized-books/personalized-book3.png"
                  alt="Shakespeare and Syllables - A personalized memoir with literary themes"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Shakespeare and Syllables</h3>
              <p className="text-gray-700">"A beautiful tribute to my passion. I'll treasure it forever!"
                <span className="block text-right pr-8">- Ellie</span>
              </p>
            </div>

            {/* Book 4 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] rounded-lg mb-4 aspect-[3/4] w-[85%] mx-auto relative overflow-hidden shadow-md transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/showcase/personalized-books/personalized-book4.png"
                  alt="Homebrew High Jinks - A personalized story book about brewing adventures"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">Homebrew High Jinks</h3>
              <p className="text-gray-700">"My brewing adventures in book form! Such a creative surprise!"
                <span className="block text-right pr-8">- Ethan</span>
              </p>
            </div>
          </div>
        </div>

        {/* Showcase Section with Zigzag Edge */}
        <section className="relative overflow-hidden mt-12 mb-16" style={{height: "500px"}}>
          {/* 使用flex布局确保锯齿与图片相对位置固定 */}
          <div className="flex h-full">
            {/* 左侧内容区域 - 文字和背景 */}
            <div className="relative w-full md:w-[35%] bg-[#FFFAF5] z-10">
              <div className="flex flex-col justify-center h-full space-y-6 px-4 md:px-6 lg:px-12 xl:px-16 relative z-20">
                <div className="max-w-[360px] mx-auto">
                  <h2 className="text-4xl font-serif font-bold tracking-tighter">
                    Celebrate their story
                  </h2>
                  <p className="text-lg text-gray-700 mt-6">
                    Turn their unique personality into a gift they'll never forget!
                  </p>
                </div>
              </div>
              
              {/* 锯齿形连接 - 放在左侧区域的右边缘 */}
              <div className="absolute right-0 top-0 bottom-0 w-[60px] z-20 transform translate-x-1/2">
                <svg viewBox="0 0 30 200" preserveAspectRatio="none" className="h-full w-full">
                  <path d="M0,0 L15,16.7 L0,33.4 L15,50.1 L0,66.8 L15,83.5 L0,100.2 L15,116.9 L0,133.6 L15,150.3 L0,167 L15,183.7 L0,200 L30,200 L15,183.7 L30,167 L15,150.3 L30,133.6 L15,116.9 L30,100.2 L15,83.5 L30,66.8 L15,50.1 L30,33.4 L15,16.7 L30,0 L0,0 Z" fill="#FFFAF5" />
                </svg>
              </div>
            </div>

            {/* 右侧图片区域 */}
            <div className="relative w-full md:w-[65%] bg-white z-0">
              <img 
                src="/images/showcase/dream-life/story-surface.webp" 
                alt="Friends enjoying a personalized story book together" 
                className="h-full w-full object-cover shadow-lg" 
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FriendsLanding;
