import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createCanvas } from 'canvas';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// For Vercel environment
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { userData, bookData } = req.body;

    if (!userData || !bookData) {
      return res.status(400).json({ error: 'Missing required book data' });
    }

    // Extract book information from the request
    const { 
      userAnswers, 
      author, 
      idea: title, 
      tableOfContent 
    } = userData;

    console.log('Starting book generation process');
    console.log('Book title:', title);
    console.log('Author:', author);

    // Generate book content
    const bookContent = await generateBookContent(userData, bookData);
    
    // Create interior PDF
    const interiorPdfPath = await createInteriorPdf(bookContent, title, author);
    
    // Create cover PDF
    const coverPdfPath = await createCoverPdf(title, author, bookContent.summary);
    
    // Upload PDFs to a temporary storage service to get URLs
    // (In a production environment, you would upload to S3, Azure Blob, etc.)
    const interiorUrl = await uploadPdfToStorage(interiorPdfPath);
    const coverUrl = await uploadPdfToStorage(coverPdfPath);
    
    // Submit to Lulupress API
    const printJobResult = await submitToLulupress(
      title, 
      interiorUrl, 
      coverUrl, 
      bookData.shippingAddress
    );
    
    // Clean up temporary files
    await Promise.all([
      fs.unlink(interiorPdfPath),
      fs.unlink(coverPdfPath)
    ]);

    return res.status(200).json({ 
      success: true, 
      message: 'Book generated and submitted for printing',
      printJobId: printJobResult.external_id
    });
  } catch (error) {
    console.error('Error generating book:', error);
    return res.status(500).json({ error: 'Failed to generate book', details: error.message });
  }
}

/**
 * Generate book content with 20 chapters, 4 sections per chapter
 */
async function generateBookContent(userData, bookData) {
  const { userAnswers, tableOfContent } = userData;
  
  // In a real application, you might use an AI service to generate content
  // based on user answers and table of contents
  const chapters = [];
  
  for (let i = 0; i < 20; i++) {
    const chapterTitle = tableOfContent[i] || `Chapter ${i + 1}`;
    const sections = [];
    
    for (let j = 0; j < 4; j++) {
      sections.push({
        title: `Section ${j + 1}`,
        content: `Content for section ${j + 1} of chapter ${i + 1}, based on user answers: ${JSON.stringify(userAnswers).substring(0, 50)}...`
      });
    }
    
    chapters.push({
      title: chapterTitle,
      sections
    });
  }
  
  // Generate a summary for the back cover
  const summary = `A delightful biography about ${userData.idea}, written by ${userData.author}.`;
  
  return {
    title: userData.idea,
    author: userData.author,
    chapters,
    summary
  };
}

/**
 * Create interior PDF according to Lulupress requirements
 */
