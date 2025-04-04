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
                    <img src="/placeholder.svg" alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-display font-bold text-slate-800 mb-8 text-center">Your Favorite</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group">
              <div className="relative aspect-square bg-white rounded-sm shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Fantasy Autobiography" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fantasy Autobiography</h3>
              <p className="text-gray-600 mb-2">A personalized journey through your dream life</p>
            </div>

            <div className="group">
              <div className="relative aspect-square bg-white rounded-sm shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Love Poems" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Love Poems</h3>
              <p className="text-gray-600 mb-2">Express your love through poetry</p>
            </div>

            <div className="group">
              <div className="relative aspect-square bg-white rounded-sm shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Picture Album" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Picture Album</h3>
              <p className="text-gray-600 mb-2">Capture your special moments</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

export default LoveLanding;
