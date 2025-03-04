
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');
  
  // 从localStorage获取订单ID
  const orderId = localStorage.getItem('loveStoryOrderId') || 'WY-UNKNOWN';
  const bookTitle = localStorage.getItem('loveStoryBookTitle') || 'Love Story Book';
  
  useEffect(() => {
    // Simulating verification of payment
    const verifyPayment = async () => {
      // In a real app, you would verify the payment with Stripe
      // through a Supabase function
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    };
    
    if (sessionId) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [sessionId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#FF7F50] mx-auto mb-4" />
          <p className="text-xl">Verifying your payment...</p>
        </div>
      </div>
    );
  }
  
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
          <p className="text-gray-600">We have received your order for:</p>
          <p className="font-bold text-lg my-2">{bookTitle}</p>
          <p className="text-gray-600 text-sm">Your book will be printed and shipped within 3-5 business days.</p>
          
          {sessionId && (
            <p className="text-gray-500 text-xs mt-4">
              Payment Reference: {sessionId.substring(0, 10)}...
            </p>
          )}
        </div>
        
        <Button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-[#FF7F50] text-white rounded-md hover:bg-[#FF7F50]/80 transition-colors w-full"
        >
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
