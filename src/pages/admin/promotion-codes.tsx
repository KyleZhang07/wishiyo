import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface PromotionCode {
  id: number;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  product_type: string | null;
  stripe_promotion_code_id: string | null;
  stripe_coupon_id: string | null;
}

const PromotionCodesPage: React.FC = () => {
  const supabase = useSupabaseClient();
  const [promotionCodes, setPromotionCodes] = useState<PromotionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: null as number | null,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30天后
    is_active: true,
    usage_limit: null as number | null,
    product_type: null as string | null
  });

  // 加载促销码
  const loadPromotionCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/promotion-codes');
      if (!response.ok) {
        throw new Error('Failed to fetch promotion codes');
      }
      const data = await response.json();
      setPromotionCodes(data.data || []);
    } catch (error) {
      console.error('Error loading promotion codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promotion codes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadPromotionCodes();
  }, []);

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? null : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // 处理选择框变化
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 处理复选框变化
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // 创建促销码
  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/promotion-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create promotion code');
      }
      
      toast({
        title: 'Success',
        description: 'Promotion code created successfully',
      });
      
      // 重置表单并刷新列表
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_purchase_amount: 0,
        max_discount_amount: null,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        is_active: true,
        usage_limit: null,
        product_type: null
      });
      setShowForm(false);
      loadPromotionCodes();
    } catch (error: any) {
      console.error('Error creating promotion code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create promotion code',
        variant: 'destructive'
      });
    }
  };

  // 切换促销码状态
  const togglePromoCodeStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/promotion-codes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          is_active: !currentStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update promotion code');
      }
      
      toast({
        title: 'Success',
        description: `Promotion code ${currentStatus ? 'disabled' : 'enabled'} successfully`,
      });
      
      loadPromotionCodes();
    } catch (error: any) {
      console.error('Error updating promotion code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update promotion code',
        variant: 'destructive'
      });
    }
  };

  // 删除促销码
  const deletePromoCode = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promotion code?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/promotion-codes?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete promotion code');
      }
      
      toast({
        title: 'Success',
        description: 'Promotion code deleted successfully',
      });
      
      loadPromotionCodes();
    } catch (error: any) {
      console.error('Error deleting promotion code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete promotion code',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Promotion Codes</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create New Promotion Code'}
        </Button>
      </div>
      
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Promotion Code</CardTitle>
            <CardDescription>Fill in the details to create a new promotion code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePromoCode} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="SUMMER2024"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Summer Sale 2024"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => handleSelectChange('discount_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {formData.discount_type === 'percentage' ? 'Discount Percentage' : 'Discount Amount ($)'}
                  </Label>
                  <Input
                    id="discount_value"
                    name="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    min={0}
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    step={formData.discount_type === 'percentage' ? 1 : 0.01}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min_purchase_amount">Minimum Purchase Amount ($)</Label>
                  <Input
                    id="min_purchase_amount"
                    name="min_purchase_amount"
                    type="number"
                    value={formData.min_purchase_amount}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                  />
                </div>
                
                {formData.discount_type === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="max_discount_amount">Maximum Discount Amount ($)</Label>
                    <Input
                      id="max_discount_amount"
                      name="max_discount_amount"
                      type="number"
                      value={formData.max_discount_amount === null ? '' : formData.max_discount_amount}
                      onChange={handleInputChange}
                      min={0}
                      step={0.01}
                      placeholder="No limit"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    name="usage_limit"
                    type="number"
                    value={formData.usage_limit === null ? '' : formData.usage_limit}
                    onChange={handleInputChange}
                    min={1}
                    placeholder="No limit"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="product_type">Product Type</Label>
                  <Select
                    value={formData.product_type || ''}
                    onValueChange={(value) => handleSelectChange('product_type', value === '' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All products</SelectItem>
                      <SelectItem value="funny-biography">Funny Biography</SelectItem>
                      <SelectItem value="love-story">Love Story</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleCheckboxChange('is_active', checked as boolean)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              
              <Button type="submit" className="mt-4">Create Promotion Code</Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {promotionCodes.length === 0 ? (
            <div className="text-center py-8">No promotion codes found</div>
          ) : (
            promotionCodes.map((promo) => (
              <Card key={promo.id} className={!promo.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <span className="text-xl font-mono">{promo.code}</span>
                        {promo.is_active ? (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                        ) : (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Inactive</span>
                        )}
                      </CardTitle>
                      <CardDescription>{promo.description || 'No description'}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePromoCodeStatus(promo.id, promo.is_active)}
                      >
                        {promo.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePromoCode(promo.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Discount</p>
                      <p>
                        {promo.discount_type === 'percentage'
                          ? `${promo.discount_value}% off`
                          : `$${promo.discount_value.toFixed(2)} off`}
                      </p>
                      {promo.min_purchase_amount > 0 && (
                        <p className="text-gray-500">Min. purchase: ${promo.min_purchase_amount.toFixed(2)}</p>
                      )}
                      {promo.discount_type === 'percentage' && promo.max_discount_amount && (
                        <p className="text-gray-500">Max. discount: ${promo.max_discount_amount.toFixed(2)}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">Validity</p>
                      <p>From: {new Date(promo.start_date).toLocaleDateString()}</p>
                      <p>To: {new Date(promo.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Usage</p>
                      <p>Used: {promo.usage_count} times</p>
                      {promo.usage_limit && (
                        <p className="text-gray-500">
                          Limit: {promo.usage_limit} ({promo.usage_limit - promo.usage_count} remaining)
                        </p>
                      )}
                      {promo.product_type && (
                        <p className="text-gray-500">
                          Product: {promo.product_type === 'funny-biography' ? 'Funny Biography' : 'Love Story'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PromotionCodesPage;
