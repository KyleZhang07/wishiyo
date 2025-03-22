import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingBag, Clock, Calendar, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

// 验证表单的 schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// 订单状态映射
const statusMap: Record<string, { label: string, color: string }> = {
  'processing': { label: 'Processing', color: 'bg-gray-500' },
  'completed': { label: 'Generation Completed', color: 'bg-blue-500' },
  'pdf_generated': { label: 'PDF Generated', color: 'bg-indigo-500' },
  'print_submitted': { label: 'Print Submitted', color: 'bg-purple-500' },
  'SUBMITTED': { label: 'Printing', color: 'bg-amber-500' },
  'SHIPPED': { label: 'Shipped', color: 'bg-green-500' },
  'DELIVERED': { label: 'Delivered', color: 'bg-emerald-500' },
};

// 获取状态显示信息
const getStatusInfo = (order: any) => {
  // 优先检查 lulu_print_status
  if (order.lulu_print_status && statusMap[order.lulu_print_status]) {
    return statusMap[order.lulu_print_status];
  }
  
  // 其次检查 status
  if (order.status && statusMap[order.status]) {
    return statusMap[order.status];
  }
  
  // 默认值
  return { label: order.status || 'Processing', color: 'bg-gray-500' };
};

// 获取书籍类型显示名称
const getBookTypeName = (type: string) => {
  if (type === 'love_story') return 'Illustrated Love Story';
  if (type === 'funny_biography') return 'Personalized Biography';
  return type;
};

const OrdersPage = () => {
  // const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true); // 默认为已验证状态
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [isSubmittingPrint, setIsSubmittingPrint] = useState(false);
  
  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });
  
  // 页面加载时自动获取所有订单
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        setIsLoading(true);
        
        // 调用 API 获取所有订单，不传递邮箱参数
        const response = await fetch(`/api/user-orders?all=true`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch orders');
        }
        
        if (data.success) {
          setOrders(data.orders || []);
        } else {
          throw new Error(data.error || 'Failed to fetch orders');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching orders');
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllOrders();
  }, []);
  
  // 手动触发向Lulu发送打印请求
  const handleManualPrintRequest = async (orderId: string, bookType: string) => {
    try {
      // 查找订单并检查是否准备好打印
      const orderToSubmit = orders.find(order => order.order_id === orderId);
      
      if (!orderToSubmit) {
        throw new Error('订单未找到');
      }
      
      // 检查订单是否准备好打印
      if (orderToSubmit.ready_for_printing !== true) {
        toast({
          title: "无法提交打印请求",
          description: "该订单尚未准备好打印，请等待内容生成完成。",
          variant: "destructive",
        });
        return;
      }
      
      // 检查订单是否已经提交过打印请求
      if (orderToSubmit.print_submission_date || 
          ['print_submitted', 'SUBMITTED', 'SHIPPED', 'DELIVERED'].includes(orderToSubmit.status)) {
        toast({
          title: "无法提交打印请求",
          description: "该订单已经提交过打印请求。",
          variant: "destructive",
        });
        return;
      }
      
      setIsSubmittingPrint(true);
      
      // 确定书籍类型
      const type = bookType === 'love_story' ? 'love_story' : 'funny_biography';
      
      // 调用API发送打印请求
      const response = await fetch('/api/lulu-print-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          type
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit print request');
      }
      
      if (data.success) {
        toast({
          title: "打印请求已提交",
          description: `订单 ${orderId} 的打印请求已成功提交到LuluPress。`,
          variant: "default",
        });
        
        // 刷新订单列表
        const updatedOrders = orders.map(order => {
          if (order.order_id === orderId) {
            return {
              ...order,
              status: 'print_submitted',
              lulu_print_status: 'SUBMITTED',
              print_submission_date: new Date().toISOString()
            };
          }
          return order;
        });
        
        setOrders(updatedOrders);
      } else {
        throw new Error(data.error || 'Failed to submit print request');
      }
    } catch (err: any) {
      console.error('Error submitting print request:', err);
      toast({
        title: "打印请求失败",
        description: err.message || 'An error occurred while submitting the print request',
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPrint(false);
    }
  };
  
  // 提交表单 - 暂时不使用
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // 此函数暂时不使用
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-24">
      <Toaster />
      <h1 className="text-3xl font-bold mb-8 text-center">My Orders</h1>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            All Orders
          </h2>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-1/2" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Orders Found</h3>
              <p className="text-gray-500">
                We couldn't find any orders.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order);
              
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.title || 'Custom Book'}</CardTitle>
                        <CardDescription>
                          Order ID: {order.order_id}
                        </CardDescription>
                      </div>
                      <Badge className={`${statusInfo.color} text-white`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span>{getBookTypeName(order.book_type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Ordered: {formatDate(order.timestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="text-sm text-gray-500 border-t pt-3">
                    <div className="flex justify-between items-center w-full">
                      <div>
                        {order.print_submission_date && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Print submitted: {formatDate(order.print_submission_date)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 手动打印按钮 - 仅显示在符合条件的订单上 */}
                      {order.ready_for_printing === true && 
                       !order.print_submission_date && 
                       !['print_submitted', 'SUBMITTED', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          onClick={() => handleManualPrintRequest(order.order_id, order.book_type)}
                          disabled={isSubmittingPrint}
                        >
                          <Printer className="h-4 w-4" />
                          <span>发送到LuluPress</span>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
