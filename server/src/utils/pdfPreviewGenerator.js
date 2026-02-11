/**
 * Automatic PDF Preview Generator (Industry Standard)
 * 
 * Seller uploads ONLY ONE FILE → System automatically:
 * 1. Detects page count
 * 2. Generates watermarked preview PDF with real first pages
 * 3. Appends locked placeholder pages
 * 4. Uploads preview to Cloudinary
 * 
 * Preview Rules:
 * - 1 page → show 1 page
 * - ≥2 pages → show first 2 pages
 * - Add 2-3 locked pages after real content
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
function createLockedPage(pdfDoc, font, pageNumber) {
  // Standard A4 size in points (595 x 842)
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  
  // Background - light gray
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(0.95, 0.95, 0.95),
  });
  
  // Lock indicator (WinAnsi-safe text instead of emoji)
  const lockText = "LOCKED";
  const lockTextWidth = font.widthOfTextAtSize(lockText, 40);
  page.drawText(lockText, {
    x: width / 2 - lockTextWidth / 2,
    y: height / 2 + 60,
    size: 40,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Main message
  const mainText = "Content Locked";
  const mainTextWidth = font.widthOfTextAtSize(mainText, 32);
  page.drawText(mainText, {
    x: width / 2 - mainTextWidth / 2,
    y: height / 2 - 20,
    size: 32,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Sub message
  const subText = "Purchase to unlock full content";
  const subTextWidth = font.widthOfTextAtSize(subText, 18);
  page.drawText(subText, {
    x: width / 2 - subTextWidth / 2,
    y: height / 2 - 60,
    size: 18,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Page indicator
  const pageText = `Page ${pageNumber}`;
  const pageTextWidth = font.widthOfTextAtSize(pageText, 14);
  page.drawText(pageText, {
    x: width / 2 - pageTextWidth / 2,
    y: height / 2 - 100,
    size: 14,
    font: font,
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

    console.log(`📋 Will show ${previewPageCount} preview page(s)`);

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

    // Add watermarks to each page
    const pages = previewPdf.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Diagonal watermark
      page.drawText("PREVIEW ONLY", {
        x: width / 4,
        y: height / 2,
        size: 50,
        font,
        color: rgb(0.85, 0.85, 0.85),
        rotate: degrees(45),
      });

      // Bottom text
      page.drawText("Purchase to unlock full content", {
        x: 50,
        y: 30,
        size: 12,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      console.log(`✅ Watermarked page ${i + 1}`);
    }

    // Add locked pages
    const lockedPagesCount = Math.min(3, Math.max(1, totalPages - previewPageCount));

    for (let i = 0; i < lockedPagesCount; i++) {
      const page = previewPdf.addPage([595, 842]);

      page.drawText("LOCKED", {
        x: 230,
        y: 500,
        size: 40,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText("Purchase to unlock full content", {
        x: 160,
        y: 460,
        size: 16,
        font,
      });

      console.log(`✅ Added locked page ${i + 1}`);
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
      console.log(`✅ Preview PDF validation successful (${testPdf.getPageCount()} pages)`);
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
