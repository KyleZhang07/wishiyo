import Stripe from 'https://esm.sh/stripe@11.18.0?target=deno'

// 使用更简单的配置初始化Stripe
export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  // 移除httpClient配置，使用默认的HTTP客户端
})
