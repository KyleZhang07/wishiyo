
import { Link } from 'react-router-dom';

const FantasyLanding = () => {
  return <div className="page-transition">
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500" />
          <div className="relative z-10 px-[60px] my-[64px] bg-red-50 py-[100px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-white space-y-6">
                  <h1 className="text-4xl font-display font-bold px-0 mx-0 md:text-4xl text-slate-800">Fantasy Story. Magically crafted.</h1>
                  <p className="text-xl text-slate-800">Create a magical book that brings your dreams to life</p>
                  <Link to="/create/fantasy/author" className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-red-400 rounded-full hover:bg-red-500 transition-colors">
                    Choose My Book
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-red-100">
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
              <div className="relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Fantasy Story" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fantasy Story</h3>
              <p className="text-gray-600 mb-2">A magical journey through imagination</p>
            </div>

            <div className="group">
              <div className="relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Romantic Tale" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Romantic Tale</h3>
              <p className="text-gray-600 mb-2">Express your feelings through magical stories</p>
            </div>

            <div className="group">
              <div className="relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Dream Book" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dream Book</h3>
              <p className="text-gray-600 mb-2">Turn your dreams into beautiful stories</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

export default FantasyLanding;
