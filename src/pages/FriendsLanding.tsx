
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FriendsLanding = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Create a Book About Friendship</h1>
        <p className="text-xl text-gray-600">Transform your friendship stories into beautiful books</p>
      </section>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Popular Templates</h2>
          <ul className="space-y-4">
            <li>
              <Link to="/create/friends/author">
                <Button variant="outline" className="w-full justify-start">
                  Best Friends Forever
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/create/friends/author">
                <Button variant="outline" className="w-full justify-start">
                  Friend Anniversary
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/create/friends/author">
                <Button variant="outline" className="w-full justify-start">
                  Friendship Journey
                </Button>
              </Link>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Your Favorite</h2>
          <ul className="space-y-4">
            <li>
              <Link to="/create/friends/author?genre=funny-biography">
                <Button variant="outline" className="w-full justify-start">
                  Funny Biography
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/create/friends/author?genre=wild-fantasy">
                <Button variant="outline" className="w-full justify-start">
                  Wild Fantasy
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/create/friends/author?genre=prank-book">
                <Button variant="outline" className="w-full justify-start">
                  Prank Book
                </Button>
              </Link>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Special Occasions</h2>
          <ul className="space-y-4">
            <li>
              <Link to="/create/friends/author">
                <Button variant="outline" className="w-full justify-start">
                  Birthday Gift
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/create/friends/author">
                <Button variant="outline" className="w-full justify-start">
                  Graduation Memory
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/create/friends/author">
                <Button variant="outline" className="w-full justify-start">
                  Moving Away
                </Button>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-6">Start Your Journey</h2>
        <Link to="/create/friends/author">
          <Button size="lg" className="px-8">
            Create Your Book
          </Button>
        </Link>
      </section>
    </div>
  );
};

export default FriendsLanding;
