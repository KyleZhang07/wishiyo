import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

// 生成随机订单ID，格式: WY-XXXXXXXX
const generateOrderId = () => {
  const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `WY-${randomId}`;
};

const Checkout = () => {
  const navigate = useNavigate();
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookFormat, setBookFormat] = useState<string>('');
  const [price, setPrice] = useState<string>('0.00');
  const [loading, setLoading] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>(generateOrderId());
  
  useEffect(() => {
    // 从localStorage获取书籍信息
    const title = localStorage.getItem('loveStoryBookTitle') || 'Love Story Book';
    const format = localStorage.getItem('loveStoryBookFormat') || 'Softcover';
    const formatPrice = localStorage.getItem('loveStoryBookPrice') || '44.99';
    
    setBookTitle(title);
    setBookFormat(format);
    setPrice(formatPrice);
    
    // 保存订单ID
    localStorage.setItem('loveStoryOrderId', orderId);
  }, [orderId]);
  
  const handleContinueShopping = () => {
    navigate('/');
  };
  
  const handleCompleteOrder = () => {
    setLoading(true);
    
    // 模拟订单处理过程
    setTimeout(() => {
      setLoading(false);
      // 显示订单成功并导航到成功页面
      navigate('/order-success');
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-[#FFFAF5]">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-16 h-16 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-center mb-3">Your item has been added to cart!</h1>
        <p className="text-gray-600 text-center mb-10">Order ID: {orderId}</p>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-10">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
          
          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between mb-4">
              <div>
                <h3 className="font-medium">{bookTitle}</h3>
                <p className="text-gray-600">{bookFormat}</p>
              </div>
              <p className="font-medium">${parseFloat(price).toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex justify-between mb-4">
            <p className="font-medium">Subtotal</p>
            <p className="font-medium">${parseFloat(price).toFixed(2)}</p>
          </div>
          
          <div className="flex justify-between mb-4">
            <p className="font-medium">Shipping</p>
            <p className="font-medium">Free</p>
          </div>
          
          <div className="flex justify-between font-bold text-lg border-t pt-4">
            <p>Total</p>
            <p>${parseFloat(price).toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Button 
            variant="outline" 
            className="border-[#FF7F50] text-[#FF7F50] hover:bg-[#FF7F50]/10"
            onClick={handleContinueShopping}
          >
            Continue Shopping
          </Button>
          
          <Button 
            variant="default" 
            className="bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white"
            onClick={handleCompleteOrder}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Order'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 