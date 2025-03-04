
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Use Stripe test public key
const stripePromise = loadStripe('pk_test_51PFNOzEEQCrVMp7FyCSrmEsxSaemq0SHUBYnENOoGn36bI1UZOUzN9tSyXdIQ9GwVIQzUumWKLjPgYtSbpk0RO9Q00zrNnXoKq');

type StripeContextType = {
  clientSecret: string | null;
  setClientSecret: React.Dispatch<React.SetStateAction<string | null>>;
};

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#FF7F50',
      },
    },
  } : {};

  return (
    <StripeContext.Provider value={{ clientSecret, setClientSecret }}>
      <Elements stripe={stripePromise} options={options as any}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};
