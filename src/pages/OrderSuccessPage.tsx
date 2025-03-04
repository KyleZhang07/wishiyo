
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  
  useEffect(() => {
    // In a real app, you would validate the payment_intent with your backend
    // For our demo, we'll just show the order information
    const paymentIntentId = searchParams.get('payment_intent') || 'pi_unknown';
    setOrderId(`WY-${paymentIntentId.substr(-8).toUpperCase()}`);
    
    // Get the book title from localStorage
    const title = localStorage.getItem('loveStoryBookTitle') || 'AI-Generated Book';
    setBookTitle(title);
    
    // Save the order ID in localStorage
    localStorage.setItem('loveStoryOrderId', orderId);
  }, [searchParams, orderId]);
  
  return (
    <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center">
      <div className="text-center p-8 max-w-md w-full">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Order Successful!</h1>
        <p className="text-xl text-gray-600 mb-2">Thank you for your purchase</p>
        <p className="text-gray-500 mb-6">Order ID: {orderId}</p>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <p className="text-gray-600">We have received your order for:</p>
          <p className="font-bold text-lg my-2">{bookTitle}</p>
          <p className="text-gray-600 text-sm">Your book will be printed and shipped within 3-5 business days.</p>
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

export default OrderSuccessPage;
