/**
 * Preview Generation Utility
 * Generates watermarked, low-res preview images from uploaded files
 * Prevents content leakage while building buyer trust
 */

import cloudinary from "../config/cloudinary.js";
import { createRequire } from "module";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Import CommonJS module pdf-parse
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extract text and metadata from PDF
 * @param {Buffer} fileBuffer - PDF file buffer
 * @returns {Promise<Object>} PDF data including page count and text
 */
async function extractPDFData(fileBuffer) {
  try {
    const data = await pdfParse(fileBuffer);
    return {
      pageCount: data.numpages,
      text: data.text,
      info: data.info
    };
  } catch (error) {
    console.error("PDF parse error:", error);
    return {
      pageCount: 1,
      text: "",
      info: {}
    };
  }
}

/**
 * Generate watermarked preview pages from a PDF file
 * Creates actual page images with blur and watermark overlays
 * 
 * @param {string} fileUrl - Cloudinary URL of the original file
 * @param {string} fileKey - Cloudinary public_id of the file
 * @param {Buffer} fileBuffer - File buffer for local processing
 * @param {number} maxPages - Maximum preview pages (default: 3)
 * @returns {Promise<Array>} Array of preview page objects with URLs
 */
export async function generatePreviewPages(fileUrl, fileKey, fileBuffer, maxPages = 3) {
  try {
    const previews = [];
    
    // For PDF files, generate page previews using Cloudinary transformations
    if (fileKey && (fileUrl.includes('.pdf') || fileUrl.includes('pdf'))) {
      for (let i = 1; i <= maxPages; i++) {
        try {
          // Generate preview URL with transformations:
          // 1. Convert PDF page to image
          // 2. Resize to max 800px width
          // 3. Apply blur effect
          // 4. Add diagonal watermark text overlay
          const previewUrl = cloudinary.url(fileKey, {
            resource_type: "image",
            page: i - 1, // Cloudinary uses 0-based page indexing
            format: "jpg",
            quality: "auto:low",
            transformation: [
              { width: 800, crop: "limit" },
              { effect: "blur:300" }, // Stronger blur
              { 
                overlay: {
                  font_family: "Arial",
                  font_size: 100,
                  font_weight: "bold",
                  text_align: "center",
                  text: "PREVIEW"
                },
                opacity: 25,
                angle: -25,
                color: "white",
                gravity: "center"
              }
            ]
          });
          
          previews.push({
            pageNumber: i,
            imageUrl: previewUrl,
            imageKey: `${fileKey}_preview_page_${i}`
          });
        } catch (pageError) {
          console.warn(`Could not generate preview for page ${i}:`, pageError.message);
          // Continue with other pages even if one fails
        }
      }
    }
    
    return previews;
  } catch (error) {
    console.error("Preview generation error:", error);
    return []; // Return empty array on error, don't block product upload
  }
}

/**
 * Get file metadata (size, page count, etc.)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimetype - File mimetype
 * @returns {Promise<Object>} File metadata
 */
export async function extractFileMetadata(fileBuffer, mimetype) {
  const metadata = {
    fileSizeBytes: fileBuffer.length,
    pageCount: null,
    format: "Other"
  };
  
  try {
    // Determine format from mimetype
    if (mimetype.includes("pdf")) {
      metadata.format = "PDF";
      // Extract real page count from PDF
      const pdfData = await extractPDFData(fileBuffer);
      metadata.pageCount = pdfData.pageCount;
    } else if (mimetype.includes("epub")) {
      metadata.format = "EPUB";
    } else if (mimetype.includes("zip")) {
      metadata.format = "ZIP";
    } else if (mimetype.includes("word") || mimetype.includes("docx")) {
      metadata.format = "DOCX";
    }
    
    return metadata;
  } catch (error) {
    console.error("Metadata extraction error:", error);
    return metadata;
  }
}

/**
 * Perform basic file safety checks
 * In production, this would integrate with actual antivirus service
 */
export async function performBasicFileCheck(fileBuffer, filename) {
  try {
    // Basic checks
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileBuffer.length > maxSize) {
      return {
        passed: false,
        reason: "File too large (max 500MB)"
      };
    }
    
    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (suspiciousExtensions.includes(ext)) {
      return {
        passed: false,
        reason: "Suspicious file extension"
      };
    }
    
    return {
      passed: true,
      scanned: true,
      clean: true,
      scanDate: new Date()
    };
  } catch (error) {
    console.error("File check error:", error);
    return {
      passed: false,
      scanned: false,
      reason: "Security check failed"
    };
  }
}

/**
 * Simulate malware scan
 * In production, integrate with actual antivirus service like:
 * - ClamAV
 * - VirusTotal API
 * - AWS GuardDuty
 * - Cloudinary's built-in security
 */
export async function performMalwareScan(fileBuffer) {
  try {
    // TODO: Integrate real malware scanning service
    // For now, basic checks:
    
    // Check file size (block suspiciously large files)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileBuffer.length > maxSize) {
      return {
        scanned: true,
        clean: false,
        reason: "File too large"
      };
    }
    
    // Check for suspicious patterns in filename/content
    // This is a placeholder - real implementation should use antivirus API
    
    return {
      scanned: true,
      clean: true,
      scanDate: new Date()
    };
  } catch (error) {
    console.error("Malware scan error:", error);
    return {
      scanned: false,
      clean: false,
      reason: "Scan failed"
    };
  }
}

/**
 * Auto-review content based on heuristics
 * Flag suspicious products for manual review
 */
export function autoReviewContent(productData) {
  const flags = [];
  
  // Flag if page count is too low
  if (productData.pageCount && productData.pageCount < 3) {
    flags.push("Low page count");
  }
  
  // Flag if file size is suspiciously small
  if (productData.fileSizeBytes < 10000) { // < 10KB
    flags.push("Suspiciously small file");
  }
  
  // Flag if price is unusually high for file size
  if (productData.price > 1000 && productData.fileSizeBytes < 100000) {
    flags.push("High price for small file");
  }
  
  // If multiple flags, require manual review
  if (flags.length >= 2) {
    return {
      status: "not-reviewed",
      requiresManualReview: true,
      flags
    };
  }
  
  // Otherwise, mark as auto-reviewed
  return {
    status: "auto-reviewed",
    requiresManualReview: false,
    flags
  };
}
