
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentElement, useStripe as useStripeElements, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useStripe as useStripeContext } from './StripeProvider';
import { CardIcon, HomeIcon, LockIcon, AppleIcon } from 'lucide-react';

interface CheckoutFormProps {
  itemTitle: string;
  price: string;
  onBack: () => void;
}

interface ShippingAddress {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ itemTitle, price, onBack }) => {
  const navigate = useNavigate();
  const stripe = useStripeElements();
  const elements = useElements();
  const { toast } = useToast();
  const { clientSecret } = useStripeContext();

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
        payment_method_data: {
          billing_details: {
            email: email,
            phone: phoneNumber,
            address: {
              line1: shippingAddress.addressLine1,
              line2: shippingAddress.addressLine2,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zip,
            },
            name: shippingAddress.name,
          },
        },
      },
    });

    if (error) {
      setLoading(false);
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred during payment.",
        variant: "destructive",
      });
    } else {
      // Payment succeeded (should redirect to return_url)
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Contact Information</h2>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-2 border border-gray-300 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium">Shipping Address</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full p-2 border border-gray-300 rounded"
                value={shippingAddress.name}
                onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                id="address1"
                className="w-full p-2 border border-gray-300 rounded"
                value={shippingAddress.addressLine1}
                onChange={(e) => setShippingAddress({...shippingAddress, addressLine1: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                id="address2"
                className="w-full p-2 border border-gray-300 rounded"
                value={shippingAddress.addressLine2}
                onChange={(e) => setShippingAddress({...shippingAddress, addressLine2: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                id="zip"
                className="w-full p-2 border border-gray-300 rounded"
                value={shippingAddress.zip}
                onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                className="w-full p-2 border border-gray-300 rounded"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium">Payment Information</h2>
            <PaymentElement />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="same-address"
              checked={billingSameAsShipping}
              onChange={() => setBillingSameAsShipping(!billingSameAsShipping)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="same-address" className="text-sm text-gray-700">
              Billing is same as shipping
            </label>
          </div>

          <div className="flex flex-col space-y-3">
            <Button 
              type="submit" 
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
              disabled={!stripe || loading}
            >
              <LockIcon className="mr-2 h-4 w-4" />
              {loading ? "Processing..." : `Pay $${parseFloat(price).toFixed(2)}`}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border border-gray-300 py-3"
              onClick={onBack}
              disabled={loading}
            >
              Continue Shopping
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full border border-black bg-black text-white py-3"
              disabled={loading}
            >
              <AppleIcon className="mr-2 h-4 w-4" />
              Pay
            </Button>
          </div>
        </form>
      </div>

      <div className="col-span-1">
        <div className="bg-gray-50 p-6 rounded">
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>
          
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-16 h-20 bg-gray-200 flex-shrink-0"></div>
            <div>
              <h3 className="font-medium">{itemTitle}</h3>
              <p className="text-sm text-gray-500">Your personalized AI-generated book</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${parseFloat(price).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Standard Shipping</span>
              <span>$0.00</span>
            </div>
            
            <div className="flex justify-between font-medium border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span>${parseFloat(price).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
