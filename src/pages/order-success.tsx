import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Printer, LoaderCircle, Clock } from 'lucide-react';

// 定义订单状态类型
type OrderStatus = 'pending' | 'processing' | 'success' | 'error';

const OrderSuccess = () => {
  const location = useLocation();
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [orderId, setOrderId] = useState<string>('');
  const [bookTitle, setBookTitle] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    // 解析URL中的会话ID参数
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    
    // 从localStorage获取订单信息
    const funnyBiographyOrderId = localStorage.getItem('funnyBiographyOrderId');
    if (funnyBiographyOrderId) {
      setOrderId(funnyBiographyOrderId);
    }
    
    const bookTitle = localStorage.getItem('funnyBiographyBookTitle');
    if (bookTitle) {
      setBookTitle(bookTitle);
    }
    
    if (sessionId) {
      // 设置状态为处理中
      setStatus('processing');
      
      // 模拟轮询或检查书籍生成状态
      // 在实际应用中，这里应该轮询后端API来获取实际的生成状态
      const timer = setTimeout(() => {
        // 这里是模拟状态更新，实际应用中应调用API检查状态
        setStatus('success');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  // 渲染不同状态的内容
  const renderStatusContent = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-col items-center">
            <Clock className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-gray-600 text-center">
              Please wait while we verify your payment.
            </p>
          </div>
        );
        
      case 'processing':
        return (
          <div className="flex flex-col items-center">
            <LoaderCircle className="w-16 h-16 text-[#0C5C4C] mb-4 animate-spin" />
            <h2 className="text-2xl font-semibold mb-2">Generating Your Book</h2>
            <p className="text-gray-600 text-center">
              We're crafting your unique biography. This typically takes 1-2 minutes.
            </p>
          </div>
        );
        
      case 'success':
        return (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#0C5C4C] flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your Book is Ready!</h2>
            <p className="text-gray-600 text-center mb-6">
              "{bookTitle}" has been generated and sent to our printing service.
              You'll receive an email with tracking information once it ships.
            </p>
            <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50 border border-gray-200 mb-6">
              <Printer className="w-6 h-6 text-[#0C5C4C] mr-3" />
              <span className="text-gray-700">Order ID: <span className="font-mono">{orderId}</span></span>
            </div>
            <Button 
              variant="default" 
              className="bg-[#0C5C4C] hover:bg-[#0C5C4C]/90"
              onClick={() => window.location.href = '/'}
            >
              Return to Home
            </Button>
          </div>
        );
        
      case 'error':
        return (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">!</span>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Something Went Wrong</h2>
            <p className="text-gray-600 text-center mb-4">
              {errorMessage || "We encountered an issue while processing your order."}
            </p>
            <Button 
              variant="default" 
              className="bg-[#0C5C4C] hover:bg-[#0C5C4C]/90"
              onClick={() => window.location.href = '/'}
            >
              Return to Home
            </Button>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        {renderStatusContent()}
      </div>
    </div>
  );
};

export default OrderSuccess; 