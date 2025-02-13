import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
const FriendsLanding = () => {
  return <div className="page-transition">
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90" />
          <div className="relative z-10 px-[60px] my-[64px] bg-sky-50 py-[100px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-white space-y-6">
                  <h1 className="text-4xl font-display font-bold px-0 mx-0 md:text-4xl text-slate-800">Hilarious moment. Presented by you.</h1>
                  <p className="text-xl text-slate-800 px-0 mx-0">Use Wishika to give your friends a special book just for them</p>
                  <Link to="/create/friends/author" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-primary bg-white rounded-full hover:bg-gray-50 transition-colors">
                    <Users className="w-5 h-5" />
                    Create for Friends
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-white/20">
                    <img src="/placeholder.svg" alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default FriendsLanding;