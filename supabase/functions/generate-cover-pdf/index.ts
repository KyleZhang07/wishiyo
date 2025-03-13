
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 添加Deno类型声明，避免TypeScript错误
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frontCover, spine, backCover, orderId } = await req.json();

    console.log('Received request for PDF generation with order ID:', orderId);
    console.log('Front cover URL:', frontCover ? `${frontCover.substring(0, 40)}...` : 'undefined');
    console.log('Spine URL:', spine ? `${spine.substring(0, 40)}...` : 'undefined');
    console.log('Back cover URL:', backCover ? `${backCover.substring(0, 40)}...` : 'undefined');
    
    if (!frontCover || !spine || !backCover) {
      throw new Error('Missing required cover image URLs');
    }

    console.log('Processing cover image URLs for PDF generation');

    // 获取Supabase连接信息
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 从URL获取图片数据
    async function getImageFromUrl(imageUrl: string): Promise<string> {
      try {
        console.log(`Processing image URL: ${imageUrl.substring(0, 50)}...`);
        
        // 处理已经是base64数据的情况
        if (imageUrl.startsWith('data:')) {
          console.log('Image is already in data URI format - extracting base64 data');
          return imageUrl;
        }

        console.log(`Fetching image from URL: ${imageUrl}`);
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`);
        }
        
        // 获取内容类型
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        console.log(`Content type of fetched image: ${contentType}`);
        
        // 如果是PDF文件，需要特殊处理
        if (contentType.includes('application/pdf')) {
          console.log('Image URL points to a PDF file, converting to image for PDF generation...');
          // 对于PDF，我们需要转换成图像 - 简化起见，这里返回一个错误
          throw new Error(`URL points to a PDF file, not an image: ${imageUrl}`);
        }
        
        // 获取图片数据
        const arrayBuffer = await response.arrayBuffer();
        console.log(`Image data received, size: ${arrayBuffer.byteLength} bytes`);
        
        // 将ArrayBuffer转换为base64
        const base64String = btoa(
          new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        const dataUri = `data:${contentType};base64,${base64String}`;
        console.log(`Successfully converted image to data URI, length: ${dataUri.length}`);
        
        return dataUri;
      } catch (error) {
        console.error(`Error downloading image from ${imageUrl.substring(0, 50)}...:`, error);
        throw error;
      }
    }

    // 将PDF上传到存储桶并返回公共URL
    async function uploadPdfToStorage(pdfData: string, fileName: string): Promise<string> {
      try {
        console.log(`Preparing to upload ${fileName} to storage, data length: ${pdfData.length}`);
        
        // 检查存储桶是否存在
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          console.error('Error listing buckets:', bucketsError);
          throw bucketsError;
        }
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'book-covers');
        
        // 如果存储桶不存在，则创建
        if (!bucketExists) {
          console.log(`Storage bucket 'book-covers' does not exist, creating...`);
          const { error: createBucketError } = await supabase
            .storage
            .createBucket('book-covers', {
              public: true
            });
          
          if (createBucketError) {
            console.error(`Failed to create storage bucket:`, createBucketError);
            throw createBucketError;
          } else {
            console.log(`Storage bucket 'book-covers' created successfully`);
          }
        }
        
        // 从base64 Data URI中提取PDF数据
        let base64Data;
        if (pdfData.includes(',')) {
          base64Data = pdfData.split(',')[1];
          console.log(`Extracted base64 data from Data URI, length: ${base64Data.length}`);
        } else {
          console.log('PDF data does not contain a comma, using as is');
          base64Data = pdfData;
        }
        
        // 将base64转换为Uint8Array
        const binaryString = atob(base64Data);
        console.log(`Converted base64 to binary string, length: ${binaryString.length}`);
        
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log(`Created Uint8Array for upload, size: ${bytes.length} bytes`);
        
        // 上传到Supabase Storage
        const filePath = `${orderId}/${fileName}`;
        console.log(`Uploading to book-covers/${filePath}`);
        const { error: uploadError } = await supabase
          .storage
          .from('book-covers')
          .upload(filePath, bytes, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`Failed to upload PDF:`, uploadError);
          throw uploadError;
        }
        
        console.log(`PDF uploaded successfully to storage`);
        
        // 获取公共URL
        const { data: urlData } = supabase
          .storage
          .from('book-covers')
          .getPublicUrl(filePath);
        
        const publicUrl = urlData?.publicUrl || '';
        console.log(`Generated public URL: ${publicUrl}`);
        
        return publicUrl;
      } catch (error) {
        console.error(`Error uploading PDF to storage:`, error);
        console.error(error.stack || error); // 打印完整错误栈
        return '';
      }
    }

    console.log('Starting to download and process images');
    
    // 获取所有图片的base64数据
    const frontCoverData = await getImageFromUrl(frontCover);
    console.log('Front cover processed successfully, data length:', frontCoverData.length);
    
    const spineData = await getImageFromUrl(spine);
    console.log('Spine processed successfully, data length:', spineData.length);
    
    const backCoverData = await getImageFromUrl(backCover);
    console.log('Back cover processed successfully, data length:', backCoverData.length);
    
    console.log('All images downloaded and processed successfully');

    // Create a new PDF with appropriate dimensions
    // Standard book cover dimensions with bleed (8.5 x 11 inches plus bleed)
    console.log('Creating PDF document');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [17 + 0.25, 11 + 0.25] // Width (front + spine + back) x Height with 0.125" bleed on each side
    });

    // Calculate positions (with bleed area)
    const bleed = 0.125;
    const frontCoverWidth = 8.5;
    const spineWidth = 0.5; // Example spine width, would depend on page count
    const backCoverWidth = 8.5;
    
    // Add images to the PDF (coordinate system starts from top-left)
    console.log('Adding back cover to PDF');
    pdf.addImage(
      backCoverData,
      'JPEG',
      bleed, // x-position
      bleed, // y-position
      backCoverWidth, // width
      11 // height
    );

    console.log('Adding spine to PDF');
    pdf.addImage(
      spineData,
      'JPEG',
      backCoverWidth + bleed, // x-position
      bleed, // y-position
      spineWidth, // width
      11 // height
    );

    console.log('Adding front cover to PDF');
    pdf.addImage(
      frontCoverData,
      'JPEG',
      backCoverWidth + spineWidth + bleed, // x-position
      bleed, // y-position
      frontCoverWidth, // width
      11 // height
    );

    // 保存PDF到内存中
    console.log('Saving PDF to memory');
    const pdfArrayBuffer = pdf.output('arraybuffer');
    console.log(`PDF generated successfully, size: ${pdfArrayBuffer.byteLength} bytes`);
    
    // 检查PDF内容是否为空
    if (pdfArrayBuffer.byteLength < 100) {
      throw new Error('Generated PDF appears to be empty or corrupt');
    }
    
    // 转换为base64以便在响应中返回和保存到数据库
    const pdfBase64 = btoa(
      new Uint8Array(pdfArrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const pdfOutput = 'data:application/pdf;base64,' + pdfBase64;
    console.log('PDF conversion to base64 successful, output length:', pdfOutput.length);
    
    // 上传PDF到存储桶
    console.log(`Uploading cover PDF to storage...`);
    const coverFileUrl = await uploadPdfToStorage(pdfOutput, 'cover-full.pdf');
    
    if (!coverFileUrl) {
      throw new Error('Failed to upload cover PDF to storage');
    }
    
    console.log(`Cover PDF uploaded successfully to storage with URL: ${coverFileUrl}`);
    
    // 更新数据库，包含PDF数据和URL
    if (orderId) {
      console.log(`Updating database for order ${orderId} with coverPdf and cover_source_url`);
      const { error: updateError } = await supabase
        .from('funny_biography_books')
        .update({
          cover_pdf: pdfOutput,
          cover_source_url: coverFileUrl
        })
        .eq('order_id', orderId);
      
      if (updateError) {
        console.error(`Error updating database:`, updateError);
      } else {
        console.log(`Database updated successfully with coverPdf and cover_source_url`);
      }
      
      // 检查是否可以将图书设置为准备打印
      const { data: bookData, error: bookError } = await supabase
        .from('funny_biography_books')
        .select('interior_source_url,book_content')
        .eq('order_id', orderId)
        .single();
      
      if (!bookError && bookData) {
        if (bookData.interior_source_url) {
          console.log(`Both cover and interior PDFs available, setting book ready for printing`);
          const pageCount = bookData.book_content ? Math.ceil(bookData.book_content.length / 500) : 100;
          
          const { error: readyError } = await supabase
            .from('funny_biography_books')
            .update({
              ready_for_printing: true,
              page_count: pageCount
            })
            .eq('order_id', orderId);
          
          if (readyError) {
            console.error(`Error setting book ready for printing:`, readyError);
          } else {
            console.log(`Book marked as ready for printing with ${pageCount} pages`);
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfOutput: pdfOutput.substring(0, 100) + '...',  // Just show a small preview in the response
        coverSourceUrl: coverFileUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating cover PDF:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
