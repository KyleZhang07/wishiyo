
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../integrations/supabase/client';

interface PromotionCode {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  usage_count: number;
  usage_limit: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_type: string | null;
}

const PromotionCodesPage = () => {
  const [codes, setCodes] = useState<PromotionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from now
    usage_limit: 100,
    product_type: 'all',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotion_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching promotion codes:', error);
      toast({
        title: "获取优惠码失败",
        description: "加载优惠码数据时出错",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async () => {
    try {
      if (!validateForm()) return;

      const { data, error } = await supabase
        .from('promotion_codes')
        .insert([{
          code: newCode.code.toUpperCase(),
          discount_type: newCode.discount_type,
          discount_value: newCode.discount_value,
          start_date: new Date(newCode.start_date).toISOString(),
          end_date: new Date(newCode.end_date).toISOString(),
          usage_limit: newCode.usage_limit || null,
          product_type: newCode.product_type === 'all' ? null : newCode.product_type,
          is_active: newCode.is_active
        }])
        .select();

      if (error) throw error;

      toast({
        title: "优惠码创建成功",
        description: `优惠码 "${newCode.code}" 已成功创建`,
      });

      // Reset form and refresh codes
      setNewCode({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        usage_limit: 100,
        product_type: 'all',
        is_active: true
      });
      fetchCodes();
    } catch (error) {
      console.error('Error creating promotion code:', error);
      toast({
        title: "创建优惠码失败",
        description: "创建新优惠码时出错",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotion_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `优惠码已${!currentStatus ? '激活' : '停用'}`,
        description: `优惠码状态已更改为${!currentStatus ? '激活' : '停用'}`,
      });

      fetchCodes();
    } catch (error) {
      console.error('Error toggling promotion code status:', error);
      toast({
        title: "更改优惠码状态失败",
        description: "更新优惠码状态时出错",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    if (!newCode.code.trim()) {
      toast({
        title: "表单错误",
        description: "优惠码不能为空",
        variant: "destructive",
      });
      return false;
    }

    if (newCode.discount_value <= 0) {
      toast({
        title: "表单错误",
        description: "优惠值必须大于0",
        variant: "destructive",
      });
      return false;
    }

    if (newCode.discount_type === 'percentage' && newCode.discount_value > 100) {
      toast({
        title: "表单错误",
        description: "百分比折扣不能大于100%",
        variant: "destructive",
      });
      return false;
    }

    const startDate = new Date(newCode.start_date);
    const endDate = new Date(newCode.end_date);
    if (endDate <= startDate) {
      toast({
        title: "表单错误",
        description: "结束日期必须晚于开始日期",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">优惠码管理</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">创建新优惠码</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">优惠码</label>
            <Input 
              value={newCode.code} 
              onChange={(e) => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
              placeholder="输入优惠码 (例如: SUMMER2025)"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">折扣类型</label>
            <Select 
              value={newCode.discount_type}
              onValueChange={(value) => setNewCode({...newCode, discount_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择折扣类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">百分比折扣 (%)</SelectItem>
                <SelectItem value="fixed_amount">固定金额折扣</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              折扣值 ({newCode.discount_type === 'percentage' ? '%' : '元'})
            </label>
            <Input 
              type="number"
              value={newCode.discount_value.toString()} 
              onChange={(e) => setNewCode({...newCode, discount_value: parseFloat(e.target.value) || 0})}
              placeholder="输入折扣值"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">产品类型</label>
            <Select 
              value={newCode.product_type}
              onValueChange={(value) => setNewCode({...newCode, product_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择产品类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有产品</SelectItem>
                <SelectItem value="love_story">爱情故事</SelectItem>
                <SelectItem value="funny_biography">趣味传记</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">开始日期</label>
            <div className="relative">
              <Input 
                type="date"
                value={newCode.start_date} 
                onChange={(e) => setNewCode({...newCode, start_date: e.target.value})}
              />
              <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">结束日期</label>
            <div className="relative">
              <Input 
                type="date"
                value={newCode.end_date} 
                onChange={(e) => setNewCode({...newCode, end_date: e.target.value})}
              />
              <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">使用限制 (0 = 无限制)</label>
            <Input 
              type="number"
              value={newCode.usage_limit?.toString() || ''} 
              onChange={(e) => setNewCode({...newCode, usage_limit: parseInt(e.target.value) || null})}
              placeholder="输入最大使用次数"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-7">
            <input
              type="checkbox"
              id="isActive"
              checked={newCode.is_active}
              onChange={(e) => setNewCode({...newCode, is_active: e.target.checked})}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium">立即激活</label>
          </div>
        </div>
        
        <Button className="mt-6" onClick={handleCreateCode}>创建优惠码</Button>
      </div>

      <Separator className="my-6" />

      <h2 className="text-xl font-semibold mb-4">现有优惠码</h2>
      
      {loading ? (
        <div className="text-center py-8">加载优惠码...</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>优惠码</TableHead>
                <TableHead>折扣类型</TableHead>
                <TableHead>折扣值</TableHead>
                <TableHead>产品类型</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead>使用情况</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    没有找到优惠码
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-medium">{code.code}</TableCell>
                    <TableCell>
                      {code.discount_type === 'percentage' ? '百分比折扣' : '固定金额折扣'}
                    </TableCell>
                    <TableCell>
                      {code.discount_value}{code.discount_type === 'percentage' ? '%' : '元'}
                    </TableCell>
                    <TableCell>
                      {code.product_type === null ? '所有产品' : 
                       code.product_type === 'love_story' ? '爱情故事' : 
                       code.product_type === 'funny_biography' ? '趣味传记' : 
                       code.product_type}
                    </TableCell>
                    <TableCell>
                      {format(new Date(code.start_date), 'yyyy-MM-dd')} 至 {format(new Date(code.end_date), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      {code.usage_count} / {code.usage_limit === null ? '无限制' : code.usage_limit}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        code.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {code.is_active ? '激活' : '停用'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={code.is_active ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleActive(code.id, code.is_active)}
                      >
                        {code.is_active ? '停用' : '激活'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PromotionCodesPage;
