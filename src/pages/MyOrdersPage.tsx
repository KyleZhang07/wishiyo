import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface Order {
  id: string;
  order_id: string;
  title: string;
  book_type: string;
  status: string;
  ordered_date: string;
  cover_pdf?: string;
  interior_pdf?: string;
  cover_image_url?: string;
}

const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('orderAuthToken');
    const storedEmail = localStorage.getItem('orderAuthEmail');
    
    if (!token || !storedEmail) {
      navigate('/');
      return;
    }
    
    setEmail(storedEmail);
    fetchOrders(storedEmail);
  }, [navigate]);

  const fetchOrders = async (email: string) => {
    setIsLoading(true);
    try {
      // Get order data
      const { data: funnyBiographyBooks, error: funnyBiographyError } = await supabase
        .from('funny_biography_books')
        .select('*')
        .eq('customer_email', email);
      
      const { data: loveStoryBooks, error: loveStoryError } = await supabase
        .from('love_story_books')
        .select('*')
        .eq('customer_email', email);
      
      if (funnyBiographyError) throw funnyBiographyError;
      if (loveStoryError) throw loveStoryError;
      
      // Merge both book types
      const allOrders: Order[] = [
        ...(funnyBiographyBooks || []).map((book: any) => ({
          id: book.id,
          order_id: book.order_id,
          title: book.title,
          book_type: 'Funny Biography',
          status: book.status,
          ordered_date: book.timestamp,
          cover_pdf: book.cover_pdf,
          interior_pdf: book.interior_pdf,
          cover_image_url: book.cover_source_url
        })),
        ...(loveStoryBooks || []).map((book: any) => ({
          id: book.id,
          order_id: book.order_id,
          title: book.title,
          book_type: 'Love Story',
          status: book.status,
          ordered_date: book.timestamp,
          cover_pdf: book.cover_pdf,
          interior_pdf: book.interior_pdf,
          cover_image_url: book.cover_source_url
        }))
      ];
      
      // Sort by date, newest first
      allOrders.sort((a, b) => 
        new Date(b.ordered_date).getTime() - new Date(a.ordered_date).getTime()
      );
      
      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Failed to load orders',
        description: 'Unable to load your order information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shipped':
        return <Badge className="bg-green-500">Shipped</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-green-700">Delivered</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('orderAuthToken');
    localStorage.removeItem('orderAuthEmail');
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">My Orders ({orders.length})</h1>
          <p className="text-gray-600">
            Books purchased by {email} appear here
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-4">
              You don't have any order records yet.
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-primary hover:underline"
            >
              Browse our products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center p-4 cursor-pointer" onClick={() => navigate(`/orders/${order.order_id}`)}>
                  <div className="flex-shrink-0 w-20 h-28 bg-gray-100 rounded overflow-hidden mr-4">
                    {order.cover_image_url ? (
                      <img
                        src={order.cover_image_url}
                        alt={order.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400 text-xs">No cover</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        {getStatusBadge(order.status)}
                        <h3 className="text-lg font-medium mt-1">{order.title}</h3>
                        <p className="text-sm text-gray-500">{order.book_type}</p>
                        <p className="text-sm text-gray-500">Order ID: {order.order_id}</p>
                        <p className="text-sm text-gray-500">Ordered: {formatDate(order.ordered_date)}</p>
                      </div>
                      <ChevronRight className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyOrdersPage;
