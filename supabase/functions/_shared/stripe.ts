import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno&no-check';

// 注意：确保使用您的实际Stripe密钥
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

// 使用fetch HTTP客户端而不是Node.js的http模块
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
  maxNetworkRetries: 3, // 增加重试次数以提高可靠性
}); 