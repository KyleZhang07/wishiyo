import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { X, FileText, Book } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<Array<{
    id: string;
    title: string;
    format: string;
    price: string;
    editPath: string;
    interiorPdfUrl?: string;
    coverPdfUrl?: string;
  }>>([]);
  const [hasItems, setHasItems] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    const items = [];
    
    // 检查是否有Love Story书籍
    const loveTitle = localStorage.getItem('loveStoryBookTitle');
    const loveFormat = localStorage.getItem('loveStoryBookFormat');
    const lovePrice = localStorage.getItem('loveStoryBookPrice');
    const loveInteriorPdf = localStorage.getItem('loveStoryInteriorPdfUrl');
    const loveCoverPdf = localStorage.getItem('loveStoryCoverPdfUrl');
    
    if (loveTitle && loveFormat && lovePrice) {
      items.push({
        id: 'love-story',
        title: loveTitle,
        format: loveFormat,
        price: lovePrice,
        editPath: '/create/love/love-story/generate',
        interiorPdfUrl: loveInteriorPdf || undefined,
        coverPdfUrl: loveCoverPdf || undefined
      });
    }
    
    // 检查是否有Funny Biography书籍
    const funnyTitle = localStorage.getItem('funnyBiographyBookTitle');
    const funnyFormat = localStorage.getItem('funnyBiographyBookFormat');
    const funnyPrice = localStorage.getItem('funnyBiographyBookPrice');
    const funnyInteriorPdf = localStorage.getItem('funnyBiographyInteriorPdfUrl');
    const funnyCoverPdf = localStorage.getItem('funnyBiographyCoverPdfUrl');
    
    if (funnyTitle && funnyFormat && funnyPrice) {
      items.push({
        id: 'funny-biography',
        title: funnyTitle,
        format: funnyFormat,
        price: funnyPrice,
        editPath: '/create/friends/funny-biography/generate',
        interiorPdfUrl: funnyInteriorPdf || undefined,
        coverPdfUrl: funnyCoverPdf || undefined
      });
    }
    
    setCartItems(items);
    setHasItems(items.length > 0);
  }, []);

  // 处理PDF预览
  const handlePreviewPdf = (url: string, pdfType: string) => {
    if (!url) {
      toast({
        title: "PDF Not Available",
        description: `The ${pdfType} PDF is not available yet.`,
        variant: "destructive"
      });
      return;
    }
    
    // 在新窗口打开PDF
    window.open(url, '_blank');
  };

  const handleRemoveItem = (itemId: string) => {
    // 根据ID移除购物车中的商品
    if (itemId === 'love-story') {
      localStorage.removeItem('loveStoryBookTitle');
      localStorage.removeItem('loveStoryBookFormat');
      localStorage.removeItem('loveStoryBookPrice');
      localStorage.removeItem('loveStoryInteriorPdfUrl');
      localStorage.removeItem('loveStoryCoverPdfUrl');
    } else if (itemId === 'funny-biography') {
      localStorage.removeItem('funnyBiographyBookTitle');
      localStorage.removeItem('funnyBiographyBookFormat');
      localStorage.removeItem('funnyBiographyBookPrice');
      localStorage.removeItem('funnyBiographyInteriorPdfUrl');
      localStorage.removeItem('funnyBiographyCoverPdfUrl');
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
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCheckingOut(true);
    
    try {
      // 目前仅处理单个商品，如果有多个商品，使用第一个
      const item = cartItems[0];
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: item.id,
          title: item.title,
          format: item.format,
          price: item.price, 
          quantity: 1,
          interiorPdfUrl: item.interiorPdfUrl,
          coverPdfUrl: item.coverPdfUrl
        }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const { url, orderId } = await response.json();
      
      // 保存订单ID
      if (item.id === 'love-story') {
        localStorage.setItem('loveStoryOrderId', orderId);
      } else if (item.id === 'funny-biography') {
        localStorage.setItem('funnyBiographyOrderId', orderId);
      }
      
      // 重定向到Stripe结账页面
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: "An error occurred during checkout. Please try again.",
        variant: "destructive"
      });
      setIsCheckingOut(false);
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
                    
                    <div className="mt-6 flex flex-wrap gap-4">
                      <button 
                        onClick={() => handleEditContent(item.editPath)}
                        className="text-gray-600 hover:text-gray-900 flex items-center font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit content
                      </button>
                      
                      {/* PDF预览按钮 */}
                      {(item.interiorPdfUrl || item.coverPdfUrl) && (
                        <div className="flex gap-2">
                          {item.interiorPdfUrl && (
                            <button 
                              onClick={() => handlePreviewPdf(item.interiorPdfUrl!, 'Interior')}
                              className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
                            >
                              <FileText className="w-5 h-5 mr-2" />
                              Interior PDF
                            </button>
                          )}
                          
                          {item.coverPdfUrl && (
                            <button 
                              onClick={() => handlePreviewPdf(item.coverPdfUrl!, 'Cover')}
                              className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
                            >
                              <Book className="w-5 h-5 mr-2" />
                              Cover PDF
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end">
              <Button 
                onClick={handleCheckout}
                className="bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white px-8 py-3 text-lg"
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Processing...' : 'Checkout'}
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

export default Checkout;
