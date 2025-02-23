
import { Link } from "react-router-dom";

const FunLanding = () => {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Fun Books</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            to="/create/fun/funny-book/author"
            className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4">Create a Funny Book</h2>
            <p className="text-gray-600">
              Turn your funny stories and experiences into an entertaining book that will make people laugh.
            </p>
          </Link>
          {/* More fun book types can be added here */}
        </div>
      </div>
    </div>
  );
};

export default FunLanding;
