
import { Link } from 'react-router-dom';

const FriendsLanding = () => {
  return (
    <div className="page-transition">
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF7F50] to-[#FF7F50]/80" />
          <div className="relative z-10 px-[60px] my-[64px] bg-[#FFFAF5] py-[100px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-white space-y-6">
                  <h1 className="text-4xl font-display font-bold px-0 mx-0 md:text-4xl text-slate-800">Hilarious moment. Presented by you.</h1>
                  <p className="text-xl text-slate-800">Use Wishika to give your friends a special book just for them</p>
                  <Link to="/create/friends/funny-biography/author" className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#FF7F50] rounded-sm hover:bg-[#FF7F50]/80 transition-colors">
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

        <div className="container px-4 md:px-6 mx-auto py-24">
          <h2 className="text-4xl font-serif font-bold tracking-tighter text-left mb-12">Personalized Book Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Book 1 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Funny Biography</h3>
              <p className="text-gray-700">Create a hilarious book full of funny moments and stories</p>
            </div>

            {/* Book 2 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Wild Fantasy</h3>
              <p className="text-gray-700">A whimsical collection of funny stories</p>
            </div>

            {/* Book 3 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Prank Book</h3>
              <p className="text-gray-700">Fun stories and pranks to remember</p>
            </div>

            {/* Book 4 */}
            <div className="flex flex-col">
              <div className="bg-[#FDF7ED] p-8 rounded-lg mb-4 h-[360px] flex items-center justify-center">
                {/* Placeholder for book image */}
              </div>
              <h3 className="text-xl font-bold mb-2">Memory Book</h3>
              <p className="text-gray-700">Preserve special memories in a personalized book</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsLanding;
