import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0'

console.log('Generate-book function started')

interface BookGenerationRequest {
  orderId: string
  title: string
  format: string
  shippingAddress: {
    name: string
    address: {
      line1: string
      line2: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
  shippingOption: {
    shipping_rate: string
    display_name: string
    delivery_estimate: {
      minimum: { unit: string, value: number }
      maximum: { unit: string, value: number }
    }
  }
  customer: {
    email: string
  }
}

serve(async (req) => {
  // Create a Supabase client with the Auth context of the logged in user
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  try {
    // 解析请求数据
    const input: BookGenerationRequest = await req.json()

    // 验证必要字段
    if (!input.orderId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required field: orderId' 
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log(`Processing book generation for order: ${input.orderId}`)

    // 从数据库获取保存的书籍数据
    const { data: bookData, error: fetchError } = await supabaseClient
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', input.orderId)
      .single()

    if (fetchError) {
      console.error('Error fetching book data:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch book data: ${fetchError.message}` 
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    if (!bookData) {
      console.error('No book data found for order ID:', input.orderId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No book data found for the given order ID' 
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // 更新书籍状态和配送信息
    const { error: updateError } = await supabaseClient
      .from('funny_biography_books')
      .update({
        status: 'processing',
        shipping_address: input.shippingAddress,
        shipping_option: input.shippingOption,
        customer_email: input.customer.email
      })
      .eq('order_id', input.orderId)

    if (updateError) {
      console.error('Error updating book status:', updateError)
      // 继续处理，不中断流程
    }

    // 在这里实现PDF生成逻辑
    // 这里仅示例，实际需要根据bookData的内容生成PDF
    console.log('Book data available:', {
      title: bookData.title,
      author: bookData.author,
      chapters: bookData.chapters ? bookData.chapters.length : 0,
      hasImages: !!bookData.images
    })

    // 模拟异步处理
    // 实际实现中，这里会是调用PDF生成服务等
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新状态为已处理
    const { error: finalUpdateError } = await supabaseClient
      .from('funny_biography_books')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('order_id', input.orderId)

    if (finalUpdateError) {
      console.error('Error updating final book status:', finalUpdateError)
      // 继续处理，不中断流程
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Book generation initiated for order ${input.orderId}`,
        details: {
          title: input.title,
          format: input.format,
          shipping: input.shippingAddress.city
        }
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}` 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})