async function createInteriorPdf(bookContent, title, author) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  // Define page dimensions (US Trade 6x9 inches with bleed)
  // 6x9 inches = 432x648 points
  // Adding 0.125 inch bleed = +9 points each side
  const pageWidth = 450; // 432 + (9 * 2)
  const pageHeight = 666; // 648 + (9 * 2)
  
  // Add title page
  const titlePage = pdfDoc.addPage([pageWidth, pageHeight]);
  titlePage.drawText(title, {
    x: 225,
    y: 400,
    size: 24,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: 350,
    align: 'center'
  });
  
  titlePage.drawText(`by ${author}`, {
    x: 225,
    y: 350,
    size: 18,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
    maxWidth: 350,
    align: 'center'
  });
  
  // Add copyright page
  const copyrightPage = pdfDoc.addPage([pageWidth, pageHeight]);
  const currentYear = new Date().getFullYear();
  copyrightPage.drawText(`Copyright © ${currentYear} ${author}`, {
    x: 72,
    y: 500,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0)
  });
  
  copyrightPage.drawText('All rights reserved.', {
    x: 72,
    y: 480,
    size: 12,
    font: timesRomanFont,
    color: rgb(0, 0, 0)
  });
  
  // Add table of contents
  const tocPage = pdfDoc.addPage([pageWidth, pageHeight]);
  tocPage.drawText('Table of Contents', {
    x: 225,
    y: 600,
    size: 18,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
    align: 'center'
  });
  
  let yPosition = 550;
  bookContent.chapters.forEach((chapter, index) => {
    tocPage.drawText(`${chapter.title}`, {
      x: 72,
      y: yPosition,
      size: 12,
      font: timesRomanFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;
    
    if (yPosition < 72) {
      const newTocPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = 600;
    }
  });
  
  // Add chapter pages
  bookContent.chapters.forEach((chapter, chapterIndex) => {
    // Chapter title page
    const chapterPage = pdfDoc.addPage([pageWidth, pageHeight]);
    chapterPage.drawText(chapter.title, {
      x: 225,
      y: 500,
      size: 18,
      font: timesBoldFont,
      color: rgb(0, 0, 0),
      maxWidth: 350,
      align: 'center'
    });
    
    // Sections content
    chapter.sections.forEach((section, sectionIndex) => {
      const sectionPage = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Section title
      sectionPage.drawText(section.title, {
        x: 72,
        y: 600,
        size: 14,
        font: timesBoldFont,
        color: rgb(0, 0, 0)
      });
      
      // Section content
      const contentLines = splitTextIntoLines(section.content, 60);
      let contentY = 560;
      
      contentLines.forEach(line => {
        sectionPage.drawText(line, {
          x: 72,
          y: contentY,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        });
        contentY -= 16;
        
        if (contentY < 72) {
          const newPage = pdfDoc.addPage([pageWidth, pageHeight]);
          contentY = 600;
        }
      });
    });
  });
  
  // Save PDF to temp file
  const pdfBytes = await pdfDoc.save();
  const tempPath = path.join(os.tmpdir(), `interior-${Date.now()}.pdf`);
  await fs.writeFile(tempPath, pdfBytes);
  
  return tempPath;
}

/**
 * Create cover PDF according to Lulupress requirements
 */
async function createCoverPdf(title, author, summary) {
  // US Trade 6x9 dimensions
  const bookWidth = 6; // inches
  const bookHeight = 9; // inches
  const spineWidth = 0.5; // This will vary based on page count, assuming 0.5 here
  const bleed = 0.125; // inches
  
  // Convert to pixels at 300 DPI
  const dpi = 300;
  const coverWidthPx = Math.ceil((bookWidth * 2 + spineWidth + bleed * 2) * dpi);
  const coverHeightPx = Math.ceil((bookHeight + bleed * 2) * dpi);
  
  // Create canvas for the cover
  const canvas = createCanvas(coverWidthPx, coverHeightPx);
  const ctx = canvas.getContext('2d');
  
  // Fill background with white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, coverWidthPx, coverHeightPx);
  
  // Back cover (left side)
  ctx.fillStyle = '#f0f0f0'; // Light gray background
  ctx.fillRect(bleed * dpi, bleed * dpi, bookWidth * dpi, bookHeight * dpi);
  
  // Spine (middle)
  ctx.fillStyle = '#d0d0d0'; // Medium gray for spine
  ctx.fillRect((bleed + bookWidth) * dpi, bleed * dpi, spineWidth * dpi, bookHeight * dpi);
  
  // Front cover (right side)
  ctx.fillStyle = '#e0e0e0'; // Different gray for front
  ctx.fillRect((bleed + bookWidth + spineWidth) * dpi, bleed * dpi, bookWidth * dpi, bookHeight * dpi);
  
  // Add text to front cover
  ctx.fillStyle = 'black';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  
  // Position text on front cover
  const frontCoverCenterX = (bleed + bookWidth + spineWidth + bookWidth/2) * dpi;
  ctx.fillText(title, frontCoverCenterX, 300, bookWidth * dpi * 0.8);
  
  ctx.font = '40px Arial';
  ctx.fillText(`by ${author}`, frontCoverCenterX, 400, bookWidth * dpi * 0.8);
  
  // Add summary to back cover
  ctx.font = '30px Arial';
  ctx.textAlign = 'left';
  const backCoverX = (bleed + 0.5) * dpi;
  const summaryLines = splitTextIntoLines(summary, 40);
  
  summaryLines.forEach((line, index) => {
    ctx.fillText(line, backCoverX, (bleed + 3 + index * 0.4) * dpi, (bookWidth - 1) * dpi);
  });
  
  // Add spine text
  ctx.save();
  ctx.translate((bleed + bookWidth + spineWidth/2) * dpi, bookHeight * dpi / 2);
  ctx.rotate(-Math.PI/2);
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px Arial';
  ctx.fillText(title, 0, 0, (bookHeight - 1) * dpi);
  ctx.restore();
  
  // Convert canvas to PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([coverWidthPx / dpi * 72, coverHeightPx / dpi * 72]); // Convert to points
  
  // Get canvas as PNG
  const canvasPng = canvas.toBuffer('image/png');
  const pngImage = await pdfDoc.embedPng(canvasPng);
  
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });
  
  // Save PDF to temp file
  const pdfBytes = await pdfDoc.save();
  const tempPath = path.join(os.tmpdir(), `cover-${Date.now()}.pdf`);
  await fs.writeFile(tempPath, pdfBytes);
  
  return tempPath;
}

