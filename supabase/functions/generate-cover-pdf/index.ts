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
    const { frontCover, spine, backCover, orderId, binding_type, format } = await req.json();
    
    // 支持两种参数名称，优先使用 binding_type，如果不存在则使用 format，都不存在则默认为 'softcover'
    const bindingType = binding_type || format || 'softcover';

    console.log('Received request for PDF generation with order ID:', orderId, 'binding type:', bindingType);
    
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
          console.log('Image is already in data URI format - using directly');
          return imageUrl;
        }

        console.log(`Fetching image from URL: ${imageUrl}`);
        const response = await fetch(imageUrl, {
          headers: {
            'Accept': 'image/*,application/pdf',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`);
        }
        
        // 获取内容类型
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        console.log(`Content type of fetched image: ${contentType}`);
        
        // 获取图片数据
        const arrayBuffer = await response.arrayBuffer();
        const base64String = btoa(
          new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        return `data:${contentType};base64,${base64String}`;
      } catch (error) {
        console.error(`Error downloading image from ${imageUrl.substring(0, 50)}...:`, error);
        throw error;
      }
    }

    // 将PDF上传到存储桶并返回公共URL
    async function uploadPdfToStorage(pdfData: string, fileName: string): Promise<string> {
      try {
        console.log(`Uploading ${fileName} to storage...`);
        
        // 检查存储桶是否存在
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
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
        const base64Data = pdfData.split(',')[1];
        
        // 将base64转换为Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
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
          const errorText = uploadError.message;
          throw new Error(`Failed to upload PDF: ${errorText}`);
        }
        
        console.log(`PDF uploaded successfully to storage`);
        
        // 获取公共URL
        const { data: urlData } = supabase
          .storage
          .from('book-covers')
          .getPublicUrl(filePath);
        
        const publicUrl = urlData?.publicUrl || '';
        console.log(`Generated URL: ${publicUrl}`);
        
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
    console.log('Front cover processed successfully');
    
    const spineData = await getImageFromUrl(spine);
    console.log('Spine processed successfully');
    
    const backCoverData = await getImageFromUrl(backCover);
    console.log('Back cover processed successfully');
    
    console.log('All images downloaded and processed successfully');

    // 根据装订类型设置不同的尺寸
    let pdfWidth, pdfHeight, bookWidth, bookHeight;
    
    if (bindingType === 'hardcover') {
      // 精装本尺寸 (基于图片中显示的尺寸)
      pdfWidth = 14.0;
      pdfHeight = 10.75;
      bookWidth = 6.125;
      bookHeight = 9.25;
      console.log('Using hardcover dimensions: 14" x 10.75"');
    } else {
      // 平装本尺寸 (原始尺寸)
      pdfWidth = 12.38;
      pdfHeight = 9.25;
      bookWidth = 6.0;
      bookHeight = 9.0;
      console.log('Using softcover dimensions: 12.38" x 9.25"');
    }

    // Create a new PDF with appropriate dimensions
    console.log('Creating PDF document');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [pdfWidth, pdfHeight] // Width x Height with bleed areas
    });

    // Calculate positions and dimensions
    const bleed = 0.125; // Bleed area: 0.125"
    const safetyMargin = 0.5; // Safety margin: 0.5"
    const frontCoverWidth = bookWidth; // 使用根据装订类型设置的宽度
    const spineWidth = bindingType === 'hardcover' 
      ? Math.max(0.25, 32 * 0.0035) // 精装本最小书脊宽度为 0.25"
      : Math.max(0.1321, 32 * 0.0035); // 平装本最小书脊宽度为 0.1321"
    const backCoverWidth = frontCoverWidth; // Same as front cover
    
    // Total width check
    const totalWidth = frontCoverWidth + spineWidth + backCoverWidth + (bleed * 2);
    console.log(`Total calculated width: ${totalWidth}", PDF width: ${pdfWidth}"`);
    
    // Debug lines flag - set to true to show safety margins and trim lines
    const debugLines = true;
    
    // Add images to the PDF (coordinate system starts from top-left)
    // Starting position accounts for bleed area
    console.log('Adding back cover to PDF');
    pdf.addImage(
      backCoverData,
      'JPEG',
      bleed, // x-position starts after left bleed
      bleed, // y-position starts after top bleed
      backCoverWidth, // width
      bookHeight // height
    );

    console.log('Adding spine to PDF');
    pdf.addImage(
      spineData,
      'JPEG',
      backCoverWidth + bleed, // x-position after back cover
      bleed, // y-position
      spineWidth, // width based on page count
      bookHeight // height
    );

    console.log('Adding front cover to PDF');
    pdf.addImage(
      frontCoverData,
      'JPEG',
      backCoverWidth + spineWidth + bleed, // x-position after spine
      bleed, // y-position
      frontCoverWidth, // width
      bookHeight // height
    );
    
    // Draw debug lines when enabled
    if (debugLines) {
      console.log('Adding debug lines to PDF');
      
      // Blue outer bleed area rectangle (total document size)
      pdf.setDrawColor(0, 162, 232); // Light blue for bleed area
      pdf.setLineWidth(0.01);
      pdf.rect(0, 0, pdfWidth, pdfHeight);
      
      // Dark blue trim rectangles (actual book size after cutting)
      pdf.setDrawColor(0, 0, 255); // Blue for trim lines
      
      // Back cover trim
      pdf.rect(bleed, bleed, backCoverWidth, bookHeight);
      
      // Spine trim
      pdf.rect(backCoverWidth + bleed, bleed, spineWidth, bookHeight);
      
      // Front cover trim
      pdf.rect(backCoverWidth + spineWidth + bleed, bleed, frontCoverWidth, bookHeight);
      
      // Red safety margin rectangles
      pdf.setDrawColor(255, 0, 0); // Red for safety margin
      
      // Back cover safety margin
      pdf.rect(
        bleed + safetyMargin, 
        bleed + safetyMargin, 
        backCoverWidth - (safetyMargin * 2), 
        bookHeight - (safetyMargin * 2)
      );
      
      // Front cover safety margin
      pdf.rect(
        backCoverWidth + spineWidth + bleed + safetyMargin,
        bleed + safetyMargin,
        frontCoverWidth - (safetyMargin * 2),
        bookHeight - (safetyMargin * 2)
      );
      
      // Add text labels
      pdf.setFontSize(6);
      pdf.setTextColor(0, 162, 232);
      
      // Top and bottom trim/bleed labels
      pdf.text('TRIM / BLEED AREA', totalWidth/2, 0.1, { align: 'center' });
      pdf.text('TRIM / BLEED AREA', totalWidth/2, bookHeight + (bleed * 2) - 0.05, { align: 'center' });
      
      // Safety margin labels
      pdf.setTextColor(100, 100, 100);
      pdf.text('SAFETY MARGIN', totalWidth/2, 0.25 + bleed, { align: 'center' });
      pdf.text('SAFETY MARGIN', totalWidth/2, bookHeight + bleed - 0.25, { align: 'center' });
      
      // Spine label
      pdf.setTextColor(0, 0, 255);
      pdf.text('SPINE', backCoverWidth + bleed + (spineWidth/2), bookHeight/2, { angle: 90, align: 'center' });
      
      // Cover labels
      pdf.text('BACK COVER', bleed + (backCoverWidth/2), bleed - 0.1, { align: 'center' });
      pdf.text('FRONT COVER', backCoverWidth + spineWidth + bleed + (frontCoverWidth/2), bleed - 0.1, { align: 'center' });
    }

    // Convert PDF to base64
    console.log('Converting PDF to base64');
    const pdfOutput = pdf.output('datauristring');
    console.log('PDF generation successful, output length:', pdfOutput.length);
    
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
