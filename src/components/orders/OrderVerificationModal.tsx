import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface OrderVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderVerificationModal: React.FC<OrderVerificationModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Send verification code
  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.SUPABASE_URL}/functions/v1/send-order-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Verification code sent',
          description: 'Please check your email',
        });
        setStep('verification');
      } else {
        throw new Error(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        title: 'Failed to send verification code',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Please enter the 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.SUPABASE_URL}/functions/v1/verify-order-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json();
      
      if (data.success) {
        // Save token and email to localStorage
        localStorage.setItem('orderAuthToken', data.token);
        localStorage.setItem('orderAuthEmail', email);
        
        toast({
          title: 'Verification successful',
          description: `Found ${data.orderCount} orders`,
        });
        
        // Close modal and navigate to orders page
        onClose();
        navigate('/my-orders');
      } else {
        throw new Error(data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid or expired code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state
  const handleClose = () => {
    setEmail('');
    setVerificationCode('');
    setStep('email');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {step === 'email' ? 'Log in to continue' : 'Verify your email'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'email' ? (
          <div className="space-y-4 py-4">
            <p className="text-center text-sm text-gray-500">
              Enter your purchase email address
            </p>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-blue-600">
                Email address*
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full"
                disabled={isLoading}
              />
            </div>
            
            <Button
              onClick={handleSendCode}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Continue'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-center text-sm text-gray-500">
              We've sent a verification code to {email}
            </p>
            
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-blue-600">
                Verification code*
              </label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full"
                maxLength={6}
                disabled={isLoading}
              />
            </div>
            
            <Button
              onClick={handleVerifyCode}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
            
            <p className="text-center text-sm text-gray-500">
              Didn't receive the code?{' '}
              <button
                onClick={() => setStep('email')}
                className="text-blue-600 hover:underline"
                disabled={isLoading}
              >
                Resend
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderVerificationModal;
