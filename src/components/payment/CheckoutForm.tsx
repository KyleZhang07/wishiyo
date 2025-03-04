import { useState, useEffect } from 'react';
import {
  PaymentElement,
  LinkAuthenticationElement,
  AddressElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

interface CheckoutFormProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  metadata?: Record<string, string>;
}

export function CheckoutForm({ amount, onSuccess, onError, metadata = {} }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!stripe) {
      return;
    }

    // 获取URL中的payment_intent_client_secret
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    // 检查支付状态
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) return;
      
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("支付成功!");
          onSuccess(paymentIntent.id);
          break;
        case "processing":
          setMessage("支付处理中...");
          break;
        case "requires_payment_method":
          setMessage("支付失败，请重试.");
          onError("支付需要重试");
          break;
        default:
          setMessage("发生错误.");
          onError("支付出错");
          break;
      }
    });
  }, [stripe, onSuccess, onError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/user-center`,
        receipt_email: email,
        payment_method_data: {
          billing_details: {
            email: email,
          },
        },
      },
    });
    
    if (error) {
      setMessage(error.message || '支付出错，请重试。');
      onError(error.message || '支付出错');
    }
    
    setIsLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LinkAuthenticationElement
        onChange={(e) => setEmail(e.value.email)}
      />
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">配送地址</h3>
        <AddressElement 
          options={{
            mode: 'shipping',
            allowedCountries: ['US', 'CA', 'CN'],
          }}
        />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">支付方式</h3>
        <PaymentElement 
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            }
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading || !stripe || !elements} 
        className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/80"
      >
        {isLoading ? "处理中..." : `支付 $${(amount / 100).toFixed(2)} USD`}
      </Button>
      
      {message && <div className="text-red-500 text-sm">{message}</div>}
    </form>
  );
}
