
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Pencil } from 'lucide-react';

const FantasyLanding = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Fantasy Books</h1>
        <p className="text-xl text-gray-600">Create magical stories that touch hearts!</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold">Love Story</h2>
          </div>
          <p className="text-gray-600">
            Create a beautiful love story that captures special moments and emotions.
          </p>
          <Link to="/create/fantasy/love-story/author">
            <Button className="w-full">
              <Pencil className="w-4 h-4 mr-2" />
              Start Writing
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default FantasyLanding;
