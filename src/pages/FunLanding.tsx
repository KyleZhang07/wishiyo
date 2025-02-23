
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Laugh } from 'lucide-react';

const FunLanding = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Fun Books</h1>
        <p className="text-xl text-gray-600">Create hilarious stories and share laughter!</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Laugh className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-semibold">Funny Biography</h2>
          </div>
          <p className="text-gray-600">
            Turn your life stories into a hilarious book that will make everyone laugh!
          </p>
          <Link to="/create/fun/funny-biography/author">
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

export default FunLanding;
