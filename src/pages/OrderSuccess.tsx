
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define book data interface
interface BookData {
  order_id: string;
  title: string;
  product_id: string;
  format: string;
  price: string;
  cover_image_url: string | null;
  user_data: any;
}

const OrderSuccess = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [bookData, setBookData] = useState<BookData | null>(null);
  
  // Get order ID from localStorage (either love story or funny biography)
  const loveStoryOrderId = localStorage.getItem('loveStoryOrderId');
  const funnyBiographyOrderId = localStorage.getItem('funnyBiographyOrderId');
  const orderId = loveStoryOrderId || funnyBiographyOrderId || 'WY-UNKNOWN';
  
  // Get book title from localStorage (either love story or funny biography)
  const loveStoryBookTitle = localStorage.getItem('loveStoryBookTitle');
  const funnyBiographyBookTitle = localStorage.getItem('funnyBiographyBookTitle');
  const bookTitle = loveStoryBookTitle || funnyBiographyBookTitle || 'Your Custom Book';
  
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        // Get the data from Supabase
        const { data } = await supabase.functions.invoke('get-book-data', {
          body: { orderId }
        });
        
        if (data) {
          setBookData(data);
        }
      } catch (error) {
        console.error('Error fetching book data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId !== 'WY-UNKNOWN') {
      fetchBookData();
    } else {
      setIsLoading(false);
    }
  }, [orderId]);
  
  // Determine the book format
  const bookFormat = bookData?.format || 
    localStorage.getItem('funnyBiographyBookFormat') || 
    localStorage.getItem('loveStoryBookFormat') || 
    'Hardcover';

  return (
    <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center">
      <div className="text-center p-8 max-w-md w-full">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-2">Order Successful!</h1>
        <p className="text-xl text-gray-600 mb-2">Thank you for your purchase</p>
        <p className="text-gray-500 mb-6">Order ID: {orderId}</p>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          {isLoading ? (
            <div className="py-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7F50]"></div>
            </div>
          ) : (
            <>
              <p className="text-gray-600">We have received your order for:</p>
              <p className="font-bold text-lg my-2">{bookData?.title || bookTitle}</p>
              <p className="text-gray-600 mb-2">Format: {bookFormat}</p>
              
              {bookData?.cover_image_url && (
                <div className="mt-4 flex justify-center">
                  <img 
                    src={bookData.cover_image_url} 
                    alt="Book Cover" 
                    className="w-40 h-auto object-contain border border-gray-200 shadow-sm rounded"
                  />
                </div>
              )}
              
              <p className="text-gray-600 text-sm mt-4">Your book will be printed and shipped within 3-5 business days.</p>
            </>
          )}
        </div>
        
        <button 
          onClick={() => window.location.href = '/'} 
          className="px-6 py-3 bg-[#FF7F50] text-white rounded-md hover:bg-[#FF7F50]/80 transition-colors w-full"
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;
