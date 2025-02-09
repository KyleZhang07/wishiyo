
import { Book } from 'lucide-react';

const UserCenter = () => {
  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-8">My Books</h1>
        
        <div className="glass-card rounded-2xl p-12 text-center">
          <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Books Yet</h2>
          <p className="text-gray-600 mb-6">
            Start creating your first AI-powered book today!
          </p>
          <a
            href="/create/step1"
            className="inline-flex items-center px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Your First Book
          </a>
        </div>
      </div>
    </div>
  );
};

export default UserCenter;
