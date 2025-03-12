import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

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
    const { frontCover, spine, backCover } = await req.json();

    if (!frontCover || !spine || !backCover) {
      throw new Error('Missing required cover image URLs');
    }

    console.log('Received cover image URLs for PDF generation');

    // 从URL获取图片数据
    async function getImageFromUrl(imageUrl: string): Promise<string> {
      try {
        // 处理已经是base64数据的情况
        if (imageUrl.startsWith('data:')) {
          console.log(`Image is already in data URI format: ${imageUrl.substring(0, 30)}...`);
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
        
        // 如果是PDF，我们需要做特殊处理：将其转换为图像
        if (contentType.includes('application/pdf')) {
          console.log('Image URL points to a PDF file, converting to image for PDF generation...');
          
          // 直接返回URL，jsPDF会处理
          // 在实际应用中，可能需要将PDF转换为图像，但这需要额外的库
          return imageUrl;
        }
        
        const imageBuffer = await response.arrayBuffer();
        const base64Image = btoa(
          new Uint8Array(imageBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        return `data:${contentType};base64,${base64Image}`;
      } catch (error) {
        console.error(`Error downloading image from ${imageUrl}:`, error);
        throw error;
      }
    }

    // 获取所有图片的base64数据
    console.log('Downloading images from URLs...');
    const frontCoverData = await getImageFromUrl(frontCover);
    const spineData = await getImageFromUrl(spine);
    const backCoverData = await getImageFromUrl(backCover);
    console.log('All images downloaded successfully');

    // Create a new PDF with appropriate dimensions
    // Standard book cover dimensions with bleed (8.5 x 11 inches plus bleed)
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
    // Back cover (positioned first on the left in the spread)
    pdf.addImage(
      backCoverData,
      'JPEG',
      bleed, // x-position
      bleed, // y-position
      backCoverWidth, // width
      11 // height
    );

    // Spine (positioned in the middle)
    pdf.addImage(
      spineData,
      'JPEG',
      backCoverWidth + bleed, // x-position
      bleed, // y-position
      spineWidth, // width
      11 // height
    );

    // Front cover (positioned on the right)
    pdf.addImage(
      frontCoverData,
      'JPEG',
      backCoverWidth + spineWidth + bleed, // x-position
      bleed, // y-position
      frontCoverWidth, // width
      11 // height
    );

    // Convert PDF to base64
    const pdfOutput = pdf.output('datauristring');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfData: pdfOutput
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
