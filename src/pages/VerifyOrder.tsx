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
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
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

    setSendLoading(true);

    try {
      const response = await supabase.functions.invoke('send-order-verification', {
        body: { email }
      });

      if (response.data.success) {
        // 直接跳转到下一步，不需要显示成功通知
        setStep('code');
        setCodeSent(true);
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
      setSendLoading(false);
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

    setVerifyLoading(true);

    try {
      const response = await supabase.functions.invoke('verify-order-code', {
        body: { email, code: verificationCode }
      });

      if (response.data.success) {
        // 直接保存数据并跳转，不需要显示成功通知

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
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center py-16">
      <div className="w-full max-w-[450px] px-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-10">
            <div className="flex items-center justify-center mb-10">
              <Package className="h-12 w-12 text-[#FF7F50]" />
            </div>
            <h1 className="text-3xl font-semibold text-center mb-10">Check My Orders</h1>

            {step === 'email' ? (
              <form onSubmit={handleSendVerification}>
                <div className="space-y-8">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-3">
                      Your order email
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/90 h-12 text-base font-medium"
                    disabled={sendLoading}
                  >
                    {sendLoading ? 'Sending...' : 'Get Code'}
                  </Button>
                  {codeSent && (
                    <div className="text-sm text-gray-500 flex items-center justify-center mt-4">
                      <span className="inline-block mr-1">⏱️</span> Code expires in 15 min
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode}>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-base font-medium text-gray-700">
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
                    <p className="text-sm text-gray-500 mb-6">
                      We've sent a 6-digit verification code to {email}
                    </p>
                    <div className="flex justify-center mb-6">
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
                    className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/90 h-12 text-base font-medium"
                    disabled={verifyLoading || sendLoading}
                  >
                    {verifyLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base"
                    onClick={handleSendVerification}
                    disabled={verifyLoading || sendLoading}
                  >
                    {sendLoading ? 'Resending...' : 'Resend'}
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
