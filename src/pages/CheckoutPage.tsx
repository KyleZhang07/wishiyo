
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StripeProvider } from '@/components/payment/StripeProvider';
import CheckoutForm from '@/components/payment/CheckoutForm';
import { useToast } from '@/components/ui/use-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookFormat, setBookFormat] = useState<string>('');
  const [price, setPrice] = useState<string>('0.00');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Get book details from localStorage
    const title = localStorage.getItem('loveStoryBookTitle') || 'Love Story Book';
    const format = localStorage.getItem('loveStoryBookFormat') || 'Softcover';
    const formatPrice = localStorage.getItem('loveStoryBookPrice') || '44.99';
    
    setBookTitle(title);
    setBookFormat(format);
    setPrice(formatPrice);
    
    // Create a payment intent - in a real app this would happen on the server
    // For our demo, we'll simulate it
    const createPaymentIntent = async () => {
      try {
        // This would typically be a server call to create a payment intent
        // For demo purposes, we're just creating a mock client secret
        setClientSecret('pi_3PIvCsEEQCrVMp7F1M4cKbH8_secret_IamEcdgxZexECw4DnJmLZBWwM');
        setLoading(false);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        toast({
          title: "Error initializing checkout",
          description: "Could not initialize payment. Please try again.",
          variant: "destructive",
        });
        navigate('/user-center');
      }
    };
    
    createPaymentIntent();
  }, [navigate, toast]);

  const handleBack = () => {
    navigate('/user-center');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading checkout...</div>;
  }

  return (
    <StripeProvider>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>
        
        <CheckoutForm 
          itemTitle={`${bookTitle} - ${bookFormat}`}
          price={price}
          onBack={handleBack}
        />
        
        <div className="text-center text-sm text-gray-500 mt-10">
          <p>Powered by Stripe • All transactions are secure and encrypted</p>
        </div>
      </div>
    </StripeProvider>
  );
};

export default CheckoutPage;
