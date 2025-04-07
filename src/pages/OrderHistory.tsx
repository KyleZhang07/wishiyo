
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// 订单状态标签组件
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusProps = () => {
    switch (status) {
      case 'pending':
        return { icon: <Clock className="h-4 w-4 mr-1" />, color: 'bg-yellow-100 text-yellow-800' };
      case 'processing':
        return { icon: <Package className="h-4 w-4 mr-1" />, color: 'bg-blue-100 text-blue-800' };
      case 'shipped':
        return { icon: <Truck className="h-4 w-4 mr-1" />, color: 'bg-green-100 text-green-800' };
      case 'completed':
        return { icon: <CheckCircle className="h-4 w-4 mr-1" />, color: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { icon: <XCircle className="h-4 w-4 mr-1" />, color: 'bg-red-100 text-red-800' };
      default:
        return { icon: <Clock className="h-4 w-4 mr-1" />, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const { icon, color } = getStatusProps();
  
  return (
    <div className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon}
      <span className="capitalize">{status}</span>
    </div>
  );
};

// 订单类型接口
interface Order {
  order_id: string;
  title: string;
  status: string;
  timestamp: string;
  type: 'love_story' | 'funny_biography';
  shipping_address?: any;
  lulu_tracking_url?: string;
  lulu_print_status?: string;
}

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    // 从localStorage获取JWT
    const token = localStorage.getItem('order_verification_token');
    const storedOrders = localStorage.getItem('user_orders');
    const storedEmail = localStorage.getItem('verified_email');
    
    if (!token) {
      // 如果没有验证令牌，重定向到订单验证页面
      navigate('/verify-order');
      return;
    }
    
    if (storedEmail) {
      setEmail(storedEmail);
    }
    
    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch (error) {
        console.error('解析保存的订单数据失败:', error);
        toast({
          title: "加载订单失败",
          description: "无法加载保存的订单数据",
          variant: "destructive"
        });
        // 验证令牌存在但订单数据有问题，清除数据并重定向
        localStorage.removeItem('user_orders');
        navigate('/verify-order');
      }
    } else {
      setLoading(true);
      toast({
        title: "没有找到订单数据",
        description: "请重新验证您的邮箱",
        variant: "destructive"
      });
      // 验证令牌存在但没有订单数据，重定向
      navigate('/verify-order');
    }
  }, [navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewTracking = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        description: "暂无追踪信息",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('order_verification_token');
    localStorage.removeItem('user_orders');
    localStorage.removeItem('verified_email');
    navigate('/verify-order');
  };

  const getOrderTypeName = (type: string) => {
    return type === 'love_story' ? '爱情物语' : '传记书籍';
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          返回首页
        </button>
        <Button variant="outline" size="sm" onClick={handleLogout}>退出</Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-semibold mb-2">我的订单</h1>
        {email && <p className="text-gray-600 mb-4">邮箱: {email}</p>}
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">没有找到订单</h3>
            <p className="text-gray-500 mt-2">
              您还没有购买任何商品，或者使用的邮箱与订单不匹配。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单编号</TableHead>
                  <TableHead>图书名称</TableHead>
                  <TableHead>图书类型</TableHead>
                  <TableHead>订购日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-medium">{order.order_id}</TableCell>
                    <TableCell>{order.title || '未命名书籍'}</TableCell>
                    <TableCell>{getOrderTypeName(order.type)}</TableCell>
                    <TableCell>{formatDate(order.timestamp)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {order.lulu_tracking_url && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTracking(order.lulu_tracking_url || '')}
                        >
                          查看物流
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
