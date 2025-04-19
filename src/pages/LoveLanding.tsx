import { Link } from 'react-router-dom';

const LoveLanding = () => {
  return <div className="page-transition">
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF7F50] to-[#FF7F50]/80" />
          <div className="relative z-10 px-[60px] my-[64px] bg-[#FFFAF5] py-[100px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-white space-y-6">
                  <h1 className="text-4xl font-display font-bold px-0 mx-0 md:text-4xl text-slate-800">Dream Life. Magically crafted.</h1>
                  <p className="text-xl text-slate-800">Create a personalized fantasy autobiography that brings your dream life to vivid reality</p>
                  <Link to="/create/love/love-story/character" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#FF7F50] rounded-sm hover:bg-[#FF7F50]/80 transition-colors">
                    Create My Book
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="w-56 h-56 mx-auto rounded-sm overflow-hidden border-4 border-[#FF7F50]/20">
                    <img src="/images/showcase/dream-life/dream-life.png" alt="Dream Life Book" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 md:px-6 mx-auto py-24">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">Picture Book Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Book 1 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Fantasy Autobiography</h3>
              <p className="text-gray-700">A personalized journey through your dream life</p>
            </div>

            {/* Book 2 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Love Poems</h3>
              <p className="text-gray-700">Express your love through poetry</p>
            </div>

            {/* Book 3 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Picture Album</h3>
              <p className="text-gray-700">Capture your special moments</p>
            </div>

            {/* Book 4 */}
            <div className="flex flex-col">
              <div className="bg-[#F0F7FF] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Our Love Story</h3>
              <p className="text-gray-700">A beautiful illustrated journey of your love</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

export default LoveLanding;
