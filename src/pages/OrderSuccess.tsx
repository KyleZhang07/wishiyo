
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookOrder {
  id: string;
  order_id: string;
  title: string;
  format: string;
  price: string;
  cover_image_url: string | null;
  spine_image_url: string | null;
  user_data: any;
  created_at: string;
}

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || localStorage.getItem('currentOrderId');
  const [orderData, setOrderData] = useState<BookOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setError("No order ID found");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-book-data', {
          body: { orderId }
        });

        if (error) throw error;
        
        if (data) {
          setOrderData(data);
        } else {
          setError("Order not found");
        }
      } catch (err: any) {
        console.error('Error fetching order data:', err);
        setError(err.message || "Error fetching order data");
        
        toast({
          title: "Error",
          description: "Failed to load your order details. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, toast]);

  // Mock function for download button
  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Your book is being prepared for download."
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Loading your order details...</h1>
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-32 w-64 bg-gray-200 rounded"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-36 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Order Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Order Successfully Processed!</h1>
        <p className="text-gray-600">Thank you for your order. Your book has been saved.</p>
      </div>

      {orderData && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-2xl mx-auto">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {orderData.cover_image_url && (
                <img 
                  src={orderData.cover_image_url} 
                  alt="Book Cover" 
                  className="w-48 h-auto object-cover rounded shadow"
                />
              )}
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{orderData.title}</h2>
                <p className="text-gray-600 mt-2">Format: {orderData.format}</p>
                <p className="text-gray-600">Price: ${parseFloat(orderData.price).toFixed(2)} USD</p>
                <p className="text-gray-600">Order ID: {orderData.order_id}</p>
                <p className="text-gray-600">Date: {new Date(orderData.created_at).toLocaleDateString()}</p>
                
                <div className="mt-6 flex gap-4">
                  <Button onClick={handleDownload} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Preview
                  </Button>
                  
                  <Link to="/">
                    <Button variant="outline">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Return to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccess;
