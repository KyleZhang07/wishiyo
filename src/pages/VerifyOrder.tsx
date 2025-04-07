
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
        title: "邮箱格式错误",
        description: "请输入有效的邮箱地址",
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
          description: "验证码已发送，请查收邮件",
        });
        setStep('code');
      } else {
        throw new Error(response.data.error || '发送验证码失败');
      }
    } catch (error: any) {
      toast({
        title: "发送失败",
        description: error.message || "请稍后重试",
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
        title: "验证码错误",
        description: "请输入6位验证码",
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
          description: "验证成功",
        });
        
        // 保存验证令牌和订单数据到localStorage
        localStorage.setItem('order_verification_token', response.data.token);
        localStorage.setItem('user_orders', JSON.stringify(response.data.orders || []));
        localStorage.setItem('verified_email', email);
        
        // 导航到订单历史页面
        navigate('/orders/history');
      } else {
        throw new Error(response.data.error || '验证码验证失败');
      }
    } catch (error: any) {
      toast({
        title: "验证失败",
        description: error.message || "请检查验证码是否正确",
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
          返回首页
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <Package className="h-10 w-10 text-[#FF7F50]" />
          </div>
          <h1 className="text-2xl font-semibold text-center mb-6">查询我的订单</h1>
          
          {step === 'email' ? (
            <form onSubmit={handleSendVerification}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱地址
                  </label>
                  <Input
                    type="email"
                    placeholder="请输入订购时使用的邮箱"
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
                  {loading ? '发送中...' : '发送验证码'}
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
                      验证码
                    </label>
                    <button
                      type="button"
                      className="text-sm text-[#FF7F50] hover:underline"
                      onClick={() => setStep('email')}
                    >
                      更换邮箱
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    我们已向 {email} 发送了一个6位数验证码
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
                  {loading ? '验证中...' : '验证并查看订单'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSendVerification}
                  disabled={loading}
                >
                  重新发送验证码
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
