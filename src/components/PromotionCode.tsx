
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import axios from 'axios';

interface PromotionCodeProps {
  onApplyCode: (discount: number, code: string) => void;
  onClearCode: () => void;
  disabled?: boolean;
}

const PromotionCode: React.FC<PromotionCodeProps> = ({ onApplyCode, onClearCode, disabled = false }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApplyCode = async () => {
    if (!code.trim()) {
      toast({
        title: "输入错误",
        description: "请输入优惠码",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/promotion-codes', { code: code.trim() });
      
      if (response.data.valid) {
        const discountValue = response.data.discount_value;
        const discountType = response.data.discount_type;
        
        // Calculate discount amount based on discount type
        let discountAmount = 0;
        if (discountType === 'percentage') {
          discountAmount = discountValue / 100;
        } else if (discountType === 'fixed_amount') {
          discountAmount = discountValue;
        }
        
        setAppliedCode(code);
        onApplyCode(discountAmount, code);
        
        toast({
          title: "优惠码已应用",
          description: `优惠码 "${code}" 已成功应用到订单`,
          variant: "default",
        });
      } else {
        toast({
          title: "无效的优惠码",
          description: response.data.message || "此优惠码无效或已过期",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error applying promotion code:", error);
      toast({
        title: "应用优惠码失败",
        description: "处理您的优惠码时出错，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCode = () => {
    setCode('');
    setAppliedCode(null);
    onClearCode();
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="输入优惠码"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1"
          disabled={disabled || !!appliedCode}
        />
        {!appliedCode ? (
          <Button 
            onClick={handleApplyCode} 
            disabled={loading || disabled || !code.trim()}
            className="whitespace-nowrap"
          >
            {loading ? "应用中..." : "应用优惠码"}
          </Button>
        ) : (
          <Button 
            onClick={handleClearCode}
            variant="outline"
            className="whitespace-nowrap"
          >
            清除优惠码
          </Button>
        )}
      </div>
      {appliedCode && (
        <div className="text-sm text-green-600">
          优惠码 "{appliedCode}" 已应用
        </div>
      )}
    </div>
  );
};

export default PromotionCode;
