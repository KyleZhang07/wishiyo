import { Link } from 'react-router-dom';

const FriendsLanding = () => {
  return (
    <div className="page-transition">
      <div className="bg-white">
        {/* Hero Section */}
        <section className="py-16 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-display font-bold mb-4 md:text-5xl">Personalized books for friends</h1>
              <p className="text-xl text-gray-600 mb-8">
                Hilarious moments. Presented by you.
              </p>
              <Link to="/create/friends/funny-biography/author" className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-amber-500 rounded hover:bg-amber-600 transition-colors">
                Create a Book
              </Link>
            </div>
          </div>
        </section>

        {/* Book Types Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex justify-between items-baseline">
              <h2 className="text-3xl font-display font-bold">
                Choose Your Book Type
              </h2>
              <div className="text-right">
                <span className="text-gray-500">3 books</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/create/friends/funny-biography/author" className="block">
                <div className="bg-white border border-gray-200 overflow-hidden h-full">
                  <div className="aspect-square relative">
                    <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Funny Biography" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">Funny Biography</h3>
                    <p className="text-gray-600">Create a hilarious book full of funny moments and stories</p>
                    <p className="mt-4 text-gray-800 font-medium">From $44.99 USD</p>
                  </div>
                </div>
              </Link>
              
              <div className="bg-white border border-gray-200 overflow-hidden h-full">
                <div className="aspect-square relative">
                  <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Wild Fantasy" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">Wild Fantasy</h3>
                  <p className="text-gray-600">A whimsical collection of funny stories</p>
                  <p className="mt-4 text-gray-800 font-medium">From $44.99 USD</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 overflow-hidden h-full">
                <div className="aspect-square relative">
                  <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Prank Book" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">Prank Book</h3>
                  <p className="text-gray-600">Fun stories and pranks to remember</p>
                  <p className="mt-4 text-gray-800 font-medium">From $44.99 USD</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FriendsLanding;
