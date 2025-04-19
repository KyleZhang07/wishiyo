import { Link } from 'react-router-dom';

const LoveLanding = () => {
  return <div className="page-transition">
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF7F50] to-[#FF7F50]/80" />
          <div className="relative z-10 px-[60px] my-[64px] bg-[#F6FAFF] py-[100px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="md:order-2 text-white space-y-6 max-w-[480px]">
                  <h1 className="text-4xl font-serif font-bold px-0 mx-0 md:text-4xl text-slate-800">Turn them into a fairy-tale hero, page by page like an animation</h1>
                  <p className="text-xl text-slate-800">Upload a few photos and instantly create full-color illustrations</p>
                  <Link to="/create/love/love-story/character" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#FF7F50] rounded-sm hover:bg-[#FF7F50]/80 transition-colors">
                    Start Drawing
                  </Link>
                </div>
                <div className="md:order-1 hidden md:block">
                  <div className="w-80 h-80 mx-auto rounded-sm overflow-hidden shadow-lg transform translate-x-4 translate-y-2">
                    <img src="/images/showcase/dream-life/dream-life.png" alt="Colorful illustrated picture book with fairy tale characters" className="w-full h-full object-cover" />
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
              <p className="text-gray-700">A magical day with a special aunt</p>
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
              <p className="text-gray-700">Discover the wonder in everyday moments</p>
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
              <p className="text-gray-700">Join Charlie on a journey of discovery</p>
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
              <p className="text-gray-700">A heartfelt expression of love and appreciation</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

export default LoveLanding;
