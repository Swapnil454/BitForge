/**
 * Automatic PDF Preview Generator (Industry Standard)
 * 
 * Seller uploads ONLY ONE FILE → System automatically:
 * 1. Detects page count
 * 2. Generates watermarked preview PDF with real first pages
 * 3. Appends locked placeholder pages to make exactly 5 pages total
 * 4. Uploads preview to Cloudinary
 * 
 * Preview Rules:
 * - 1-11 pages → show 1 real page + 4 locked
 * - 12-25 pages → show 2 real pages + 3 locked
 * - 26-50 pages → show 3 real pages + 2 locked
 * - 51+ pages → show 4 real pages + 1 locked
 * - ALWAYS generates exactly 5 pages total
 */

import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import cloudinary from "../config/cloudinary.js";

/**
 * Create a locked page placeholder
 * @param {PDFDocument} pdfDoc - PDF document object
 * @param {PDFFont} font - Embedded font
 * @param {number} pageNumber - Page number to display
 * @returns {PDFPage} Created page
 */
// function createLockedPage(pdfDoc, font, pageNumber) {
//   // Standard A4 size in points (595 x 842)
//   const page = pdfDoc.addPage([595, 842]);
//   const { width, height } = page.getSize();
  
//   // Background - light gray
//   page.drawRectangle({
//     x: 0,
//     y: 0,
//     width: width,
//     height: height,
//     color: rgb(0.95, 0.95, 0.95),
//   });
  
//   // Lock indicator (WinAnsi-safe text instead of emoji)
//   const lockText = "LOCKED";
//   const lockTextWidth = font.widthOfTextAtSize(lockText, 40);
//   page.drawText(lockText, {
//     x: width / 2 - lockTextWidth / 2,
//     y: height / 2 + 60,
//     size: 40,
//     font: font,
//     color: rgb(0.3, 0.3, 0.3),
//   });
  
//   // Main message
//   const mainText = "Content Locked";
//   const mainTextWidth = font.widthOfTextAtSize(mainText, 32);
//   page.drawText(mainText, {
//     x: width / 2 - mainTextWidth / 2,
//     y: height / 2 - 20,
//     size: 32,
//     font: font,
//     color: rgb(0.2, 0.2, 0.2),
//   });
  
//   // Sub message
//   const subText = "Purchase to unlock full content";
//   const subTextWidth = font.widthOfTextAtSize(subText, 18);
//   page.drawText(subText, {
//     x: width / 2 - subTextWidth / 2,
//     y: height / 2 - 60,
//     size: 18,
//     font: font,
//     color: rgb(0.4, 0.4, 0.4),
//   });
  
//   // Page indicator
//   const pageText = `Page ${pageNumber}`;
//   const pageTextWidth = font.widthOfTextAtSize(pageText, 14);
//   page.drawText(pageText, {
//     x: width / 2 - pageTextWidth / 2,
//     y: height / 2 - 100,
//     size: 14,
//     font: font,
//     color: rgb(0.5, 0.5, 0.5),
//   });
  
//   return page;
// }

