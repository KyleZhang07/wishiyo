
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const FriendsLanding = () => {
  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90" />
            <div className="relative z-10 px-8 py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-white space-y-6">
                  <h1 className="text-4xl md:text-5xl font-display font-bold">
                    Celebrate Your Friendship Journey
                  </h1>
                  <p className="text-xl text-white/90">
                    Transform your photos and memories into an amazing illustrated book celebrating your special bond
                  </p>
                  <Link
                    to="/create/friends/style"
                    className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-primary bg-white rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    Create for Friends
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-white/20">
                    <img
                      src="/placeholder.svg"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsLanding;
