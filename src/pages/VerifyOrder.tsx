
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Package, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VerifyOrder = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  
  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      toast({
        title: "Invalid Email Format",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await supabase.functions.invoke('send-order-verification', {
        body: { email }
      });
      
      if (response.data.success) {
        toast({
          description: "Verification code sent, please check your email",
        });
        setStep('code');
      } else {
        throw new Error(response.data.error || 'Failed to send verification code');
      }
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await supabase.functions.invoke('verify-order-code', {
        body: { email, code: verificationCode }
      });
      
      if (response.data.success) {
        toast({
          description: "Verification successful",
        });
        
        // Save verification token and order data to localStorage
        localStorage.setItem('order_verification_token', response.data.token);
        localStorage.setItem('user_orders', JSON.stringify(response.data.orders || []));
        localStorage.setItem('verified_email', email);
        
        // Navigate to order history page
        navigate('/orders/history');
      } else {
        throw new Error(response.data.error || 'Verification code validation failed');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Please check your verification code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-24 max-w-md">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Home
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <Package className="h-10 w-10 text-[#FF7F50]" />
          </div>
          <h1 className="text-2xl font-semibold text-center mb-6">Check My Orders</h1>
          
          {step === 'email' ? (
            <form onSubmit={handleSendVerification}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter the email used for your order"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/90"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                  {!loading && <Send className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Verification Code
                    </label>
                    <button
                      type="button"
                      className="text-sm text-[#FF7F50] hover:underline"
                      onClick={() => setStep('email')}
                    >
                      Change Email
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    We've sent a 6-digit verification code to {email}
                  </p>
                  <div className="flex justify-center mb-4">
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={(value) => setVerificationCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/90"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify and View Orders'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSendVerification}
                  disabled={loading}
                >
                  Resend Verification Code
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOrder;
