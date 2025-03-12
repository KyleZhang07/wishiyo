import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Missing session ID');
      setIsLoading(false);
      return;
    }

    // Clear localStorage for funny-biography data
    const clearLocalStorage = () => {
      // 暂时注释掉本地存储清除功能，以便于测试
      // 测试完成后取消注释以重新启用
      console.log('本地存储清除功能已暂时禁用以便测试');
      /*
      try {
        // Clear all funny-biography related data from localStorage
        localStorage.removeItem('funny-biography-answers');
        localStorage.removeItem('funny-biography-author');
        localStorage.removeItem('funny-biography-idea');
        localStorage.removeItem('funny-biography-toc');
        localStorage.removeItem('funny-biography-cover-front');
        localStorage.removeItem('funny-biography-cover-spine');
        localStorage.removeItem('funny-biography-cover-back');
        
        console.log('Local storage cleared successfully');
      } catch (err) {
        console.error('Error clearing local storage:', err);
      }
      */
    };

    // Verify the session with Stripe
    const verifySession = async () => {
      try {
        const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to verify payment session');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Payment was successful, call clearLocalStorage but storage won't be cleared due to comment
          clearLocalStorage();
        } else {
          setError('Payment verification failed');
        }
      } catch (err) {
        console.error('Error verifying session:', err);
        setError('Failed to verify payment. Please contact support.');
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [sessionId]);

  const handleContinue = () => {
    // Navigate back to home page
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg">Verifying your payment...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={handleContinue} className="w-full">
              Return Home
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Order Successful!</h2>
            <p className="text-gray-600">
              Thank you for your purchase! Your book is now being generated and will be printed and shipped to your address.
            </p>
            <p className="text-gray-600 text-xs mt-4 p-2 bg-yellow-50 rounded">
              注意：本地存储清除功能已暂时禁用以供测试。支付成功后您的数据仍会保留。
            </p>
            <p className="text-gray-600">
              We'll send you an email with your order details and tracking information once your book is on its way.
            </p>
            <Button onClick={handleContinue} className="w-full">
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 