/**
 * Upload PDF to temporary storage and get URL
 * In production, use a proper storage service like S3
 */
async function uploadPdfToStorage(pdfPath) {
  // This is a placeholder - in a real application, you'd upload to your storage service
  // For demo purposes, we're returning a fake URL
  // In production, implement an actual upload to S3, Azure Blob, etc.
  
  // Read the PDF file
  const pdfBytes = await fs.readFile(pdfPath);
  
  // Example: Upload to a storage service
  // const response = await fetch('https://your-storage-service.com/upload', {
  //   method: 'POST',
  //   body: pdfBytes
  // });
  // const result = await response.json();
  // return result.url;
  
  // For this example, return a fake URL
  return `https://example.com/storage/${path.basename(pdfPath)}`;
}

/**
 * Submit to Lulupress API
 */
async function submitToLulupress(title, interiorUrl, coverUrl, shippingAddress) {
  // Lulupress API credentials
  const clientKey = process.env.LULUPRESS_CLIENT_KEY;
  const clientSecret = process.env.LULUPRESS_CLIENT_SECRET;
  
  if (!clientKey || !clientSecret) {
    throw new Error('Missing Lulupress API credentials');
  }
  
  // Create authentication header
  const authString = Buffer.from(`${clientKey}:${clientSecret}`).toString('base64');
  
  // Create print job request
  const externalId = `order-${Date.now()}`;
  
  const book = {
    external_id: externalId,
    title: title,
    cover_source_url: coverUrl,
    interior_source_url: interiorUrl,
    pod_package_id: "0550X0850BWSTDPB060UW444GXX", // Example value, adjust based on your book specs
    quantity: 1,
  };
  
  const address = {
    name: shippingAddress.name,
    street1: shippingAddress.address.line1,
    street2: shippingAddress.address.line2 || '',
    city: shippingAddress.address.city,
    postcode: shippingAddress.address.postal_code,
    state_code: shippingAddress.address.state,
    country_code: shippingAddress.address.country,
    phone_number: "0000000000", // Example placeholder, should be provided in production
  };
  
  // API request to Lulupress
  // In production, implement this with actual API endpoint
  // const response = await fetch('https://api.lulupress.com/print-jobs', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Basic ${authString}`
  //   },
  //   body: JSON.stringify({
  //     external_id: externalId,
  //     shipping_level: 'GROUND',
  //     shipping_address: address,
  //     books: [book]
  //   })
  // });
  
  // const result = await response.json();
  // return result;
  
  // Return mock response for now
  console.log('Would submit to Lulupress API:', {
    address,
    book,
    shipping_level: 'GROUND'
  });
  
  return { external_id: externalId, status: 'created' };
}

/**
 * Helper function to split text into lines
 */
function splitTextIntoLines(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
} 