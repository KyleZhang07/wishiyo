
import Stripe from 'https://esm.sh/stripe@12.16.0?target=deno&no-check'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})
