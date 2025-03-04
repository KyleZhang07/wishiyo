import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno&no-check'

// 简化Stripe初始化，使用Deno兼容的配置
export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(), // 使用Fetch API而不是Node.js的http模块
  maxNetworkRetries: 3, // 增加重试次数以提高可靠性
})
