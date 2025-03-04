import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Stripe公钥（这是公开的，可以安全地包含在前端代码中）
// 注意：请替换为您的实际Stripe公钥
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

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
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCheckout = async () => {
    if (!hasItems || cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // 使用第一个物品的信息（一般情况下只有一个书籍）
      const item = cartItems[0];
      
      // 生成唯一订单ID
      const orderId = `WY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // 保存订单ID供后续使用
      if (item.id === 'love-story') {
        localStorage.setItem('loveStoryOrderId', orderId);
      } else if (item.id === 'funny-biography') {
        localStorage.setItem('funnyBiographyOrderId', orderId);
      }
      
      // 加载Stripe实例
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Failed to load Stripe');
      
      // 注意：由于Stripe前端SDK的限制，我们需要使用一个后端会话ID
      // 但我们可以使用更简单的后端实现，仅创建会话ID
      
      // 创建一个简单的表单提交，模拟结账
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://checkout.stripe.com/create-checkout-session';
      
      // 添加必要的字段
      const addHiddenField = (name: string, value: string) => {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = name;
        hiddenField.value = value;
        form.appendChild(hiddenField);
      };
      
      // 设置基本参数
      addHiddenField('key', 'pk_test_TYooMQauvdEDq54NiTphI7jx'); // 替换为您的公钥
      addHiddenField('success_url', `${window.location.origin}/order-success?order_id=${orderId}`);
      addHiddenField('cancel_url', `${window.location.origin}/user-center`);
      addHiddenField('client_reference_id', orderId);
      
      // 设置商品信息
      addHiddenField('line_items[0][name]', item.title);
      addHiddenField('line_items[0][description]', `${item.title} - ${item.format}`);
      addHiddenField('line_items[0][amount]', `${Math.round(parseFloat(item.price) * 100)}`);
      addHiddenField('line_items[0][currency]', 'usd');
      addHiddenField('line_items[0][quantity]', '1');
      
      // 设置其他选项
      addHiddenField('mode', 'payment');
      addHiddenField('shipping_address_collection[allowed_countries][]', 'US');
      addHiddenField('shipping_address_collection[allowed_countries][]', 'CA');
      addHiddenField('shipping_address_collection[allowed_countries][]', 'GB');
      addHiddenField('shipping_address_collection[allowed_countries][]', 'AU');
      
      // 将表单添加到文档并提交
      document.body.appendChild(form);
      form.submit();
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
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
            
            <div className="flex justify-end">
              <Button 
                onClick={handleCheckout}
                disabled={isLoading}
                className="bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white px-8 py-3 text-lg"
              >
                {isLoading ? 'Processing...' : 'Checkout'}
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
      </div>
    </div>
  );
};

export default UserCenter;
