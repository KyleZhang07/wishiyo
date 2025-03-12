
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frontCover, spine, backCover } = await req.json();

    if (!frontCover || !spine || !backCover) {
      throw new Error('Missing required cover images');
    }

    console.log('Received cover images for PDF generation');

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
    if (backCover.startsWith('data:image')) {
      pdf.addImage(
        backCover,
        'JPEG',
        bleed, // x-position
        bleed, // y-position
        backCoverWidth, // width
        11 // height
      );
    }

    // Spine (positioned in the middle)
    if (spine.startsWith('data:image')) {
      pdf.addImage(
        spine,
        'JPEG',
        backCoverWidth + bleed, // x-position
        bleed, // y-position
        spineWidth, // width
        11 // height
      );
    }

    // Front cover (positioned on the right)
    if (frontCover.startsWith('data:image')) {
      pdf.addImage(
        frontCover,
        'JPEG',
        backCoverWidth + spineWidth + bleed, // x-position
        bleed, // y-position
        frontCoverWidth, // width
        11 // height
      );
    }

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