function createPremiumLockedPage(pdfDoc, font, pageNumber, totalPages) {
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  /* ----------------------------
     1️⃣ Subtle Gradient Background
  -----------------------------*/
  for (let i = 0; i < 25; i++) {
    page.drawRectangle({
      x: 0,
      y: (height / 25) * i,
      width: width,
      height: height / 25,
      color: rgb(0.98 - i * 0.01, 0.98 - i * 0.01, 1),
    });
  }

  /* ----------------------------
     2️⃣ Blurred Content Teaser Strip
  -----------------------------*/
  page.drawRectangle({
    x: 60,
    y: height - 240,
    width: width - 120,
    height: 140,
    color: rgb(0.93, 0.93, 0.93),
  });

  for (let i = 0; i < 7; i++) {
    page.drawRectangle({
      x: 90,
      y: height - 210 + i * 18,
      width: width - 180 - Math.random() * 80,
      height: 10,
      color: rgb(0.85, 0.85, 0.85),
    });
  }

  /* ----------------------------
     3️⃣ Premium Conversion Card
  -----------------------------*/
  page.drawRectangle({
    x: 90,
    y: height / 2 - 130,
    width: width - 180,
    height: 240,
    color: rgb(1, 1, 1),
  });

  page.drawText("Continue Reading?", {
    x: 170,
    y: height / 2 + 70,
    size: 28,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText("You're viewing a limited preview.", {
    x: 150,
    y: height / 2 + 35,
    size: 16,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(`Unlock all ${totalPages} pages instantly.`, {
    x: 150,
    y: height / 2 + 5,
    size: 16,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText("✔ Full explanations", {
    x: 170,
    y: height / 2 - 30,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText("✔ Practical examples", {
    x: 170,
    y: height / 2 - 50,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText("✔ Lifetime access after purchase", {
    x: 170,
    y: height / 2 - 70,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText("Secure Download • Instant Access", {
    x: 150,
    y: height / 2 - 100,
    size: 12,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });

  /* ----------------------------
     4️⃣ Page Indicator
  -----------------------------*/
  page.drawText(`Page ${pageNumber} of 5`, {
    x: width / 2 - 40,
    y: 40,
    size: 12,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return page;
}


/**
 * MAIN FUNCTION: Generate watermarked preview PDF automatically
 * 
 * @param {Buffer} originalPdfBuffer - Original full PDF buffer
 * @param {string} productId - Product ID for file naming
 * @returns {Promise<Object>} Preview PDF data and metadata
 */
export async function generateAutomaticPreviewPDF(originalPdfBuffer, productId) {
  try {
    console.log("🔍 Starting automatic PDF preview generation...");
    console.log("📦 Original PDF size:", originalPdfBuffer.length, "bytes");

    // Load original PDF
    const originalPdf = await PDFDocument.load(originalPdfBuffer);
    const totalPages = originalPdf.getPageCount();

    console.log(`📄 PDF has ${totalPages} total pages`);

    // Determine preview page count based on total pages
    let previewPageCount;
    if (totalPages >= 1 && totalPages <= 11) {
      previewPageCount = 1;
    } else if (totalPages >= 12 && totalPages <= 25) {
      previewPageCount = 2;
    } else if (totalPages >= 26 && totalPages <= 50) {
      previewPageCount = 3;
    } else {
      // 51+ pages
      previewPageCount = 4;
    }

    // ALWAYS generate exactly 5 pages total
    const TOTAL_PREVIEW_PAGES = 5;
    const lockedPagesCount = TOTAL_PREVIEW_PAGES - previewPageCount;

    console.log(`📋 Will show ${previewPageCount} real page(s) + ${lockedPagesCount} locked page(s) = ${TOTAL_PREVIEW_PAGES} total`);

    // Create NEW preview PDF
    const previewPdf = await PDFDocument.create();

    // Copy pages one at a time with explicit options
    for (let i = 0; i < previewPageCount; i++) {
      const [copiedPage] = await previewPdf.copyPages(originalPdf, [i]);
      previewPdf.addPage(copiedPage);
      console.log(`✅ Copied page ${i + 1}`);
    }

    // Embed font
    const font = await previewPdf.embedFont(StandardFonts.Helvetica);

    // Add simple, clean watermarks to preview pages
    const pages = previewPdf.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Simple diagonal watermark
      page.drawText("PREVIEW", {
        x: width / 3,
        y: height / 2,
        size: 60,
        font,
        color: rgb(0.9, 0.9, 0.9),
        rotate: degrees(45),
      });

      // Bottom text - subtle CTA
      page.drawText("Preview Only - Purchase to unlock full content", {
        x: 50,
        y: 20,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });

      console.log(`✅ Watermarked page ${i + 1}`);
    }

    // Add clean locked pages - focus on clarity and value
    console.log(`🔒 Adding ${lockedPagesCount} locked pages...`);
    
    for (let i = 0; i < lockedPagesCount; i++) {
      const pageNumber = previewPageCount + i + 1;
      const page = previewPdf.addPage([595, 842]);
      const { width, height } = page.getSize();

      // Simple light background
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(0.97, 0.97, 0.97),
      });

      // White content card - clean and simple
      page.drawRectangle({
        x: 100,
        y: height / 2 - 120,
        width: width - 200,
        height: 240,
        color: rgb(1, 1, 1),
      });

      // Main message - clear and centered
      const mainText = "Content continues...";
      const mainWidth = font.widthOfTextAtSize(mainText, 22);
      page.drawText(mainText, {
        x: width / 2 - mainWidth / 2,
        y: height / 2 + 60,
        size: 22,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Total pages - show value
      const pagesText = `This document has ${totalPages} pages total`;
      const pagesWidth = font.widthOfTextAtSize(pagesText, 14);
      page.drawText(pagesText, {
        x: width / 2 - pagesWidth / 2,
        y: height / 2 + 20,
        size: 14,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Purchase message - subtle, not aggressive
      const unlockText = "Purchase to access the complete content";
      const unlockWidth = font.widthOfTextAtSize(unlockText, 13);
      page.drawText(unlockText, {
        x: width / 2 - unlockWidth / 2,
        y: height / 2 - 20,
        size: 13,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Simple value props - no heavy sales pitch
      const valueProps = [
        "Instant download after payment",
        "Lifetime access to content",
        "Secure transaction"
      ];

      valueProps.forEach((prop, idx) => {
        const propWidth = font.widthOfTextAtSize(prop, 11);
        page.drawText(prop, {
          x: width / 2 - propWidth / 2,
          y: height / 2 - 60 - (idx * 20),
          size: 11,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      });

      // Page number - subtle
      page.drawText(`Page ${pageNumber} of ${TOTAL_PREVIEW_PAGES}`, {
        x: width / 2 - 40,
        y: 40,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });

      console.log(`✅ Added locked page ${pageNumber}`);
    }

    // Save with compatibility options
    console.log("💾 Saving preview PDF...");
    const previewBytes = await previewPdf.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });

    const previewBuffer = Buffer.from(previewBytes);

    console.log(`💾 Preview size: ${previewBuffer.length} bytes`);

    // Validate the generated PDF
    try {
      const testPdf = await PDFDocument.load(previewBuffer);
      const generatedPageCount = testPdf.getPageCount();
      console.log(`✅ Preview PDF validation successful - Generated ${generatedPageCount} pages (${previewPageCount} real + ${lockedPagesCount} locked)`);
      
      if (generatedPageCount !== TOTAL_PREVIEW_PAGES) {
        console.warn(`⚠️ Expected ${TOTAL_PREVIEW_PAGES} pages but got ${generatedPageCount}`);
      }
    } catch (validationError) {
      console.error("❌ Generated PDF is invalid:", validationError.message);
      throw new Error("Generated preview PDF is corrupted");
    }

    // Upload to Cloudinary
    const uploadResult = await uploadPreviewToCloudinary(
      previewBuffer,
      productId
    );

    return {
      success: true,
      totalPages,
      previewPages: previewPageCount,
      lockedPages: lockedPagesCount,
      totalPreviewPages: TOTAL_PREVIEW_PAGES,
      previewPdfUrl: uploadResult.secure_url,
      previewPdfKey: uploadResult.public_id,
    };
  } catch (error) {
    console.error("❌ Preview generation failed:", error);
    throw error;
  }
}

/**
 * Upload preview PDF to Cloudinary
 * Upload with proper public access settings
 */
async function uploadPreviewToCloudinary(previewBuffer, productId) {
  // Extract just the filename from productId (remove folder paths)
  const baseFileName = productId.split('/').pop() || productId;
  const timestamp = Date.now();
  const publicId = `preview_${baseFileName}_${timestamp}`; // NO .pdf extension
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",  // ✅ Use "image" for PDFs (industry standard)
        format: "pdf",           // ✅ Explicitly set format
        folder: "sellify/previews",
        public_id: publicId,
        type: "upload",
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log("✅ Preview uploaded to Cloudinary");
          console.log("📋 Public ID:", result.public_id);
          console.log("📋 Secure URL:", result.secure_url);
          console.log("📋 Format:", result.format);
          
          resolve(result);
        }
      }
    );
    
    uploadStream.end(previewBuffer);
  });
}

/**
 * Generate preview page images (for gallery/thumbnail view)
 * This generates JPG images from the preview PDF pages
 * 
 * @param {string} previewPdfKey - Cloudinary public_id of preview PDF
 * @param {number} pageCount - Number of pages to generate
 * @returns {Array} Array of preview page objects
 */
export function generatePreviewPageImages(previewPdfKey, pageCount) {
  const previewPages = [];
  
  for (let i = 1; i <= pageCount; i++) {
    // Generate Cloudinary transformation URL for each page
    const imageUrl = cloudinary.url(previewPdfKey, {
      resource_type: "image",
      page: i - 1, // 0-based indexing
      format: "jpg",
      quality: "auto:good",
      transformation: [
        { width: 800, crop: "limit" },
        // Optional: Add slight blur to image previews
        // { effect: "blur:100" },
      ],
    });
    
    previewPages.push({
      pageNumber: i,
      imageUrl: imageUrl,
      imageKey: `${previewPdfKey}_page_${i}`,
    });
  }
  
  return previewPages;
}

/**
 * Validate that uploaded file is a valid PDF
 */
export function validatePDF(fileBuffer, mimetype) {
  if (!mimetype.includes("pdf")) {
    throw new Error("File must be a PDF");
  }
  
  // Check PDF magic number (header)
  const header = fileBuffer.slice(0, 5).toString();
  if (!header.startsWith("%PDF-")) {
    throw new Error("Invalid PDF file format");
  }
  
  return true;
}
