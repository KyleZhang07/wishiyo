
import { Link } from 'react-router-dom';

const FriendsLanding = () => {
  return (
    <div className="page-transition">
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="relative z-10 px-[60px] my-[64px] bg-amber-50 py-[100px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-white space-y-6">
                  <h1 className="text-4xl font-display font-bold px-0 mx-0 md:text-4xl text-slate-800">Hilarious moment. Presented by you.</h1>
                  <p className="text-xl text-slate-800">Use Wishika to give your friends a special book just for them</p>
                  <a href="#book-types" className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-amber-400 rounded-full hover:bg-amber-500 transition-colors">
                    Choose My Book
                  </a>
                </div>
                <div className="hidden md:block">
                  <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-amber-100">
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
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Funny Biography" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Funny Biography</h3>
              <p className="text-gray-600 mb-2">Create a hilarious book full of funny moments and stories</p>
              
              <Link to="/create/friends/funny-biography/author" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-amber-500 bg-white border border-amber-400 rounded-full hover:bg-amber-400 hover:text-white transition-colors">
                Start Create
              </Link>
            </div>

            <div className="group">
              <div className="relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Wild Fantasy" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Wild Fantasy</h3>
              <p className="text-gray-600 mb-2">Turn your friendship into an epic fantasy adventure</p>
              
              <Link to="/create/friends/wild-fantasy/author" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-amber-500 bg-white border border-amber-400 rounded-full hover:bg-amber-400 hover:text-white transition-colors">
                Start Create
              </Link>
            </div>

            <div className="group">
              <div className="relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Prank Book" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Prank Book</h3>
              <p className="text-gray-600 mb-2">Document all your hilarious pranks and mischief</p>
              
              <Link to="/create/friends/prank-book/author" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-amber-500 bg-white border border-amber-400 rounded-full hover:bg-amber-400 hover:text-white transition-colors">
                Start Create
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsLanding;
