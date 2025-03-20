import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Package, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [orderStatus, setOrderStatus] = useState<{ [key: string]: any } | null>(null);
  const navigate = useNavigate();

  // 从localStorage获取订单信息
  useEffect(() => {
    const loveStoryOrderId = localStorage.getItem('loveStoryOrderId');
    const funnyBiographyOrderId = localStorage.getItem('funnyBiographyOrderId');
    
    // 如果有订单ID，检查订单状态
    if (loveStoryOrderId || funnyBiographyOrderId) {
      setHasActiveOrder(true);
      
      const checkOrderStatus = async () => {
        try {
          const orderId = loveStoryOrderId || funnyBiographyOrderId;
          const type = loveStoryOrderId ? 'love_story' : 'funny_biography';
          
          const response = await fetch(`/api/order-status?orderId=${orderId}&type=${type}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.order) {
              setOrderStatus(data.order);
            }
          }
        } catch (error) {
          console.error('Error checking order status:', error);
        }
      };
      
      // 立即检查一次
      checkOrderStatus();
      
      // 每60秒检查一次
      const interval = setInterval(checkOrderStatus, 60000);
      
      return () => clearInterval(interval);
    }
  }, []);

  // 获取订单状态的文本描述
  const getOrderStatusText = () => {
    if (!orderStatus) return 'Unknown';
    
    // 根据状态返回描述
    if (orderStatus.print_status === 'SUBMITTED') return 'Printing in progress';
    if (orderStatus.print_status === 'SHIPPED') return 'Shipped';
    if (orderStatus.print_status === 'DELIVERED') return 'Delivered';
    
    // 根据ready_for_printing和status判断
    if (orderStatus.ready_for_printing) {
      if (orderStatus.status === 'print_submitted') return 'Print job submitted';
      return 'Ready for printing';
    }
    
    // 其他情况
    if (orderStatus.status === 'processing') return 'Processing';
    if (orderStatus.status === 'completed') return 'Generation completed';
    if (orderStatus.status === 'pdf_generated') return 'PDF Generated';
    
    return orderStatus.status || 'Processing';
  };

  // 获取订单状态的颜色
  const getOrderStatusColor = () => {
    if (!orderStatus) return 'bg-gray-400';
    
    if (orderStatus.print_status === 'SHIPPED' || orderStatus.print_status === 'DELIVERED') 
      return 'bg-green-500';
    if (orderStatus.print_status === 'SUBMITTED') 
      return 'bg-blue-500';
    if (orderStatus.ready_for_printing) 
      return 'bg-amber-500';
    
    return 'bg-gray-500';
  };

  return <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-display font-semibold pl-4">WISHIYO</Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/friends" className="text-gray-600 hover:text-primary transition-colors">Personalized Book</Link>
              <Link to="/love" className="text-gray-600 hover:text-primary transition-colors">Illustrated Book</Link>
            </nav>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 pr-4">
            {hasActiveOrder && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Package className="h-5 w-5" />
                    <span className={`absolute -top-0.5 -right-0.5 rounded-full w-2.5 h-2.5 ${getOrderStatusColor()}`}></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Order Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {orderStatus && (
                    <>
                      <DropdownMenuItem className="flex flex-col items-start">
                        <span className="font-semibold">{orderStatus.title || 'Your Book'}</span>
                        <span className="text-sm text-gray-500">ID: {orderStatus.order_id}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Badge variant="outline" className={`mr-2 ${getOrderStatusColor().replace('bg-', 'border-')} text-gray-700`}>
                          {getOrderStatusText()}
                        </Badge>
                      </DropdownMenuItem>
                      {orderStatus.print_submission_date && (
                        <DropdownMenuItem className="text-xs text-gray-500">
                          Submitted: {new Date(orderStatus.print_submission_date).toLocaleString()}
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {!orderStatus && (
                    <DropdownMenuItem>Loading order information...</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/order-success')}>
                    View Order Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {hasActiveOrder && (
              <Button variant="ghost" size="icon" className="relative mr-2" onClick={() => navigate('/order-success')}>
                <Package className="h-5 w-5" />
                <span className={`absolute -top-0.5 -right-0.5 rounded-full w-2.5 h-2.5 ${getOrderStatusColor()}`}></span>
              </Button>
            )}
            <button className="p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <nav className="md:hidden py-4 space-y-4">
            <Link to="/" className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/friends" className="block px-4 py-2 text-amber-600 hover:text-amber-700 transition-colors" onClick={() => setIsMenuOpen(false)}>
              Personalized Book
            </Link>
            <Link to="/love" className="block px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setIsMenuOpen(false)}>
              Illustrated Book
            </Link>
          </nav>}
      </div>
    </header>;
};
export default Header;