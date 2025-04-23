
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
  const [codeSent, setCodeSent] = useState(false);

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
      // 使用 Vercel API 而不是 Supabase Edge Function
      const response = await fetch('/api/send-order-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 直接跳转到下一步，不需要显示成功通知
        setStep('code');
        setCodeSent(true);
      } else {
        throw new Error(data.error || 'Failed to send verification code');
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
      // 使用 Vercel API 而不是 Supabase Edge Function
      const response = await fetch('/api/verify-order-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 直接保存数据并跳转，不需要显示成功通知

        // Save verification token and order data to localStorage
        localStorage.setItem('order_verification_token', data.token);
        localStorage.setItem('user_orders', JSON.stringify(data.orders || []));
        localStorage.setItem('verified_email', email);

        // Navigate to order history page
        navigate('/orders/history');
      } else {
        throw new Error(data.error || 'Verification code validation failed');
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
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-[420px]">

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-center mb-8">
            <Package className="h-10 w-10 text-[#FF7F50]" />
          </div>
          <h1 className="text-2xl font-semibold text-center mb-8">Check My Orders</h1>

          {step === 'email' ? (
            <form onSubmit={handleSendVerification}>
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Your order email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@youremail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/90 h-12 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Get Code'}
                  {!loading && <Send className="ml-2 h-4 w-4" />}
                </Button>
                {codeSent && (
                  <div className="text-xs text-gray-500 flex items-center justify-center mt-4">
                    <span className="inline-block mr-1">⏱️</span> Code expires in 15 min
                  </div>
                )}
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
    </div>
  );
};

export default VerifyOrder;
