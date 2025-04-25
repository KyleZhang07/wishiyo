
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
              "description": "Create a funny biography that's literally about them - real unforgettable. We'll do the writing, you get the laughs. Features books like Beatboxing Business Blues, Coffee, Corgis, and Quirks, Shakespeare and Syllables, and Homebrew High Jinks.",
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
          <div className="relative z-10 px-[60px] my-[64px] bg-[#FFFAF5] py-[100px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="md:order-2 text-white space-y-6 max-w-[480px]">
                  <h1 className="text-4xl font-serif font-bold px-0 mx-0 md:text-4xl text-slate-800">Create a funny biography that's literally about them - real unforgettable</h1>
                  <p className="text-xl text-slate-800">We'll do the writing, you get the laughs.</p>
                  <Link to="/create/friends/funny-biography/author" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#FF7F50] rounded-sm hover:bg-[#FF7F50]/80 transition-colors">
                    Start
                  </Link>
                </div>
                <div className="md:order-1 hidden md:block">
                  <div className="w-80 h-80 mx-auto rounded-sm overflow-hidden shadow-lg">
                    <img src="/images/showcase/dream-life/dream-life1.png" alt="Personalized Story Book with funny moments" className="w-full h-full object-cover scale-110" />
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
              <p className="text-gray-700">Her story—beats, business, and a whole lot of laughs.</p>
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
              <p className="text-gray-700">All the little things that make him special.</p>
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
              <p className="text-gray-700">Celebrating her love of poetry and teaching.</p>
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
              <p className="text-gray-700">Cheers to his craft beers and adventures gone sideways!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsLanding;
