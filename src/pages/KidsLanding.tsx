
import { Link } from 'react-router-dom';

const KidsLanding = () => {
  return <div className="page-transition">
      <div className="bg-white shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90" />
          <div className="relative z-10 px-[60px] my-[64px] bg-amber-50 rounded-none py-[100px]">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-white space-y-6">
                  <h1 className="text-4xl font-display font-bold px-0 mx-0 md:text-4xl text-slate-800">Dreams brought to life. Magically.</h1>
                  <p className="text-xl text-slate-800">Turn your child into the hero of their very own storybook adventure</p>
                  <a href="#book-types" className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-amber-400 rounded-full hover:bg-amber-500 transition-colors">
                    Choose My Book
                  </a>
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

        <div id="book-types" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-display font-bold text-slate-800 mb-8 text-center">Your Favorite</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group">
              <div className="relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Adventure Book" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Adventure Book</h3>
              <p className="text-gray-600 mb-2">Your child's magical adventure story</p>
              
              <Link to="/create/kids/adventure/author" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary bg-white border border-primary rounded-full hover:bg-primary hover:text-white transition-colors">
                Start Create
              </Link>
            </div>

            <div className="group">
              <div className="relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Bedtime Stories" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Career Exploration</h3>
              <p className="text-gray-600 mb-2">Personalized bedtime stories for sweet dreams</p>
              
              <Link to="/create/kids/story-book/author" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary bg-white border border-primary rounded-full hover:bg-primary hover:text-white transition-colors">
                Start Create
              </Link>
            </div>

            <div className="group">
              <div className="relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-4">
                <img src="/lovable-uploads/d7889756-42bc-4117-8fdb-9746ee840bfd.png" alt="Learning Journey" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold mb-2">Learning Journey</h3>
              <p className="text-gray-600 mb-2">Educational stories that make learning fun</p>
              
              <Link to="/create/kids/learning/author" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary bg-white border border-primary rounded-full hover:bg-primary hover:text-white transition-colors">
                Start Create
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default KidsLanding;
