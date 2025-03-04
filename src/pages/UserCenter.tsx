import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { StripeProvider } from '@/components/payment/StripeProvider';
import { CheckoutForm } from '@/components/payment/CheckoutForm';

// 初始化Supabase客户端
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const UserCenter = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<Array<{
    id: string;
    title: string;
    format: string;
    price: string;
    editPath: string;
  }>>([]);
  const [hasItems, setHasItems] = useState(false);
  
  // Stripe支付状态
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    const items = [];
    
    // 检查是否有Love Story书籍
    const loveTitle = localStorage.getItem('loveStoryBookTitle');
    const loveFormat = localStorage.getItem('loveStoryBookFormat');
    const lovePrice = localStorage.getItem('loveStoryBookPrice');
    
    if (loveTitle && loveFormat && lovePrice) {
      items.push({
        id: 'love-story',
        title: loveTitle,
        format: loveFormat,
        price: lovePrice,
        editPath: '/create/love/love-story/generate'
      });
    }
    
    // 检查是否有Funny Biography书籍
    const funnyTitle = localStorage.getItem('funnyBiographyBookTitle');
    const funnyFormat = localStorage.getItem('funnyBiographyBookFormat');
    const funnyPrice = localStorage.getItem('funnyBiographyBookPrice');
    
    if (funnyTitle && funnyFormat && funnyPrice) {
      items.push({
        id: 'funny-biography',
        title: funnyTitle,
        format: funnyFormat,
        price: funnyPrice,
        editPath: '/create/friends/funny-biography/generate'
      });
    }
    
    setCartItems(items);
    setHasItems(items.length > 0);
  }, []);

  const handleRemoveItem = (itemId: string) => {
    // 根据ID移除购物车中的商品
    if (itemId === 'love-story') {
      localStorage.removeItem('loveStoryBookTitle');
      localStorage.removeItem('loveStoryBookFormat');
      localStorage.removeItem('loveStoryBookPrice');
    } else if (itemId === 'funny-biography') {
      localStorage.removeItem('funnyBiographyBookTitle');
      localStorage.removeItem('funnyBiographyBookFormat');
      localStorage.removeItem('funnyBiographyBookPrice');
    }
    
    // 更新购物车
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    setHasItems(cartItems.length > 1);
    
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const handleEditContent = (path: string) => {
    // 导航到内容编辑页面
    navigate(path);
  };

  // 创建Stripe支付意向
  const handleCheckout = async () => {
    if (!hasItems) return;
    
    try {
      setPaymentProcessing(true);
      
      // 计算总金额（转换为分）
      const totalAmount = cartItems.reduce((sum, item) => {
        return sum + parseFloat(item.price) * 100;
      }, 0);
      
      // 创建元数据
      const metadata = {
        products: JSON.stringify(cartItems.map(item => ({
          id: item.id,
          title: item.title,
          format: item.format,
          price: item.price
        })))
      };
      
      // 调用Supabase Function创建PaymentIntent
      const { data, error } = await supabase.functions.invoke('stripe-payment-intent', {
        body: {
          amount: totalAmount,
          currency: 'usd',
          metadata
        }
      });
      
      if (error) throw error;
      
      if (data && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPayment(true);
      } else {
        throw new Error('无法创建支付，请重试');
      }
    } catch (error) {
      console.error('创建支付失败:', error);
      toast({
        title: "支付初始化失败",
        description: error.message || "创建支付时出错，请重试",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };
  
  // 支付成功处理
  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentComplete(true);
    
    toast({
      title: "支付成功",
      description: "您的订单已成功提交，感谢您的购买！",
    });
    
    // 可以清空购物车或重定向到订单确认页面
    setTimeout(() => {
      // 清空本地存储中的购物车数据
      cartItems.forEach(item => {
        if (item.id === 'love-story') {
          localStorage.removeItem('loveStoryBookTitle');
          localStorage.removeItem('loveStoryBookFormat');
          localStorage.removeItem('loveStoryBookPrice');
        } else if (item.id === 'funny-biography') {
          localStorage.removeItem('funnyBiographyBookTitle');
          localStorage.removeItem('funnyBiographyBookFormat');
          localStorage.removeItem('funnyBiographyBookPrice');
        }
      });
      
      setCartItems([]);
      setHasItems(false);
      setShowPayment(false);
    }, 3000);
  };
  
  // 支付错误处理
  const handlePaymentError = (error: string) => {
    toast({
      title: "支付失败",
      description: error || "处理支付时出错，请重试",
      variant: "destructive",
    });
  };

  return (
    <div className="page-transition container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold">Your Cart {hasItems ? `(${cartItems.length})` : '(0)'}</h1>
          <a href="/" className="text-lg hover:underline">
            Continue Shopping →
          </a>
        </div>
        
        {/* 支付表单显示 */}
        {showPayment && clientSecret ? (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">支付信息</h2>
              <button 
                onClick={() => setShowPayment(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <StripeProvider clientSecret={clientSecret}>
              <CheckoutForm 
                amount={cartItems.reduce((sum, item) => sum + parseFloat(item.price) * 100, 0)}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                metadata={{
                  products: JSON.stringify(cartItems.map(item => item.id))
                }}
              />
            </StripeProvider>
          </div>
        ) : (
          <>
            {hasItems ? (
              <div>
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-start">
                      <div className="w-24 h-32 bg-gray-100 flex-shrink-0 mr-6">
                        {/* 暂时使用空白图片 */}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h2 className="text-xl font-semibold">{item.title}</h2>
                          <div className="flex items-center">
                            <span className="text-xl font-medium mr-4">${item.price} USD</span>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500">
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mt-1">{item.format}</p>
                        
                        <div className="mt-6">
                          <button 
                            onClick={() => handleEditContent(item.editPath)}
                            className="text-gray-600 hover:text-gray-900 flex items-center font-medium"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit content
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center mt-6 mb-2">
                  <div className="font-medium text-lg">
                    总计: ${cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)} USD
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCheckout}
                    className="bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white px-8 py-3 text-lg"
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? "处理中..." : "结账"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">
                  Start creating your first AI-powered book today!
                </p>
                <a
                  href="/create/step1"
                  className="inline-flex items-center px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Your First Book
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserCenter;
