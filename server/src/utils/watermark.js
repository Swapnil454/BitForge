import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import archiver from "archiver";
import { PassThrough } from "stream";
import unzipper from "unzipper";

/**
 * Add watermark to PDF with buyer information
 * @param {Buffer} pdfBuffer - Original PDF buffer
 * @param {Object} buyerInfo - Buyer details
 * @returns {Promise<Buffer>} - Watermarked PDF buffer
 */
export const watermarkPDF = async (pdfBuffer, buyerInfo) => {
  const { buyerName, buyerEmail, orderId, purchaseDate } = buyerInfo;
  
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const pages = pdfDoc.getPages();
    const watermarkText = `Licensed to: ${buyerName} | ${buyerEmail} | Order: ${orderId} | Date: ${purchaseDate}`;
    
    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Add footer watermark
      page.drawText(watermarkText, {
        x: 10,
        y: 10,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.7,
      });
      
      // Add diagonal watermark across the page (subtle)
      page.drawText(buyerEmail, {
        x: width / 4,
        y: height / 2,
        size: 24,
        font: helveticaFont,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.15,
        rotate: { type: "degrees", angle: 45 },
      });
    }
    
    const watermarkedPdf = await pdfDoc.save();
    return Buffer.from(watermarkedPdf);
  } catch (error) {
    console.error("❌ PDF watermarking failed:", error);
    // Return original if watermarking fails
    return pdfBuffer;
  }
};

/**
 * Generate license text file content
 * @param {Object} buyerInfo - Buyer details
 * @returns {string} - License file content
 */
export const generateLicenseContent = (buyerInfo) => {
  const { buyerName, buyerEmail, orderId, purchaseDate, productName } = buyerInfo;
  
  return `
================================================================================
                           LICENSE AGREEMENT
================================================================================

Product: ${productName}
Licensed To: ${buyerName}
Email: ${buyerEmail}
Order ID: ${orderId}
Purchase Date: ${purchaseDate}

================================================================================
                              TERMS OF USE
================================================================================

This digital product is licensed for PERSONAL USE ONLY.

PERMITTED:
✓ Use for personal projects
✓ Use for your own learning
✓ Make backup copies for yourself

NOT PERMITTED:
✗ Redistribute or share with others
✗ Resell or sublicense
✗ Upload to file sharing sites
✗ Remove or modify this license

================================================================================
                          TRACKING INFORMATION
================================================================================

This file contains embedded tracking information tied to your purchase.
Any unauthorized distribution can be traced back to your account.

If this file is found being distributed illegally, action will be taken
against the account holder.

================================================================================
                           ContentSellify.com
================================================================================
`;
};

/**
 * Add license file to ZIP archive
 * @param {Buffer} zipBuffer - Original ZIP buffer
 * @param {Object} buyerInfo - Buyer details
 * @returns {Promise<Buffer>} - Modified ZIP buffer with license
 */
export const addLicenseToZip = async (zipBuffer, buyerInfo) => {
  return new Promise(async (resolve, reject) => {
    try {
      const licenseContent = generateLicenseContent(buyerInfo);
      
      // Create a new archive
      const archive = archiver("zip", { zlib: { level: 9 } });
      const chunks = [];
      
      const passThrough = new PassThrough();
      archive.pipe(passThrough);
      
      passThrough.on("data", (chunk) => chunks.push(chunk));
      passThrough.on("end", () => resolve(Buffer.concat(chunks)));
      passThrough.on("error", reject);
      
      // Extract original zip and add to new archive
      const directory = await unzipper.Open.buffer(zipBuffer);
      
      for (const file of directory.files) {
        if (file.type === "File") {
          const content = await file.buffer();
          archive.append(content, { name: file.path });
        }
      }
      
      // Add license file
      archive.append(licenseContent, { name: "LICENSE.txt" });
      
      // Add watermark info file
      const watermarkInfo = `This archive is licensed to: ${buyerInfo.buyerEmail}\nOrder: ${buyerInfo.orderId}\nDate: ${buyerInfo.purchaseDate}`;
      archive.append(watermarkInfo, { name: ".watermark" });
      
      await archive.finalize();
    } catch (error) {
      console.error("❌ ZIP license injection failed:", error);
      // Return original if injection fails
      resolve(zipBuffer);
    }
  });
};

/**
 * Detect file type and apply appropriate watermarking
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {Object} buyerInfo - Buyer details
 * @returns {Promise<{ buffer: Buffer, filename: string }>}
 */
export const applyWatermark = async (fileBuffer, filename, buyerInfo) => {
  const lowerFilename = filename.toLowerCase();
  
  // Check file signature for PDF
  const isPDF = fileBuffer[0] === 0x25 && 
                fileBuffer[1] === 0x50 && 
                fileBuffer[2] === 0x44 && 
                fileBuffer[3] === 0x46; // %PDF
  
  // Check file signature for ZIP
  const isZIP = fileBuffer[0] === 0x50 && 
                fileBuffer[1] === 0x4B && 
                (fileBuffer[2] === 0x03 || fileBuffer[2] === 0x05);
  
  if (isPDF || lowerFilename.endsWith(".pdf")) {
    console.log("📄 Applying PDF watermark...");
    const watermarkedBuffer = await watermarkPDF(fileBuffer, buyerInfo);
    return { buffer: watermarkedBuffer, filename };
  }
  
  if (isZIP || lowerFilename.endsWith(".zip")) {
    console.log("📦 Adding license to ZIP...");
    const modifiedBuffer = await addLicenseToZip(fileBuffer, buyerInfo);
    return { buffer: modifiedBuffer, filename };
  }
  
  // For other file types, just return as-is
  console.log("📎 File type not watermarkable, returning original");
  return { buffer: fileBuffer, filename };
};

export default {
  watermarkPDF,
  addLicenseToZip,
  generateLicenseContent,
  applyWatermark,
};
