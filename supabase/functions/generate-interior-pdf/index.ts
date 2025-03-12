import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { autoTable } from "https://esm.sh/jspdf-autotable@3.8.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define book chapter structure to match the output from generate-book-content
interface BookChapter {
  chapterNumber: number;
  title: string;
  sections: {
    sectionNumber: number;
    title: string;
    content: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Generating interior PDF for order ${orderId}`);

    // Fetch book data from the database including generated content
    const { data: bookData, error: fetchError } = await fetch(
      `${req.url.split('/generate-interior-pdf')[0]}/get-book-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({ orderId }),
      }
    ).then(res => res.json());

    if (fetchError || !bookData) {
      throw new Error(`Failed to fetch book data: ${fetchError || 'No data returned'}`);
    }

    const { title, author, bookContent } = bookData;
    
    if (!title || !author || !bookContent) {
      throw new Error('Incomplete book data for PDF generation');
    }

    // Create a new PDF - US Trade (6x9 inches) with bleed
    const bleed = 0.125; // 0.125 inches bleed
    const pageWidth = 6 + (bleed * 2);
    const pageHeight = 9 + (bleed * 2);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [pageWidth, pageHeight]
    });

    // Set up safety margins
    const margin = {
      top: 0.5 + bleed,
      right: 0.5 + bleed,
      bottom: 0.5 + bleed,
      left: 0.5 + bleed
    };

    // Set up font to ensure embedding
    pdf.setFont('Helvetica', 'normal');
    
    // Function to add a page with proper margins and bleed
    const addPage = () => {
      pdf.addPage([pageWidth, pageHeight]);
    };

    // Add title page
    pdf.setFontSize(24);
    pdf.text(title, pageWidth / 2, pageHeight / 3, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text(`by ${author}`, pageWidth / 2, pageHeight / 3 + 0.5, { align: 'center' });

    // Add copyright page
    addPage();
    pdf.setFontSize(10);
    const year = new Date().getFullYear();
    pdf.text(`Copyright © ${year} by ${author}`, margin.left, margin.top + 1);
    pdf.text('All rights reserved.', margin.left, margin.top + 1.3);
    pdf.text('This is a work of fiction. Names, characters, places, and incidents either are the', margin.left, margin.top + 2);
    pdf.text('product of the author\'s imagination or are used fictitiously.', margin.left, margin.top + 2.3);

    // Add table of contents page
    addPage();
    pdf.setFontSize(18);
    pdf.text('Table of Contents', pageWidth / 2, margin.top + 0.5, { align: 'center' });
    
    pdf.setFontSize(12);
    let tocY = margin.top + 1.2;
    
    // Keeping track of current page number for TOC
    let currentPage = 4; // Starting page for content (after title, copyright, TOC)
    
    bookContent.forEach((chapter: BookChapter) => {
      pdf.text(`Chapter ${chapter.chapterNumber}: ${chapter.title}`, margin.left, tocY);
      pdf.text(`${currentPage}`, pageWidth - margin.right, tocY, { align: 'right' });
      tocY += 0.3;
      
      // Each chapter will have at least one page, plus we estimate one page per 500 words
      // This is just an estimate for TOC page numbers
      const estimatedSectionPages = chapter.sections.reduce((total, section) => {
        const wordCount = section.content.split(/\s+/).length;
        return total + Math.ceil(wordCount / 500);
      }, 0);
      
      currentPage += Math.max(1, estimatedSectionPages);
    });

    // Add blank page if needed to make content start on right-hand page
    if (currentPage % 2 !== 0) {
      addPage(); // Add blank page
      currentPage++;
    }

    // Process and add chapter content
    bookContent.forEach((chapter: BookChapter) => {
      // Start each chapter on a new page
      addPage();
      
      // Chapter title
      pdf.setFontSize(18);
      pdf.text(`Chapter ${chapter.chapterNumber}`, pageWidth / 2, margin.top + 0.5, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(chapter.title, pageWidth / 2, margin.top + 1, { align: 'center' });
      
      let contentY = margin.top + 1.5;
      
      // Process chapter sections
      chapter.sections.forEach((section) => {
        // Add section title
        pdf.setFontSize(14);
        pdf.text(section.title, margin.left, contentY);
        contentY += 0.4;
        
        // Process section content with word wrapping
        pdf.setFontSize(12);
        
        // Split content into paragraphs
        const paragraphs = section.content.split('\n\n');
        
        paragraphs.forEach((paragraph) => {
          // Check if we need a new page
          if (contentY > pageHeight - margin.bottom) {
            addPage();
            contentY = margin.top;
          }
          
          // Create wrapped text
          const textLines = pdf.splitTextToSize(paragraph, pageWidth - margin.left - margin.right);
          
          // Add text to PDF
          pdf.text(textLines, margin.left, contentY);
          
          // Move Y position down based on text height
          contentY += (textLines.length * 0.2) + 0.2; // 0.2 inch line height + paragraph spacing
        });
      });
    });

    // Convert PDF to base64
    const pdfOutput = pdf.output('datauristring');
    
    // Update the database with the PDF URL
    const { error: updateError } = await fetch(
      `${req.url.split('/generate-interior-pdf')[0]}/update-book-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          orderId,
          interiorPdf: pdfOutput,
        }),
      }
    ).then(res => res.json());

    if (updateError) {
      throw new Error(`Failed to update book data with PDF: ${updateError}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Interior PDF generated successfully',
        pdfData: pdfOutput
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating interior PDF:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
