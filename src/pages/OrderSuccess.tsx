import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const OrderSuccess = () => {
  const location = useLocation();
  // 从URL查询参数中获取订单ID
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('order_id') || 'WY-UNKNOWN';
  
  // 根据URL参数或localStorage获取书籍信息
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookFormat, setBookFormat] = useState<string>('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // 配送信息
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    email: '',
    phone: ''
  });
  
  useEffect(() => {
    // 根据订单ID前缀判断是哪类书籍
    if (orderId.startsWith('WY-')) {
      const loveTitle = localStorage.getItem('loveStoryBookTitle');
      const loveFormat = localStorage.getItem('loveStoryBookFormat');
      if (loveTitle) setBookTitle(loveTitle);
      if (loveFormat) setBookFormat(loveFormat);
      
      // 如果找不到Love Story的信息，尝试Funny Biography
      if (!loveTitle) {
        const funnyTitle = localStorage.getItem('funnyBiographyBookTitle');
        const funnyFormat = localStorage.getItem('funnyBiographyBookFormat');
        if (funnyTitle) setBookTitle(funnyTitle);
        if (funnyFormat) setBookFormat(funnyFormat);
      }
    }
  }, [orderId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCountryChange = (value: string) => {
    setShippingInfo(prev => ({ ...prev, country: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 在这里，您可以将配送信息保存到数据库
    // 例如，调用Supabase函数或API
    
    // 模拟成功
    setFormSubmitted(true);
    toast({
      title: "Thank you!",
      description: "Your shipping information has been saved.",
    });
    
    // 清除购物车数据
    localStorage.removeItem('loveStoryBookTitle');
    localStorage.removeItem('loveStoryBookFormat');
    localStorage.removeItem('loveStoryBookPrice');
    localStorage.removeItem('loveStoryOrderId');
    localStorage.removeItem('funnyBiographyBookTitle');
    localStorage.removeItem('funnyBiographyBookFormat');
    localStorage.removeItem('funnyBiographyBookPrice');
    localStorage.removeItem('funnyBiographyOrderId');
  };
  
  return (
    <div className="min-h-screen bg-[#FFFAF5] py-12">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-xl text-gray-600 mb-2">Your payment was successful</p>
          <p className="text-gray-500 mb-6">Order ID: {orderId}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <p className="font-medium text-lg">{bookTitle || 'Custom Book'}</p>
              <p className="text-gray-600">{bookFormat || 'Digital Format'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">1 item</p>
            </div>
          </div>
          <p className="text-gray-700">
            Your book will be processed and shipped within 3-5 business days after we receive your shipping information.
          </p>
        </div>
        
        {!formSubmitted ? (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>
                Please provide your shipping address to receive your book.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    name="fullName" 
                    value={shippingInfo.fullName} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={shippingInfo.email} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={shippingInfo.phone} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Input 
                    id="address1" 
                    name="address1" 
                    value={shippingInfo.address1} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                  <Input 
                    id="address2" 
                    name="address2" 
                    value={shippingInfo.address2} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={shippingInfo.city} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input 
                      id="state" 
                      name="state" 
                      value={shippingInfo.state} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                    <Input 
                      id="zipCode" 
                      name="zipCode" 
                      value={shippingInfo.zipCode} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={shippingInfo.country} 
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/80">
                  Save Shipping Information
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Set!</CardTitle>
              <CardDescription>
                Your shipping information has been saved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-700 mb-4">
                We'll send you a confirmation email with your order details.
                Your book will be shipped within 3-5 business days.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                onClick={() => window.location.href = '/'} 
                className="bg-[#FF7F50] hover:bg-[#FF7F50]/80"
              >
                Return Home
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess; 