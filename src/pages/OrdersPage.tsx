import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const OrdersPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);
  
  // 发送所有准备好打印的订单到Lulu Press
  const sendReadyOrdersToPrint = async () => {
    try {
      setIsSubmitting(true);
      setResult(null);
      
      // 调用API发送打印请求
      const response = await fetch('/api/order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autoSubmit: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: `成功发送 ${data.submittedCount || 0} 个订单到打印服务`
        });
      } else {
        setResult({
          success: false,
          message: data.error || '发送打印请求失败'
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || '发送打印请求时出错'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8 text-center">订单打印管理</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>发送准备好的订单到打印服务</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={sendReadyOrdersToPrint} 
              disabled={isSubmitting}
              className="w-full md:w-auto"
              size="lg"
            >
              <Printer className="mr-2 h-5 w-5" />
              {isSubmitting ? '正在发送...' : '发送所有准备好的订单到Lulu Press'}
            </Button>
            
            {isSubmitting && (
              <div className="w-full flex justify-center">
                <Skeleton className="h-4 w-3/4 max-w-md" />
              </div>
            )}
            
            {result && (
              <div className={`flex items-center p-4 rounded-md w-full ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {result.success ? (
                  <CheckCircle className="mr-2 h-5 w-5" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5" />
                )}
                <span>{result.message}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
